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

        // First, try to find by main referral code
        $affiliate = Affiliate::where('referral_code', $referralCode)->first();
        
        // If not found, try to find by custom link slug
        if (!$affiliate) {
            $affiliateLink = \App\Models\AffiliateLink::where('slug', $referralCode)->first();
            if ($affiliateLink) {
                $affiliate = $affiliateLink->affiliate;
            }
        }

        if ($affiliate) {
            Click::create([
                'affiliate_id'  => $affiliate->id,
                'ip_address'    => $request->ip(),
                'user_agent'    => $request->userAgent(),
                'referral_code' => $referralCode, // This will be either main code or custom slug
            ]);

            return response()->json(['message' => 'click_recorded', 'referral_code' => $referralCode]);
        }

        return response()->json(['error' => 'invalid_referral_code'], 404);
    }

    public function recordSale(Request $request)
    {
        // Validate webhook signature for security
        $signature = $request->header('X-Webhook-Signature');
        if (!$this->validateWebhookSignature($request->getContent(), $signature)) {
            return response()->json(['error' => 'invalid_signature'], 401);
        }

        $referralCode = $request->input('referral_code');
        $amount       = (float) $request->input('amount');
        $referenceId  = $request->input('order_id');

        $affiliate = Affiliate::where('referral_code', $referralCode)->first();

        // If not found by main code, try custom link slug
        if (!$affiliate) {
            $affiliateLink = \App\Models\AffiliateLink::where('slug', $referralCode)->first();
            if ($affiliateLink) {
                $affiliate = $affiliateLink->affiliate;
            }
        }

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
            'customer_email'    => $request->input('customer_email'),
            'customer_name'     => $request->input('customer_name'),
            'plan_name'         => $request->input('plan_name', 'FalakCart Subscription'),
            'subscription_id'   => $request->input('subscription_id'),
        ]);

        $affiliate->total_earnings   += $commissionAmount;
        $affiliate->current_balance  += $commissionAmount;
        $affiliate->save();

        return response()->json(['message' => 'sale_recorded', 'sale' => $sale]);
    }

    private function validateWebhookSignature($payload, $signature)
    {
        // Skip validation in test environment or if no signature provided
        if (app()->environment('local') || empty($signature)) {
            return true;
        }
        
        $secret = config('app.webhook_secret', 'your-webhook-secret');
        $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);
        return hash_equals($expectedSignature, $signature);
    }
}
