# دليل ربط فلك كارت مع نظام الأفلييت

## نظرة عامة

هذا الدليل يوضح الخطوات المطلوبة من فريق فلك كارت لربط موقعهم مع نظام الأفلييت بحيث تتم مزامنة البيانات تلقائياً.

## ما سيحدث بعد التكامل

✅ **تتبع تلقائي للزيارات** - كل زائر يأتي من رابط أفلييت يُسجل فوراً  
✅ **تسجيل الاشتراكات** - كل اشتراك يتم من خلال أفلييت يُسجل مع العمولة  
✅ **إحصائيات مباشرة** - البيانات تظهر في لوحة تحكم الأفلييت فوراً  
✅ **حساب العمولات** - العمولات تُحسب وتُضاف للأفلييت تلقائياً  

---

## الخطوات المطلوبة من فلك كارت

### الخطوة 0: إعداد التكوين

قبل بدء التكامل، تحتاج هذه التفاصيل من نظام الأفلييت:

**المعلومات المطلوبة:**
- **رابط API الأفلييت**: `https://your-affiliate-domain.com/api`
- **مفتاح الأمان**: `your-secure-webhook-secret-here` (للحماية)
- **نطاق التتبع**: النطاق الذي يستضيف نظام الأفلييت

**إعداد CORS:**
نظامنا مُعد بالفعل لقبول الطلبات من أي نطاق، لذا لا حاجة لتغييرات CORS من جانبنا.

---

### الخطوة 1: إضافة سكريبت التتبع

أضف هذا الكود قبل إغلاق تاج `</body>` في **جميع صفحات** موقع فلك كارت:

```html
<!-- سكريبت تتبع الأفلييت -->
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

**مهم:** استبدل `https://your-affiliate-domain.com` بالنطاق الفعلي لنظام الأفلييت.

### الخطوة 2: تتبع الاشتراكات في صفحة النجاح

في صفحة "تم الاشتراك بنجاح" بعد إتمام الاشتراك، أضف هذا الكود:

```html
<script>
// انتظار تحميل سكريبت التتبع
function trackAffiliateSubscription() {
    if (window.FalakAffiliateTracker) {
        // بيانات الاشتراك
        var subscriptionData = {
            subscription_id: '{{ $subscription->id }}',           // رقم الاشتراك
            amount: {{ $subscription->monthly_amount }},          // قيمة الاشتراك الشهري
            plan_name: '{{ $subscription->plan_name }}',          // اسم الخطة
            customer_email: '{{ $subscription->customer_email }}', // بريد العميل
            customer_name: '{{ $subscription->customer_name }}',   // اسم العميل
            customer_phone: '{{ $subscription->customer_phone ?? "" }}' // هاتف العميل
        };
        
        // تتبع الاشتراك
        window.FalakAffiliateTracker.trackSale(subscriptionData)
            .then(function(response) {
                if (response.success) {
                    console.log('تم تسجيل العمولة بنجاح');
                }
            });
    } else {
        // إعادة المحاولة بعد ثانية
        setTimeout(trackAffiliateSubscription, 1000);
    }
}

// تشغيل التتبع عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', trackAffiliateSubscription);
</script>
```

### الخطوة 3: إضافة حقول قاعدة البيانات

أضف هذين الحقلين لجدول `subscriptions` في قاعدة بيانات فلك كارت:

```sql
ALTER TABLE subscriptions 
ADD COLUMN affiliate_code VARCHAR(50) NULL AFTER plan_id,
ADD COLUMN affiliate_commission DECIMAL(8,2) DEFAULT 0 AFTER affiliate_code,
ADD INDEX idx_affiliate_code (affiliate_code);
```

### الخطوة 4: تعديل نموذج الاشتراك

في ملف `Subscription.php` model، أضف هذا الكود:

```php
class Subscription extends Model
{
    // إضافة الحقول الجديدة
    protected $fillable = [
        // الحقول الموجودة...
        'affiliate_code',
        'affiliate_commission'
    ];
    
    // حفظ كود الإحالة عند إنشاء الاشتراك
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($subscription) {
            // البحث عن كود الإحالة في الكوكيز
            $affiliateCode = request()->cookie('affiliate_ref');
            
            if ($affiliateCode) {
                $subscription->affiliate_code = $affiliateCode;
            }
        });
    }
}
```

