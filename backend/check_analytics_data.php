<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Affiliate;
use App\Models\Sale;
use App\Models\Click;
use App\Models\Transaction;

$affiliate = Affiliate::where('referral_code', '8A1FF41E')->first();

echo "📊 بيانات Analytics الصحيحة:\n";
echo "=" . str_repeat("=", 40) . "\n\n";

$totalClicks = Click::where('affiliate_id', $affiliate->id)->count();
$totalRefs = Sale::where('affiliate_id', $affiliate->id)->count();
$totalSubs = Sale::where('affiliate_id', $affiliate->id)->where('status', 'completed')->count();
$totalEarnings = Transaction::where('affiliate_id', $affiliate->id)->where('type', 'commission')->sum('amount');
$conversionRate = $totalClicks > 0 ? round(($totalRefs / $totalClicks) * 100, 1) : 0;

echo "Total Clicks: $totalClicks\n";
echo "Total Referrals: $totalRefs\n";
echo "Total Subscriptions: $totalSubs\n";
echo "Total Earnings: $totalEarnings\n";
echo "Conversion Rate: $conversionRate%\n\n";

echo "📋 تفاصيل المبيعات:\n";
$sales = Sale::where('affiliate_id', $affiliate->id)->get();
foreach ($sales as $sale) {
    echo "ID: {$sale->id}, Status: {$sale->status}, Amount: {$sale->amount}, Commission: {$sale->commission_amount}\n";
}

echo "\n🔗 اختبار API Analytics:\n";
// Test the actual API endpoint
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/affiliate/analytics');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . 'test-token', // You might need a real token
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";