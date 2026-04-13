<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Transaction;
use App\Models\Affiliate;

$affiliate = Affiliate::where('user_id', 2)->first();
echo "Fixing Affiliate ID: " . $affiliate->id . "\n";

// 1. Delete the duplicate payout transaction (id 24)
$duplicate = Transaction::find(24);
if ($duplicate && $duplicate->type === 'payout' && $duplicate->status === 'pending') {
    $duplicate->delete();
    echo "Deleted duplicate payout ID 24\n";
}

// 2. Correct the balances
// Based on transactions: 
// Commissions = 780
// Pending Payouts = 660 (id 23)
// Available = 780 - 660 = 120
$affiliate->total_earnings = 780;
$affiliate->available_balance = 120;
$affiliate->pending_balance = 660;
$affiliate->paid_balance = 0;
$affiliate->save();

echo "Balances corrected.\n";
echo "Total: {$affiliate->total_earnings} | Available: {$affiliate->available_balance} | Pending: {$affiliate->pending_balance}\n";
