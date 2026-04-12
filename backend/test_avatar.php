<?php

require_once 'vendor/autoload.php';

// Test Avatar functionality
$baseUrl = 'http://localhost:8000/api';

// Login first
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
    echo "❌ Login failed\n";
    exit(1);
}

$token = $loginResult['token'];
echo "✅ Login successful\n";

$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
];

// Test getting profile with avatar
echo "\n🖼️ Testing Avatar Functionality...\n";

// Get current profile
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/affiliate/profile');
curl_setopt($ch, CURLOPT_HTTPGET, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$profile = json_decode($response, true);

echo "✅ Profile loaded for: " . ($profile['user']['name'] ?? 'Unknown') . "\n";

if (isset($profile['avatar']) && $profile['avatar']) {
    echo "✅ Avatar found in profile (length: " . strlen($profile['avatar']) . " characters)\n";
    echo "✅ Avatar starts with: " . substr($profile['avatar'], 0, 30) . "...\n";
} else {
    echo "ℹ️ No avatar set in profile\n";
}

// Test updating profile with a small test avatar (base64 encoded 1x1 pixel image)
$testAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

$profileData = [
    'name' => $profile['user']['name'],
    'bio' => $profile['bio'] ?? 'Test bio',
    'avatar' => $testAvatar
];

curl_setopt($ch, CURLOPT_URL, $baseUrl . '/affiliate/profile');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($profileData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$result = json_decode($response, true);

if (isset($result['message'])) {
    echo "✅ Profile updated with test avatar: " . $result['message'] . "\n";
} else {
    echo "❌ Failed to update profile with avatar\n";
    echo "Response: " . $response . "\n";
}

// Verify the avatar was saved
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/affiliate/profile');
curl_setopt($ch, CURLOPT_HTTPGET, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$updatedProfile = json_decode($response, true);

if (isset($updatedProfile['avatar']) && $updatedProfile['avatar'] === $testAvatar) {
    echo "✅ Avatar successfully saved and retrieved\n";
} else {
    echo "❌ Avatar not properly saved\n";
}

curl_close($ch);

echo "\n🎉 Avatar test completed!\n";
echo "\n📝 Instructions:\n";
echo "1. Go to http://localhost:3000/settings\n";
echo "2. Upload an avatar image in the Profile tab\n";
echo "3. Click 'Save Changes'\n";
echo "4. Check the navigation bar - the avatar should appear instead of the colored circle\n";