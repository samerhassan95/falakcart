<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Affiliate;
use App\Models\User;

echo "🔍 جميع الأفلييت الموجودين في قاعدة البيانات:\n";
echo "=" . str_repeat("=", 50) . "\n\n";

$affiliates = Affiliate::with('user')->get();

if ($affiliates->count() == 0) {
    echo "❌ لا يوجد أي أفلييت في قاعدة البيانات!\n";
} else {
    foreach ($affiliates as $affiliate) {
        echo "👤 الاسم: {$affiliate->user->name}\n";
        echo "📧 البريد: {$affiliate->user->email}\n";
        echo "🔗 كود الإحالة: {$affiliate->referral_code}\n";
        echo "💰 الرصيد: {$affiliate->available_balance}\n";
        echo "📈 إجمالي الأرباح: {$affiliate->total_earnings}\n";
        echo "📊 المبيعات: " . $affiliate->sales()->count() . "\n";
        echo "👆 النقرات: " . $affiliate->clicks()->count() . "\n";
        echo "📅 تاريخ الإنشاء: {$affiliate->created_at}\n";
        echo "-" . str_repeat("-", 50) . "\n\n";
    }
}

echo "🔍 جميع المستخدمين:\n";
echo "=" . str_repeat("=", 30) . "\n\n";

$users = User::all();
foreach ($users as $user) {
    echo "👤 {$user->name} ({$user->email}) - {$user->role}\n";
}