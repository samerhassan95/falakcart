<?php

require_once 'vendor/autoload.php';

// Load Laravel application
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Affiliate;

echo "Checking for referral code: 8a1ff41e\n";
echo "=====================================\n\n";

$affiliate = Affiliate::where('referral_code', '8a1ff41e')->first();

if ($affiliate) {
    echo "✅ Found affiliate:\n";
    echo "   Name: " . $affiliate->name . "\n";
    echo "   Email: " . $affiliate->email . "\n";
    echo "   ID: " . $affiliate->id . "\n";
    echo "   Status: " . $affiliate->status . "\n";
    echo "   Commission Rate: " . $affiliate->commission_rate . "%\n";
} else {
    echo "❌ Referral code '8a1ff41e' not found in system\n";
    echo "\nCreating test affiliate with this referral code...\n";
    
    try {
        $affiliate = Affiliate::create([
            'name' => 'FalakCart Test Affiliate',
            'email' => 'test-affiliate@falakcart.com',
            'referral_code' => '8a1ff41e',
            'commission_rate' => 10.0,
            'status' => 'active',
            'phone' => '+1234567890',
            'website' => 'https://falakcart-test.com'
        ]);
        
        echo "✅ Created test affiliate:\n";
        echo "   Name: " . $affiliate->name . "\n";
        echo "   Email: " . $affiliate->email . "\n";
        echo "   Referral Code: " . $affiliate->referral_code . "\n";
        echo "   ID: " . $affiliate->id . "\n";
        
    } catch (Exception $e) {
        echo "❌ Error creating affiliate: " . $e->getMessage() . "\n";
    }
}

echo "\n";