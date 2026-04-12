# 🧪 Local Testing Guide - Affiliate Tracking

## Quick Setup (5 minutes)

### 1. Start Your Servers

```bash
# Terminal 1: Start Laravel backend
cd backend
php artisan serve
# Should run on http://localhost:8000

# Terminal 2: Start Next.js frontend  
cd frontend
npm run dev
# Should run on http://localhost:3000
```

### 2. Setup Test Data

```bash
cd backend
php setup_test_data.php
```

This creates 3 test affiliates:
- `TEST123` (10% commission)
- `DEMO456` (15% commission) 
- `PARTNER789` (12.5% commission)

### 3. Open Test Page

Open `FALAKCART_TEST_PAGE.html` in your browser (double-click the file)

---

## Testing Flow

### Step 1: Simulate Affiliate Click
1. Click "Click with ref=TEST123" button
2. ✅ Should see "Click recorded successfully" in console
3. ✅ Tracking status should show referral code

### Step 2: Choose Plan
1. Click on any subscription plan (Basic, Pro, Enterprise)
2. ✅ Plan should be selected and highlighted

### Step 3: Complete Subscription
1. Fill in customer details (name and email required)
2. Click "Complete Subscription"
3. ✅ Should see "Subscription tracked successfully" 
4. ✅ Should show commission amount

### Step 4: Verify in Dashboard
1. Click "Open Affiliate Dashboard" → Goes to http://localhost:3000
2. Login with test affiliate credentials:
   - Email: `test1@example.com`
   - Password: `password123`
3. ✅ Should see new click and sale in dashboard

---

## What to Check in UI

### Affiliate Dashboard (http://localhost:3000)
- **Dashboard**: New stats (clicks, sales, earnings)
- **Analytics**: Click and sale charts updated
- **Earnings**: New transaction showing commission
- **Referrals**: New referral entry

### Admin Panel (http://localhost:3000/admin)
- **Overview**: Updated totals
- **Analytics**: New data in charts
- **Affiliates**: Updated affiliate stats

---

## Troubleshooting

### ❌ "Click tracking error"
- Check if backend is running on http://localhost:8000
- Check browser console for CORS errors
- Verify test affiliates exist in database

### ❌ "Failed to record click: invalid_referral_code"
- Run `php setup_test_data.php` to create test affiliates
- Check database has affiliates with correct referral codes

### ❌ "Subscription tracking error"
- Check if you clicked affiliate link first
- Verify referral code is saved in cookies
- Check backend logs for errors

### ❌ Frontend not showing data
- Refresh the page after completing test
- Check if you're logged in as the correct affiliate
- Verify the referral code matches the logged-in affiliate

---

## Advanced Testing

### Test Different Scenarios

1. **Different Commission Rates**:
   - Use DEMO456 (15% commission) vs TEST123 (10%)
   - Compare commission amounts

2. **Multiple Clicks**:
   - Click affiliate link multiple times
   - Check if clicks are counted correctly

3. **Different Plans**:
   - Test Basic ($29.99), Pro ($59.99), Enterprise ($99.99)
   - Verify commission calculation

4. **Cookie Persistence**:
   - Click affiliate link
   - Close and reopen browser
   - Complete subscription - should still track

### API Testing

Test endpoints directly:

```bash
# Test click tracking
curl "http://localhost:8000/api/track/click?ref=TEST123"

# Test sale tracking
curl -X POST http://localhost:8000/api/track/sale \
  -H "Content-Type: application/json" \
  -d '{
    "referral_code": "TEST123",
    "subscription_id": "sub_test_123",
    "amount": 59.99,
    "plan_name": "Pro Plan",
    "customer_email": "test@example.com",
    "customer_name": "Test Customer"
  }'
```

---

## Demo for FalakCart Meeting

### Perfect Demo Flow:

1. **Show the test page** - "This simulates your website"
2. **Click affiliate link** - "Customer clicks affiliate link"
3. **Select plan** - "Customer chooses subscription"
4. **Complete subscription** - "Customer pays and subscribes"
5. **Show dashboard** - "Affiliate sees commission immediately"
6. **Show admin panel** - "You see all affiliate activity"

### Key Points to Highlight:

✅ **Real-time tracking** - Data appears instantly  
✅ **Accurate commission** - Calculated automatically  
✅ **Complete audit trail** - Every click and sale tracked  
✅ **Easy integration** - Just add our script to your pages  

---

## Files Created:

📄 `FALAKCART_TEST_PAGE.html` - Interactive test page  
📄 `backend/setup_test_data.php` - Creates test affiliates  
📄 `LOCAL_TESTING_GUIDE.md` - This guide  

You're ready to test and demo! 🚀