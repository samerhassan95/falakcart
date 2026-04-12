# دليل رفع المشروع من GitHub إلى aPanel

## 🎯 الهدف
رفع المشروع كاملاً (Backend + Frontend) من GitHub إلى aPanel في مكان واحد

## 📋 المتطلبات
- حساب GitHub
- aPanel مع دعم Git
- PHP 8.1+
- Node.js (اختياري للبناء المحلي)

## 🚀 خطوات الرفع

### 1. تحضير المشروع للـ GitHub

```bash
# في مجلد المشروع
git init
git add .
git commit -m "Initial commit - FalakCart Affiliate System"

# إنشاء repository على GitHub ثم:
git remote add origin https://github.com/yourusername/affiliate-system.git
git branch -M main
git push -u origin main
```

### 2. الرفع في aPanel

#### الطريقة الأولى: Git Clone
```bash
# في File Manager أو Terminal في aPanel
cd public_html
git clone https://github.com/yourusername/affiliate-system.git .

# تشغيل deployment script
chmod +x deploy-apanel.sh
./deploy-apanel.sh
```

#### الطريقة الثانية: aPanel Git Integration
1. اذهب إلى **Git Version Control** في aPanel
2. أضف repository URL: `https://github.com/yourusername/affiliate-system.git`
3. اختر branch: `main`
4. اختر destination: `public_html`
5. اضغط **Create**

### 3. إعداد البيئة

```bash
# إنشاء ملف .env للـ backend
cd backend
cp .env.production .env

# تحديث معلومات قاعدة البيانات
nano .env
```

### 4. إعداد قاعدة البيانات

```bash
# تشغيل migrations
cd backend
php artisan migrate --force
php artisan db:seed --class=AdminSeeder --force
```

### 5. بناء Frontend (اختياري)

```bash
# إذا كان Node.js متاح
cd frontend
npm install
npm run build
npm run export
```

## 🔧 إعدادات مهمة

### ملف .env للـ Backend
```env
APP_NAME="FalakCart Affiliate"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

JWT_SECRET=your-jwt-secret-here
```

### ملف .env.production للـ Frontend
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

## 🌐 هيكل URLs بعد الرفع

```
https://yourdomain.com/
├── api/                    # Laravel API
│   ├── auth/login
│   ├── affiliate/profile
│   └── ...
├── frontend/               # Next.js Frontend
│   ├── login/
│   ├── admin/
│   ├── analytics/
│   └── ...
└── admin                   # Direct admin access
```

## 🔄 تحديث المشروع

### من GitHub
```bash
# في aPanel terminal
cd public_html
git pull origin main
./deploy-apanel.sh
```

### Auto-deployment (إذا كان متاح)
1. اذهب إلى **Git Version Control**
2. اختر repository
3. اضغط **Pull**

## ✅ اختبار المشروع

### 1. اختبار API
```bash
curl https://yourdomain.com/api/health
```

### 2. اختبار Frontend
- افتح: `https://yourdomain.com/frontend/`
- جرب تسجيل الدخول
- تحقق من dashboard

### 3. اختبار Admin
- افتح: `https://yourdomain.com/frontend/admin/`
- استخدم: `admin@example.com` / `password`

## 🛠 حل المشاكل الشائعة

### خطأ 500
```bash
# تحقق من logs
tail -f backend/storage/logs/laravel.log

# تحقق من الصلاحيات
chmod -R 755 backend/storage/
chmod -R 755 backend/bootstrap/cache/
```

### خطأ Database
```bash
# تحقق من الاتصال
cd backend
php artisan tinker
DB::connection()->getPdo();
```

### خطأ Frontend
```bash
# تحقق من build
cd frontend
ls -la out/
```

## 📱 مميزات هذا الحل

✅ **مشروع واحد**: Backend و Frontend في مكان واحد  
✅ **سهولة التحديث**: `git pull` واحد يحدث كل شيء  
✅ **إدارة موحدة**: ملف واحد للـ deployment  
✅ **URLs منظمة**: `/api/` للـ backend، `/frontend/` للـ frontend  
✅ **أمان عالي**: ملفات حساسة محمية  

## 🎉 النتيجة النهائية

بعد اتباع هذه الخطوات، ستحصل على:
- نظام أفلييت كامل يعمل من مكان واحد
- API قوي مع Laravel
- واجهة مستخدم حديثة مع Next.js
- سهولة في التحديث والصيانة