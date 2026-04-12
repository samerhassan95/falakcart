@echo off
echo 🚀 Starting Affiliate System for Testing...
echo.

echo 📋 What this script does:
echo 1. Starts Laravel backend on http://localhost:8000
echo 2. Starts Next.js frontend on http://localhost:3000  
echo 3. Opens test page in browser
echo.

echo ⚠️  Make sure you have 2 terminal windows open:
echo.
echo Terminal 1: cd backend && php artisan serve
echo Terminal 2: cd frontend && npm run dev
echo.

pause

echo 🌐 Opening test page...
start FALAKCART_TEST_PAGE.html

echo 🎯 Opening affiliate dashboard...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo ✅ Ready to test! Follow the steps in FALAKCART_TEST_PAGE.html
echo.
echo 📚 Test Credentials:
echo Email: test1@example.com
echo Password: password123
echo.
pause