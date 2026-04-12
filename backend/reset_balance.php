<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$affiliate = \App\Models\Affiliate::where('referral_code', '8A1FF41E')->first();

if (!$affiliate) {
    echo "❌ Affiliate not found\n";
    exit;
}

// Reset balances
$affiliate->update([
    'available_balance' => 660.00,
    'pending_balance' => 0.00,
    'paid_balance' => 0.00
]);

echo "✅ Balance reset successfully!\n";
echo "   Available: $" . number_format($affiliate->available_balance, 2) . "\n";
echo "   Pending: $" . number_format($affiliate->pending_balance, 2) . "\n";
echo "   Paid: $" . number_format($affiliate->paid_balance, 2) . "\n";

echo "\n🎉 Now try the payout button again!\n";