<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Log;
use App\Models\Vessel;
use App\Models\AnchorageRequest;

class ExecutiveController extends Controller
{
    public function getLogs(Request $request)
    {
        return response()->json(Log::with('user')->latest()->take(50)->get());
    }

    public function getReports(Request $request)
    {
        return response()->json([
            'total_vessels' => Vessel::count(),
            'vessels_by_status' => Vessel::selectRaw('status, count(*) as count')->groupBy('status')->get(),
            'logs_count' => Log::count(),
        ]);
    }

    public function getDashboardStats()
    {
        // Calculate approval rate from logs (approvals vs rejections)
        $approvals = Log::where('action', 'like', '%approve%')->count();
        $rejections = Log::where('action', 'like', '%reject%')->count();
        $totalDecisions = $approvals + $rejections;
        $approvalRate = $totalDecisions > 0 ? round(($approvals / $totalDecisions) * 100) . '%' : '100%';

        return response()->json([
            'pending_approvals' => Vessel::where('status', 'awaiting')->count(),
            'blocked_requests' => 0, // Mock logic
            'approval_rate' => $approvalRate,
            'today_decisions' => Log::whereDate('created_at', today())->count(),
        ]);
    }

    public function getPendingApprovals()
    {
        // Return vessels awaiting approval acts as 'Arrival' requests
        // Add artificial ID and type
        $vessels = Vessel::where('status', 'awaiting')->with('owner')->get()->map(function($v) {
            return [
                'id' => 'REQ-' . $v->id,
                'type' => 'arrival',
                'vessel' => $v->name,
                'agent' => $v->owner ? $v->owner->name : 'Unknown',
                'priority' => 'medium', // Mock
                'submittedDate' => $v->created_at->toDateTimeString(),
                'eta' => $v->eta,
            ];
        });

        return response()->json($vessels);
    }

    public function getRecentDecisions()
    {
        // Filter logs for decision-like actions
        return response()->json(Log::whereIn('action', ['approve_arrival', 'assign_berth', 'issue_clearance', 'reject_request'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function($l) {
                $decision = str_contains($l->action, 'reject') ? 'rejected' : 'approved';
                return [
                    'id' => 'DEC-' . $l->id,
                    'type' => str_contains($l->action, 'arrival') ? 'arrival' : 'other',
                    'vessel' => $l->details, // Simplified parsing
                    'decision' => $decision,
                    'time' => $l->created_at->diffForHumans(),
                ];
            }));
    }

    public function getAnchorageRequests()
    {
        $requests = AnchorageRequest::with(['vessel', 'agent'])
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(function ($req) {
                 // Logic to determine if it can be approved
                 // For now, let's assume if it's pending it can be approved unless blocked by business logic
                 // We can check vessel status or other dependencies here
                 $arrivalApproved = $req->vessel->status !== 'awaiting'; // Example logic
                 $wharfApproved = true; // Placeholder for wharf check
                 
                 return [
                    'id' => $req->id,
                    'vessel' => $req->vessel->name,
                    'agent' => $req->agent->name,
                    'arrivalId' => 'AN-' . $req->vessel->id, // Mocking arrival ref
                    'arrivalApproved' => $arrivalApproved,
                    'wharfApproved' => $wharfApproved,
                    'duration' => $req->duration,
                    'location' => $req->location,
                    'reason' => $req->reason,
                    'submittedDate' => $req->created_at->toDateTimeString(),
                    'priority' => 'medium', // Could be added to DB
                    'canApprove' => true, // Simplified for now
                    'blockReason' => null,
                 ];
            });

        return response()->json($requests);
    }

    public function approveAnchorage(Request $request, $id)
    {
        $anchorage = AnchorageRequest::findOrFail($id);
        $anchorage->status = 'approved';
        $anchorage->save();

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'approve_anchorage',
            'details' => "Approved anchorage for vessel {$anchorage->vessel->name}",
        ]);

        return response()->json($anchorage);
    }

    public function rejectAnchorage(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string'
        ]);

        $anchorage = AnchorageRequest::findOrFail($id);
        $anchorage->status = 'rejected';
        $anchorage->rejection_reason = $request->reason;
        $anchorage->save();

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'reject_anchorage',
            'details' => "Rejected anchorage for vessel {$anchorage->vessel->name}",
        ]);

        return response()->json($anchorage);
        
}
}
