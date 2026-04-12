# FalakCart Integration with Affiliate System

## Overview

This guide outlines the webhook-based integration between FalakCart and our affiliate tracking system. Both systems remain completely standalone with no code changes required in either project.

**Integration Approach:**
✅ **Standalone Systems** - No code changes in either project  
✅ **Webhook Communication** - FalakCart sends HTTP callbacks to our system  
✅ **Affiliate Link Tracking** - Our system provides trackable links  
✅ **Automatic Commissions** - Real-time commission calculation via webhooks  

---

## How It Works

1. **Affiliate gets referral link** from our system: `https://falakcart.com/register?ref=ABC123`
2. **Customer clicks link** and visits FalakCart
3. **Customer registers/subscribes** on FalakCart
4. **FalakCart sends webhook** to our system with event data
5. **Our system calculates commission** and updates affiliate dashboard

---

## Required Information

**What We Need from FalakCart:**
- **Webhook endpoint capability** to send HTTP POST requests
- **Event data** when users register or subscribe
- **Affiliate code tracking** in URLs (`?ref=AFFILIATE_CODE`)

**What We Provide to FalakCart:**
- **Webhook URL**: `https://your-affiliate-domain.com/api/webhooks/falakcart`
- **Webhook Secret**: `your-secure-webhook-secret-here` (for security)
- **Affiliate codes** for testing and production

---

## Required Information

**What We Need from FalakCart:**
- **Webhook endpoint capability** to send HTTP POST requests
- **Event data** when users register or subscribe
- **Affiliate code tracking** in URLs (`?ref=AFFILIATE_CODE`)

**What We Provide to FalakCart:**
- **Webhook URL**: `https://your-affiliate-domain.com/api/webhooks/falakcart`
- **Webhook Secret**: `your-secure-webhook-secret-here` (for security)
- **Affiliate codes** for testing and production

**Security:** All webhooks must include HMAC-SHA256 signature for verification.

---

## Webhook Integration Requirements

### What FalakCart Needs to Send

FalakCart should send HTTP POST requests to our webhook URL when these events occur:

#### 1. User Registration Event
```json
POST https://your-affiliate-domain.com/api/webhooks/falakcart
Content-Type: application/json
X-Webhook-Signature: sha256=HMAC_SIGNATURE

{
    "event_type": "user.registered",
    "timestamp": "2024-04-08T10:30:00Z",
    "data": {
        "user_id": "12345",
        "email": "user@example.com",
        "name": "John Doe",
        "affiliate_code": "ABC123",
        "registered_at": "2024-04-08T10:30:00Z",
        "source_url": "https://falakcart.com/register?ref=ABC123"
    }
}
```

#### 2. Subscription Event
```json
POST https://your-affiliate-domain.com/api/webhooks/falakcart
Content-Type: application/json
X-Webhook-Signature: sha256=HMAC_SIGNATURE

{
    "event_type": "subscription.created",
    "timestamp": "2024-04-08T10:35:00Z",
    "data": {
        "subscription_id": "sub_67890",
        "user_id": "12345",
        "plan_name": "Pro Plan",
        "amount": 59.99,
        "currency": "USD",
        "billing_cycle": "monthly",
        "affiliate_code": "ABC123",
        "subscribed_at": "2024-04-08T10:35:00Z",
        "customer": {
            "email": "user@example.com",
            "name": "John Doe",
            "phone": "+1234567890"
        }
    }
}
```

### Webhook Security

**HMAC Signature Calculation:**
```php
$payload = json_encode($webhookData);
$signature = 'sha256=' . hash_hmac('sha256', $payload, $webhookSecret);
// Send as X-Webhook-Signature header
```

### Our Webhook Response

Our system will respond with:
```json
{
    "success": true,
    "message": "Event processed successfully",
    "commission_calculated": 5.99
}
```

---

## Affiliate Link Format

Affiliates will use links in this format:
```
https://falakcart.com/register?ref=ABC123
https://falakcart.com/pricing?ref=ABC123
https://falakcart.com/plans?ref=ABC123
```

**Requirements:**
- FalakCart must capture the `ref` parameter from URLs
- Store the affiliate code with user registration/subscription
- Include the affiliate code in webhook payloads

---

## Testing Integration

### 1. Test Registration Webhook
1. Visit: `https://falakcart.com/register?ref=TEST123`
2. Complete registration process
3. FalakCart sends registration webhook to our system
4. Verify webhook received and processed successfully

### 2. Test Subscription Webhook
1. Visit: `https://falakcart.com/pricing?ref=TEST123`
2. Complete subscription process
3. FalakCart sends subscription webhook to our system
4. Verify commission calculated and affiliate credited

### 3. Webhook Testing Tools
- Use tools like ngrok for local testing
- Test webhook signature validation
- Verify all required fields are included
- Test error handling and retries

---

## Testing Integration

### 1. Test Click Tracking
1. Go to any FalakCart page with `?ref=TEST123` in URL
2. Open Developer Tools and type: `console.log(window.FalakAffiliateTracker.getReferralCode())`
3. Should display `TEST123`

### 2. Test Subscription Tracking
1. Make a test subscription from a link with `?ref=TEST123`
2. Complete subscription and go to success page
3. Check console logs - should see "Commission tracked successfully"

---

## API Endpoints & Configuration

### Click Tracking API
```
GET https://your-affiliate-domain.com/api/track/click?ref=AFFILIATE_CODE
```

### Subscription Tracking API
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

### Environment Variables
Add to your `.env` file:
```
AFFILIATE_API_URL=https://your-affiliate-domain.com/api
AFFILIATE_WEBHOOK_SECRET=your-secure-webhook-secret-here
```

### Security
For webhook security, include this header:
```
X-Webhook-Signature: sha256=HMAC_SIGNATURE
```

---

## Important Information

### Affiliate Links Format
```
https://falakcart.com/product/example?ref=ABC123
https://falakcart.com/category/electronics?ref=ABC123
https://falakcart.com/?ref=ABC123
```

### Tracking Details
- **Customer Tracking Duration**: 30 days from first visit
- **Default Commission Rate**: 10% of monthly subscription amount
- **Required Data**: Subscription ID, monthly amount, plan name, customer email/name

## Important Notes

⚠️ **Add the script on ALL pages**  
⚠️ **Test the integration before going live**  
⚠️ **Keep a backup before making changes**  


The integration is simple, secure, and won't affect your website performance.