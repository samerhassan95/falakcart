#!/bin/bash

# Quick Setup Script for FalakCart on togaar.com
# تشغيل هذا السكريبت من مجلد backend الحالي

set -e

# ألوان للـ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# متغيرات المشروع
CURRENT_DIR=$(pwd)
PROJECT_ROOT="/www/wwwroot/togaar.com/falakcart"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DOMAIN="togaar.com"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  FalakCart Quick Setup for togaar.com${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

print_status "المجلد الحالي: $CURRENT_DIR"
print_status "مجلد المشروع: $PROJECT_ROOT"

# التحقق من أننا في المجلد الصحيح
if [[ "$CURRENT_DIR" != "$BACKEND_DIR" ]]; then
    print_warning "نحن لسنا في مجلد Backend المتوقع"
    print_status "الانتقال إلى $BACKEND_DIR"
    cd $BACKEND_DIR
fi

# 1. إعداد قاعدة البيانات
setup_database() {
    print_status "إعداد قاعدة البيانات..."
    
    echo "سنحتاج إلى إنشاء قاعدة بيانات جديدة"
    read -p "أدخل كلمة مرور MySQL root: " -s MYSQL_ROOT_PASSWORD
    echo ""
    read -p "أدخل كلمة مرور قاعدة البيانات الجديدة: " -s DB_PASSWORD
    echo ""
    
    DB_NAME="togaar_falakcart"
    DB_USER="togaar_user"
    
    # إنشاء قاعدة البيانات
    mysql -u root -p$MYSQL_ROOT_PASSWORD << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    print_success "تم إنشاء قاعدة البيانات: $DB_NAME"
    
    # حفظ كلمة المرور للاستخدام لاحقاً
    export DB_PASSWORD
    export DB_NAME
    export DB_USER
}

# 2. إعداد Backend
setup_backend() {
    print_status "إعداد Backend (Laravel)..."
    
    cd $BACKEND_DIR
    
    # التحقق من وجود Composer
    if ! command -v composer &> /dev/null; then
        print_status "تثبيت Composer..."
        curl -sS https://getcomposer.org/installer | php
        mv composer.phar /usr/local/bin/composer
        chmod +x /usr/local/bin/composer
    fi
    
    # تثبيت dependencies
    print_status "تثبيت Composer dependencies..."
    composer install --optimize-autoloader --no-dev
    
    # إنشاء ملف .env
    if [ ! -f ".env" ]; then
        print_status "إنشاء ملف .env..."
        cp .env.example .env
        
        # تعديل ملف .env
        sed -i "s/APP_ENV=local/APP_ENV=production/" .env
        sed -i "s/APP_DEBUG=true/APP_DEBUG=false/" .env
        sed -i "s|APP_URL=http://localhost|APP_URL=https://$DOMAIN|" .env
        sed -i "s/DB_DATABASE=laravel/DB_DATABASE=$DB_NAME/" .env
        sed -i "s/DB_USERNAME=root/DB_USERNAME=$DB_USER/" .env
        sed -i "s/DB_PASSWORD=/DB_PASSWORD=$DB_PASSWORD/" .env
        sed -i "s/LOG_LEVEL=debug/LOG_LEVEL=error/" .env
        
        print_success "تم إنشاء ملف .env"
    else
        print_warning "ملف .env موجود بالفعل"
    fi
    
    # توليد مفاتيح التطبيق
    print_status "توليد مفاتيح التطبيق..."
    php artisan key:generate --force
    php artisan jwt:secret --force
    
    # تشغيل migrations
    print_status "تشغيل database migrations..."
    php artisan migrate --force
    
    # تشغيل seeders
    print_status "تشغيل database seeders..."
    php artisan db:seed --force
    
    # تحسين الأداء
    print_status "تحسين الأداء..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    
    print_success "تم إعداد Backend"
}

# 3. إعداد Frontend
setup_frontend() {
    print_status "إعداد Frontend (Next.js)..."
    
    cd $FRONTEND_DIR
    
    # التحقق من Node.js
    if ! command -v node &> /dev/null; then
        print_status "تثبيت Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    # تثبيت dependencies
    print_status "تثبيت npm dependencies..."
    npm ci --only=production
    
    # إنشاء ملف البيئة
    print_status "إنشاء ملف البيئة..."
    cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NODE_ENV=production
EOF
    
    cp .env.production .env.local
    
    # بناء التطبيق
    print_status "بناء Next.js application..."
    npm run build
    
    # تثبيت PM2
    if ! command -v pm2 &> /dev/null; then
        print_status "تثبيت PM2..."
        npm install -g pm2
    fi
    
    # إنشاء ملف PM2 config
    print_status "إنشاء PM2 config..."
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'togaar-falakcart',
    script: 'npm',
    args: 'start',
    cwd: '$FRONTEND_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'https://$DOMAIN/api',
      NEXT_PUBLIC_APP_URL: 'https://$DOMAIN'
    }
  }]
};
EOF
    
    # تشغيل PM2
    print_status "تشغيل PM2..."
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    print_success "تم إعداد Frontend"
}

# 4. إعداد الصلاحيات
setup_permissions() {
    print_status "إعداد الصلاحيات..."
    
    chown -R www-data:www-data $BACKEND_DIR
    chmod -R 755 $BACKEND_DIR
    chmod -R 775 $BACKEND_DIR/storage
    chmod -R 775 $BACKEND_DIR/bootstrap/cache
    
    print_success "تم إعداد الصلاحيات"
}

