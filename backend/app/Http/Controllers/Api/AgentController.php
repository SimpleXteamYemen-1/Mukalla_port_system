<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Vessel;
use App\Models\CargoManifest;
use App\Models\AnchorageRequest;
use App\Models\PortClearance;
use App\Http\Requests\StoreArrivalNotificationRequest;
use App\Http\Requests\StoreAnchorageRequest;
use App\Http\Requests\StoreVesselArrivalRequest;
use App\Http\Requests\UploadManifestRequest;
use App\Services\AgentService;
use Illuminate\Support\Facades\Storage;
use App\Models\Notification;
use App\Models\User;

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

    public function submitArrival(StoreVesselArrivalRequest $request, AgentService $agentService)
    {
        $data = $request->validated();
        if ($request->hasFile('priority_document')) {
            $data['priority_document_path'] = $request->file('priority_document')->store('priority_documents', 'public');
        }
        $vessel = $agentService->processArrival($data, $request->user()->id);

        return response()->json($vessel, 201);
    }

    public function uploadManifest(UploadManifestRequest $request)
    {

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

    public function submitAnchorageRequest(StoreAnchorageRequest $request, AgentService $agentService)
    {
        // Ensure vessel belongs to agent and is approved
        $vessel = Vessel::where('id', $request->vessel_id)
            ->where('owner_id', $request->user()->id)
            ->where('status', 'approved')
            ->first();

        if (!$vessel) {
            return response()->json(['message' => 'Vessel not found or not approved for anchorage'], 404);
        }

        $anchorageRequest = $agentService->processAnchorageRequest($request->validated(), $request->user()->id);

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

    public function getClearances(Request $request)
    {
        // Only return clearances for vessels owned by the agent
        $vessels = Vessel::where('owner_id', $request->user()->id)->pluck('id');
        return response()->json(PortClearance::whereIn('vessel_id', $vessels)->with('vessel', 'officer')->get());
    }

    public function issueClearance(Request $request)
    {
        $request->validate([
            'vessel_name' => 'required|string',
            'next_port' => 'nullable|string',
        ]);

        $vessel = Vessel::where('name', $request->vessel_name)
            ->where('owner_id', $request->user()->id)
            ->firstOrFail();

        $clearance = PortClearance::create([
            'vessel_id' => $vessel->id,
            'officer_id' => null, // Issued by agent or system
            'issue_date' => now(),
            'expiry_date' => now()->addHours(24),
            'status' => 'valid',
            'next_port' => $request->next_port,
        ]);

        return response()->json($clearance, 201);
    }

    public function getDashboardStats(Request $request)
    {
        $userId = $request->user()->id;

        $activeVessels = Vessel::where('owner_id', $userId)
            ->where('status', 'active')
            ->count();

        $pendingAnchorage = AnchorageRequest::where('agent_id', $userId)
            ->where('status', 'pending')
            ->count();

        // For now, completed operations can be approved manifests or completed anchorage requests
        $completed = AnchorageRequest::where('agent_id', $userId)
            ->where('status', 'completed')
            ->count();

        return response()->json([
            'activeVessels' => $activeVessels,
            'pendingClearances' => $pendingAnchorage,
            'completedOperations' => $completed,
            'notifications' => 0, // Placeholder for alerts/notifications
        ]);
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
            'rejectionReason' => $v->rejection_reason ?? null,
            // 'icon' => 'Ship', // Handled on frontend
            'timeline' => [
            ['step' => 'Submitted', 'date' => $v->created_at->toDateTimeString(), 'user' => 'Agent', 'status' => 'completed'],
            ['step' => 'Under Review', 'date' => '', 'user' => 'Port Officer', 'status' => $v->status === 'awaiting' ? 'pending' : 'completed'],
            ['step' => 'Approved', 'date' => $v->status === 'active' ? $v->updated_at->toDateTimeString() : '', 'user' => 'Port Officer', 'status' => $v->status === 'active' ? 'completed' : 'pending'],
            ]
            ];
        });

        // 2. Anchorage Requests
        $anchorage = AnchorageRequest::with(['vessel', 'wharf'])->where('agent_id', $userId)->get()->map(function ($a) {
            $statusMapping = [
                'pending' => 'pending',
                'wharf_assigned' => 'approved',
                'waiting' => 'pending', // Waitlisted is still pending assignment
                'approved' => 'approved',
                'rejected' => 'rejected',
                'completed' => 'completed',
            ];

            return [
            'id' => 'AR-' . $a->id,
            'type' => 'anchorage',
            'vessel' => $a->vessel->name,
            'title' => 'Anchorage Request',
            'submittedDate' => $a->created_at->toDateTimeString(),
            'status' => $statusMapping[$a->status] ?? $a->status,
            'completedDate' => $a->wharf_assigned_at ? $a->wharf_assigned_at->toDateTimeString() : $a->updated_at->toDateTimeString(),
            'rejectionReason' => $a->rejection_reason ?? null,
            'timeline' => [
            ['step' => 'Submitted', 'date' => $a->created_at->toDateTimeString(), 'user' => 'Agent', 'status' => 'completed'],
            ['step' => 'Wharf Review', 'date' => $a->status !== 'pending' ? $a->updated_at->toDateTimeString() : '', 'user' => 'Wharf Officer', 'status' => $a->status === 'pending' ? 'pending' : 'completed'],
            ['step' => 'Slot Allocation', 'date' => $a->wharf_assigned_at ? $a->wharf_assigned_at->toDateTimeString() : '', 'user' => 'Wharf Officer', 'status' => $a->status === 'wharf_assigned' ? 'completed' : ($a->status === 'waiting' ? 'pending' : 'pending')],
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

    private function notifyUsers(array $roles, string $title, string $message)
    {
        $users = User::role($roles)->get();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'title' => $title,
                'message' => $message,
            ]);
        }
    }

    public function updateArrival(Request $request, $id)
    {
        $vessel = Vessel::where('id', $id)->where('owner_id', $request->user()->id)->firstOrFail();
        
        $request->validate([
            'eta' => 'required|date',
            'type' => 'nullable|string',
            'flag' => 'nullable|string',
            'name' => 'nullable|string',
            'imo_number' => 'nullable|string',
            'purpose' => 'nullable|string',
            'cargo' => 'nullable|string',
            'priority' => 'nullable|string|in:Low,Medium,High',
            'priority_reason' => 'nullable|required_if:priority,Medium|string|min:20',
            'priority_document' => 'nullable|required_if:priority,High|file|mimes:pdf,jpeg,jpg|max:10240',
        ]);

        $data = $request->only(['eta', 'type', 'flag', 'name', 'imo_number', 'purpose', 'cargo', 'priority', 'priority_reason']);
        if ($request->hasFile('priority_document')) {
            $data['priority_document_path'] = $request->file('priority_document')->store('priority_documents', 'public');
        }

        $vessel->update($data);

        $this->notifyUsers(['officer', 'executive'], 'Arrival Updated', "Agent has updated arrival details for vessel {$vessel->name}.");

        return response()->json($vessel);
    }

    public function updateManifest(Request $request, $id)
    {
        $manifest = CargoManifest::where('id', $id)->where('uploaded_by', $request->user()->id)->firstOrFail();

        $request->validate([
            'total_weight' => 'required|numeric',
            'container_count' => 'required|integer',
            'file' => 'nullable|file',
        ]);

        $data = [
            'total_weight' => $request->total_weight,
            'container_count' => $request->container_count,
        ];

        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('manifests');
        }

        $manifest->update($data);

        $this->notifyUsers(['officer'], 'Manifest Updated', "Agent has updated cargo manifest for vessel {$manifest->vessel->name}.");

        return response()->json($manifest);
    }

    public function updateAnchorageRequest(Request $request, $id)
    {
        $anchorage = AnchorageRequest::where('id', $id)->where('agent_id', $request->user()->id)->firstOrFail();

        $request->validate([
            'duration' => 'required|integer',
            'reason' => 'required|string',
            'docking_time' => 'required|date',
        ]);

        $anchorage->update([
            'duration' => $request->duration,
            'reason' => $request->reason,
            'docking_time' => $request->docking_time,
        ]);

        $this->notifyUsers(['executive'], 'Anchorage Request Updated', "Agent has updated anchorage request for vessel {$anchorage->vessel->name}.");

        return response()->json($anchorage);
    }

    public function updateClearance(Request $request, $id)
    {
        // For agent, owner check via vessels:
        $vessels = Vessel::where('owner_id', $request->user()->id)->pluck('id');
        $clearance = PortClearance::where('id', $id)->whereIn('vessel_id', $vessels)->firstOrFail();

        $request->validate([
            'next_port' => 'required|string',
        ]);

        $clearance->update([
            'next_port' => $request->next_port,
        ]);

        $this->notifyUsers(['officer'], 'Clearance Updated', "Agent has updated port clearance request for vessel {$clearance->vessel->name}.");

        return response()->json($clearance);
    }

    /**
     * GET /agent/vessel-report?vessel_id=
     *
     * Returns a bundled report of the three core documents for a specific vessel.
     * Returns the LATEST record for each document type (no date restriction)
     * so agents can always export their documents regardless of date.
     * Any missing document is returned as null so the frontend shows a warning.
     */
    public function getVesselActivityReport(Request $request)
    {
        $request->validate([
            'vessel_id' => 'required|integer',
        ]);

        $userId   = $request->user()->id;
        $vesselId = $request->vessel_id;

        // ─── Verify the vessel belongs to this agent ──────────────────────────
        $vessel = Vessel::where('id', $vesselId)
            ->where('owner_id', $userId)
            ->with(['owner'])
            ->first();

        if (!$vessel) {
            return response()->json(['message' => 'Vessel not found or access denied'], 404);
        }

        // ─── Arrival Notification (the Vessel record IS the arrival in this system) ─
        $arrival = [
            'id'              => $vessel->id,
            'vessel_name'     => $vessel->name,
            'imo_number'      => $vessel->imo_number,
            'type'            => $vessel->type,
            'flag'            => $vessel->flag,
            'eta'             => $vessel->eta,
            'etd'             => $vessel->etd ?? null,
            'status'          => $vessel->status,
            'purpose'         => $vessel->purpose ?? null,
            'cargo'           => $vessel->cargo ?? null,
            'priority'        => $vessel->priority ?? 'Low',
            'priority_reason' => $vessel->priority_reason ?? null,
            'rejection_reason'=> $vessel->rejection_reason ?? null,
            'created_at'      => $vessel->created_at,
        ];

        // ─── Anchorage Request (latest record for this vessel) ─────────────────
        $anchorageRecord = AnchorageRequest::where('vessel_id', $vesselId)
            ->with('wharf')
            ->latest()
            ->first();

        $anchorage = null;
        if ($anchorageRecord) {
            $anchorage = [
                'id'                  => $anchorageRecord->id,
                'status'              => $anchorageRecord->status,
                'docking_time'        => $anchorageRecord->docking_time,
                'duration'            => $anchorageRecord->duration,
                'location'            => $anchorageRecord->location ?? null,
                'reason'              => $anchorageRecord->reason ?? null,
                'rejection_reason'    => $anchorageRecord->rejection_reason ?? null,
                'wharf'               => $anchorageRecord->wharf
                                            ? $anchorageRecord->wharf->only(['id', 'name', 'status'])
                                            : null,
                'wharf_assigned_at'   => $anchorageRecord->wharf_assigned_at ?? null,
                'created_at'          => $anchorageRecord->created_at,
            ];
        }

        // ─── Port Clearance (latest record for this vessel) ───────────────────
        $clearanceRecord = PortClearance::where('vessel_id', $vesselId)
            ->with('officer')
            ->latest()
            ->first();

        $clearance = null;
        if ($clearanceRecord) {
            $clearance = [
                'id'           => $clearanceRecord->id,
                'clearance_id' => 'CLR-' . $clearanceRecord->id,
                'status'       => $clearanceRecord->status,
                'issue_date'   => $clearanceRecord->issue_date,
                'expiry_date'  => $clearanceRecord->expiry_date,
                'next_port'    => $clearanceRecord->next_port ?? null,
                'officer'      => $clearanceRecord->officer
                                    ? $clearanceRecord->officer->only(['id', 'name', 'email'])
                                    : null,
                'created_at'   => $clearanceRecord->created_at,
            ];
        }

        return response()->json([
            'vessel' => [
                'id'    => $vessel->id,
                'name'  => $vessel->name,
                'imo'   => $vessel->imo_number,
                'type'  => $vessel->type,
                'flag'  => $vessel->flag,
                'owner' => $vessel->owner ? ['id' => $vessel->owner->id, 'name' => $vessel->owner->name] : null,
            ],
            'date'      => now()->toDateString(),
            'arrival'   => $arrival,
            'anchorage' => $anchorage,
            'clearance' => $clearance,
        ]);
    }
}
