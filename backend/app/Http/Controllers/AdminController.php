<?php

namespace App\Http\Controllers;

use App\Models\Affiliate;
use App\Models\Click;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    // ─── Helpers ────────────────────────────────────────────────────────────────

    private function loadSettings(): array
    {
        $path = storage_path('app/settings.json');
        return file_exists($path) ? json_decode(file_get_contents($path), true) : [];
    }

    private function saveSettings(array $settings): void
    {
        file_put_contents(storage_path('app/settings.json'), json_encode($settings));
    }

    // ─── Dashboard Summary ───────────────────────────────────────────────────────

    public function getSummary()
    {
        return response()->json([
            'total_affiliates'  => Affiliate::count(),
            'active_affiliates' => Affiliate::where('status', 'active')->count(),
            'total_sales'       => Sale::count(),
            'total_revenue'     => (float) Sale::sum('amount'),
            'total_commissions' => (float) Sale::sum('commission_amount'),
            'total_clicks'      => Click::count(),
        ]);
    }

    // ─── Affiliates CRUD ──────────────────────────────────────────────────────────

    public function getAffiliates()
    {
        $affiliates = Affiliate::with('user')
            ->withCount(['clicks', 'sales'])
            ->orderByDesc('created_at')
            ->get();
        return response()->json($affiliates);
    }

    public function getAffiliateDetail($id)
    {
        $affiliate = Affiliate::with('user')->findOrFail($id);

        $clicksChart = Click::where('affiliate_id', $id)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $sales = Sale::where('affiliate_id', $id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'affiliate'    => $affiliate,
            'clicks_chart' => $clicksChart,
            'sales'        => $sales,
        ]);
    }

    public function createAffiliate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'            => 'required|string|max:255',
            'email'           => 'required|string|email|max:255|unique:users',
            'password'        => 'required|string|min:6',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $settings    = $this->loadSettings();
        $defaultRate = $settings['default_commission_rate'] ?? 10.00;

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'affiliate',
        ]);

        $affiliate = Affiliate::create([
            'user_id'         => $user->id,
            'referral_code'   => Affiliate::generateUniqueCode(),
            'status'          => 'active',
            'commission_rate' => $request->commission_rate ?? $defaultRate,
        ]);

        return response()->json($affiliate->load('user'), 201);
    }

    public function updateAffiliateStatus(Request $request, $id)
    {
        $affiliate = Affiliate::findOrFail($id);
        $affiliate->status = $request->input('status');
        $affiliate->save();
        return response()->json($affiliate->load('user'));
    }

    public function updateCommissionRate(Request $request, $id)
    {
        $affiliate = Affiliate::findOrFail($id);
        $affiliate->commission_rate     = (float) $request->input('commission_rate', $affiliate->commission_rate);
        $affiliate->commission_type     = $request->input('commission_type', $affiliate->commission_type);
        $affiliate->commission_strategy = $request->input('commission_strategy', $affiliate->commission_strategy);

        if ($request->has('commission_tiers')) {
            $affiliate->commission_tiers = $request->input('commission_tiers'); // Will be casted to json automatically
        }

        $affiliate->save();
        return response()->json($affiliate->load('user'));
    }

    public function deleteAffiliate($id)
    {
        $affiliate = Affiliate::findOrFail($id);
        $userId    = $affiliate->user_id;
        $affiliate->delete();
        User::where('id', $userId)->where('role', 'affiliate')->delete();
        return response()->json(['message' => 'Affiliate deleted successfully']);
    }

    // ─── User Management ──────────────────────────────────────────────────────────

    public function getUsers()
    {
        $users = User::with('affiliate')->orderByDesc('created_at')->get();
        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:admin,affiliate',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        if ($request->role === 'affiliate') {
            $settings = $this->loadSettings();
            Affiliate::create([
                'user_id'         => $user->id,
                'referral_code'   => Affiliate::generateUniqueCode(),
                'status'          => 'active',
                'commission_rate' => $settings['default_commission_rate'] ?? 10.00,
            ]);
        }

        return response()->json($user->load('affiliate'), 201);
    }

    public function updateUserRole(Request $request, $id)
    {
        $user    = User::findOrFail($id);
        $newRole = $request->input('role');
        $user->role = $newRole;
        $user->save();

        if ($newRole === 'affiliate' && !$user->affiliate) {
            $settings = $this->loadSettings();
            Affiliate::create([
                'user_id'         => $user->id,
                'referral_code'   => Affiliate::generateUniqueCode(),
                'status'          => 'active',
                'commission_rate' => $settings['default_commission_rate'] ?? 10.00,
            ]);
        }

        return response()->json($user->fresh()->load('affiliate'));
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    // ─── Analytics ────────────────────────────────────────────────────────────────

    public function getClickAnalytics(Request $request)
    {
        $days = (int) $request->query('days', 30);

        $clicks = Click::where('created_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($clicks);
    }

    public function getAllSales(Request $request)
    {
        $sales = Sale::with('affiliate.user')
            ->orderByDesc('created_at')
            ->get();
        return response()->json($sales);
    }
    public function getDeviceAnalytics(Request $request)
    {
        $days = (int) $request->query('days', 30);

        $clicks = Click::where('created_at', '>=', now()->subDays($days))
            ->pluck('user_agent')
            ->filter()
            ->map(function ($ua) {
                $uaLower = strtolower($ua);
                if (str_contains($uaLower, 'tablet') || str_contains($uaLower, 'ipad')) {
                    return 'Tablet';
                }
                if (str_contains($uaLower, 'mobile') || str_contains($uaLower, 'iphone') || str_contains($uaLower, 'android')) {
                    return 'Mobile';
                }
                return 'Desktop';
            })
            ->countBy()
            ->map(function ($count, $platform) {
                return ['name' => $platform, 'count' => $count];
            })
            ->values();

        return response()->json($clicks);
    }

    public function getGeoAnalytics(Request $request)
    {
        $days = (int) $request->query('days', 30);

        $ips = Click::where('created_at', '>=', now()->subDays($days))
            ->pluck('ip_address')
            ->filter();

        $regions = [
            'North America' => 0,
            'Europe' => 0,
            'Asia Pacific' => 0,
            'Other' => 0,
        ];

        foreach ($ips as $ip) {
            $parts = explode('.', $ip);
            $first = isset($parts[0]) ? (int) $parts[0] : 0;
            if ($first >= 1 && $first <= 49) {
                $regions['North America']++;
            } elseif ($first >= 50 && $first <= 99) {
                $regions['Europe']++;
            } elseif ($first >= 100 && $first <= 149) {
                $regions['Asia Pacific']++;
            } else {
                $regions['Other']++;
            }
        }

        return response()->json(array_map(function ($region, $count) {
            return ['region' => $region, 'count' => $count];
        }, array_keys($regions), $regions));
    }

    public function getTrafficSourceAnalytics(Request $request)
    {
        $days = (int) $request->query('days', 30);

        $clicks = Click::where('created_at', '>=', now()->subDays($days))
            ->selectRaw('COALESCE(NULLIF(referral_code, \'\'), \'Direct\') as source, COUNT(*) as count')
            ->groupBy('source')
            ->orderByDesc('count')
            ->get();

        return response()->json($clicks);
    }

    public function getCommissionTrend(Request $request)
    {
        $period = $request->query('period', 'weekly');

        if ($period === 'daily') {
            $trend = Sale::selectRaw('DATE(created_at) as period, SUM(commission_amount) as value')
                ->groupBy('period')
                ->orderBy('period')
                ->where('created_at', '>=', now()->subDays(6))
                ->get();
        } elseif ($period === 'monthly') {
            $trend = Sale::selectRaw('DATE_FORMAT(created_at, "%b %Y") as period, SUM(commission_amount) as value')
                ->groupBy('period')
                ->orderBy('period')
                ->where('created_at', '>=', now()->subMonths(5))
                ->get();
        } else {
            $trend = Sale::selectRaw('CONCAT("Wk ", WEEK(created_at, 1), " ", YEAR(created_at)) as period, SUM(commission_amount) as value')
                ->groupBy('period')
                ->orderBy('period')
                ->where('created_at', '>=', now()->subWeeks(4))
                ->get();
        }

        return response()->json($trend);
    }
    // ─── CSV Export ───────────────────────────────────────────────────────────────

    public function exportCSV()
    {
        $affiliates = Affiliate::with('user')->get();

        $csv  = "ID,Name,Email,Referral Code,Status,Commission Rate,Total Earnings,Current Balance,Total Sales,Total Clicks\n";

        foreach ($affiliates as $aff) {
            $salesCount  = Sale::where('affiliate_id', $aff->id)->count();
            $clicksCount = Click::where('affiliate_id', $aff->id)->count();

            $csv .= implode(',', [
                $aff->id,
                "\"{$aff->user->name}\"",
                $aff->user->email,
                $aff->referral_code,
                $aff->status,
                $aff->commission_rate . '%',
                number_format($aff->total_earnings, 2),
                number_format($aff->current_balance, 2),
                $salesCount,
                $clicksCount,
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="affiliates-export.csv"',
        ]);
    }

    // ─── Settings ────────────────────────────────────────────────────────────────

    public function getSettings()
    {
        $settings = $this->loadSettings();
        return response()->json([
            'default_commission_rate' => $settings['default_commission_rate'] ?? 10.00,
            'platform_name' => $settings['platform_name'] ?? 'Lucid Stratum',
            'currency' => $settings['currency'] ?? 'USD ($)',
            'timezone' => $settings['timezone'] ?? 'UTC +00:00',
            'cookie_duration' => $settings['cookie_duration'] ?? 30,
            'auto_approve' => $settings['auto_approve'] ?? false,
        ]);
    }

    public function updateSettings(Request $request)
    {
        $settings = $this->loadSettings();

        // Update all provided settings
        if ($request->has('default_commission_rate')) {
            $settings['default_commission_rate'] = (float) $request->input('default_commission_rate', 10.00);
        }
        if ($request->has('platform_name')) {
            $settings['platform_name'] = $request->input('platform_name');
        }
        if ($request->has('currency')) {
            $settings['currency'] = $request->input('currency');
        }
        if ($request->has('timezone')) {
            $settings['timezone'] = $request->input('timezone');
        }
        if ($request->has('cookie_duration')) {
            $settings['cookie_duration'] = (int) $request->input('cookie_duration', 30);
        }
        if ($request->has('auto_approve')) {
            $settings['auto_approve'] = (bool) $request->input('auto_approve', false);
        }

        $this->saveSettings($settings);
        return response()->json($settings);
    }

    // ─── Commissions Management ───────────────────────────────────────────────

    public function getCommissionsSummary()
    {
        $totalCommissions = (float) Sale::sum('commission_amount');
        $pendingCommissions = (float) Sale::where('status', 'pending')->sum('commission_amount');
        $approvedCommissions = (float) Sale::where('status', 'approved')->sum('commission_amount');
        $paidCommissions = (float) Sale::where('status', 'paid')->sum('commission_amount');

        return response()->json([
            'total_commissions' => $totalCommissions,
            'pending' => $pendingCommissions,
            'approved' => $approvedCommissions,
            'paid' => $paidCommissions,
        ]);
    }

    public function getPendingCommissions()
    {
        $pending = Sale::with('affiliate.user')
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($pending);
    }

    public function getAllCommissions(Request $request)
    {
        $status = $request->query('status');

        $query = Sale::with('affiliate.user')->orderByDesc('created_at');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $commissions = $query->get();

        return response()->json($commissions);
    }

    public function approveCommission($id)
    {
        $sale = Sale::findOrFail($id);
        $sale->status = 'approved';
        $sale->save();

        return response()->json($sale->load('affiliate.user'));
    }

    public function rejectCommission($id)
    {
        $sale = Sale::findOrFail($id);
        $sale->status = 'rejected';
        $sale->save();

        return response()->json($sale->load('affiliate.user'));
    }

    // ─── Payouts Management ───────────────────────────────────────────────────

    public function getPayoutsSummary(Request $request)
    {
        $days = (int) $request->query('days', 30);
        $availableBalance = (float) Affiliate::sum('current_balance');
        $pendingPayouts = (float) Affiliate::where('status', 'active')->sum('pending_balance');

        $cutoffDate = now()->subDays($days);
        $paidSales = Sale::where('status', 'paid')->where('updated_at', '>=', $cutoffDate);
        $failedSales = Sale::where('status', 'failed')->where('updated_at', '>=', $cutoffDate);

        $totalPaid = (float) $paidSales->sum('commission_amount');
        $failedCount = $failedSales->count();
        $paidCount = $paidSales->count();
        $totalTransactions = max(1, $paidCount + $failedCount);
        $successRate = round(100 * $paidCount / $totalTransactions, 1);

        $methodCounts = Sale::with('affiliate')
            ->whereIn('status', ['paid', 'failed'])
            ->where('updated_at', '>=', $cutoffDate)
            ->get()
            ->groupBy(function ($sale) {
                $bankName = strtolower($sale->affiliate->bank_name ?? '');
                if (str_contains($bankName, 'paypal')) {
                    return 'paypal';
                }
                if (str_contains($bankName, 'crypto') || str_contains($bankName, 'usdt')) {
                    return 'crypto';
                }
                return 'bank_transfer';
            });

        $totalMethodCount = max(1, $methodCounts->sum->count());
        $bankTransferPct = round(100 * ($methodCounts->get('bank_transfer')?->count() ?? 0) / $totalMethodCount);
        $paypalPct = round(100 * ($methodCounts->get('paypal')?->count() ?? 0) / $totalMethodCount);
        $cryptoPct = round(100 * ($methodCounts->get('crypto')?->count() ?? 0) / $totalMethodCount);

        return response()->json([
            'available_balance' => $availableBalance,
            'total_paid' => $totalPaid,
            'pending_payouts' => $pendingPayouts,
            'failed_payouts' => $failedCount,
            'payment_health' => [
                'success_rate' => $successRate,
                'methods' => [
                    'bank_transfer' => $bankTransferPct,
                    'paypal' => $paypalPct,
                    'crypto' => $cryptoPct,
                ],
            ],
        ]);
    }

    public function getPendingPayouts()
    {
        $affiliates = Affiliate::with('user')
            ->where('pending_balance', '>', 0)
            ->orderByDesc('pending_balance')
            ->get();

        return response()->json($affiliates);
    }

    public function approvePayout(Request $request, $affiliateId)
    {
        $affiliate = Affiliate::findOrFail($affiliateId);
        $amount = $request->input('amount', $affiliate->pending_balance);

        // Move from pending to current balance
        $affiliate->pending_balance -= $amount;
        $affiliate->current_balance += $amount;
        $affiliate->save();

        // Update related sales to paid
        Sale::where('affiliate_id', $affiliateId)
            ->where('status', 'approved')
            ->update(['status' => 'paid']);

        return response()->json($affiliate->load('user'));
    }

    public function getPayoutHistory(Request $request)
    {
        $days = (int) $request->query('days', 30);
        $cutoffDate = now()->subDays($days);

        $sales = Sale::with('affiliate.user')
            ->whereIn('status', ['paid', 'failed'])
            ->where('updated_at', '>=', $cutoffDate)
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($sales);
    }
}
