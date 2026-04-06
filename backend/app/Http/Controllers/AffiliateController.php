<?php

namespace App\Http\Controllers;

use App\Models\Affiliate;
use App\Models\Click;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AffiliateController extends Controller
{
    public function getProfile()
    {
        $user      = Auth::user();
        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            $affiliate = Affiliate::create([
                'user_id'       => $user->id,
                'referral_code' => Affiliate::generateUniqueCode(),
                'status'        => 'active',
            ]);
        }

        return response()->json($affiliate->load('user'));
    }

    public function getStats()
    {
        $user      = Auth::user();
        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            return response()->json(['clicks' => 0, 'sales' => 0, 'earnings' => 0, 'balance' => 0]);
        }

        $clicksCount   = Click::where('affiliate_id', $affiliate->id)->count();
        $salesCount    = Sale::where('affiliate_id', $affiliate->id)->count();
        $totalEarnings = Sale::where('affiliate_id', $affiliate->id)->sum('commission_amount');

        return response()->json([
            'clicks'   => $clicksCount,
            'sales'    => $salesCount,
            'earnings' => (float) $totalEarnings,
            'balance'  => (float) $affiliate->current_balance,
        ]);
    }

    public function getReferrals()
    {
        $user      = Auth::user();
        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            return response()->json([]);
        }

        $sales = Sale::where('affiliate_id', $affiliate->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($sales);
    }

    public function getClicks(Request $request)
    {
        $user      = Auth::user();
        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            return response()->json([]);
        }

        $days = (int) $request->query('days', 30);

        $clicks = Click::where('affiliate_id', $affiliate->id)
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($clicks);
    }

    public function getSales()
    {
        $user      = Auth::user();
        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            return response()->json([]);
        }

        $sales = Sale::where('affiliate_id', $affiliate->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($sales);
    }
}
