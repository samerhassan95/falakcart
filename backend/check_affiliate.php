<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$code = '8A1FF41E';
$affiliate = \App\Models\Affiliate::where('referral_code', $code)->first();

if ($affiliate) {
    echo "✅ Found affiliate: {$affiliate->referral_code}\n";
    echo "   User ID: {$affiliate->user_id}\n";
    echo "   Status: {$affiliate->status}\n";
} else {
    echo "❌ Affiliate not found: {$code}\n";
    echo "Creating new affiliate...\n";
    
    $affiliate = \App\Models\Affiliate::create([
        'user_id' => 1,
        'referral_code' => $code,
        'status' => 'active',
        'commission_rate' => 10.0
    ]);
    
    echo "✅ Created affiliate: {$affiliate->referral_code}\n";
}

// Test the API call
echo "\nTesting API call...\n";
$request = new \Illuminate\Http\Request();
$request->merge(['ref' => $code]);
$request->server->set('REMOTE_ADDR', '127.0.0.1');

$controller = new \App\Http\Controllers\TrackingController();
$response = $controller->recordClick($request);

echo "Response: " . $response->getContent() . "\n";