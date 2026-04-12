<?php

// Test with the actual referral code from dashboard
$payload = [
    "event" => "affiliate.subscription",
    "data" => [
        "action" => "subscribed",
        "referral" => [
            "referral_code" => "8A1FF41E"  // الكود الصحيح من قاعدة البيانات
        ],
        "user" => [
            "id" => 999,
            "name" => "Test Customer",
            "email" => "customer@test.com",
            "phone" => "123456789"
        ],
        "subscription" => [
            "id" => 999,
            "plan_name" => "Pro Plan",
            "price" => "100.00",
            "currency" => "USD"
        ]
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/webhook/falakcart');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($httpCode == 200) {
    echo "\n✅ نجح! ارجع للداشبورد وشوف الأرقام اتغيرت\n";
    echo "المفروض تشوف:\n";
    echo "- Total Earnings زاد بـ $10 (10% من $100)\n";
    echo "- Subscriptions زاد بـ 1\n";
    echo "- مبيعة جديدة في صفحة Referrals\n";
} else {
    echo "\n❌ فيه مشكلة - شوف الـ response فوق\n";
}