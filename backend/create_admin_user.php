<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

try {
    // Create admin user
    $admin = User::firstOrCreate(
        ['email' => 'admin@falakcart.com'],
        [
            'name' => 'Admin User',
            'password' => bcrypt('admin123'),
            'role' => 'admin'
        ]
    );

    echo "✅ تم إنشاء المدير بنجاح!\n";
    echo "البريد الإلكتروني: admin@falakcart.com\n";
    echo "كلمة المرور: admin123\n";
    echo "الدور: admin\n";

} catch (Exception $e) {
    echo "❌ خطأ في إنشاء المدير: " . $e->getMessage() . "\n";
}