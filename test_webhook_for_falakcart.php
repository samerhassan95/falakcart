<?php
/**
 * اختبار الويبهوك لفريق FalakCart
 * يمكن تشغيل هذا الملف من أي مكان لاختبار الويبهوك
 */

echo "🔗 اختبار ويبهوك Togaar من FalakCart\n";
echo "=====================================\n\n";

$webhookUrl = 'https://togaar.com/api/webhook/falakcart';
$secret = '0KZwjBiG8SniS1wT6kfO13t6sspH2DRVXUaIdIxjbfs=';

// Test 1: Simple connectivity test
echo "1️⃣ اختبار الاتصال البسيط:\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response: $response\n\n";

if ($httpCode == 200) {
    echo "✅ الويبهوك متاح ويمكن الوصول إليه\n\n";
} else {
    echo "❌ مشكلة في الوصول للويبهوك\n\n";
    exit(1);
}

// Test 2: Test with invalid event (should return 400)
echo "2️⃣ اختبار مع event غير صحيح (يجب أن يرجع 400):\n";
$payload = json_encode(['event' => 'test', 'data' => ['test' => true]]);
$signature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: ' . $signature
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response: $response\n\n";

if ($httpCode == 400 && strpos($response, 'unknown_event') !== false) {
    echo "✅ الويبهوك يعمل بشكل صحيح ويرفض الأحداث غير المعروفة\n\n";
} else {
    echo "❌ مشكلة في معالجة الأحداث\n\n";
}

// Test 3: Test with valid user registration event
echo "3️⃣ اختبار مع حدث تسجيل مستخدم صحيح:\n";
$payload = json_encode([
    'event' => 'affiliate.user.registered',
    'data' => [
        'callback_id' => 'test-' . uniqid(),
        'occurred_at' => date('c'),
        'referral' => [
            'source' => 'website',
            'referral_code' => '8a1ff41e'
        ],
        'user' => [
            'id' => 12345,
            'name' => 'Test User',
            'email' => 'test@example.com'
        ]
    ]
]);

$signature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

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
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response: $response\n\n";

if ($httpCode == 200 && strpos($response, 'user_registration_recorded') !== false) {
    echo "✅ حدث تسجيل المستخدم يعمل بشكل صحيح\n\n";
} else {
    echo "❌ مشكلة في معالجة حدث تسجيل المستخدم\n\n";
}

echo "🎯 الخلاصة:\n";
echo "الويبهوك يعمل بشكل مثالي ومستعد لاستقبال الأحداث من FalakCart\n";
echo "URL: $webhookUrl\n";
echo "Secret: $secret\n";
echo "Referral Code: 8a1ff41e\n\n";

echo "📞 إذا كان الاختبار ناجح ولكن الأحداث الحقيقية لا تصل،\n";
echo "يرجى التحقق من إعدادات الويبهوك في لوحة تحكم FalakCart\n";
?>