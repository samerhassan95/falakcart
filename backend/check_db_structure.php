<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "Checking affiliates table structure...\n\n";

try {
    $columns = Schema::getColumnListing('affiliates');
    echo "Columns in affiliates table:\n";
    foreach ($columns as $column) {
        echo "- $column\n";
    }
    
    echo "\nChecking for specific columns:\n";
    $requiredColumns = ['bio', 'avatar', 'email_notifications', 'sms_notifications', 'marketing_emails', 'weekly_reports', 'two_factor_enabled'];
    
    foreach ($requiredColumns as $column) {
        $exists = Schema::hasColumn('affiliates', $column);
        echo "- $column: " . ($exists ? "✅ EXISTS" : "❌ MISSING") . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}