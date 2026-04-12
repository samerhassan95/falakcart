<?php

// Test with the custom link slug
$payload = [
    "event" => "affiliate.subscription",
    "data" => [
        "action" => "subscribed",
        "referral" => [
            "referral_code" => "8a1ff41e-luanda"  // الرابط المخصص
        ],
        "user" => [
            "id" => 888,
            "name" => "Custom Link Customer",
            "email" => "custom@test.com",
            "phone" => "987654321"
        ],
        "subscription" => [
            "id" => 888,
            "plan_name" => "Premium Plan",
            "price" => "200.00",
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

echo "🔗 اختبار الرابط المخصص: 8a1ff41e-luanda\n";
echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($httpCode == 200) {
    echo "\n✅ نجح! الرابط المخصص شغال\n";
    echo "ارجع للداشبورد وشوف الأرقام اتغيرت\n";
} else {
    echo "\n❌ فيه مشكلة مع الرابط المخصص\n";
}