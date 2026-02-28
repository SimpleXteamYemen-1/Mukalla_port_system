<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Container extends Model
{
    protected $fillable = [
        'manifest_id',
        'container_number',
        'type',
        'weight',
        'trader_email',
        'status',
        'block',
        'row',
        'tier',
    ];

    public function manifest()
    {
        return $this->belongsTo(CargoManifest::class , 'manifest_id');
    }

    public function dischargeRequest()
    {
        return $this->hasOne(DischargeRequest::class);
    }
//
}
