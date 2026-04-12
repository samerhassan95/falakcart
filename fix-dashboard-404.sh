#!/bin/bash

echo "🔧 Fixing Dashboard 404 Issue - Final Fix"

# Navigate to project root
cd /www/wwwroot/togaar.com/falakcart

echo "📁 Current directory: $(pwd)"

# Stop PM2 process
echo "🛑 Stopping PM2 process..."
pm2 stop togaar-falakcart 2>/dev/null || echo "Process not running"

# Navigate to frontend directory
cd frontend

echo "🧹 Cleaning previous build..."
rm -rf .next

echo "🏗️ Building with updated configuration..."
npm run build

# Check if standalone server was created
if [ -f ".next/standalone/server.js" ]; then
    echo "✅ Standalone server created successfully"
    
    echo "🚀 Starting PM2 with new configuration..."
    pm2 start ecosystem.config.js
    
    echo "� PM2 Status:"
    pm2 status
    
    echo "🔍 Testing endpoints..."
    sleep 3
    
    echo "Testing localhost:3001:"
    curl -I http://localhost:3001/ 2>/dev/null | head -1 || echo "Server not responding yet"
    
    echo "Testing main domain:"
    curl -I https://togaar.com/ 2>/dev/null | head -1 || echo "Domain not responding"
    
    echo "Testing login page:"
    curl -I https://togaar.com/login 2>/dev/null | head -1 || echo "Login not responding"
    
    echo ""
    echo "✅ Dashboard 404 fix completed!"
    echo "🌐 Please test: https://togaar.com"
    echo ""
    echo "📝 Changes made:"
    echo "   - Removed trailingSlash and esmExternals from Next.js config"
    echo "   - Added forceSwcTransforms for better compatibility"
    echo "   - Rebuilt with optimized standalone configuration"
    
else
    echo "❌ Error: Standalone server not created"
    echo "Build may have failed. Check the build output above."
    exit 1
fi