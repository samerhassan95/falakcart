<?php
// Simple webhook debug endpoint
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Webhook-Signature');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $timestamp = date('Y-m-d H:i:s');
    $method = $_SERVER['REQUEST_METHOD'];
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    $headers = [];
    foreach ($_SERVER as $key => $value) {
        if (strpos($key, 'HTTP_') === 0) {
            $header = str_replace('HTTP_', '', $key);
            $header = str_replace('_', '-', $header);
            $headers[$header] = $value;
        }
    }
    
    $body = file_get_contents('php://input');
    
    $logEntry = [
        'timestamp' => $timestamp,
        'method' => $method,
        'ip' => $ip,
        'user_agent' => $userAgent,
        'headers' => $headers,
        'body' => $body,
        'body_length' => strlen($body)
    ];
    
    $logFile = __DIR__ . '/../storage/logs/webhook_debug.log';
    file_put_contents($logFile, json_encode($logEntry, JSON_PRETTY_PRINT) . "\n---\n", FILE_APPEND);
    
    http_response_code(200);
    echo json_encode([
        'status' => 'logged',
        'timestamp' => $timestamp,
        'method' => $method,
        'body_length' => strlen($body),
        'ip' => $ip
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>