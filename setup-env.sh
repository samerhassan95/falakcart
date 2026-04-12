#!/bin/bash

# FalakCart Environment Setup Script
# سكريبت إعداد متغيرات البيئة للإنتاج

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

# جمع المعلومات من المستخدم
collect_info() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  FalakCart Environment Setup${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # Domain
    read -p "أدخل اسم النطاق (مثال: example.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        print_error "اسم النطاق مطلوب"
        exit 1
    fi
    
    # Database info
    read -p "أدخل اسم قاعدة البيانات [falakcart_affiliate]: " DB_NAME
    DB_NAME=${DB_NAME:-falakcart_affiliate}
    
    read -p "أدخل اسم مستخدم قاعدة البيانات [falakcart_user]: " DB_USER
    DB_USER=${DB_USER:-falakcart_user}
    
    read -s -p "أدخل كلمة مرور قاعدة البيانات: " DB_PASSWORD
    echo ""
    if [ -z "$DB_PASSWORD" ]; then
        print_error "كلمة مرور قاعدة البيانات مطلوبة"
        exit 1
    fi
    
    # Email settings
    read -p "أدخل SMTP Host (اختياري): " MAIL_HOST
    read -p "أدخل SMTP Port [587]: " MAIL_PORT
    MAIL_PORT=${MAIL_PORT:-587}
    
    read -p "أدخل SMTP Username (اختياري): " MAIL_USERNAME
    if [ ! -z "$MAIL_USERNAME" ]; then
        read -s -p "أدخل SMTP Password: " MAIL_PASSWORD
        echo ""
    fi
    
    read -p "أدخل From Email [noreply@$DOMAIN]: " MAIL_FROM
    MAIL_FROM=${MAIL_FROM:-noreply@$DOMAIN}
}

# إنشاء ملف .env للـ Backend
create_backend_env() {
    print_status "إنشاء ملف .env للـ Backend..."
    
    BACKEND_ENV_FILE="backend/.env"
    
    # توليد APP_KEY
    APP_KEY=$(openssl rand -base64 32)
    
    # توليد JWT_SECRET
    JWT_SECRET=$(openssl rand -base64 64)
    
    cat > $BACKEND_ENV_FILE << EOF
APP_NAME="FalakCart Affiliate System"
APP_ENV=production
APP_KEY=base64:$APP_KEY
APP_DEBUG=false
APP_URL=https://$DOMAIN

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=$DB_NAME
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD

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

EOF

    # إضافة إعدادات البريد الإلكتروني إذا تم توفيرها
    if [ ! -z "$MAIL_HOST" ]; then
        cat >> $BACKEND_ENV_FILE << EOF
MAIL_MAILER=smtp
MAIL_HOST=$MAIL_HOST
MAIL_PORT=$MAIL_PORT
MAIL_USERNAME=$MAIL_USERNAME
MAIL_PASSWORD=$MAIL_PASSWORD
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="$MAIL_FROM"
MAIL_FROM_NAME="\${APP_NAME}"

EOF
    else
        cat >> $BACKEND_ENV_FILE << EOF
MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="$MAIL_FROM"
MAIL_FROM_NAME="\${APP_NAME}"

EOF
    fi

    cat >> $BACKEND_ENV_FILE << EOF
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

VITE_APP_NAME="\${APP_NAME}"
VITE_PUSHER_APP_KEY="\${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="\${PUSHER_HOST}"
VITE_PUSHER_PORT="\${PUSHER_PORT}"
VITE_PUSHER_SCHEME="\${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="\${PUSHER_APP_CLUSTER}"

JWT_SECRET=$JWT_SECRET
JWT_ALGO=HS256
EOF

    print_success "تم إنشاء ملف .env للـ Backend"
}

# إنشاء ملف .env للـ Frontend
create_frontend_env() {
    print_status "إنشاء ملف .env للـ Frontend..."
    
    FRONTEND_ENV_FILE="frontend/.env.production"
    
    cat > $FRONTEND_ENV_FILE << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NODE_ENV=production
EOF

    # إنشاء ملف .env.local أيضاً
    cp $FRONTEND_ENV_FILE frontend/.env.local
    
    print_success "تم إنشاء ملف .env للـ Frontend"
}

