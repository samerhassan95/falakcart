#!/bin/bash

# Quick fix script for togaar.com deployment issues
# Run this on the server: bash quick-fix-togaar.sh

echo "🚀 Quick Fix for togaar.com FalakCart Deployment"
echo "==============================================="

PROJECT_DIR="/www/wwwroot/togaar.com/falakcart"
BACKEND_DIR="$PROJECT_DIR/backend"

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    echo "Please run this script from the server where FalakCart is deployed"
    exit 1
fi

cd "$PROJECT_DIR"

echo "📍 Working in: $(pwd)"

# Step 1: Fix Backend Environment and Keys
echo ""
echo "1️⃣ Fixing Backend Environment..."
cd "$BACKEND_DIR"

# Generate APP_KEY if missing
if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null || [ -z "$(grep '^APP_KEY=' .env 2>/dev/null | cut -d'=' -f2)" ]; then
    echo "🔑 Generating APP_KEY..."
    php artisan key:generate --force
fi

# Generate JWT_SECRET if missing
if ! grep -q "^JWT_SECRET=" .env 2>/dev/null || [ -z "$(grep '^JWT_SECRET=' .env 2>/dev/null | cut -d'=' -f2)" ]; then
    echo "🔐 Generating JWT_SECRET..."
    php artisan jwt:secret --force
fi

# Fix database connection in .env
echo "🗄️ Fixing database connection..."
sed -i 's/DB_CONNECTION=sqlite/DB_CONNECTION=mysql/' .env 2>/dev/null
sed -i 's/^#.*DB_HOST=/DB_HOST=/' .env 2>/dev/null
sed -i 's/^#.*DB_PORT=/DB_PORT=/' .env 2>/dev/null
sed -i 's/^#.*DB_DATABASE=/DB_DATABASE=/' .env 2>/dev/null
sed -i 's/^#.*DB_USERNAME=/DB_USERNAME=/' .env 2>/dev/null
sed -i 's/^#.*DB_PASSWORD=/DB_PASSWORD=/' .env 2>/dev/null

# Ensure correct values
sed -i 's/^DB_HOST=.*/DB_HOST=localhost/' .env 2>/dev/null
sed -i 's/^DB_PORT=.*/DB_PORT=3306/' .env 2>/dev/null
sed -i 's/^DB_DATABASE=.*/DB_DATABASE=falakcart/' .env 2>/dev/null
sed -i 's/^DB_USERNAME=.*/DB_USERNAME=falakcart/' .env 2>/dev/null
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=falakcart/' .env 2>/dev/null

# Clear and cache configuration
echo "🧹 Clearing cache..."
php artisan config:clear
php artisan cache:clear
php artisan config:cache

# Fix permissions
echo "🔒 Fixing permissions..."
chmod -R 775 storage bootstrap/cache

# Step 2: Test Database
echo ""
echo "2️⃣ Testing Database Connection..."
if php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database OK';" 2>/dev/null | grep -q "Database OK"; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection failed"
    echo "Current settings:"
    grep "^DB_" .env
fi

# Step 3: Fix PM2
echo ""
echo "3️⃣ Fixing PM2..."
cd "$PROJECT_DIR/frontend"

# Stop and restart PM2
pm2 stop togaar-falakcart 2>/dev/null || true
pm2 delete togaar-falakcart 2>/dev/null || true

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Start PM2
pm2 start ecosystem.config.js
pm2 save

sleep 2

# Check PM2 status
if pm2 list | grep -q "togaar-falakcart.*online"; then
    echo "✅ PM2 is running"
else
    echo "❌ PM2 failed to start"
    pm2 logs togaar-falakcart --lines 5 --nostream 2>/dev/null || true
fi

# Step 4: Test URLs
echo ""
echo "4️⃣ Testing URLs..."

# Test API
echo -n "Testing API... "
if curl -s -f -m 10 "https://togaar.com/api/health" > /dev/null 2>&1; then
    echo "✅ API working"
else
    echo "❌ API failed"
fi

# Test Homepage
echo -n "Testing Homepage... "
if curl -s -f -m 10 "https://togaar.com/" > /dev/null 2>&1; then
    echo "✅ Homepage working"
else
    echo "❌ Homepage failed"
fi

echo ""
echo "🎉 Quick fix completed!"
echo ""
echo "🌐 Test these URLs:"
echo "- https://togaar.com/api/health"
echo "- https://togaar.com/"
echo "- https://togaar.com/login"
echo ""
echo "🔍 If still having issues:"
echo "- Check PM2 logs: pm2 logs togaar-falakcart"
echo "- Check Laravel logs: tail -f $BACKEND_DIR/storage/logs/laravel.log"
echo "- Run full troubleshooting: bash troubleshoot-togaar-complete.sh"