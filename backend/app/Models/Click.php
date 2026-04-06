<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Click extends Model
{
    protected $fillable = [
        'affiliate_id',
        'ip_address',
        'user_agent',
        'referral_code',
    ];

    public function affiliate()
    {
        return $this->belongsTo(Affiliate::class);
    }
}
