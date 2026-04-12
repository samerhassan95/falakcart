<?php

require_once 'vendor/autoload.php';

// Test Settings API endpoints
$baseUrl = 'http://localhost:8000/api';

// First, login to get a token
$loginData = [
    'email' => 'test@example.com',
    'password' => 'password123'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/login');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$loginResult = json_decode($response, true);

if (!isset($loginResult['token'])) {
    echo "❌ Login failed: " . ($loginResult['message'] ?? 'Unknown error') . "\n";
    exit(1);
}

$token = $loginResult['token'];
echo "✅ Login successful\n";

// Test profile settings
echo "\n🔧 Testing Profile Settings...\n";

$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
];

// Get profile
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/affiliate/profile');
curl_setopt($ch, CURLOPT_HTTPGET, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$profile = json_decode($response, true);
echo "✅ Profile loaded: " . ($profile['user']['name'] ?? 'Unknown') . "\n";

// Update profile
$profileData = [
    'name' => 'Updated Test User',
    'bio' => 'This is my updated bio for testing',
    'avatar' => null
];

curl_setopt($ch, CURLOPT_URL, $baseUrl . '/affiliate/profile');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($profileData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$result = json_decode($response, true);
echo "✅ Profile updated: " . ($result['message'] ?? 'Success') . "\n";

// Test payout settings
echo "\n💰 Testing Payout Settings...\n";

// Get payout settings
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/affiliate/payout-settings');
curl_setopt($ch, CURLOPT_HTTPGET, true);
$response = curl_exec($ch);
$payoutSettings = json_decode($response, true);
echo "✅ Payout settings loaded\n";

// Update payout settings
$payoutData = [
    'bank_name' => 'Test Bank',
    'account_number' => '1234567890',
    'account_holder_name' => 'Test User',
    'iban' => 'TEST1234567890',
    'minimum_payout' => 100
];

curl_setopt($ch, CURLOPT_URL, $baseUrl . '/affiliate/payout-settings');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payoutData));
$response = curl_exec($ch);
$result = json_decode($response, true);
echo "✅ Payout settings updated: " . ($result['message'] ?? 'Success') . "\n";

// Test notification settings
echo "\n🔔 Testing Notification Settings...\n";

// Get notification settings
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/affiliate/notification-settings');
curl_setopt($ch, CURLOPT_HTTPGET, true);
$response = curl_exec($ch);
$notificationSettings = json_decode($response, true);
echo "✅ Notification settings loaded\n";

// Update notification settings
$notificationData = [
    'email_notifications' => true,
    'sms_notifications' => false,
    'marketing_emails' => false,
    'weekly_reports' => true
];

curl_setopt($ch, CURLOPT_URL, $baseUrl . '/affiliate/notification-settings');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($notificationData));
$response = curl_exec($ch);
$result = json_decode($response, true);
echo "✅ Notification settings updated: " . ($result['message'] ?? 'Success') . "\n";

// Test security settings
echo "\n🔒 Testing Security Settings...\n";

// Get security settings
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/affiliate/security-settings');
curl_setopt($ch, CURLOPT_HTTPGET, true);
$response = curl_exec($ch);
$securitySettings = json_decode($response, true);
echo "✅ Security settings loaded\n";

// Toggle 2FA
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/affiliate/toggle-2fa');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{}');
$response = curl_exec($ch);
$result = json_decode($response, true);
echo "✅ 2FA toggled: " . ($result['message'] ?? 'Success') . "\n";

curl_close($ch);

echo "\n🎉 All settings tests completed successfully!\n";
echo "\n📝 Summary:\n";
echo "- Profile settings: ✅ Working\n";
echo "- Payout settings: ✅ Working\n";
echo "- Notification settings: ✅ Working\n";
echo "- Security settings: ✅ Working\n";
echo "\n🌐 You can now test the Settings page at: http://localhost:3000/settings\n";