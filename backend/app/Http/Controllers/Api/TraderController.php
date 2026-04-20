<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Container;
use App\Models\DischargeRequest;

use Illuminate\Support\Facades\DB;

class TraderController extends Controller
{
    public function getContainers(Request $request)
    {
        $user = $request->user();
        $userName = strtolower(trim($user->name));
        
        $containers = Container::whereRaw('LOWER(TRIM(consignee_name)) = ?', [$userName])
            ->whereHas('vessel', function ($q) {
                // Include all active states where a trader should track their assets
                $q->whereIn(DB::raw('LOWER(status)'), [
                    'anchored', 
                    'wharf_assigned', 
                    'wharf assigned', 
                    'approved', 
                    'scheduled', 
                    'docked'
                ]);
            })
            ->with(['vessel.wharf', 'arrivalNotification'])
            ->get();
            
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
            ->where(function ($query) use ($request) {
                $query->where('trader_user_id', $request->user()->id)
                      ->orWhere('consignee_phone', $request->user()->phone);
            })
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
        $user = $request->user();
        // Calculate stats only for containers whose vessels are released
        $containers = Container::where(function ($query) use ($user) {
                $query->where('trader_user_id', $user->id)
                      ->orWhere('consignee_phone', $user->phone);
            })
            ->whereHas('vessel', function ($q) {
                $q->whereIn('status', ['ready', 'departed', 'cleared', 'completed']);
            })
            ->get();
        
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
