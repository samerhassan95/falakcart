#!/bin/bash

# Comprehensive fix script for togaar.com server issues
# Run this on the server: /www/wwwroot/togaar.com/falakcart/

PROJECT_DIR="/www/wwwroot/togaar.com/falakcart"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🔧 Fixing FalakCart server issues for togaar.com..."
echo "📍 Project Directory: $PROJECT_DIR"

cd $PROJECT_DIR

# Step 1: Fix Backend API Routes and Environment
echo "1️⃣ Fixing Backend API Routes and Environment..."
cd $BACKEND_DIR

# Update .env for production
echo "🔧 Updating .env for production..."
sed -i 's/APP_ENV=local/APP_ENV=production/' .env
sed -i 's/APP_DEBUG=true/APP_DEBUG=false/' .env
sed -i 's|APP_URL=http://localhost|APP_URL=https://togaar.com|' .env
sed -i 's/LOG_LEVEL=debug/LOG_LEVEL=error/' .env

# Fix CORS settings for production
echo "🌐 Configuring CORS for production..."
if ! grep -q "SANCTUM_STATEFUL_DOMAINS" .env; then
    echo "SANCTUM_STATEFUL_DOMAINS=togaar.com,www.togaar.com" >> .env
fi
if ! grep -q "SESSION_DOMAIN" .env; then
    echo "SESSION_DOMAIN=.togaar.com" >> .env
fi

# Fix database connection (use the imported MySQL database)
echo "🗄️ Configuring database connection..."
sed -i 's/DB_CONNECTION=sqlite/DB_CONNECTION=mysql/' .env
sed -i 's/DB_PORT=3307/DB_PORT=3306/' .env
sed -i 's/#.*DB_HOST=/DB_HOST=/' .env
sed -i 's/#.*DB_DATABASE=/DB_DATABASE=/' .env
sed -i 's/#.*DB_USERNAME=/DB_USERNAME=/' .env
sed -i 's/#.*DB_PASSWORD=/DB_PASSWORD=/' .env

# Ensure database settings are uncommented and correct
if ! grep -q "^DB_HOST=localhost" .env; then
    sed -i 's/^.*DB_HOST=.*/DB_HOST=localhost/' .env
fi
if ! grep -q "^DB_DATABASE=falakcart" .env; then
    sed -i 's/^.*DB_DATABASE=.*/DB_DATABASE=falakcart/' .env
fi
if ! grep -q "^DB_USERNAME=falakcart" .env; then
    sed -i 's/^.*DB_USERNAME=.*/DB_USERNAME=falakcart/' .env
fi

# Generate app key if missing
echo "� Checking application key..."
if ! grep -q "APP_KEY=base64:" .env || [ -z "$(grep APP_KEY= .env | cut -d'=' -f2)" ]; then
    php artisan key:generate --force
    echo "✅ Generated new application key"
else
    echo "✅ Application key already exists"
fi

# Generate JWT secret if missing
echo "🔐 Checking JWT secret..."
if ! grep -q "JWT_SECRET=" .env || [ -z "$(grep JWT_SECRET= .env | cut -d'=' -f2)" ]; then
    php artisan jwt:secret --force
    echo "✅ Generated JWT secret"
fi

# Step 2: Fix Frontend Configuration and Build Issues
echo "2️⃣ Fixing Frontend Configuration and Build Issues..."
cd $FRONTEND_DIR

# Create production environment file with correct API URL
echo "📝 Creating frontend production environment..."
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://togaar.com/api
NEXT_PUBLIC_APP_URL=https://togaar.com
NODE_ENV=production
EOF

# Also create .env.local for consistency
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://togaar.com/api
NEXT_PUBLIC_APP_URL=https://togaar.com
NODE_ENV=production
EOF

# Fix hydration issues by updating next.config.ts
echo "🔧 Fixing Next.js configuration for hydration issues..."
cat > next.config.ts << 'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    esmExternals: false,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Fix hydration issues
  reactStrictMode: false,
  swcMinify: true,
  // Disable static optimization for pages with dynamic content
  generateStaticParams: false,
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://togaar.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
EOF

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install --production
fi

# Clear Next.js cache and build
echo "🧹 Clearing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

# Build the application
echo "🏗️ Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed, trying with legacy peer deps..."
    npm install --legacy-peer-deps
    npm run build
fi

# Step 3: Test database connection and run migrations
echo "3️⃣ Testing database connection and running migrations..."
cd $BACKEND_DIR

if php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database connection OK'; exit;" 2>/dev/null; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection failed - check your .env database settings"
    echo "Current database settings:"
    grep "DB_" .env
fi
# Run migrations and clear cache
echo "🔄 Running migrations and clearing cache..."
php artisan migrate --force
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache
php artisan view:clear
php artisan cache:clear

# Step 4: Fix permissions
echo "4️⃣ Fixing permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || chown -R apache:apache storage bootstrap/cache 2>/dev/null || true

# Step 5: Test Laravel API
echo "5️⃣ Testing Laravel API..."
if php artisan route:list | grep -q "api/health"; then
    echo "✅ API routes loaded"
else
    echo "❌ API routes not found"
fi

