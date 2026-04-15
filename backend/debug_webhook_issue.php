<?php

require_once 'vendor/autoload.php';

// Load Laravel application
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Affiliate;
use App\Models\Click;
use App\Models\Sale;
use App\Models\Notification;

echo "🔍 تشخيص مشكلة Webhook فلك كارت\n";
echo "================================\n\n";

// 1. فحص الـ Webhook Secret
echo "1️⃣ فحص إعدادات Webhook:\n";
echo "   Webhook URL: https://togaar.com/api/webhook/falakcart\n";
echo "   Webhook Secret: " . config('app.webhook_secret') . "\n";
echo "   Environment: " . config('app.env') . "\n\n";

// 2. فحص كود الإحالة
echo "2️⃣ فحص كود الإحالة 8a1ff41e:\n";
$affiliate = Affiliate::where('referral_code', '8a1ff41e')->first();
if ($affiliate) {
    echo "   ✅ تم العثور على الأفلييت:\n";
    echo "      الاسم: " . ($affiliate->name ?: 'غير محدد') . "\n";
    echo "      الإيميل: " . ($affiliate->email ?: 'غير محدد') . "\n";
    echo "      ID: " . $affiliate->id . "\n";
    echo "      الحالة: " . $affiliate->status . "\n";
    echo "      معدل العمولة: " . $affiliate->commission_rate . "%\n";
    echo "      User ID: " . ($affiliate->user_id ?: 'غير محدد') . "\n";
} else {
    echo "   ❌ لم يتم العثور على كود الإحالة!\n";
}
echo "\n";

// 3. فحص آخر الأنشطة
echo "3️⃣ فحص آخر الأنشطة:\n";
if ($affiliate) {
    $recentClicks = Click::where('affiliate_id', $affiliate->id)
                        ->orderBy('created_at', 'desc')
                        ->limit(5)
                        ->get();
    
    echo "   الكليكات الأخيرة (" . $recentClicks->count() . "):\n";
    foreach ($recentClicks as $click) {
        echo "      - " . $click->created_at . " | " . ($click->customer_email ?: 'لا يوجد إيميل') . "\n";
    }
    
    $recentSales = Sale::where('affiliate_id', $affiliate->id)
                      ->orderBy('created_at', 'desc')
                      ->limit(5)
                      ->get();
    
    echo "   المبيعات الأخيرة (" . $recentSales->count() . "):\n";
    foreach ($recentSales as $sale) {
        echo "      - " . $sale->created_at . " | " . $sale->amount . " | " . ($sale->customer_email ?: 'لا يوجد إيميل') . "\n";
    }
    
    $recentNotifications = Notification::where('user_id', $affiliate->user_id)
                                     ->orderBy('created_at', 'desc')
                                     ->limit(5)
                                     ->get();
    
    echo "   الإشعارات الأخيرة (" . $recentNotifications->count() . "):\n";
    foreach ($recentNotifications as $notification) {
        echo "      - " . $notification->created_at . " | " . $notification->title . "\n";
    }
}
echo "\n";

// 4. فحص الـ Logs
echo "4️⃣ فحص آخر سجلات النظام:\n";
$logFile = storage_path('logs/laravel.log');
if (file_exists($logFile)) {
    $logContent = file_get_contents($logFile);
    $lines = explode("\n", $logContent);
    $webhookLines = array_filter($lines, function($line) {
        return strpos($line, 'Webhook') !== false || strpos($line, 'webhook') !== false;
    });
    
    $recentWebhookLines = array_slice($webhookLines, -10);
    
    if (!empty($recentWebhookLines)) {
        echo "   آخر سجلات Webhook:\n";
        foreach ($recentWebhookLines as $line) {
            echo "      " . trim($line) . "\n";
        }
    } else {
        echo "   ❌ لا توجد سجلات webhook في الملف\n";
    }
} else {
    echo "   ❌ ملف السجلات غير موجود\n";
}
echo "\n";

// 5. اختبار الـ Webhook محلياً
echo "5️⃣ اختبار Webhook محلياً:\n";
$testPayload = [
    "event" => "affiliate.user.registered",
    "sent_at" => date('c'),
    "data" => [
        "callback_id" => "test-debug-" . uniqid(),
        "occurred_at" => date('c'),
        "referral" => [
            "source" => "website",
            "utm_medium" => "test",
            "utm_campaign" => "debug_test",
            "referral_code" => "8a1ff41e"
        ],
        "user" => [
            "id" => 999,
            "name" => "Test Debug User",
            "email" => "debug@test.com",
            "phone" => "1234567890"
        ]
    ]
];

// محاكاة استدعاء الـ webhook
try {
    $request = new \Illuminate\Http\Request();
    $request->merge($testPayload);
    $request->headers->set('X-Webhook-Signature', 'test-signature');
    $request->headers->set('Content-Type', 'application/json');
    
    $controller = new \App\Http\Controllers\TrackingController();
    $response = $controller->handleFalakCartWebhook($request);
    
    echo "   ✅ اختبار محلي نجح:\n";
    echo "      HTTP Status: " . $response->getStatusCode() . "\n";
    echo "      Response: " . $response->getContent() . "\n";
    
} catch (Exception $e) {
    echo "   ❌ خطأ في الاختبار المحلي:\n";
    echo "      " . $e->getMessage() . "\n";
}
echo "\n";

// 6. التوصيات
echo "6️⃣ التوصيات لحل المشكلة:\n";
echo "   1. تأكد من أن الـ webhook secret محدث في .env\n";
echo "   2. تأكد من أن الخادم يستقبل POST requests على /api/webhook/falakcart\n";
echo "   3. تحقق من أن SSL certificate صحيح\n";
echo "   4. تأكد من أن firewall لا يحجب الطلبات\n";
echo "   5. راجع سجلات الخادم (Apache/Nginx) للأخطاء\n";
echo "\n";

echo "✅ انتهى التشخيص\n";