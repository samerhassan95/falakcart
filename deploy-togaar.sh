#!/bin/bash

# FalakCart Deployment Script for togaar.com
# تشغيل هذا السكريبت على السيرفر لنشر المشروع

set -e

# ألوان للـ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# متغيرات المشروع
DOMAIN="togaar.com"
PROJECT_DIR="/www/wwwroot/togaar.com"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DB_NAME="togaar_falakcart"
DB_USER="togaar_user"

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

# التحقق من أننا في المجلد الصحيح
check_directory() {
    if [ "$PWD" != "$PROJECT_DIR" ]; then
        print_error "يجب تشغيل هذا السكريبت من $PROJECT_DIR"
        print_status "الانتقال إلى المجلد الصحيح..."
        cd $PROJECT_DIR
    fi
    print_success "نحن في المجلد الصحيح: $PWD"
}

# التحقق من المتطلبات
check_requirements() {
    print_status "التحقق من المتطلبات..."
    
    # التحقق من Git
    if ! command -v git &> /dev/null; then
        print_error "Git غير مثبت"
        exit 1
    fi
    
    # التحقق من PHP
    if ! command -v php &> /dev/null; then
        print_error "PHP غير مثبت"
        exit 1
    fi
    
    # التحقق من Composer
    if ! command -v composer &> /dev/null; then
        print_error "Composer غير مثبت"
        print_status "تثبيت Composer..."
        curl -sS https://getcomposer.org/installer | php
        mv composer.phar /usr/local/bin/composer
        chmod +x /usr/local/bin/composer
    fi
    
    # التحقق من Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js غير مثبت"
        print_status "تثبيت Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    # التحقق من PM2
    if ! command -v pm2 &> /dev/null; then
        print_status "تثبيت PM2..."
        npm install -g pm2
    fi
    
    print_success "جميع المتطلبات متوفرة"
}

