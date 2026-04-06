# 🔧 دليل استكشاف الأخطاء - نظام Affiliate

## 🚨 المشاكل الشائعة وحلولها

---

## 1️⃣ مشاكل تسجيل الدخول

### المشكلة: "Invalid credentials"

**الأسباب المحتملة:**
- Email أو Password غلط
- User غير موجود في قاعدة البيانات
- Password مش متطابق

**الحل:**
```bash
# تحقق من وجود User
cd backend
php artisan tinker
>>> User::where('email', 'admin@falakcart.com')->first()

# إعادة تعيين Password
>>> $user = User::where('email', 'admin@falakcart.com')->first();
>>> $user->password = Hash::make('newpassword');
>>> $user->save();
```

---

### المشكلة: "Token expired"

**الحل:**
```bash
# تسجيل دخول جديد
# أو زيادة مدة صلاحية Token في config/jwt.php
'ttl' => 60 * 24, // 24 ساعة بدلاً من 60 دقيقة
```

---

## 2️⃣ مشاكل Tracking

### المشكلة: Clicks لا تُسجل

**التشخيص:**
```javascript
// افتح Console في المتصفح (F12)
// يجب أن ترى:
// "✅ Click tracked successfully"

// إذا رأيت خطأ:
// ❌ CORS Error
// ❌ Network Error
// ❌ 404 Not Found
```

**الحلول:**

#### أ) CORS Error
```php
// backend/config/cors.php
'allowed_origins' => [
    'https://falakcart.com',
    'http://localhost:3000', // للتطوير
],
```

#### ب) API URL غلط
```javascript
// تحقق من URL في الـ tracking script
const API = 'https://your-domain.com/api'; // تأكد إنه صحيح
```

#### ج) Route مش موجود
```bash
# تحقق من Routes
cd backend
php artisan route:list | grep track

# يجب أن ترى:
# POST api/track/click
# POST api/track/sale
```

---

### المشكلة: Sales لا تُسجل

**التشخيص:**
```javascript
// تحقق من localStorage
console.log(localStorage.getItem('falakcart_ref'));
// يجب أن يظهر referral code

// تحقق من صلاحية الـ code
const refTime = localStorage.getItem('falakcart_ref_time');
const now = Date.now();
const diff = now - parseInt(refTime);
const days = diff / (1000 * 60 * 60 * 24);
console.log('Days since click:', days);
// يجب أن يكون أقل من 30 يوم
```

**الحلول:**

#### أ) Referral code منتهي
```javascript
// مسح الـ code القديم
localStorage.removeItem('falakcart_ref');
localStorage.removeItem('falakcart_ref_time');

// فتح اللينك من جديد
window.location.href = 'https://falakcart.com/register?ref=ABC123';
```

#### ب) API call فشل
```bash
# تحقق من Logs
cd backend
tail -f storage/logs/laravel.log

# ابحث عن:
# "Sale tracked successfully"
# أو أي error messages
```

---

## 3️⃣ مشاكل قاعدة البيانات

### المشكلة: "SQLSTATE[HY000] [2002] Connection refused"

**الحل:**
```bash
# تحقق من إعدادات Database في .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# تحقق من تشغيل MySQL
sudo systemctl status mysql
# أو
sudo service mysql status

# إعادة تشغيل MySQL
sudo systemctl restart mysql
```

---

### المشكلة: "Table doesn't exist"

**الحل:**
```bash
# تشغيل Migrations
cd backend
php artisan migrate

# إذا فشل، إعادة تشغيل من الصفر
php artisan migrate:fresh
php artisan db:seed --class=AdminSeeder
```

---

## 4️⃣ مشاكل الصلاحيات

### المشكلة: "Permission denied" على storage

**الحل:**
```bash
cd backend

# إعطاء صلاحيات للمجلدات
chmod -R 775 storage bootstrap/cache

# تغيير المالك (على السيرفر)
sudo chown -R www-data:www-data storage bootstrap/cache

# إنشاء symbolic link
php artisan storage:link
```

---

### المشكلة: "This action is unauthorized"

**الحل:**
```bash
# تحقق من Role
php artisan tinker
>>> $user = User::find(1);
>>> $user->role; // يجب أن يكون 'admin' أو 'affiliate'

# تغيير Role
>>> $user->role = 'admin';
>>> $user->save();
```

---

## 5️⃣ مشاكل Frontend

### المشكلة: صفحة بيضاء فارغة

**التشخيص:**
```bash
# تحقق من Console (F12)
# ابحث عن JavaScript errors
```

**الحل:**
```bash
cd frontend

# مسح Cache
rm -rf .next
rm -rf node_modules

# إعادة التثبيت
npm install

# إعادة Build
npm run build
npm run dev
```

---

### المشكلة: "Loading..." لا ينتهي

**الأسباب:**
1. API لا يستجيب
2. CORS Error
3. Authentication فشل

**الحل:**
```bash
# 1. تحقق من Backend
curl http://localhost:8000/api/health

# 2. تحقق من API URL في .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# 3. تحقق من Token
# افتح Application > Local Storage في DevTools
# ابحث عن 'token'
```

