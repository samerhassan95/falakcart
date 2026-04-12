<?php
// Simple API test script for togaar.com
// Run this from the backend directory: php ../test-api-simple.php

echo "🧪 Testing FalakCart API for togaar.com\n";
echo "=====================================\n\n";

// Change to backend directory
$backendDir = __DIR__ . '/backend';
if (!is_dir($backendDir)) {
    echo "❌ Backend directory not found: $backendDir\n";
    exit(1);
}

chdir($backendDir);

// Check if Laravel is properly configured
echo "1️⃣ Checking Laravel configuration...\n";

// Load Laravel
if (!file_exists('vendor/autoload.php')) {
    echo "❌ Composer dependencies not installed\n";
    echo "Run: composer install\n";
    exit(1);
}

require_once 'vendor/autoload.php';

// Check .env file
if (!file_exists('.env')) {
    echo "❌ .env file not found\n";
    exit(1);
}

// Load environment
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/backend');
$dotenv->load();

echo "✅ Laravel environment loaded\n";

// Test database connection
echo "\n2️⃣ Testing database connection...\n";

try {
    // Set up minimal Laravel app for testing
    $app = require_once 'bootstrap/app.php';
    $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
    
    // Test database
    $pdo = DB::connection()->getPdo();
    echo "✅ Database connection successful\n";
    
    // Check if tables exist
    $tables = DB::select("SHOW TABLES");
    echo "✅ Found " . count($tables) . " database tables\n";
    
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    echo "\nDatabase configuration:\n";
    echo "DB_CONNECTION: " . env('DB_CONNECTION') . "\n";
    echo "DB_HOST: " . env('DB_HOST') . "\n";
    echo "DB_PORT: " . env('DB_PORT') . "\n";
    echo "DB_DATABASE: " . env('DB_DATABASE') . "\n";
    echo "DB_USERNAME: " . env('DB_USERNAME') . "\n";
}

// Test API routes
echo "\n3️⃣ Testing API routes...\n";

try {
    // Simulate API request
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/health';
    $_SERVER['SCRIPT_NAME'] = '/index.php';
    $_SERVER['HTTP_HOST'] = 'togaar.com';
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_NAME'] = 'togaar.com';
    $_SERVER['SERVER_PORT'] = '443';
    
    ob_start();
    
    // Include the Laravel entry point
    include 'public/index.php';
    
    $output = ob_get_clean();
    
    if (strpos($output, 'ok') !== false || strpos($output, 'running') !== false) {
        echo "✅ API health endpoint working\n";
        echo "Response: " . trim($output) . "\n";
    } else {
        echo "❌ API health endpoint failed\n";
        echo "Response: " . substr($output, 0, 200) . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ API test failed: " . $e->getMessage() . "\n";
}

// Test key configurations
echo "\n4️⃣ Checking key configurations...\n";

$appKey = env('APP_KEY');
if (empty($appKey)) {
    echo "❌ APP_KEY is not set\n";
    echo "Run: php artisan key:generate\n";
} else {
    echo "✅ APP_KEY is configured\n";
}

$jwtSecret = env('JWT_SECRET');
if (empty($jwtSecret)) {
    echo "❌ JWT_SECRET is not set\n";
    echo "Run: php artisan jwt:secret\n";
} else {
    echo "✅ JWT_SECRET is configured\n";
}

echo "\n🎉 API test completed!\n";
echo "\nNext steps:\n";
echo "1. If database failed, check MySQL service and credentials\n";
echo "2. If API failed, check Laravel logs: storage/logs/laravel.log\n";
echo "3. Test the API via web: https://togaar.com/api/health\n";