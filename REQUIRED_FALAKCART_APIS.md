# APIs المطلوبة من فلك كارت الرئيسي

## 🔗 التكاملات المطلوبة:

### 1. **Products/Plans API** 📦
```php
// GET /api/products
{
  "products": [
    {
      "id": 1,
      "name": "FalakCart Pro",
      "price": 299.99,
      "currency": "USD",
      "billing_cycle": "monthly",
      "description": "Premium plan with all features"
    },
    {
      "id": 2, 
      "name": "FalakCart Enterprise",
      "price": 599.99,
      "currency": "USD",
      "billing_cycle": "monthly"
    }
  ]
}
```

### 2. **Webhook Endpoint** 🔔
```php
// POST /webhook/affiliate-sale (في نظام الأفلييت)
{
  "referral_code": "ABC123",
  "order_id": "ORDER-12345",
  "customer_email": "customer@example.com",
  "product_id": 1,
  "product_name": "FalakCart Pro",
  "amount": 299.99,
  "currency": "USD",
  "status": "completed",
  "timestamp": "2026-04-06T12:00:00Z"
}
```

### 3. **Customer Tracking Script** 📊
```javascript
// في صفحات فلك كارت
<script>
// تتبع كود الإحالة
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
        // حفظ في الكوكيز لمدة 30 يوم
        document.cookie = `referral_code=${refCode}; max-age=2592000; path=/; domain=.falakcart.com`;
        
        // تسجيل الكليك
        fetch(`https://affiliate.falakcart.com/api/track/click?ref=${refCode}`)
            .catch(err => console.log('Tracking error:', err));
    }
})();
</script>
```

### 4. **Payment Success Handler** 💳
```php
// في فلك كارت - بعد نجاح الدفع
public function handlePaymentSuccess($order) 
{
    $referralCode = request()->cookie('referral_code') ?? session('referral_code');
    
    if ($referralCode) {
        // إرسال للنظام الأفلييت
        Http::withHeaders([
            'X-Webhook-Signature' => $this->generateSignature($payload),
            'Content-Type' => 'application/json'
        ])->post('https://affiliate.falakcart.com/api/track/sale', [
            'referral_code' => $referralCode,
            'order_id' => $order->id,
            'amount' => $order->total,
            'product_name' => $order->product_name,
            'customer_email' => $order->customer_email
        ]);
    }
}
```

## 🛠️ ما يمكن عمله الآن بدون APIs:

### ✅ **Mock Data System** (موجود حالياً):
- منتجات وهمية في صفحة الترحيب
- محاكاة عملية الشراء
- اختبار كامل للتدفق

### ✅ **Standalone Testing**:
- اختبار جميع وظائف الأفلييت
- اختبار لوحة الأدمن
- اختبار حساب العمولات

## 🎯 الحل المؤقت (للتطوير):

### 1. **Mock API Server**
```javascript
// يمكن إنشاء خادم وهمي
const mockProducts = [
  { id: 1, name: "FalakCart Pro", price: 299.99 },
  { id: 2, name: "FalakCart Enterprise", price: 599.99 }
];
```

### 2. **Test Environment**
- استخدام البيانات الوهمية الحالية
- اختبار جميع السيناريوهات
- التأكد من صحة الحسابات

## 📋 خطة التنفيذ:

### المرحلة 1: **التطوير والاختبار** (حالياً) ✅
- ✅ نظام الأفلييت مكتمل
- ✅ لوحات التحكم تعمل
- ✅ حساب العمولات صحيح
- ✅ تتبع الكليكات والمبيعات

### المرحلة 2: **التكامل مع فلك كارت** (مطلوب):
1. **إضافة JavaScript للتتبع** في صفحات فلك كارت
2. **إنشاء Webhook** لإرسال بيانات المبيعات
3. **API للمنتجات** لعرض الأسعار الحقيقية
4. **اختبار التكامل** الكامل

### المرحلة 3: **الإنتاج**:
- نشر النظام على خادم حقيقي
- ربط قاعدة البيانات الإنتاج
- تفعيل SSL certificates
- مراقبة الأداء

## 🚀 الخلاصة:

**النظام جاهز 90%** - يعمل بشكل مستقل ومكتمل

**المطلوب من فلك كارت**:
1. JavaScript للتتبع (5 أسطر كود)
2. Webhook عند نجاح الدفع (10 أسطر كود)  
3. API للمنتجات (اختياري للعرض الديناميكي)

**يمكن البدء فوراً** باستخدام البيانات الوهمية للاختبار والتطوير!