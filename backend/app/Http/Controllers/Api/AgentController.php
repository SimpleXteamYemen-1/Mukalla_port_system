<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Vessel;
use App\Models\CargoManifest;
use App\Models\AnchorageRequest;
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

    public function submitArrival(Request $request)
    {
        $request->validate([
            'imo_number' => 'required|string|size:9',
            'name' => 'required|string',
            'type' => 'required|string',
            'flag' => 'nullable|string',
            'eta' => 'required|date',
        ]);

        // Check if vessel exists, if so update/use it, else create new
        $vessel = Vessel::where('imo_number', $request->imo_number)->first();

        if (!$vessel) {
            $vessel = Vessel::create([
                'imo_number' => $request->imo_number,
                'name' => $request->name,
                'type' => $request->type,
                'flag' => $request->flag,
                'owner_id' => $request->user()->id,
                'eta' => $request->eta,
                'status' => 'awaiting',
            ]);
        } else {
            // Update existing vessel arrival info
             $vessel->update([
                'eta' => $request->eta,
                'status' => 'awaiting',
                // Update other fields if provided? For now assume keeping existing static data
            ]);
        }

        return response()->json($vessel, 201);
    }

    public function uploadManifest(Request $request)
    {
        $request->validate([
            'vessel_id' => 'required|exists:vessels,id',
            'file' => 'required|file', // storing file via Storage
            'total_weight' => 'required|numeric',
            'container_count' => 'required|integer',
        ]);
        
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
        $vessels = Vessel::where('owner_id', $request->user()->id)->get();
        return response()->json($vessels);
    }

    public function getManifests(Request $request)
    {
        $manifests = CargoManifest::where('uploaded_by', $request->user()->id)->with('vessel')->get();
        return response()->json($manifests);
    }

    public function submitAnchorageRequest(Request $request)
    {
        $request->validate([
            'vessel_id' => 'required|exists:vessels,id',
            'duration' => 'required|string',
            'reason' => 'required|string',
            'location' => 'nullable|string',
        ]);

        // Ensure vessel belongs to agent and is approved
        $vessel = Vessel::where('id', $request->vessel_id)
            ->where('owner_id', $request->user()->id)
            ->where('status', 'approved')
            ->first();

        if (!$vessel) {
            return response()->json(['message' => 'Vessel not found or not approved for anchorage'], 404);
        }

        $anchorageRequest = AnchorageRequest::create([
            'vessel_id' => $request->vessel_id,
            'agent_id' => $request->user()->id,
            'duration' => $request->duration,
            'reason' => $request->reason,
            'location' => $request->location,
            'status' => 'pending',
        ]);

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
}
