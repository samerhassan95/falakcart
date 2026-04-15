<?php

// Test if the webhook endpoint is accessible
$webhookUrl = 'https://togaar.com/api/webhook/falakcart';

echo "Testing FalakCart Webhook Endpoint\n";
echo "==================================\n\n";

echo "Webhook URL: $webhookUrl\n";
echo "Testing with sample registration payload...\n\n";

// Sample registration payload that FalakCart will send
$payload = [
    "event" => "affiliate.user.registered",
    "sent_at" => date('c'),
    "data" => [
        "callback_id" => "test-" . uniqid(),
        "occurred_at" => date('c'),
        "referral" => [
            "source" => "website",
            "utm_medium" => "test",
            "utm_campaign" => "webhook_test",
            "referral_code" => "8a1ff41e"
        ],
        "user" => [
            "id" => 999,
            "name" => "Test User",
            "email" => "test@falakcart-test.com",
            "phone" => "1234567890"
        ]
    ]
];

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: test-signature',
    'User-Agent: FalakCart-Webhook/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For testing only

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

echo "Results:\n";
echo "--------\n";
echo "HTTP Status Code: $httpCode\n";

if ($error) {
    echo "❌ cURL Error: $error\n";
} else {
    if ($httpCode == 200) {
        echo "✅ Webhook endpoint is accessible!\n";
        echo "Response: " . $response . "\n";
    } else {
        echo "⚠️  Webhook returned HTTP $httpCode\n";
        echo "Response: " . $response . "\n";
    }
}

echo "\n";
echo "Next Steps:\n";
echo "-----------\n";
echo "1. Register on: https://falakcart-test.com/register?ref=8a1ff41e\n";
echo "2. FalakCart will send real webhooks to your endpoint\n";
echo "3. Check your logs at: backend/storage/logs/laravel.log\n";
echo "4. Monitor affiliate dashboard for new activity\n";