<?php

require_once 'vendor/autoload.php';

// Load Laravel application
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🌐 اختبار التوقيع الخارجي\n";
echo "========================\n\n";

$webhookUrl = 'https://togaar.com/api/webhook/falakcart';
$secret = config('app.webhook_secret');

echo "Webhook URL: $webhookUrl\n";
echo "Secret: $secret\n\n";

// اختبار 1: event غير معروف مع signature صحيح
echo "1️⃣ اختبار event غير معروف:\n";
$payload1 = '{"event":"test","data":{"test":true}}';
$signature1 = 'sha256=' . hash_hmac('sha256', $payload1, $secret);

echo "Payload: $payload1\n";
echo "Signature: $signature1\n";

$result1 = testWebhook($webhookUrl, $payload1, $signature1);
echo "HTTP Status: " . $result1['http_code'] . "\n";
echo "Response: " . $result1['response'] . "\n\n";

// اختبار 2: user registration مع signature صحيح
echo "2️⃣ اختبار user registration:\n";
$payload2 = json_encode([
    "event" => "affiliate.user.registered",
    "sent_at" => date('c'),
    "data" => [
        "callback_id" => "test-external-" . uniqid(),
        "occurred_at" => date('c'),
        "referral" => [
            "source" => "website",
            "utm_medium" => "external_test",
            "utm_campaign" => "signature_test",
            "referral_code" => "8a1ff41e"
        ],
        "user" => [
            "id" => 88888,
            "name" => "External Test User",
            "email" => "external@test.com",
            "phone" => "9876543210"
        ]
    ]
]);

$signature2 = 'sha256=' . hash_hmac('sha256', $payload2, $secret);

echo "Payload Length: " . strlen($payload2) . "\n";
echo "Signature: $signature2\n";

$result2 = testWebhook($webhookUrl, $payload2, $signature2);
echo "HTTP Status: " . $result2['http_code'] . "\n";
echo "Response: " . $result2['response'] . "\n\n";

// اختبار 3: subscription مع signature صحيح
echo "3️⃣ اختبار subscription:\n";
$payload3 = json_encode([
    "event" => "affiliate.subscription",
    "sent_at" => date('c'),
    "data" => [
        "callback_id" => "test-sub-external-" . uniqid(),
        "occurred_at" => date('c'),
        "action" => "subscribed",
        "referral" => [
            "source" => "website",
            "utm_medium" => "external_test",
            "utm_campaign" => "signature_test",
            "referral_code" => "8a1ff41e"
        ],
        "user" => [
            "id" => 88888,
            "name" => "External Test User",
            "email" => "external@test.com",
            "phone" => "9876543210"
        ],
        "subscription" => [
            "id" => 77777,
            "plan_id" => 2,
            "plan_name" => "Pro Plan",
            "status" => "active",
            "price" => "199.00",
            "currency" => "SAR",
            "billing_cycle" => "monthly",
            "start_date" => date('Y-m-d'),
            "end_date" => date('Y-m-d', strtotime('+1 month'))
        ],
        "tenant" => [
            "id" => 88888,
            "name" => "External Test Store",
            "subdomain" => "external-test",
            "status" => "active"
        ]
    ]
]);

$signature3 = 'sha256=' . hash_hmac('sha256', $payload3, $secret);

echo "Payload Length: " . strlen($payload3) . "\n";
echo "Signature: $signature3\n";

$result3 = testWebhook($webhookUrl, $payload3, $signature3);
echo "HTTP Status: " . $result3['http_code'] . "\n";
echo "Response: " . $result3['response'] . "\n\n";

function testWebhook($url, $payload, $signature) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Webhook-Signature: ' . $signature,
        'User-Agent: External-Signature-Test/1.0'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'http_code' => $httpCode,
        'response' => $response
    ];
}

echo "✅ انتهى الاختبار الخارجي\n";