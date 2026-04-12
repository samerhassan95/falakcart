#!/bin/bash

# Complete troubleshooting script for togaar.com FalakCart deployment
# This script addresses all the issues mentioned in the deployment context

PROJECT_DIR="/www/wwwroot/togaar.com/falakcart"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🔧 Complete FalakCart Troubleshooting for togaar.com"
echo "=================================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to test URL
test_url() {
    local url=$1
    local description=$2
    echo -n "Testing $description ($url)... "
    if curl -s -f -m 10 "$url" > /dev/null 2>&1; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAILED"
        return 1
    fi
}

# Step 1: Verify project structure
echo ""
echo "1️⃣ Verifying project structure..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

echo "✅ Project structure verified"

# Step 2: Fix Backend Issues
echo ""
echo "2️⃣ Fixing Backend Issues..."
cd "$BACKEND_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found, creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo "❌ .env.example not found either!"
        exit 1
    fi
fi

# Fix .env configuration
echo "🔧 Updating .env configuration..."
sed -i 's/APP_ENV=local/APP_ENV=production/' .env
sed -i 's/APP_DEBUG=true/APP_DEBUG=false/' .env
sed -i 's|APP_URL=http://localhost|APP_URL=https://togaar.com|' .env
sed -i 's/LOG_LEVEL=debug/LOG_LEVEL=error/' .env

# Fix database connection
echo "🗄️ Configuring MySQL database connection..."
sed -i 's/DB_CONNECTION=sqlite/DB_CONNECTION=mysql/' .env
sed -i 's/^#.*DB_HOST=/DB_HOST=/' .env
sed -i 's/^#.*DB_PORT=/DB_PORT=/' .env
sed -i 's/^#.*DB_DATABASE=/DB_DATABASE=/' .env
sed -i 's/^#.*DB_USERNAME=/DB_USERNAME=/' .env
sed -i 's/^#.*DB_PASSWORD=/DB_PASSWORD=/' .env

# Ensure correct database values
grep -q "^DB_HOST=" .env || echo "DB_HOST=localhost" >> .env
grep -q "^DB_PORT=" .env || echo "DB_PORT=3306" >> .env
grep -q "^DB_DATABASE=" .env || echo "DB_DATABASE=falakcart" >> .env
grep -q "^DB_USERNAME=" .env || echo "DB_USERNAME=falakcart" >> .env
grep -q "^DB_PASSWORD=" .env || echo "DB_PASSWORD=falakcart" >> .env

sed -i 's/^DB_HOST=.*/DB_HOST=localhost/' .env
sed -i 's/^DB_PORT=.*/DB_PORT=3306/' .env
sed -i 's/^DB_DATABASE=.*/DB_DATABASE=falakcart/' .env
sed -i 's/^DB_USERNAME=.*/DB_USERNAME=falakcart/' .env
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=falakcart/' .env

# Generate APP_KEY if missing or empty
echo "🔑 Checking application key..."
APP_KEY=$(grep "^APP_KEY=" .env | cut -d'=' -f2)
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
    echo "Generating new APP_KEY..."
    php artisan key:generate --force
    echo "✅ Generated new application key"
else
    echo "✅ Application key exists"
fi

# Generate JWT secret
echo "🔐 Checking JWT secret..."
if ! grep -q "^JWT_SECRET=" .env || [ -z "$(grep "^JWT_SECRET=" .env | cut -d'=' -f2)" ]; then
    echo "Generating JWT secret..."
    php artisan jwt:secret --force
    echo "✅ Generated JWT secret"
else
    echo "✅ JWT secret exists"
fi

# Test database connection
echo "🗄️ Testing database connection..."
if php artisan tinker --execute="try { DB::connection()->getPdo(); echo 'Database connection OK'; } catch(Exception \$e) { echo 'Database error: ' . \$e->getMessage(); } exit;" 2>/dev/null | grep -q "Database connection OK"; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection failed"
    echo "Current database settings:"
    grep "^DB_" .env
    echo ""
    echo "Please verify:"
    echo "1. MySQL service is running"
    echo "2. Database 'falakcart' exists"
    echo "3. User 'falakcart' has access to the database"
    echo "4. Password is correct"
