# FalakCart Integration with Affiliate System

## Overview

This guide outlines the required steps for FalakCart team to integrate their e-commerce platform with our affiliate tracking system for automatic data synchronization.

## What Will Happen After Integration

✅ **Automatic Visit Tracking** - Every visitor from affiliate links gets tracked instantly  
✅ **Subscription Recording** - Every subscription through affiliates gets recorded with commission  
✅ **Real-time Statistics** - Data appears in affiliate dashboard immediately  
✅ **Commission Calculation** - Commissions are calculated and added automatically  

---

## Required Steps from FalakCart

### Step 0: Configuration Setup

Before starting the integration, you need these configuration details from our affiliate system:

**Required Information:**
- **Affiliate API URL**: `https://your-affiliate-domain.com/api`
- **Webhook Secret**: `your-secure-webhook-secret-here` (for security)
- **Tracking Domain**: The domain where your affiliate system is hosted

**IMPORTANT:** Before starting integration, we will provide you with:
- ✅ **Your actual API URL** (replace `your-affiliate-domain.com`)
- ✅ **Your webhook secret key** (replace `your-secure-webhook-secret-here`)
- ✅ **Test affiliate codes** for testing the integration

**CORS Configuration:**
Our system is already configured to accept requests from any domain, so no CORS changes needed on our side.

---

### Step 1: Add Tracking Script

Add this code before the closing `</body>` tag on **ALL pages** of FalakCart website:

```html
<!-- Affiliate Tracking Script -->
<script>
(function() {
    var script = document.createElement('script');
    script.src = 'https://your-affiliate-domain.com/js/tracking.js';
    script.async = true;
    script.onload = function() {
        console.log('Affiliate tracking loaded');
    };
    document.head.appendChild(script);
})();
</script>
```

**Important:** Replace `https://your-affiliate-domain.com` with the actual domain where our affiliate system is hosted.

### Step 2: Track Subscriptions on Success Page

On the "Subscription Success" page after successful subscription, add this code:

```html
<script>
// Wait for tracking script to load
function trackAffiliateSubscription() {
    if (window.FalakAffiliateTracker) {
        // Subscription data
        var subscriptionData = {
            subscription_id: '{{ $subscription->id }}',           // Subscription ID
            amount: {{ $subscription->monthly_amount }},          // Monthly subscription amount
            plan_name: '{{ $subscription->plan_name }}',          // Plan name (Basic, Pro, etc.)
            customer_email: '{{ $subscription->customer_email }}', // Customer email
            customer_name: '{{ $subscription->customer_name }}',   // Customer name
            customer_phone: '{{ $subscription->customer_phone ?? "" }}' // Customer phone
        };
        
        // Track the subscription
        window.FalakAffiliateTracker.trackSale(subscriptionData)
            .then(function(response) {
                if (response.success) {
                    console.log('Commission tracked successfully');
                }
            });
    } else {
        // Retry after 1 second
        setTimeout(trackAffiliateSubscription, 1000);
    }
}

// Run tracking when page loads
document.addEventListener('DOMContentLoaded', trackAffiliateSubscription);
</script>
```

**Note:** Adjust the field names (`$subscription->id`, `$subscription->monthly_amount`, etc.) to match your actual subscription model fields.

### Step 3: Add Database Fields

Add these two fields to the `subscriptions` table in FalakCart database:

```sql
ALTER TABLE subscriptions 
ADD COLUMN affiliate_code VARCHAR(50) NULL AFTER plan_id,
ADD COLUMN affiliate_commission DECIMAL(8,2) DEFAULT 0 AFTER affiliate_code,
ADD INDEX idx_affiliate_code (affiliate_code);
```

### Step 4: Modify Subscription Model

In the `Subscription.php` model file, add this code:

