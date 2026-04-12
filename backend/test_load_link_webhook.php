<?php

echo "🔗 اختبار الرابط: https://falakcart.com/register?ref=8a1ff41e-load\n";
echo "=" . str_repeat("=", 60) . "\n\n";

// Test 1: User Registration
echo "1️⃣ محاكاة تسجيل مستخدم جديد...\n";
$registrationPayload = [
    "event" => "affiliate.user.registered",
    "sent_at" => date('c'),
    "data" => [
        "callback_id" => "test-reg-" . uniqid(),
        "occurred_at" => date('c'),
        "referral" => [
            "source" => "website",
            "utm_medium" => "social",
            "utm_campaign" => "load-campaign",
            "referral_code" => "8a1ff41e-load"
        ],
        "user" => [
            "id" => 777,
            "name" => "Ahmed Load Customer",
            "email" => "ahmed.load@test.com",
            "phone" => "201234567890"
        ]
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/webhook/falakcart');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($registrationPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "✅ تسجيل المستخدم: HTTP $httpCode\n";
echo "📝 Response: $response\n\n";

sleep(2); // انتظار ثانيتين

// Test 2: Subscription
echo "2️⃣ محاكاة اشتراك في خطة Pro...\n";
$subscriptionPayload = [
    "event" => "affiliate.subscription",
    "sent_at" => date('c'),
    "data" => [
        "callback_id" => "test-sub-" . uniqid(),
        "occurred_at" => date('c'),
        "action" => "subscribed",
        "referral" => [
            "source" => "website",
            "utm_medium" => "social",
            "utm_campaign" => "load-campaign",
            "referral_code" => "8a1ff41e-load"
        ],
        "user" => [
            "id" => 777,
            "name" => "Ahmed Load Customer",
            "email" => "ahmed.load@test.com",
            "phone" => "201234567890"
        ],
        "subscription" => [
            "id" => 777,
            "plan_id" => 3,
            "plan_name" => "Pro Monthly",
            "status" => "active",
            "price" => "150.00",
            "currency" => "USD",
            "billing_cycle" => "monthly",
            "start_date" => date('Y-m-d'),
            "end_date" => date('Y-m-d', strtotime('+1 month'))
        ],
        "tenant" => [
            "id" => 777,
            "name" => "Ahmed Store",
            "subdomain" => "ahmed-store",
            "status" => "active"
        ]
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/webhook/falakcart');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($subscriptionPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "✅ الاشتراك: HTTP $httpCode\n";
echo "📝 Response: $response\n\n";

sleep(2); // انتظار ثانيتين

// Test 3: Plan Upgrade
echo "3️⃣ محاكاة ترقية للخطة Enterprise...\n";
$upgradePayload = [
    "event" => "affiliate.subscription",
    "sent_at" => date('c'),
    "data" => [
        "callback_id" => "test-upgrade-" . uniqid(),
        "occurred_at" => date('c'),
        "action" => "plan_change",
        "referral" => [
            "source" => "website",
            "utm_medium" => "social",
            "utm_campaign" => "load-campaign",
            "referral_code" => "8a1ff41e-load"
        ],
        "user" => [
            "id" => 777,
            "name" => "Ahmed Load Customer",
            "email" => "ahmed.load@test.com",
            "phone" => "201234567890"
        ],
        "subscription" => [
            "id" => 777,
            "plan_id" => 5,
            "plan_name" => "Enterprise Monthly",
            "status" => "active",
            "price" => "500.00",
            "currency" => "USD",
            "billing_cycle" => "monthly",
            "start_date" => date('Y-m-d'),
            "end_date" => date('Y-m-d', strtotime('+1 month'))
        ],
        "tenant" => [
            "id" => 777,
            "name" => "Ahmed Store",
            "subdomain" => "ahmed-store",
            "status" => "active"
        ]
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/webhook/falakcart');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($upgradePayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "✅ ترقية الخطة: HTTP $httpCode\n";
echo "📝 Response: $response\n\n";

echo "🎯 انتهى الاختبار!\n";
echo "📊 ارجع للداشبورد وشوف:\n";
echo "   • Total Earnings زاد\n";
echo "   • صفحة My Links → رابط 'load' فيه نشاط\n";
echo "   • صفحة Referrals → مبيعات جديدة\n";
echo "   • صفحة Earnings → عمولات جديدة\n";
echo "   • Recent Activity → إشعارات جديدة\n\n";

echo "💰 العمولات المتوقعة:\n";
echo "   • Pro Monthly ($150): $22.50 (15%)\n";
echo "   • Enterprise Monthly ($500): $75.00 (15%)\n";
echo "   • إجمالي العمولات الجديدة: $97.50\n";