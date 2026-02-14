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
    ];

    protected $casts = [
        'docking_time' => 'datetime',
    ];

    public function vessel()
    {
        return $this->belongsTo(Vessel::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}
