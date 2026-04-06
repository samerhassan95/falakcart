# دليل التكامل الكامل - نظام Affiliate مع FalakCart

## نظرة عامة
هذا الدليل يشرح بالتفصيل كل الخطوات المطلوبة لتكامل نظام الـ Affiliate بشكل تلقائي مع موقع FalakCart الرئيسي.

---

## 📋 المتطلبات الأساسية

### 1. البنية التحتية
- ✅ نظام Affiliate (Frontend + Backend) - جاهز
- ✅ موقع FalakCart الرئيسي (https://falakcart.com)
- ✅ قاعدة بيانات مشتركة أو API للتواصل
- ✅ SSL Certificate للأمان

### 2. الصلاحيات المطلوبة
- وصول لكود موقع FalakCart الرئيسي
- صلاحيات تعديل صفحات التسجيل والدفع
- إمكانية إضافة JavaScript للموقع

---

## 🔧 الخطوات التفصيلية للتكامل

### المرحلة 1️⃣: إعداد Tracking Script في FalakCart

#### الخطوة 1: إضافة Tracking Script لصفحة التسجيل

**الملف:** `https://falakcart.com/register`

أضف هذا الكود في نهاية صفحة التسجيل قبل `</body>`:

```html
<!-- FalakCart Affiliate Tracking Script -->
<script>
(function() {
    'use strict';
    
    const AFFILIATE_API = 'http://your-affiliate-domain.com/api';
    
    // 1. التقاط referral code من URL
    function captureReferralCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode) {
            // حفظ الكود في localStorage
            localStorage.setItem('falakcart_ref', refCode);
            localStorage.setItem('falakcart_ref_time', Date.now());
            
            // إرسال Click Event للـ API
            trackClick(refCode);
        }
    }
    
    // 2. تتبع الضغطة (Click)
    async function trackClick(refCode) {
        try {
            await fetch(`${AFFILIATE_API}/track/click`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    referral_code: refCode,
                    page_url: window.location.href,
                    user_agent: navigator.userAgent,
                    referrer: document.referrer
                })
            });
            console.log('✅ Click tracked successfully');
        } catch (error) {
            console.error('❌ Error tracking click:', error);
        }
    }
    
    // 3. تشغيل التتبع عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', captureReferralCode);
    } else {
        captureReferralCode();
    }
})();
</script>
```

---

#### الخطوة 2: إضافة Sale Tracking عند إتمام الاشتراك

**الملف:** صفحة نجاح الدفع أو Webhook Handler

أضف هذا الكود عند إتمام عملية الاشتراك بنجاح:

```javascript
// في صفحة نجاح الدفع أو بعد تأكيد الاشتراك
<script>
(function() {
    const AFFILIATE_API = 'http://your-affiliate-domain.com/api';
    
    // بيانات العميل والاشتراك (من النظام)
    const subscriptionData = {
        customer_name: '{{customer_name}}',      // من قاعدة البيانات
        customer_email: '{{customer_email}}',    // من قاعدة البيانات
        plan_name: '{{plan_name}}',              // اسم الباقة
        amount: {{amount}},                       // المبلغ المدفوع
        currency: 'USD',
        subscription_id: '{{subscription_id}}'   // معرف الاشتراك
    };
    
    // استرجاع referral code من localStorage
    const refCode = localStorage.getItem('falakcart_ref');
    const refTime = localStorage.getItem('falakcart_ref_time');
    
    // التحقق من صلاحية الـ referral (خلال 30 يوم)
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const isValid = refCode && refTime && (Date.now() - parseInt(refTime)) < thirtyDaysInMs;
    
    if (isValid) {
        // إرسال Sale Event
        trackSale(refCode, subscriptionData);
    }
    
    async function trackSale(refCode, data) {
        try {
            const response = await fetch(`${AFFILIATE_API}/track/sale`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    referral_code: refCode,
                    customer_name: data.customer_name,
                    customer_email: data.customer_email,
                    plan_name: data.plan_name,
                    amount: data.amount,
                    currency: data.currency,
                    subscription_id: data.subscription_id,
                    status: 'completed'
                })
            });
            
            if (response.ok) {
                console.log('✅ Sale tracked successfully');
                // مسح الـ referral code بعد الاستخدام
                localStorage.removeItem('falakcart_ref');
                localStorage.removeItem('falakcart_ref_time');
            }
        } catch (error) {
            console.error('❌ Error tracking sale:', error);
        }
    }
})();
</script>
```

---

### المرحلة 2️⃣: إعداد Webhook للتحديثات التلقائية

#### الخطوة 3: إنشاء Webhook Endpoint في FalakCart

**الملف:** `webhook-handler.php` أو في نظام FalakCart

```php
<?php
// webhook-handler.php في موقع FalakCart

// التحقق من الأمان
$webhookSecret = 'your-secure-webhook-secret';
$receivedSignature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';

// التحقق من التوقيع
$payload = file_get_contents('php://input');
$expectedSignature = hash_hmac('sha256', $payload, $webhookSecret);

if (!hash_equals($expectedSignature, $receivedSignature)) {
    http_response_code(401);
    die('Invalid signature');
}

$data = json_decode($payload, true);
$event = $data['event'] ?? '';

// معالجة الأحداث المختلفة
switch ($event) {
    case 'subscription.created':
        handleNewSubscription($data);
        break;
        
    case 'subscription.cancelled':
        handleCancelledSubscription($data);
        break;
        
    case 'subscription.renewed':
        handleRenewedSubscription($data);
        break;
        
    case 'payment.received':
        handlePaymentReceived($data);
        break;
}

function handleNewSubscription($data) {
    $affiliateAPI = 'http://your-affiliate-domain.com/api';
    
    // إرسال بيانات الاشتراك لنظام Affiliate
    $ch = curl_init($affiliateAPI . '/track/sale');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'referral_code' => $data['referral_code'],
        'customer_name' => $data['customer']['name'],
        'customer_email' => $data['customer']['email'],
        'plan_name' => $data['plan']['name'],
        'amount' => $data['amount'],
        'currency' => $data['currency'],
        'subscription_id' => $data['subscription_id'],
        'status' => 'completed'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    error_log('Affiliate sale tracked: ' . $response);
}

function handleCancelledSubscription($data) {
    // يمكن إضافة منطق لتتبع الإلغاءات
    error_log('Subscription cancelled: ' . $data['subscription_id']);
}

function handleRenewedSubscription($data) {
    // يمكن إضافة عمولة متكررة للتجديدات
    error_log('Subscription renewed: ' . $data['subscription_id']);
}

function handlePaymentReceived($data) {
    // تتبع الدفعات المتكررة
    error_log('Payment received: ' . $data['payment_id']);
}

http_response_code(200);
echo json_encode(['status' => 'success']);
```

---

#### الخطوة 4: تسجيل Webhook في نظام الدفع

إذا كنت تستخدم Stripe أو PayPal أو أي نظام دفع:

**في Stripe Dashboard:**
1. اذهب إلى Developers → Webhooks
2. أضف endpoint: `https://falakcart.com/webhook-handler.php`
3. اختر الأحداث:
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
4. احفظ الـ Webhook Secret

---

### المرحلة 3️⃣: ربط قاعدة البيانات (اختياري)

#### الخطوة 5: مشاركة البيانات بين الأنظمة

**الخيار A: قاعدة بيانات مشتركة**

```php
// في FalakCart - حفظ referral_code مع بيانات العميل
$customer = new Customer();
$customer->name = $request->name;
$customer->email = $request->email;
$customer->referral_code = $_COOKIE['falakcart_ref'] ?? null;
$customer->save();
```

**الخيار B: API Calls**

```php
// في FalakCart - إرسال البيانات عبر API
function notifyAffiliateSystem($customerId, $subscriptionData) {
    $affiliateAPI = 'http://your-affiliate-domain.com/api';
    
    $ch = curl_init($affiliateAPI . '/webhooks/falakcart');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'event' => 'subscription.created',
        'customer_id' => $customerId,
        'data' => $subscriptionData
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Webhook-Secret: your-secure-secret'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}
```

---

### المرحلة 4️⃣: إعداد Webhook Receiver في نظام Affiliate

#### الخطوة 6: إنشاء Webhook Controller

**الملف:** `backend/app/Http/Controllers/WebhookController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Affiliate;
use App\Models\Click;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handleFalakCartWebhook(Request $request)
    {
        // التحقق من الأمان
        $secret = config('app.webhook_secret');
        $signature = $request->header('X-Webhook-Signature');
        
        $expectedSignature = hash_hmac('sha256', $request->getContent(), $secret);
        
        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('Invalid webhook signature');
            return response()->json(['error' => 'Invalid signature'], 401);
        }
        
        $event = $request->input('event');
        $data = $request->input('data');
        
        Log::info('Webhook received', ['event' => $event, 'data' => $data]);
        
        switch ($event) {
            case 'subscription.created':
                return $this->handleSubscriptionCreated($data);
                
            case 'subscription.cancelled':
                return $this->handleSubscriptionCancelled($data);
                
            case 'subscription.renewed':
                return $this->handleSubscriptionRenewed($data);
                
            default:
                return response()->json(['message' => 'Event not handled'], 200);
        }
    }
    
    private function handleSubscriptionCreated($data)
    {
        $referralCode = $data['referral_code'] ?? null;
        
        if (!$referralCode) {
            return response()->json(['message' => 'No referral code'], 200);
        }
        
        $affiliate = Affiliate::where('referral_code', $referralCode)->first();
        
        if (!$affiliate) {
            Log::warning('Affiliate not found', ['code' => $referralCode]);
            return response()->json(['error' => 'Affiliate not found'], 404);
        }
        
        // إنشاء Sale
        $sale = Sale::create([
            'affiliate_id' => $affiliate->id,
            'customer_name' => $data['customer_name'],
            'customer_email' => $data['customer_email'],
            'amount' => $data['amount'],
            'commission_amount' => $this->calculateCommission($affiliate, $data['amount']),
            'status' => 'completed',
            'subscription_id' => $data['subscription_id'] ?? null,
        ]);
        
        // تحديث أرصدة Affiliate
        $affiliate->increment('total_earnings', $sale->commission_amount);
        $affiliate->increment('pending_balance', $sale->commission_amount);
        
        Log::info('Sale created', ['sale_id' => $sale->id, 'affiliate_id' => $affiliate->id]);
        
        return response()->json([
            'message' => 'Sale tracked successfully',
            'sale_id' => $sale->id
        ], 201);
    }
    
    private function handleSubscriptionCancelled($data)
    {
        // منطق معالجة الإلغاء
        Log::info('Subscription cancelled', $data);
        return response()->json(['message' => 'Cancellation processed'], 200);
    }
    
    private function handleSubscriptionRenewed($data)
    {
        // منطق معالجة التجديد (عمولة متكررة)
        Log::info('Subscription renewed', $data);
        return response()->json(['message' => 'Renewal processed'], 200);
    }
    
    private function calculateCommission($affiliate, $amount)
    {
        if ($affiliate->commission_type === 'fixed') {
            return $affiliate->commission_rate;
        }
        
        return ($amount * $affiliate->commission_rate) / 100;
    }
}
```

---

#### الخطوة 7: إضافة Route للـ Webhook

**الملف:** `backend/routes/api.php`

```php
// Webhook من FalakCart (بدون authentication)
Route::post('/webhooks/falakcart', [WebhookController::class, 'handleFalakCartWebhook']);
```

---

### المرحلة 5️⃣: الإعدادات النهائية

#### الخطوة 8: تحديث Environment Variables

**الملف:** `backend/.env`

```env
# FalakCart Integration
FALAKCART_MAIN_URL=https://falakcart.com
WEBHOOK_SECRET=your-super-secure-webhook-secret-key-here

# Affiliate System URL
APP_URL=http://your-affiliate-domain.com
```

---

#### الخطوة 9: تحديث CORS Settings

**الملف:** `backend/config/cors.php`

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'webhooks/*'],
    
    'allowed_methods' => ['*'],
    
    'allowed_origins' => [
        'https://falakcart.com',
        'http://localhost:3000',
    ],
    
    'allowed_origins_patterns' => [],
    
    'allowed_headers' => ['*'],
    
    'exposed_headers' => [],
    
    'max_age' => 0,
    
    'supports_credentials' => true,
];
```

---

## 🧪 الاختبار والتحقق

### اختبار 1: تتبع الضغطات (Clicks)

```bash
# افتح في المتصفح
https://falakcart.com/register?ref=TEST123

