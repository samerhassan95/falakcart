<?php

// اختبار الـ endpoint الجديد
$webhookUrl = 'https://togaar.com/api/webhook/falakcart-test';
$secret = '0KZwjBiG8SniS1wT6kfO13t6sspH2DRVXUaIdIxjbfs=';

echo "🧪 اختبار Endpoint الجديد\n";
echo "=========================\n\n";

echo "Webhook URL: $webhookUrl\n";
echo "Secret: $secret\n\n";

// اختبار 1: event غير معروف
echo "1️⃣ اختبار event غير معروف:\n";
$payload1 = '{"event":"test"}';
$signature1 = 'sha256=' . hash_hmac('sha256', $payload1, $secret);

$result1 = testWebhook($webhookUrl, $payload1, $signature1);
echo "HTTP Status: " . $result1['http_code'] . "\n";
echo "Response: " . $result1['response'] . "\n\n";

// اختبار 2: user registration
echo "2️⃣ اختبار user registration:\n";
$payload2 = json_encode([
    "event" => "affiliate.user.registered",
    "data" => [
        "referral" => ["referral_code" => "8a1ff41e"],
        "user" => ["id" => 12345, "name" => "Test User", "email" => "test@test.com"]
    ]
]);
$signature2 = 'sha256=' . hash_hmac('sha256', $payload2, $secret);

$result2 = testWebhook($webhookUrl, $payload2, $signature2);
echo "HTTP Status: " . $result2['http_code'] . "\n";
echo "Response: " . $result2['response'] . "\n\n";

// اختبار 3: subscription
echo "3️⃣ اختبار subscription:\n";
$payload3 = json_encode([
    "event" => "affiliate.subscription",
    "data" => [
        "action" => "subscribed",
        "referral" => ["referral_code" => "8a1ff41e"],
        "user" => ["id" => 12345, "name" => "Test User", "email" => "test@test.com"],
        "subscription" => ["id" => 999, "plan_name" => "Test Plan", "price" => "99.00", "currency" => "SAR"]
    ]
]);
$signature3 = 'sha256=' . hash_hmac('sha256', $payload3, $secret);

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
        'User-Agent: New-Endpoint-Test/1.0'
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

echo "✅ انتهى اختبار Endpoint الجديد\n";