<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnchorageRequest extends Model
{
    protected $fillable = [
        'vessel_id',
        'agent_id',
        'status',
        'duration',
        'location',
        'reason',
        'rejection_reason',
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
