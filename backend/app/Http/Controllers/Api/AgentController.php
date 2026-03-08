<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Vessel;
use App\Models\CargoManifest;
use App\Models\AnchorageRequest;
use App\Models\PortClearance;
use App\Http\Requests\StoreArrivalNotificationRequest;
use App\Http\Requests\StoreAnchorageRequest;
use App\Http\Requests\StoreVesselArrivalRequest;
use App\Http\Requests\UploadManifestRequest;
use App\Services\AgentService;
use Illuminate\Support\Facades\Storage;

class AgentController extends Controller
{
    public function checkIMO($imo)
    {
        $vessel = Vessel::where('imo_number', $imo)->first();

        if ($vessel) {
            return response()->json([
                'found' => true,
                'vessel' => $vessel
            ]);
        }

        return response()->json([
            'found' => false,
            'message' => 'Vessel not found'
        ]);
    }

    public function submitArrival(StoreVesselArrivalRequest $request, AgentService $agentService)
    {
        $vessel = $agentService->processArrival($request->validated(), $request->user()->id);

        return response()->json($vessel, 201);
    }

    public function uploadManifest(UploadManifestRequest $request)
    {

        // Ensure user owns vessel
        $vessel = Vessel::where('id', $request->vessel_id)
            ->where('owner_id', $request->user()->id)
            ->firstOrFail();

        $path = $request->file('file')->store('manifests');

        $manifest = CargoManifest::create([
            'vessel_id' => $request->vessel_id,
            'uploaded_by' => $request->user()->id,
            'status' => 'pending',
            'file_path' => $path,
            'total_weight' => $request->total_weight,
            'container_count' => $request->container_count,
        ]);

        return response()->json($manifest, 201);
    }

    public function getVessels(Request $request)
    {
        $vessels = Vessel::where('owner_id', $request->user()->id)
            ->with(['manifests', 'owner'])
            ->latest()
            ->get();
        return response()->json($vessels);
    }

    public function getManifests(Request $request)
    {
        $manifests = CargoManifest::where('uploaded_by', $request->user()->id)->with('vessel')->get();
        return response()->json($manifests);
    }

    public function submitAnchorageRequest(StoreAnchorageRequest $request, AgentService $agentService)
    {
        // Ensure vessel belongs to agent and is approved
        $vessel = Vessel::where('id', $request->vessel_id)
            ->where('owner_id', $request->user()->id)
            ->where('status', 'approved')
            ->first();

        if (!$vessel) {
            return response()->json(['message' => 'Vessel not found or not approved for anchorage'], 404);
        }

        $anchorageRequest = $agentService->processAnchorageRequest($request->validated(), $request->user()->id);

        return response()->json($anchorageRequest, 201);
    }

    public function getAnchorageRequests(Request $request)
    {
        $requests = AnchorageRequest::where('agent_id', $request->user()->id)
            ->with('vessel')
            ->latest()
            ->get();

        return response()->json($requests);
    }

    public function getClearances(Request $request)
    {
        // Only return clearances for vessels owned by the agent
        $vessels = Vessel::where('owner_id', $request->user()->id)->pluck('id');
        return response()->json(PortClearance::whereIn('vessel_id', $vessels)->with('vessel', 'officer')->get());
    }

    public function issueClearance(Request $request)
    {
        $request->validate([
            'vessel_name' => 'required|string',
            'next_port' => 'nullable|string',
        ]);

        $vessel = Vessel::where('name', $request->vessel_name)
            ->where('owner_id', $request->user()->id)
            ->firstOrFail();

        $clearance = PortClearance::create([
            'vessel_id' => $vessel->id,
            'officer_id' => null, // Issued by agent or system
            'issue_date' => now(),
            'expiry_date' => now()->addHours(24),
            'status' => 'valid',
        ]);

        return response()->json($clearance, 201);
    }

