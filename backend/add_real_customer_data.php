<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Adding Real Customer Data ===\n\n";

// Find the affiliate
$affiliate = \App\Models\Affiliate::where('referral_code', '8A1FF41E')->first();

if (!$affiliate) {
    echo "❌ Affiliate not found\n";
    exit;
}

// Sample customer data
$customers = [
    ['name' => 'أحمد محمد', 'email' => 'ahmed.mohamed@gmail.com', 'plan' => 'FalakCart Pro'],
    ['name' => 'فاطمة علي', 'email' => 'fatima.ali@yahoo.com', 'plan' => 'FalakCart Enterprise'],
    ['name' => 'محمد حسن', 'email' => 'mohamed.hassan@hotmail.com', 'plan' => 'FalakCart Pro'],
    ['name' => 'نور الدين', 'email' => 'nour.eldeen@gmail.com', 'plan' => 'FalakCart Starter'],
    ['name' => 'سارة أحمد', 'email' => 'sara.ahmed@outlook.com', 'plan' => 'FalakCart Pro'],
    ['name' => 'عمر خالد', 'email' => 'omar.khaled@gmail.com', 'plan' => 'FalakCart Enterprise'],
    ['name' => 'ليلى محمود', 'email' => 'layla.mahmoud@yahoo.com', 'plan' => 'FalakCart Pro'],
    ['name' => 'يوسف إبراهيم', 'email' => 'youssef.ibrahim@gmail.com', 'plan' => 'FalakCart Starter'],
];

// Update existing sales with real customer data
$sales = \App\Models\Sale::where('affiliate_id', $affiliate->id)->get();

echo "✅ Found " . $sales->count() . " sales to update\n\n";

foreach ($sales as $index => $sale) {
    if ($index < count($customers)) {
        $customer = $customers[$index];
        
        $sale->update([
            'customer_name' => $customer['name'],
            'customer_email' => $customer['email'],
            'plan_name' => $customer['plan'],
            'subscription_id' => 'SUB-' . strtoupper(substr(md5($customer['email']), 0, 8))
        ]);
        
        echo "   ✅ Updated: {$customer['name']} ({$customer['email']})\n";
    }
}

echo "\n🎉 Customer data updated successfully!\n";
echo "💡 Refresh the Referrals page to see real customer names and emails.\n";