<?php

echo "🔧 إنشاء Webhook Test Endpoint\n";
echo "==============================\n\n";

// إنشاء endpoint بسيط للاختبار
$testEndpointContent = '<?php
// Simple webhook test endpoint
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Webhook-Signature");

// Handle preflight requests
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

// Log all incoming requests
$logFile = __DIR__ . "/webhook_test.log";
$timestamp = date("Y-m-d H:i:s");
$method = $_SERVER["REQUEST_METHOD"];
$headers = getallheaders();
$body = file_get_contents("php://input");
$ip = $_SERVER["REMOTE_ADDR"] ?? "unknown";

$logEntry = [
    "timestamp" => $timestamp,
    "method" => $method,
    "ip" => $ip,
    "headers" => $headers,
    "body" => $body,
    "get" => $_GET,
    "post" => $_POST
];

file_put_contents($logFile, json_encode($logEntry, JSON_PRETTY_PRINT) . "\n---\n", FILE_APPEND | LOCK_EX);

// Simple response
$response = [
    "status" => "received",
    "timestamp" => $timestamp,
    "method" => $method,
    "ip" => $ip,
    "body_length" => strlen($body),
    "headers_count" => count($headers)
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>';

// كتابة الملف في public directory
$publicPath = '../public/webhook-test.php';
file_put_contents($publicPath, $testEndpointContent);

echo "✅ تم إنشاء Test Endpoint في: $publicPath\n";
echo "🌐 URL للاختبار: https://togaar.com/webhook-test.php\n";
echo "📝 Log File: https://togaar.com/webhook_test.log\n\n";

// إنشاء ملف لعرض الـ logs
$logViewerContent = '<?php
$logFile = __DIR__ . "/webhook_test.log";
?>
<!DOCTYPE html>
<html>
<head>
    <title>Webhook Test Logs</title>
    <meta charset="utf-8">
    <style>
        body { font-family: monospace; margin: 20px; }
        .log-entry { border: 1px solid #ccc; margin: 10px 0; padding: 10px; background: #f9f9f9; }
        .timestamp { color: #666; font-weight: bold; }
        pre { background: #eee; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Webhook Test Logs</h1>
    <p>Last updated: <?= date("Y-m-d H:i:s") ?></p>
    <a href="?clear=1">Clear Logs</a> | <a href="javascript:location.reload()">Refresh</a>
    
    <?php
    if (isset($_GET["clear"])) {
        file_put_contents($logFile, "");
        echo "<p>Logs cleared!</p>";
    }
    
    if (file_exists($logFile)) {
        $content = file_get_contents($logFile);
        if (!empty($content)) {
            $entries = explode("---", $content);
            foreach (array_reverse($entries) as $entry) {
                $entry = trim($entry);
                if (!empty($entry)) {
                    echo "<div class=\"log-entry\">";
                    echo "<pre>" . htmlspecialchars($entry) . "</pre>";
                    echo "</div>";
                }
            }
        } else {
            echo "<p>No logs yet.</p>";
        }
    } else {
        echo "<p>Log file not found.</p>";
    }
    ?>
</body>
</html>';

$logViewerPath = '../public/webhook-logs.php';
file_put_contents($logViewerPath, $logViewerContent);

echo "✅ تم إنشاء Log Viewer في: $logViewerPath\n";
echo "🌐 URL لعرض الـ Logs: https://togaar.com/webhook-logs.php\n\n";

echo "📋 خطوات الاختبار:\n";
echo "1. أعطي فريق فلك كارت الـ URL: https://togaar.com/webhook-test.php\n";
echo "2. اطلب منهم يجربوا يبعتوا webhook\n";
echo "3. راقب الـ logs في: https://togaar.com/webhook-logs.php\n";
echo "4. لو وصل الـ request، يبقى المشكلة في Laravel routing\n";
echo "5. لو مش وصل، يبقى المشكلة في الخادم أو الشبكة\n\n";

echo "🔧 اختبار سريع:\n";
$testUrl = 'https://togaar.com/webhook-test.php';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $testUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{"test": "from_server"}');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Test Response: HTTP $httpCode\n";
echo "Response Body: $response\n";

echo "\n✅ Test Endpoint جاهز للاستخدام!\n";