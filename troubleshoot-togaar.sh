#!/bin/bash

# FalakCart Troubleshooting Script for togaar.com
# Run this script to diagnose common issues

PROJECT_DIR="/www/wwwroot/togaar.com/falakcart"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🔍 FalakCart Troubleshooting for togaar.com"
echo "============================================"

# Check project structure
echo "📁 Checking project structure..."
if [ -d "$PROJECT_DIR" ]; then
    echo "✅ Project directory exists: $PROJECT_DIR"
else
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

if [ -d "$BACKEND_DIR" ]; then
    echo "✅ Backend directory exists"
else
    echo "❌ Backend directory not found"
fi

if [ -d "$FRONTEND_DIR" ]; then
    echo "✅ Frontend directory exists"
else
    echo "❌ Frontend directory not found"
fi

echo ""

# Check Backend
echo "🔧 Checking Backend (Laravel)..."
cd $BACKEND_DIR

if [ -f .env ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file missing"
fi

if [ -f composer.json ]; then
    echo "✅ composer.json exists"
else
    echo "❌ composer.json missing"
fi

# Check Laravel installation
if [ -f artisan ]; then
    echo "✅ Laravel artisan found"
    
    # Test database connection
    echo "🗄️  Testing database connection..."
    php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database connection OK';" 2>/dev/null && echo "✅ Database connection successful" || echo "❌ Database connection failed"
    
else
    echo "❌ Laravel artisan not found"
fi

# Check permissions
echo "🔐 Checking permissions..."
if [ -w storage ]; then
    echo "✅ Storage directory is writable"
else
    echo "❌ Storage directory is not writable"
    echo "   Fix with: chmod -R 775 storage"
fi

if [ -w bootstrap/cache ]; then
    echo "✅ Bootstrap cache is writable"
else
    echo "❌ Bootstrap cache is not writable"
    echo "   Fix with: chmod -R 775 bootstrap/cache"
fi

echo ""

# Check Frontend
echo "⚛️  Checking Frontend (Next.js)..."
cd $FRONTEND_DIR

if [ -f package.json ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json missing"
fi

if [ -d node_modules ]; then
    echo "✅ node_modules directory exists"
else
    echo "❌ node_modules missing - run: npm install"
fi

if [ -d .next ]; then
    echo "✅ .next build directory exists"
else
    echo "❌ .next build directory missing - run: npm run build"
fi

echo ""

# Check PM2
echo "📦 Checking PM2..."
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 is installed"
    echo "📊 PM2 Status:"
    pm2 status
    
    # Check if our app is running
    if pm2 list | grep -q "togaar-falakcart"; then
        echo "✅ togaar-falakcart process found in PM2"
    else
        echo "❌ togaar-falakcart process not found in PM2"
        echo "   Start with: pm2 start ecosystem.config.js"
    fi
else
    echo "❌ PM2 not installed"
    echo "   Install with: npm install -g pm2"
fi

echo ""

# Check web server
echo "🌐 Checking web server..."

# Test localhost connections
echo "Testing local connections..."

# Test Backend
if curl -s -f "http://localhost/api/health" > /dev/null 2>&1; then
    echo "✅ Backend API responding on localhost"
else
    echo "❌ Backend API not responding on localhost"
fi

# Test Frontend (if PM2 is running)
if curl -s -f "http://localhost:3000" > /dev/null 2>&1; then
    echo "✅ Frontend responding on localhost:3000"
else
    echo "❌ Frontend not responding on localhost:3000"
fi

# Test external domain
echo "Testing external domain..."
if curl -s -f "https://togaar.com" > /dev/null 2>&1; then
    echo "✅ togaar.com is responding"
else
    echo "❌ togaar.com is not responding"
fi

echo ""

# Check logs
echo "📋 Recent logs..."
echo "Backend logs (last 10 lines):"
if [ -f "$BACKEND_DIR/storage/logs/laravel.log" ]; then
    tail -10 "$BACKEND_DIR/storage/logs/laravel.log"
else
    echo "No Laravel logs found"
fi

echo ""
echo "PM2 logs (last 10 lines):"
if command -v pm2 &> /dev/null; then
    pm2 logs togaar-falakcart --lines 10 --nostream 2>/dev/null || echo "No PM2 logs available"
else
    echo "PM2 not available"
fi

echo ""
echo "🔧 Common fixes:"
echo "1. Fix permissions: chmod -R 775 $BACKEND_DIR/storage $BACKEND_DIR/bootstrap/cache"
echo "2. Restart PM2: pm2 restart togaar-falakcart"
echo "3. Clear Laravel cache: cd $BACKEND_DIR && php artisan config:clear"
echo "4. Rebuild frontend: cd $FRONTEND_DIR && npm run build"
echo "5. Check aaPanel website settings for togaar.com"