# دليل نشر FalakCart على togaar.com

## معلومات السيرفر
- **النطاق**: togaar.com
- **مسار المشروع**: `/www/wwwroot/togaar.com`
- **المستخدم**: root

## خطوات النشر السريع

### 1. استنساخ المشروع من GitHub

```bash
# أنت الآن في: /www/wwwroot/togaar.com
# استنساخ المشروع
git clone https://github.com/samerhassan95/falakcart.git temp
mv temp/* .
mv temp/.* . 2>/dev/null || true
rmdir temp

# أو إذا كان المجلد فارغ:
git clone https://github.com/samerhassan95/falakcart.git .
```

### 2. إعداد قاعدة البيانات

```bash
# الدخول إلى MySQL
mysql -u root -p

# إنشاء قاعدة البيانات
CREATE DATABASE togaar_falakcart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# إنشاء مستخدم
CREATE USER 'togaar_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON togaar_falakcart.* TO 'togaar_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. إعداد Backend (Laravel)

```bash
# الانتقال إلى مجلد Backend
cd /www/wwwroot/togaar.com/backend

# تثبيت Composer dependencies
composer install --optimize-autoloader --no-dev

# نسخ وتعديل ملف البيئة
cp .env.example .env
nano .env
```

#### إعدادات .env للإنتاج:

```env
APP_NAME="FalakCart Affiliate System"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://togaar.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=togaar_falakcart
DB_USERNAME=togaar_user
DB_PASSWORD=your_secure_password_here

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

JWT_SECRET=
JWT_ALGO=HS256

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@togaar.com"
MAIL_FROM_NAME="${APP_NAME}"
```

```bash
# توليد مفاتيح التطبيق
php artisan key:generate
php artisan jwt:secret

# تشغيل migrations
php artisan migrate --force

# تشغيل seeders
php artisan db:seed --force

# تحسين الأداء
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 4. إعداد Frontend (Next.js)

```bash
# الانتقال إلى مجلد Frontend
cd /www/wwwroot/togaar.com/frontend

# تثبيت Node.js dependencies
npm ci --only=production

# إنشاء ملف البيئة
nano .env.production
```

#### محتوى .env.production:

```env
NEXT_PUBLIC_API_URL=https://togaar.com/api
NEXT_PUBLIC_APP_URL=https://togaar.com
NODE_ENV=production
```

```bash
# بناء التطبيق
npm run build

# تثبيت PM2 إذا لم يكن مثبت
npm install -g pm2

# إنشاء ملف PM2 config
nano ecosystem.config.js
```

#### محتوى ecosystem.config.js:

```javascript
module.exports = {
  apps: [{
    name: 'togaar-falakcart',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/togaar.com/frontend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'https://togaar.com/api',
      NEXT_PUBLIC_APP_URL: 'https://togaar.com'
    }
  }]
};
```

