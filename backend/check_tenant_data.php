<?php
require_once 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$pdo = new PDO("mysql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}", $_ENV['DB_USERNAME'], $_ENV['DB_PASSWORD']);

echo "🏢 فحص بيانات الـ Tenant في آخر المبيعات\n";
echo "=====================================\n\n";

$stmt = $pdo->query('SELECT * FROM sales ORDER BY id DESC LIMIT 5');
$sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($sales as $sale) {
    echo "Sale ID: {$sale['id']}\n";
    echo "- Customer: {$sale['customer_name']}\n";
    echo "- Plan: {$sale['plan_name']}\n";
    echo "- Amount: {$sale['amount']} {$sale['currency']}\n";
    echo "- Commission: {$sale['commission_amount']}\n";
    
    if (isset($sale['tenant_id'])) {
        echo "- Tenant ID: {$sale['tenant_id']}\n";
        echo "- Tenant Name: {$sale['tenant_name']}\n";
        echo "- Tenant Subdomain: {$sale['tenant_subdomain']}\n";
        echo "- Tenant Status: {$sale['tenant_status']}\n";
    } else {
        echo "- Tenant: No tenant fields (old record)\n";
    }
    
    echo "- Created: {$sale['created_at']}\n";
    echo "---\n";
}
?>