### الخطوة 5: إعداد Webhook (اختياري - للمزامنة المتقدمة)

إذا كنتم تريدون مزامنة أكثر دقة، أضف webhook endpoint في فلك كارت:

```php
// في routes/web.php أو routes/api.php
Route::post('/webhook/affiliate', [WebhookController::class, 'sendToAffiliate']);

// إنشاء WebhookController
class WebhookController extends Controller
{
    public function sendToAffiliate(Request $request)
    {
        $order = Order::find($request->order_id);
        
        if (!$order || !$order->affiliate_code) {
            return response()->json(['message' => 'No affiliate code']);
        }
        
        // إرسال البيانات لنظام الأفلييت
        $webhookData = [
            'event_type' => $request->event_type, // order.created, order.paid, order.cancelled
            'data' => [
                'id' => $order->id,
                'total' => $order->total,
                'status' => $order->status,
                'affiliate_code' => $order->affiliate_code,
                'customer' => [
                    'name' => $order->customer_name,
                    'email' => $order->customer_email,
                    'phone' => $order->customer_phone
                ]
            ]
        ];
        
        // إرسال للنظام
        Http::post('https://your-affiliate-domain.com/api/webhook/falakcart', $webhookData);
        
        return response()->json(['success' => true]);
    }
}
```

---

## اختبار التكامل

### 1. اختبار تتبع النقرات

1. اذهب لأي صفحة في فلك كارت مع إضافة `?ref=TEST123` للرابط
2. افتح Developer Tools واكتب: `console.log(window.FalakAffiliateTracker.getReferralCode())`
3. يجب أن يظهر `TEST123`

### 2. اختبار تتبع الاشتراكات

1. اعمل اشتراك تجريبي من رابط فيه `?ref=TEST123`
2. اكمل الاشتراك واذهب لصفحة النجاح
3. افتح Developer Tools وشوف console logs
4. يجب أن تشوف رسالة "تم تسجيل العمولة بنجاح"

---

## تفاصيل التكوين

### نقاط API

نظام الأفلييت يوفر هذه النقاط للتكامل مع فلك كارت:

**تتبع النقرات:**
```
GET https://your-affiliate-domain.com/api/track/click?ref=AFFILIATE_CODE
```

**تتبع الاشتراكات:**
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

### الأمان

للحماية، أضف هذا الهيدر في طلباتك:
```
X-Webhook-Signature: sha256=HMAC_SIGNATURE
```

التوقيع يُحسب باستخدام HMAC-SHA256 مع مفتاح الأمان.

### متغيرات البيئة

أضف هذه لملف `.env` في فلك كارت:
```
AFFILIATE_API_URL=https://your-affiliate-domain.com/api
AFFILIATE_WEBHOOK_SECRET=your-secure-webhook-secret-here
```

---

## معلومات مهمة

### روابط الأفلييت

الأفلييت سيستخدم روابط بهذا الشكل:
```
https://falakcart.com/product/example?ref=ABC123
https://falakcart.com/category/electronics?ref=ABC123
https://falakcart.com/?ref=ABC123
```

### مدة تتبع العميل

- العميل يتم تتبعه لمدة **30 يوم** من أول زيارة
- إذا اشترى خلال هذه المدة، الأفلييت يحصل على عمولة
- العمولة الافتراضية **10%** من قيمة الاشتراك الشهري

### البيانات المطلوبة

النظام يحتاج هذه البيانات من كل اشتراك:
- رقم الاشتراك
- قيمة الاشتراك الشهري
- اسم الخطة (أساسي، احترافي، مميز، إلخ)
- بريد العميل
- اسم العميل
- رقم هاتف العميل (اختياري)

---



## ملاحظات مهمة

⚠️ **تأكد من إضافة السكريبت في جميع الصفحات**  
⚠️ **اختبر التكامل قبل النشر**  
⚠️ **احتفظ بنسخة احتياطية قبل التعديل**  

هذا كل شيء! التكامل بسيط ولن يؤثر على أداء موقعكم.