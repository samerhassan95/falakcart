# 🚨 URGENT: Fix togaar.com Deployment Issues

## Current Issues
1. **API returning 500 errors** - Laravel backend configuration problems
2. **Homepage 404** - PM2/routing issues  
3. **Missing APP_KEY** - Laravel application key not generated
4. **Database connection** - MySQL configuration issues

## Quick Fix (Run on Server)

SSH into your server and run these commands:

```bash
# Go to project directory
cd /www/wwwroot/togaar.com/falakcart

# Make scripts executable
chmod +x fix-server-issues.sh troubleshoot-togaar-complete.sh quick-fix-togaar.sh

# Run the quick fix
bash quick-fix-togaar.sh
```

## If Quick Fix Doesn't Work

Run the complete troubleshooting script:

```bash
bash troubleshoot-togaar-complete.sh
```

## Manual Steps (If Scripts Fail)

### 1. Fix Backend Laravel Issues

```bash
cd /www/wwwroot/togaar.com/falakcart/backend

# Generate missing keys
php artisan key:generate --force
php artisan jwt:secret --force

# Fix database connection in .env
nano .env
# Make sure these lines are uncommented and correct:
# DB_CONNECTION=mysql
# DB_HOST=localhost
# DB_PORT=3306
# DB_DATABASE=falakcart
# DB_USERNAME=falakcart
# DB_PASSWORD=falakcart

# Clear cache
php artisan config:clear
php artisan cache:clear
php artisan config:cache

# Test database
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database OK';"
```

### 2. Fix PM2 Frontend

```bash
cd /www/wwwroot/togaar.com/falakcart/frontend

# Restart PM2
pm2 stop togaar-falakcart
pm2 delete togaar-falakcart
pm2 start ecosystem.config.js
pm2 save

# Check status
pm2 status
pm2 logs togaar-falakcart
```

### 3. Test URLs

After fixes, test these URLs:
- https://togaar.com/api/health (should return JSON with "ok")
- https://togaar.com/ (should show FalakCart homepage)
- https://togaar.com/login (should show login page)

## Expected Results

✅ **API Health**: `{"status":"ok","message":"FalakCart API is running"}`  
✅ **Homepage**: FalakCart affiliate system homepage  
✅ **PM2 Status**: `togaar-falakcart` showing as `online`  

## If Still Having Issues

1. **Check PM2 logs**: `pm2 logs togaar-falakcart`
2. **Check Laravel logs**: `tail -f /www/wwwroot/togaar.com/falakcart/backend/storage/logs/laravel.log`
3. **Check Apache logs** in aaPanel
4. **Verify Document Root** in aaPanel is set to: `/www/wwwroot/togaar.com/falakcart`

## Test API Directly

Run this to test the Laravel backend directly:

```bash
cd /www/wwwroot/togaar.com/falakcart
php test-api-simple.php
```

## Contact Support

If these fixes don't resolve the issues, provide:
1. Output of `pm2 status`
2. Last 20 lines of `pm2 logs togaar-falakcart`
3. Last 20 lines of Laravel log
4. Result of testing https://togaar.com/api/health in browser