<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Vessel;
use App\Models\Wharf;
use App\Models\PortClearance;
use App\Models\Log;
use App\Models\AnchorageRequest;

class PortOfficerController extends Controller
{
    /**
     * Returns all anchorage requests that have been approved and assigned by
     * the Wharf worker (status = wharf_assigned). Port Officers use this to
     * have exact visibility on scheduled vessel entries.
     */
    public function getScheduledAnchorage()
    {
        $requests = AnchorageRequest::with(['vessel', 'wharf', 'agent'])
            ->where('status', 'wharf_assigned')
            ->orderBy('docking_time')
            ->get();

        return response()->json($requests);
    }

    public function getDashboardStats()
    {
        return response()->json([
            'active_vessels' => Vessel::whereIn('status', ['docked', 'loading', 'unloading', 'ready'])->count(),
            'awaiting_berth' => Vessel::where('status', 'awaiting')->count(),
            // Assuming 'pending' clearances mean requests, but here counting valid ones for now
            'pending_clearances' => PortClearance::where('status', 'valid')->count(),
        ]);
    }

    public function getVessels()
    {
        return response()->json(Vessel::with('wharf', 'owner')->get());
    }

    public function approveArrival(Request $request, $id)
    {
        $vessel = Vessel::findOrFail($id);
        // Assuming workflow: awaiting -> approved -> assigned/docked
        $vessel->status = 'approved';
        $vessel->save();

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'approve_arrival',
            'details' => "Approved vessel {$vessel->name} arrival",
        ]);

        return response()->json($vessel);
    }

    public function assignBerth(Request $request, $id)
    {
        $request->validate([
            'wharf_id' => 'required|exists:wharves,id',
            'eta' => 'required|date',
            'etd' => 'required|date|after:eta',
        ]);

        $vessel = Vessel::findOrFail($id);
        $wharf = Wharf::findOrFail($request->wharf_id);

        // Check for conflicting schedules
        $conflict = Vessel::where('current_wharf_id', $wharf->id)
            ->where('id', '!=', $vessel->id)
            ->where(function ($query) use ($request) {
            $query->where('eta', '<', $request->etd)
                ->where('etd', '>', $request->eta);
        })->exists();

        if ($conflict) {
            return response()->json(['message' => 'Wharf is already booked during this time window'], 400);
        }

        $vessel->current_wharf_id = $wharf->id;
        $vessel->eta = $request->eta;
        $vessel->etd = $request->etd;
        $vessel->status = 'scheduled';
        $vessel->save();

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'assign_berth',
            'details' => "Scheduled {$vessel->name} to {$wharf->name} from {$vessel->eta} to {$vessel->etd}",
        ]);

        return response()->json($vessel);
    }

    public function issueClearance(Request $request)
    {
        $request->validate([
            'vessel_name' => 'required|string|exists:vessels,name',
            'next_port' => 'required|string',
            'expiry_date' => 'required|date',
        ]);

        $vessel = Vessel::where('name', $request->vessel_name)->firstOrFail();

        $existing = PortClearance::where('vessel_id', $vessel->id)
            ->whereIn('status', ['valid', 'clearance_approved'])
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'Certificate already issued for this vessel'], 400);
        }

        $clearance = PortClearance::create([
            'vessel_id' => $vessel->id,
            'officer_id' => $request->user()->id,
            'issue_date' => now(),
            'expiry_date' => $request->expiry_date,
            'status' => 'valid',
            'next_port' => $request->next_port,
        ]);

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'issue_clearance',
            'details' => "Issued clearance for vessel {$vessel->name} to {$request->next_port}",
        ]);

        return response()->json($clearance, 201);
    }

    public function getClearances()
    {
        return response()->json(PortClearance::with('vessel', 'officer')->get());
    }

    public function approveClearance(Request $request, $id)
    {
        $clearance = PortClearance::with('vessel')->findOrFail($id);
        
        $existing = PortClearance::where('vessel_id', $clearance->vessel_id)
            ->where('id', '!=', $clearance->id)
            ->whereIn('status', ['valid', 'clearance_approved'])
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'Certificate already issued for this vessel'], 400);
        }

        $clearance->update([
            'status' => 'clearance_approved',
            'officer_id' => $request->user()->id,
            'issue_date' => now(),
            'expiry_date' => now()->addHours(24),
        ]);

        // Generate PDF
        $vessel = $clearance->vessel;
        $html = "
            <html>
            <head><style>body { font-family: sans-serif; text-align: center; padding: 50px; } .header { font-size: 24px; font-weight: bold; margin-bottom: 20px;} .content { font-size: 16px; line-height: 1.6;}</style></head>
            <body>
                <div class='header'>PORT CLEARANCE CERTIFICATE</div>
                <div class='content'>
                    <p>This is to certify that the vessel <strong>{$vessel->name}</strong></p>
                    <p>with IMO number <strong>{$vessel->imo_number}</strong></p>
                    <p>has been granted clearance to depart for <strong>{$clearance->next_port}</strong>.</p>
                    <br><br>
                    <p>Issued on: <strong>{$clearance->issue_date->format('Y-m-d H:i:s')}</strong></p>
                    <p>Valid until: <strong>{$clearance->expiry_date->format('Y-m-d H:i:s')}</strong></p>
                    <br><br>
                    <p>Authorized Officer: <strong>{$request->user()->name}</strong></p>
                </div>
            </body>
            </html>
        ";

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $fileName = 'certificate_' . $vessel->id . '_' . time() . '.pdf';
        
        \Storage::disk('public')->put('certificates/' . $fileName, $pdf->output());
        
        $clearance->update([
            'certificate_path' => '/storage/certificates/' . $fileName,
        ]);

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'approve_clearance',
            'details' => "Approved clearance for vessel {$vessel->name}",
        ]);

        return response()->json($clearance);
    }

    public function rejectClearance(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $clearance = PortClearance::with('vessel')->findOrFail($id);
        
        $clearance->update([
            'status' => 'rejected',
            'officer_id' => $request->user()->id,
            'rejection_reason' => $request->rejection_reason,
        ]);

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'reject_clearance',
            'details' => "Rejected clearance for vessel {$clearance->vessel->name}. Reason: {$request->rejection_reason}",
        ]);

        return response()->json($clearance);
    }

    public function getLogs()
    {
        return response()->json(Log::with('user')->latest()->take(50)->get());
    }

    public function getWharves()
    {
        return response()->json(Wharf::all());
    }
    public function releaseBerth(Request $request, $id)
    {
        $vessel = Vessel::findOrFail($id);

        if (!$vessel->current_wharf_id) {
            return response()->json(['message' => 'Vessel is not docked'], 400);
        }

        $wharf = Wharf::find($vessel->current_wharf_id);

        // Update Vessel
        $vessel->current_wharf_id = null;
        $vessel->status = 'ready'; // Ready to depart
        $vessel->save();

        // Update Wharf
        if ($wharf) {
            $wharf->status = 'available';
            $wharf->save();
        }

        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'berth_release',
            'details' => "Released {$vessel->name} from {$wharf->name}",
        ]);

        return response()->json($vessel);
    }

    public function getPortReport(Request $request)
    {
        $request->validate([
            'vessel_name' => 'required|string',
            'target_date' => 'required|date',
        ]);

        $vessel = Vessel::where('name', $request->vessel_name)->first();

        if (!$vessel) {
            return response()->json(['message' => 'Vessel not found'], 404);
        }

        $date = $request->target_date;

        // 1. Port Clearance Data (for that date)
        $clearance = PortClearance::where('vessel_id', $vessel->id)
            ->whereDate('issue_date', $date)
            ->with('officer')
            ->first();

        // 2. Wharfage Logs
        $wharfage = AnchorageRequest::where('vessel_id', $vessel->id)
            ->where(function ($query) use ($date) {
                $query->whereDate('docking_time', $date);
            })
            ->where('status', 'wharf_assigned')
            ->with('wharf')
            ->get()
            ->map(function ($log) {
                $timeIn = \Carbon\Carbon::parse($log->docking_time);
                $timeOut = (clone $timeIn)->addHours((int)$log->duration);
                return [
                    'wharf' => $log->wharf ? $log->wharf->name : 'N/A',
                    'time_in' => $timeIn->toDateTimeString(),
                    'time_out' => $timeOut->toDateTimeString(),
                    'duration' => $log->duration . ' hours',
                ];
            });

        // 3. Security Hash
        $securityHash = 'TRANS-' . strtoupper(substr(md5($vessel->name . $date . now()), 0, 8));

        return response()->json([
            'vessel' => [
                'id' => $vessel->id,
                'name' => $vessel->name,
                'imo' => $vessel->imo_number,
                'type' => $vessel->type,
            ],
            'date' => $date,
            'clearance' => $clearance ? [
                'id' => $clearance->id,
                'clearance_id' => 'CLR-' . $clearance->id,
                'status' => $clearance->status,
                'issue_date' => \Carbon\Carbon::parse($clearance->issue_date)->toDateTimeString(),
                'expiry_date' => \Carbon\Carbon::parse($clearance->expiry_date)->toDateTimeString(),
                'next_port' => $clearance->next_port ?? 'Unknown',
                'officer' => $clearance->officer ? $clearance->officer->name : 'System',
            ] : null,
            'wharfage' => $wharfage,
            'officer_name' => $request->user()->name,
            'security_hash' => $securityHash,
            'timestamp' => now()->format('Y-m-d H:i:s'),
        ]);
    }
}