# تحقق من الـ Console
# يجب أن ترى: "✅ Click tracked successfully"

# تحقق من قاعدة البيانات
SELECT * FROM clicks WHERE referral_code = 'TEST123' ORDER BY created_at DESC LIMIT 1;
```

---

### اختبار 2: تتبع المبيعات (Sales)

```bash
# بعد إتمام عملية اشتراك تجريبية
# تحقق من قاعدة البيانات
SELECT * FROM sales WHERE affiliate_id = (
    SELECT id FROM affiliates WHERE referral_code = 'TEST123'
) ORDER BY created_at DESC LIMIT 1;

# تحقق من الأرصدة
SELECT total_earnings, pending_balance FROM affiliates WHERE referral_code = 'TEST123';
```

---

### اختبار 3: Webhook

```bash
# اختبار Webhook يدوياً
curl -X POST http://your-affiliate-domain.com/api/webhooks/falakcart \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $(echo -n '{"event":"subscription.created"}' | openssl dgst -sha256 -hmac 'your-webhook-secret' | cut -d' ' -f2)" \
  -d '{
    "event": "subscription.created",
    "data": {
      "referral_code": "TEST123",
      "customer_name": "Test User",
      "customer_email": "test@example.com",
      "amount": 99.00,
      "subscription_id": "sub_test123"
    }
  }'
