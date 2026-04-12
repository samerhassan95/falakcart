<?php

// Test click tracking
echo "🖱️ اختبار تسجيل النقرات\n";
echo "=" . str_repeat("=", 30) . "\n\n";

// Test 1: Click with main referral code
echo "1. اختبار النقرة بالكود الرئيسي (8A1FF41E):\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/track/click?ref=8A1FF41E');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

// Test 2: Click with custom link
echo "2. اختبار النقرة بالرابط المخصص (8a1ff41e-luanda):\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/track/click?ref=8a1ff41e-luanda');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

// Test 3: Multiple clicks
echo "3. اختبار عدة نقرات متتالية:\n";
for ($i = 1; $i <= 3; $i++) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8000/api/track/click?ref=8A1FF41E');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "نقرة $i: HTTP $httpCode\n";
}

echo "\n✅ انتهى الاختبار - ارجع للداشبورد وشوف لو النقرات زادت!\n";