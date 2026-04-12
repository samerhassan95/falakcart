#!/bin/bash

# Complete deployment script for togaar.com
# Run this on the server: bash deploy-togaar-complete.sh

PROJECT_DIR="/www/wwwroot/togaar.com/falakcart"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🚀 Starting complete deployment for togaar.com..."
echo "Project Directory: $PROJECT_DIR"

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    echo "Please make sure the project is cloned to the correct location"
    exit 1
fi

cd $PROJECT_DIR

# Step 1: Backend Setup
echo ""
echo "1️⃣ Setting up Backend (Laravel)..."
cd $BACKEND_DIR

# Update .env for production
echo "🔧 Configuring production environment..."
sed -i 's/APP_ENV=local/APP_ENV=production/' .env
sed -i 's/APP_DEBUG=true/APP_DEBUG=false/' .env
sed -i 's|APP_URL=http://localhost|APP_URL=https://togaar.com|' .env
sed -i 's/LOG_LEVEL=debug/LOG_LEVEL=error/' .env
sed -i 's/DB_PORT=3307/DB_PORT=3306/' .env

# Generate keys if missing
if ! grep -q "APP_KEY=base64:" .env; then
    echo "🔑 Generating application key..."
    php artisan key:generate --force
fi

if ! grep -q "JWT_SECRET=" .env || [ -z "$(grep JWT_SECRET= .env | cut -d'=' -f2)" ]; then
    echo "🔐 Generating JWT secret..."
    php artisan jwt:secret --force
fi

# Test database connection
echo "🗄️ Testing database connection..."
if php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database OK'; exit;" 2>/dev/null; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection failed"
    echo "Please check your database credentials in .env file"
    echo "Current settings:"
    grep "DB_" .env
    exit 1
fi

# Run migrations and optimizations
echo "📊 Running migrations..."
php artisan migrate --force

echo "⚡ Optimizing Laravel..."
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache
php artisan view:clear

# Fix permissions
echo "🔒 Setting permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || chown -R apache:apache storage bootstrap/cache 2>/dev/null || true

# Step 2: Frontend Setup
echo ""
echo "2️⃣ Setting up Frontend (Next.js)..."
cd $FRONTEND_DIR

# Create production environment
echo "📝 Creating frontend environment..."
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://togaar.com/api
NEXT_PUBLIC_APP_URL=https://togaar.com
NODE_ENV=production
EOF

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Build application
echo "🏗️ Building Next.js application..."
npm run build

# Step 3: PM2 Setup (Port 3001 to avoid conflict)
echo ""
echo "3️⃣ Setting up PM2 on port 3001..."

# Create logs directory
mkdir -p $PROJECT_DIR/logs

# Stop existing processes
pm2 stop togaar-falakcart 2>/dev/null || true
pm2 delete togaar-falakcart 2>/dev/null || true

# Start new process
echo "🚀 Starting PM2 process..."
pm2 start ecosystem.config.js
pm2 save

# Step 4: Test everything
echo ""
echo "4️⃣ Testing deployment..."

# Test PM2
if pm2 list | grep -q "togaar-falakcart.*online"; then
    echo "✅ PM2 process running"
else
    echo "❌ PM2 process not running"
    pm2 logs togaar-falakcart --lines 10
fi

# Test frontend port
sleep 3
if curl -s -f "http://localhost:3001" > /dev/null 2>&1; then
    echo "✅ Frontend responding on port 3001"
else
    echo "❌ Frontend not responding on port 3001"
    echo "PM2 logs:"
    pm2 logs togaar-falakcart --lines 5
fi

# Test Laravel
cd $BACKEND_DIR
if php artisan route:list | grep -q "api/health"; then
    echo "✅ Laravel API routes loaded"
else
    echo "❌ Laravel API routes not loaded"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Summary:"
echo "- Backend: Laravel API configured for production"
echo "- Frontend: Next.js running on PM2 (port 3001)"
echo "- Database: MySQL connection verified"
echo "- Environment: Production mode"
echo ""
echo "🌐 Test URLs:"
echo "- Main site: https://togaar.com"
echo "- API health: https://togaar.com/api/health"
echo "- Admin panel: https://togaar.com/admin"
echo ""
echo "🔧 Important notes:"
echo "1. Make sure aaPanel Document Root is: $PROJECT_DIR"
echo "2. The .htaccess file routes /api/* to Laravel and everything else to Next.js"
echo "3. Next.js runs on port 3001 (not 3000) to avoid conflict with kadin-web"
echo ""
echo "🚨 If you still get 500 errors:"
echo "1. Check PM2 status: pm2 status"
echo "2. Check PM2 logs: pm2 logs togaar-falakcart"
echo "3. Check Laravel logs: tail -f $BACKEND_DIR/storage/logs/laravel.log"
echo "4. Check Apache error logs in aaPanel"
echo "5. Verify aaPanel site settings point to correct directory"
echo ""
echo "✅ Ready to test at https://togaar.com"