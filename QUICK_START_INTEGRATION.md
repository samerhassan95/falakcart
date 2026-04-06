# 🚀 دليل البدء السريع - تكامل Affiliate مع FalakCart

## الخطوات الأساسية (5 خطوات فقط!)

---

## ✅ الخطوة 1: إضافة Tracking Script لصفحة التسجيل

**المكان:** صفحة `https://falakcart.com/register` قبل `</body>`

```html
<script src="https://your-affiliate-domain.com/tracking.js"></script>
<script>
  FalakAffiliateTracker.init({
    apiUrl: 'https://your-affiliate-domain.com/api',
    autoTrack: true
  });
</script>
```

**أو استخدم الكود الكامل:**

```html
<script>
(function() {
    const API = 'https://your-affiliate-domain.com/api';
    const ref = new URLSearchParams(window.location.search).get('ref');
    
    if (ref) {
        localStorage.setItem('falakcart_ref', ref);
        fetch(`${API}/track/click`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({referral_code: ref})
        });
    }
})();
</script>
```

---

## ✅ الخطوة 2: تتبع المبيعات عند نجاح الاشتراك

**المكان:** صفحة نجاح الدفع أو بعد تأكيد الاشتراك

```javascript
<script>
(function() {
    const API = 'https://your-affiliate-domain.com/api';
    const ref = localStorage.getItem('falakcart_ref');
    
    if (ref) {
        fetch(`${API}/track/sale`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                referral_code: ref,
                customer_name: '{{customer_name}}',
                customer_email: '{{customer_email}}',
                amount: {{amount}},
                plan_name: '{{plan_name}}'
            })
        }).then(() => {
            localStorage.removeItem('falakcart_ref');
        });
    }
})();
</script>
```

---

## ✅ الخطوة 3: إعداد Webhook (اختياري لكن مهم)

**في نظام الدفع (Stripe/PayPal):**

1. أضف Webhook URL: `https://falakcart.com/webhook-handler.php`
2. اختر الأحداث: `subscription.created`, `payment.succeeded`

**ملف webhook-handler.php:**

```php
<?php
$data = json_decode(file_get_contents('php://input'), true);

// إرسال للـ Affiliate System
$ch = curl_init('https://your-affiliate-domain.com/api/webhooks/falakcart');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_exec($ch);
curl_close($ch);
?>
```

---

## ✅ الخطوة 4: تحديث الإعدادات

**في ملف `.env` لنظام Affiliate:**

```env
FALAKCART_MAIN_URL=https://falakcart.com
WEBHOOK_SECRET=your-secure-secret-key
APP_URL=https://your-affiliate-domain.com
```

**في `config/cors.php`:**

```php
'allowed_origins' => [
    'https://falakcart.com',
],
```

---

## ✅ الخطوة 5: الاختبار

### اختبار سريع:

1. **افتح:** `https://falakcart.com/register?ref=TEST123`
2. **تحقق من Console:** يجب أن ترى رسالة نجاح
3. **تحقق من Dashboard:** يجب أن تظهر ضغطة جديدة
4. **أكمل اشتراك تجريبي:** يجب أن تظهر عملية بيع

### تحقق من قاعدة البيانات:

```sql
-- تحقق من الضغطات
SELECT * FROM clicks WHERE referral_code = 'TEST123';

-- تحقق من المبيعات
SELECT * FROM sales WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE referral_code = 'TEST123'
);
```

---

## 🎯 النتيجة المتوقعة

بعد تطبيق هذه الخطوات:

✅ كل ضغطة على لينك affiliate تُسجل تلقائياً
✅ كل اشتراك جديد يُسجل كـ sale
✅ العمولات تُحسب وتُضاف تلقائياً
✅ Dashboard يتحدث في الوقت الفعلي
✅ Affiliates يشوفوا إحصائياتهم مباشرة

---

## 🔧 استكشاف الأخطاء السريع

| المشكلة | الحل |
|---------|------|
| Clicks مش بتتسجل | تحقق من Console + CORS Settings |
| Sales مش بتتسجل | تحقق من localStorage + API URL |
| Webhook مش شغال | تحقق من Webhook URL + Secret |
| عمولات غلط | تحقق من Commission Rate في Dashboard |

---

## 📞 محتاج مساعدة؟

1. شوف الـ Logs: `storage/logs/laravel.log`
2. افتح Console في المتصفح
3. جرب الاختبار اليدوي بـ cURL
4. راجع الدليل الكامل: `COMPLETE_INTEGRATION_GUIDE.md`

---

**ملاحظة مهمة:** 
استبدل `your-affiliate-domain.com` بالدومين الفعلي لنظام الـ Affiliate!

🎉 **مبروك! نظامك جاهز للعمل!**
