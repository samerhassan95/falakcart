<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Affiliate;

// Load Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🧪 Setting up test data for affiliate tracking...\n\n";

try {
    // Create test affiliates if they don't exist
    $testAffiliates = [
        [
            'referral_code' => 'TEST123',
            'name' => 'Test Affiliate 1',
            'email' => 'test1@example.com',
            'commission_rate' => 10.00
        ],
        [
            'referral_code' => 'DEMO456',
            'name' => 'Demo Affiliate 2', 
            'email' => 'demo@example.com',
            'commission_rate' => 15.00
        ],
        [
            'referral_code' => 'PARTNER789',
            'name' => 'Partner Affiliate 3',
            'email' => 'partner@example.com',
            'commission_rate' => 12.50
        ]
    ];

    foreach ($testAffiliates as $affiliateData) {
        // Check if user exists
        $user = User::where('email', $affiliateData['email'])->first();
        
        if (!$user) {
            // Create user
            $user = User::create([
                'name' => $affiliateData['name'],
                'email' => $affiliateData['email'],
                'password' => bcrypt('password123'),
                'role' => 'affiliate'
            ]);
            echo "✅ Created user: {$affiliateData['name']}\n";
        }

        // Check if affiliate exists
        $affiliate = Affiliate::where('referral_code', $affiliateData['referral_code'])->first();
        
        if (!$affiliate) {
            // Create affiliate
            $affiliate = Affiliate::create([
                'user_id' => $user->id,
                'referral_code' => $affiliateData['referral_code'],
                'commission_rate' => $affiliateData['commission_rate'],
                'status' => 'active',
                'total_earnings' => 0,
                'current_balance' => 0,
                'total_clicks' => 0,
                'total_sales' => 0
            ]);
            echo "✅ Created affiliate: {$affiliateData['referral_code']} (Rate: {$affiliateData['commission_rate']}%)\n";
        } else {
            echo "ℹ️  Affiliate {$affiliateData['referral_code']} already exists\n";
        }
    }

    echo "\n🎉 Test data setup complete!\n\n";
    echo "📋 Test Affiliate Codes:\n";
    echo "   - TEST123 (10% commission)\n";
    echo "   - DEMO456 (15% commission)\n";
    echo "   - PARTNER789 (12.5% commission)\n\n";
    
    echo "🧪 How to test:\n";
    echo "1. Open FALAKCART_TEST_PAGE.html in your browser\n";
    echo "2. Click 'Click with ref=TEST123' button\n";
    echo "3. Select a subscription plan\n";
    echo "4. Fill customer details and complete subscription\n";
    echo "5. Check your affiliate dashboard for results\n\n";
    
    echo "🌐 URLs:\n";
    echo "   - Test Page: file:///" . __DIR__ . "/../FALAKCART_TEST_PAGE.html\n";
    echo "   - Frontend: http://localhost:3000\n";
    echo "   - Backend API: http://localhost:8000/api\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}