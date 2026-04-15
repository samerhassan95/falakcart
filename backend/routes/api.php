<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AffiliateController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\TrackingController;

// Health check endpoint
Route::get('health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'FalakCart API is running',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login'])->name('login');

Route::middleware(['auth:api'])->group(function () {
    Route::get('user', [AuthController::class, 'getAuthenticatedUser']);
    Route::post('logout', [AuthController::class, 'logout']);

    // ── Affiliate Routes ──────────────────────────────────────────────────
    Route::prefix('affiliate')->group(function () {
        Route::get('profile',          [AffiliateController::class, 'getProfile']);
        Route::put('profile',          [AffiliateController::class, 'updateProfile']);
        Route::get('payout-settings',  [AffiliateController::class, 'getPayoutSettings']);
        Route::put('payout-settings',  [AffiliateController::class, 'updatePayoutSettings']);
        Route::get('notification-settings', [AffiliateController::class, 'getNotificationSettings']);
        Route::put('notification-settings', [AffiliateController::class, 'updateNotificationSettings']);
        Route::get('security-settings', [AffiliateController::class, 'getSecuritySettings']);
        Route::put('change-password',   [AffiliateController::class, 'changePassword']);
        Route::post('toggle-2fa',       [AffiliateController::class, 'toggle2FA']);
        Route::get('stats',            [AffiliateController::class, 'getStats']);
        Route::get('referrals',        [AffiliateController::class, 'getReferrals']);
        Route::get('clicks',           [AffiliateController::class, 'getClicks']);
        Route::get('sales',            [AffiliateController::class, 'getSales']);
        Route::get('earnings',         [AffiliateController::class, 'getEarnings']);
        Route::post('payout',          [AffiliateController::class, 'requestPayout']);
        Route::get('transactions',     [AffiliateController::class, 'getTransactions']);
        Route::get('analytics',        [AffiliateController::class, 'getAnalytics']);
        Route::get('recent-activity',  [AffiliateController::class, 'getRecentActivity']);
        Route::get('notifications',    [AffiliateController::class, 'getNotifications']);
        Route::post('notifications/read', [AffiliateController::class, 'markNotificationsRead']);
        Route::get('links',            [AffiliateController::class, 'getLinks']);
        Route::post('links',           [AffiliateController::class, 'createLink']);
        Route::delete('links/{id}',    [AffiliateController::class, 'deleteLink']);
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
        Route::get('analytics/devices', [AdminController::class, 'getDeviceAnalytics']);
        Route::get('analytics/geo', [AdminController::class, 'getGeoAnalytics']);
        Route::get('analytics/traffic-sources', [AdminController::class, 'getTrafficSourceAnalytics']);
        Route::get('analytics/commission-trend', [AdminController::class, 'getCommissionTrend']);
        Route::get('analytics/revenue-trend', [AdminController::class, 'getRevenueTrend']);

        // Commissions
        Route::get('commissions/summary',           [AdminController::class, 'getCommissionsSummary']);
        Route::get('commissions/pending',           [AdminController::class, 'getPendingCommissions']);
        Route::get('commissions',                   [AdminController::class, 'getAllCommissions']);
        Route::put('commissions/{id}/approve',      [AdminController::class, 'approveCommission']);
        Route::put('commissions/{id}/reject',       [AdminController::class, 'rejectCommission']);

        // Payouts
        Route::get('payouts/summary',               [AdminController::class, 'getPayoutsSummary']);
        Route::get('payouts/pending',               [AdminController::class, 'getPendingPayouts']);
        Route::get('payouts/history',               [AdminController::class, 'getPayoutHistory']);
        Route::post('payouts/{affiliateId}/approve', [AdminController::class, 'approvePayout']);

        // Export
        Route::get('export', [AdminController::class, 'exportCSV']);

        // Global settings
        Route::get('settings', [AdminController::class, 'getSettings']);
        Route::put('settings', [AdminController::class, 'updateSettings']);
        
        // Admin notifications (separate from affiliate notifications)
        Route::get('notifications', [AdminController::class, 'getNotifications']);
        Route::post('notifications/read', [AdminController::class, 'markNotificationsRead']);
        
        // Admin link management
        Route::post('links', [AdminController::class, 'createLinkForAffiliate']);
        Route::get('links', [AdminController::class, 'getAllLinks']);
    });
});

// ── Public Tracking Routes ────────────────────────────────────────────────────
Route::get('track/click', [TrackingController::class, 'recordClick']);
Route::post('track/sale', [TrackingController::class, 'recordSale']);

// ── FalakCart Webhook Routes ──────────────────────────────────────────────────
Route::post('webhook/falakcart', [TrackingController::class, 'handleFalakCartWebhook']);
Route::post('webhook/falakcart-test', [TrackingController::class, 'handleFalakCartWebhookTest']);
Route::get('webhook/falakcart', function() {
    return response()->json([
        'message' => 'FalakCart Webhook Endpoint',
        'method' => 'POST',
        'content_type' => 'application/json',
        'headers' => ['X-Webhook-Signature'],
        'status' => 'ready'
    ]);
});

// Catch-all webhook endpoint to log any requests
Route::any('webhook/catch-all', function() {
    try {
        $timestamp = date('Y-m-d H:i:s');
        $method = request()->method();
        $ip = request()->ip();
        $userAgent = request()->userAgent();
        $headers = request()->headers->all();
        $body = request()->getContent();
        
        $logEntry = [
            'timestamp' => $timestamp,
            'method' => $method,
            'ip' => $ip,
            'user_agent' => $userAgent,
            'headers' => $headers,
            'body' => $body,
            'body_length' => strlen($body),
            'url' => request()->fullUrl()
        ];
        
        // Log to a simple file
        $logFile = storage_path('logs/catch_all_webhook.log');
        file_put_contents($logFile, json_encode($logEntry, JSON_PRETTY_PRINT) . "\n" . str_repeat('=', 80) . "\n", FILE_APPEND);
        
        return response()->json([
            'status' => 'logged',
            'timestamp' => $timestamp,
            'method' => $method,
            'body_length' => strlen($body),
            'message' => 'Request logged successfully'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
});
