#!/bin/bash

echo "🚀 Deploying Dashboard Fix to Server..."

# Commands to run on server
cat << 'EOF'
# Navigate to project directory
cd /www/wwwroot/togaar.com/falakcart

# Pull latest changes
git pull origin main

# Make scripts executable
chmod +x fix-dashboard-fonts.sh

# Run the fix script
./fix-dashboard-fonts.sh

# Check PM2 status
pm2 status

echo "✅ Deployment complete! Test at https://togaar.com"
EOF