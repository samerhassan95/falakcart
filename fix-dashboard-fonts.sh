#!/bin/bash

echo "🔧 Fixing Dashboard and Font Issues..."

# Navigate to frontend directory
cd /www/wwwroot/togaar.com/falakcart/frontend

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building frontend with font fixes..."
npm run build

echo "📁 Copying static assets manually..."
# Copy static files to standalone directory
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

echo "🔄 Restarting PM2..."
pm2 restart togaar-falakcart

echo "⏳ Waiting for PM2 to start..."
sleep 5

echo "🧪 Testing endpoints..."
echo "Testing main page:"
curl -I https://togaar.com/ 2>/dev/null | head -1

echo "Testing login page:"
curl -I https://togaar.com/login 2>/dev/null | head -1

echo "Testing API:"
curl -I https://togaar.com/api/user 2>/dev/null | head -1

echo "✅ Done! Check https://togaar.com now"