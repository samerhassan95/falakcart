<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AffiliateController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\TrackingController;

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login'])->name('login');

Route::middleware(['auth:api'])->group(function () {
    Route::get('user', [AuthController::class, 'getAuthenticatedUser']);
    Route::post('logout', [AuthController::class, 'logout']);

    // ── Affiliate Routes ──────────────────────────────────────────────────
    Route::prefix('affiliate')->group(function () {
        Route::get('profile',   [AffiliateController::class, 'getProfile']);
        Route::get('stats',     [AffiliateController::class, 'getStats']);
        Route::get('referrals', [AffiliateController::class, 'getReferrals']);
        Route::get('clicks',    [AffiliateController::class, 'getClicks']);
        Route::get('sales',     [AffiliateController::class, 'getSales']);
    });

    // ── Admin Routes ──────────────────────────────────────────────────────
    Route::middleware(['role:admin'])->prefix('admin')->group(function () {

        // Dashboard summary
        Route::get('summary', [AdminController::class, 'getSummary']);

        // Affiliate management
        Route::get('affiliates',                   [AdminController::class, 'getAffiliates']);
        Route::post('affiliates',                  [AdminController::class, 'createAffiliate']);
        Route::get('affiliates/{id}',              [AdminController::class, 'getAffiliateDetail']);
        Route::put('affiliates/{id}/status',       [AdminController::class, 'updateAffiliateStatus']);
        Route::put('affiliates/{id}/commission',   [AdminController::class, 'updateCommissionRate']);
        Route::delete('affiliates/{id}',           [AdminController::class, 'deleteAffiliate']);

        // User management
        Route::get('users',              [AdminController::class, 'getUsers']);
        Route::post('users',             [AdminController::class, 'createUser']);
        Route::put('users/{id}/role',    [AdminController::class, 'updateUserRole']);
        Route::delete('users/{id}',      [AdminController::class, 'deleteUser']);

        // Analytics
        Route::get('clicks', [AdminController::class, 'getClickAnalytics']);
        Route::get('sales',  [AdminController::class, 'getAllSales']);

        // Export
        Route::get('export', [AdminController::class, 'exportCSV']);

        // Global settings
        Route::get('settings', [AdminController::class, 'getSettings']);
        Route::put('settings', [AdminController::class, 'updateSettings']);
    });
});

// ── Public Tracking Routes ────────────────────────────────────────────────────
Route::get('track/click', [TrackingController::class, 'recordClick']);
Route::post('track/sale', [TrackingController::class, 'recordSale']);
