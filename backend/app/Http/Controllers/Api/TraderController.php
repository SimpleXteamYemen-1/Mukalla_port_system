<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Container;
use App\Models\DischargeRequest;

class TraderController extends Controller
{
    public function getContainers(Request $request)
    {
        // Match by email
        $email = $request->user()->email;
        $containers = Container::where('trader_email', $email)->with('manifest.vessel')->get();
        return response()->json($containers);
    }

    public function requestDischarge(Request $request)
    {
        $request->validate([
            'container_id' => 'required|exists:containers,id',
            'requested_date' => 'required|date',
        ]);

        // Ensure container belongs to trader
        $container = Container::where('id', $request->container_id)
            ->where('trader_email', $request->user()->email)
            ->firstOrFail();

        $discharge = DischargeRequest::create([
            'container_id' => $container->id,
            'trader_id' => $request->user()->id,
            'status' => 'pending',
            'requested_date' => $request->requested_date,
        ]);

        return response()->json($discharge, 201);
    }

    public function getDischargeRequests(Request $request)
    {
        $requests = DischargeRequest::where('trader_id', $request->user()->id)
            ->with(['container.manifest.vessel'])
            ->get();
        return response()->json($requests);
    }

    public function getDashboardStats(Request $request)
    {
        $email = $request->user()->email;
        // Need to query containers by trader email
        $containers = Container::where('trader_email', $email)->get();
        
        return response()->json([
            'arrived' => $containers->where('status', 'arrived')->count(),
            'stored' => $containers->where('status', 'assigned')->count(),
            'ready_for_discharge' => $containers->where('status', 'ready_discharge')->count(),
            'unread_notifications' => 5, // Mock for now
            'pending_discharges' => DischargeRequest::where('trader_id', $request->user()->id)->where('status', 'pending')->count(),
            'status_change_alerts' => 2, // Mock for now
        ]);
    }
}
