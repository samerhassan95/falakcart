# خطوات إعداد السيرفر لـ togaar.com

## المشكلة الحالية
- الموقع يظهر "Internal Server Error"
- ملف .env يستخدم إعدادات التطوير المحلي
- قاعدة البيانات غير مضبوطة بشكل صحيح

## الحلول المطلوبة

### 1. إصلاح ملف .env

```bash
# الانتقال إلى مجلد Backend
cd /www/wwwroot/togaar.com/falakcart/backend

# نسخ ملف الإنتاج
cp .env.production .env

# تعديل ملف .env حسب إعدادات السيرفر
nano .env
```

**إعدادات مهمة يجب تغييرها:**
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://togaar.com

# إذا كنت تستخدم MySQL
DB_CONNECTION=mysql
DB_DATABASE=togaar_falakcart
DB_USERNAME=togaar_user
DB_PASSWORD=كلمة_المرور_الخاصة_بك

# إذا كنت تستخدم SQLite (أسهل للبداية)
DB_CONNECTION=sqlite
```

### 2. إنشاء قاعدة البيانات

**خيار أ: MySQL (الأفضل للإنتاج)**
```sql
-- في aaPanel → Database → Add Database
CREATE DATABASE togaar_falakcart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'togaar_user'@'localhost' IDENTIFIED BY 'كلمة_مرور_قوية';
GRANT ALL PRIVILEGES ON togaar_falakcart.* TO 'togaar_user'@'localhost';
FLUSH PRIVILEGES;
```

**خيار ب: SQLite (أسرع للإعداد)**
```bash
cd /www/wwwroot/togaar.com/falakcart/backend
touch database/database.sqlite
chmod 664 database/database.sqlite
```

### 3. تشغيل أوامر Laravel

```bash
cd /www/wwwroot/togaar.com/falakcart/backend

# توليد مفتاح التطبيق
php artisan key:generate --force

# تشغيل migrations
php artisan migrate --force

# مسح وتخزين التكوينات
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache
php artisan view:clear
php artisan view:cache
```

### 4. إصلاح الصلاحيات

```bash
cd /www/wwwroot/togaar.com/falakcart/backend

# إعطاء صلاحيات الكتابة
chmod -R 775 storage bootstrap/cache

# تغيير المالك (إذا كان متاح)
chown -R www-data:www-data storage bootstrap/cache
```

### 5. التحقق من إعدادات aaPanel

**في aaPanel:**
1. اذهب إلى Website → togaar.com
2. تأكد من:
   - **Document Root**: `/www/wwwroot/togaar.com/falakcart`
   - **PHP Version**: 8.1 أو أحدث
   - **SSL**: مفعل

### 6. اختبار الإعداد

```bash
# اختبار Laravel
cd /www/wwwroot/togaar.com/falakcart/backend
php artisan tinker --execute="echo 'Laravel works!'; exit;"

# اختبار قاعدة البيانات
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database OK'; exit;"
```

### 7. بناء Frontend

```bash
cd /www/wwwroot/togaar.com/falakcart/frontend

# تثبيت dependencies إذا لم تكن موجودة
npm install

# بناء التطبيق
npm run build
```

## سكريبت سريع للإصلاح

```bash
# تشغيل سكريبت الإصلاح السريع
cd /www/wwwroot/togaar.com/falakcart
bash fix-server-issues.sh
```

## اختبار النتيجة

بعد تطبيق الخطوات:

1. **اختبار الموقع**: https://togaar.com
2. **اختبار API**: https://togaar.com/api/health
3. **اختبار Admin**: https://togaar.com/admin

## استكشاف الأخطاء

إذا استمرت المشاكل:

```bash
# عرض logs Laravel
tail -f /www/wwwroot/togaar.com/falakcart/backend/storage/logs/laravel.log

# عرض logs Apache
tail -f /var/log/apache2/error.log

# اختبار PHP
php -v
php -m | grep -i mysql  # للتحقق من MySQL extension
```

## ملاحظات مهمة

1. **تأكد من أن PHP Extensions مثبتة:**
   - php-mysql (إذا كنت تستخدم MySQL)
   - php-sqlite3 (إذا كنت تستخدم SQLite)
   - php-mbstring
   - php-xml
   - php-curl

2. **تأكد من أن .htaccess يعمل:**
   - Apache mod_rewrite مفعل
   - AllowOverride All في إعدادات Apache

3. **للأمان:**
   - غير كلمات المرور الافتراضية
   - استخدم HTTPS
   - فعل Firewall