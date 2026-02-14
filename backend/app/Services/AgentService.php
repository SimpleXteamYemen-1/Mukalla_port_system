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
            return Vessel::create([
                'imo_number' => $data['imo_number'],
                'name' => $data['name'],
                'type' => $data['type'],
                'flag' => $data['flag'] ?? 'Unknown',
                'owner_id' => $userId,
                'eta' => $data['eta'],
                'status' => 'awaiting',
            ]);
        }

        $vessel->update([
            'eta' => $data['eta'],
            'status' => 'awaiting',
        ]);

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
            'location' => $data['location'] ?? null,
            'docking_time' => $data['docking_time'],
            'status' => 'pending',
        ]);
    }
}
