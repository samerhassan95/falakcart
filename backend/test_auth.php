<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $credentials = ['email' => 'admin@falakcart.com', 'password' => 'password'];
    if (! $token = JWTAuth::attempt($credentials)) {
        echo "Login failed: invalid credentials\n";
    } else {
        echo "Login success: token generated\n";
    }
} catch (Exception $e) {
    echo "Error: ". $e->getMessage(). "\n";
    echo $e->getTraceAsString(). "\n";
}
