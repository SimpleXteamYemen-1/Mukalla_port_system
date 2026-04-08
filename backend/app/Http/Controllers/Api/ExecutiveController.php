<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Log;
use App\Models\Vessel;
use App\Models\AnchorageRequest;
use App\Models\User;

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

    public function getAnalytics(Request $request)
    {
        // 1. Turnaround Time Data (Mocking historical trend based on recent arrivals)
        // Ideally this would group by month and calculate average difference between arrival and departure.
        $turnaroundData = [
            ['name' => 'Jan', 'avg' => 24, 'target' => 36],
            ['name' => 'Feb', 'avg' => 22, 'target' => 36],
            ['name' => 'Mar', 'avg' => 18, 'target' => 36],
            ['name' => 'Apr', 'avg' => 26, 'target' => 36],
            ['name' => 'May', 'avg' => 20, 'target' => 36],
            ['name' => 'Jun', 'avg' => 16, 'target' => 36],
        ];

        // 2. Rejection Reasons (Grouping logs where action is reject)
        $rejectionLogs = Log::where('action', 'like', '%reject%')->get();
        $rejectionReasons = [
            ['name' => 'Documentation Incomplete', 'value' => 45, 'color' => '#f87171'],
            ['name' => 'Security Concerns', 'value' => 25, 'color' => '#fbbf24'],
            ['name' => 'Capacity Full', 'value' => 20, 'color' => '#60a5fa'],
            ['name' => 'Other', 'value' => 10, 'color' => '#a78bfa'],
        ];

        // 3. Performance Metrics
        $totalVessels = Vessel::count();
        $avgTurnaround = 21; // Mock average
        
        $approvals = Log::where('action', 'like', '%approve%')->count();
        $rejections = Log::where('action', 'like', '%reject%')->count();
        $totalDecisions = $approvals + $rejections;
        $approvalRate = $totalDecisions > 0 ? round(($approvals / $totalDecisions) * 100) : 100;

        $performanceMetrics = [
            'avgTurnaround' => $avgTurnaround . 'h',
            'approvalRate' => $approvalRate . '%',
            'activeIncidents' => 2, // Mock 
            'operationalEfficiency' => '94%', // Mock
        ];

        // 4. Recent Reports (Mocking generated reports)
        $recentReports = [
            [
                'id' => '1',
                'title' => 'Monthly Port Performance',
                'type' => 'PDF',
                'date' => now()->subDays(2)->format('Y-m-d'),
                'size' => '2.4 MB'
            ],
            [
                'id' => '2',
                'title' => 'Vessel Traffic Analysis',
                'type' => 'Excel',
                'date' => now()->subDays(5)->format('Y-m-d'),
                'size' => '1.8 MB'
            ],
            [
                'id' => '3',
                'title' => 'Security Audit Log',
                'type' => 'PDF',
                'date' => now()->subDays(7)->format('Y-m-d'),
                'size' => '3.1 MB'
            ]
        ];

        return response()->json([
            'turnaroundData' => $turnaroundData,
            'rejectionReasons' => $rejectionReasons,
            'performanceMetrics' => $performanceMetrics,
            'recentReports' => $recentReports,
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
            'pending_users' => User::where('status', User::STATUS_PENDING)->count(),
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
            $cargoType = 'General Cargo';
            $docs = ['Manifest'];
            if ($v->type === 'Tanker') {
                $cargoType = 'Liquid Bulk';
                $docs[] = 'Hazmat Declaration';
            } elseif ($v->type === 'Container') {
                $docs[] = 'Bill of Lading';
            }

            return [
                'id' => 'REQ-' . $v->id,
                'vesselId' => $v->id, // Real ID to be used for action
                'type' => 'arrival',
                'vessel' => [
                    'name' => $v->name,
                    'imo' => $v->imo_number ?? 'N/A',
                    'flag' => $v->flag ?? '🏳️',
                    'type' => $v->type,
                ],
                'agent' => [
                    'name' => $v->owner ? $v->owner->name : 'Unknown Agent',
                    'contact' => $v->owner ? $v->owner->email : 'N/A'
                ],
                'purpose' => $v->purpose ?? 'Cargo operations', 
                'priority' => strtolower($v->priority ?? 'low'),
                'priorityReason' => $v->priority_reason,
                'priorityDocumentPath' => $v->priority_document_path ? asset('storage/' . $v->priority_document_path) : null,
                'riskLevel' => $v->type === 'Tanker' ? 'high' : 'low',
                'cargoType' => current(array_filter([$v->cargo, $cargoType])) ?: $cargoType,
                'containers' => $v->type === 'Container' ? rand(50, 500) : 0, // Mock for now
                'documents' => $docs,
                'submittedDate' => $v->created_at->format('Y-m-d H:i'),
                'eta' => $v->eta ? \Carbon\Carbon::parse($v->eta)->format('Y-m-d H:i') : 'N/A',
            ];
        });

        return response()->json($vessels);
    }

    public function approveArrival(Request $request, $id)
    {
        $vessel = Vessel::findOrFail($id);
        $vessel->status = 'approved';
        $vessel->save();

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'approve_arrival',
            'details' => "Executive approved arrival for vessel {$vessel->name}",
        ]);

        return response()->json($vessel);
    }

    public function rejectArrival(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string'
        ]);

        $vessel = Vessel::findOrFail($id);
        $vessel->status = 'rejected';
        // You might want to add a rejection_reason column to vessels later if needed
        $vessel->save();

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'reject_arrival',
            'details' => "Executive rejected arrival for vessel {$vessel->name}. Reason: {$request->reason}",
        ]);

        return response()->json($vessel);
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
        $requests = AnchorageRequest::with(['vessel.owner', 'agent'])
            ->latest()
            ->get()
            ->map(function ($req) {
                 // Check if it can be approved based on vessel status (must be approved first)
                 $req->canApprove = $req->vessel && $req->vessel->status === 'approved';
                 return $req;
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

    public function getPendingUsers(Request $request)
    {
        return response()->json(User::where('status', User::STATUS_PENDING)->get());
    }

    public function approveUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->status = User::STATUS_ACTIVE;
        // Optionally mark verified as true if that's still being used
        $user->verified = true; 
        $user->save();

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'approve_user',
            'details' => "Executive approved account for {$user->name} ({$user->email})",
        ]);

        return response()->json([
            'message' => 'User account approved successfully.',
            'user' => $user
        ]);
    }

    public function rejectUser(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string'
        ]);

        $user = User::findOrFail($id);
        $user->status = User::STATUS_REJECTED;
        $user->rejection_reason = $request->reason;
        $user->save();

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'reject_user',
            'details' => "Executive rejected account for {$user->name} ({$user->email}). Reason: {$request->reason}",
        ]);

        return response()->json([
            'message' => 'User account rejected successfully.',
            'user' => $user
        ]);
    }
}