# 5. إنشاء Apache Virtual Host config
create_apache_config() {
    print_status "إنشاء Apache Virtual Host config..."
    
    cat > $PROJECT_ROOT/apache-vhost.conf << EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    DocumentRoot $BACKEND_DIR/public
    
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    DocumentRoot $BACKEND_DIR/public
    
    SSLEngine on
    
    <Directory "$BACKEND_DIR/public">
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^ index.php [L]
    </Directory>
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    
    # API routes go to Laravel
    <LocationMatch "^/api/">
        # Laravel handles these
    </LocationMatch>
    
    # Proxy other routes to Next.js
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass /api/ !
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    
    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:3000/\$1" [P,L]
</VirtualHost>
EOF
    
    print_success "تم إنشاء Apache config: $PROJECT_ROOT/apache-vhost.conf"
}

# 6. إنشاء webhook
create_webhook() {
    print_status "إنشاء GitHub webhook..."
    
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    
    cat > $BACKEND_DIR/public/webhook.php << EOF
<?php
\$secret = '$WEBHOOK_SECRET';
\$project_dir = '$PROJECT_ROOT';

function log_message(\$message) {
    \$log_file = \$GLOBALS['project_dir'] . '/webhook.log';
    \$timestamp = date('Y-m-d H:i:s');
    file_put_contents(\$log_file, "[\$timestamp] \$message" . PHP_EOL, FILE_APPEND | LOCK_EX);
}

\$payload = file_get_contents('php://input');
\$signature = \$_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

if (!hash_equals('sha256=' . hash_hmac('sha256', \$payload, \$secret), \$signature)) {
    http_response_code(403);
    log_message('Webhook: Invalid signature');
    exit('Forbidden');
}

\$data = json_decode(\$payload, true);

if (\$data['ref'] === 'refs/heads/main') {
    log_message('Webhook: Deployment started for main branch');
    
    // تشغيل سكريبت التحديث
    \$update_script = \$project_dir . '/update.sh';
    if (file_exists(\$update_script)) {
        shell_exec("bash \$update_script > /tmp/deploy.log 2>&1 &");
        log_message('Webhook: Update script executed');
        echo 'Deployment started';
    } else {
        log_message('Webhook: Update script not found');
        echo 'Update script not found';
    }
} else {
    log_message('Webhook: Not main branch, skipping deployment');
    echo 'Not main branch, skipping deployment';
}
?>
EOF
    
    print_success "تم إنشاء webhook"
    print_warning "Webhook URL: https://$DOMAIN/webhook.php"
    print_warning "Webhook Secret: $WEBHOOK_SECRET"
}

# 7. إنشاء سكريبت التحديث
create_update_script() {
    print_status "إنشاء سكريبت التحديث..."
    
    cat > $PROJECT_ROOT/update.sh << EOF
#!/bin/bash

PROJECT_ROOT="$PROJECT_ROOT"
BACKEND_DIR="$BACKEND_DIR"
FRONTEND_DIR="$FRONTEND_DIR"

echo "Starting update for togaar.com..."

cd \$PROJECT_ROOT
git pull origin main

echo "Updating Backend..."
cd \$BACKEND_DIR
composer install --optimize-autoloader --no-dev --no-interaction
php artisan migrate --force
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache
php artisan view:clear
php artisan view:cache

echo "Updating Frontend..."
cd \$FRONTEND_DIR
npm ci --only=production
npm run build
pm2 restart togaar-falakcart

echo "Update completed successfully!"
EOF
    
    chmod +x $PROJECT_ROOT/update.sh
    print_success "تم إنشاء سكريپت التحديث"
}

# 8. اختبار الإعداد
test_setup() {
    print_status "اختبار الإعداد..."
    
    # اختبار Backend
    cd $BACKEND_DIR
    if php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database OK';" 2>/dev/null; then
        print_success "Backend يعمل بشكل صحيح"
    else
        print_warning "قد تكون هناك مشكلة في Backend"
    fi
    
    # اختبار PM2
    if pm2 list | grep -q "togaar-falakcart"; then
        print_success "PM2 يعمل بشكل صحيح"
    else
        print_warning "PM2 قد لا يعمل بشكل صحيح"
    fi
}

# عرض معلومات الإعداد
show_info() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  تم الإعداد بنجاح!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}معلومات المشروع:${NC}"
    echo -e "- مجلد المشروع: $PROJECT_ROOT"
    echo -e "- النطاق: https://$DOMAIN"
    echo -e "- API: https://$DOMAIN/api"
    echo -e "- Webhook: https://$DOMAIN/webhook.php"
    echo ""
    echo -e "${BLUE}الخطوات التالية:${NC}"
    echo -e "1. في aaPanel، أنشئ موقع جديد لـ $DOMAIN"
    echo -e "2. اجعل Document Root يشير إلى: $BACKEND_DIR/public"
    echo -e "3. استخدم محتوى $PROJECT_ROOT/apache-vhost.conf في إعدادات Apache"
    echo -e "4. فعّل SSL certificate"
    echo -e "5. أضف GitHub webhook: https://$DOMAIN/webhook.php"
    echo ""
    echo -e "${BLUE}أوامر مفيدة:${NC}"
    echo -e "- مراقبة Frontend: ${YELLOW}pm2 logs togaar-falakcart${NC}"
    echo -e "- مراقبة Backend: ${YELLOW}tail -f $BACKEND_DIR/storage/logs/laravel.log${NC}"
    echo -e "- تحديث المشروع: ${YELLOW}$PROJECT_ROOT/update.sh${NC}"
    echo ""
}

# تشغيل الإعداد
main() {
    setup_database
    setup_backend
    setup_frontend
    setup_permissions
    create_apache_config
    create_webhook
    create_update_script
    test_setup
    show_info
}

# تشغيل السكريپت
main "$@"