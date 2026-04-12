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
        'customer_email',
        'customer_name',
        'customer_phone',
        'plan_name',
        'subscription_id',
        'currency',
        'billing_cycle',
        'falakcart_user_id',
        'webhook_data',
    ];

    public function affiliate()
    {
        return $this->belongsTo(Affiliate::class);
    }
}
