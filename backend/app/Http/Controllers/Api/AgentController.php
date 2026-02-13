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
