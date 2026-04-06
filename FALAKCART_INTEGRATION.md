# دليل ربط نظام الأفلييت مع فلك كارت الرئيسي

## 1. في الموقع الرئيسي (FalakCart Main Site)

### أ. إضافة JavaScript لتتبع الإحالات:

```javascript
// في ملف public/js/affiliate-tracking.js
(function() {
    // تتبع رابط الإحالة عند دخول الموقع
    function trackReferral() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode) {
            // حفظ كود الإحالة في الكوكيز لمدة 30 يوم
            document.cookie = `referral_code=${refCode}; max-age=2592000; path=/; domain=.falakcart.com`;
            
            // إرسال طلب لتسجيل الكليك
            fetch(`https://affiliate.falakcart.com/api/track/click?ref=${refCode}`, {
                method: 'GET',
                mode: 'cors'
            }).catch(err => console.log('Affiliate tracking error:', err));
            
            // إزالة المعامل من الرابط
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({path: newUrl}, '', newUrl);
        }
    }
    
    // تشغيل التتبع عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackReferral);
    } else {
        trackReferral();
    }
})();
```

### ب. في صفحة إتمام الشراء (PHP/Laravel):

```php
// في Controller الخاص بإتمام الطلبات
public function completeOrder(Request $request)
{
    // منطق إتمام الطلب العادي
    $order = Order::create([...]);
    
    // التحقق من وجود كود إحالة
    $referralCode = $request->cookie('referral_code') ?? session('referral_code');
    
    if ($referralCode) {
        // إرسال بيانات البيع لنظام الأفلييت
        $this->notifyAffiliateSystem($order, $referralCode);
    }
    
    return response()->json(['success' => true, 'order' => $order]);
}

private function notifyAffiliateSystem($order, $referralCode)
{
    try {
        $payload = [
            'referral_code' => $referralCode,
            'amount' => $order->total,
            'order_id' => $order->id,
            'customer_email' => $order->customer_email,
            'product_name' => $order->product_name,
            'timestamp' => now()->toISOString()
        ];
        
        $signature = 'sha256=' . hash_hmac('sha256', json_encode($payload), config('services.affiliate.webhook_secret'));
        
        Http::withHeaders([
            'X-Webhook-Signature' => $signature,
            'Content-Type' => 'application/json'
        ])->post('https://affiliate.falakcart.com/api/track/sale', $payload);
        
    } catch (\Exception $e) {
        \Log::error('Affiliate notification failed: ' . $e->getMessage());
    }
}
```

### ج. إضافة إعدادات في config/services.php:

```php
'affiliate' => [
    'webhook_secret' => env('AFFILIATE_WEBHOOK_SECRET', 'your-secret-key'),
    'base_url' => env('AFFILIATE_BASE_URL', 'https://affiliate.falakcart.com'),
],
```

## 2. في نظام الأفلييت (هذا المشروع)

### أ. تحديث روابط الإحالة:
- بدلاً من: `https://falakcart.com/ref/ABC123`
- استخدم: `https://falakcart.com?ref=ABC123`

### ب. إضافة CORS للسماح بالطلبات من الموقع الرئيسي:

```php
// في config/cors.php
'paths' => ['api/*', 'track/*'],
'allowed_origins' => ['https://falakcart.com', 'https://www.falakcart.com'],
```

## 3. متطلبات الخادم والنشر:

### أ. متغيرات البيئة المطلوبة:
```env
WEBHOOK_SECRET=your-very-secure-secret-key-here
FALAKCART_MAIN_URL=https://falakcart.com
AFFILIATE_DOMAIN=https://affiliate.falakcart.com
CORS_ALLOWED_ORIGINS=https://falakcart.com,https://www.falakcart.com
```

### ب. SSL Certificate:
- ضروري لكلا الموقعين
- استخدم Let's Encrypt أو Cloudflare

### ج. قاعدة البيانات:
- تأكد من أن قاعدة البيانات تدعم العمليات المتزامنة
- فعّل الفهرسة على `referral_code` و `affiliate_id`

## 4. اختبار التكامل:

### أ. اختبار محلي:
```bash
# تشغيل نظام الأفلييت
cd backend && php artisan serve --port=8000
cd frontend && npm run dev

# محاكاة طلب من الموقع الرئيسي
curl -X POST http://localhost:8000/api/track/sale \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=..." \
  -d '{"referral_code":"ABC123","amount":299.99,"order_id":"ORDER123"}'
```

### ب. اختبار الإنتاج:
1. إنشاء رابط إحالة من لوحة الأفلييت
2. زيارة الموقع الرئيسي بالرابط
3. إتمام عملية شراء تجريبية
4. التحقق من ظهور البيع في لوحة الأفلييت

## 5. مراقبة وصيانة:

### أ. Logs مهمة:
- `storage/logs/laravel.log` - أخطاء النظام
- Webhook failures - فشل إشعارات البيع
- Commission calculations - حسابات العمولات

### ب. Monitoring:
- معدل نجاح Webhooks
- زمن الاستجابة للتتبع
- دقة حسابات العمولات

## 6. الأمان:

### أ. Webhook Security:
- استخدم HMAC SHA256 للتوقيع
- تحقق من التوقيع في كل طلب
- استخدم HTTPS فقط

### ب. Rate Limiting:
```php
// في routes/api.php
Route::middleware(['throttle:60,1'])->group(function () {
    Route::get('track/click', [TrackingController::class, 'recordClick']);
    Route::post('track/sale', [TrackingController::class, 'recordSale']);
});
```

هذا الدليل يغطي كل ما تحتاجه لربط نظام الأفلييت مع موقع فلك كارت الرئيسي بشكل آمن وفعال.