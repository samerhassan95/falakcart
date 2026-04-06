<?php

namespace App\Http\Controllers;

use App\Models\Affiliate;
use App\Models\AffiliateLink;
use App\Models\Click;
use App\Models\Sale;
use App\Models\Transaction;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AffiliateController extends Controller
{
    private function getAffiliate()
    {
        $user = Auth::user();
        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            $affiliate = Affiliate::create([
                'user_id'       => $user->id,
                'referral_code' => Affiliate::generateUniqueCode(),
                'status'        => 'active',
            ]);
        }

        return $affiliate;
    }

    public function getProfile()
    {
        $affiliate = $this->getAffiliate()->load('user');

        // إضافة الرابط الرئيسي للإحالة
        $affiliate->main_referral_url = config('app.falakcart_main_url', 'https://falakcart.com') . '/register?ref=' . $affiliate->referral_code;

        return response()->json($affiliate);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'bio' => 'nullable|string|max:500',
            'avatar' => 'nullable|string',
        ]);

        $user = Auth::user();
        $user->name = $request->name;
        $user->save();

        $affiliate = $this->getAffiliate();
        $affiliate->bio = $request->bio;
        $affiliate->avatar = $request->avatar;
        $affiliate->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    public function getPayoutSettings()
    {
        $affiliate = $this->getAffiliate();

        return response()->json([
            'bank_name' => $affiliate->bank_name,
            'account_number' => $affiliate->account_number,
            'account_holder_name' => $affiliate->account_holder_name,
            'iban' => $affiliate->iban,
            'minimum_payout' => $affiliate->minimum_payout ?? 50,
        ]);
    }

    public function updatePayoutSettings(Request $request)
    {
        $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'account_holder_name' => 'required|string|max:255',
            'iban' => 'nullable|string|max:50',
            'minimum_payout' => 'required|numeric|min:50|max:1000',
        ]);

        $affiliate = $this->getAffiliate();
        $affiliate->update([
            'bank_name' => $request->bank_name,
            'account_number' => $request->account_number,
            'account_holder_name' => $request->account_holder_name,
            'iban' => $request->iban,
            'minimum_payout' => $request->minimum_payout,
        ]);

        return response()->json([
            'message' => 'Payout settings updated successfully'
        ]);
    }

    public function getNotificationSettings()
    {
        $affiliate = $this->getAffiliate();

        return response()->json([
            'email_notifications' => $affiliate->email_notifications ?? true,
            'sms_notifications' => $affiliate->sms_notifications ?? false,
            'marketing_emails' => $affiliate->marketing_emails ?? true,
            'weekly_reports' => $affiliate->weekly_reports ?? true,
        ]);
    }

    public function updateNotificationSettings(Request $request)
    {
        $request->validate([
            'email_notifications' => 'required|boolean',
            'sms_notifications' => 'required|boolean',
            'marketing_emails' => 'required|boolean',
            'weekly_reports' => 'required|boolean',
        ]);

        $affiliate = $this->getAffiliate();
        $affiliate->update([
            'email_notifications' => $request->email_notifications,
            'sms_notifications' => $request->sms_notifications,
            'marketing_emails' => $request->marketing_emails,
            'weekly_reports' => $request->weekly_reports,
        ]);

        return response()->json([
            'message' => 'Notification settings updated successfully'
        ]);
    }

    public function getSecuritySettings()
    {
        $affiliate = $this->getAffiliate();

        return response()->json([
            'two_factor_enabled' => $affiliate->two_factor_enabled ?? false,
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    public function toggle2FA(Request $request)
    {
        $affiliate = $this->getAffiliate();
        $newStatus = !($affiliate->two_factor_enabled ?? false);

        $affiliate->update([
            'two_factor_enabled' => $newStatus
        ]);

        return response()->json([
            'enabled' => $newStatus,
            'message' => $newStatus ? '2FA enabled successfully' : '2FA disabled successfully'
        ]);
    }

    public function getStats()
    {
        $affiliate = $this->getAffiliate();

        $clicksCount    = Click::where('affiliate_id', $affiliate->id)->count();
        $salesCount     = Sale::where('affiliate_id', $affiliate->id)->where('status', 'completed')->count();
        $totalEarnings  = Transaction::where('affiliate_id', $affiliate->id)->where('type', 'commission')->sum('amount');
        $referralsCount = Sale::where('affiliate_id', $affiliate->id)->count();
        $subsCount      = Sale::where('affiliate_id', $affiliate->id)->where('status', 'completed')->count();
        $conversionRate = $clicksCount > 0 ? round(($referralsCount / $clicksCount) * 100, 1) : 0;

        return response()->json([
            'clicks'          => $clicksCount,
            'sales'           => $salesCount,
            'referrals'       => $referralsCount,
            'subscriptions'   => $subsCount,
            'earnings'        => (float) $totalEarnings,
            'available_bal'   => (float) $affiliate->available_balance,
            'pending_bal'     => (float) $affiliate->pending_balance,
            'paid_bal'        => (float) $affiliate->paid_balance,
            'conversion_rate' => $conversionRate,
        ]);
    }

    public function getReferrals(Request $request)
    {
        $affiliate = $this->getAffiliate();
        $days = (int) $request->query('days', 30);

        $query = Sale::where('affiliate_id', $affiliate->id);

        if ($days > 0) {
            $query->where('created_at', '>=', now()->subDays($days));
        }

        $sales = $query->orderByDesc('created_at')
            ->get()
            ->map(function ($sale) use ($affiliate) {
                return [
                    'id'           => $sale->id,
                    'user'         => $sale->customer_name ?: 'User #' . $sale->id,
                    'email'        => $sale->customer_email ?: 'customer' . $sale->id . '@example.com',
                    'referral_link'=> config('app.falakcart_main_url', 'https://falakcart.com') . '/register?ref=' . $affiliate->referral_code,
                    'status'       => $sale->status === 'completed' ? 'subscribed' : 'signed_up',
                    'plan_amount'  => '$' . number_format($sale->amount, 2) . '/mo',
                    'plan_name'    => $sale->plan_name ?: 'FalakCart Subscription',
                    'commission'   => (float) $sale->commission_amount,
                    'date_joined'  => $sale->created_at->format('M d, Y'),
                    'subscription_id' => $sale->subscription_id,
                ];
            });

        return response()->json($sales);
    }

    public function getClicks(Request $request)
    {
        $affiliate = $this->getAffiliate();
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
        $affiliate = $this->getAffiliate();

        $sales = Sale::where('affiliate_id', $affiliate->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($sales);
    }

    // --- LINKS ---

    public function getLinks()
    {
        $affiliate = $this->getAffiliate();

        $links = AffiliateLink::where('affiliate_id', $affiliate->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($link) {
                $clicks = Click::where('referral_code', $link->slug)->count();
                $conversions = Sale::whereHas('affiliate', fn($q) => $q->where('id', $link->affiliate_id))
                    ->where('reference_id', 'LIKE', '%' . $link->slug . '%')
                    ->count();
                $earnings = Transaction::where('affiliate_id', $link->affiliate_id)
                    ->where('source', $link->name)
                    ->sum('amount');

                return [
                    'id'           => $link->id,
                    'name'         => $link->name,
                    'slug'         => $link->slug,
                    'referral_url' => config('app.falakcart_main_url', 'https://falakcart.com') . '/register?ref=' . $link->slug,
                    'clicks'       => $clicks,
                    'conversions'  => $conversions,
                    'earnings'     => (float) $earnings,
                    'is_active'    => $link->is_active,
                    'created_at'   => $link->created_at->format('M d, Y'),
                ];
            });

        return response()->json($links);
    }

    public function createLink(Request $request)
    {
        $affiliate = $this->getAffiliate();

        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $baseSlug = Str::slug($affiliate->referral_code . '-' . $request->name);
        $slug = $baseSlug;
        while (AffiliateLink::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . Str::lower(Str::random(4));
        }

        $link = AffiliateLink::create([
            'affiliate_id' => $affiliate->id,
            'name'         => $request->name,
            'slug'         => $slug,
            'source'       => $request->source ?? null,
            'is_active'    => true,
        ]);

        return response()->json([
            'id' => $link->id,
            'name' => $link->name,
            'slug' => $link->slug,
            'referral_url' => config('app.falakcart_main_url', 'https://falakcart.com') . '/register?ref=' . $link->slug,
            'is_active' => $link->is_active,
            'created_at' => $link->created_at->format('M d, Y'),
        ], 201);
    }

    public function deleteLink($id)
    {
        $affiliate = $this->getAffiliate();
        $link = AffiliateLink::where('id', $id)->where('affiliate_id', $affiliate->id)->firstOrFail();
        $link->delete();

        return response()->json(['message' => 'Link deleted']);
    }

    // --- TRANSACTIONS ---

    public function getTransactions(Request $request)
    {
        $affiliate = $this->getAffiliate();
        $perPage = (int) $request->query('per_page', 10);

        $transactions = Transaction::where('affiliate_id', $affiliate->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($transactions);
    }

    // --- EARNINGS ---

    public function getEarnings()
    {
        $affiliate = $this->getAffiliate();

        $totalEarnings = Transaction::where('affiliate_id', $affiliate->id)
            ->where('type', 'commission')
            ->sum('amount');

        $paidEarnings = Transaction::where('affiliate_id', $affiliate->id)
            ->where('type', 'payout')
            ->sum('amount');

        return response()->json([
            'total_earnings'    => (float) $totalEarnings,
            'available_balance' => (float) $affiliate->available_balance,
            'pending_earnings'  => (float) $affiliate->pending_balance,
            'paid_earnings'     => (float) $paidEarnings,
        ]);
    }

    public function requestPayout(Request $request)
    {
        $affiliate = $this->getAffiliate();

        // Check minimum payout amount
        $minimumPayout = $affiliate->minimum_payout ?? 50.00;
        if ($affiliate->available_balance < $minimumPayout) {
            return response()->json([
                'error' => "Minimum payout amount is $" . number_format($minimumPayout, 2)
            ], 400);
        }

        // Check if bank details are provided
        if (!$affiliate->bank_name || !$affiliate->account_number) {
            return response()->json([
                'error' => 'Please update your bank details in settings before requesting payout'
            ], 400);
        }

        $amount = $affiliate->available_balance;

        // Create payout transaction
        $transaction = Transaction::create([
            'affiliate_id' => $affiliate->id,
            'type'         => 'payout',
            'amount'       => -$amount, // Negative for payout
            'status'       => 'pending',
            'source'       => 'Bank Transfer to ' . $affiliate->bank_name,
            'description'  => 'Payout to ' . ($affiliate->account_holder_name ?: 'Account ending in ' . substr($affiliate->account_number, -4)),
        ]);

        // Update affiliate balances
        $affiliate->update([
            'available_balance' => 0,
            'pending_balance'   => $affiliate->pending_balance + $amount,
        ]);

        // Send notification (you can implement email notification here)
        \App\Models\Notification::create([
            'affiliate_id' => $affiliate->id,
            'type' => 'payout_requested',
            'title' => 'Payout Requested',
            'message' => "Payout of $" . number_format($amount, 2) . " has been requested and is being processed.",
            'is_read' => false
        ]);

        return response()->json([
            'message' => 'Payout requested successfully',
            'amount' => $amount,
            'transaction_id' => $transaction->id,
            'estimated_processing_time' => '3-5 business days'
        ]);
    }

    // --- ANALYTICS ---

    public function getAnalytics(Request $request)
    {
        $affiliate = $this->getAffiliate();
        $days = (int) $request->query('days', 30);

        $earningsOverTime = Transaction::where('affiliate_id', $affiliate->id)
            ->where('type', 'commission')
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(created_at) as date, SUM(amount) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $clicksPerDay = Click::where('affiliate_id', $affiliate->id)
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $referralsPerDay = Sale::where('affiliate_id', $affiliate->id)
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $totalClicks  = Click::where('affiliate_id', $affiliate->id)->count();
        $totalRefs    = Sale::where('affiliate_id', $affiliate->id)->count();
        $totalSubs    = Sale::where('affiliate_id', $affiliate->id)->where('status', 'completed')->count();
        $conversionRate = $totalClicks > 0 ? round(($totalRefs / $totalClicks) * 100, 1) : 0;
        $totalEarnings = Transaction::where('affiliate_id', $affiliate->id)->where('type', 'commission')->sum('amount');

        // Top performing links
        $topLinks = AffiliateLink::where('affiliate_id', $affiliate->id)
            ->get()
            ->map(function ($link) {
                return [
                    'name'      => $link->name,
                    'url'       => 'falakcart.com/register?ref=' . $link->slug,
                    'clicks'    => Click::where('referral_code', $link->slug)->count(),
                    'referrals' => 0,
                    'earnings'  => (float) Transaction::where('affiliate_id', $link->affiliate_id)->where('source', $link->name)->sum('amount'),
                ];
            })
            ->sortByDesc('clicks')
            ->take(5)
            ->values();

        return response()->json([
            'summary' => [
                'total_clicks'    => $totalClicks,
                'total_referrals' => $totalRefs,
                'conversion_rate' => $conversionRate,
                'total_earnings'  => (float) $totalEarnings,
            ],
            'earnings_over_time' => $earningsOverTime,
            'clicks_per_day'     => $clicksPerDay,
            'referrals_per_day'  => $referralsPerDay,
            'top_links'          => $topLinks,
        ]);
    }

    public function getRecentActivity()
    {
        $affiliate = $this->getAffiliate();

        $transactions = Transaction::where('affiliate_id', $affiliate->id)
            ->orderByDesc('created_at')
            ->take(5)
            ->get()
            ->map(function ($t) {
                return [
                    'type'       => $t->type,
                    'title'      => $t->type === 'commission' ? 'Commission added +$' . number_format($t->amount, 2) : 'Payout -$' . number_format($t->amount, 2),
                    'subtitle'   => $t->source ?? 'Automatic Transfer',
                    'created_at' => $t->created_at->diffForHumans(),
                ];
            });

        return response()->json($transactions);
    }

    // --- NOTIFICATIONS ---

    public function getNotifications()
    {
        $user = Auth::user();
        $notifications = Notification::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->take(10)
            ->get();

        return response()->json($notifications);
    }

    public function markNotificationsRead()
    {
        $user = Auth::user();
        Notification::where('user_id', $user->id)->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['message' => 'Notifications read']);
    }
}