# استنساخ المشروع من GitHub
clone_project() {
    print_status "استنساخ المشروع من GitHub..."
    
    if [ ! -d ".git" ]; then
        print_status "استنساخ المشروع للمرة الأولى..."
        git clone https://github.com/samerhassan95/falakcart.git temp
        mv temp/* . 2>/dev/null || true
        mv temp/.* . 2>/dev/null || true
        rmdir temp 2>/dev/null || true
        print_success "تم استنساخ المشروع"
    else
        print_status "سحب آخر التحديثات..."
        git pull origin main
        print_success "تم سحب آخر التحديثات"
    fi
}

# إعداد قاعدة البيانات
setup_database() {
    print_status "إعداد قاعدة البيانات..."
    
    # طلب كلمة مرور MySQL root
    read -s -p "أدخل كلمة مرور MySQL root: " MYSQL_ROOT_PASSWORD
    echo ""
    
    # طلب كلمة مرور للمستخدم الجديد
    read -s -p "أدخل كلمة مرور قاعدة البيانات الجديدة: " DB_PASSWORD
    echo ""
    
    # إنشاء قاعدة البيانات والمستخدم
    mysql -u root -p$MYSQL_ROOT_PASSWORD << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    print_success "تم إعداد قاعدة البيانات"
    
    # حفظ كلمة المرور للاستخدام لاحقاً
    export DB_PASSWORD
}

# إعداد Backend
setup_backend() {
    print_status "إعداد Backend (Laravel)..."
    
    cd $BACKEND_DIR
    
    # تثبيت dependencies
    print_status "تثبيت Composer dependencies..."
    composer install --optimize-autoloader --no-dev --no-interaction
    
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
    php artisan event:cache
    
    print_success "تم إعداد Backend"
}

# إعداد Frontend
setup_frontend() {
    print_status "إعداد Frontend (Next.js)..."
    
    cd $FRONTEND_DIR
    
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
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF
    
    # إنشاء مجلد logs
    mkdir -p logs
    
    # تشغيل PM2
    print_status "تشغيل PM2..."
    pm2 start ecosystem.config.js
    pm2 save
    
    print_success "تم إعداد Frontend"
}

# إعداد الصلاحيات
setup_permissions() {
    print_status "إعداد الصلاحيات..."
    
    # صلاحيات Laravel
    chown -R www-data:www-data $BACKEND_DIR
    chmod -R 755 $BACKEND_DIR
    chmod -R 775 $BACKEND_DIR/storage
    chmod -R 775 $BACKEND_DIR/bootstrap/cache
    
    print_success "تم إعداد الصلاحيات"
}

# إنشاء webhook
create_webhook() {
    print_status "إنشاء GitHub webhook..."
    
    # توليد webhook secret
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    
    cat > $BACKEND_DIR/public/webhook.php << EOF
<?php
\$secret = '$WEBHOOK_SECRET';
\$project_dir = '$PROJECT_DIR';

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
    \$deploy_script = \$project_dir . '/deploy-togaar.sh';
    if (file_exists(\$deploy_script)) {
        shell_exec("bash \$deploy_script > /tmp/deploy.log 2>&1 &");
        log_message('Webhook: Deployment script executed');
        echo 'Deployment started';
    } else {
        log_message('Webhook: Deploy script not found');
        echo 'Deploy script not found';
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
    echo ""
    print_warning "احفظ هذا السر لاستخدامه في GitHub webhook settings"
}

# إنشاء سكريبت التحديث
create_update_script() {
    print_status "إنشاء سكريبت التحديث..."
    
    cat > $PROJECT_DIR/update.sh << 'EOF'
#!/bin/bash

PROJECT_DIR="/www/wwwroot/togaar.com"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "Starting update for togaar.com..."

cd $PROJECT_DIR
git pull origin main

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

echo "Updating Frontend..."
cd $FRONTEND_DIR
npm ci --only=production
npm run build
pm2 restart togaar-falakcart

echo "Update completed successfully!"
EOF
    
    chmod +x $PROJECT_DIR/update.sh
    
    print_success "تم إنشاء سكريپت التحديث: $PROJECT_DIR/update.sh"
}

# اختبار النشر
test_deployment() {
    print_status "اختبار النشر..."
    
    # اختبار Backend
    print_status "اختبار Backend..."
    cd $BACKEND_DIR
    if php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database OK';" 2>/dev/null; then
        print_success "Backend يعمل بشكل صحيح"
    else
        print_warning "قد تكون هناك مشكلة في Backend"
    fi
    
    # اختبار PM2
    print_status "اختبار PM2..."
    if pm2 list | grep -q "togaar-falakcart"; then
        print_success "PM2 يعمل بشكل صحيح"
    else
        print_warning "PM2 قد لا يعمل بشكل صحيح"
    fi
}

# عرض معلومات النشر
show_deployment_info() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  تم النشر بنجاح على togaar.com!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}معلومات المشروع:${NC}"
    echo -e "- النطاق: https://$DOMAIN"
    echo -e "- API: https://$DOMAIN/api"
    echo -e "- Admin: https://$DOMAIN/admin"
    echo -e "- Webhook: https://$DOMAIN/webhook.php"
    echo ""
    echo -e "${BLUE}أوامر مفيدة:${NC}"
    echo -e "- مراقبة Frontend: ${YELLOW}pm2 logs togaar-falakcart${NC}"
    echo -e "- مراقبة Backend: ${YELLOW}tail -f $BACKEND_DIR/storage/logs/laravel.log${NC}"
    echo -e "- إعادة تشغيل Frontend: ${YELLOW}pm2 restart togaar-falakcart${NC}"
    echo -e "- تحديث المشروع: ${YELLOW}$PROJECT_DIR/update.sh${NC}"
    echo ""
    echo -e "${BLUE}الخطوات التالية:${NC}"
    echo -e "1. إعداد SSL certificate في aaPanel"
    echo -e "2. إعداد Virtual Host في aaPanel"
    echo -e "3. إعداد GitHub webhook"
    echo ""
}

# الدالة الرئيسية
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  FalakCart Deployment for togaar.com${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    check_directory
    check_requirements
    clone_project
    setup_database
    setup_backend
    setup_frontend
    setup_permissions
    create_webhook
    create_update_script
    test_deployment
    show_deployment_info
}

# تشغيل السكريپت
main "$@"