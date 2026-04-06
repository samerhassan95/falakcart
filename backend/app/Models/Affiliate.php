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
        'current_balance',
    ];

    protected $casts = [
        'commission_rate'  => 'float',
        'commission_tiers' => 'array',
        'total_earnings'   => 'float',
        'current_balance'  => 'float',
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

    public static function generateUniqueCode()
    {
        do {
            $code = strtoupper(substr(md5(uniqid()), 0, 8));
        } while (self::where('referral_code', $code)->exists());

        return $code;
    }
}
