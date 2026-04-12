<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$affiliate = \App\Models\Affiliate::where('referral_code', '8A1FF41E')->first();

if (!$affiliate) {
    echo "❌ Affiliate not found\n";
    exit;
}

// Update bank details
$affiliate->update([
    'bank_name' => 'البنك الأهلي المصري',
    'account_number' => '1234567890124210',
    'account_holder_name' => 'سامر حسان',
    'iban' => 'EG380003000012345678901234',
    'minimum_payout' => 50.00
]);

echo "✅ Bank details updated successfully!\n";
echo "   Bank: {$affiliate->bank_name}\n";
echo "   Account: ****" . substr($affiliate->account_number, -4) . "\n";
echo "   Holder: {$affiliate->account_holder_name}\n";

// Test payout again
echo "\n=== Testing Payout Again ===\n";

$user = \App\Models\User::find($affiliate->user_id);
\Illuminate\Support\Facades\Auth::login($user);

$controller = new \App\Http\Controllers\AffiliateController();
$request = new \Illuminate\Http\Request();

try {
    $response = $controller->requestPayout($request);
    $data = json_decode($response->getContent(), true);
    
    if ($response->getStatusCode() === 200) {
        echo "✅ Payout successful: " . $data['message'] . "\n";
        echo "   Amount: $" . number_format($data['amount'], 2) . "\n";
    } else {
        echo "❌ Payout error: " . ($data['error'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
}

echo "\n🎉 Now try the payout button in the frontend!\n";