<?php

// اختبار بسيط للتوقيع بدون Laravel
$secret = '0KZwjBiG8SniS1wT6kfO13t6sspH2DRVXUaIdIxjbfs=';
$payload = '{"event":"test"}';
$expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

echo "🔐 اختبار التوقيع البسيط\n";
echo "========================\n\n";

echo "Secret: $secret\n";
echo "Payload: $payload\n";
echo "Expected Signature: $expectedSignature\n\n";

// اختبار الـ webhook
$webhookUrl = 'https://togaar.com/api/webhook/falakcart';

echo "Testing webhook with correct signature...\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: ' . $expectedSignature,
    'User-Agent: Simple-Test/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response: $response\n";

if ($error) {
    echo "cURL Error: $error\n";
}

// اختبار مع signature خاطئ
echo "\nTesting with wrong signature...\n";

$wrongSignature = 'sha256=wrong-signature-here';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: ' . $wrongSignature,
    'User-Agent: Simple-Test/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response: $response\n\n";

echo "✅ انتهى الاختبار البسيط\n";