<?php
// Simple webhook test endpoint
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Webhook-Signature');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$timestamp = date('Y-m-d H:i:s');
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

$response = [
    'status' => 'success',
    'message' => 'Webhook endpoint is accessible',
    'method' => $method,
    'timestamp' => $timestamp,
    'ip' => $ip,
    'server' => 'PHP',
    'path' => $_SERVER['REQUEST_URI'] ?? 'unknown'
];

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $headers = getallheaders();
    
    $response['payload_length'] = strlen($input);
    $response['content_type'] = $_SERVER['CONTENT_TYPE'] ?? 'unknown';
    $response['signature'] = $headers['X-Webhook-Signature'] ?? 'none';
    
    // Log the request
    $logData = [
        'timestamp' => $timestamp,
        'method' => $method,
        'ip' => $ip,
        'headers' => $headers,
        'payload' => $input,
        'payload_length' => strlen($input)
    ];
    
    file_put_contents('webhook-test.log', json_encode($logData) . "\n", FILE_APPEND);
}

http_response_code(200);
echo json_encode($response, JSON_PRETTY_PRINT);
?>