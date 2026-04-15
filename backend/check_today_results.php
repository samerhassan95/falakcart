<?php
require_once 'vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Database connection
$host = $_ENV['DB_HOST'];
$port = $_ENV['DB_PORT'];
$dbname = $_ENV['DB_DATABASE'];
$username = $_ENV['DB_USERNAME'];
$password = $_ENV['DB_PASSWORD'];

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "📅 فحص نتائج اليوم (2026-04-15)\n";
    echo "===============================\n\n";
    
    $today = '2026-04-15';
    
    // Check today's clicks
    echo "1️⃣ نقرات اليوم:\n";
    $stmt = $pdo->prepare("SELECT * FROM clicks WHERE DATE(created_at) = ? ORDER BY created_at DESC");
    $stmt->execute([$today]);
    $clicks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($clicks)) {
        echo "❌ لا توجد نقرات اليوم\n\n";
    } else {
        foreach ($clicks as $click) {
            echo "- ID: {$click['id']}, Code: {$click['referral_code']}, Email: {$click['customer_email']}, Time: {$click['created_at']}\n";
        }
        echo "إجمالي: " . count($clicks) . " نقرة\n\n";
    }
    
    // Check today's sales
    echo "2️⃣ مبيعات اليوم:\n";
    $stmt = $pdo->prepare("SELECT * FROM sales WHERE DATE(created_at) = ? ORDER BY created_at DESC");
    $stmt->execute([$today]);
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($sales)) {
        echo "❌ لا توجد مبيعات اليوم\n\n";
    } else {
        $totalAmount = 0;
        $totalCommission = 0;
        foreach ($sales as $sale) {
            echo "- ID: {$sale['id']}, Amount: {$sale['amount']} {$sale['currency']}, Commission: {$sale['commission_amount']}, Plan: {$sale['plan_name']}, Customer: {$sale['customer_name']}, Time: {$sale['created_at']}\n";
            $totalAmount += $sale['amount'];
            $totalCommission += $sale['commission_amount'];
        }
        echo "إجمالي: " . count($sales) . " مبيعة، المبلغ: $totalAmount، العمولة: $totalCommission\n\n";
    }
    
    // Check today's transactions
    echo "3️⃣ معاملات اليوم:\n";
    $stmt = $pdo->prepare("SELECT * FROM transactions WHERE DATE(created_at) = ? ORDER BY created_at DESC");
    $stmt->execute([$today]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($transactions)) {
        echo "❌ لا توجد معاملات اليوم\n\n";
    } else {
        foreach ($transactions as $transaction) {
            $desc = $transaction['description'] ?? 'No description';
            echo "- ID: {$transaction['id']}, Type: {$transaction['type']}, Amount: {$transaction['amount']}, Description: $desc, Time: {$transaction['created_at']}\n";
        }
        echo "إجمالي: " . count($transactions) . " معاملة\n\n";
    }
    
    // Check today's notifications
    echo "4️⃣ إشعارات اليوم:\n";
    $stmt = $pdo->prepare("SELECT * FROM notifications WHERE DATE(created_at) = ? ORDER BY created_at DESC");
    $stmt->execute([$today]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($notifications)) {
        echo "❌ لا توجد إشعارات اليوم\n\n";
    } else {
        foreach ($notifications as $notification) {
            echo "- ID: {$notification['id']}, Type: {$notification['type']}, Title: {$notification['title']}, Message: {$notification['message']}, Time: {$notification['created_at']}\n";
        }
        echo "إجمالي: " . count($notifications) . " إشعار\n\n";
    }
    
    echo "✅ تم فحص نتائج اليوم بنجاح\n";
    
} catch (PDOException $e) {
    echo "❌ خطأ في الاتصال بقاعدة البيانات: " . $e->getMessage() . "\n";
}
?>