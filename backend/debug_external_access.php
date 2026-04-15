<?php

echo "🔍 تشخيص الوصول الخارجي للـ Webhook\n";
echo "=====================================\n\n";

$webhookUrl = 'https://togaar.com/api/webhook/falakcart';

// اختبار 1: فحص الـ SSL Certificate
echo "1️⃣ فحص SSL Certificate:\n";
$sslContext = stream_context_create([
    "ssl" => [
        "verify_peer" => true,
        "verify_peer_name" => true,
        "capture_peer_cert" => true
    ]
]);

$result = @file_get_contents($webhookUrl, false, $sslContext);
if ($result !== false) {
    echo "   ✅ SSL Certificate صحيح\n";
} else {
    echo "   ❌ مشكلة في SSL Certificate\n";
    $error = error_get_last();
    echo "   Error: " . $error['message'] . "\n";
}

// اختبار 2: فحص الـ DNS Resolution
echo "\n2️⃣ فحص DNS Resolution:\n";
$ip = gethostbyname('togaar.com');
if ($ip !== 'togaar.com') {
    echo "   ✅ DNS يعمل: togaar.com -> $ip\n";
} else {
    echo "   ❌ مشكلة في DNS Resolution\n";
}

// اختبار 3: فحص الـ Port 443
echo "\n3️⃣ فحص Port 443 (HTTPS):\n";
$connection = @fsockopen('togaar.com', 443, $errno, $errstr, 10);
if ($connection) {
    echo "   ✅ Port 443 مفتوح\n";
    fclose($connection);
} else {
    echo "   ❌ Port 443 مغلق أو غير متاح\n";
    echo "   Error: $errstr ($errno)\n";
}

// اختبار 4: فحص الـ HTTP Headers
echo "\n4️⃣ فحص HTTP Headers:\n";
$headers = @get_headers($webhookUrl, 1);
if ($headers) {
    echo "   ✅ HTTP Headers متاحة:\n";
    foreach ($headers as $key => $value) {
        if (is_numeric($key)) {
            echo "   - $value\n";
        } else {
            echo "   - $key: " . (is_array($value) ? implode(', ', $value) : $value) . "\n";
        }
    }
} else {
    echo "   ❌ لا يمكن الحصول على HTTP Headers\n";
}

// اختبار 5: فحص من خدمات خارجية
echo "\n5️⃣ اختبار من خدمات خارجية:\n";
echo "   🌐 اختبر الـ URL من:\n";
echo "   - https://httpstatus.io/?url=https://togaar.com/api/webhook/falakcart\n";
echo "   - https://www.whatsmydns.net/#A/togaar.com\n";
echo "   - https://www.ssllabs.com/ssltest/analyze.html?d=togaar.com\n";

// اختبار 6: فحص User-Agent Restrictions
echo "\n6️⃣ اختبار User-Agent مختلفة:\n";
$userAgents = [
    'FalakCart-Webhook/1.0',
    'Mozilla/5.0 (compatible; FalakCart/1.0)',
    'curl/7.68.0',
    'PostmanRuntime/7.28.0'
];

foreach ($userAgents as $ua) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $webhookUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, $ua);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "   - $ua: HTTP $httpCode\n";
}

// اختبار 7: فحص Rate Limiting
echo "\n7️⃣ فحص Rate Limiting:\n";
$requests = 0;
$successful = 0;
for ($i = 0; $i < 5; $i++) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $webhookUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $requests++;
    if ($httpCode == 200 || $httpCode == 405 || $httpCode == 400) {
        $successful++;
    }
    
    usleep(500000); // 0.5 second delay
}

echo "   Requests: $requests, Successful: $successful\n";
if ($successful < $requests) {
    echo "   ⚠️  ممكن يكون في Rate Limiting\n";
} else {
    echo "   ✅ لا يوجد Rate Limiting واضح\n";
}

echo "\n8️⃣ معلومات الخادم:\n";
echo "   Server IP: $ip\n";
echo "   Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n";
echo "   PHP Version: " . PHP_VERSION . "\n";
echo "   Current Time: " . date('Y-m-d H:i:s T') . "\n";

echo "\n✅ انتهى التشخيص\n";
echo "\n📋 الخطوات التالية:\n";
echo "1. تحقق من إعدادات Firewall في aaPanel\n";
echo "2. تحقق من SSL Certificate\n";
echo "3. تحقق من Virtual Host Configuration\n";
echo "4. تحقق من .htaccess rules\n";
echo "5. تحقق من Rate Limiting في Nginx/Apache\n";