# Test API endpoint directly
echo "🧪 Testing API health endpoint..."
if php -r "
\$_SERVER['REQUEST_METHOD'] = 'GET';
\$_SERVER['REQUEST_URI'] = '/api/health';
\$_SERVER['HTTP_HOST'] = 'togaar.com';
\$_SERVER['HTTPS'] = 'on';
require 'public/index.php';
" 2>/dev/null | grep -q "FalakCart API is running"; then
    echo "✅ API health endpoint working"
else
    echo "❌ API health endpoint not responding"
fi

# Step 6: Setup PM2 for port 3001 (avoid conflict with kadin-web on port 3000)
echo "6️⃣ Setting up PM2 on port 3001..."
cd $FRONTEND_DIR

# Stop any existing PM2 process
pm2 stop togaar-falakcart 2>/dev/null || true
pm2 delete togaar-falakcart 2>/dev/null || true

# Create logs directory
mkdir -p $PROJECT_DIR/logs

# Update ecosystem.config.js to fix potential issues
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'togaar-falakcart',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3001',
    cwd: '/www/wwwroot/togaar.com/falakcart/frontend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      NEXT_PUBLIC_API_URL: 'https://togaar.com/api',
      NEXT_PUBLIC_APP_URL: 'https://togaar.com'
    },
    error_file: '/www/wwwroot/togaar.com/falakcart/logs/error.log',
    out_file: '/www/wwwroot/togaar.com/falakcart/logs/out.log',
    log_file: '/www/wwwroot/togaar.com/falakcart/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Start PM2 with the updated config
pm2 start ecosystem.config.js
pm2 save

echo "✅ PM2 started on port 3001"

# Step 7: Test the complete setup
echo "7️⃣ Testing the complete setup..."

# Test PM2 is running
if pm2 list | grep -q "togaar-falakcart.*online"; then
    echo "✅ PM2 process is running"
else
    echo "❌ PM2 process not running"
    echo "📋 PM2 status:"
    pm2 list
fi

# Test if port 3001 is responding
echo "🌐 Testing frontend on port 3001..."
sleep 5  # Give PM2 time to start
if curl -s -f "http://localhost:3001" > /dev/null 2>&1; then
    echo "✅ Frontend responding on port 3001"
else
    echo "❌ Frontend not responding on port 3001"
    echo "📋 PM2 logs (last 10 lines):"
    pm2 logs togaar-falakcart --lines 10 --nostream
fi

# Test Laravel backend
cd $BACKEND_DIR
echo "🧪 Testing Laravel backend..."
if php -r "
\$_SERVER['REQUEST_METHOD'] = 'GET';
\$_SERVER['REQUEST_URI'] = '/';
\$_SERVER['HTTP_HOST'] = 'togaar.com';
\$_SERVER['HTTPS'] = 'on';
try {
    require 'public/index.php';
    echo 'Backend OK';
} catch (Exception \$e) {
    echo 'Backend Error: ' . \$e->getMessage();
}
" 2>/dev/null | grep -q "Backend OK"; then
    echo "✅ Laravel backend can load"
else
    echo "❌ Laravel backend has issues"
    echo "📋 Laravel logs (last 5 lines):"
    tail -5 storage/logs/laravel.log 2>/dev/null || echo "No Laravel logs found"
fi

# Step 8: Create .htaccess for proper routing
echo "8️⃣ Creating .htaccess for proper routing..."
cd $PROJECT_DIR

cat > .htaccess << 'EOF'
RewriteEngine On

# Handle API requests - route to Laravel backend
RewriteCond %{REQUEST_URI} ^/api/(.*)$ [NC]
RewriteRule ^api/(.*)$ backend/public/index.php [L,QSA]

# Handle admin and other app routes - route to Next.js frontend
RewriteCond %{REQUEST_URI} ^/(admin|login|register|links|earnings|analytics|referrals|settings|refer|welcome)(/.*)?$ [NC]
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L,QSA]

# Handle static assets
RewriteCond %{REQUEST_URI} ^/(_next|favicon\.ico|.*\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot))$ [NC]
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L,QSA]

# Default route - serve from Next.js frontend
RewriteCond %{REQUEST_URI} !^/backend/
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L,QSA]
EOF

echo "✅ .htaccess created for proper routing"

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Configuration Summary:"
echo "- Project Directory: $PROJECT_DIR"
echo "- Frontend: Running on port 3001 via PM2"
echo "- Backend: Laravel API at /api/*"
echo "- Database: MySQL (falakcart database)"
echo ""
echo "🌐 URLs to test:"
echo "- Main site: https://togaar.com"
echo "- API health: https://togaar.com/api/health"
echo "- Admin panel: https://togaar.com/admin"
echo ""
echo "🔍 If still having issues:"
echo "1. Check PM2 logs: pm2 logs togaar-falakcart"
echo "2. Check Laravel logs: tail -f $BACKEND_DIR/storage/logs/laravel.log"
echo "3. Check Apache error logs"
echo "4. Verify aaPanel Document Root is set to: $PROJECT_DIR"
echo ""
echo "🚀 Next steps:"
echo "1. Test the website in your browser"
echo "2. Create admin user if needed: php artisan db:seed"
echo "3. Configure SSL certificate in aaPanel if not done"