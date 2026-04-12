# FalakCart Webhook Integration Guide

This guide explains how to integrate FalakCart's webhook system with your affiliate tracking system.

## Webhook Endpoint

Your affiliate system provides a webhook endpoint to receive callbacks from FalakCart:

```
POST https://your-domain.com/api/webhook/falakcart
```

## Supported Events

### 1. User Registration (`affiliate.user.registered`)

Triggered when a user registers using a referral code.

**Payload Structure:**
```json
{
  "event": "affiliate.user.registered",
  "sent_at": "2026-04-11T19:48:34+03:00",
  "data": {
    "callback_id": "d35afb5a-4a7a-4b17-a2c3-f4a28dee045e",
    "occurred_at": "2026-04-11T19:48:34+03:00",
    "referral": {
      "source": "website",
      "utm_medium": "social",
      "utm_campaign": "summer2024",
      "referral_code": "FRIEND2025"
    },
    "user": {
      "id": 7,
      "name": "M Abu Hurairah",
      "email": "wicac98145@icousd.com",
      "phone": "971503610658"
    }
  }
}
```

**What happens:**
- Records a click/registration event
- Associates the user with the affiliate
- Creates a notification for the affiliate
- Tracks UTM parameters for analytics

### 2. Subscription (`affiliate.subscription`)

Triggered when a user subscribes to a plan using a referral code.

**Payload Structure:**
```json
{
  "event": "affiliate.subscription",
  "sent_at": "2026-04-12T09:03:43+03:00",
  "data": {
    "callback_id": "3837f763-87ce-4701-a26a-8055471127de",
    "occurred_at": "2026-04-12T09:03:43+03:00",
    "action": "subscribed",
    "referral": {
      "source": "website",
      "utm_medium": "social",
      "utm_campaign": "summer2024",
      "referral_code": "FRIEND2025"
    },
    "user": {
      "id": 7,
      "name": "M Abu Hurairah",
      "email": "wicac98145@icousd.com",
      "phone": "971503610658"
    },
    "subscription": {
      "id": 69,
      "plan_id": 6,
      "plan_name": "Enterprise Yearly",
      "status": "active",
      "price": "2750.00",
      "currency": "SAR",
      "billing_cycle": "yearly",
      "start_date": "2026-04-12",
      "end_date": "2027-04-12"
    },
    "tenant": {
      "id": 114,
      "name": "asas",
      "subdomain": "vgvusjj",
      "status": "active"
    }
  }
}
```

**What happens:**
- Creates a sale record with commission calculation
- Updates affiliate earnings and balance
- Creates a transaction record
- Sends notification to affiliate
- Supports tiered commission structures

### 3. Plan Change (`affiliate.subscription` with `action: "plan_change"`)

Triggered when a user changes their subscription plan.

**Payload Structure:**
```json
{
  "event": "affiliate.subscription",
  "sent_at": "2026-04-12T09:17:16+03:00",
  "data": {
    "callback_id": "a40f4918-d09a-49fc-beef-4090a8e73650",
    "occurred_at": "2026-04-12T09:17:16+03:00",
    "action": "plan_change",
    "referral": {
      "source": "website",
      "utm_medium": "social",
      "utm_campaign": "summer2024",
      "referral_code": "FRIEND2025"
    },
    "user": {
      "id": 7,
      "name": "M Abu Hurairah",
      "email": "wicac98145@icousd.com",
      "phone": "971503610658"
    },
    "subscription": {
      "id": 69,
      "plan_id": 6,
      "plan_name": "Enterprise Yearly",
      "status": "active",
      "price": "2750.00",
      "currency": "SAR",
      "billing_cycle": "yearly",
      "start_date": "2026-04-12",
      "end_date": "2027-04-12"
    },
    "tenant": {
      "id": 114,
      "name": "asas",
      "subdomain": "vgvusjj",
      "status": "active"
    }
  }
}
```

**What happens:**
- Updates existing sale record with new plan details
- Calculates commission difference (upgrade/downgrade)
- Adjusts affiliate balance accordingly
- Creates adjustment transaction
- Notifies affiliate of plan change

## Security

### Webhook Signature Validation

All webhooks include an `X-Webhook-Signature` header for security validation:

```php
$signature = $request->header('X-Webhook-Signature');
$secret = config('app.webhook_secret', 'your-webhook-secret');
$expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);
$isValid = hash_equals($expectedSignature, $signature);
```

### Configuration

Set your webhook secret in the `.env` file:

```env
WEBHOOK_SECRET=your-secure-webhook-secret-here
```

## Commission Calculation

The system supports multiple commission structures:

### 1. Flat Rate
- **Percentage**: Commission = Amount × (Rate / 100)
- **Fixed**: Commission = Fixed Rate Amount

### 2. Tiered Commission
- **By Referrals**: Commission rate increases based on total referrals
- **By Volume**: Commission rate increases based on total sales volume

### Example Tier Configuration:
```json
[
  {"threshold": 0, "rate": 10},
  {"threshold": 5, "rate": 12},
  {"threshold": 10, "rate": 15}
]
```

## Testing

Use the provided test script to verify webhook integration:

```bash
cd backend
php test_falakcart_webhook.php
```

## Database Schema

### Sales Table
- `falakcart_user_id`: FalakCart user ID
- `currency`: Subscription currency (SAR, USD, etc.)
- `billing_cycle`: monthly, yearly, etc.
- `webhook_data`: Full webhook payload for debugging

### Clicks Table
- `customer_email`: User email from registration
- `customer_name`: User name from registration
- `utm_source`, `utm_medium`, `utm_campaign`: Marketing attribution

## Error Handling

The webhook endpoint returns appropriate HTTP status codes:

- `200`: Success
- `400`: Invalid event type or malformed payload
- `401`: Invalid webhook signature
- `404`: Affiliate not found for referral code
- `500`: Internal processing error

All errors are logged for debugging purposes.

## Integration Steps

1. **Configure Webhook URL** in FalakCart admin panel:
   ```
   https://your-domain.com/api/webhook/falakcart
   ```

2. **Set Webhook Secret** in both systems for security

3. **Test Integration** using the provided test script

4. **Monitor Logs** for any processing errors

5. **Verify Data** in affiliate dashboard and admin panel

## Troubleshooting

### Common Issues

1. **404 Affiliate Not Found**
   - Verify referral code exists in system
   - Check both main referral codes and custom link slugs

2. **Invalid Signature**
   - Ensure webhook secret matches in both systems
   - Check signature generation algorithm

3. **Duplicate Processing**
   - System handles duplicate webhooks gracefully
   - Uses `callback_id` for idempotency

### Debug Information

Enable debug logging in `.env`:
```env
LOG_LEVEL=debug
```

Check logs at `storage/logs/laravel.log` for detailed webhook processing information.

## Response Format

The webhook endpoint returns JSON responses:

### Success Response
```json
{
  "message": "subscription_recorded",
  "action": "subscribed",
  "sale": {
    "id": 123,
    "affiliate_id": 1,
    "amount": 2750.00,
    "commission_amount": 275.00
  },
  "commission": 275.00
}
```

### Error Response
```json
{
  "error": "affiliate_not_found",
  "message": "No affiliate found for referral code: FRIEND2025"
}
```

## Monitoring and Analytics

The system provides comprehensive tracking:

- **Real-time notifications** to affiliates
- **Detailed transaction logs** for auditing
- **UTM parameter tracking** for marketing attribution
- **Commission tier progression** tracking
- **Plan change impact** analysis

This integration ensures seamless tracking of all affiliate-driven activities in FalakCart.