---

## 6️⃣ مشاكل Webhook

### المشكلة: Webhook لا يستقبل البيانات

**التشخيص:**
```bash
# تحقق من Logs
cd backend
tail -f storage/logs/laravel.log | grep webhook
```

**الحل:**

#### أ) URL غلط
```bash
# تأكد من Webhook URL في نظام الدفع
https://your-domain.com/api/webhooks/falakcart
```

#### ب) Signature غلط
```php
// تحقق من WEBHOOK_SECRET في .env
WEBHOOK_SECRET=your-secure-secret

// تأكد إنه نفس السر المستخدم في FalakCart
```

#### ج) اختبار يدوي
```bash
# اختبر Webhook يدوياً
curl -X POST http://localhost:8000/api/webhooks/falakcart \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test" \
  -d '{
    "event": "subscription.created",
    "data": {
      "referral_code": "TEST123",
      "customer_name": "Test User",
      "customer_email": "test@example.com",
      "amount": 99.00
    }
  }'
```

---

## 7️⃣ مشاكل الأداء

### المشكلة: الموقع بطيء

**الحلول:**

#### أ) تفعيل Cache
```bash
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### ب) تحسين Database
```sql
-- إضافة Indexes
CREATE INDEX idx_referral_code ON clicks(referral_code);
CREATE INDEX idx_affiliate_id ON sales(affiliate_id);
CREATE INDEX idx_created_at ON clicks(created_at);
```

#### ج) تفعيل OPcache
```ini
; في php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

---

## 8️⃣ مشاكل Email

### المشكلة: Emails لا تُرسل

**الحل:**
```bash
# تحقق من إعدادات Email في .env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password

# اختبار Email
php artisan tinker
>>> Mail::raw('Test', function($msg) { 
    $msg->to('test@example.com')->subject('Test'); 
});
```

---

## 9️⃣ مشاكل SSL/HTTPS

### المشكلة: "Mixed Content" warnings

**الحل:**
```php
// في backend/app/Providers/AppServiceProvider.php
public function boot()
{
    if ($this->app->environment('production')) {
        URL::forceScheme('https');
    }
}
```

---

### المشكلة: SSL Certificate غير صالح

**الحل:**
```bash
# تثبيت Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# تجديد تلقائي
sudo certbot renew --dry-run
```

---

## 🔟 مشاكل عامة

### المشكلة: "500 Internal Server Error"

**التشخيص:**
```bash
# تحقق من Logs
cd backend
tail -f storage/logs/laravel.log

# تفعيل Debug Mode (للتطوير فقط!)
# في .env
APP_DEBUG=true
```

**الحلول الشائعة:**
```bash
# 1. مسح Cache
php artisan cache:clear
php artisan config:clear

# 2. تحديث Composer
composer dump-autoload

# 3. تحقق من Permissions
chmod -R 775 storage bootstrap/cache
```

---

## 📊 أدوات التشخيص

### 1. Laravel Telescope (للتطوير)
```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate

# افتح: http://localhost:8000/telescope
```

### 2. Laravel Debugbar
```bash
composer require barryvdh/laravel-debugbar --dev

# سيظهر شريط Debug في أسفل الصفحة
```

### 3. Query Logging
```php
// في أي Controller
DB::enableQueryLog();
// ... your code ...
dd(DB::getQueryLog());
```

---

## 🆘 الحصول على المساعدة

### قبل طلب المساعدة، جهّز:

1. **وصف المشكلة:**
   - ماذا كنت تحاول أن تفعل؟
   - ماذا حدث بالفعل؟
   - ما هي رسالة الخطأ؟

2. **معلومات البيئة:**
   ```bash
   php artisan --version
   node --version
   npm --version
   ```

3. **Logs:**
   ```bash
   # آخر 50 سطر من Log
   tail -n 50 storage/logs/laravel.log
   ```

4. **Browser Console:**
   - افتح DevTools (F12)
   - انسخ أي errors من Console

5. **Network Tab:**
   - افتح Network في DevTools
   - انسخ تفاصيل الـ failed request

---

## 📞 قنوات الدعم

- **Documentation:** راجع `COMPLETE_INTEGRATION_GUIDE.md`
- **API Docs:** راجع `API_DOCUMENTATION.md`
- **GitHub Issues:** أنشئ issue جديد
- **Email:** support@your-domain.com

---

## ✅ Checklist للتشخيص السريع

عند حدوث أي مشكلة:

- [ ] تحقق من Console في المتصفح
- [ ] تحقق من Network Tab
- [ ] تحقق من Laravel Logs
- [ ] تحقق من .env settings
- [ ] تحقق من Database connection
- [ ] تحقق من Permissions
- [ ] مسح Cache
- [ ] إعادة تشغيل Services
- [ ] اختبار على متصفح آخر
- [ ] اختبار على جهاز آخر

---

**آخر تحديث:** 2026-04-06
**الإصدار:** 1.0