fi

# Clear and cache configuration
echo "🧹 Clearing and caching configuration..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache

# Fix permissions
echo "🔒 Fixing permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || \
chown -R apache:apache storage bootstrap/cache 2>/dev/null || \
chown -R nginx:nginx storage bootstrap/cache 2>/dev/null || true

# Step 3: Fix Frontend Issues
echo ""
echo "3️⃣ Fixing Frontend Issues..."
cd "$FRONTEND_DIR"

# Create production environment
echo "📝 Creating frontend production environment..."
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://togaar.com/api
NEXT_PUBLIC_APP_URL=https://togaar.com
NODE_ENV=production
EOF

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Build the application
echo "🏗️ Building Next.js application..."
npm run build

# Step 4: Fix PM2 Configuration
echo ""
echo "4️⃣ Fixing PM2 Configuration..."

# Stop existing processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop togaar-falakcart 2>/dev/null || true
pm2 delete togaar-falakcart 2>/dev/null || true

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Verify ecosystem.config.js exists and is correct
if [ ! -f "$FRONTEND_DIR/ecosystem.config.js" ]; then
    echo "📝 Creating PM2 ecosystem config..."
    cat > "$FRONTEND_DIR/ecosystem.config.js" << EOF
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
      PORT: 3001,
      NEXT_PUBLIC_API_URL: 'https://togaar.com/api',
      NEXT_PUBLIC_APP_URL: 'https://togaar.com'
    },
    error_file: '$PROJECT_DIR/logs/pm2-error.log',
    out_file: '$PROJECT_DIR/logs/pm2-out.log',
    log_file: '$PROJECT_DIR/logs/pm2-combined.log',
    time: true
  }]
};
EOF
fi

# Start PM2
echo "🚀 Starting PM2..."
cd "$FRONTEND_DIR"
pm2 start ecosystem.config.js
pm2 save

# Wait a moment for PM2 to start
sleep 3

# Step 5: Verify .htaccess configuration
echo ""
echo "5️⃣ Verifying .htaccess configuration..."
cd "$PROJECT_DIR"

if [ ! -f ".htaccess" ]; then
    echo "❌ .htaccess file not found in project root"
    echo "Creating .htaccess file..."
    cat > .htaccess << 'EOF'
# FalakCart Affiliate System - aaPanel Deployment
# Document Root should be: /www/wwwroot/togaar.com/falakcart

<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Security Headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    
    # CORS Headers for API
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Handle preflight OPTIONS requests
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
    
    # API Routes - Direct to Laravel backend
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^(.*)$ backend/public/index.php [L]
    
    # Try to proxy to Next.js server first (if PM2 is running)
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://127.0.0.1:3001/$1 [P,L]
    
    # Fallback: Serve static files from frontend/out (if Next.js export exists)
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteCond %{DOCUMENT_ROOT}/frontend/out%{REQUEST_URI} -f
    RewriteRule ^(.*)$ frontend/out/$1 [L]
    
    # Fallback: Serve index.html for SPA routes from frontend/out
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteCond %{DOCUMENT_ROOT}/frontend/out%{REQUEST_URI}/index.html -f
    RewriteRule ^(.*)$ frontend/out/$1/index.html [L]
    
    # Final fallback: Serve frontend index.html for all non-API routes
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ frontend/out/index.html [L]
</IfModule>

# Deny access to sensitive files
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

<Files "composer.json">
    Order allow,deny
    Deny from all
</Files>

<Files "package.json">
    Order allow,deny
    Deny from all
</Files>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType application/json "access plus 1 day"
</IfModule>
EOF
    echo "✅ Created .htaccess file"
else
    echo "✅ .htaccess file exists"
fi

# Step 6: Test Everything
echo ""
echo "6️⃣ Testing Complete Setup..."

# Test PM2 status
echo "🔍 Checking PM2 status..."
if pm2 list | grep -q "togaar-falakcart.*online"; then
    echo "✅ PM2 process is running"
