# ✅ Deployment Checklist - نظام Affiliate

## قبل النشر على Production

### 🔧 الإعدادات الأساسية

#### Backend (.env)
```bash
- [ ] APP_ENV=production
- [ ] APP_DEBUG=false
- [ ] APP_URL=https://your-actual-domain.com
- [ ] FALAKCART_MAIN_URL=https://falakcart.com
- [ ] DB_CONNECTION=mysql (ليس sqlite)
- [ ] DB_HOST=your-db-host
- [ ] DB_DATABASE=your-db-name
- [ ] DB_USERNAME=your-db-user
- [ ] DB_PASSWORD=strong-password
- [ ] WEBHOOK_SECRET=generate-strong-secret
- [ ] JWT_SECRET=generate-strong-secret
```

#### Frontend (.env.local)
```bash
- [ ] NEXT_PUBLIC_API_URL=https://your-actual-domain.com/api
- [ ] NODE_ENV=production
```

---

### 🗄️ قاعدة البيانات

```bash
# 1. إنشاء قاعدة بيانات جديدة
- [ ] إنشاء database على السيرفر
- [ ] تحديث بيانات الاتصال في .env

# 2. تشغيل Migrations
cd backend
php artisan migrate --force

# 3. إنشاء Admin User
php artisan db:seed --class=AdminSeeder

# 4. التحقق من البيانات
php artisan tinker
>>> User::count()
>>> Affiliate::count()
```

---

### 🔒 الأمان

```bash
# 1. تحديث Secrets
- [ ] توليد APP_KEY جديد: php artisan key:generate
- [ ] توليد JWT_SECRET جديد: php artisan jwt:secret
- [ ] توليد WEBHOOK_SECRET قوي (32+ حرف)

# 2. CORS Settings
- [ ] تحديث allowed_origins في config/cors.php
- [ ] إزالة localhost من القائمة

# 3. Rate Limiting
- [ ] تفعيل rate limiting على API routes
- [ ] تحديد حدود مناسبة (60 requests/minute)

# 4. SSL Certificate
- [ ] تثبيت SSL على الدومين
- [ ] التأكد من HTTPS يعمل
- [ ] إعادة توجيه HTTP إلى HTTPS
```

---

### 📦 Build & Deploy

#### Backend (Laravel)

```bash
# 1. تحديث Dependencies
composer install --optimize-autoloader --no-dev

# 2. Cache Configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 3. تحسين Autoloader
composer dump-autoload --optimize

# 4. Storage Permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# 5. Symbolic Link للـ Storage
php artisan storage:link
```

#### Frontend (Next.js)

```bash
# 1. Build Production
cd frontend
npm run build

# 2. اختبار Build محلياً
npm run start

# 3. Deploy
# - Vercel: vercel --prod
# - أو رفع مجلد .next على السيرفر
```

---

### 🌐 Server Configuration

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Laravel Public Directory
    RewriteCond %{REQUEST_URI} !^/public/
    RewriteRule ^(.*)$ /public/$1 [L]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    root /var/www/affiliate/backend/public;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

---

### 📊 Monitoring & Logging

```bash
# 1. إعداد Log Rotation
- [ ] تفعيل daily logs في config/logging.php
- [ ] تحديد مدة الاحتفاظ بالـ logs (14 يوم)

# 2. Error Tracking
- [ ] تثبيت Sentry أو Bugsnag (اختياري)
- [ ] إعداد Email Notifications للأخطاء الحرجة

# 3. Performance Monitoring
- [ ] تفعيل Query Logging (للتطوير فقط)
- [ ] مراقبة استخدام الذاكرة
- [ ] مراقبة وقت الاستجابة
```

---

### 🧪 الاختبار النهائي

#### 1. اختبار Backend API

```bash
# Health Check
curl https://your-domain.com/api/health

# Test Authentication
curl -X POST https://your-domain.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@falakcart.com","password":"password"}'

# Test Tracking
curl -X POST https://your-domain.com/api/track/click \
  -H "Content-Type: application/json" \
  -d '{"referral_code":"TEST123"}'
```

