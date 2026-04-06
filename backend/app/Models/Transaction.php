<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'affiliate_id',
        'type',
        'amount',
        'status',
        'source',
        'reference_id',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function affiliate()
    {
        return $this->belongsTo(Affiliate::class);
    }
}
