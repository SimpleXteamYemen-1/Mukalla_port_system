<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Wharf extends Model
{
    protected $fillable = [
        'name',
        'status',
    ];

    public function vessels()
    {
        return $this->hasMany(Vessel::class, 'current_wharf_id');
    }
}
