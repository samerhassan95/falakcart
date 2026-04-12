#!/bin/bash

# FalakCart Production Deployment Script
# هذا السكريبت يقوم بنشر المشروع على السيرفر

set -e  # إيقاف السكريبت عند حدوث خطأ

# ألوان للـ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# متغيرات قابلة للتخصيص
PROJECT_DIR="/www/wwwroot/yourdomain.com"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKUP_DIR="/backups/falakcart"
DB_NAME="falakcart_affiliate"
DB_USER="falakcart_user"

# دوال مساعدة
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

# التحقق من وجود المتطلبات
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
        exit 1
    fi
    
    # التحقق من Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js غير مثبت"
        exit 1
    fi
    
    # التحقق من npm
    if ! command -v npm &> /dev/null; then
        print_error "npm غير مثبت"
        exit 1
    fi
    
    print_success "جميع المتطلبات متوفرة"
}

# إنشاء نسخة احتياطية
create_backup() {
    print_status "إنشاء نسخة احتياطية..."
    
    # إنشاء مجلد النسخ الاحتياطي
    mkdir -p $BACKUP_DIR
    
    DATE=$(date +%Y%m%d_%H%M%S)
    
    # نسخ احتياطي لقاعدة البيانات
    if command -v mysqldump &> /dev/null; then
        print_status "نسخ احتياطي لقاعدة البيانات..."
        mysqldump -u $DB_USER -p $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql
        print_success "تم إنشاء نسخة احتياطية لقاعدة البيانات"
    else
        print_warning "mysqldump غير متوفر، تم تخطي نسخ قاعدة البيانات"
    fi
    
    # نسخ احتياطي للملفات المهمة
    if [ -d "$PROJECT_DIR" ]; then
        print_status "نسخ احتياطي للملفات..."
        tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz \
            --exclude='node_modules' \
            --exclude='.next' \
            --exclude='vendor' \
            --exclude='storage/logs' \
            $PROJECT_DIR
        print_success "تم إنشاء نسخة احتياطية للملفات"
    fi
}

# سحب آخر التحديثات من GitHub
pull_updates() {
    print_status "سحب آخر التحديثات من GitHub..."
    
    cd $PROJECT_DIR
    
    # التحقق من وجود تغييرات محلية
    if ! git diff-index --quiet HEAD --; then
        print_warning "يوجد تغييرات محلية، سيتم حفظها..."
        git stash
    fi
    
    # سحب التحديثات
    git pull origin main
    
    print_success "تم سحب آخر التحديثات"
}

# تحديث Backend (Laravel)
update_backend() {
    print_status "تحديث Backend (Laravel)..."
    
    cd $BACKEND_DIR
    
    # تثبيت/تحديث dependencies
    print_status "تثبيت Composer dependencies..."
    composer install --optimize-autoloader --no-dev --no-interaction
    
    # تشغيل migrations
    print_status "تشغيل database migrations..."
    php artisan migrate --force
    
    # مسح cache
    print_status "مسح وإعادة بناء cache..."
    php artisan config:clear
    php artisan config:cache
    php artisan route:clear
    php artisan route:cache
    php artisan view:clear
    php artisan view:cache
    php artisan event:clear
    php artisan event:cache
    
    # تحسين autoloader
    composer dump-autoload --optimize
    
    print_success "تم تحديث Backend بنجاح"
}

# تحديث Frontend (Next.js)
update_frontend() {
    print_status "تحديث Frontend (Next.js)..."
    
    cd $FRONTEND_DIR
    
    # تثبيت dependencies
    print_status "تثبيت npm dependencies..."
    npm ci --only=production
    
    # بناء التطبيق
    print_status "بناء Next.js application..."
    npm run build
    
    print_success "تم تحديث Frontend بنجاح"
}

