# خطوات ربط نظام الأفلييت مع موقع فلك كارت

## 🔧 الخطوة 1: إضافة JavaScript للتتبع

### في موقع فلك كارت الرئيسي:

#### أ. إضافة الكود في `<head>` أو قبل `</body>`:

```html
<!-- FalakCart Affiliate Tracking -->
<script>
(function() {
    'use strict';
    
    // إعدادات النظام - غير الرابط للخادم الحقيقي
    const AFFILIATE_API_URL = 'https://affiliate.falakcart.com/api';
    const COOKIE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 يوم
    
    // استخراج كود الإحالة من الرابط
    function getReferralCode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ref');
    }
    
    // حفظ كود الإحالة
    function saveReferralCode(code) {
        const expires = new Date(Date.now() + COOKIE_DURATION).toUTCString();
        document.cookie = `referral_code=${code}; expires=${expires}; path=/; domain=.falakcart.com`;
        localStorage.setItem('referral_code', code);
    }
    
    // تسجيل الكليك
    async function recordClick(code) {
        try {
            await fetch(`${AFFILIATE_API_URL}/track/click?ref=${code}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            console.log('✅ Click recorded:', code);
        } catch (error) {
            console.error('❌ Click tracking error:', error);
        }
    }
    
    // إزالة معامل ref من الرابط
    function cleanUrl() {
        const url = new URL(window.location);
        if (url.searchParams.has('ref')) {
            url.searchParams.delete('ref');
            window.history.replaceState({}, document.title, url.toString());
        }
    }
    
    // تشغيل التتبع
    function initializeTracking() {
        const referralCode = getReferralCode();
        if (referralCode) {
            saveReferralCode(referralCode);
            recordClick(referralCode);
            cleanUrl();
        }
    }
    
    // تشغيل عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTracking);
    } else {
        initializeTracking();
    }
    
    // دالة تسجيل البيع
    window.FalakCartAffiliate = {
        recordSale: async function(orderData) {
            const referralCode = document.cookie.split('; ').find(row => row.startsWith('referral_code='))?.split('=')[1];
            if (!referralCode) return false;
            
            try {
                await fetch(`${AFFILIATE_API_URL}/track/sale`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        referral_code: referralCode,
                        amount: orderData.total,
                        order_id: orderData.id,
                        customer_email: orderData.email
                    })
                });
                console.log('✅ Sale recorded');
                return true;
            } catch (error) {
                console.error('❌ Sale tracking error:', error);
                return false;
            }
        }
    };
})();
</script>
```

## 🔧 الخطوة 2: تسجيل البيع عند إتمام الدفع

### في صفحة نجاح الدفع أو Controller الدفع:

```javascript
// عند نجاح الدفع
if (window.FalakCartAffiliate) {
    window.FalakCartAffiliate.recordSale({
        id: 'ORDER-12345',
        total: 299.99,
        email: 'customer@example.com'
    });
}
```

أو في PHP:

```php
// في Controller الدفع
public function paymentSuccess($order) 
{
    // منطق الدفع العادي...
    
    // إرسال للنظام الأفلييت
    $this->notifyAffiliateSystem($order);
}

private function notifyAffiliateSystem($order) 
{
    $referralCode = request()->cookie('referral_code');
    
    if ($referralCode) {
        Http::post('https://affiliate.falakcart.com/api/track/sale', [
            'referral_code' => $referralCode,
            'amount' => $order->total,
            'order_id' => $order->id,
            'customer_email' => $order->customer_email
        ]);
    }
}
```

## 🔧 الخطوة 3: تحديث روابط الإحالة

### في نظام الأفلييت، غير الروابط من:
```
http://localhost:3000/refer/ABC123
```

### إلى:
```
https://falakcart.com?ref=ABC123
```

## 🧪 اختبار التكامل:

### 1. اختبار الكليك:
- اذهب إلى: `https://falakcart.com?ref=8A1FF41E`
- افتح Developer Tools → Console
- المفروض تشوف: `✅ Click recorded: 8A1FF41E`

### 2. اختبار البيع:
- أكمل عملية شراء على الموقع
- المفروض يتسجل البيع تلقائياً في نظام الأفلييت

### 3. تحقق من النتائج:
- ارجع للوحة الأفلييت
- شوف الكليكات والمبيعات الجديدة

## 🚀 النتيجة النهائية:

بعد إضافة الكود ده، النظام هيشتغل كالتالي:

1. **العميل يضغط**: `https://falakcart.com?ref=ABC123`
2. **تلقائياً**: يتسجل الكليك في نظام الأفلييت
3. **العميل يشتري**: من موقع فلك كارت العادي
4. **تلقائياً**: يتسجل البيع مع العمولة
5. **الأفلييت يشوف**: الإحصائيات محدثة في لوحته

**كل ده بدون تدخل من المستخدم!** 🎯