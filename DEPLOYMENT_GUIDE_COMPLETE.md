# دليل النشر الشامل - FalakCart Affiliate System

## نظرة عامة
هذا الدليل يوضح كيفية نشر نظام الشركاء FalakCart على خادم واحد باستخدام aaPanel مع Laravel (Backend) و Next.js (Frontend).

## متطلبات السيرفر

### المتطلبات الأساسية:
- **PHP**: 8.1 أو أحدث
- **Node.js**: 18.x أو أحدث  
- **MySQL**: 8.0 أو أحدث
- **Composer**: أحدث إصدار
- **Git**: مثبت على السيرفر

### إعدادات aaPanel المطلوبة:
- Apache/Nginx
- PHP Manager
- MySQL Manager
- File Manager
- Terminal

## خطوات النشر

### 1. إعداد قاعدة البيانات

```sql
-- إنشاء قاعدة البيانات
CREATE DATABASE falakcart_affiliate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- إنشاء مستخدم قاعدة البيانات
CREATE USER 'falakcart_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON falakcart_affiliate.* TO 'falakcart_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. استنساخ المشروع من GitHub

```bash
# الانتقال إلى مجلد الموقع
cd /www/wwwroot/yourdomain.com

# استنساخ المشروع
git clone https://github.com/samerhassan95/falakcart.git .

