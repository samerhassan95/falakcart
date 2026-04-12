<?php

// Simple test to check if API is working
$url = 'http://127.0.0.1:8000/api/track/click?ref=test123';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => [
            'Accept: application/json',
            'Content-Type: application/json'
        ]
    ]
]);

echo "Testing URL: $url\n";

$response = file_get_contents($url, false, $context);

if ($response === false) {
    echo "Error: Could not connect to API\n";
    echo "HTTP Response Headers:\n";
    print_r($http_response_header ?? []);
} else {
    echo "Success! Response:\n";
    echo $response . "\n";
}