else
    echo "❌ PM2 process not running"
    echo "PM2 status:"
    pm2 list
fi

# Test local ports
echo "🔍 Testing local ports..."
if netstat -tlnp 2>/dev/null | grep -q ":3001.*LISTEN" || ss -tlnp 2>/dev/null | grep -q ":3001.*LISTEN"; then
    echo "✅ Port 3001 is listening"
else
    echo "❌ Port 3001 is not listening"
fi

# Test local frontend
echo "🔍 Testing local frontend..."
if curl -s -f -m 5 "http://localhost:3001" > /dev/null 2>&1; then
    echo "✅ Frontend responding on localhost:3001"
else
    echo "❌ Frontend not responding on localhost:3001"
    echo "PM2 logs (last 10 lines):"
    pm2 logs togaar-falakcart --lines 10 --nostream 2>/dev/null || echo "No PM2 logs available"
fi

# Test Laravel backend directly
echo "🔍 Testing Laravel backend..."
cd "$BACKEND_DIR"
if php -r "
\$_SERVER['REQUEST_METHOD'] = 'GET';
\$_SERVER['REQUEST_URI'] = '/api/health';
\$_SERVER['SCRIPT_NAME'] = '/index.php';
\$_SERVER['HTTP_HOST'] = 'togaar.com';
\$_SERVER['HTTPS'] = 'on';
try {
    ob_start();
    include 'public/index.php';
    \$output = ob_get_clean();
    if (strpos(\$output, 'ok') !== false || strpos(\$output, 'running') !== false) {
        echo 'Backend OK';
    } else {
        echo 'Backend response: ' . substr(\$output, 0, 100);
    }
} catch (Exception \$e) {
    echo 'Backend error: ' . \$e->getMessage();
}
" 2>/dev/null | grep -q "Backend OK"; then
    echo "✅ Laravel backend working"
else
    echo "❌ Laravel backend has issues"
    echo "Checking Laravel logs..."
    if [ -f "storage/logs/laravel.log" ]; then
        echo "Last 5 lines of Laravel log:"
        tail -5 storage/logs/laravel.log
    else
        echo "No Laravel log file found"
    fi
fi

# Test external URLs
echo "🔍 Testing external URLs..."
test_url "https://togaar.com/api/health" "API Health"
test_url "https://togaar.com/" "Homepage"

# Step 7: Summary and Next Steps
echo ""
echo "🎉 Troubleshooting Complete!"
echo "=========================="
echo ""
echo "📋 Configuration Summary:"
echo "- Project Directory: $PROJECT_DIR"
echo "- Frontend: PM2 on port 3001"
echo "- Backend: Laravel API at /api/*"
echo "- Database: MySQL (falakcart)"
echo ""
echo "🌐 URLs to test:"
echo "- Homepage: https://togaar.com"
echo "- API Health: https://togaar.com/api/health"
echo "- Login: https://togaar.com/login"
echo "- Admin: https://togaar.com/admin"
echo ""
echo "🔍 If issues persist:"
echo "1. Check PM2 logs: pm2 logs togaar-falakcart"
echo "2. Check Laravel logs: tail -f $BACKEND_DIR/storage/logs/laravel.log"
echo "3. Check Apache error logs in aaPanel"
echo "4. Verify aaPanel Document Root: $PROJECT_DIR"
echo "5. Ensure SSL certificate is configured"
echo ""
echo "🚀 Next steps:"
echo "1. Test all URLs in browser"
echo "2. Create admin user: cd $BACKEND_DIR && php artisan db:seed"
echo "3. Test affiliate registration and login"
echo "4. Configure webhook for auto-deployment"
echo ""
echo "📞 Support commands:"
echo "- Restart PM2: pm2 restart togaar-falakcart"
echo "- View PM2 status: pm2 status"
echo "- Clear Laravel cache: cd $BACKEND_DIR && php artisan config:clear"
echo "- Test database: cd $BACKEND_DIR && php artisan tinker"