<?php

require_once 'vendor/autoload.php';

// Load Laravel application
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔐 تشخيص مشكلة التوقيع\n";
echo "=====================\n\n";

$secret = config('app.webhook_secret');
echo "1️⃣ الـ Secret من Config: $secret\n";

$envSecret = env('WEBHOOK_SECRET');
echo "2️⃣ الـ Secret من ENV: $envSecret\n\n";

// اختبار التوقيع
$testPayload = '{"event":"test","data":{"test":true}}';
$expectedSignature = 'sha256=' . hash_hmac('sha256', $testPayload, $secret);

echo "3️⃣ اختبار التوقيع:\n";
echo "   Payload: $testPayload\n";
echo "   Secret: $secret\n";
echo "   Expected Signature: $expectedSignature\n\n";

// اختبار مع الـ webhook
echo "4️⃣ اختبار مع الـ webhook:\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://togaar.com/api/webhook/falakcart');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $testPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: ' . $expectedSignature,
    'User-Agent: Debug-Test/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   HTTP Status: $httpCode\n";
echo "   Response: $response\n\n";

// اختبار محلي
echo "5️⃣ اختبار محلي:\n";

function validateWebhookSignature($payload, $signature, $secret) {
    if (empty($signature)) {
        return false;
    }
    
    $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    echo "   Expected: $expectedSignature\n";
    echo "   Received: $signature\n";
    echo "   Match: " . (hash_equals($expectedSignature, $signature) ? 'YES' : 'NO') . "\n";
    
    return hash_equals($expectedSignature, $signature);
}

$result = validateWebhookSignature($testPayload, $expectedSignature, $secret);
echo "   Result: " . ($result ? 'VALID' : 'INVALID') . "\n\n";

echo "✅ انتهى تشخيص التوقيع\n";