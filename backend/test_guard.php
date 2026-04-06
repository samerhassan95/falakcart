<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Auth;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $credentials = ['email' => 'admin@falakcart.com', 'password' => 'password'];
    if (Auth::guard('api')->attempt($credentials)) {
        echo "Auth Guard 'api' attempt: Success\n";
    } else {
        echo "Auth Guard 'api' attempt: Failed\n";
    }
} catch (Exception $e) {
    echo "Error: ". $e->getMessage(). "\n";
    echo $e->getTraceAsString(). "\n";
}
