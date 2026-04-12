<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Adding Bank Details ===\n\n";

// Find the affiliate
$affiliate = \App\Models\Affiliate::where('referral_code', '8A1FF41E')->first();

if (!$affiliate) {
    echo "❌ Affiliate not found\n";
    exit;
}

// Add bank details
$affiliate->update([
    'bank_name' => 'البنك الأهلي المصري',
    'account_number' => '1234567890124210',
    'account_holder_name' => 'سامر حسان',
    'iban' => 'EG380003000012345678901234',
    'minimum_payout' => 50.00
]);

echo "✅ Bank details added:\n";
echo "   Bank: {$affiliate->bank_name}\n";
echo "   Account: ****" . substr($affiliate->account_number, -4) . "\n";
echo "   Holder: {$affiliate->account_holder_name}\n";
echo "   Minimum Payout: $" . number_format($affiliate->minimum_payout, 2) . "\n";

echo "\n🎉 Bank details updated successfully!\n";
echo "💡 Now you can test the payout system.\n";