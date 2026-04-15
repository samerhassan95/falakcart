<?php

echo "🔧 إنشاء Simple Test Endpoint\n";
echo "=============================\n\n";

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
$logFile = "/www/wwwroot/togaar.com/webhook_test.log";
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

// كتابة الملف في root directory
$rootPath = '/www/wwwroot/togaar.com/webhook-test.php';
file_put_contents($rootPath, $testEndpointContent);

echo "✅ تم إنشاء Test Endpoint في: $rootPath\n";
echo "🌐 URL للاختبار: https://togaar.com/webhook-test.php\n";
echo "📝 Log File: /www/wwwroot/togaar.com/webhook_test.log\n\n";

// إنشاء ملف لعرض الـ logs
$logViewerContent = '<?php
$logFile = "/www/wwwroot/togaar.com/webhook_test.log";
?>
<!DOCTYPE html>
<html>
<head>
    <title>Webhook Test Logs</title>
    <meta charset="utf-8">
    <style>
        body { font-family: monospace; margin: 20px; background: #f5f5f5; }
        .header { background: #333; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
        .log-entry { border: 1px solid #ccc; margin: 10px 0; padding: 15px; background: white; border-radius: 5px; }
        .timestamp { color: #666; font-weight: bold; }
        .method { color: #0066cc; font-weight: bold; }
        .ip { color: #cc6600; }
        pre { background: #eee; padding: 10px; overflow-x: auto; border-radius: 3px; }
        .controls { margin: 20px 0; }
        .btn { padding: 10px 20px; margin: 5px; background: #007cba; color: white; text-decoration: none; border-radius: 3px; }
        .btn:hover { background: #005a87; }
        .clear-btn { background: #dc3545; }
        .clear-btn:hover { background: #c82333; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Webhook Test Logs</h1>
        <p>Monitor incoming webhook requests to togaar.com</p>
    </div>
    
    <div class="controls">
        <a href="?clear=1" class="btn clear-btn" onclick="return confirm(\'Clear all logs?\')">🗑️ Clear Logs</a>
        <a href="javascript:location.reload()" class="btn">🔄 Refresh</a>
        <span style="margin-left: 20px;">Last updated: <?= date("Y-m-d H:i:s") ?></span>
    </div>
    
    <?php
    if (isset($_GET["clear"])) {
        file_put_contents($logFile, "");
        echo "<div style=\"background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin: 10px 0;\">✅ Logs cleared!</div>";
    }
    
    if (file_exists($logFile)) {
        $content = file_get_contents($logFile);
        if (!empty($content)) {
            $entries = explode("---", $content);
            $count = 0;
            foreach (array_reverse($entries) as $entry) {
                $entry = trim($entry);
                if (!empty($entry)) {
                    $count++;
                    $data = json_decode($entry, true);
                    if ($data) {
                        echo "<div class=\"log-entry\">";
                        echo "<div><span class=\"timestamp\">🕒 " . $data["timestamp"] . "</span> | ";
                        echo "<span class=\"method\">" . $data["method"] . "</span> | ";
                        echo "<span class=\"ip\">📍 " . $data["ip"] . "</span></div>";
                        echo "<h4>Headers:</h4>";
                        echo "<pre>" . json_encode($data["headers"], JSON_PRETTY_PRINT) . "</pre>";
                        echo "<h4>Body:</h4>";
                        echo "<pre>" . htmlspecialchars($data["body"]) . "</pre>";
                        echo "</div>";
                    } else {
                        echo "<div class=\"log-entry\">";
                        echo "<pre>" . htmlspecialchars($entry) . "</pre>";
                        echo "</div>";
                    }
                }
            }
            echo "<p><strong>Total entries: $count</strong></p>";
        } else {
            echo "<div style=\"background: #fff3cd; color: #856404; padding: 20px; border-radius: 5px; text-align: center;\">";
            echo "<h3>📭 No logs yet</h3>";
            echo "<p>Waiting for webhook requests...</p>";
            echo "</div>";
        }
    } else {
        echo "<div style=\"background: #f8d7da; color: #721c24; padding: 20px; border-radius: 5px; text-align: center;\">";
        echo "<h3>❌ Log file not found</h3>";
        echo "<p>The log file will be created when the first request arrives.</p>";
        echo "</div>";
    }
    ?>
    
    <div style="margin-top: 40px; padding: 20px; background: #e9ecef; border-radius: 5px;">
        <h3>📋 Instructions for FalakCart Team:</h3>
        <ol>
            <li><strong>Test URL:</strong> <code>https://togaar.com/webhook-test.php</code></li>
            <li><strong>Method:</strong> POST</li>
            <li><strong>Content-Type:</strong> application/json</li>
            <li><strong>Headers:</strong> Include X-Webhook-Signature if needed</li>
            <li><strong>Body:</strong> Any JSON payload</li>
        </ol>
        <p><strong>This page will automatically log all incoming requests for debugging.</strong></p>
    </div>
</body>
</html>';

$logViewerPath = '/www/wwwroot/togaar.com/webhook-logs.php';
file_put_contents($logViewerPath, $logViewerContent);

echo "✅ تم إنشاء Log Viewer في: $logViewerPath\n";
echo "🌐 URL لعرض الـ Logs: https://togaar.com/webhook-logs.php\n\n";

echo "🔧 اختبار سريع:\n";
$testUrl = 'https://togaar.com/webhook-test.php';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $testUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{"test": "from_server", "timestamp": "' . date('c') . '"}');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: test-signature',
    'User-Agent: Server-Test/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Test Response: HTTP $httpCode\n";
echo "Response Body: $response\n";

echo "\n✅ Test Endpoint جاهز!\n";
echo "\n📋 الخطوات التالية:\n";
echo "1. أعطي فريق فلك كارت الـ URL: https://togaar.com/webhook-test.php\n";
echo "2. راقب الـ logs في: https://togaar.com/webhook-logs.php\n";
echo "3. لو وصلت الـ requests، يبقى المشكلة في Laravel routing\n";
echo "4. لو مش وصلت، يبقى المشكلة في الشبكة أو الخادم\n";