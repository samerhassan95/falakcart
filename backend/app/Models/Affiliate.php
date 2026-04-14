<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Affiliate extends Model
{
    protected $fillable = [
        'user_id',
        'referral_code',
        'status',
        'commission_rate',
        'commission_type',
        'commission_strategy',
        'commission_tiers',
        'total_earnings',
        'available_balance',
        'pending_balance',
        'paid_balance',
        'bank_name',
        'account_number',
        'account_holder_name',
        'iban',
        'minimum_payout',
        'bio',
        'avatar',
        'phone',
        'website',
        'email_notifications',
        'sms_notifications',
        'marketing_emails',
        'weekly_reports',
        'two_factor_enabled',
    ];

    protected $casts = [
        'commission_rate'   => 'float',
        'commission_tiers'  => 'array',
        'total_earnings'    => 'float',
        'available_balance' => 'float',
        'pending_balance'   => 'float',
        'paid_balance'      => 'float',
        'email_notifications' => 'boolean',
        'sms_notifications' => 'boolean',
        'marketing_emails'  => 'boolean',
        'weekly_reports'    => 'boolean',
        'two_factor_enabled' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function clicks()
    {
        return $this->hasMany(Click::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function links()
    {
        return $this->hasMany(AffiliateLink::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public static function generateUniqueCode()
    {
        do {
            $code = strtoupper(substr(md5(uniqid()), 0, 8));
        } while (self::where('referral_code', $code)->exists());

        return $code;
    }
}
