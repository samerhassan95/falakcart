# 📚 API Documentation - نظام Affiliate FalakCart

## Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:8000/api
```

---

## 🔐 Authentication

### Login
```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com",
    "role": "affiliate"
  }
}
```

### Register
```http
POST /register
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password",
  "password_confirmation": "password"
}
```

### Get Current User
```http
GET /user
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com",
    "role": "affiliate"
  }
}
```

### Logout
```http
POST /logout
Authorization: Bearer {token}
```

---

## 👤 Affiliate Endpoints

### Get Profile
```http
GET /affiliate/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 2,
  "referral_code": "ABC123",
  "status": "active",
  "commission_rate": 15,
  "commission_type": "percentage",
  "total_earnings": 1250.50,
  "current_balance": 850.00,
  "pending_balance": 400.50,
  "main_referral_url": "https://falakcart.com/register?ref=ABC123",
  "user": {
    "id": 2,
    "name": "Affiliate Name",
    "email": "affiliate@example.com"
  }
}
```

### Update Profile
```http
PUT /affiliate/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "bio": "My bio text"
}
```

### Get Statistics
```http
GET /affiliate/stats?days=30
Authorization: Bearer {token}
```

**Query Parameters:**
- `days` (optional): Number of days (default: 30)

**Response:**
```json
{
  "clicks": 156,
  "referrals": 45,
  "subscriptions": 23,
  "earnings": 1250.50,
  "conversion_rate": 14.74,
  "available_bal": 850.00,
  "pending_bal": 400.50,
  "paid_bal": 0.00
}
```

### Get Recent Activity
```http
GET /affiliate/recent-activity
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "type": "commission",
    "title": "Commission earned",
    "subtitle": "$45.00 from subscription",
    "created_at": "2 hours ago"
  },
  {
    "type": "referral",
    "title": "New referral",
    "subtitle": "john@example.com signed up",
    "created_at": "5 hours ago"
  }
]
```

### Get Clicks Data
```http
GET /affiliate/clicks?days=30
Authorization: Bearer {token}
```

**Response:**
```json
[
  {"date": "2026-04-01", "count": 12},
  {"date": "2026-04-02", "count": 15},
  {"date": "2026-04-03", "count": 8}
]
```

### Get Referrals
```http
GET /affiliate/referrals
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "user": "John Doe",
    "email": "john@example.com",
    "referral_link": "https://falakcart.com/register?ref=ABC123",
    "status": "subscribed",
    "plan_amount": "$99.00/mo",
    "joined_date": "2026-04-01",
    "commission": "$14.85"
  }
]
```

### Get Earnings
```http
GET /affiliate/earnings
Authorization: Bearer {token}
```

**Response:**
```json
{
  "total_earnings": 1250.50,
  "available_balance": 850.00,
  "pending_balance": 400.50,
  "paid_balance": 0.00,
  "transactions": [
    {
      "id": 1,
      "type": "commission",
      "description": "Commission from subscription",
      "amount": 45.00,
      "status": "completed",
      "date": "2026-04-01"
    }
  ]
}
```

### Request Payout
```http
POST /affiliate/payout
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 500.00,
  "method": "bank_transfer"
}
```

### Get Affiliate Links
```http
GET /affiliate/links
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Main Link",
    "slug": "ABC123",
    "referral_url": "https://falakcart.com/register?ref=ABC123",
    "clicks": 156,
    "conversions": 23,
    "revenue": 1250.50
  }
]
```

### Create Custom Link
```http
POST /affiliate/links
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Facebook Campaign",
  "slug": "FB2024"
}
```

### Update Settings
```http
PUT /affiliate/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "email_notifications": true,
  "weekly_reports": true,
  "marketing_emails": false
}
```

### Update Avatar
```http
POST /affiliate/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

avatar: [file]
```

### Update Bank Details
```http
PUT /affiliate/bank-details
Authorization: Bearer {token}
Content-Type: application/json

{
  "bank_name": "Bank Name",
  "account_holder": "Account Holder Name",
  "account_number": "1234567890",
  "swift_code": "SWIFT123"
}
```

### Change Password
```http
PUT /affiliate/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "oldpassword",
  "new_password": "newpassword",
  "new_password_confirmation": "newpassword"
}
```

---

## 🛡️ Admin Endpoints

### Get Summary
```http
GET /admin/summary
Authorization: Bearer {token}
X-Role: admin
```

**Response:**
```json
{
  "total_affiliates": 45,
  "active_affiliates": 38,
  "total_sales": 234,
  "total_revenue": 23450.00,
  "total_commissions": 3517.50,
  "total_clicks": 5678
}
```

### Get All Affiliates
```http
GET /admin/affiliates
Authorization: Bearer {token}
X-Role: admin
```

**Response:**
```json
[
  {
    "id": 1,
    "user": {
      "id": 2,
      "name": "Affiliate Name",
      "email": "affiliate@example.com"
    },
    "referral_code": "ABC123",
    "status": "active",
    "commission_rate": 15,
    "commission_type": "percentage",
    "total_earnings": 1250.50,
    "clicks_count": 156,
    "sales_count": 23
  }
]
```

### Update Affiliate Status
```http
PUT /admin/affiliates/{id}/status
Authorization: Bearer {token}
X-Role: admin
Content-Type: application/json

