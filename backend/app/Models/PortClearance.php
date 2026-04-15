<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortClearance extends Model
{
    protected $fillable = [
        'vessel_id',
        'officer_id',
        'issue_date',
        'expiry_date',
        'status',
        'next_port',
        'certificate_path',
        'rejection_reason',
    ];

    protected $casts = [
        'issue_date' => 'datetime',
        'expiry_date' => 'datetime',
    ];

    public function vessel()
    {
        return $this->belongsTo(Vessel::class);
    }

    public function officer()
    {
        return $this->belongsTo(User::class, 'officer_id');
    }
}
