#!/bin/bash

echo "🔄 Updating togaar.com server with webhook fixes"
echo "==============================================="

# Navigate to project directory
cd /www/wwwroot/togaar.com

# Pull latest changes
echo "1️⃣ Pulling latest changes from GitHub..."
git pull origin main

# Navigate to backend
cd backend

# Clear all caches
echo "2️⃣ Clearing Laravel caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Update composer autoload
echo "3️⃣ Updating composer autoload..."
composer dump-autoload

# Test webhook
echo "4️⃣ Testing webhook with signature validation..."
php test_external_signature.php

echo ""
echo "✅ Server update completed!"
echo ""
echo "📋 Next steps:"
echo "- Test webhook with FalakCart team"
echo "- Monitor logs: tail -f storage/logs/laravel.log"
echo "- Check webhook URL: https://togaar.com/api/webhook/falakcart"