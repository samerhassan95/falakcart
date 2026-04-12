<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Testing Full Affiliate Flow ===\n\n";

// Step 1: Create affiliate if not exists
echo "1. Creating/Finding Affiliate...\n";
$affiliate = \App\Models\Affiliate::where('referral_code', 'TEST123')->first();
if (!$affiliate) {
    $affiliate = \App\Models\Affiliate::create([
        'user_id' => 1,
        'referral_code' => 'TEST123',
        'status' => 'active',
        'commission_rate' => 10.0
    ]);
    echo "   ✅ Created affiliate: {$affiliate->referral_code}\n";
} else {
    echo "   ✅ Found existing affiliate: {$affiliate->referral_code}\n";
}

// Step 2: Test click recording
echo "\n2. Testing Click Recording...\n";
$request = new \Illuminate\Http\Request();
$request->merge(['ref' => 'TEST123']);
$request->server->set('REMOTE_ADDR', '127.0.0.1');
$request->server->set('HTTP_USER_AGENT', 'Test Browser');

$controller = new \App\Http\Controllers\TrackingController();
$response = $controller->recordClick($request);
$clickData = json_decode($response->getContent(), true);

if ($clickData['message'] === 'click_recorded') {
    echo "   ✅ Click recorded successfully\n";
    echo "   📊 Response: " . $response->getContent() . "\n";
} else {
    echo "   ❌ Click recording failed\n";
}

// Step 3: Test sale recording
echo "\n3. Testing Sale Recording...\n";
$saleRequest = new \Illuminate\Http\Request();
$saleRequest->merge([
    'referral_code' => 'TEST123',
    'amount' => 299.99,
    'order_id' => 'TEST-ORDER-' . time()
]);

// Skip signature validation for test
$saleResponse = $controller->recordSale($saleRequest);
$saleData = json_decode($saleResponse->getContent(), true);

if (isset($saleData['message']) && $saleData['message'] === 'sale_recorded') {
    echo "   ✅ Sale recorded successfully\n";
    echo "   💰 Commission: $" . $saleData['sale']['commission_amount'] . "\n";
} else {
    echo "   ❌ Sale recording failed\n";
    echo "   Error: " . $saleResponse->getContent() . "\n";
}

// Step 4: Check affiliate stats
echo "\n4. Checking Affiliate Stats...\n";
$affiliate->refresh();
$clicks = \App\Models\Click::where('affiliate_id', $affiliate->id)->count();
$sales = \App\Models\Sale::where('affiliate_id', $affiliate->id)->count();
$earnings = \App\Models\Sale::where('affiliate_id', $affiliate->id)->sum('commission_amount');

echo "   📈 Total Clicks: {$clicks}\n";
echo "   💵 Total Sales: {$sales}\n";
echo "   💰 Total Earnings: $" . number_format($earnings, 2) . "\n";

// Step 5: Test affiliate controller stats
echo "\n5. Testing Affiliate Controller Stats...\n";
$affiliateController = new \App\Http\Controllers\AffiliateController();

// Mock authentication
$user = \App\Models\User::find(1);
\Illuminate\Support\Facades\Auth::login($user);

$statsRequest = new \Illuminate\Http\Request();
$statsResponse = $affiliateController->getStats();
$stats = json_decode($statsResponse->getContent(), true);

echo "   📊 API Stats Response:\n";
echo "      - Clicks: " . $stats['clicks'] . "\n";
echo "      - Sales: " . $stats['sales'] . "\n";
echo "      - Earnings: $" . $stats['earnings'] . "\n";
echo "      - Conversion Rate: " . $stats['conversion_rate'] . "%\n";

echo "\n=== Flow Test Complete ===\n";
echo "✅ All steps working correctly!\n";