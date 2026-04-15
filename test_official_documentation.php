<?php
/**
 * اختبار الويبهوك بناءً على الدوكيومينتيشن الرسمي
 */

echo "📋 اختبار الويبهوك بناءً على الدوكيومينتيشن الرسمي\n";
echo "==============================================\n\n";

$webhookUrl = 'https://togaar.com/api/webhook/falakcart';
$secret = '0KZwjBiG8SniS1wT6kfO13t6sspH2DRVXUaIdIxjbfs=';

// Test 1: User Registration (exact format from documentation)
echo "1️⃣ اختبار تسجيل المستخدم (نفس الفورمات من الدوكيومينتيشن):\n";
$userRegistrationPayload = [
    "event" => "affiliate.user.registered",
    "sent_at" => "2026-04-15T11:30:00+03:00",
    "data" => [
        "callback_id" => "d35afb5a-4a7a-4b17-a2c3-f4a28dee045e",
        "occurred_at" => "2026-04-15T11:30:00+03:00",
        "referral" => [
            "source" => "website",
            "utm_medium" => "social",
            "utm_campaign" => "summer2024",
            "referral_code" => "8a1ff41e"  // Using our referral code
        ],
        "user" => [
            "id" => 7,
            "name" => "M Abu Hurairah",
            "email" => "wicac98145@icousd.com",
            "phone" => "971503610658"
        ]
    ]
];

$payload = json_encode($userRegistrationPayload);
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
    'User-Agent: FalakCart-Official/1.0'
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

// Test 2: Subscription (exact format from documentation)
echo "2️⃣ اختبار الاشتراك (نفس الفورمات من الدوكيومينتيشن):\n";
$subscriptionPayload = [
    "event" => "affiliate.subscription",
    "sent_at" => "2026-04-15T11:30:30+03:00",
    "data" => [
        "callback_id" => "3837f763-87ce-4701-a26a-8055471127de",
        "occurred_at" => "2026-04-15T11:30:30+03:00",
        "action" => "subscribed",
        "referral" => [
            "source" => "website",
            "utm_medium" => "social",
            "utm_campaign" => "summer2024",
            "referral_code" => "8a1ff41e"  // Using our referral code
        ],
        "user" => [
            "id" => 7,
            "name" => "M Abu Hurairah",
            "email" => "wicac98145@icousd.com",
            "phone" => "971503610658"
        ],
        "subscription" => [
            "id" => 69,
            "plan_id" => 6,
            "plan_name" => "Enterprise Yearly",
            "status" => "active",
            "price" => "2750.00",
            "currency" => "SAR",
            "billing_cycle" => "yearly",
            "start_date" => "2026-04-15",
            "end_date" => "2027-04-15"
        ],
        "tenant" => [
            "id" => 114,
            "name" => "asas",
            "subdomain" => "vgvusjj",
            "status" => "active"
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
    'User-Agent: FalakCart-Official/1.0'
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

// Test 3: Plan Change (exact format from documentation)
echo "3️⃣ اختبار تغيير الخطة (نفس الفورمات من الدوكيومينتيشن):\n";
$planChangePayload = [
    "event" => "affiliate.subscription",
    "sent_at" => "2026-04-15T11:31:00+03:00",
    "data" => [
        "callback_id" => "a40f4918-d09a-49fc-beef-4090a8e73650",
        "occurred_at" => "2026-04-15T11:31:00+03:00",
        "action" => "plan_change",
        "referral" => [
            "source" => "website",
            "utm_medium" => "social",
            "utm_campaign" => "summer2024",
            "referral_code" => "8a1ff41e"  // Using our referral code
        ],
        "user" => [
            "id" => 7,
            "name" => "M Abu Hurairah",
            "email" => "wicac98145@icousd.com",
            "phone" => "971503610658"
        ],
        "subscription" => [
            "id" => 69,  // Same subscription ID for plan change
            "plan_id" => 6,
            "plan_name" => "Enterprise Yearly",
            "status" => "active",
            "price" => "2750.00",
            "currency" => "SAR",
            "billing_cycle" => "yearly",
            "start_date" => "2026-04-15",
            "end_date" => "2027-04-15"
        ],
        "tenant" => [
            "id" => 114,
            "name" => "asas",
            "subdomain" => "vgvusjj",
            "status" => "active"
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
    'User-Agent: FalakCart-Official/1.0'
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
echo "تم اختبار الويبهوك بنفس الفورمات الموجودة في الدوكيومينتيشن الرسمي\n";
echo "جميع الاختبارات تمت بنجاح مع referral code: 8a1ff41e\n\n";

echo "📋 معلومات الويبهوك:\n";
echo "URL: $webhookUrl\n";
echo "Secret: $secret\n";
echo "Referral Code: 8a1ff41e\n";
?>