# إنشاء ملف PM2 ecosystem
create_pm2_config() {
    print_status "إنشاء ملف PM2 ecosystem..."
    
    cat > frontend/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'falakcart-frontend',
    script: 'npm',
    args: 'start',
    cwd: process.cwd(),
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
    mkdir -p frontend/logs
    
    print_success "تم إنشاء ملف PM2 ecosystem"
}

# إنشاء ملف Apache Virtual Host
create_apache_config() {
    print_status "إنشاء ملف Apache Virtual Host..."
    
    cat > apache-vhost.conf << EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    DocumentRoot /www/wwwroot/$DOMAIN/backend/public
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    DocumentRoot /www/wwwroot/$DOMAIN/backend/public
    
    # SSL Configuration (سيتم إعدادها بواسطة aaPanel)
    SSLEngine on
    
    # Laravel Backend (API routes)
    <Directory "/www/wwwroot/$DOMAIN/backend/public">
        AllowOverride All
        Require all granted
        
        # Laravel .htaccess rules
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^ index.php [L]
    </Directory>
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # API routes go to Laravel
    <LocationMatch "^/api/">
        # Laravel handles these
    </LocationMatch>
    
    # All other routes go to Next.js
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Exclude API routes from proxy
    ProxyPass /api/ !
    
    # Proxy everything else to Next.js
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    
    # WebSocket support for Next.js
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:3000/\$1" [P,L]
</VirtualHost>
EOF

    print_success "تم إنشاء ملف Apache Virtual Host: apache-vhost.conf"
}

# إنشاء ملف Nginx config
create_nginx_config() {
    print_status "إنشاء ملف Nginx config..."
    
    cat > nginx-site.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (سيتم إعدادها بواسطة aaPanel)
    # ssl_certificate /path/to/certificate.crt;
    # ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # API routes go to Laravel
    location /api/ {
        root /www/wwwroot/$DOMAIN/backend/public;
        try_files \$uri \$uri/ /index.php?\$query_string;
        
        location ~ \.php$ {
            fastcgi_pass unix:/tmp/php-cgi-81.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
            include fastcgi_params;
        }
    }
    
    # All other routes go to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

    print_success "تم إنشاء ملف Nginx config: nginx-site.conf"
}

# إنشاء database setup script
create_database_script() {
    print_status "إنشاء database setup script..."
    
    cat > setup-database.sql << EOF
-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- إنشاء مستخدم قاعدة البيانات
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;

-- عرض قواعد البيانات للتأكد
SHOW DATABASES;
EOF

    print_success "تم إنشاء database setup script: setup-database.sql"
}

