<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

try {
    $user = User::where('email', 'samer@gmail.com')->first();
    
    if ($user) {
        $user->password = bcrypt('samer123');
        $user->save();
        
        echo "✅ تم تغيير كلمة المرور بنجاح!\n";
        echo "البريد: samer@gmail.com\n";
        echo "كلمة المرور الجديدة: samer123\n";
        echo "كود الإحالة: 8A1FF41E\n";
    } else {
        echo "❌ المستخدم غير موجود\n";
    }
} catch (Exception $e) {
    echo "❌ خطأ: " . $e->getMessage() . "\n";
}