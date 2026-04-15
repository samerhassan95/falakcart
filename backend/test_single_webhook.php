<?php
/**
 * اختبار ويبهوك واحد بس عشان نشوف المشكلة فين
 */

echo "🔍 اختبار ويبهوك واحد\n";
echo "===================\n\n";

$webhookUrl = 'https://togaar.com/api/webhook/falakcart';
$secret = '0KZwjBiG8SniS1wT6kfO13t6sspH2DRVXUaIdIxjbfs=';

// Simple subscription test
$payload = [
    'event' => 'affiliate.subscription',
    'data' => [
        'callback_id' => 'single-test-' . uniqid(),
        'occurred_at' => date('c'),
        'action' => 'subscribed',
        'referral' => [
            'source' => 'website',
            'referral_code' => '8a1ff41e'
        ],
        'user' => [
            'id' => 99999,
            'name' => 'Single Test User',
            'email' => 'single@test.com',
            'phone' => '+966501111111'
        ],
        'subscription' => [
            'id' => 888888,
            'plan_id' => 1,
            'plan_name' => 'Basic Plan',
            'status' => 'active',
            'price' => '99.00',
            'currency' => 'SAR',
            'billing_cycle' => 'monthly',
            'start_date' => date('Y-m-d'),
            'end_date' => date('Y-m-d', strtotime('+1 month'))
        ]
    ]
];

$payloadJson = json_encode($payload);
$signature = 'sha256=' . hash_hmac('sha256', $payloadJson, $secret);

echo "Payload: " . substr($payloadJson, 0, 200) . "...\n";
echo "Signature: $signature\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payloadJson);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: ' . $signature,
    'User-Agent: SingleTest/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_VERBOSE, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
if ($error) {
    echo "cURL Error: $error\n";
}
echo "Response: $response\n\n";

if ($httpCode == 200) {
    echo "✅ الطلب نجح - الآن نفحص الداتابيس\n";
    
    // Check database
    require_once 'vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
    
    try {
        $pdo = new PDO("mysql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}", $_ENV['DB_USERNAME'], $_ENV['DB_PASSWORD']);
        
        // Check if the sale was created
        $stmt = $pdo->prepare("SELECT * FROM sales WHERE subscription_id = ? ORDER BY created_at DESC LIMIT 1");
        $stmt->execute([888888]);
        $sale = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($sale) {
            echo "✅ المبيعة اتسجلت في الداتابيس:\n";
            echo "- ID: {$sale['id']}\n";
            echo "- Amount: {$sale['amount']}\n";
            echo "- Commission: {$sale['commission_amount']}\n";
            echo "- Plan: {$sale['plan_name']}\n";
            echo "- Time: {$sale['created_at']}\n";
        } else {
            echo "❌ المبيعة مش موجودة في الداتابيس\n";
        }
        
    } catch (Exception $e) {
        echo "❌ خطأ في فحص الداتابيس: " . $e->getMessage() . "\n";
    }
    
} else {
    echo "❌ الطلب فشل\n";
}
?>