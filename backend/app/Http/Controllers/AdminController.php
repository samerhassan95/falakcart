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
        ]);
    }

    public function updateSettings(Request $request)
    {
        $settings                            = $this->loadSettings();
        $settings['default_commission_rate'] = (float) $request->input('default_commission_rate', 10.00);
        $this->saveSettings($settings);
        return response()->json($settings);
    }
}
