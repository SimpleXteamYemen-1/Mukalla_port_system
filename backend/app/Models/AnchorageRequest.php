<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnchorageRequest extends Model
{
    protected $fillable = [
        'vessel_id',
        'agent_id',
        'status',
        'docking_time',
        'duration',
        'location',
        'reason',
        'rejection_reason',
        'wharf_id',
        'wharf_assigned_at',
    ];

    protected $casts = [
        'docking_time' => 'datetime',
        'wharf_assigned_at' => 'datetime',
    ];

    public function vessel()
    {
        return $this->belongsTo(Vessel::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function wharf()
    {
        return $this->belongsTo(Wharf::class);
    }
}
