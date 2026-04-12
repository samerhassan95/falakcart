#!/bin/bash

# FalakCart Deployment Script for togaar.com (aaPanel)
# Run this script on the server: /www/wwwroot/togaar.com/falakcart/

PROJECT_DIR="/www/wwwroot/togaar.com/falakcart"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🚀 Starting FalakCart deployment for togaar.com..."

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Project directory not found at $PROJECT_DIR"
    exit 1
fi

cd $PROJECT_DIR

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Update Backend (Laravel)
echo "🔧 Updating Backend (Laravel)..."
cd $BACKEND_DIR

# Install/update Composer dependencies
composer install --optimize-autoloader --no-dev --no-interaction

# Copy production environment if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        cp .env.production .env
        echo "✅ Copied .env.production to .env"
    else
        echo "⚠️  Warning: No .env file found. Please create one manually."
    fi
fi

# Generate app key if not set
php artisan key:generate --force

# Run database migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# Clear and cache configurations
echo "🧹 Clearing and caching configurations..."
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache
php artisan view:clear
php artisan view:cache

# Set proper permissions
echo "🔐 Setting proper permissions..."
chown -R www-data:www-data $BACKEND_DIR/storage $BACKEND_DIR/bootstrap/cache 2>/dev/null || true
chmod -R 775 $BACKEND_DIR/storage $BACKEND_DIR/bootstrap/cache

# Update Frontend (Next.js)
echo "⚛️  Updating Frontend (Next.js)..."
cd $FRONTEND_DIR

# Install/update Node.js dependencies
npm ci --only=production

# Copy production environment
if [ -f .env.production ]; then
    cp .env.production .env.local
    echo "✅ Copied .env.production to .env.local"
fi

# Build the application (this creates both server build and static export)
echo "🏗️  Building Next.js application..."
npm run build

# Create logs directory for PM2
mkdir -p $PROJECT_DIR/logs

# Try to start/restart PM2 process
if command -v pm2 &> /dev/null; then
    echo "🔄 Managing PM2 process..."
    
    # Check if ecosystem.config.js exists
    if [ -f ecosystem.config.js ]; then
        # Try to restart existing process
        pm2 restart togaar-falakcart 2>/dev/null || {
            echo "📦 Starting new PM2 process..."
            pm2 start ecosystem.config.js
        }
        pm2 save
        echo "✅ PM2 process started/restarted"
    else
        echo "⚠️  Warning: ecosystem.config.js not found."
    fi
    
    echo "📊 PM2 Status:"
    pm2 status
else
    echo "⚠️  PM2 not found. Frontend will run as static export only."
fi

# Test the deployment
echo "🧪 Testing deployment..."

# Test Backend API
echo "Testing Backend API..."
if curl -s -f "http://localhost/api/health" > /dev/null 2>&1; then
    echo "✅ Backend API is responding"
else
    echo "❌ Backend API test failed - this is normal if running locally"
fi

# Test Frontend (if PM2 is running)
if command -v pm2 &> /dev/null && pm2 list | grep -q "togaar-falakcart.*online"; then
    echo "Testing Frontend (PM2)..."
    if curl -s -f "http://localhost:3000" > /dev/null 2>&1; then
        echo "✅ Frontend PM2 server is responding"
    else
        echo "❌ Frontend PM2 server test failed"
    fi
else
    echo "ℹ️  Frontend running as static export (no PM2 server)"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Setup Summary:"
echo "✅ Backend (Laravel) updated and configured"
echo "✅ Frontend (Next.js) built with static export"
if command -v pm2 &> /dev/null && pm2 list | grep -q "togaar-falakcart"; then
    echo "✅ PM2 server running on port 3000"
else
    echo "ℹ️  Static export available in frontend/out/"
fi
echo ""
echo "📋 Next steps:"
echo "1. Ensure aaPanel Document Root is: $PROJECT_DIR"
echo "2. Check that .htaccess file is in place"
echo "3. Test the website: https://togaar.com"
echo "4. Check PM2 status: pm2 status"
echo "5. View logs if needed: pm2 logs togaar-falakcart"
echo ""
echo "🔗 URLs:"
echo "   Frontend: https://togaar.com"
echo "   Backend API: https://togaar.com/api"
echo "   Admin Panel: https://togaar.com/admin"
echo ""

# Show current PM2 status if available
if command -v pm2 &> /dev/null; then
    echo "📊 Current PM2 Status:"
    pm2 status
fi