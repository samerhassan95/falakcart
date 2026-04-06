<?php

namespace App\Http\Controllers;

use App\Models\Affiliate;
use App\Models\Click;
use App\Models\Sale;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    public function recordClick(Request $request)
    {
        $referralCode = $request->query('ref');

        if (!$referralCode) {
            return response()->json(['error' => 'referral_code_missing'], 400);
        }

        $affiliate = Affiliate::where('referral_code', $referralCode)->first();

        if ($affiliate) {
            Click::create([
                'affiliate_id'  => $affiliate->id,
                'ip_address'    => $request->ip(),
                'user_agent'    => $request->userAgent(),
                'referral_code' => $referralCode,
            ]);

            return response()->json(['message' => 'click_recorded', 'referral_code' => $referralCode]);
        }

        return response()->json(['error' => 'invalid_referral_code'], 404);
    }

    public function recordSale(Request $request)
    {
        $referralCode = $request->input('referral_code');
        $amount       = (float) $request->input('amount');
        $referenceId  = $request->input('order_id');

        $affiliate = Affiliate::where('referral_code', $referralCode)->first();

        if (!$affiliate) {
            return response()->json(['error' => 'affiliate_not_found'], 404);
        }

        $rate     = (float) ($affiliate->commission_rate ?? 10.00);
        $type     = $affiliate->commission_type ?? 'percentage';
        $strategy = $affiliate->commission_strategy ?? 'flat';

        // Check if a tier is active and meets the threshold
        if ($strategy !== 'flat' && !empty($affiliate->commission_tiers)) {
            $tiers = collect($affiliate->commission_tiers)->sortByDesc('threshold');
            
            $metric = 0;
            if ($strategy === 'tier_referrals') {
                $metric = Sale::where('affiliate_id', $affiliate->id)->count(); 
            } else if ($strategy === 'tier_volume') {
                $metric = Sale::where('affiliate_id', $affiliate->id)->sum('amount');
            }

            foreach ($tiers as $tier) {
                if ($metric >= $tier['threshold']) {
                    $rate = (float) $tier['rate'];
                    break;
                }
            }
        }

        if ($type === 'fixed') {
            $commissionAmount = $rate;
        } else {
            $commissionAmount = $amount * ($rate / 100);
        }

        $sale = Sale::create([
            'affiliate_id'      => $affiliate->id,
            'amount'            => $amount,
            'commission_amount' => $commissionAmount,
            'status'            => 'completed',
            'reference_id'      => $referenceId,
        ]);

        $affiliate->total_earnings   += $commissionAmount;
        $affiliate->current_balance  += $commissionAmount;
        $affiliate->save();

        return response()->json(['message' => 'sale_recorded', 'sale' => $sale]);
    }
}
