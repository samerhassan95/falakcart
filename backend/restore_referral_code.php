<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Affiliate;

try {
    // البحث عن الأفلييت بالكود الحالي
    $affiliate = Affiliate::where('referral_code', '8a1ff41e-luanda')->first();
    
    if ($affiliate) {
        // إرجاع الكود للكود الأصلي
        $affiliate->referral_code = '8A1FF41E';
        $affiliate->save();
        
        echo "✅ تم إرجاع كود الإحالة للأصل بنجاح!\n";
        echo "الكود الحالي: 8A1FF41E\n";
        echo "الأفلييت: {$affiliate->user->name} ({$affiliate->user->email})\n";
    } else {
        echo "❌ لم يتم العثور على الأفلييت\n";
    }
} catch (Exception $e) {
    echo "❌ خطأ: " . $e->getMessage() . "\n";
}