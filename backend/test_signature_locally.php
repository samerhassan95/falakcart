<?php

require_once 'vendor/autoload.php';

// Load Laravel application
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔐 اختبار التوقيع محلياً\n";
echo "======================\n\n";

$secret = config('app.webhook_secret');
echo "Secret: $secret\n";
echo "Secret Length: " . strlen($secret) . "\n\n";

// اختبار 1: payload بسيط
$payload1 = '{"event":"test"}';
$signature1 = 'sha256=' . hash_hmac('sha256', $payload1, $secret);

echo "Test 1 - Simple Payload:\n";
echo "Payload: $payload1\n";
echo "Signature: $signature1\n";

// محاكاة الـ webhook controller
$request = new \Illuminate\Http\Request();
$request->merge(json_decode($payload1, true));
$request->headers->set('X-Webhook-Signature', $signature1);
$request->headers->set('Content-Type', 'application/json');

// تعيين الـ content يدوياً
$request->initialize(
    $request->query->all(),
    $request->request->all(),
    $request->attributes->all(),
    $request->cookies->all(),
    $request->files->all(),
    $request->server->all(),
    $payload1
);

try {
    $controller = new \App\Http\Controllers\TrackingController();
    $response = $controller->handleFalakCartWebhook($request);
    
    echo "Response Status: " . $response->getStatusCode() . "\n";
    echo "Response Body: " . $response->getContent() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("-", 50) . "\n\n";

// اختبار 2: payload حقيقي
$payload2 = json_encode([
    "event" => "affiliate.user.registered",
    "sent_at" => date('c'),
    "data" => [
        "callback_id" => "test-local-" . uniqid(),
        "occurred_at" => date('c'),
        "referral" => [
            "source" => "website",
            "utm_medium" => "test",
            "utm_campaign" => "local_test",
            "referral_code" => "8a1ff41e"
        ],
        "user" => [
            "id" => 99999,
            "name" => "Local Test User",
            "email" => "local@test.com",
            "phone" => "1234567890"
        ]
    ]
]);

$signature2 = 'sha256=' . hash_hmac('sha256', $payload2, $secret);

echo "Test 2 - Real Payload:\n";
echo "Payload: " . substr($payload2, 0, 100) . "...\n";
echo "Signature: $signature2\n";

$request2 = new \Illuminate\Http\Request();
$request2->merge(json_decode($payload2, true));
$request2->headers->set('X-Webhook-Signature', $signature2);
$request2->headers->set('Content-Type', 'application/json');

$request2->initialize(
    $request2->query->all(),
    $request2->request->all(),
    $request2->attributes->all(),
    $request2->cookies->all(),
    $request2->files->all(),
    $request2->server->all(),
    $payload2
);

try {
    $controller = new \App\Http\Controllers\TrackingController();
    $response = $controller->handleFalakCartWebhook($request2);
    
    echo "Response Status: " . $response->getStatusCode() . "\n";
    echo "Response Body: " . $response->getContent() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n✅ انتهى الاختبار المحلي\n";