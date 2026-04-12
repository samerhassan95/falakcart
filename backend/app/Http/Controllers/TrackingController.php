<?php

namespace App\Http\Controllers;

use App\Models\Affiliate;
use App\Models\Click;
use App\Models\Sale;
use App\Models\Transaction;
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

        // Create transaction record for earnings calculation
        Transaction::create([
            'affiliate_id' => $affiliate->id,
            'type' => 'commission',
            'amount' => $commissionAmount,
            'description' => 'Commission from ' . ($request->input('plan_name') ?: 'FalakCart Subscription'),
            'reference_id' => $referenceId,
            'status' => 'completed'
        ]);

        $affiliate->total_earnings     += $commissionAmount;
        $affiliate->available_balance  += $commissionAmount;
        $affiliate->save();

        return response()->json(['message' => 'sale_recorded', 'sale' => $sale]);
    }

    public function handleFalakCartWebhook(Request $request)
    {
        try {
            \Log::info('Webhook received', ['payload' => $request->all()]);
            
            // Validate webhook signature for security
            $signature = $request->header('X-Webhook-Signature');
            if (!$this->validateWebhookSignature($request->getContent(), $signature)) {
                \Log::warning('Invalid webhook signature', ['signature' => $signature]);
                return response()->json(['error' => 'invalid_signature'], 401);
            }

            $payload = $request->all();
            $event = $payload['event'] ?? null;
            $data = $payload['data'] ?? [];

            \Log::info('Processing webhook', ['event' => $event, 'data' => $data]);

            switch ($event) {
                case 'affiliate.user.registered':
                    return $this->handleUserRegistration($data);
                
                case 'affiliate.subscription':
                    return $this->handleSubscription($data);
                
                default:
                    \Log::warning('Unknown webhook event', ['event' => $event]);
                    return response()->json(['error' => 'unknown_event'], 400);
            }

        } catch (\Exception $e) {
            \Log::error('Webhook processing error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return response()->json(['error' => 'processing_failed', 'message' => $e->getMessage()], 500);
        }
    }

    private function handleUserRegistration($data)
    {
        $referralCode = $data['referral']['referral_code'] ?? null;
        
        if (!$referralCode) {
            return response()->json(['message' => 'no_referral_code']);
        }

        // Find affiliate by referral code
        $affiliate = Affiliate::where('referral_code', $referralCode)->first();
        
        // If not found, try custom link slug
        if (!$affiliate) {
            $affiliateLink = \App\Models\AffiliateLink::where('slug', $referralCode)->first();
            if ($affiliateLink) {
                $affiliate = $affiliateLink->affiliate;
            }
        }

        if (!$affiliate) {
            \Log::warning('Affiliate not found for referral code', ['referral_code' => $referralCode]);
            return response()->json(['error' => 'affiliate_not_found'], 404);
        }

        // Record the click/registration
        Click::create([
            'affiliate_id'  => $affiliate->id,
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
            'referral_code' => $referralCode,
            'customer_email' => $data['user']['email'] ?? null,
            'customer_name'  => $data['user']['name'] ?? null,
            'utm_source'     => $data['referral']['source'] ?? null,
            'utm_medium'     => $data['referral']['utm_medium'] ?? null,
            'utm_campaign'   => $data['referral']['utm_campaign'] ?? null,
        ]);

        // Create notification for affiliate
        \App\Models\Notification::create([
            'user_id' => $affiliate->user_id,
            'type' => 'user_registered',
            'title' => 'New User Registration',
            'message' => "User {$data['user']['name']} registered using your referral code {$referralCode}",
            'data' => json_encode($data)
        ]);

        return response()->json(['message' => 'user_registration_recorded']);
    }

    private function handleSubscription($data)
    {
        $referralCode = $data['referral']['referral_code'] ?? null;
        $action = $data['action'] ?? 'subscribed';
        
        if (!$referralCode) {
            return response()->json(['message' => 'no_referral_code']);
        }

        // Find affiliate by referral code
        $affiliate = Affiliate::where('referral_code', $referralCode)->first();
        
        // If not found, try custom link slug
        if (!$affiliate) {
            $affiliateLink = \App\Models\AffiliateLink::where('slug', $referralCode)->first();
            if ($affiliateLink) {
                $affiliate = $affiliateLink->affiliate;
            }
        }

        if (!$affiliate) {
            \Log::warning('Affiliate not found for referral code', ['referral_code' => $referralCode]);
            return response()->json(['error' => 'affiliate_not_found'], 404);
        }

        $subscription = $data['subscription'] ?? [];
        $amount = (float) ($subscription['price'] ?? 0);
        $currency = $subscription['currency'] ?? 'SAR';
        $planName = $subscription['plan_name'] ?? 'Unknown Plan';
        $subscriptionId = $subscription['id'] ?? null;
        $userId = $data['user']['id'] ?? null;

        // Calculate commission
        $rate = (float) ($affiliate->commission_rate ?? 10.00);
        $type = $affiliate->commission_type ?? 'percentage';
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

        // Create or update sale record
        $saleData = [
            'affiliate_id'      => $affiliate->id,
            'amount'            => $amount,
            'commission_amount' => $commissionAmount,
            'status'            => 'completed',
            'reference_id'      => $subscriptionId,
            'customer_email'    => $data['user']['email'] ?? null,
            'customer_name'     => $data['user']['name'] ?? null,
            'customer_phone'    => $data['user']['phone'] ?? null,
            'plan_name'         => $planName,
            'subscription_id'   => $subscriptionId,
            'currency'          => $currency,
            'billing_cycle'     => $subscription['billing_cycle'] ?? null,
            'falakcart_user_id' => $userId,
            'webhook_data'      => json_encode($data),
        ];

        // For plan changes, update existing sale if found
        if ($action === 'plan_change') {
            $existingSale = Sale::where('subscription_id', $subscriptionId)
                               ->where('affiliate_id', $affiliate->id)
                               ->first();
            
            if ($existingSale) {
                // Calculate difference in commission
                $oldCommission = $existingSale->commission_amount;
                $commissionDifference = $commissionAmount - $oldCommission;
                
                $existingSale->update($saleData);
                
                // Update affiliate balance with the difference
                if ($commissionDifference != 0) {
                    $affiliate->total_earnings += $commissionDifference;
                    $affiliate->available_balance += $commissionDifference;
                    $affiliate->save();

                    // Create transaction for the difference
                    Transaction::create([
                        'affiliate_id' => $affiliate->id,
                        'type' => $commissionDifference > 0 ? 'commission' : 'adjustment',
                        'amount' => $commissionDifference,
                        'description' => "Plan change adjustment for {$planName}",
                        'reference_id' => $subscriptionId,
                        'status' => 'completed'
                    ]);
                }

                $sale = $existingSale;
            } else {
                // Create new sale if not found
                $sale = Sale::create($saleData);
                
                // Update affiliate earnings
                $affiliate->total_earnings += $commissionAmount;
                $affiliate->available_balance += $commissionAmount;
                $affiliate->save();

                // Create transaction record
                Transaction::create([
                    'affiliate_id' => $affiliate->id,
                    'type' => 'commission',
                    'amount' => $commissionAmount,
                    'description' => "Commission from {$planName}",
                    'reference_id' => $subscriptionId,
                    'status' => 'completed'
                ]);
            }
        } else {
            // New subscription
            $sale = Sale::create($saleData);
            
            // Update affiliate earnings
            $affiliate->total_earnings += $commissionAmount;
            $affiliate->available_balance += $commissionAmount;
            $affiliate->save();

            // Create transaction record
            Transaction::create([
                'affiliate_id' => $affiliate->id,
                'type' => 'commission',
                'amount' => $commissionAmount,
                'description' => "Commission from {$planName}",
                'reference_id' => $subscriptionId,
                'status' => 'completed'
            ]);
        }

        // Create notification for affiliate
        $notificationTitle = $action === 'plan_change' ? 'Plan Changed' : 'New Subscription';
        $notificationMessage = $action === 'plan_change' 
            ? "User {$data['user']['name']} changed to {$planName} plan. Commission: {$currency} {$commissionAmount}"
            : "User {$data['user']['name']} subscribed to {$planName}. Commission: {$currency} {$commissionAmount}";

        \App\Models\Notification::create([
            'user_id' => $affiliate->user_id,
            'type' => $action === 'plan_change' ? 'plan_changed' : 'subscription_created',
            'title' => $notificationTitle,
            'message' => $notificationMessage,
            'data' => json_encode($data)
        ]);

        return response()->json([
            'message' => 'subscription_recorded',
            'action' => $action,
            'sale' => $sale,
            'commission' => $commissionAmount
        ]);
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
