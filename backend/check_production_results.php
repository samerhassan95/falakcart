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
    
    echo "🔍 فحص نتائج اختبار الإنتاج\n";
    echo "============================\n\n";
    
    // Check recent clicks
    echo "1️⃣ آخر النقرات المسجلة:\n";
    $stmt = $pdo->query("SELECT * FROM clicks ORDER BY created_at DESC LIMIT 5");
    $clicks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($clicks)) {
        echo "❌ لا توجد نقرات مسجلة\n\n";
    } else {
        foreach ($clicks as $click) {
            echo "- ID: {$click['id']}, Affiliate: {$click['affiliate_id']}, Code: {$click['referral_code']}, Time: {$click['created_at']}\n";
        }
        echo "\n";
    }
    
    // Check recent sales
    echo "2️⃣ آخر المبيعات المسجلة:\n";
    $stmt = $pdo->query("SELECT * FROM sales ORDER BY created_at DESC LIMIT 5");
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($sales)) {
        echo "❌ لا توجد مبيعات مسجلة\n\n";
    } else {
        foreach ($sales as $sale) {
            echo "- ID: {$sale['id']}, Amount: {$sale['amount']} {$sale['currency']}, Commission: {$sale['commission_amount']}, Plan: {$sale['plan_name']}, Time: {$sale['created_at']}\n";
        }
        echo "\n";
    }
    
    // Check recent transactions
    echo "3️⃣ آخر المعاملات المسجلة:\n";
    $stmt = $pdo->query("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5");
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($transactions)) {
        echo "❌ لا توجد معاملات مسجلة\n\n";
    } else {
        foreach ($transactions as $transaction) {
            echo "- ID: {$transaction['id']}, Type: {$transaction['type']}, Amount: {$transaction['amount']}, Description: {$transaction['description']}, Time: {$transaction['created_at']}\n";
        }
        echo "\n";
    }
    
    // Check affiliate balance
    echo "4️⃣ رصيد الأفيلييت (ID: 1):\n";
    $stmt = $pdo->prepare("SELECT * FROM affiliates WHERE id = 1");
    $stmt->execute();
    $affiliate = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($affiliate) {
        echo "- Total Earnings: {$affiliate['total_earnings']}\n";
        echo "- Available Balance: {$affiliate['available_balance']}\n";
        echo "- Referral Code: {$affiliate['referral_code']}\n\n";
    } else {
        echo "❌ لم يتم العثور على الأفيلييت\n\n";
    }
    
    // Check recent notifications
    echo "5️⃣ آخر الإشعارات:\n";
    $stmt = $pdo->query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5");
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($notifications)) {
        echo "❌ لا توجد إشعارات\n\n";
    } else {
        foreach ($notifications as $notification) {
            echo "- ID: {$notification['id']}, Type: {$notification['type']}, Title: {$notification['title']}, Time: {$notification['created_at']}\n";
        }
        echo "\n";
    }
    
    echo "✅ تم فحص النتائج بنجاح\n";
    
} catch (PDOException $e) {
    echo "❌ خطأ في الاتصال بقاعدة البيانات: " . $e->getMessage() . "\n";
}
?>