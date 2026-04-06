<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AffiliateLink extends Model
{
    protected $fillable = [
        'affiliate_id',
        'name',
        'slug',
        'source',
        'is_active',
    ];

    public function affiliate()
    {
        return $this->belongsTo(Affiliate::class);
    }
}
