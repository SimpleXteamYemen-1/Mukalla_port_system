<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vessel extends Model
{
    protected $fillable = [
        'name',
        'imo_number',
        'type',
        'flag',
        'owner_id',
        'status',
        'eta',
        'etd',
        'current_wharf_id',
    ];

    protected $casts = [
        'eta' => 'datetime',
        'etd' => 'datetime',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class , 'owner_id');
    }

    public function wharf()
    {
        return $this->belongsTo(Wharf::class , 'current_wharf_id');
    }

    public function manifests()
    {
        return $this->hasMany(CargoManifest::class);
    }

    public function clearances()
    {
        return $this->hasMany(PortClearance::class);
    }
}
