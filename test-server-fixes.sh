#!/bin/bash

# Test script to verify server fixes
# Run this after fix-server-issues.sh

echo "🧪 Testing FalakCart Server Fixes..."
echo "=================================="

PROJECT_DIR="/www/wwwroot/togaar.com/falakcart"
BACKEND_DIR="$PROJECT_DIR/backend"

# Test 1: Check if backend API is responding
echo "1️⃣ Testing Backend API Health..."
cd $BACKEND_DIR
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "https://togaar.com/api/health" -o /tmp/health_response.json)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Backend API health check passed"
    cat /tmp/health_response.json | jq . 2>/dev/null || cat /tmp/health_response.json
else
    echo "❌ Backend API health check failed (HTTP $HEALTH_RESPONSE)"
    cat /tmp/health_response.json 2>/dev/null || echo "No response body"
fi

# Test 2: Check if admin notifications endpoint exists
echo ""
echo "2️⃣ Testing Admin Notifications Endpoint..."
NOTIF_RESPONSE=$(curl -s -w "%{http_code}" "https://togaar.com/api/admin/notifications" \
    -H "Authorization: Bearer test-token" \
    -o /tmp/notif_response.json)
if [ "$NOTIF_RESPONSE" = "401" ]; then
    echo "✅ Admin notifications endpoint exists (401 Unauthorized - expected without valid token)"
elif [ "$NOTIF_RESPONSE" = "200" ]; then
    echo "✅ Admin notifications endpoint working"
else
    echo "❌ Admin notifications endpoint issue (HTTP $NOTIF_RESPONSE)"
    cat /tmp/notif_response.json 2>/dev/null || echo "No response body"
fi

# Test 3: Check PM2 status
echo ""
echo "3️⃣ Testing PM2 Frontend Status..."
if pm2 list | grep -q "togaar-falakcart.*online"; then
    echo "✅ PM2 frontend process is running"
    pm2 list | grep togaar-falakcart
else
    echo "❌ PM2 frontend process not running"
    echo "PM2 processes:"
    pm2 list
fi

# Test 4: Check if frontend is responding
echo ""
echo "4️⃣ Testing Frontend Response..."
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" "http://localhost:3001" -o /tmp/frontend_response.html)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ Frontend responding on port 3001"
    if grep -q "FalakCart\|Falak" /tmp/frontend_response.html; then
        echo "✅ Frontend content looks correct"
    else
        echo "⚠️ Frontend responding but content may be incorrect"
    fi
else
    echo "❌ Frontend not responding (HTTP $FRONTEND_RESPONSE)"
fi

# Test 5: Check database connection
echo ""
echo "5️⃣ Testing Database Connection..."
cd $BACKEND_DIR
if php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database OK';" 2>/dev/null | grep -q "Database OK"; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection failed"
fi

# Test 6: Check Laravel routes
echo ""
echo "6️⃣ Testing Laravel Routes..."
if php artisan route:list | grep -q "api/admin/notifications"; then
    echo "✅ Admin notifications route registered"
else
    echo "❌ Admin notifications route not found"
fi

# Test 7: Check .htaccess routing
echo ""
echo "7️⃣ Testing .htaccess Routing..."
if [ -f "$PROJECT_DIR/.htaccess" ]; then
    echo "✅ .htaccess file exists"
    if grep -q "api/.*backend/public" "$PROJECT_DIR/.htaccess"; then
        echo "✅ API routing configured"
    else
        echo "❌ API routing not configured in .htaccess"
    fi
else
    echo "❌ .htaccess file missing"
fi

echo ""
echo "🎯 Test Summary Complete!"
echo "========================"
echo "If all tests pass, your FalakCart installation should be working."
echo "If any tests fail, check the logs:"
echo "- Laravel logs: $BACKEND_DIR/storage/logs/laravel.log"
echo "- PM2 logs: pm2 logs togaar-falakcart"
echo "- Apache logs: Check your aaPanel error logs"

# Cleanup temp files
rm -f /tmp/health_response.json /tmp/notif_response.json /tmp/frontend_response.html