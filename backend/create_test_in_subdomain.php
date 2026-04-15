<?php

echo "🔧 إنشاء Test Endpoint في مجلد منفصل\n";
echo "=====================================\n\n";

// إنشاء مجلد test
$testDir = '/www/wwwroot/togaar.com/test';
if (!is_dir($testDir)) {
    mkdir($testDir, 0755, true);
    echo "✅ تم إنشاء مجلد: $testDir\n";
}

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
$logFile = "/www/wwwroot/togaar.com/test/webhook_test.log";
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
    "headers_count" => count($headers),
    "message" => "Webhook test endpoint is working!"
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>';

// كتابة الملف في test directory
$testPath = $testDir . '/webhook.php';
file_put_contents($testPath, $testEndpointContent);

echo "✅ تم إنشاء Test Endpoint في: $testPath\n";
echo "🌐 URL للاختبار: https://togaar.com/test/webhook.php\n";

// إنشاء .htaccess للـ test directory
$htaccessContent = 'RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ webhook.php [QSA,L]

# Allow all methods
<Limit GET POST PUT DELETE OPTIONS>
    Allow from all
</Limit>

# Set proper headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Webhook-Signature"
';

file_put_contents($testDir . '/.htaccess', $htaccessContent);
echo "✅ تم إنشاء .htaccess في test directory\n";

// إنشاء index.php للـ test directory
$indexContent = '<!DOCTYPE html>
<html>
<head>
    <title>Webhook Test Directory</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 15px; background: #d4edda; color: #155724; border-radius: 5px; margin: 20px 0; }
        .endpoint { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; }
        .btn { display: inline-block; padding: 10px 20px; background: #007cba; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        .btn:hover { background: #005a87; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Webhook Test Directory</h1>
        
        <div class="status">
            ✅ Test endpoint is ready and working!
        </div>
        
        <h2>📋 Test Information:</h2>
        <div class="endpoint">
            <strong>Webhook URL:</strong> https://togaar.com/test/webhook.php<br>
            <strong>Method:</strong> POST<br>
            <strong>Content-Type:</strong> application/json<br>
            <strong>Headers:</strong> X-Webhook-Signature (optional)<br>
        </div>
        
        <h2>🔧 Actions:</h2>
        <a href="webhook.php" class="btn">Test GET Request</a>
        <a href="logs.php" class="btn">View Logs</a>
        
        <h2>📝 Instructions for FalakCart Team:</h2>
        <ol>
            <li>Use this URL for webhook testing: <code>https://togaar.com/test/webhook.php</code></li>
            <li>Send POST requests with JSON payload</li>
            <li>Include X-Webhook-Signature header if needed</li>
            <li>Check logs at: <code>https://togaar.com/test/logs.php</code></li>
        </ol>
        
        <p><em>This endpoint will log all incoming requests for debugging purposes.</em></p>
    </div>
</body>
</html>';

file_put_contents($testDir . '/index.php', $indexContent);

// إنشاء log viewer
$logViewerContent = '<?php
$logFile = "/www/wwwroot/togaar.com/test/webhook_test.log";
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
        <p>Monitor incoming webhook requests to togaar.com/test/</p>
    </div>
    
    <div class="controls">
        <a href="index.php" class="btn">🏠 Home</a>
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
</body>
</html>';

file_put_contents($testDir . '/logs.php', $logViewerContent);

echo "✅ تم إنشاء Log Viewer في: $testDir/logs.php\n";
echo "🌐 URL لعرض الـ Logs: https://togaar.com/test/logs.php\n\n";

echo "🔧 اختبار سريع:\n";
$testUrl = 'https://togaar.com/test/webhook.php';
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
if ($httpCode == 200) {
    echo "✅ Test endpoint يعمل!\n";
    echo "Response: " . substr($response, 0, 200) . "...\n";
} else {
    echo "❌ Test endpoint لا يعمل\n";
    echo "Response: " . substr($response, 0, 200) . "...\n";
}

echo "\n📋 الخطوات التالية:\n";
echo "1. أعطي فريق فلك كارت الـ URL: https://togaar.com/test/webhook.php\n";
echo "2. راقب الـ logs في: https://togaar.com/test/logs.php\n";
echo "3. زور الصفحة الرئيسية: https://togaar.com/test/\n";
echo "4. لو شغال، يبقى المشكلة في Laravel routing\n";
echo "5. لو مش شغال، يبقى المشكلة في web server configuration\n";