<?php
// Simple webhook logger - logs all requests to a file
$logFile = 'webhook_requests.log';

$timestamp = date('Y-m-d H:i:s');
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'] ?? 'unknown';
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
    'uri' => $uri,
    'ip' => $ip,
    'user_agent' => $userAgent,
    'headers' => $headers,
    'body' => $body,
    'body_length' => strlen($body)
];

// Log the request
file_put_contents($logFile, json_encode($logEntry, JSON_PRETTY_PRINT) . "\n" . str_repeat('=', 80) . "\n", FILE_APPEND);

// Return success response
header('Content-Type: application/json');
echo json_encode([
    'status' => 'logged',
    'timestamp' => $timestamp,
    'method' => $method,
    'uri' => $uri,
    'body_length' => strlen($body)
]);
?>