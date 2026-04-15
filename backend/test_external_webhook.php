<?php

// اختبار الوصول للـ webhook من الخارج
$webhookUrl = 'https://togaar.com/api/webhook/falakcart';

echo "🌐 اختبار الوصول للـ Webhook من الخارج\n";
echo "==========================================\n\n";

// اختبار 1: فحص إمكانية الوصول للموقع
echo "1️⃣ فحص الوصول للموقع الأساسي:\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://togaar.com');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "   ❌ خطأ في الاتصال: $error\n";
} else {
    echo "   ✅ الموقع يعمل - HTTP Status: $httpCode\n";
}

// اختبار 2: فحص API endpoint
echo "\n2️⃣ فحص API endpoint:\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://togaar.com/api/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "   ❌ خطأ في API: $error\n";
} else {
    echo "   ✅ API يعمل - HTTP Status: $httpCode\n";
    if ($response) {
        echo "   Response: $response\n";
    }
}

// اختبار 3: فحص webhook endpoint بـ GET request
echo "\n3️⃣ فحص webhook endpoint (GET):\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "   ❌ خطأ في webhook endpoint: $error\n";
} else {
    echo "   HTTP Status: $httpCode\n";
    if ($httpCode == 405) {
        echo "   ✅ Endpoint موجود (405 = Method Not Allowed للـ GET)\n";
    } elseif ($httpCode == 200) {
        echo "   ✅ Endpoint يعمل\n";
    } else {
        echo "   ⚠️  Status غير متوقع\n";
    }
}

// اختبار 4: فحص webhook endpoint بـ POST request
echo "\n4️⃣ فحص webhook endpoint (POST):\n";

$testPayload = json_encode([
    "event" => "test.connection",
    "sent_at" => date('c'),
    "data" => [
        "test" => true,
        "source" => "external_test"
    ]
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $testPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: test-external-signature',
    'User-Agent: External-Test/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "   ❌ خطأ في POST request: $error\n";
} else {
    echo "   HTTP Status: $httpCode\n";
    echo "   Response: $response\n";
    
    if ($httpCode == 200) {
        echo "   ✅ Webhook endpoint يستقبل POST requests\n";
    } elseif ($httpCode == 401) {
        echo "   ✅ Endpoint يعمل (401 = Invalid signature)\n";
    } elseif ($httpCode == 400) {
        echo "   ✅ Endpoint يعمل (400 = Unknown event)\n";
    } else {
        echo "   ⚠️  Status غير متوقع\n";
    }
}

echo "\n5️⃣ معلومات إضافية للمطورين:\n";
echo "   Webhook URL: $webhookUrl\n";
echo "   Expected Content-Type: application/json\n";
echo "   Expected Header: X-Webhook-Signature\n";
echo "   Expected Method: POST\n";

echo "\n6️⃣ خطوات التحقق للمطورين:\n";
echo "   1. تأكد من أن Apache/Nginx يوجه الطلبات لـ Laravel\n";
echo "   2. تحقق من .htaccess في public folder\n";
echo "   3. تأكد من أن SSL certificate صالح\n";
echo "   4. تحقق من firewall settings\n";
echo "   5. راجع error logs في الخادم\n";

echo "\n✅ انتهى الاختبار الخارجي\n";