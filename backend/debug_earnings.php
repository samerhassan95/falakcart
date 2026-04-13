<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Transaction;
use App\Models\Affiliate;

$affiliate = Affiliate::where('user_id', 2)->first();
echo "Affiliate ID: " . $affiliate->id . "\n";
echo "Total Earnings: " . $affiliate->total_earnings . "\n";
echo "Available Balance: " . $affiliate->available_balance . "\n";
echo "Pending Balance: " . $affiliate->pending_balance . "\n";
echo "Paid Balance: " . $affiliate->paid_balance . "\n";

$transactions = Transaction::where('affiliate_id', $affiliate->id)->get();
echo "Transactions counts: " . $transactions->count() . "\n";
foreach ($transactions as $t) {
    echo "- id: {$t->id} | Type: {$t->type} | Amount: {$t->amount} | Status: {$t->status} | Date: {$t->created_at}\n";
}
