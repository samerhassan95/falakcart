<?php

require_once 'vendor/autoload.php';

// Load Laravel application
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 تشخيص محتوى الـ Request\n";
echo "========================\n\n";

$secret = config('app.webhook_secret');
$payload = '{"event":"test","data":{"test":true}}';
$expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

echo "Original Payload: $payload\n";
echo "Expected Signature: $expectedSignature\n\n";

// إنشاء request
$request = new \Illuminate\Http\Request();
$request->merge(json_decode($payload, true));
$request->headers->set('X-Webhook-Signature', $expectedSignature);
$request->headers->set('Content-Type', 'application/json');

// طرق مختلفة لتعيين الـ content
echo "Method 1 - Using initialize:\n";
$request->initialize(
    $request->query->all(),
    $request->request->all(),
    $request->attributes->all(),
    $request->cookies->all(),
    $request->files->all(),
    $request->server->all(),
    $payload
);

echo "getContent(): " . $request->getContent() . "\n";
echo "Match: " . ($request->getContent() === $payload ? 'YES' : 'NO') . "\n\n";

// Method 2 - Using replace
echo "Method 2 - Direct JSON:\n";
$request2 = \Illuminate\Http\Request::create(
    'https://togaar.com/api/webhook/falakcart',
    'POST',
    [],
    [],
    [],
    ['CONTENT_TYPE' => 'application/json'],
    $payload
);
$request2->headers->set('X-Webhook-Signature', $expectedSignature);

echo "getContent(): " . $request2->getContent() . "\n";
echo "Match: " . ($request2->getContent() === $payload ? 'YES' : 'NO') . "\n\n";

// اختبار التوقيع مع الطريقة الصحيحة
echo "Testing signature validation:\n";
$actualContent = $request2->getContent();
$actualSignature = 'sha256=' . hash_hmac('sha256', $actualContent, $secret);

echo "Actual Content: $actualContent\n";
echo "Actual Signature: $actualSignature\n";
echo "Expected Signature: $expectedSignature\n";
echo "Match: " . ($actualSignature === $expectedSignature ? 'YES' : 'NO') . "\n\n";

echo "✅ انتهى التشخيص\n";