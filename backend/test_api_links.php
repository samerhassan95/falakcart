<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Affiliate;
use App\Models\AffiliateLink;
use App\Models\Click;
use App\Models\Sale;

echo "🔗 Testing getLinks() API method logic:\n";
echo "=" . str_repeat("=", 40) . "\n\n";

$affiliate = Affiliate::where('referral_code', '8A1FF41E')->first();
if (!$affiliate) {
    echo "❌ Affiliate not found\n";
    exit;
}

echo "✅ Found affiliate: {$affiliate->user->name} (ID: {$affiliate->id})\n\n";

$links = AffiliateLink::where('affiliate_id', $affiliate->id)
    ->orderByDesc('created_at')
    ->get()
    ->map(function ($link) {
        $clicks = Click::where('referral_code', $link->slug)->count();
        
        // This is the fixed logic from AffiliateController
        $sales = Sale::where('affiliate_id', $link->affiliate_id)
            ->whereRaw("JSON_EXTRACT(webhook_data, '$.referral.referral_code') = ?", [$link->slug])
            ->get();
        
        $conversions = $sales->count();
        $earnings = $sales->sum('commission_amount');

        return [
            'id'           => $link->id,
            'name'         => $link->name,
            'slug'         => $link->slug,
            'referral_url' => config('app.falakcart_main_url', 'https://falakcart.com') . '/register?ref=' . $link->slug,
            'clicks'       => $clicks,
            'conversions'  => $conversions,
            'earnings'     => (float) $earnings,
            'is_active'    => $link->is_active,
            'created_at'   => $link->created_at->format('M d, Y'),
        ];
    });

echo "📊 API Response Data:\n";
foreach ($links as $link) {
    echo "🔗 Link: {$link['name']}\n";
    echo "   Slug: {$link['slug']}\n";
    echo "   URL: {$link['referral_url']}\n";
    echo "   Clicks: {$link['clicks']}\n";
    echo "   Conversions: {$link['conversions']}\n";
    echo "   Earnings: \${$link['earnings']}\n";
    echo "   Active: " . ($link['is_active'] ? 'Yes' : 'No') . "\n";
    echo "   Created: {$link['created_at']}\n\n";
}

echo "🌐 Total Summary:\n";
echo "   Total Links: " . $links->count() . "\n";
echo "   Total Clicks: " . $links->sum('clicks') . "\n";
echo "   Total Earnings: $" . $links->sum('earnings') . "\n";