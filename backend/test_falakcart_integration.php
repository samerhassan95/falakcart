<?php

require_once 'vendor/autoload.php';

// Load Laravel application
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Affiliate;
use App\Models\Click;
use App\Models\Sale;

echo "🚀 اختبار التكامل مع فلك كارت\n";
echo "============================\n\n";

// معلومات التكامل
$webhookUrl = 'https://togaar.com/api/webhook/falakcart';
$webhookSecret = '0KZwjBiG8SniS1wT6kfO13t6sspH2DRVXUaIdIxjbfs=';
$referralCode = '8a1ff41e';

echo "📋 معلومات التكامل:\n";
echo "   Webhook URL: $webhookUrl\n";
echo "   Webhook Secret: $webhookSecret\n";
echo "   Referral Code: $referralCode\n";
echo "   Test Registration URL: https://falakcart-test.com/register?ref=$referralCode\n\n";

// فحص الأفلييت
$affiliate = Affiliate::where('referral_code', $referralCode)->first();
if (!$affiliate) {
    echo "❌ كود الإحالة غير موجود!\n";
    exit(1);
}

echo "✅ الأفلييت موجود:\n";
echo "   ID: " . $affiliate->id . "\n";
echo "   الحالة: " . $affiliate->status . "\n";
echo "   معدل العمولة: " . $affiliate->commission_rate . "%\n\n";

// إحصائيات قبل الاختبار
$clicksBefore = Click::where('affiliate_id', $affiliate->id)->count();
$salesBefore = Sale::where('affiliate_id', $affiliate->id)->count();
$earningsBefore = $affiliate->total_earnings;

echo "📊 الإحصائيات الحالية:\n";
echo "   الكليكات: $clicksBefore\n";
echo "   المبيعات: $salesBefore\n";
echo "   إجمالي الأرباح: $earningsBefore\n\n";

// اختبار webhook endpoint
echo "🔧 اختبار Webhook Endpoint:\n";

// اختبار 1: User Registration
echo "   1️⃣ اختبار تسجيل المستخدم...\n";
$registrationPayload = [
    "event" => "affiliate.user.registered",
    "sent_at" => date('c'),
    "data" => [
        "callback_id" => "test-reg-" . uniqid(),
        "occurred_at" => date('c'),
        "referral" => [
            "source" => "website",
            "utm_medium" => "falakcart_test",
            "utm_campaign" => "integration_test",
            "referral_code" => $referralCode
        ],
        "user" => [
            "id" => 12345,
            "name" => "Test Integration User",
            "email" => "integration@falakcart-test.com",
            "phone" => "966501234567"
        ]
    ]
];

$result = testWebhook($webhookUrl, $registrationPayload, $webhookSecret);
echo "      HTTP Status: " . $result['http_code'] . "\n";
echo "      Response: " . json_encode($result['response']) . "\n";

// اختبار 2: Subscription
echo "   2️⃣ اختبار الاشتراك...\n";
$subscriptionPayload = [
    "event" => "affiliate.subscription",
    "sent_at" => date('c'),
    "data" => [
        "callback_id" => "test-sub-" . uniqid(),
        "occurred_at" => date('c'),
        "action" => "subscribed",
        "referral" => [
            "source" => "website",
            "utm_medium" => "falakcart_test",
            "utm_campaign" => "integration_test",
            "referral_code" => $referralCode
        ],
        "user" => [
            "id" => 12345,
            "name" => "Test Integration User",
            "email" => "integration@falakcart-test.com",
            "phone" => "966501234567"
        ],
        "subscription" => [
            "id" => 54321,
            "plan_id" => 1,
            "plan_name" => "Starter Plan",
            "status" => "active",
            "price" => "99.00",
            "currency" => "SAR",
            "billing_cycle" => "monthly",
            "start_date" => date('Y-m-d'),
            "end_date" => date('Y-m-d', strtotime('+1 month'))
        ],
        "tenant" => [
            "id" => 9999,
            "name" => "Test Store",
            "subdomain" => "test-store",
            "status" => "active"
        ]
    ]
];

$result = testWebhook($webhookUrl, $subscriptionPayload, $webhookSecret);
echo "      HTTP Status: " . $result['http_code'] . "\n";
echo "      Response: " . json_encode($result['response']) . "\n";

// فحص النتائج
echo "\n📈 النتائج بعد الاختبار:\n";
$affiliate->refresh();
$clicksAfter = Click::where('affiliate_id', $affiliate->id)->count();
$salesAfter = Sale::where('affiliate_id', $affiliate->id)->count();
$earningsAfter = $affiliate->total_earnings;

echo "   الكليكات: $clicksAfter (زيادة: " . ($clicksAfter - $clicksBefore) . ")\n";
echo "   المبيعات: $salesAfter (زيادة: " . ($salesAfter - $salesBefore) . ")\n";
echo "   إجمالي الأرباح: $earningsAfter (زيادة: " . ($earningsAfter - $earningsBefore) . ")\n\n";

echo "🎯 التعليمات لفريق فلك كارت:\n";
echo "================================\n";
echo "1. استخدموا هذا الـ URL للـ webhook:\n";
echo "   $webhookUrl\n\n";
echo "2. استخدموا هذا الـ secret:\n";
echo "   $webhookSecret\n\n";
echo "3. جربوا التسجيل على:\n";
echo "   https://falakcart-test.com/register?ref=$referralCode\n\n";
echo "4. تأكدوا من إرسال الـ headers التالية:\n";
echo "   Content-Type: application/json\n";
echo "   X-Webhook-Signature: sha256=HMAC_SIGNATURE\n\n";
echo "5. راقبوا الـ response codes:\n";
echo "   200 = نجح\n";
echo "   401 = خطأ في التوقيع\n";
echo "   404 = كود الإحالة غير موجود\n";
echo "   500 = خطأ في الخادم\n\n";

echo "✅ جاهز للاختبار مع فريق فلك كارت!\n";

function testWebhook($url, $payload, $secret) {
    $jsonPayload = json_encode($payload);
    $signature = 'sha256=' . hash_hmac('sha256', $jsonPayload, $secret);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Webhook-Signature: ' . $signature,
        'User-Agent: FalakCart-Test/1.0'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'http_code' => $httpCode,
        'response' => json_decode($response, true)
    ];
}