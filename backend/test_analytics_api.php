<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Testing Analytics API ===\n\n";

// Find the affiliate
$affiliate = \App\Models\Affiliate::where('referral_code', '8A1FF41E')->first();

if (!$affiliate) {
    echo "❌ Affiliate not found\n";
    exit;
}

// Mock authentication
$user = \App\Models\User::find($affiliate->user_id);
\Illuminate\Support\Facades\Auth::login($user);

echo "✅ Authenticated as: {$user->name}\n\n";

// Test the analytics API
$controller = new \App\Http\Controllers\AffiliateController();
$request = new \Illuminate\Http\Request();
$request->merge(['days' => 30]);

$response = $controller->getAnalytics($request);
$data = json_decode($response->getContent(), true);

echo "📊 Analytics API Response:\n";
echo "   Total Clicks: " . $data['summary']['total_clicks'] . "\n";
echo "   Total Referrals: " . $data['summary']['total_referrals'] . "\n";
echo "   Conversion Rate: " . $data['summary']['conversion_rate'] . "%\n";
echo "   Total Earnings: $" . number_format($data['summary']['total_earnings'], 2) . "\n";

echo "\n🔗 Top Links:\n";
foreach ($data['top_links'] as $link) {
    echo "   - {$link['name']}: {$link['clicks']} clicks, $" . number_format($link['earnings'], 2) . "\n";
}

echo "\n📈 Clicks per Day (last 5 days):\n";
$clicksPerDay = array_slice($data['clicks_per_day'], -5);
foreach ($clicksPerDay as $day) {
    echo "   - {$day['date']}: {$day['count']} clicks\n";
}

echo "\n💰 Earnings over Time (last 5 days):\n";
$earningsOverTime = array_slice($data['earnings_over_time'], -5);
foreach ($earningsOverTime as $day) {
    echo "   - {$day['date']}: $" . number_format($day['total'], 2) . "\n";
}

echo "\n🎉 Analytics API working correctly!\n";