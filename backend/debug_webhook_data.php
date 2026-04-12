<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Sale;

echo "🔍 فحص الـ webhook data للمبيعات الأخيرة:\n";
echo "=" . str_repeat("=", 50) . "\n\n";

$recentSales = Sale::whereNotNull('webhook_data')
                  ->orderBy('created_at', 'desc')
                  ->take(3)
                  ->get();

foreach ($recentSales as $sale) {
    echo "💰 مبيعة ID: {$sale->id}\n";
    echo "   العميل: {$sale->customer_name}\n";
    echo "   العمولة: {$sale->commission_amount}\n";
    
    $webhookData = json_decode($sale->webhook_data, true);
    $referralCode = $webhookData['referral']['referral_code'] ?? 'غير محدد';
    echo "   الكود في webhook_data: '$referralCode'\n";
    
    // Test the LIKE query
    $testQuery = "SELECT * FROM sales WHERE webhook_data LIKE '%\"referral_code\":\"$referralCode\"%'";
    echo "   Test Query: $testQuery\n";
    
    // Test if this sale would be found by our query
    $found = Sale::where('webhook_data', 'LIKE', '%"referral_code":"' . $referralCode . '"%')->count();
    echo "   Found by query: $found\n";
    
    echo "   Raw webhook_data:\n";
    echo "   " . substr($sale->webhook_data, 0, 200) . "...\n";
    echo "   ---\n\n";
}

// Test specific searches
echo "🔍 اختبار البحث عن الكودات المحددة:\n";
$testCodes = ['8a1ff41e-load', '8a1ff41e-luanda'];

foreach ($testCodes as $code) {
    $found = Sale::where('webhook_data', 'LIKE', '%"referral_code":"' . $code . '"%')->get();
    echo "   البحث عن '$code': " . $found->count() . " نتيجة\n";
    
    foreach ($found as $sale) {
        echo "     - مبيعة {$sale->id}: {$sale->customer_name} - {$sale->commission_amount}\n";
    }
}