{
  "status": "suspended"
}
```

### Update Commission Rate
```http
PUT /admin/affiliates/{id}/commission
Authorization: Bearer {token}
X-Role: admin
Content-Type: application/json

{
  "commission_rate": 20,
  "commission_type": "percentage",
  "commission_strategy": "flat"
}
```

**For Tiered Commission:**
```json
{
  "commission_rate": 15,
  "commission_type": "percentage",
  "commission_strategy": "tier_referrals",
  "commission_tiers": [
    {"threshold": 10, "rate": 15},
    {"threshold": 50, "rate": 20},
    {"threshold": 100, "rate": 25}
  ]
}
```

### Delete Affiliate
```http
DELETE /admin/affiliates/{id}
Authorization: Bearer {token}
X-Role: admin
```

### Get All Users
```http
GET /admin/users
Authorization: Bearer {token}
X-Role: admin
```

### Create User
```http
POST /admin/users
Authorization: Bearer {token}
X-Role: admin
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password",
  "role": "affiliate"
}
```

### Update User Role
```http
PUT /admin/users/{id}/role
Authorization: Bearer {token}
X-Role: admin
Content-Type: application/json

{
  "role": "admin"
}
```

### Get Click Analytics
```http
GET /admin/clicks?days=30
Authorization: Bearer {token}
X-Role: admin
```

### Export Data
```http
GET /admin/export
Authorization: Bearer {token}
X-Role: admin
```

**Response:** CSV file download

---

## 📊 Tracking Endpoints (Public)

### Track Click
```http
POST /track/click
Content-Type: application/json

{
  "referral_code": "ABC123",
  "page_url": "https://falakcart.com/register?ref=ABC123",
  "user_agent": "Mozilla/5.0...",
  "referrer": "https://google.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Click tracked successfully"
}
```

### Track Sale
```http
POST /track/sale
Content-Type: application/json

{
  "referral_code": "ABC123",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "amount": 99.00,
  "plan_name": "Premium Plan",
  "subscription_id": "sub_123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sale tracked successfully",
  "commission": 14.85
}
```

---

## 🔗 Webhook Endpoints

### FalakCart Webhook
```http
POST /webhooks/falakcart
Content-Type: application/json
X-Webhook-Signature: {hmac_signature}

{
  "event": "subscription.created",
  "data": {
    "referral_code": "ABC123",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "amount": 99.00,
    "subscription_id": "sub_123456"
  }
}
```

**Supported Events:**
- `subscription.created`
- `subscription.cancelled`
- `subscription.renewed`
- `payment.received`

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthenticated"
}
```

### 403 Forbidden
```json
{
  "message": "This action is unauthorized"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error",
  "error": "Error details..."
}
```

---

## 🔒 Security

### Rate Limiting
- **Default:** 60 requests per minute per IP
- **Tracking endpoints:** 120 requests per minute
- **Admin endpoints:** 30 requests per minute

### Authentication
- All protected endpoints require `Authorization: Bearer {token}` header
- Tokens expire after 60 minutes (configurable)
- Refresh tokens available on request

### CORS
- Allowed origins configured in `config/cors.php`
- Credentials supported for authenticated requests

---

## 📝 Notes

1. All dates are in ISO 8601 format
2. All amounts are in USD (or configured currency)
3. Timestamps are in UTC
4. Pagination available on list endpoints (add `?page=1&per_page=20`)
5. Filtering available on most endpoints (add `?filter[field]=value`)

---

## 🧪 Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@falakcart.com","password":"password"}'

# Get Profile (replace TOKEN)
curl -X GET http://localhost:8000/api/affiliate/profile \
  -H "Authorization: Bearer TOKEN"

# Track Click
curl -X POST http://localhost:8000/api/track/click \
  -H "Content-Type: application/json" \
  -d '{"referral_code":"ABC123"}'
```

### Using Postman

Import this collection: [Download Postman Collection](#)

---

**Last Updated:** 2026-04-06
**Version:** 1.0
**Contact:** support@your-domain.com
