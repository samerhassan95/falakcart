<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Affiliate;

try {
    // البحث عن الأفلييت بالكود القديم
    $affiliate = Affiliate::where('referral_code', '8A1FF41E')->first();
    
    if ($affiliate) {
        // تحديث الكود للكود الجديد
        $affiliate->referral_code = '8a1ff41e-luanda';
        $affiliate->save();
        
        echo "✅ تم تحديث كود الإحالة بنجاح!\n";
        echo "الكود القديم: 8A1FF41E\n";
        echo "الكود الجديد: 8a1ff41e-luanda\n";
        echo "الأفلييت: {$affiliate->user->name} ({$affiliate->user->email})\n";
    } else {
        echo "❌ لم يتم العثور على الأفلييت بالكود القديم\n";
    }
} catch (Exception $e) {
    echo "❌ خطأ: " . $e->getMessage() . "\n";
}