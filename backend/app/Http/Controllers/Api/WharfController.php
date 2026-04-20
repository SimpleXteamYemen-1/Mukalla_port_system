<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Wharf;
use App\Models\Container;
use App\Models\StorageArea;
use App\Models\AnchorageRequest;
use App\Models\Notification;
use App\Models\User;

class WharfController extends Controller
{
    public function getStorageAreas()
    {
        $areas = StorageArea::all();
        return response()->json([
            'success' => true,
            'areas' => $areas
        ]);
    }

    public function getWharves()
    {
        return response()->json(Wharf::with('vessels')->get());
    }

    public function updateWharfStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:available,occupied,maintenance',
        ]);

        $wharf = Wharf::findOrFail($id);
        $wharf->status = $request->status;
        $wharf->save();

        return response()->json($wharf);
    }

    public function getContainers(Request $request)
    {
        // Only return containers for vessels that have an APPROVED/ASSIGNED anchorage request
        $anchoredVesselIds = AnchorageRequest::whereIn('status', ['approved', 'wharf_assigned', 'completed'])
            ->pluck('vessel_id');

        $containers = Container::whereIn('vessel_id', $anchoredVesselIds)
            ->with('arrivalNotification')
            ->get();
            
        return response()->json($containers);
    }

    public function getDashboardStats()
    {
        $usedCapacity = Container::where('status', 'assigned')->count();

        return response()->json([
            'pending_availability' => AnchorageRequest::where('status', 'pending')->count(),
            'approved_wharves' => Wharf::where('status', 'available')->count(),
            'occupied_wharves' => Wharf::where('status', 'occupied')->count(),
            'storage_used' => $usedCapacity,
            'storage_available' => 1000, // Hardcoded default as capacity is out of scope
            'containers_awaiting' => Container::where('status', 'arrived')->count(),
        ]);
    }

    public function assignContainer(Request $request)
    {
        $request->validate([
            'containerId' => 'required|exists:containers,id',
            'block' => 'required|string|max:10',
            'row' => 'required|integer',
            'tier' => 'required|integer',
        ]);

        $conflict = Container::where('block', $request->block)
            ->where('row', $request->row)
            ->where('tier', $request->tier)
            ->whereNotIn('status', ['discharged', 'cleared'])
            ->exists();

        if ($conflict) {
            return response()->json(['message' => 'This yard location is already occupied'], 400);
        }

        $container = Container::findOrFail($request->containerId);
        $container->status = 'assigned';
        $container->block = $request->block;
        $container->row = $request->row;
        $container->tier = $request->tier;
        $container->save();

        return response()->json(['success' => true, 'container' => $container]);
    }

    public function logContainerOperation(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:load,unload,discharge',
        ]);

        $container = Container::where('id', $id)->firstOrFail();
        if ($request->action === 'load')
            $container->status = 'loaded';
        if ($request->action === 'discharge')
            $container->status = 'discharged';
        $container->save();

        return response()->json(['success' => true, 'container' => $container]);
    }

    // ─── NEW: Anchorage Workflow ────────────────────────────────────────────────

    /**
     * Get all pending anchorage requests for the wharf worker to review.
     */
    public function getAnchorageRequests()
    {
        $requests = AnchorageRequest::with(['vessel', 'wharf'])
            ->whereIn('status', ['pending', 'wharf_assigned', 'waiting'])
            ->latest()
            ->get();

        $wharves = Wharf::all();

        return response()->json([
            'requests' => $requests,
            'wharves' => $wharves,
        ]);
    }

    /**
     * Option A: Assign and approve an anchorage request.
     * - Updates AnchorageRequest status -> wharf_assigned
     * - Marks the selected Wharf -> occupied
     */
    public function approveAnchorageRequest(Request $request, $id)
    {
        $request->validate([
            'wharf_id' => 'required|exists:wharves,id',
        ]);

        $anchorage = AnchorageRequest::with('vessel')->findOrFail($id);
        $wharf = Wharf::findOrFail($request->wharf_id);

        if ($wharf->status !== 'available') {
            return response()->json(['message' => 'Selected wharf is not available'], 422);
        }

        // Update anchorage request
        $anchorage->update([
            'status' => 'wharf_assigned',
            'wharf_id' => $wharf->id,
            'wharf_assigned_at' => now(),
        ]);

        // Sync Vessel mapping
        if ($anchorage->vessel) {
            $anchorage->vessel->current_wharf_id = $wharf->id;
            $anchorage->vessel->save();
        }

        // Mark wharf as occupied
        $wharf->status = 'occupied';
        $wharf->save();

        // Notify the agent
        Notification::create([
            'user_id' => $anchorage->agent_id,
            'title' => 'Wharf Assigned',
            'message' => "Your anchorage request for vessel {$anchorage->vessel->name} has been approved. Wharf {$wharf->name} has been assigned for your docking time.",
        ]);

        return response()->json($anchorage->fresh(['vessel', 'wharf']));
    }

    /**
     * Option B: Waitlist the anchorage request due to zero capacity.
     * - Updates AnchorageRequest status -> waiting
     * - Notifies the agent
     */
    public function waitlistAnchorageRequest(Request $request, $id)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $anchorage = AnchorageRequest::with('vessel')->findOrFail($id);

        $anchorage->update([
            'status' => 'waiting',
            'rejection_reason' => $request->reason ?? 'No wharf capacity available at the requested docking time. Your vessel has been placed on the waitlist.',
        ]);

        // Notify the agent
        Notification::create([
            'user_id' => $anchorage->agent_id,
            'title' => 'Vessel on Waitlist',
            'message' => "Your anchorage request for vessel {$anchorage->vessel->name} could not be immediately processed. Your vessel has been placed on a waitlist and will be assigned a wharf slot as soon as one becomes available.",
        ]);

        return response()->json($anchorage->fresh(['vessel', 'wharf']));
    }

    /**
     * Reclassify a container's storage type and optionally log a new keyword.
     */
    public function reclassifyContainer(Request $request, $id)
    {
        $request->validate([
            'new_storage_type' => 'required|in:chemical,frozen,dry',
            'new_keyword' => 'nullable|string|max:100',
        ]);

        $container = Container::findOrFail($id);
        
        // Update container storage type
        $container->storage_type = $request->new_storage_type;
        $container->save();

        // If a new keyword is provided, save it for future extractions
        if ($request->filled('new_keyword')) {
            $keyword = strtolower(trim($request->new_keyword));
            
            // Check if it exists already to prevent duplicates
            \App\Models\StorageKeyword::firstOrCreate(
                ['keyword' => $keyword],
                ['storage_type' => $request->new_storage_type]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Container reclassified successfully.',
            'container' => $container
        ]);
    }
}