# أو إذا كان المجلد غير فارغ
git clone https://github.com/samerhassan95/falakcart.git temp
mv temp/* .
mv temp/.* . 2>/dev/null || true
rmdir temp
```

### 3. إعداد Backend (Laravel)

```bash
# الانتقال إلى مجلد Backend
cd /www/wwwroot/yourdomain.com/backend

# تثبيت dependencies
composer install --optimize-autoloader --no-dev

# نسخ ملف البيئة
cp .env.example .env

# تعديل ملف .env
nano .env
```

#### إعدادات .env للإنتاج:

```env
APP_NAME="FalakCart Affiliate System"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://yourdomain.com

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=falakcart_affiliate
DB_USERNAME=falakcart_user
DB_PASSWORD=your_secure_password

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"

JWT_SECRET=
JWT_ALGO=HS256
```

```bash
# توليد مفتاح التطبيق
php artisan key:generate

# توليد JWT secret
php artisan jwt:secret

# تشغيل migrations
php artisan migrate --force

# تشغيل seeders
php artisan db:seed --force

# تحسين الأداء
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# إعداد الصلاحيات
chown -R www-data:www-data /www/wwwroot/yourdomain.com/backend
chmod -R 755 /www/wwwroot/yourdomain.com/backend
chmod -R 775 /www/wwwroot/yourdomain.com/backend/storage
chmod -R 775 /www/wwwroot/yourdomain.com/backend/bootstrap/cache
```

### 4. إعداد Frontend (Next.js)

```bash
# الانتقال إلى مجلد Frontend
cd /www/wwwroot/yourdomain.com/frontend

# تثبيت dependencies
npm ci --only=production

# إنشاء ملف البيئة للإنتاج
nano .env.production
```

#### إعدادات .env.production:

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

```bash
# بناء التطبيق
npm run build

# تثبيت PM2 لإدارة العمليات
npm install -g pm2

# إنشاء ملف PM2 config
nano ecosystem.config.js
```

#### ملف ecosystem.config.js:

```javascript
module.exports = {
  apps: [{
    name: 'falakcart-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/yourdomain.com/frontend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

```bash
# تشغيل التطبيق مع PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. إعداد Web Server (Apache/Nginx)

#### إعداد Apache:

إنشاء Virtual Host في aaPanel:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /www/wwwroot/yourdomain.com/backend/public
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /www/wwwroot/yourdomain.com/backend/public
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    # Laravel Backend (API routes)
    <Directory "/www/wwwroot/yourdomain.com/backend/public">
        AllowOverride All
        Require all granted
        
        # Laravel .htaccess rules
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^ index.php [L]
    </Directory>
    
    # Proxy Next.js Frontend
    ProxyPreserveHost On
    ProxyRequests Off
    
    # API routes go to Laravel
    ProxyPass /api/ http://127.0.0.1:80/api/
    ProxyPassReverse /api/ http://127.0.0.1:80/api/
    
    # All other routes go to Next.js
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    
    # WebSocket support for Next.js dev
    ProxyPass /_next/webpack-hmr ws://127.0.0.1:3000/_next/webpack-hmr
    ProxyPassReverse /_next/webpack-hmr ws://127.0.0.1:3000/_next/webpack-hmr
</VirtualHost>
```

#### إعداد Nginx (البديل):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # API routes go to Laravel
    location /api/ {
        root /www/wwwroot/yourdomain.com/backend/public;
        try_files $uri $uri/ /index.php?$query_string;
        
        location ~ \.php$ {
            fastcgi_pass unix:/tmp/php-cgi-81.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }
    
    # All other routes go to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. إعداد SSL Certificate

```bash
# تثبيت Certbot
sudo apt update
sudo apt install certbot python3-certbot-apache

# الحصول على شهادة SSL
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com

# أو للـ Nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. إعداد Cron Jobs

```bash
# فتح crontab
crontab -e

# إضافة Laravel scheduler
* * * * * cd /www/wwwroot/yourdomain.com/backend && php artisan schedule:run >> /dev/null 2>&1

# إضافة backup job (اختياري)
0 2 * * * cd /www/wwwroot/yourdomain.com/backend && php artisan backup:run >> /dev/null 2>&1
```

### 8. إعداد Auto-Deployment من GitHub

إنشاء webhook script:

```bash
# إنشاء مجلد للـ scripts
mkdir -p /www/wwwroot/yourdomain.com/scripts

# إنشاء deployment script
nano /www/wwwroot/yourdomain.com/scripts/deploy.sh
```

#### محتوى deploy.sh:

```bash
#!/bin/bash

# متغيرات
PROJECT_DIR="/www/wwwroot/yourdomain.com"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "Starting deployment..."

# الانتقال إلى مجلد المشروع
cd $PROJECT_DIR

# سحب آخر التحديثات
git pull origin main

# تحديث Backend
echo "Updating Backend..."
cd $BACKEND_DIR

# تثبيت/تحديث dependencies
composer install --optimize-autoloader --no-dev

# تشغيل migrations
php artisan migrate --force

# مسح وإعادة بناء cache
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache
php artisan view:clear
php artisan view:cache

# تحديث Frontend
echo "Updating Frontend..."
cd $FRONTEND_DIR

# تثبيت dependencies
npm ci --only=production

# بناء التطبيق
npm run build

# إعادة تشغيل PM2
pm2 restart falakcart-frontend

echo "Deployment completed successfully!"
```

```bash
# جعل الملف قابل للتنفيذ
chmod +x /www/wwwroot/yourdomain.com/scripts/deploy.sh
```

### 9. إعداد GitHub Webhook

إنشاء webhook endpoint:

```bash
nano /www/wwwroot/yourdomain.com/backend/public/webhook.php
```

```php
<?php
// webhook.php
$secret = 'your_webhook_secret'; // نفس السر المستخدم في GitHub

$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

if (!hash_equals('sha256=' . hash_hmac('sha256', $payload, $secret), $signature)) {
    http_response_code(403);
    exit('Forbidden');
}

$data = json_decode($payload, true);

// التحقق من أن الـ push على الـ main branch
if ($data['ref'] === 'refs/heads/main') {
    // تشغيل deployment script
    shell_exec('/www/wwwroot/yourdomain.com/scripts/deploy.sh > /tmp/deploy.log 2>&1 &');
    echo 'Deployment started';
} else {
    echo 'Not main branch, skipping deployment';
}
?>
```

### 10. إعداد Monitoring والـ Logs

```bash
# إعداد log rotation
sudo nano /etc/logrotate.d/falakcart

# محتوى الملف:
/www/wwwroot/yourdomain.com/backend/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 www-data www-data
}

# إعداد monitoring مع PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## اختبار النشر

### 1. اختبار Backend API:
```bash
curl -X GET https://yourdomain.com/api/health
```

### 2. اختبار Frontend:
```bash
curl -X GET https://yourdomain.com/
```

### 3. اختبار Database Connection:
```bash
cd /www/wwwroot/yourdomain.com/backend
php artisan tinker
# في tinker:
DB::connection()->getPdo();
```

## الأمان والحماية

### 1. إعداد Firewall:
```bash
# السماح فقط بالمنافذ المطلوبة
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 2. إخفاء معلومات السيرفر:
```apache
# في Apache config
ServerTokens Prod
ServerSignature Off
```

### 3. إعداد Rate Limiting:
```apache
# في .htaccess
<IfModule mod_evasive24.c>
    DOSHashTableSize    2048
    DOSPageCount        10
    DOSSiteCount        50
    DOSPageInterval     1
    DOSSiteInterval     1
    DOSBlockingPeriod   600
</IfModule>
```

## الصيانة والنسخ الاحتياطي

### 1. النسخ الاحتياطي التلقائي:
```bash
# إنشاء backup script
nano /www/wwwroot/yourdomain.com/scripts/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/falakcart"
DATE=$(date +%Y%m%d_%H%M%S)

# إنشاء مجلد النسخ الاحتياطي
mkdir -p $BACKUP_DIR

# نسخ احتياطي لقاعدة البيانات
mysqldump -u falakcart_user -p'your_secure_password' falakcart_affiliate > $BACKUP_DIR/db_$DATE.sql

# نسخ احتياطي للملفات
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /www/wwwroot/yourdomain.com

# حذف النسخ القديمة (أكثر من 7 أيام)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 2. مراقبة الأداء:
```bash
# تثبيت htop لمراقبة الموارد
sudo apt install htop

# مراقبة PM2
pm2 monit

# مراقبة logs
pm2 logs falakcart-frontend
tail -f /www/wwwroot/yourdomain.com/backend/storage/logs/laravel.log
```

## استكشاف الأخطاء

### مشاكل شائعة وحلولها:

1. **خطأ 500 في Laravel:**
```bash
# التحقق من logs
tail -f /www/wwwroot/yourdomain.com/backend/storage/logs/laravel.log

# التحقق من الصلاحيات
chmod -R 775 /www/wwwroot/yourdomain.com/backend/storage
```

2. **Next.js لا يعمل:**
```bash
# التحقق من PM2 status
pm2 status

# إعادة تشغيل
pm2 restart falakcart-frontend

# التحقق من logs
pm2 logs falakcart-frontend
```

3. **مشاكل قاعدة البيانات:**
```bash
# اختبار الاتصال
cd /www/wwwroot/yourdomain.com/backend
php artisan tinker
# DB::connection()->getPdo();
```

## الخلاصة

هذا الدليل يوفر إعداد شامل لنشر نظام FalakCart على خادم واحد باستخدام:
- **Backend**: Laravel مع Apache/Nginx
- **Frontend**: Next.js مع PM2
- **Database**: MySQL
- **SSL**: Let's Encrypt
- **Auto-deployment**: GitHub Webhooks
- **Monitoring**: PM2 + Logs
- **Backup**: Automated scripts

بعد اتباع هذه الخطوات، ستحصل على نظام مستقر وآمن وقابل للتطوير.