<?php
// Test external webhook access
echo "🌐 اختبار الوصول الخارجي للويبهوك\n";
echo "=====================================\n\n";

$webhookUrl = 'https://togaar.com/api/webhook/falakcart';
$secret = '0KZwjBiG8SniS1wT6kfO13t6sspH2DRVXUaIdIxjbfs=';

// Test payload
$payload = json_encode([
    'event' => 'affiliate.user.registered',
    'data' => [
        'callback_id' => 'test-external-' . uniqid(),
        'occurred_at' => date('c'),
        'referral' => [
            'source' => 'website',
            'utm_medium' => 'external_test',
            'utm_campaign' => 'access_test',
            'referral_code' => '8a1ff41e'
        ],
        'user' => [
            'id' => 99999,
            'name' => 'External Access Test',
            'email' => 'external@test.com',
            'phone' => '1234567890'
        ]
    ]
]);

// Generate signature
$signature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

echo "Webhook URL: $webhookUrl\n";
echo "Secret: $secret\n";
echo "Payload Length: " . strlen($payload) . "\n";
echo "Signature: $signature\n\n";

// Send request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: ' . $signature,
    'User-Agent: FalakCart-Webhook/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
if ($error) {
    echo "cURL Error: $error\n";
}
echo "Response: $response\n\n";

if ($httpCode == 200) {
    echo "✅ الويبهوك يعمل بشكل صحيح من الخارج!\n";
} else {
    echo "❌ مشكلة في الوصول للويبهوك\n";
}
?>