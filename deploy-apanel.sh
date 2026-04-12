#!/bin/bash

echo "🚀 Starting aPanel deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: backend or frontend directory not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Setting up Backend (Laravel)...${NC}"

# Backend setup
cd backend

# Install PHP dependencies
if command -v composer &> /dev/null; then
    echo "Installing Composer dependencies..."
    composer install --no-dev --optimize-autoloader --no-interaction
else
    echo -e "${RED}❌ Composer not found! Please install Composer first.${NC}"
    exit 1
fi

# Create production .env if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        echo "Copying .env.production to .env..."
        cp .env.production .env
    else
        echo -e "${YELLOW}⚠️  Warning: No .env file found. Please create one manually.${NC}"
    fi
fi

# Generate application key if needed
php artisan key:generate --force

# Clear and cache config
echo "Optimizing Laravel..."
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set proper permissions
echo "Setting permissions..."
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/

echo -e "${GREEN}✅ Backend setup complete!${NC}"

# Frontend setup
echo -e "${YELLOW}🎨 Setting up Frontend (Next.js)...${NC}"
cd ../frontend

# Install Node dependencies
if command -v npm &> /dev/null; then
    echo "Installing NPM dependencies..."
    npm ci --production
else
    echo -e "${RED}❌ NPM not found! Please install Node.js first.${NC}"
    exit 1
fi

# Create production .env if it doesn't exist
if [ ! -f .env.production ]; then
    echo "NEXT_PUBLIC_API_URL=https://yourdomain.com/api" > .env.production
    echo -e "${YELLOW}⚠️  Created .env.production - please update the domain!${NC}"
fi

# Build the application
echo "Building Next.js application..."
npm run build

# Export static files
echo "Exporting static files..."
npm run export

echo -e "${GREEN}✅ Frontend setup complete!${NC}"

# Create .htaccess for Laravel in root
cd ..
echo "Creating .htaccess for Laravel..."
cat > .htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Handle Frontend Routes (Static Files)
    RewriteCond %{REQUEST_URI} ^/frontend/
    RewriteRule ^frontend/(.*)$ frontend/out/$1 [L]
    
    # Handle API Routes
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^(.*)$ backend/public/$1 [L]
    
    # Handle Backend Routes
    RewriteRule ^(.*)$ backend/public/$1 [L]
</IfModule>
EOF

echo -e "${GREEN}🎉 Deployment setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update backend/.env with your database credentials"
echo "2. Update frontend/.env.production with your domain"
echo "3. Run: php artisan migrate --force (in backend directory)"
echo "4. Run: php artisan db:seed --class=AdminSeeder --force"
echo ""
echo -e "${GREEN}🌐 Your application structure:${NC}"
echo "- API: https://yourdomain.com/api/"
echo "- Frontend: https://yourdomain.com/frontend/"
echo "- Admin: https://yourdomain.com/frontend/admin/"