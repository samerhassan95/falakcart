<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Sale;

echo "🔍 فحص الـ JSON structure:\n";
echo "=" . str_repeat("=", 40) . "\n\n";

$sale = Sale::whereNotNull('webhook_data')->orderBy('created_at', 'desc')->first();

echo "📄 الـ webhook_data كامل:\n";
echo $sale->webhook_data . "\n\n";

$webhookData = json_decode($sale->webhook_data, true);
echo "📊 البنية:\n";
print_r($webhookData);

echo "\n🔍 اختبار طرق بحث مختلفة:\n";

$testCode = '8a1ff41e-load';

// Method 1: Search for just the code
$found1 = Sale::where('webhook_data', 'LIKE', '%' . $testCode . '%')->count();
echo "1. البحث عن الكود فقط: $found1\n";

// Method 2: Search with different JSON structure
$found2 = Sale::where('webhook_data', 'LIKE', '%"referral_code": "' . $testCode . '"%')->count();
echo "2. البحث مع مسافة: $found2\n";

// Method 3: Search with escaped quotes
$found3 = Sale::where('webhook_data', 'LIKE', '%\"referral_code\":\"' . $testCode . '\"%')->count();
echo "3. البحث مع escaped quotes: $found3\n";

// Method 4: Use JSON_EXTRACT (MySQL specific)
try {
    $found4 = Sale::whereRaw("JSON_EXTRACT(webhook_data, '$.referral.referral_code') = ?", [$testCode])->count();
    echo "4. البحث بـ JSON_EXTRACT: $found4\n";
} catch (Exception $e) {
    echo "4. JSON_EXTRACT failed: " . $e->getMessage() . "\n";
}