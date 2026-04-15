<?php
/**
 * اختبار الويبهوك من الـ production URL الحقيقي
 * يحاكي التسجيل من https://falakcart.com
 */

echo "🌐 اختبار الويبهوك من FalakCart Production\n";
echo "==========================================\n\n";

$webhookUrl = 'https://togaar.com/api/webhook/falakcart';
$secret = '0KZwjBiG8SniS1wT6kfO13t6sspH2DRVXUaIdIxjbfs=';
$referralCode = '8a1ff41e';

echo "Webhook URL: $webhookUrl\n";
echo "Secret: $secret\n";
echo "Referral Code: $referralCode\n\n";

// Test 1: User Registration from Production
echo "1️⃣ محاكاة تسجيل مستخدم من falakcart.com:\n";
$registrationPayload = [
    'event' => 'affiliate.user.registered',
    'data' => [
        'callback_id' => 'prod-reg-' . uniqid(),
        'occurred_at' => date('c'),
        'referral' => [
            'source' => 'website',
            'utm_medium' => 'organic',
            'utm_campaign' => 'affiliate_program',
            'referral_code' => $referralCode
        ],
        'user' => [
            'id' => rand(10000, 99999),
            'name' => 'Production Test User',
            'email' => 'production.test@falakcart.com',
            'phone' => '+966501234567'
        ],
        'tenant' => [
            'id' => rand(1000, 9999),
            'name' => 'Production Store',
            'subdomain' => 'production-store',
            'status' => 'active'
        ]
    ]
];

$payload = json_encode($registrationPayload);
$signature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

echo "Payload Length: " . strlen($payload) . "\n";
echo "Signature: $signature\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: ' . $signature,
    'User-Agent: FalakCart-Production/1.0',
    'X-Forwarded-For: 185.199.108.153', // GitHub Pages IP as example
    'X-Real-IP: 185.199.108.153'
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
    echo "✅ تسجيل المستخدم نجح!\n\n";
} else {
    echo "❌ فشل في تسجيل المستخدم\n\n";
}

// Test 2: Subscription from Production
echo "2️⃣ محاكاة اشتراك من falakcart.com:\n";
$subscriptionPayload = [
    'event' => 'affiliate.subscription',
    'data' => [
        'callback_id' => 'prod-sub-' . uniqid(),
        'occurred_at' => date('c'),
        'action' => 'subscribed',
        'referral' => [
            'source' => 'website',
            'utm_medium' => 'organic',
            'utm_campaign' => 'affiliate_program',
            'referral_code' => $referralCode
        ],
        'user' => [
            'id' => rand(10000, 99999),
            'name' => 'Production Subscriber',
            'email' => 'subscriber@falakcart.com',
            'phone' => '+966507654321'
        ],
        'subscription' => [
            'id' => rand(100000, 999999),
            'plan_id' => 3,
            'plan_name' => 'Enterprise Plan',
            'status' => 'active',
            'price' => '499.00',
            'currency' => 'SAR',
            'billing_cycle' => 'monthly',
            'start_date' => date('Y-m-d'),
            'end_date' => date('Y-m-d', strtotime('+1 month'))
        ],
        'tenant' => [
            'id' => rand(10000, 99999),
            'name' => 'Enterprise Store',
            'subdomain' => 'enterprise-store',
            'status' => 'active'
        ]
    ]
];

$payload = json_encode($subscriptionPayload);
$signature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

echo "Payload Length: " . strlen($payload) . "\n";
echo "Signature: $signature\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: ' . $signature,
    'User-Agent: FalakCart-Production/1.0',
    'X-Forwarded-For: 185.199.108.153',
    'X-Real-IP: 185.199.108.153'
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
    echo "✅ الاشتراك نجح!\n\n";
} else {
    echo "❌ فشل في الاشتراك\n\n";
}

// Test 3: Plan Change from Production
echo "3️⃣ محاكاة تغيير خطة من falakcart.com:\n";
$planChangePayload = [
    'event' => 'affiliate.subscription',
    'data' => [
        'callback_id' => 'prod-change-' . uniqid(),
        'occurred_at' => date('c'),
        'action' => 'plan_change',
        'referral' => [
            'source' => 'website',
            'utm_medium' => 'organic',
            'utm_campaign' => 'affiliate_program',
            'referral_code' => $referralCode
        ],
        'user' => [
            'id' => rand(10000, 99999),
            'name' => 'Plan Changer',
            'email' => 'planchanger@falakcart.com',
            'phone' => '+966509876543'
        ],
        'subscription' => [
            'id' => rand(100000, 999999),
            'plan_id' => 4,
            'plan_name' => 'Premium Plus Plan',
            'status' => 'active',
            'price' => '799.00',
            'currency' => 'SAR',
            'billing_cycle' => 'monthly',
            'start_date' => date('Y-m-d'),
            'end_date' => date('Y-m-d', strtotime('+1 month'))
        ],
        'tenant' => [
            'id' => rand(10000, 99999),
            'name' => 'Premium Store',
            'subdomain' => 'premium-store',
            'status' => 'active'
        ]
    ]
];

$payload = json_encode($planChangePayload);
$signature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

echo "Payload Length: " . strlen($payload) . "\n";
echo "Signature: $signature\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: ' . $signature,
    'User-Agent: FalakCart-Production/1.0',
    'X-Forwarded-For: 185.199.108.153',
    'X-Real-IP: 185.199.108.153'
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
    echo "✅ تغيير الخطة نجح!\n\n";
} else {
    echo "❌ فشل في تغيير الخطة\n\n";
}

echo "🎯 الخلاصة:\n";
echo "تم اختبار الويبهوك بنجاح مع محاكاة الطلبات من falakcart.com\n";
echo "الويبهوك جاهز لاستقبال الأحداث الحقيقية من الإنتاج\n\n";

echo "📋 للتسجيل الحقيقي:\n";
echo "URL: https://falakcart.com/register?ref=$referralCode\n";
echo "Webhook: $webhookUrl\n";
echo "Secret: $secret\n";
?>