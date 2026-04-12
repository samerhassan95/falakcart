<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Sale;

echo "🎯 اختبار نهائي للـ JSON_EXTRACT:\n";
echo "=" . str_repeat("=", 40) . "\n\n";

$testCodes = ['8a1ff41e-load', '8a1ff41e-luanda'];

foreach ($testCodes as $code) {
    echo "🔍 البحث عن: '$code'\n";
    
    $sales = Sale::whereRaw("JSON_EXTRACT(webhook_data, '$.referral.referral_code') = ?", [$code])->get();
    
    echo "   النتائج: " . $sales->count() . "\n";
    
    foreach ($sales as $sale) {
        echo "   ✅ مبيعة {$sale->id}: {$sale->customer_name} - \${$sale->commission_amount}\n";
    }
    echo "\n";
}

echo "🌐 اختبار الـ API الجديد:\n";

// Test the new API logic directly
use App\Models\Affiliate;
use App\Models\AffiliateLink;

$affiliate = Affiliate::where('referral_code', '8A1FF41E')->first();
$loadLink = AffiliateLink::where('slug', '8a1ff41e-load')->first();

if ($loadLink) {
    echo "🔗 رابط Load:\n";
    echo "   ID: {$loadLink->id}\n";
    echo "   Slug: {$loadLink->slug}\n";
    
    $sales = Sale::where('affiliate_id', $loadLink->affiliate_id)
        ->whereRaw("JSON_EXTRACT(webhook_data, '$.referral.referral_code') = ?", [$loadLink->slug])
        ->get();
    
    echo "   المبيعات: " . $sales->count() . "\n";
    echo "   الأرباح: " . $sales->sum('commission_amount') . "\n";
    
    foreach ($sales as $sale) {
        echo "     - {$sale->customer_name}: \${$sale->commission_amount}\n";
    }
}