    public function getDashboardStats(Request $request)
    {
        $userId = $request->user()->id;

        $activeVessels = Vessel::where('owner_id', $userId)
            ->where('status', 'active')
            ->count();

        $pendingAnchorage = AnchorageRequest::where('agent_id', $userId)
            ->where('status', 'pending')
            ->count();

        // For now, completed operations can be approved manifests or completed anchorage requests
        $completed = AnchorageRequest::where('agent_id', $userId)
            ->where('status', 'completed')
            ->count();

        return response()->json([
            'activeVessels' => $activeVessels,
            'pendingClearances' => $pendingAnchorage,
            'completedOperations' => $completed,
            'notifications' => 0, // Placeholder for alerts/notifications
        ]);
    }

    public function getTrackerData(Request $request)
    {
        $userId = $request->user()->id;

        // 1. Arrivals (Vessels)
        $arrivals = Vessel::where('owner_id', $userId)->get()->map(function ($v) use ($request) {
            return [
            'id' => 'AN-' . $v->id,
            'type' => 'arrival',
            'vessel' => $v->name,
            'title' => 'Arrival Notification',
            'submittedDate' => $v->created_at->toDateTimeString(),
            'status' => $v->status === 'awaiting' ? 'pending' : ($v->status === 'active' ? 'approved' : $v->status),
            'completedDate' => $v->updated_at->toDateTimeString(),
            // 'icon' => 'Ship', // Handled on frontend
            'timeline' => [
            ['step' => 'Submitted', 'date' => $v->created_at->toDateTimeString(), 'user' => 'Agent', 'status' => 'completed'],
            ['step' => 'Under Review', 'date' => '', 'user' => 'Port Officer', 'status' => $v->status === 'awaiting' ? 'pending' : 'completed'],
            ['step' => 'Approved', 'date' => $v->status === 'active' ? $v->updated_at->toDateTimeString() : '', 'user' => 'Port Officer', 'status' => $v->status === 'active' ? 'completed' : 'pending'],
            ]
            ];
        });

        // 2. Anchorage Requests
        $anchorage = AnchorageRequest::where('agent_id', $userId)->with('vessel')->get()->map(function ($a) {
            return [
            'id' => 'AR-' . $a->id,
            'type' => 'anchorage',
            'vessel' => $a->vessel->name,
            'title' => 'Anchorage Request',
            'submittedDate' => $a->created_at->toDateTimeString(),
            'status' => $a->status,
            'completedDate' => $a->updated_at->toDateTimeString(),
            'rejectionReason' => $a->rejection_reason ?? null,
            'timeline' => [
            ['step' => 'Submitted', 'date' => $a->created_at->toDateTimeString(), 'user' => 'Agent', 'status' => 'completed'],
            ['step' => 'Executive Approval', 'date' => '', 'user' => 'Executive', 'status' => $a->status === 'pending' ? 'pending' : ($a->status === 'approved' ? 'completed' : 'rejected')],
            ['step' => 'Final Decision', 'date' => $a->status !== 'pending' ? $a->updated_at->toDateTimeString() : '', 'user' => 'Executive', 'status' => $a->status === 'pending' ? 'pending' : ($a->status === 'approved' ? 'completed' : 'rejected')],
            ]
            ];
        });

        // 3. Manifests
        $manifests = CargoManifest::where('uploaded_by', $userId)->with('vessel')->get()->map(function ($m) {
            return [
            'id' => 'CM-' . $m->id,
            'type' => 'manifest',
            'vessel' => $m->vessel->name,
            'title' => 'Cargo Manifest',
            'submittedDate' => $m->created_at->toDateTimeString(),
            'status' => $m->status,
            'completedDate' => $m->updated_at->toDateTimeString(),
            'timeline' => [
            ['step' => 'Uploaded', 'date' => $m->created_at->toDateTimeString(), 'user' => 'Agent', 'status' => 'completed'],
            ['step' => 'Under Review', 'date' => '', 'user' => 'Port Officer', 'status' => $m->status === 'pending' ? 'pending' : 'completed'],
            ['step' => 'Approved', 'date' => $m->status === 'approved' ? $m->updated_at->toDateTimeString() : '', 'user' => 'Port Officer', 'status' => $m->status === 'approved' ? 'completed' : 'pending'],
            ]
            ];
        });

        // Merge and sort
        $all = $arrivals->concat($anchorage)->concat($manifests)->sortByDesc('submittedDate')->values();

        return response()->json($all);
    }
}
