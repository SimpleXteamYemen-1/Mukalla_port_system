<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Vessel;

class VesselArrived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // Keep the model typed so broadcast serialization and IDE checks stay predictable.
    public Vessel $vessel;

    /**
     * Create a new event instance.
     */
    public function __construct(Vessel $vessel)
    {
        $this->vessel = $vessel;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('port-operations'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'vessel.arrived';
    }

    public function broadcastWith(): array
    {
        // Broadcast only the fields needed by the UI instead of exposing the full model.
        return [
            'vessel' => [
                'id' => $this->vessel->id,
                'name' => $this->vessel->name,
                'imo_number' => $this->vessel->imo_number,
                'status' => $this->vessel->status,
                'eta' => $this->vessel->eta?->toISOString(),
                'priority' => $this->vessel->priority,
            ],
        ];
    }
}
