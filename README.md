# 🚀 FalakCart Affiliate System

نظام متكامل لإدارة برنامج الإحالة (Affiliate) لموقع FalakCart مع لوحة تحكم للأفلييت والإدارة.

---

## 📋 المحتويات

- [نظرة عامة](#نظرة-عامة)
- [الميزات](#الميزات)
- [التقنيات المستخدمة](#التقنيات-المستخدمة)
- [التثبيت](#التثبيت)
- [التكامل مع FalakCart](#التكامل-مع-falakcart)
- [الوثائق](#الوثائق)
- [الدعم](#الدعم)

---

## 🎯 نظرة عامة

نظام Affiliate كامل يسمح لك بـ:
- إنشاء برنامج إحالة لموقع FalakCart
- تتبع الضغطات والمبيعات تلقائياً
- حساب العمولات بشكل ديناميكي
- إدارة الأفلييت والمستخدمين
- عرض تقارير وإحصائيات مفصلة

---

## ✨ الميزات

### للأفلييت (Affiliates)
- ✅ لوحة تحكم شاملة مع إحصائيات في الوقت الفعلي
- ✅ إنشاء روابط إحالة مخصصة
- ✅ تتبع الضغطات والمبيعات
- ✅ عرض العمولات والأرباح
- ✅ طلب سحب الأرباح
- ✅ تقارير تفصيلية وتحليلات
- ✅ إدارة الملف الشخصي والإعدادات

### للإدارة (Admin)
- ✅ لوحة تحكم إدارية متقدمة
- ✅ إدارة جميع الأفلييت والمستخدمين
- ✅ تعديل معدلات العمولة (ثابتة أو متدرجة)
- ✅ تفعيل/تعطيل حسابات الأفلييت
- ✅ عرض إحصائيات شاملة للنظام
- ✅ تصدير البيانات (CSV)
- ✅ إنشاء مستخدمين جدد

### التتبع التلقائي
- ✅ تتبع الضغطات عبر JavaScript
- ✅ تسجيل المبيعات تلقائياً
- ✅ حساب العمولات ديناميكياً
- ✅ دعم Webhooks للتكامل
- ✅ صلاحية 30 يوم للإحالات

---

## 🛠️ التقنيات المستخدمة

### Backend
- **Laravel 11** - PHP Framework
- **MySQL** - قاعدة البيانات
- **JWT** - المصادقة
- **RESTful API** - واجهة برمجية

### Frontend
- **Next.js 15** - React Framework
- **TypeScript** - لغة البرمجة
- **Tailwind CSS** - التصميم
- **Recharts** - الرسوم البيانية
- **Axios** - HTTP Client

---

## 📦 التثبيت

### المتطلبات
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 8.0+

### 1. Backend Setup

```bash
# الانتقال لمجلد Backend
cd backend

# تثبيت Dependencies
composer install

# نسخ ملف البيئة
cp .env.example .env

# توليد مفتاح التطبيق
php artisan key:generate

# توليد JWT Secret
php artisan jwt:secret

# إعداد قاعدة البيانات في .env
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# تشغيل Migrations
php artisan migrate

# إنشاء Admin User
php artisan db:seed --class=AdminSeeder

# تشغيل السيرفر
php artisan serve
```

### 2. Frontend Setup

```bash
# الانتقال لمجلد Frontend
cd frontend

# تثبيت Dependencies
npm install

# نسخ ملف البيئة
cp .env.example .env.local

# تحديث API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# تشغيل السيرفر
npm run dev
```

### 3. الوصول للنظام

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api

**بيانات الدخول الافتراضية:**
- Admin: `admin@falakcart.com` / `password`
- Affiliate: `samer@gmail.com` / `password`

---

## 🔗 التكامل مع FalakCart

### الخطوات الأساسية:

1. **إضافة Tracking Script** في صفحة التسجيل
2. **إضافة Sale Tracking** عند نجاح الاشتراك
3. **إعداد Webhook** للتحديثات التلقائية

**للتفاصيل الكاملة، راجع:**
- 📘 [دليل التكامل الكامل](COMPLETE_INTEGRATION_GUIDE.md)
- 🚀 [دليل البدء السريع](QUICK_START_INTEGRATION.md)

---

## 📚 الوثائق

| الملف | الوصف |
|-------|-------|
| [COMPLETE_INTEGRATION_GUIDE.md](COMPLETE_INTEGRATION_GUIDE.md) | دليل التكامل الشامل والمفصل |
| [QUICK_START_INTEGRATION.md](QUICK_START_INTEGRATION.md) | دليل البدء السريع (5 خطوات) |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | توثيق كامل لجميع API Endpoints |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | قائمة التحقق قبل النشر |
| [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) | دليل استكشاف الأخطاء |
| [FALAKCART_TRACKING_SCRIPT.js](FALAKCART_TRACKING_SCRIPT.js) | سكريبت التتبع الجاهز |

---

## 🧪 الاختبار

### اختبار التكامل
```bash
# 1. افتح لينك إحالة
https://falakcart.com/register?ref=TEST123

# 2. تحقق من تسجيل Click
SELECT * FROM clicks WHERE referral_code = 'TEST123';

# 3. أكمل عملية اشتراك

# 4. تحقق من تسجيل Sale
SELECT * FROM sales WHERE affiliate_id IN (
    SELECT id FROM affiliates WHERE referral_code = 'TEST123'
);
```

---

## 🚀 النشر على Production

راجع [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) للحصول على قائمة كاملة.

### خطوات سريعة:

```bash
# Backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
npm run build
npm run start
```

---

## 🔒 الأمان

- ✅ JWT Authentication
- ✅ CORS Protection
- ✅ Rate Limiting
- ✅ SQL Injection Prevention
- ✅ XSS Protection
- ✅ CSRF Protection
- ✅ Webhook Signature Verification

---

## 📊 الإحصائيات

النظام يتتبع:
- عدد الضغطات (Clicks)
- عدد الإحالات (Referrals)
- عدد الاشتراكات (Subscriptions)
- إجمالي الأرباح (Earnings)
- معدل التحويل (Conversion Rate)
- الأرصدة (Balances)

---

## 🐛 الإبلاغ عن الأخطاء

إذا وجدت خطأ:
1. تحقق من [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)
2. ابحث في Issues الموجودة
3. أنشئ Issue جديد مع:
   - وصف المشكلة
   - خطوات إعادة الإنتاج
   - رسائل الخطأ
   - معلومات البيئة

---

## 📞 الدعم

- **Documentation:** راجع ملفات الوثائق أعلاه
- **Email:** support@your-domain.com

---

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License.

---

## 👥 الفريق

تم تطوير هذا النظام بواسطة فريق FalakCart.

---

## 📈 خارطة الطريق

### الإصدارات القادمة:
- [ ] دعم عملات متعددة
- [ ] تطبيق موبايل للأفلييت
- [ ] تكامل مع منصات التواصل الاجتماعي
- [ ] نظام إشعارات متقدم
- [ ] تقارير مخصصة
- [ ] API للتكامل مع أنظمة خارجية

---

**🎉 مبروك! نظامك جاهز للعمل!**

للبدء، راجع [QUICK_START_INTEGRATION.md](QUICK_START_INTEGRATION.md)
