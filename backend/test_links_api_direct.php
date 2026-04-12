<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Affiliate;
use App\Models\AffiliateLink;
use App\Models\Sale;
use App\Models\Click;

echo "🔍 اختبار API الروابط مباشرة\n";
echo "=" . str_repeat("=", 40) . "\n\n";

$affiliate = Affiliate::where('referral_code', '8A1FF41E')->first();

echo "📊 اختبار الحسابات يدوياً:\n";
$links = AffiliateLink::where('affiliate_id', $affiliate->id)->get();

foreach ($links as $link) {
    echo "\n🔗 الرابط: {$link->slug}\n";
    
    // Count clicks
    $clicks = Click::where('referral_code', $link->slug)->count();
    echo "   النقرات: $clicks\n";
    
    // Count sales using webhook data
    $sales = Sale::where('affiliate_id', $link->affiliate_id)
        ->where(function($query) use ($link) {
            $query->where('webhook_data', 'LIKE', '%"referral_code":"' . $link->slug . '"%')
                  ->orWhere('reference_id', 'LIKE', '%' . $link->slug . '%');
        })
        ->get();
    
    $conversions = $sales->count();
    $earnings = $sales->sum('commission_amount');
    
    echo "   المبيعات: $conversions\n";
    echo "   الأرباح: $earnings\n";
    
    // Show individual sales
    foreach ($sales as $sale) {
        echo "     - مبيعة: {$sale->customer_name} - {$sale->commission_amount}\n";
    }
}

echo "\n🌐 اختبار API endpoint مباشرة:\n";

// Simulate the API call
$affiliate = Affiliate::where('referral_code', '8A1FF41E')->first();

$links = AffiliateLink::where('affiliate_id', $affiliate->id)
    ->orderByDesc('created_at')
    ->get()
    ->map(function ($link) {
        $clicks = Click::where('referral_code', $link->slug)->count();
        
        // Fix: Get sales by referral code from webhook data
        $sales = Sale::where('affiliate_id', $link->affiliate_id)
            ->where(function($query) use ($link) {
                $query->where('webhook_data', 'LIKE', '%"referral_code":"' . $link->slug . '"%')
                      ->orWhere('reference_id', 'LIKE', '%' . $link->slug . '%');
            })
            ->get();
        
        $conversions = $sales->count();
        $earnings = $sales->sum('commission_amount');

        return [
            'id'           => $link->id,
            'name'         => $link->name,
            'slug'         => $link->slug,
            'referral_url' => 'https://falakcart.com/register?ref=' . $link->slug,
            'clicks'       => $clicks,
            'conversions'  => $conversions,
            'earnings'     => (float) $earnings,
            'is_active'    => $link->is_active,
            'created_at'   => $link->created_at->format('M d, Y'),
        ];
    });

echo "API Response:\n";
echo json_encode($links->toArray(), JSON_PRETTY_PRINT);

echo "\n\n🎯 الروابط اللي المفروض يكون عليها أرباح:\n";
foreach ($links as $link) {
    if ($link['earnings'] > 0) {
        echo "✅ {$link['name']}: {$link['clicks']} clicks, {$link['conversions']} conversions, \${$link['earnings']} earnings\n";
    }
}