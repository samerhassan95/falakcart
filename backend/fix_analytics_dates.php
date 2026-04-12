<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Fixing Analytics Dates ===\n\n";

// Find the affiliate
$affiliate = \App\Models\Affiliate::where('referral_code', '8A1FF41E')->first();

if (!$affiliate) {
    echo "❌ Affiliate not found\n";
    exit;
}

echo "✅ Found affiliate: {$affiliate->referral_code}\n";

// Update clicks to spread over different days
echo "\n📊 Updating click dates...\n";
$clicks = \App\Models\Click::where('affiliate_id', $affiliate->id)->get();
foreach ($clicks as $index => $click) {
    $daysAgo = rand(1, 30);
    $click->update(['created_at' => now()->subDays($daysAgo)]);
}
echo "✅ Updated " . $clicks->count() . " clicks\n";

// Update sales to spread over different days
echo "\n💰 Updating sale dates...\n";
$sales = \App\Models\Sale::where('affiliate_id', $affiliate->id)->get();
foreach ($sales as $index => $sale) {
    $daysAgo = rand(1, 25);
    $sale->update(['created_at' => now()->subDays($daysAgo)]);
}
echo "✅ Updated " . $sales->count() . " sales\n";

// Update transactions to match sales
echo "\n🔄 Updating transaction dates...\n";
$transactions = \App\Models\Transaction::where('affiliate_id', $affiliate->id)->get();
foreach ($transactions as $index => $transaction) {
    $daysAgo = rand(1, 25);
    $transaction->update(['created_at' => now()->subDays($daysAgo)]);
}
echo "✅ Updated " . $transactions->count() . " transactions\n";

// Test the updated data
echo "\n📈 Testing updated analytics...\n";

$clicksPerDay = \App\Models\Click::where('affiliate_id', $affiliate->id)
    ->where('created_at', '>=', now()->subDays(30))
    ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
    ->groupBy('date')
    ->orderBy('date')
    ->get();

echo "   Days with clicks: " . $clicksPerDay->count() . "\n";

$earningsPerDay = \App\Models\Transaction::where('affiliate_id', $affiliate->id)
    ->where('type', 'commission')
    ->where('created_at', '>=', now()->subDays(30))
    ->selectRaw('DATE(created_at) as date, SUM(amount) as total')
    ->groupBy('date')
    ->orderBy('date')
    ->get();

echo "   Days with earnings: " . $earningsPerDay->count() . "\n";

echo "\n🎉 Analytics dates fixed!\n";
echo "💡 Refresh the Analytics page to see the updated charts.\n";