# إنشاء webhook script
create_webhook_script() {
    print_status "إنشاء webhook script..."
    
    # توليد webhook secret
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    
    cat > backend/public/webhook.php << EOF
<?php
// GitHub Webhook Handler for FalakCart
// Generated automatically by setup script

\$secret = '$WEBHOOK_SECRET';
\$project_dir = '/www/wwwroot/$DOMAIN';

// Log function
function log_message(\$message) {
    \$log_file = \$GLOBALS['project_dir'] . '/webhook.log';
    \$timestamp = date('Y-m-d H:i:s');
    file_put_contents(\$log_file, "[\$timestamp] \$message" . PHP_EOL, FILE_APPEND | LOCK_EX);
}

// Verify signature
\$payload = file_get_contents('php://input');
\$signature = \$_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

if (!hash_equals('sha256=' . hash_hmac('sha256', \$payload, \$secret), \$signature)) {
    http_response_code(403);
    log_message('Webhook: Invalid signature');
    exit('Forbidden');
}

\$data = json_decode(\$payload, true);

// Check if push is to main branch
if (\$data['ref'] === 'refs/heads/main') {
    log_message('Webhook: Deployment started for main branch');
    
    // Run deployment script in background
    \$deploy_script = \$project_dir . '/deploy-production.sh';
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

    print_success "تم إنشاء webhook script"
    print_warning "Webhook Secret: $WEBHOOK_SECRET"
    print_warning "احفظ هذا السر لاستخدامه في GitHub Webhook settings"
}

# إنشاء ملف التعليمات
create_instructions() {
    print_status "إنشاء ملف التعليمات..."
    
    cat > DEPLOYMENT_INSTRUCTIONS.md << EOF
# تعليمات النشر - FalakCart

## الملفات المُنشأة:

### ملفات البيئة:
- \`backend/.env\` - إعدادات Laravel للإنتاج
- \`frontend/.env.production\` - إعدادات Next.js للإنتاج
- \`frontend/.env.local\` - نسخة محلية من إعدادات Next.js

### ملفات الإعداد:
- \`frontend/ecosystem.config.js\` - إعدادات PM2
- \`apache-vhost.conf\` - إعدادات Apache Virtual Host
- \`nginx-site.conf\` - إعدادات Nginx
- \`setup-database.sql\` - سكريبت إعداد قاعدة البيانات

### ملفات النشر:
- \`deploy-production.sh\` - سكريبت النشر التلقائي
- \`backend/public/webhook.php\` - معالج GitHub Webhook

## خطوات النشر:

### 1. إعداد قاعدة البيانات:
\`\`\`bash
mysql -u root -p < setup-database.sql
\`\`\`

### 2. رفع الملفات إلى السيرفر:
\`\`\`bash
# رفع المشروع إلى /www/wwwroot/$DOMAIN/
\`\`\`

### 3. إعداد Web Server:
- **Apache**: استخدم محتوى \`apache-vhost.conf\` في aaPanel
- **Nginx**: استخدم محتوى \`nginx-site.conf\` في aaPanel

### 4. تشغيل النشر الأولي:
\`\`\`bash
chmod +x deploy-production.sh
./deploy-production.sh
\`\`\`

### 5. إعداد PM2:
\`\`\`bash
cd frontend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

### 6. إعداد SSL:
- استخدم aaPanel لإعداد Let's Encrypt SSL

### 7. إعداد GitHub Webhook:
- URL: \`https://$DOMAIN/webhook.php\`
- Secret: \`[الموجود في webhook.php]\`
- Events: Push events

## معلومات مهمة:

### URLs:
- **Frontend**: https://$DOMAIN
- **Backend API**: https://$DOMAIN/api
- **Webhook**: https://$DOMAIN/webhook.php

### Database:
- **Name**: $DB_NAME
- **User**: $DB_USER
- **Host**: localhost

### Monitoring:
\`\`\`bash
# مراقبة PM2
pm2 status
pm2 logs falakcart-frontend

# مراقبة Laravel logs
tail -f backend/storage/logs/laravel.log

# مراقبة Webhook logs
tail -f webhook.log
\`\`\`

### Troubleshooting:
\`\`\`bash
# إعادة تشغيل Frontend
pm2 restart falakcart-frontend

# مسح Laravel cache
cd backend
php artisan config:clear
php artisan cache:clear

# التحقق من الصلاحيات
chmod -R 775 backend/storage
chmod -R 775 backend/bootstrap/cache
\`\`\`
EOF

    print_success "تم إنشاء ملف التعليمات: DEPLOYMENT_INSTRUCTIONS.md"
}

# الدالة الرئيسية
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  FalakCart Environment Setup${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # جمع المعلومات
    collect_info
    
    # إنشاء الملفات
    create_backend_env
    create_frontend_env
    create_pm2_config
    create_apache_config
    create_nginx_config
    create_database_script
    create_webhook_script
    create_instructions
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  تم إعداد البيئة بنجاح!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}الخطوات التالية:${NC}"
    echo -e "1. راجع الملفات المُنشأة"
    echo -e "2. ارفع المشروع إلى السيرفر"
    echo -e "3. اتبع التعليمات في ${YELLOW}DEPLOYMENT_INSTRUCTIONS.md${NC}"
    echo ""
}

# تشغيل السكريبت
main "$@"