```

---

## 📊 مراقبة النظام

### إعداد Logging

**الملف:** `backend/config/logging.php`

```php
'channels' => [
    'affiliate' => [
        'driver' => 'daily',
        'path' => storage_path('logs/affiliate.log'),
        'level' => 'info',
        'days' => 14,
    ],
],
```

**استخدام:**

```php
use Illuminate\Support\Facades\Log;

Log::channel('affiliate')->info('Click tracked', [
    'referral_code' => $code,
    'ip' => $request->ip()
]);
```

---

## 🔒 الأمان

### 1. حماية Webhook

```php
// التحقق من IP المصدر
$allowedIPs = ['123.456.789.0', '98.765.432.1'];
if (!in_array($request->ip(), $allowedIPs)) {
    abort(403, 'Unauthorized IP');
}

// التحقق من التوقيع
$signature = hash_hmac('sha256', $request->getContent(), config('app.webhook_secret'));
if (!hash_equals($signature, $request->header('X-Webhook-Signature'))) {
    abort(401, 'Invalid signature');
}
```

### 2. Rate Limiting

```php
// في routes/api.php
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/track/click', [TrackingController::class, 'trackClick']);
    Route::post('/track/sale', [TrackingController::class, 'trackSale']);
});
```

---

## 📈 التحسينات المستقبلية

### 1. Queue للمعالجة الثقيلة

```php
// استخدام Jobs للمعالجة غير المتزامنة
dispatch(new ProcessAffiliateClick($referralCode, $data));
dispatch(new ProcessAffiliateSale($affiliateId, $saleData));
```

### 2. Cache للأداء

```php
// Cache بيانات Affiliate
$affiliate = Cache::remember("affiliate:{$code}", 3600, function() use ($code) {
    return Affiliate::where('referral_code', $code)->first();
});
```

### 3. Analytics Dashboard

- إضافة Google Analytics
- تتبع Conversion Rate
- تقارير مفصلة للأداء

---

## ✅ Checklist النهائي

- [ ] إضافة Tracking Script لصفحة التسجيل
- [ ] إضافة Sale Tracking لصفحة نجاح الدفع
- [ ] إعداد Webhook Handler في FalakCart
- [ ] إعداد Webhook Receiver في نظام Affiliate
- [ ] تحديث Environment Variables
- [ ] تحديث CORS Settings
- [ ] اختبار تتبع الضغطات
- [ ] اختبار تتبع المبيعات
- [ ] اختبار Webhook
- [ ] إعداد Logging
- [ ] تطبيق إجراءات الأمان
- [ ] مراجعة الأداء
- [ ] توثيق API
- [ ] تدريب الفريق

---

## 🆘 استكشاف الأخطاء

### المشكلة: Clicks لا تُسجل

**الحل:**
1. تحقق من Console في المتصفح
2. تحقق من CORS Settings
3. تحقق من API URL في الـ Script
4. تحقق من Logs: `storage/logs/laravel.log`

### المشكلة: Sales لا تُسجل

**الحل:**
1. تحقق من localStorage في المتصفح
2. تحقق من صلاحية الـ referral code (30 يوم)
3. تحقق من Webhook Signature
4. تحقق من قاعدة البيانات

### المشكلة: Webhook لا يعمل

**الحل:**
1. تحقق من Webhook URL
2. تحقق من Webhook Secret
3. تحقق من IP Whitelist
4. اختبر يدوياً باستخدام cURL

---

## 📞 الدعم

للمساعدة أو الاستفسارات:
- راجع الـ Logs: `storage/logs/`
- تحقق من الـ API Documentation
- اتصل بفريق التطوير

---

**تم إعداد هذا الدليل بواسطة:** Kiro AI Assistant
**التاريخ:** 2026-04-06
**الإصدار:** 1.0
