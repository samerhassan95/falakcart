<?php
require_once 'vendor/autoload.php';

echo "🔍 فحص اتصال قاعدة البيانات\n";
echo "============================\n\n";

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "Environment Variables:\n";
echo "DB_HOST: " . ($_ENV['DB_HOST'] ?? 'not set') . "\n";
echo "DB_PORT: " . ($_ENV['DB_PORT'] ?? 'not set') . "\n";
echo "DB_DATABASE: " . ($_ENV['DB_DATABASE'] ?? 'not set') . "\n";
echo "DB_USERNAME: " . ($_ENV['DB_USERNAME'] ?? 'not set') . "\n";
echo "DB_PASSWORD: " . (isset($_ENV['DB_PASSWORD']) ? '[SET]' : 'not set') . "\n\n";

try {
    $host = $_ENV['DB_HOST'];
    $port = $_ENV['DB_PORT'];
    $dbname = $_ENV['DB_DATABASE'];
    $username = $_ENV['DB_USERNAME'];
    $password = $_ENV['DB_PASSWORD'];
    
    echo "Connecting to: mysql:host=$host;port=$port;dbname=$dbname\n";
    
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ اتصال قاعدة البيانات نجح\n\n";
    
    // Test query
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM sales");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "إجمالي المبيعات في قاعدة البيانات: " . $result['count'] . "\n";
    
    // Check latest sale
    $stmt = $pdo->query("SELECT * FROM sales ORDER BY id DESC LIMIT 1");
    $sale = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($sale) {
        echo "آخر مبيعة:\n";
        echo "- ID: {$sale['id']}\n";
        echo "- Amount: {$sale['amount']}\n";
        echo "- Plan: {$sale['plan_name']}\n";
        echo "- Time: {$sale['created_at']}\n";
    } else {
        echo "❌ لا توجد مبيعات\n";
    }
    
    // Check if sale ID 52 exists
    $stmt = $pdo->prepare("SELECT * FROM sales WHERE id = ?");
    $stmt->execute([52]);
    $sale52 = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($sale52) {
        echo "\n✅ المبيعة رقم 52 موجودة:\n";
        echo "- Amount: {$sale52['amount']}\n";
        echo "- Plan: {$sale52['plan_name']}\n";
        echo "- Customer: {$sale52['customer_name']}\n";
        echo "- Time: {$sale52['created_at']}\n";
    } else {
        echo "\n❌ المبيعة رقم 52 غير موجودة\n";
    }
    
} catch (PDOException $e) {
    echo "❌ خطأ في الاتصال: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ خطأ عام: " . $e->getMessage() . "\n";
}
?>