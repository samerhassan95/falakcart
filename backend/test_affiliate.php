<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Test creating an affiliate
try {
    $affiliate = \App\Models\Affiliate::create([
        'user_id' => 1,
        'referral_code' => 'TEST123',
        'status' => 'active'
    ]);
    echo "Created affiliate: " . $affiliate->referral_code . "\n";
} catch (Exception $e) {
    echo "Error creating affiliate: " . $e->getMessage() . "\n";
}

// Test the tracking controller directly
try {
    $request = new \Illuminate\Http\Request();
    $request->merge(['ref' => 'TEST123']);
    
    $controller = new \App\Http\Controllers\TrackingController();
    $response = $controller->recordClick($request);
    
    echo "Controller response: " . $response->getContent() . "\n";
} catch (Exception $e) {
    echo "Error in controller: " . $e->getMessage() . "\n";
}