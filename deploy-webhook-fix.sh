#!/bin/bash

echo "🚀 Deploying Webhook Signature Fix"
echo "=================================="

# Clear all caches
echo "1️⃣ Clearing caches..."
cd backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Update composer autoload
echo "2️⃣ Updating autoload..."
composer dump-autoload

# Test the webhook locally
echo "3️⃣ Testing webhook locally..."
php test_signature_locally.php

# Test external webhook
echo "4️⃣ Testing external webhook..."
php test_external_signature.php

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "- If external test still fails, restart web server"
echo "- Check server logs for any errors"
echo "- Verify .env file has correct WEBHOOK_SECRET"