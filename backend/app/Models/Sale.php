<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = [
        'affiliate_id',
        'amount',
        'commission_amount',
        'status',
        'reference_id',
    ];

    public function affiliate()
    {
        return $this->belongsTo(Affiliate::class);
    }
}