#### 2. اختبار Frontend

```bash
- [ ] تسجيل دخول Admin
- [ ] تسجيل دخول Affiliate
- [ ] إنشاء لينك جديد
- [ ] نسخ لينك affiliate
- [ ] عرض الإحصائيات
- [ ] تحديث الإعدادات
```

#### 3. اختبار التكامل مع FalakCart

```bash
- [ ] فتح لينك: https://falakcart.com/register?ref=TEST123
- [ ] التحقق من تسجيل Click
- [ ] إتمام عملية اشتراك تجريبية
- [ ] التحقق من تسجيل Sale
- [ ] التحقق من حساب العمولة
```

---

### 📧 Email Configuration

```bash
# في .env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"

# اختبار Email
php artisan tinker
>>> Mail::raw('Test email', function($msg) { $msg->to('test@example.com'); });
```

---

### 🔄 Backup Strategy

```bash
# 1. Database Backup (يومي)
- [ ] إعداد Cron Job للـ backup
- [ ] حفظ Backups على سيرفر منفصل
- [ ] الاحتفاظ بـ 30 يوم من Backups

# Cron Job Example:
0 2 * * * cd /var/www/affiliate/backend && php artisan backup:run

# 2. Files Backup (أسبوعي)
- [ ] backup مجلد storage/app
- [ ] backup ملفات .env
- [ ] backup قاعدة البيانات
```

---

### 🚀 Performance Optimization

```bash
# 1. PHP Optimization
- [ ] تفعيل OPcache
- [ ] زيادة memory_limit إلى 256M
- [ ] تفعيل Gzip compression

# 2. Database Optimization
- [ ] إضافة Indexes على الجداول المهمة
- [ ] تفعيل Query Cache
- [ ] تحسين slow queries

# 3. Frontend Optimization
- [ ] تفعيل Image Optimization
- [ ] استخدام CDN للـ static files
- [ ] تفعيل Browser Caching
```

---

### 📱 Post-Deployment

```bash
# بعد النشر مباشرة:
- [ ] اختبار كل الصفحات
- [ ] التحقق من الـ Logs
- [ ] مراقبة الأداء لأول 24 ساعة
- [ ] إرسال إشعار للفريق بنجاح النشر

# خلال أول أسبوع:
- [ ] مراجعة Error Logs يومياً
- [ ] مراقبة استخدام الموارد
- [ ] جمع Feedback من المستخدمين
- [ ] تحسين أي مشاكل في الأداء
```

---

### 🆘 Rollback Plan

```bash
# في حالة وجود مشكلة حرجة:

# 1. استعادة Database
mysql -u username -p database_name < backup.sql

# 2. استعادة الكود
git checkout previous-stable-tag
composer install
php artisan migrate:rollback

# 3. مسح Cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 4. إعادة تشغيل Services
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
```

---

### 📞 Contact Information

```bash
# معلومات الطوارئ
- [ ] رقم هاتف مدير النظام
- [ ] بريد إلكتروني للدعم الفني
- [ ] رابط Documentation
- [ ] معلومات الوصول للسيرفر
```

---

## ✅ Final Checklist

قبل ما تقول "النظام جاهز":

- [ ] كل الـ Environment Variables محدثة
- [ ] Database Migrations شغالة
- [ ] Admin User موجود ويعمل
- [ ] SSL Certificate مثبت
- [ ] CORS Settings صحيحة
- [ ] Rate Limiting مفعّل
- [ ] Logs شغالة
- [ ] Backups مجدولة
- [ ] Email Configuration شغالة
- [ ] كل الاختبارات نجحت
- [ ] Performance مقبول
- [ ] Documentation محدثة
- [ ] الفريق متدرب على النظام

---

**🎉 مبروك! نظامك جاهز للإنتاج!**

**ملاحظة:** احتفظ بهذا الملف كمرجع لأي deployment مستقبلي.
