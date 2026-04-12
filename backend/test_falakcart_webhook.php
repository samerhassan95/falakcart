<?php

require_once 'vendor/autoload.php';

// Test FalakCart webhook integration
function testWebhook($endpoint, $payload) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Webhook-Signature: test-signature'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'http_code' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

// Test data based on your provided callbacks
$baseUrl = 'http://127.0.0.1:8000/api';

echo "Testing FalakCart Webhook Integration\n";
echo "=====================================\n\n";

// Test 1: User Registration
echo "1. Testing User Registration Webhook...\n";
$userRegistrationPayload = [
    "event" => "affiliate.user.registered",
    "sent_at" => "2026-04-11T19:48:34+03:00",
    "data" => [
        "callback_id" => "d35afb5a-4a7a-4b17-a2c3-f4a28dee045e",
        "occurred_at" => "2026-04-11T19:48:34+03:00",
        "referral" => [
            "source" => "website",
            "utm_medium" => "social",
            "utm_campaign" => "summer2024",
            "referral_code" => "FRIEND2025"
        ],
        "user" => [
            "id" => 7,
            "name" => "M Abu Hurairah",
            "email" => "wicac98145@icousd.com",
            "phone" => "971503610658"
        ]
    ]
];

$result = testWebhook($baseUrl . '/webhook/falakcart', $userRegistrationPayload);
echo "HTTP Code: " . $result['http_code'] . "\n";
echo "Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "\n\n";

// Test 2: Subscription
echo "2. Testing Subscription Webhook...\n";
$subscriptionPayload = [
    "event" => "affiliate.subscription",
    "sent_at" => "2026-04-12T09:03:43+03:00",
    "data" => [
        "callback_id" => "3837f763-87ce-4701-a26a-8055471127de",
        "occurred_at" => "2026-04-12T09:03:43+03:00",
        "action" => "subscribed",
        "referral" => [
            "source" => "website",
            "utm_medium" => "social",
            "utm_campaign" => "summer2024",
            "referral_code" => "FRIEND2025"
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
            "start_date" => "2026-04-12",
            "end_date" => "2027-04-12"
        ],
        "tenant" => [
            "id" => 114,
            "name" => "asas",
            "subdomain" => "vgvusjj",
            "status" => "active"
        ]
    ]
];

$result = testWebhook($baseUrl . '/webhook/falakcart', $subscriptionPayload);
echo "HTTP Code: " . $result['http_code'] . "\n";
echo "Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "\n\n";

// Test 3: Plan Change
echo "3. Testing Plan Change Webhook...\n";
$planChangePayload = [
    "event" => "affiliate.subscription",
    "sent_at" => "2026-04-12T09:17:16+03:00",
    "data" => [
        "callback_id" => "a40f4918-d09a-49fc-beef-4090a8e73650",
        "occurred_at" => "2026-04-12T09:17:16+03:00",
        "action" => "plan_change",
        "referral" => [
            "source" => "website",
            "utm_medium" => "social",
            "utm_campaign" => "summer2024",
            "referral_code" => "FRIEND2025"
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
            "start_date" => "2026-04-12",
            "end_date" => "2027-04-12"
        ],
        "tenant" => [
            "id" => 114,
            "name" => "asas",
            "subdomain" => "vgvusjj",
            "status" => "active"
        ]
    ]
];

$result = testWebhook($baseUrl . '/webhook/falakcart', $planChangePayload);
echo "HTTP Code: " . $result['http_code'] . "\n";
echo "Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "\n\n";

echo "Testing completed!\n";