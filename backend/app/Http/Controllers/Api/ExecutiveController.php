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

        // 4. Recent Reports (From Database)
        $recentReports = \App\Models\Report::latest()->take(3)->get()->map(function($r) {
            return [
                'id' => $r->id,
                'title' => $r->title,
                'type' => $r->type,
                'date' => $r->created_at->format('Y-m-d'),
                'size' => $r->size,
                'file_url' => asset('storage/' . $r->file_path)
            ];
        });

        return response()->json([
            'turnaroundData' => $turnaroundData,
            'rejectionReasons' => $rejectionReasons,
            'performanceMetrics' => $performanceMetrics,
            'recentReports' => $recentReports,
        ]);
    }

    public function generateReport(Request $request)
    {
        $request->validate([
            'dateRange' => 'required|string',
            'reportType' => 'required|string',
            'format' => 'required|in:PDF,Excel,CSV',
        ]);

        $dateRangeStr = $request->dateRange;
        // Map date range to timestamps
        $endDate = now();
        if (str_contains(strtolower($dateRangeStr), 'last 7')) {
            $startDate = now()->subDays(7);
        } elseif (str_contains(strtolower($dateRangeStr), '30')) {
            $startDate = now()->subDays(30);
        } elseif (str_contains(strtolower($dateRangeStr), 'last month')) {
            $startDate = now()->subMonth()->startOfMonth();
            $endDate = now()->subMonth()->endOfMonth();
        } else {
            $startDate = now()->subDays(7);
        }

        // Aggregate Data
        $approvals = Log::where('action', 'like', '%approve%')
            ->whereBetween('created_at', [$startDate, $endDate])->count();
            
        $rejections = Log::where('action', 'like', '%reject%')
            ->whereBetween('created_at', [$startDate, $endDate])->count();

        $vessels = Vessel::whereBetween('created_at', [$startDate, $endDate])->count();

        $totalActivity = $approvals + $rejections + $vessels;
        $isEmpty = $totalActivity === 0;

        $requestFormat = $request->input('format', 'pdf');
        $reportType = $request->input('reportType', 'Custom');

        // Generate filename
        $ext = strtolower($requestFormat) === 'excel' ? 'csv' : strtolower($requestFormat);
        $fileName = 'Report_' . time() . '_' . rand(100,999) . '.' . $ext;
        $path = 'reports/' . $fileName;

        if ($ext === 'pdf') {
            // Use DOMPDF
            $html = "
                <h1>Mukalla Port Authority - {$reportType} Report</h1>
                <p><strong>Date Range:</strong> {$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')}</p>
                <hr>
                " . ($isEmpty ? "<h2>No Operational Data for Selected Period</h2>" : "
                <h3>Operational Activity Summary</h3>
                <ul>
                    <li>Total Vessels Registered: {$vessels}</li>
                    <li>Approvals Granted: {$approvals}</li>
                    <li>Rejections Issued: {$rejections}</li>
                </ul>
                <p>Report generated securely by Executive Dashboard System.</p>
                ");
            
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
            \Illuminate\Support\Facades\Storage::disk('public')->put($path, $pdf->output());
        } else {
            // CSV
            $csvContent = "Mukalla Port Authority - {$reportType} Report\n";
            $csvContent .= "Date Range:,{$startDate->format('Y-m-d')},to,{$endDate->format('Y-m-d')}\n\n";
            
            if ($isEmpty) {
                $csvContent .= "No Operational Data for Selected Period\n";
            } else {
                $csvContent .= "Metric,Value\n";
                $csvContent .= "Total Vessels Registered,{$vessels}\n";
                $csvContent .= "Approvals Granted,{$approvals}\n";
                $csvContent .= "Rejections Issued,{$rejections}\n";
            }
            \Illuminate\Support\Facades\Storage::disk('public')->put($path, $csvContent);
        }

        $sizeBytes = \Illuminate\Support\Facades\Storage::disk('public')->size($path);
        
        if ($sizeBytes >= 1048576) {
            $readableSize = number_format($sizeBytes / 1048576, 1) . ' MB';
        } else {
            $readableSize = number_format($sizeBytes / 1024, 1) . ' KB';
        }

        $report = \App\Models\Report::create([
            'title' => $reportType . ' - ' . now()->format('M d'),
            'type' => $requestFormat,
            'file_path' => $path,
            'size' => $readableSize,
        ]);

        return response()->json([
            'message' => 'Report generated successfully',
            'report' => [
                'id' => $report->id,
                'title' => $report->title,
                'type' => $report->type,
                'date' => $report->created_at->format('Y-m-d'),
                'size' => $report->size,
                'file_url' => asset('storage/' . $report->file_path)
            ]
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
        // Eagerly load owner; try containers but gracefully handle if migration hasn't run
        try {
            $vessels = Vessel::where('status', 'awaiting')
                ->with(['owner', 'containers'])
                ->get();
        } catch (\Exception $e) {
            // containers table may not have vessel_id yet — load without it
            $vessels = Vessel::where('status', 'awaiting')
                ->with('owner')
                ->get();
        }

        $mapped = $vessels->map(function($v) {
                $cargoType = 'General Cargo';
                if ($v->type === 'Tanker') {
                    $cargoType = 'Liquid Bulk';
                } elseif ($v->type === 'Container') {
                    $cargoType = 'Container Cargo';
                }

                // Build real manifest documents from the containers table (if loaded)
                $manifestDocuments = [];
                $containerCount = 0;
                if ($v->relationLoaded('containers')) {
                    $manifestDocuments = $v->containers->map(function($container) {
                        return [
                            'id' => $container->id,
                            'name' => basename($container->manifest_file_path),
                            'url' => asset('storage/' . $container->manifest_file_path),
                            'storage_type' => $container->storage_type,
                            'consignee_name' => $container->consignee_name,
                            'extraction_status' => $container->extraction_status,
                            'extraction_errors' => $container->extraction_errors,
                        ];
                    })->values()->toArray();
                    $containerCount = $v->containers->count();
                }

                return [
                    'id' => 'REQ-' . $v->id,
                    'vesselId' => $v->id,
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
                    'containers' => $containerCount,
                    'documents' => $manifestDocuments,
                    'submittedDate' => $v->created_at->format('Y-m-d H:i'),
                    'eta' => $v->eta ? \Carbon\Carbon::parse($v->eta)->format('Y-m-d H:i') : 'N/A',
                ];
            });

        return response()->json($mapped);
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
            'reason' => 'required|string',
            'rejected_manifest_ids' => 'sometimes|array',
            'rejected_manifest_ids.*' => 'exists:containers,id'
        ]);

        $vessel = Vessel::findOrFail($id);
        $vessel->status = 'rejected';
        $vessel->rejection_reason = $request->reason;
        $vessel->save();

        // Update specific manifests if provided
        if ($request->has('rejected_manifest_ids') && !empty($request->rejected_manifest_ids)) {
            \App\Models\Container::whereIn('id', $request->rejected_manifest_ids)
                ->where('vessel_id', $vessel->id)
                ->update(['status' => 'rejected_by_executive']);
        }

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'reject_arrival',
            'details' => "Executive rejected arrival for vessel {$vessel->name}. Reason: {$request->reason}",
        ]);

        return response()->json([
            'vessel' => $vessel,
            'message' => 'Arrival rejected successfully and manifests flagged.'
        ]);
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
