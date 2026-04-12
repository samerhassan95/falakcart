<?php

// Test the actual API endpoint
$url = 'http://localhost:8000/api/affiliate/links';

// Create a test JWT token for authentication
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;

$user = User::where('email', 'samer@example.com')->first();
if (!$user) {
    echo "❌ User not found\n";
    exit;
}

$token = JWTAuth::fromUser($user);

echo "🌐 Testing API Endpoint: /api/affiliate/links\n";
echo "=" . str_repeat("=", 50) . "\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Content-Type: application/json',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "📊 HTTP Status: $httpCode\n";
echo "📋 Response:\n";

if ($response) {
    $data = json_decode($response, true);
    if ($data) {
        echo "✅ JSON Response received\n";
        echo "📈 Number of links: " . count($data) . "\n\n";
        
        foreach ($data as $link) {
            echo "🔗 {$link['name']}:\n";
            echo "   Earnings: \${$link['earnings']}\n";
            echo "   Clicks: {$link['clicks']}\n";
            echo "   Conversions: {$link['conversions']}\n\n";
        }
        
        $totalEarnings = array_sum(array_column($data, 'earnings'));
        echo "💰 Total Earnings from API: \$$totalEarnings\n";
    } else {
        echo "❌ Invalid JSON response\n";
        echo $response . "\n";
    }
} else {
    echo "❌ No response received\n";
}