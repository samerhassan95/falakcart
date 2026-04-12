<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$affiliate = \App\Models\Affiliate::where('referral_code', '8A1FF41E')->first();

if (!$affiliate) {
    echo "❌ Affiliate not found\n";
    exit;
}

echo "=== Affiliate Details ===\n";
echo "Bank Name: " . ($affiliate->bank_name ?: 'Not set') . "\n";
echo "Account Number: " . ($affiliate->account_number ?: 'Not set') . "\n";
echo "Account Holder: " . ($affiliate->account_holder_name ?: 'Not set') . "\n";
echo "Available Balance: $" . number_format($affiliate->available_balance, 2) . "\n";
echo "Minimum Payout: $" . number_format($affiliate->minimum_payout ?? 50, 2) . "\n";

// Test the payout API directly
echo "\n=== Testing Payout API ===\n";

// Mock authentication
$user = \App\Models\User::find($affiliate->user_id);
\Illuminate\Support\Facades\Auth::login($user);

$controller = new \App\Http\Controllers\AffiliateController();
$request = new \Illuminate\Http\Request();

try {
    $response = $controller->requestPayout($request);
    $data = json_decode($response->getContent(), true);
    
    if ($response->getStatusCode() === 200) {
        echo "✅ Payout API works: " . $data['message'] . "\n";
        echo "   Amount: $" . number_format($data['amount'], 2) . "\n";
    } else {
        echo "❌ Payout API error: " . ($data['error'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
}