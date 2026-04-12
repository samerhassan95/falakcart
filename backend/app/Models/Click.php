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
        'customer_email',
        'customer_name',
        'utm_source',
        'utm_medium',
        'utm_campaign',
    ];

    public function affiliate()
    {
        return $this->belongsTo(Affiliate::class);
    }
}
