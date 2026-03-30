<?php

namespace App\Services;

use App\Models\Vessel;
use App\Models\AnchorageRequest;
use Illuminate\Http\Request;

class AgentService
{
    /**
     * Handle ship arrival notification logic.
     */
    public function processArrival(array $data, $userId)
    {
        $vessel = Vessel::where('imo_number', $data['imo_number'])->first();

        if (!$vessel) {
            $newVessel = Vessel::create([
                'imo_number' => $data['imo_number'],
                'name' => $data['name'],
                'type' => $data['type'],
                'flag' => $data['flag'] ?? 'Unknown',
                'owner_id' => $userId,
                'eta' => $data['eta'],
                'status' => 'awaiting',
                'purpose' => $data['purpose'] ?? 'Cargo Handling',
                'cargo' => $data['cargo'] ?? null,
                'priority' => $data['priority'] ?? 'Low',
                'priority_reason' => $data['priority_reason'] ?? null,
                'priority_document_path' => $data['priority_document_path'] ?? null,
            ]);

            \App\Events\VesselArrived::dispatch($newVessel);

            return $newVessel;
        }

        $vessel->update([
            'eta' => $data['eta'],
            'status' => 'awaiting',
            'purpose' => $data['purpose'] ?? $vessel->purpose,
            'cargo' => $data['cargo'] ?? $vessel->cargo,
            'priority' => $data['priority'] ?? $vessel->priority,
            'priority_reason' => $data['priority_reason'] ?? $vessel->priority_reason,
            'priority_document_path' => $data['priority_document_path'] ?? $vessel->priority_document_path,
        ]);

        \App\Events\VesselArrived::dispatch($vessel);

        return $vessel;
    }

    /**
     * Handle anchorage/docking request logic.
     */
    public function processAnchorageRequest(array $data, $userId)
    {
        return AnchorageRequest::create([
            'vessel_id' => $data['vessel_id'],
            'agent_id' => $userId,
            'duration' => $data['duration'],
            'reason' => $data['reason'],
            'docking_time' => $data['docking_time'],
            'status' => 'pending',
        ]);
    }
}
