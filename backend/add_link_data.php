<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Adding Link Test Data ===\n\n";

// Find the affiliate
$affiliate = \App\Models\Affiliate::where('referral_code', '8A1FF41E')->first();

if (!$affiliate) {
    echo "❌ Affiliate not found\n";
    exit;
}

// Get existing links
$links = \App\Models\AffiliateLink::where('affiliate_id', $affiliate->id)->get();

echo "✅ Found " . $links->count() . " links\n\n";

foreach ($links as $link) {
    echo "📊 Processing link: {$link->name} ({$link->slug})\n";
    
    // Add some test clicks for this specific link
    $clicksToAdd = rand(2, 8);
    for ($i = 1; $i <= $clicksToAdd; $i++) {
        \App\Models\Click::create([
            'affiliate_id' => $affiliate->id,
            'ip_address' => '192.168.1.' . rand(1, 254),
            'user_agent' => 'Test Browser for ' . $link->name,
            'referral_code' => $link->slug, // Use the custom slug
            'created_at' => now()->subDays(rand(1, 10))
        ]);
    }
    
    // Add some test sales for this link
    $salesToAdd = rand(1, 3);
    for ($i = 1; $i <= $salesToAdd; $i++) {
        $amount = 299.99;
        $commission = $amount * 0.10;
        
        $sale = \App\Models\Sale::create([
            'affiliate_id' => $affiliate->id,
            'amount' => $amount,
            'commission_amount' => $commission,
            'status' => 'completed',
            'reference_id' => 'ORDER-' . $link->slug . '-' . $i,
            'created_at' => now()->subDays(rand(1, 7))
        ]);
        
        // Add transaction linked to this specific link
        \App\Models\Transaction::create([
            'affiliate_id' => $affiliate->id,
            'type' => 'commission',
            'amount' => $commission,
            'description' => 'Commission from ' . $link->name . ' campaign',
            'source' => $link->name, // Link the transaction to the campaign
            'status' => 'completed'
        ]);
    }
    
    echo "   ✅ Added {$clicksToAdd} clicks and {$salesToAdd} sales\n";
}

// Update affiliate totals
$totalEarnings = \App\Models\Transaction::where('affiliate_id', $affiliate->id)->sum('amount');
$affiliate->update([
    'total_earnings' => $totalEarnings,
    'available_balance' => $totalEarnings,
    'current_balance' => $totalEarnings
]);

echo "\n📈 Summary:\n";
echo "   Total Links: " . $links->count() . "\n";
echo "   Total Clicks: " . \App\Models\Click::where('affiliate_id', $affiliate->id)->count() . "\n";
echo "   Total Sales: " . \App\Models\Sale::where('affiliate_id', $affiliate->id)->count() . "\n";
echo "   Total Earnings: $" . number_format($totalEarnings, 2) . "\n";

echo "\n🎉 Link data added successfully!\n";
echo "💡 Refresh the My Links page to see the updated stats.\n";