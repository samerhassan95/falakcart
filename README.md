# 🚀 FalakCart Affiliate System

نظام Affiliate متكامل لموقع FalakCart مع لوحة تحكم للأفلييت والإدارة.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Laravel](https://img.shields.io/badge/Laravel-11.x-red.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.x-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)

---

## 📋 المحتويات

- [نظرة عامة](#نظرة-عامة)
- [المميزات](#المميزات)
- [التقنيات المستخدمة](#التقنيات-المستخدمة)
- [التثبيت](#التثبيت)
- [الإعداد](#الإعداد)
- [الاستخدام](#الاستخدام)
- [التكامل مع FalakCart](#التكامل-مع-falakcart)
- [API Documentation](#api-documentation)
- [المساهمة](#المساهمة)
- [الترخيص](#الترخيص)

---

## 🎯 نظرة عامة

نظام Affiliate شامل يسمح للمسوقين بالترويج لمنتجات FalakCart والحصول على عمولات. يتضمن:

- **لوحة تحكم للأفلييت**: تتبع الأداء، الروابط، الأرباح
- **لوحة تحكم للإدارة**: إدارة الأفلييت، العمولات، التقارير
- **نظام تتبع متقدم**: تتبع الضغطات والمبيعات تلقائياً
- **نظام عمولات مرن**: عمولات ثابتة أو نسبية مع مستويات

---

## ✨ المميزات

### للأفلييت:
- ✅ لوحة تحكم شاملة مع إحصائيات في الوقت الفعلي
- ✅ إنشاء روابط مخصصة غير محدودة
- ✅ تتبع الضغطات والتحويلات
- ✅ عرض الأرباح والمدفوعات
- ✅ تقارير تحليلية مفصلة
- ✅ إدارة الملف الشخصي والإعدادات
- ✅ نظام إشعارات

### للإدارة:
- ✅ إدارة جميع الأفلييت
- ✅ تعديل العمولات والمستويات
- ✅ تفعيل/تعطيل الحسابات
- ✅ تقارير شاملة وتحليلات
- ✅ تصدير البيانات CSV
- ✅ إدارة المستخدمين
- ✅ مراقبة الأداء

### التقنية:
- ✅ تتبع تلقائي للضغطات والمبيعات
- ✅ Webhook للتكامل مع أنظمة الدفع
- ✅ API RESTful كامل
- ✅ JWT Authentication
- ✅ CORS Support
- ✅ Rate Limiting
- ✅ Logging شامل

---

## 🛠 التقنيات المستخدمة

### Backend:
- **Laravel 11.x** - PHP Framework
- **SQLite** - Database
- **JWT** - Authentication
- **Laravel Sanctum** - API Authentication

### Frontend:
- **Next.js 15.x** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Recharts** - Data Visualization
- **Axios** - HTTP Client
- **Lucide Icons** - Icons

---

## 📦 التثبيت

### المتطلبات:
- PHP >= 8.2
- Composer
- Node.js >= 18.x
- npm أو yarn

### 1. Clone المشروع

```bash
git clone https://github.com/your-username/falakcart-affiliate.git
cd falakcart-affiliate
```

### 2. تثبيت Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

الـ Backend سيعمل على: `http://127.0.0.1:8000`

### 3. تثبيت Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

الـ Frontend سيعمل على: `http://localhost:3000`

---

## ⚙️ الإعداد

### Backend Configuration

**ملف `.env`:**

```env
APP_NAME="FalakCart Affiliate"
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=sqlite

# FalakCart Integration
FALAKCART_MAIN_URL=https://falakcart.com
WEBHOOK_SECRET=your-secure-webhook-secret

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_TTL=60
```

### Frontend Configuration

**ملف `.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

### الحسابات الافتراضية

بعد تشغيل `php artisan migrate --seed`:

**Admin:**
- Email: `admin@falakcart.com`
- Password: `password`

**Affiliate:**
- Email: `samer@gmail.com`
- Password: `password`

---

## 🚀 الاستخدام

### تسجيل الدخول

1. افتح `http://localhost:3000/login`
2. استخدم أحد الحسابات الافتراضية
3. ستُوجه إلى Dashboard المناسب

### إنشاء Affiliate جديد

```bash
# من خلال Admin Dashboard
1. سجل دخول كـ Admin
2. اذهب إلى Users Tab
3. اضغط "Add Admin" أو استخدم API

# أو من خلال API
POST /api/admin/users
{
  "name": "New Affiliate",
  "email": "affiliate@example.com",
  "password": "password",
  "role": "affiliate"
}
```

### إنشاء رابط Affiliate

```bash
# من خلال Dashboard
1. سجل دخول كـ Affiliate
2. اذهب إلى "My Links"
3. اضغط "Create New Link"

# أو من خلال API
POST /api/affiliate/links
{
  "name": "Summer Campaign",
  "slug": "summer2024"
}
```

---

## 🔗 التكامل مع FalakCart

للتكامل الكامل مع موقع FalakCart الرئيسي، راجع:

- **[دليل التكامل الكامل](COMPLETE_INTEGRATION_GUIDE.md)** - شرح مفصل لكل الخطوات
- **[دليل البدء السريع](QUICK_START_INTEGRATION.md)** - 5 خطوات للبدء
- **[Tracking Script](FALAKCART_TRACKING_SCRIPT.js)** - السكريبت الجاهز

### الخطوات الأساسية:

1. أضف tracking script لصفحة التسجيل
2. أضف sale tracking لصفحة نجاح الدفع
3. اعمل webhook للتحديثات التلقائية
4. اختبر النظام

---

## 📚 API Documentation

### Authentication

```bash
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/user
```

### Affiliate Endpoints

```bash
GET  /api/affiliate/profile
GET  /api/affiliate/stats
GET  /api/affiliate/links
POST /api/affiliate/links
GET  /api/affiliate/referrals
GET  /api/affiliate/earnings
```

### Admin Endpoints

```bash
GET  /api/admin/summary
GET  /api/admin/affiliates
POST /api/admin/affiliates
PUT  /api/admin/affiliates/{id}/status
PUT  /api/admin/affiliates/{id}/commission
GET  /api/admin/users
GET  /api/admin/clicks
GET  /api/admin/export
```

### Tracking Endpoints

```bash
POST /api/track/click
POST /api/track/sale
```

للتفاصيل الكاملة، راجع [API Documentation](docs/API.md)

---

## 📊 قاعدة البيانات

### الجداول الرئيسية:

- `users` - المستخدمين (Admin & Affiliates)
- `affiliates` - بيانات الأفلييت
- `affiliate_links` - الروابط المخصصة
- `clicks` - تتبع الضغطات
- `sales` - المبيعات والعمولات
- `transactions` - المعاملات المالية
- `notifications` - الإشعارات

---

## 🧪 الاختبار

### اختبار Backend

```bash
cd backend
php artisan test
```

### اختبار Frontend

```bash
cd frontend
npm run test
```

### اختبار التكامل

```bash
# اختبار تتبع الضغطات
curl -X POST http://127.0.0.1:8000/api/track/click \
  -H "Content-Type: application/json" \
  -d '{"referral_code": "TEST123"}'

# اختبار تتبع المبيعات
curl -X POST http://127.0.0.1:8000/api/track/sale \
  -H "Content-Type: application/json" \
  -d '{
    "referral_code": "TEST123",
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "amount": 99.00
  }'
```

---

## 🔒 الأمان

- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ CORS Protection
- ✅ Rate Limiting
- ✅ SQL Injection Protection
- ✅ XSS Protection
- ✅ CSRF Protection
- ✅ Webhook Signature Verification

---

## 📈 الأداء

- ✅ Database Indexing
- ✅ Query Optimization
- ✅ Caching (Redis ready)
- ✅ Lazy Loading
- ✅ Code Splitting
- ✅ Image Optimization

---

## 🤝 المساهمة

نرحب بالمساهمات! للمساهمة:

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للـ branch (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

---

## 📝 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE)

---

## 👥 الفريق

- **Developer**: Your Name
- **Designer**: Designer Name
- **Project Manager**: PM Name

---

## 📞 الدعم

للدعم والاستفسارات:

- 📧 Email: support@falakcart.com
- 🌐 Website: https://falakcart.com
- 💬 Discord: [Join our server](https://discord.gg/falakcart)

---

## 🙏 شكر خاص

- Laravel Community
- Next.js Team
- جميع المساهمين في المشروع

---

## 📸 Screenshots

### Affiliate Dashboard
![Affiliate Dashboard](docs/screenshots/affiliate-dashboard.png)

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

### Analytics
![Analytics](docs/screenshots/analytics.png)

---

**Made with ❤️ by FalakCart Team**