```php
class Subscription extends Model
{
    // Add new fields
    protected $fillable = [
        // existing fields...
        'affiliate_code',
        'affiliate_commission'
    ];
    
    // Save affiliate code when creating subscription
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($subscription) {
            // Look for affiliate code in cookies
            $affiliateCode = request()->cookie('affiliate_ref');
            
            if ($affiliateCode) {
                $subscription->affiliate_code = $affiliateCode;
            }
        });
    }
}
```

**Note:** If your subscription model has different field names, adjust accordingly.

### Step 5: Setup Webhook (Optional - for advanced sync)

If you want more precise synchronization, add webhook endpoint in FalakCart:

```php
// In routes/web.php or routes/api.php
Route::post('/webhook/affiliate', [WebhookController::class, 'sendToAffiliate']);

// Create WebhookController
class WebhookController extends Controller
{
    public function sendToAffiliate(Request $request)
    {
        $subscription = Subscription::find($request->subscription_id);
        
        if (!$subscription || !$subscription->affiliate_code) {
            return response()->json(['message' => 'No affiliate code']);
        }
        
        // Send data to affiliate system
        $webhookData = [
            'event_type' => $request->event_type, // subscription.created, subscription.paid, subscription.cancelled
            'data' => [
                'id' => $subscription->id,
                'amount' => $subscription->monthly_amount,
                'plan_name' => $subscription->plan_name,
                'status' => $subscription->status,
                'affiliate_code' => $subscription->affiliate_code,
                'customer' => [
                    'name' => $subscription->customer_name,
                    'email' => $subscription->customer_email,
                    'phone' => $subscription->customer_phone
                ]
            ]
        ];
        
        // Send to our system
        Http::post('https://your-affiliate-domain.com/api/webhook/falakcart', $webhookData);
        
        return response()->json(['success' => true]);
    }
}
```

**Important:** Replace `https://your-affiliate-domain.com` with the actual affiliate system URL.

---

## Testing Integration

### 1. Test Click Tracking

1. Go to any FalakCart page with `?ref=TEST123` in URL
2. Open Developer Tools and type: `console.log(window.FalakAffiliateTracker.getReferralCode())`
3. Should display `TEST123`

### 2. Test Subscription Tracking

1. Make a test subscription from a link with `?ref=TEST123`
2. Complete the subscription and go to success page
3. Open Developer Tools and check console logs
4. Should see "Commission tracked successfully" message

---

## Configuration Details

### API Endpoints

Our affiliate system provides these endpoints for FalakCart integration:

**Click Tracking:**
```
GET https://your-affiliate-domain.com/api/track/click?ref=AFFILIATE_CODE
```

**Subscription Tracking:**
```
POST https://your-affiliate-domain.com/api/track/sale
Content-Type: application/json

{
    "referral_code": "AFFILIATE_CODE",
    "subscription_id": "sub_123",
    "amount": 50.00,
    "plan_name": "Pro Plan",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe"
}
```

### Security

For webhook security, include this header in your requests:
```
X-Webhook-Signature: sha256=HMAC_SIGNATURE
```

The signature is calculated using HMAC-SHA256 with the webhook secret.

### Environment Variables

Add these to your FalakCart `.env` file:
```
AFFILIATE_API_URL=https://your-affiliate-domain.com/api
AFFILIATE_WEBHOOK_SECRET=your-secure-webhook-secret-here
```

---

## Important Information

### Affiliate Links Format

Affiliates will use links like this:
```
https://falakcart.com/product/example?ref=ABC123
https://falakcart.com/category/electronics?ref=ABC123
https://falakcart.com/?ref=ABC123
```

### Customer Tracking Duration

- Customer is tracked for **30 days** from first visit
- If they purchase within this period, affiliate gets commission
- Default commission rate is **10%** of monthly subscription amount

### Required Data

The system needs this data from each subscription:
- Subscription ID
- Monthly amount
- Plan name (Basic, Pro, Premium, etc.)
- Customer email
- Customer name
- Customer phone (optional)

---


---

## Contact Information & Support

### Technical Support
- **Email**: [your-email@domain.com]
- **WhatsApp**: [+966xxxxxxxxx]
- **Response Time**: Within 24 hours

