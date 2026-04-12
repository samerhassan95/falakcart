<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Affiliate;
use App\Models\AffiliateLink;
use App\Models\Sale;
use App\Models\Click;

echo "🔍 تحليل مشاكل البيانات\n";
echo "=" . str_repeat("=", 50) . "\n\n";

// 1. Check main affiliate
$affiliate = Affiliate::where('referral_code', '8A1FF41E')->first();
if ($affiliate) {
    echo "👤 الأفلييت الرئيسي:\n";
    echo "   الكود: {$affiliate->referral_code}\n";
    echo "   الرصيد: {$affiliate->available_balance}\n";
    echo "   إجمالي الأرباح: {$affiliate->total_earnings}\n";
    echo "   المبيعات: " . $affiliate->sales()->count() . "\n";
    echo "   النقرات: " . $affiliate->clicks()->count() . "\n\n";
}

// 2. Check custom links
echo "🔗 الروابط المخصصة:\n";
$customLinks = AffiliateLink::where('affiliate_id', $affiliate->id)->get();
foreach ($customLinks as $link) {
    echo "   الرابط: {$link->slug}\n";
    echo "   النقرات: " . Click::where('referral_code', $link->slug)->count() . "\n";
    echo "   المبيعات: " . Sale::where('reference_id', 'LIKE', '%' . $link->slug . '%')->count() . "\n";
    echo "   الأرباح: " . Sale::where('reference_id', 'LIKE', '%' . $link->slug . '%')->sum('commission_amount') . "\n";
    echo "   ---\n";
}

// 3. Check recent sales
echo "\n💰 آخر 5 مبيعات:\n";
$recentSales = Sale::where('affiliate_id', $affiliate->id)
                  ->orderBy('created_at', 'desc')
                  ->take(5)
                  ->get();

foreach ($recentSales as $sale) {
    echo "   العميل: {$sale->customer_name}\n";
    echo "   المبلغ: {$sale->amount} {$sale->currency}\n";
    echo "   العمولة: {$sale->commission_amount}\n";
    echo "   الكود المستخدم: " . (json_decode($sale->webhook_data, true)['referral']['referral_code'] ?? 'غير محدد') . "\n";
    echo "   التاريخ: {$sale->created_at}\n";
    echo "   ---\n";
}

// 4. Check clicks by referral code
echo "\n👆 النقرات حسب الكود:\n";
$clicksByCode = Click::where('affiliate_id', $affiliate->id)
                    ->selectRaw('referral_code, COUNT(*) as count')
                    ->groupBy('referral_code')
                    ->get();

foreach ($clicksByCode as $click) {
    echo "   الكود: {$click->referral_code} → {$click->count} نقرة\n";
}

// 5. Check if custom links exist in affiliate_links table
echo "\n📊 جدول affiliate_links:\n";
$allLinks = AffiliateLink::where('affiliate_id', $affiliate->id)->get();
foreach ($allLinks as $link) {
    echo "   ID: {$link->id}, Slug: {$link->slug}, URL: {$link->destination_url}\n";
}