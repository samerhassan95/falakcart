<?php

// اختبار بسيط للـ webhook
$webhookUrl = 'https://togaar.com/api/webhook/falakcart';

echo "🧪 اختبار بسيط للـ Webhook\n";
echo "==========================\n\n";

// اختبار 1: بدون signature (يجب أن يرجع 401)
echo "1️⃣ اختبار بدون signature:\n";
$result = testWebhook($webhookUrl, ['event' => 'test'], null);
echo "   HTTP Status: " . $result['http_code'] . "\n";
echo "   Response: " . $result['response'] . "\n\n";

// اختبار 2: مع signature خاطئ (يجب أن يرجع 401)
echo "2️⃣ اختبار مع signature خاطئ:\n";
$result = testWebhook($webhookUrl, ['event' => 'test'], 'sha256=wrong-signature');
echo "   HTTP Status: " . $result['http_code'] . "\n";
echo "   Response: " . $result['response'] . "\n\n";

// اختبار 3: مع signature صحيح
echo "3️⃣ اختبار مع signature صحيح:\n";
$payload = ['event' => 'test'];
$jsonPayload = json_encode($payload);
$secret = '0KZwjBiG8SniS1wT6kfO13t6sspH2DRVXUaIdIxjbfs=';
$signature = 'sha256=' . hash_hmac('sha256', $jsonPayload, $secret);

echo "   Payload: $jsonPayload\n";
echo "   Secret: $secret\n";
echo "   Signature: $signature\n";

$result = testWebhook($webhookUrl, $payload, $signature);
echo "   HTTP Status: " . $result['http_code'] . "\n";
echo "   Response: " . $result['response'] . "\n\n";

// اختبار 4: مع event صحيح
echo "4️⃣ اختبار مع event صحيح:\n";
$payload = [
    "event" => "affiliate.user.registered",
    "data" => [
        "referral" => ["referral_code" => "8a1ff41e"],
        "user" => ["name" => "Test", "email" => "test@test.com"]
    ]
];
$jsonPayload = json_encode($payload);
$signature = 'sha256=' . hash_hmac('sha256', $jsonPayload, $secret);

$result = testWebhook($webhookUrl, $payload, $signature);
echo "   HTTP Status: " . $result['http_code'] . "\n";
echo "   Response: " . $result['response'] . "\n\n";

function testWebhook($url, $payload, $signature) {
    $jsonPayload = json_encode($payload);
    
    $headers = [
        'Content-Type: application/json',
        'User-Agent: Simple-Test/1.0'
    ];
    
    if ($signature) {
        $headers[] = 'X-Webhook-Signature: ' . $signature;
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
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

echo "✅ انتهى الاختبار البسيط\n";