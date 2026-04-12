#!/bin/bash

echo "🚀 Starting deployment process..."

# Backend deployment
echo "📦 Preparing Laravel backend..."
cd backend

# Install dependencies
composer install --no-dev --optimize-autoloader

# Clear and cache config
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force

echo "✅ Backend ready!"

# Frontend deployment
echo "🎨 Building Next.js frontend..."
cd ../frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Export static files (if using static hosting)
npm run export

echo "✅ Frontend built!"

echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Upload backend/ folder to your domain root"
echo "2. Upload frontend/out/ folder to your frontend domain"
echo "3. Update .env files with production settings"
echo "4. Set up database and run migrations"