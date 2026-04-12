<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Sale;

echo "🔍 آخر 3 مبيعات مع تفاصيل الـ webhook:\n";
echo "=" . str_repeat("=", 50) . "\n\n";

$recentSales = Sale::orderBy('created_at', 'desc')->take(3)->get();

foreach ($recentSales as $sale) {
    echo "💰 مبيعة ID: {$sale->id}\n";
    echo "   العميل: {$sale->customer_name}\n";
    echo "   المبلغ: {$sale->amount} {$sale->currency}\n";
    echo "   العمولة: {$sale->commission_amount}\n";
    echo "   Reference ID: {$sale->reference_id}\n";
    echo "   Subscription ID: {$sale->subscription_id}\n";
    
    if ($sale->webhook_data) {
        $webhookData = json_decode($sale->webhook_data, true);
        $referralCode = $webhookData['referral']['referral_code'] ?? 'غير محدد';
        echo "   الكود المستخدم: $referralCode\n";
    }
    
    echo "   التاريخ: {$sale->created_at}\n";
    echo "   ---\n\n";
}