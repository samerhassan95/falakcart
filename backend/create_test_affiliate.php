<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Affiliate;

try {
    // Create test user
    $user = User::firstOrCreate(
        ['email' => 'test@affiliate.com'],
        [
            'name' => 'Test Affiliate',
            'password' => bcrypt('password'),
            'role' => 'affiliate'
        ]
    );

    // Create test affiliate
    $affiliate = Affiliate::firstOrCreate(
        ['user_id' => $user->id],
        [
            'referral_code' => 'FRIEND2025',
            'commission_rate' => 10.0,
            'commission_type' => 'percentage',
            'commission_strategy' => 'flat',
            'status' => 'active',
            'total_earnings' => 0,
            'available_balance' => 0
        ]
    );

    echo "✅ Created test affiliate successfully!\n";
    echo "User ID: {$user->id}\n";
    echo "Affiliate ID: {$affiliate->id}\n";
    echo "Referral Code: {$affiliate->referral_code}\n";
    echo "Commission Rate: {$affiliate->commission_rate}%\n";
    echo "Status: {$affiliate->status}\n";

} catch (Exception $e) {
    echo "❌ Error creating test affiliate: " . $e->getMessage() . "\n";
}