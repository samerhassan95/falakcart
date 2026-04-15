<?php
require_once 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$pdo = new PDO("mysql:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']};dbname={$_ENV['DB_DATABASE']}", $_ENV['DB_USERNAME'], $_ENV['DB_PASSWORD']);

echo "آخر 10 مبيعات:\n";
echo "===============\n";

$stmt = $pdo->query('SELECT * FROM sales ORDER BY id DESC LIMIT 10');
$sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($sales as $sale) {
    echo "ID: {$sale['id']}, Amount: {$sale['amount']}, Plan: {$sale['plan_name']}, Customer: {$sale['customer_name']}, Time: {$sale['created_at']}\n";
}

echo "\nآخر 5 معاملات:\n";
echo "===============\n";

$stmt = $pdo->query('SELECT * FROM transactions ORDER BY id DESC LIMIT 5');
$transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($transactions as $transaction) {
    $desc = $transaction['description'] ?? 'No description';
    echo "ID: {$transaction['id']}, Type: {$transaction['type']}, Amount: {$transaction['amount']}, Description: $desc, Time: {$transaction['created_at']}\n";
}
?>