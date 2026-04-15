#!/bin/bash

echo "🚀 Quick Webhook Fix Deployment"
echo "==============================="

# Push local changes
echo "1️⃣ Pushing local changes..."
git add .
git commit -m "Fix webhook signature validation for FalakCart integration"
git push origin main

echo "✅ Local changes pushed to GitHub"
echo ""
echo "📋 Next steps on the server (togaar.com):"
echo "=========================================="
echo ""
echo "1. SSH to the server and run:"
echo "   cd /www/wwwroot/togaar.com"
echo "   git pull origin main"
echo ""
echo "2. Update .env file:"
echo "   cd backend"
echo "   nano .env"
echo "   # Add or update: WEBHOOK_SECRET=0KZwjBiG8SniS1wT6kfO13t6sspH2DRVXUaIdIxjbfs="
echo ""
echo "3. Clear caches:"
echo "   php artisan config:clear"
echo "   php artisan cache:clear"
echo "   php artisan route:clear"
echo "   composer dump-autoload"
echo ""
echo "4. Test the webhook:"
echo "   php test_external_signature.php"
echo ""
echo "🎯 After these steps, the webhook should work with signature validation!"