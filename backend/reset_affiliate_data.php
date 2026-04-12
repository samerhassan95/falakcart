<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Resetting Affiliate Data ===\n\n";

// Find the affiliate
$affiliate = \App\Models\Affiliate::where('referral_code', '8A1FF41E')->first();

if (!$affiliate) {
    echo "❌ Affiliate not found\n";
    exit;
}

echo "✅ Found affiliate: {$affiliate->referral_code}\n";

// Clear old data
echo "\n🧹 Cleaning old data...\n";
\App\Models\Click::where('affiliate_id', $affiliate->id)->delete();
\App\Models\Sale::where('affiliate_id', $affiliate->id)->delete();
\App\Models\Transaction::where('affiliate_id', $affiliate->id)->delete();

// Reset affiliate balances
$affiliate->update([
    'total_earnings' => 0,
    'current_balance' => 0,
    'available_balance' => 0,
    'pending_balance' => 0,
    'paid_balance' => 0
]);

echo "✅ Data cleaned\n";

// Add some test clicks
echo "\n📊 Adding test clicks...\n";
for ($i = 1; $i <= 7; $i++) {
    \App\Models\Click::create([
        'affiliate_id' => $affiliate->id,
        'ip_address' => '127.0.0.' . $i,
        'user_agent' => 'Test Browser ' . $i,
        'referral_code' => $affiliate->referral_code,
        'created_at' => now()->subDays(rand(1, 7))
    ]);
}

echo "✅ Added 7 test clicks\n";

// Add some test sales
echo "\n💰 Adding test sales...\n";
for ($i = 1; $i <= 3; $i++) {
    $amount = 299.99;
    $commission = $amount * 0.10; // 10% commission
    
    $sale = \App\Models\Sale::create([
        'affiliate_id' => $affiliate->id,
        'amount' => $amount,
        'commission_amount' => $commission,
        'status' => 'completed',
        'reference_id' => 'ORDER-TEST-' . $i,
        'created_at' => now()->subDays(rand(1, 5))
    ]);
    
    // Add transaction
    \App\Models\Transaction::create([
        'affiliate_id' => $affiliate->id,
        'type' => 'commission',
        'amount' => $commission,
        'description' => 'Commission from sale #' . $sale->id,
        'status' => 'completed'
    ]);
    
    echo "  ✅ Sale #{$i}: $" . number_format($amount, 2) . " (Commission: $" . number_format($commission, 2) . ")\n";
}

// Update affiliate totals
$totalEarnings = \App\Models\Transaction::where('affiliate_id', $affiliate->id)->sum('amount');
$affiliate->update([
    'total_earnings' => $totalEarnings,
    'available_balance' => $totalEarnings,
    'current_balance' => $totalEarnings
]);

echo "\n📈 Final Stats:\n";
echo "   Clicks: " . \App\Models\Click::where('affiliate_id', $affiliate->id)->count() . "\n";
echo "   Sales: " . \App\Models\Sale::where('affiliate_id', $affiliate->id)->count() . "\n";
echo "   Total Earnings: $" . number_format($totalEarnings, 2) . "\n";
echo "   Conversion Rate: " . round((3/7) * 100, 1) . "%\n";

echo "\n🎉 Data reset complete!\n";
echo "💡 Refresh your dashboard to see the updated stats.\n";