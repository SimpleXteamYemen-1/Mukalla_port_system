<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Wharf;
use App\Models\Container;

class WharfController extends Controller
{
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
        // For now list all containers that are arrived or assigned
        $containers = Container::whereIn('status', ['arrived', 'assigned', 'ready_discharge'])->with('manifest.vessel')->get();
        return response()->json($containers);
    }

    public function getDashboardStats()
    {
        $totalCapacity = Wharf::sum('capacity');
        $usedCapacity = Container::where('status', 'assigned')->count(); // Assuming 1 container = 1 unit for now

        return response()->json([
            'pending_availability' => 0, // No table for this yet
            'approved_wharves' => Wharf::where('status', 'available')->count(),
            'occupied_wharves' => Wharf::where('status', 'occupied')->count(),
            'storage_used' => $usedCapacity,
            'storage_available' => max(0, $totalCapacity - $usedCapacity),
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

        // Check if the specific block/row/tier is already occupied by an active container
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
        // Update status or log history
        // For simple demo:
        if ($request->action === 'load')
            $container->status = 'loaded';
        if ($request->action === 'discharge')
            $container->status = 'discharged';
        $container->save();

        return response()->json(['success' => true, 'container' => $container]);
    }
}
