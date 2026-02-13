<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Container;
use App\Models\User;

class DischargeRequest extends Model
{
    protected $fillable = [
        'container_id',
        'trader_id',
        'status',
        'requested_date',
    ];

    protected $casts = [
        'requested_date' => 'datetime',
    ];

    public function container()
    {
        return $this->belongsTo(Container::class);
    }

    public function trader()
    {
        return $this->belongsTo(User::class, 'trader_id');
    }
    //
}
