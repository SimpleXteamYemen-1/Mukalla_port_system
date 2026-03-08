<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Vessel;
use App\Models\Wharf;
use App\Models\PortClearance;
use App\Models\Log;

class PortOfficerController extends Controller
{
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

    public function getLogs()
    {
        return response()->json(Log::latest()->take(20)->get());
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
}
