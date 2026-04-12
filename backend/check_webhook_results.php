<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Affiliate;
use App\Models\Sale;
use App\Models\Click;
use App\Models\Notification;

$affiliate = Affiliate::where('referral_code', 'FRIEND2025')->first();

if ($affiliate) {
    echo "🎯 Affiliate: {$affiliate->user->name}\n";
    echo "💰 Available Balance: {$affiliate->available_balance} SAR\n";
    echo "📈 Total Earnings: {$affiliate->total_earnings} SAR\n";
    echo "🛒 Sales Count: " . $affiliate->sales()->count() . "\n";
    echo "👆 Clicks Count: " . $affiliate->clicks()->count() . "\n";
    echo "🔔 Notifications Count: " . Notification::where('user_id', $affiliate->user_id)->count() . "\n\n";
    
    echo "📊 Recent Sales:\n";
    foreach ($affiliate->sales()->latest()->take(3)->get() as $sale) {
        echo "  - {$sale->plan_name}: {$sale->amount} {$sale->currency} (Commission: {$sale->commission_amount})\n";
    }
    
    echo "\n🔔 Recent Notifications:\n";
    foreach (Notification::where('user_id', $affiliate->user_id)->latest()->take(3)->get() as $notification) {
        echo "  - {$notification->title}: {$notification->message}\n";
    }
} else {
    echo "❌ Affiliate not found\n";
}