### Integration Support
We provide **FREE integration support** including:
- Code review and testing assistance
- Troubleshooting any integration issues
- Custom modifications if needed
- Live testing session via screen share

### Documentation & Resources
- **API Documentation**: Available upon request
- **Test Environment**: We can provide test credentials
- **Sample Code**: Additional examples available

---

## Go-Live Checklist

Before launching the integration:

### ✅ Pre-Launch Testing
- [ ] Tracking script loads on all pages
- [ ] Click tracking works with test referral codes
- [ ] Subscription tracking records commissions correctly
- [ ] Database fields are added and working
- [ ] Console logs show successful tracking

### ✅ Production Setup
- [ ] Replace test URLs with production URLs
- [ ] Update webhook secret in environment variables
- [ ] Test with real affiliate referral codes
- [ ] Verify commission calculations are correct
- [ ] Monitor for any errors in first 24 hours

### ✅ Post-Launch Monitoring
- [ ] Check affiliate dashboard shows new data
- [ ] Verify commission payments are accurate
- [ ] Monitor system performance impact
- [ ] Review tracking accuracy weekly

---

## Frequently Asked Questions

### Q: Will this slow down our website?
**A:** No. The tracking script is lightweight (< 5KB) and loads asynchronously. It won't affect your page load times.

### Q: What happens if the affiliate system is down?
**A:** The tracking script fails gracefully. Your website continues to work normally, and tracking resumes when the system is back online.

### Q: Can we customize commission rates per affiliate?
**A:** Yes. Our system supports individual commission rates, tiered commissions, and custom rules per affiliate.

### Q: How secure is the integration?
**A:** Very secure. We use HMAC-SHA256 signatures for webhooks, HTTPS for all communications, and no sensitive customer data is stored in our system.

### Q: Can we track different subscription plans differently?
**A:** Yes. The system tracks plan names and amounts separately, allowing for different commission structures per plan.

### Q: What if we need to modify the integration later?
**A:** The integration is designed to be flexible. Most changes can be made without affecting your existing code.

---

## Integration Timeline

### Phase 1: Setup (Day 1)
- **Duration**: 2-4 hours
- **Tasks**: Add tracking script, database changes, model updates
- **Outcome**: Basic tracking functional

### Phase 2: Testing (Day 2)
- **Duration**: 1-2 hours  
- **Tasks**: Test click and subscription tracking
- **Outcome**: Verified working integration

### Phase 3: Go-Live (Day 3)
- **Duration**: 30 minutes
- **Tasks**: Switch to production URLs, monitor
- **Outcome**: Live affiliate tracking

**Total Integration Time: 1-3 days**

---

## What We Provide

### ✅ Complete Integration Package
- Detailed step-by-step guide (this document)
- Ready-to-use tracking script
- Database migration scripts
- Sample code for all components
- Testing instructions and tools

### ✅ Technical Support
- Free integration assistance
- Code review and optimization
- Troubleshooting and debugging
- Performance monitoring

### ✅ Ongoing Maintenance
- System updates and improvements
- Security patches and monitoring
- Performance optimization
- Feature enhancements

---

## Important Notes

⚠️ **Make sure to add the script on ALL pages**  
⚠️ **Test the integration before going live**  
⚠️ **Keep a backup before making changes**  

---

## Next Steps

### 1. Review This Document
- Read through all sections carefully
- Identify any questions or concerns
- Note any custom requirements

### 2. Schedule Integration Call
- We recommend a 30-minute technical call
- Review integration steps together
- Address any specific requirements
- Plan the implementation timeline

### 3. Begin Implementation
- Start with Step 1 (tracking script)
- Test each step before proceeding
- Contact us if you encounter any issues

### 4. Go Live
- Switch to production configuration
- Monitor for 24-48 hours
- Celebrate successful integration! 🎉

---

**Ready to get started? Contact us to schedule your integration call!**

That's it! The integration is simple, secure, and won't affect your website performance.