# إعادة تشغيل الخدمات
restart_services() {
    print_status "إعادة تشغيل الخدمات..."
    
    # إعادة تشغيل PM2 إذا كان متوفراً
    if command -v pm2 &> /dev/null; then
        print_status "إعادة تشغيل PM2..."
        pm2 restart falakcart-frontend || print_warning "فشل في إعادة تشغيل PM2"
    fi
    
    # إعادة تشغيل Apache/Nginx
    if command -v systemctl &> /dev/null; then
        if systemctl is-active --quiet apache2; then
            print_status "إعادة تشغيل Apache..."
            sudo systemctl reload apache2
        elif systemctl is-active --quiet nginx; then
            print_status "إعادة تشغيل Nginx..."
            sudo systemctl reload nginx
        fi
    fi
    
    print_success "تم إعادة تشغيل الخدمات"
}

# إعداد الصلاحيات
set_permissions() {
    print_status "إعداد الصلاحيات..."
    
    # صلاحيات Laravel
    if [ -d "$BACKEND_DIR" ]; then
        chmod -R 755 $BACKEND_DIR
        chmod -R 775 $BACKEND_DIR/storage
        chmod -R 775 $BACKEND_DIR/bootstrap/cache
        
        # تغيير المالك إذا كان ممكناً
        if command -v chown &> /dev/null; then
            chown -R www-data:www-data $BACKEND_DIR 2>/dev/null || print_warning "لا يمكن تغيير المالك"
        fi
    fi
    
    print_success "تم إعداد الصلاحيات"
}

# اختبار النشر
test_deployment() {
    print_status "اختبار النشر..."
    
    # اختبار Backend API
    if command -v curl &> /dev/null; then
        print_status "اختبار Backend API..."
        if curl -f -s "http://localhost/api/health" > /dev/null; then
            print_success "Backend API يعمل بشكل صحيح"
        else
            print_warning "Backend API قد لا يعمل بشكل صحيح"
        fi
    fi
    
    # اختبار Frontend
    print_status "اختبار Frontend..."
    if curl -f -s "http://localhost:3000" > /dev/null; then
        print_success "Frontend يعمل بشكل صحيح"
    else
        print_warning "Frontend قد لا يعمل بشكل صحيح"
    fi
    
    # اختبار قاعدة البيانات
    print_status "اختبار قاعدة البيانات..."
    cd $BACKEND_DIR
    if php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database OK';" 2>/dev/null; then
        print_success "قاعدة البيانات تعمل بشكل صحيح"
    else
        print_warning "قد تكون هناك مشكلة في قاعدة البيانات"
    fi
}

# تنظيف الملفات القديمة
cleanup() {
    print_status "تنظيف الملفات القديمة..."
    
    # حذف النسخ الاحتياطية القديمة (أكثر من 7 أيام)
    if [ -d "$BACKUP_DIR" ]; then
        find $BACKUP_DIR -name "*.sql" -mtime +7 -delete 2>/dev/null || true
        find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true
    fi
    
    # تنظيف logs القديمة
    if [ -d "$BACKEND_DIR/storage/logs" ]; then
        find $BACKEND_DIR/storage/logs -name "*.log" -mtime +14 -delete 2>/dev/null || true
    fi
    
    print_success "تم تنظيف الملفات القديمة"
}

# الدالة الرئيسية
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  FalakCart Production Deployment${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # التحقق من المتطلبات
    check_requirements
    
    # إنشاء نسخة احتياطية
    create_backup
    
    # سحب التحديثات
    pull_updates
    
    # تحديث Backend
    update_backend
    
    # تحديث Frontend
    update_frontend
    
    # إعداد الصلاحيات
    set_permissions
    
    # إعادة تشغيل الخدمات
    restart_services
    
    # اختبار النشر
    test_deployment
    
    # تنظيف الملفات القديمة
    cleanup
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  تم النشر بنجاح!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}معلومات مفيدة:${NC}"
    echo -e "- مجلد المشروع: ${PROJECT_DIR}"
    echo -e "- مجلد النسخ الاحتياطي: ${BACKUP_DIR}"
    echo -e "- لمراقبة Frontend: ${YELLOW}pm2 logs falakcart-frontend${NC}"
    echo -e "- لمراقبة Backend: ${YELLOW}tail -f ${BACKEND_DIR}/storage/logs/laravel.log${NC}"
    echo ""
}

# تشغيل السكريبت
main "$@"