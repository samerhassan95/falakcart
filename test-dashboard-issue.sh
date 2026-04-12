#!/bin/bash

echo "🔍 Testing Dashboard Issue..."

echo "1. Testing PM2 status:"
pm2 list

echo -e "\n2. Testing PM2 logs (last 20 lines):"
pm2 logs togaar-falakcart --lines 20

echo -e "\n3. Testing Next.js server directly:"
curl -I http://127.0.0.1:3001/

echo -e "\n4. Testing API authentication:"
curl -I https://togaar.com/api/user

echo -e "\n5. Testing main site:"
curl -I https://togaar.com/

echo -e "\n6. Checking if port 3001 is actually in use:"
netstat -tulpn | grep :3001 || echo "Port 3001 not found in netstat"

echo -e "\n7. Testing with a simple GET request to Next.js:"
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/ || echo "Failed to connect"

echo -e "\n✅ Test complete. Check the results above."