```bash
# تشغيل التطبيق
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. إعداد Apache Virtual Host في aaPanel

**إعداد Document Root:**

في aaPanel:
1. اذهب إلى Website → Site Settings لموقع `togaar.com`
2. تأكد من أن Document Root مضبوط على: `/www/wwwroot/togaar.com/falakcart`
3. **مهم**: Document Root يجب أن يشير إلى مجلد المشروع الرئيسي، ليس إلى backend/public

**ملف .htaccess:**

الملف `.htaccess` موجود في المجلد الرئيسي `/www/wwwroot/togaar.com/falakcart/.htaccess` ويتعامل مع:

- **API Routes** (`/api/*`): يتم توجيهها إلى `backend/public/index.php`
- **Frontend Routes**: يحاول أولاً الاتصال بـ PM2 على المنفذ 3000، وإذا فشل يستخدم الملفات الثابتة من `frontend/out/`

**خيارات التشغيل:**

**الخيار الأول: PM2 + Node.js Server (الأفضل)**
```bash
# تشغيل Frontend كخادم Node.js
cd /www/wwwroot/togaar.com/falakcart/frontend
pm2 start ecosystem.config.js
```

**الخيار الثاني: Static Export (بديل)**
```bash
# إنشاء نسخة ثابتة من Frontend
cd /www/wwwroot/togaar.com/falakcart/frontend
npm run build
# سيتم إنشاء مجلد out/ تلقائياً
```

**إعدادات aaPanel الإضافية:**

في aaPanel → Website → togaar.com → Settings:
- **Document Root**: `/www/wwwroot/togaar.com/falakcart`
- **PHP Version**: 8.1 أو أحدث
- **Enable SSL**: نعم (Let's Encrypt)
- **Force HTTPS**: نعم

### 6. إعداد الصلاحيات

```bash
# إعداد الصلاحيات
chown -R www-data:www-data /www/wwwroot/togaar.com/backend
chmod -R 755 /www/wwwroot/togaar.com/backend
chmod -R 775 /www/wwwroot/togaar.com/backend/storage
chmod -R 775 /www/wwwroot/togaar.com/backend/bootstrap/cache
```

### 7. إعداد SSL Certificate

في aaPanel:
1. اذهب إلى Website → SSL
2. اختر Let's Encrypt
3. أدخل `togaar.com` و `www.togaar.com`
4. اضغط Apply

### 8. إنشاء سكريبت النشر التلقائي

```bash
# إنشاء سكريبت النشر
nano /www/wwwroot/togaar.com/deploy.sh
```

#### محتوى deploy.sh:

```bash
#!/bin/bash

PROJECT_DIR="/www/wwwroot/togaar.com"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "Starting deployment for togaar.com..."

# الانتقال إلى مجلد المشروع
cd $PROJECT_DIR

# سحب آخر التحديثات
git pull origin main

# تحديث Backend
echo "Updating Backend..."
cd $BACKEND_DIR
composer install --optimize-autoloader --no-dev --no-interaction
php artisan migrate --force
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache
php artisan view:clear
php artisan view:cache

# تحديث Frontend
echo "Updating Frontend..."
cd $FRONTEND_DIR
npm ci --only=production
npm run build

# إعادة تشغيل PM2
pm2 restart togaar-falakcart

echo "Deployment completed successfully!"
```

```bash
# جعل السكريبت قابل للتنفيذ
chmod +x /www/wwwroot/togaar.com/deploy.sh
```

### 9. إعداد GitHub Webhook

```bash
# إنشاء webhook handler
nano /www/wwwroot/togaar.com/backend/public/webhook.php
```

```php
<?php
$secret = 'your_webhook_secret_here'; // غير هذا إلى سر قوي

$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

if (!hash_equals('sha256=' . hash_hmac('sha256', $payload, $secret), $signature)) {
    http_response_code(403);
    exit('Forbidden');
}

$data = json_decode($payload, true);

if ($data['ref'] === 'refs/heads/main') {
    shell_exec('/www/wwwroot/togaar.com/deploy.sh > /tmp/deploy.log 2>&1 &');
    echo 'Deployment started';
} else {
    echo 'Not main branch, skipping deployment';
}
?>
```

### 10. اختبار النشر

```bash
# اختبار Backend API
curl -X GET https://togaar.com/api/health

# اختبار Frontend
curl -X GET https://togaar.com/

# التحقق من PM2
pm2 status

# التحقق من logs
pm2 logs togaar-falakcart
tail -f /www/wwwroot/togaar.com/backend/storage/logs/laravel.log
```

## أوامر مفيدة للصيانة

```bash
# إعادة تشغيل Frontend
pm2 restart togaar-falakcart

# مسح Laravel cache
cd /www/wwwroot/togaar.com/backend
php artisan config:clear
php artisan cache:clear

# مراقبة الأداء
pm2 monit

# عرض logs
pm2 logs togaar-falakcart --lines 100

# نسخ احتياطي لقاعدة البيانات
mysqldump -u togaar_user -p togaar_falakcart > backup_$(date +%Y%m%d).sql
```

## إعداد GitHub Webhook في GitHub

1. اذهب إلى repository settings
2. اختر Webhooks
3. اضغط Add webhook
4. أدخل:
   - **Payload URL**: `https://togaar.com/webhook.php`
   - **Content type**: `application/json`
   - **Secret**: نفس السر المستخدم في webhook.php
   - **Events**: Just the push event
5. اضغط Add webhook

## URLs النهائية

- **Frontend**: https://togaar.com
- **Backend API**: https://togaar.com/api
- **Admin Panel**: https://togaar.com/admin
- **Webhook**: https://togaar.com/webhook.php

## استكشاف الأخطاء

### إذا لم يعمل Frontend:
```bash
pm2 restart togaar-falakcart
pm2 logs togaar-falakcart
```

### إذا لم يعمل Backend:
```bash
tail -f /www/wwwroot/togaar.com/backend/storage/logs/laravel.log
chmod -R 775 /www/wwwroot/togaar.com/backend/storage
```

### إذا لم تعمل قاعدة البيانات:
```bash
cd /www/wwwroot/togaar.com/backend
php artisan tinker
# في tinker: DB::connection()->getPdo();
```

هذا الدليل مخصص لنطاق `togaar.com` ويجب أن يعمل بشكل مثالي مع إعدادات aaPanel.