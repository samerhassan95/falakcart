# دليل رفع المشروع على aPanel

## المتطلبات:
- PHP 8.1 أو أحدث
- MySQL 5.7 أو أحدث
- Node.js 18 أو أحدث (للبناء فقط)
- Composer

## خطوات رفع الـ Backend (Laravel):

### 1. رفع الملفات:
```bash
# ارفع مجلد backend كاملاً إلى public_html أو subdomain
# تأكد من رفع:
- جميع ملفات المشروع
- مجلد vendor (أو قم بتشغيل composer install)
- ملف .htaccess في مجلد public
```

### 2. إعداد قاعدة البيانات:
```sql
-- أنشئ قاعدة بيانات جديدة في aPanel
-- استورد الجداول باستخدام:
php artisan migrate --force
php artisan db:seed --class=AdminSeeder --force
```

### 3. إعداد ملف .env:
```bash
# انسخ .env.production إلى .env وعدل المعلومات:
APP_URL=https://yourdomain.com
DB_HOST=localhost
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
```

### 4. إعداد الصلاحيات:
```bash
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
```

### 5. إعداد .htaccess في الجذر:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

## خطوات رفع الـ Frontend (Next.js):

### الطريقة الأولى - Static Export:
```bash
# في مجلد frontend محلياً:
npm run build
npm run export

# ارفع مجلد out إلى subdomain أو مجلد منفصل
```

### الطريقة الثانية - Node.js Hosting:
```bash
# إذا كان aPanel يدعم Node.js:
npm run build
npm start

# أو استخدم PM2:
pm2 start npm --name "affiliate-frontend" -- start
```

## إعدادات مهمة:

### 1. CORS في Laravel:
```php
// في config/cors.php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['https://your-frontend-domain.com'],
```

### 2. Trusted Proxies:
```php
// في app/Http/Middleware/TrustProxies.php
protected $proxies = '*';
```

### 3. إعداد SSL:
- فعل SSL من aPanel
- تأكد من استخدام https في جميع الروابط

## اختبار المشروع:

### 1. اختبار الـ API:
```bash
curl https://yourdomain.com/api/health
```

### 2. اختبار تسجيل الدخول:
```bash
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### 3. اختبار الـ Frontend:
- افتح الموقع في المتصفح
- جرب تسجيل الدخول
- تأكد من عمل الـ API calls

## مشاكل شائعة وحلولها:

### 1. خطأ 500:
```bash
# تحقق من logs:
tail -f storage/logs/laravel.log

# تأكد من الصلاحيات:
chmod -R 755 storage/
```

### 2. خطأ Database:
```bash
# تحقق من معلومات قاعدة البيانات في .env
# تأكد من إنشاء الجداول:
php artisan migrate --force
```

### 3. خطأ CORS:
```bash
# تحقق من إعدادات CORS في config/cors.php
# تأكد من إضافة domain الـ frontend
```

### 4. خطأ JWT:
```bash
# أعد إنشاء JWT secret:
php artisan jwt:secret --force
```

## ملاحظات مهمة:

1. **الأمان**: غير APP_DEBUG إلى false في الإنتاج
2. **الأداء**: استخدم cache للـ config والـ routes:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```
3. **النسخ الاحتياطية**: اعمل backup دوري لقاعدة البيانات
4. **المراقبة**: راقب logs الأخطاء بانتظام

## روابط مفيدة:
- Laravel Deployment: https://laravel.com/docs/deployment
- Next.js Deployment: https://nextjs.org/docs/deployment
- aPanel Documentation: [رابط وثائق aPanel]