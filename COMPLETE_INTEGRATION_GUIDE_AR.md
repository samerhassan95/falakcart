# دليل التكامل الشامل - نظام الأفلييت مع فلك كارت

## نظرة عامة

هذا الدليل يوضح بالتفصيل كيفية ربط نظام الأفلييت مع منصة فلك كارت للتجارة الإلكترونية. النظام يتيح تتبع الإحالات، حساب العمولات، والمدفوعات التلقائية مع مزامنة كاملة للبيانات.

## الهدف من التكامل

- **تتبع تلقائي للزيارات**: كل زائر يأتي من رابط أفلييت يتم تتبعه
- **تسجيل المبيعات**: كل عملية شراء تتم من خلال أفلييت تُسجل تلقائياً
- **حساب العمولات**: العمولات تُحسب وتُضاف للأفلييت فوراً
- **إحصائيات مباشرة**: البيانات تظهر في لوحة التحكم فوراً
- **مدفوعات آلية**: نظام دفع العمولات للأفلييت

## فهرس المحتويات

1. [متطلبات النظام](#متطلبات-النظام)
2. [إعداد قاعدة البيانات](#إعداد-قاعدة-البيانات)
3. [إعداد الباك إند](#إعداد-الباك-إند)
4. [إعداد الفرونت إند](#إعداد-الفرونت-إند)
5. [تكامل التتبع](#تكامل-التتبع)
6. [ربط فلك كارت](#ربط-فلك-كارت)
7. [اختبار النظام](#اختبار-النظام)
8. [النشر والتشغيل](#النشر-والتشغيل)
9. [حل المشاكل](#حل-المشاكل)

## هيكل النظام

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   فلك كارت      │    │  نظام الأفلييت   │    │ لوحة الأفلييت    │
│   التجارة       │◄──►│   (Laravel)     │◄──►│   (Next.js)     │
│   الإلكترونية    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ سكريبت التتبع    │    │   قاعدة البيانات │    │  لوحة الإدارة    │
│  (JavaScript)   │    │ (MySQL/SQLite)  │    │   (Next.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## متطلبات النظام

### المتطلبات التقنية

- **PHP**: 8.1 أو أحدث
- **Node.js**: 18.0 أو أحدث  
- **قاعدة البيانات**: MySQL 8.0+ أو SQLite 3.35+
- **خادم الويب**: Apache/Nginx
- **شهادة SSL**: مطلوبة للإنتاج

### الأدوات المطلوبة

- **Composer**: لإدارة حزم PHP
- **NPM/Yarn**: لإدارة حزم JavaScript
- **Git**: لإدارة الكود
- **Terminal/CMD**: لتنفيذ الأوامر

## إعداد قاعدة البيانات

### الخطوة 1: إنشاء قاعدة البيانات

```sql
-- إنشاء قاعدة البيانات
CREATE DATABASE affiliate_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE affiliate_system;
```

### الخطوة 2: إنشاء الجداول الأساسية

```sql
-- جدول المستخدمين
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'اسم المستخدم',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'البريد الإلكتروني',
    password VARCHAR(255) NOT NULL COMMENT 'كلمة المرور',
    role ENUM('admin', 'affiliate', 'user') DEFAULT 'user' COMMENT 'نوع المستخدم',
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL
);

-- جدول الأفلييت
CREATE TABLE affiliates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'معرف المستخدم',
    referral_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'كود الإحالة',
    status ENUM('active', 'pending', 'suspended') DEFAULT 'pending' COMMENT 'حالة الأفلييت',
    commission_rate DECIMAL(5,2) DEFAULT 10.00 COMMENT 'معدل العمولة',
    commission_type ENUM('percentage', 'fixed') DEFAULT 'percentage' COMMENT 'نوع العمولة',
    commission_strategy ENUM('flat', 'tier_referrals', 'tier_volume') DEFAULT 'flat' COMMENT 'استراتيجية العمولة',
    commission_tiers JSON NULL COMMENT 'مستويات العمولة',
    total_earnings DECIMAL(10,2) DEFAULT 0.00 COMMENT 'إجمالي الأرباح',
    pending_balance DECIMAL(10,2) DEFAULT 0.00 COMMENT 'الرصيد المعلق',
    current_balance DECIMAL(10,2) DEFAULT 0.00 COMMENT 'الرصيد الحالي',
    bank_name VARCHAR(255) NULL COMMENT 'اسم البنك',
    bank_account VARCHAR(255) NULL COMMENT 'رقم الحساب البنكي',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_referral_code (referral_code),
    INDEX idx_status (status)
);

-- جدول النقرات
CREATE TABLE clicks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id BIGINT UNSIGNED NOT NULL COMMENT 'معرف الأفلييت',
    ip_address VARCHAR(45) NOT NULL COMMENT 'عنوان IP',
    user_agent TEXT NULL COMMENT 'معلومات المتصفح',
    referrer_url TEXT NULL COMMENT 'الرابط المرجعي',
    landing_page TEXT NULL COMMENT 'صفحة الهبوط',
    country VARCHAR(2) NULL COMMENT 'الدولة',
    device_type ENUM('desktop', 'mobile', 'tablet') NULL COMMENT 'نوع الجهاز',
    created_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
    INDEX idx_affiliate_id (affiliate_id),
    INDEX idx_created_at (created_at)
);

-- جدول المبيعات
CREATE TABLE sales (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id BIGINT UNSIGNED NOT NULL COMMENT 'معرف الأفلييت',
    order_id VARCHAR(255) NOT NULL COMMENT 'رقم الطلب في فلك كارت',
    customer_email VARCHAR(255) NULL COMMENT 'بريد العميل',
    customer_name VARCHAR(255) NULL COMMENT 'اسم العميل',
    customer_phone VARCHAR(20) NULL COMMENT 'هاتف العميل',
    amount DECIMAL(10,2) NOT NULL COMMENT 'قيمة الطلب',
    commission_amount DECIMAL(10,2) NOT NULL COMMENT 'قيمة العمولة',
    status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending' COMMENT 'حالة العمولة',
    falakcart_data JSON NULL COMMENT 'بيانات إضافية من فلك كارت',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_order_affiliate (order_id, affiliate_id),
    INDEX idx_affiliate_id (affiliate_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- جدول روابط الأفلييت
CREATE TABLE affiliate_links (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id BIGINT UNSIGNED NOT NULL COMMENT 'معرف الأفلييت',
    name VARCHAR(255) NOT NULL COMMENT 'اسم الرابط',
    slug VARCHAR(255) UNIQUE NOT NULL COMMENT 'الرابط المختصر',
    url TEXT NOT NULL COMMENT 'الرابط الكامل',
    clicks_count INT DEFAULT 0 COMMENT 'عدد النقرات',
    conversions_count INT DEFAULT 0 COMMENT 'عدد التحويلات',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'حالة الرابط',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
    INDEX idx_affiliate_id (affiliate_id),
    INDEX idx_slug (slug)
);

-- جدول المعاملات المالية
CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id BIGINT UNSIGNED NOT NULL COMMENT 'معرف الأفلييت',
    type ENUM('commission', 'payout', 'adjustment', 'bonus') NOT NULL COMMENT 'نوع المعاملة',
    amount DECIMAL(10,2) NOT NULL COMMENT 'المبلغ',
    description TEXT NULL COMMENT 'وصف المعاملة',
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending' COMMENT 'حالة المعاملة',
    reference_id VARCHAR(255) NULL COMMENT 'رقم مرجعي',
    metadata JSON NULL COMMENT 'بيانات إضافية',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
    INDEX idx_affiliate_id (affiliate_id),
    INDEX idx_type (type),
    INDEX idx_status (status)
);

-- جدول الإشعارات
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'معرف المستخدم',
    title VARCHAR(255) NOT NULL COMMENT 'عنوان الإشعار',
    message TEXT NOT NULL COMMENT 'نص الإشعار',
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info' COMMENT 'نوع الإشعار',
    read_at TIMESTAMP NULL DEFAULT NULL COMMENT 'وقت القراءة',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_read_at (read_at)
);

-- جدول إعدادات النظام
CREATE TABLE system_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(255) UNIQUE NOT NULL COMMENT 'اسم الإعداد',
    value TEXT NULL COMMENT 'قيمة الإعداد',
    description TEXT NULL COMMENT 'وصف الإعداد',
    type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT 'نوع البيانات',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_key_name (key_name)
);
```

### الخطوة 3: إدراج البيانات الأساسية

```sql
-- إنشاء مستخدم الإدارة
INSERT INTO users (name, email, password, role, email_verified_at, created_at, updated_at) 
VALUES ('مدير النظام', 'admin@falakcart.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NOW(), NOW(), NOW());

-- إعدادات النظام الأساسية
INSERT INTO system_settings (key_name, value, description, type, created_at, updated_at) VALUES
('default_commission_rate', '10.00', 'معدل العمولة الافتراضي', 'number', NOW(), NOW()),
('minimum_payout', '50.00', 'الحد الأدنى للسحب', 'number', NOW(), NOW()),
('cookie_duration', '30', 'مدة الكوكيز بالأيام', 'number', NOW(), NOW()),
('auto_approve_affiliates', 'false', 'الموافقة التلقائية على الأفلييت', 'boolean', NOW(), NOW()),
('falakcart_api_url', 'https://api.falakcart.com', 'رابط API فلك كارت', 'string', NOW(), NOW()),
('falakcart_api_key', '', 'مفتاح API فلك كارت', 'string', NOW(), NOW());
```
## إعداد الباك إند (Laravel)

### الخطوة 1: تثبيت Laravel والحزم المطلوبة

```bash
# إنشاء مشروع Laravel جديد
composer create-project laravel/laravel affiliate-backend
cd affiliate-backend

# تثبيت الحزم المطلوبة
composer require tymon/jwt-auth
composer require laravel/sanctum
composer require guzzlehttp/guzzle
composer require intervention/image
```

### الخطوة 2: إعداد ملف البيئة

```env
# .env
APP_NAME="نظام الأفلييت"
APP_ENV=production
APP_KEY=base64:your-app-key-here
APP_DEBUG=false
APP_URL=https://affiliate.yourdomain.com

# قاعدة البيانات
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=affiliate_system
DB_USERNAME=your_username
DB_PASSWORD=your_password

# JWT إعدادات
JWT_SECRET=your-jwt-secret-here
JWT_TTL=1440

# فلك كارت API
FALAKCART_API_URL=https://api.falakcart.com
FALAKCART_API_KEY=your-falakcart-api-key
FALAKCART_WEBHOOK_SECRET=your-webhook-secret

# البريد الإلكتروني
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="نظام الأفلييت"

# إعدادات الجلسة
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=.yourdomain.com

# إعدادات CORS
SANCTUM_STATEFUL_DOMAINS=localhost:3000,yourdomain.com,www.yourdomain.com
```

### الخطوة 3: إنشاء النماذج (Models)

#### نموذج الأفلييت

```php
<?php
// app/Models/Affiliate.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Affiliate extends Model
{
    protected $fillable = [
        'user_id',
        'referral_code',
        'status',
        'commission_rate',
        'commission_type',
        'commission_strategy',
        'commission_tiers',
        'total_earnings',
        'pending_balance',
        'current_balance',
        'bank_name',
        'bank_account'
    ];

    protected $casts = [
        'commission_tiers' => 'array',
        'total_earnings' => 'decimal:2',
        'pending_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'commission_rate' => 'decimal:2'
    ];

    protected $appends = [
        'clicks_count',
        'sales_count',
        'conversion_rate'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(Click::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function links(): HasMany
    {
        return $this->hasMany(AffiliateLink::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    // حساب عدد النقرات
    public function getClicksCountAttribute()
    {
        return $this->clicks()->count();
    }

    // حساب عدد المبيعات
    public function getSalesCountAttribute()
    {
        return $this->sales()->where('status', '!=', 'cancelled')->count();
    }

    // حساب معدل التحويل
    public function getConversionRateAttribute()
    {
        $clicks = $this->clicks_count;
        $sales = $this->sales_count;
        
        if ($clicks == 0) return 0;
        
        return round(($sales / $clicks) * 100, 2);
    }

    // إنشاء كود إحالة فريد
    public static function generateReferralCode()
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (self::where('referral_code', $code)->exists());

        return $code;
    }

    // حساب العمولة
    public function calculateCommission($saleAmount)
    {
        if ($this->commission_type === 'fixed') {
            return $this->commission_rate;
        }

        // عمولة بالنسبة المئوية
        $commission = ($saleAmount * $this->commission_rate) / 100;

        // تطبيق استراتيجية العمولة
        if ($this->commission_strategy === 'tier_volume' && $this->commission_tiers) {
            $totalSales = $this->sales()->where('status', 'approved')->sum('amount');
            
            foreach ($this->commission_tiers as $tier) {
                if ($totalSales >= $tier['threshold']) {
                    $commission = ($saleAmount * $tier['rate']) / 100;
                }
            }
        }

        return round($commission, 2);
    }
}
```

#### نموذج المبيعات

```php
<?php
// app/Models/Sale.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sale extends Model
{
    protected $fillable = [
        'affiliate_id',
        'order_id',
        'customer_email',
        'customer_name',
        'customer_phone',
        'amount',
        'commission_amount',
        'status',
        'falakcart_data'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'falakcart_data' => 'array'
    ];

    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(Affiliate::class);
    }

    // تحديث حالة المبيعة
    public function updateStatus($newStatus)
    {
        $oldStatus = $this->status;
        $this->status = $newStatus;
        $this->save();

        // تحديث رصيد الأفلييت
        if ($oldStatus === 'pending' && $newStatus === 'approved') {
            $this->affiliate->increment('current_balance', $this->commission_amount);
            $this->affiliate->decrement('pending_balance', $this->commission_amount);
        } elseif ($oldStatus === 'approved' && $newStatus === 'paid') {
            $this->affiliate->decrement('current_balance', $this->commission_amount);
            
            // إنشاء معاملة دفع
            Transaction::create([
                'affiliate_id' => $this->affiliate_id,
                'type' => 'payout',
                'amount' => $this->commission_amount,
                'description' => "دفع عمولة الطلب #{$this->order_id}",
                'status' => 'completed',
                'reference_id' => $this->id
            ]);
        }
    }
}
```

### الخطوة 4: إنشاء المتحكمات (Controllers)

#### متحكم الأفلييت

```php
<?php
// app/Http/Controllers/AffiliateController.php

namespace App\Http\Controllers;

use App\Models\Affiliate;
use App\Models\Click;
use App\Models\Sale;
use App\Models\AffiliateLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AffiliateController extends Controller
{
    // تسجيل أفلييت جديد
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // إنشاء المستخدم
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'affiliate'
            ]);

            // إنشاء الأفلييت
            $affiliate = Affiliate::create([
                'user_id' => $user->id,
                'referral_code' => Affiliate::generateReferralCode(),
                'status' => config('affiliate.auto_approve', false) ? 'active' : 'pending',
                'commission_rate' => config('affiliate.default_commission_rate', 10),
                'bank_name' => $request->bank_name,
                'bank_account' => $request->bank_account
            ]);

            // إرسال بريد ترحيب
            // Mail::to($user->email)->send(new WelcomeAffiliate($affiliate));

            return response()->json([
                'success' => true,
                'message' => 'تم التسجيل بنجاح. سيتم مراجعة طلبك قريباً.',
                'affiliate' => $affiliate->load('user')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء التسجيل'
            ], 500);
        }
    }

    // تتبع النقرات
    public function trackClick(Request $request, $referralCode)
    {
        try {
            $affiliate = Affiliate::where('referral_code', $referralCode)
                                ->where('status', 'active')
                                ->first();
            
            if (!$affiliate) {
                return response()->json(['error' => 'كود الإحالة غير صحيح'], 404);
            }

            // تسجيل النقرة
            $click = Click::create([
                'affiliate_id' => $affiliate->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'referrer_url' => $request->header('referer'),
                'landing_page' => $request->input('landing_page', $request->fullUrl()),
                'country' => $this->getCountryFromIP($request->ip()),
                'device_type' => $this->getDeviceType($request->userAgent())
            ]);

            // إنشاء كوكيز للتتبع
            $cookie = cookie(
                'affiliate_ref', 
                $referralCode, 
                60 * 24 * config('affiliate.cookie_duration', 30), // 30 يوم افتراضي
                '/',
                config('session.domain'),
                true, // secure
                false // httpOnly
            );

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل النقرة بنجاح'
            ])->cookie($cookie);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في التتبع'
            ], 500);
        }
    }

    // تتبع المبيعات
    public function trackSale(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|string|unique:sales,order_id',
            'amount' => 'required|numeric|min:0',
            'customer_email' => 'required|email',
            'customer_name' => 'required|string',
            'customer_phone' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // البحث عن كود الإحالة
            $referralCode = $request->cookie('affiliate_ref') ?? $request->input('ref');
            
            if (!$referralCode) {
                return response()->json([
                    'success' => true,
                    'message' => 'لا يوجد كود إحالة'
                ]);
            }

            $affiliate = Affiliate::where('referral_code', $referralCode)
                                ->where('status', 'active')
                                ->first();
            
            if (!$affiliate) {
                return response()->json([
                    'success' => true,
                    'message' => 'كود الإحالة غير صحيح'
                ]);
            }

            // حساب العمولة
            $commissionAmount = $affiliate->calculateCommission($request->amount);

            // تسجيل المبيعة
            $sale = Sale::create([
                'affiliate_id' => $affiliate->id,
                'order_id' => $request->order_id,
                'customer_email' => $request->customer_email,
                'customer_name' => $request->customer_name,
                'customer_phone' => $request->customer_phone,
                'amount' => $request->amount,
                'commission_amount' => $commissionAmount,
                'status' => 'pending',
                'falakcart_data' => $request->input('metadata', [])
            ]);

            // تحديث أرصدة الأفلييت
            $affiliate->increment('pending_balance', $commissionAmount);
            $affiliate->increment('total_earnings', $commissionAmount);

            // إنشاء إشعار للأفلييت
            Notification::create([
                'user_id' => $affiliate->user_id,
                'title' => 'عمولة جديدة',
                'message' => "تم تسجيل عمولة جديدة بقيمة {$commissionAmount} ريال من الطلب #{$request->order_id}",
                'type' => 'success'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تسجيل المبيعة بنجاح',
                'commission' => $commissionAmount,
                'sale_id' => $sale->id
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ في تسجيل المبيعة'
            ], 500);
        }
    }

    // لوحة تحكم الأفلييت
    public function dashboard(Request $request)
    {
        $affiliate = Auth::user()->affiliate;
        
        if (!$affiliate) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        $stats = [
            'total_clicks' => $affiliate->clicks()->count(),
            'total_sales' => $affiliate->sales()->where('status', '!=', 'cancelled')->count(),
            'total_earnings' => $affiliate->total_earnings,
            'pending_balance' => $affiliate->pending_balance,
            'current_balance' => $affiliate->current_balance,
            'conversion_rate' => $affiliate->conversion_rate,
            'this_month_earnings' => $affiliate->sales()
                ->where('status', 'approved')
                ->whereMonth('created_at', now()->month)
                ->sum('commission_amount')
        ];

        return response()->json([
            'success' => true,
            'affiliate' => $affiliate->load('user'),
            'stats' => $stats
        ]);
    }

    // إنشاء رابط أفلييت
    public function createLink(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'url' => 'required|url'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $affiliate = Auth::user()->affiliate;
        
        $link = AffiliateLink::create([
            'affiliate_id' => $affiliate->id,
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . Str::random(6),
            'url' => $request->url . '?ref=' . $affiliate->referral_code
        ]);

        return response()->json([
            'success' => true,
            'link' => $link
        ]);
    }

    // مساعدات
    private function getCountryFromIP($ip)
    {
        // يمكن استخدام خدمة مثل GeoIP
        return 'SA'; // افتراضي السعودية
    }

    private function getDeviceType($userAgent)
    {
        if (preg_match('/mobile|android|iphone/i', $userAgent)) {
            return 'mobile';
        } elseif (preg_match('/tablet|ipad/i', $userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }
}
```
### الخطوة 5: إعداد المسارات (Routes)

```php
<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AffiliateController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FalakCartWebhookController;

// المسارات العامة
Route::prefix('v1')->group(function () {
    
    // التسجيل والدخول
    Route::post('/register', [AffiliateController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    
    // تتبع النقرات والمبيعات
    Route::get('/track/click/{referralCode}', [AffiliateController::class, 'trackClick']);
    Route::post('/track/sale', [AffiliateController::class, 'trackSale']);
    
    // Webhook من فلك كارت
    Route::post('/webhook/falakcart', [FalakCartWebhookController::class, 'handle']);
    
    // المسارات المحمية
    Route::middleware('auth:sanctum')->group(function () {
        
        // معلومات المستخدم
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
        
        // مسارات الأفلييت
        Route::prefix('affiliate')->group(function () {
            Route::get('/dashboard', [AffiliateController::class, 'dashboard']);
            Route::get('/stats', [AffiliateController::class, 'stats']);
            Route::get('/links', [AffiliateController::class, 'getLinks']);
            Route::post('/links', [AffiliateController::class, 'createLink']);
            Route::put('/links/{id}', [AffiliateController::class, 'updateLink']);
            Route::delete('/links/{id}', [AffiliateController::class, 'deleteLink']);
            Route::get('/sales', [AffiliateController::class, 'getSales']);
            Route::get('/earnings', [AffiliateController::class, 'getEarnings']);
            Route::get('/analytics', [AffiliateController::class, 'getAnalytics']);
            Route::put('/profile', [AffiliateController::class, 'updateProfile']);
            Route::post('/payout-request', [AffiliateController::class, 'requestPayout']);
        });
        
        // مسارات الإدارة
        Route::prefix('admin')->middleware('role:admin')->group(function () {
            Route::get('/summary', [AdminController::class, 'summary']);
            Route::get('/affiliates', [AdminController::class, 'getAffiliates']);
            Route::put('/affiliates/{id}/status', [AdminController::class, 'updateAffiliateStatus']);
            Route::get('/sales', [AdminController::class, 'getSales']);
            Route::put('/sales/{id}/status', [AdminController::class, 'updateSaleStatus']);
            Route::get('/analytics/clicks', [AdminController::class, 'getClicksAnalytics']);
            Route::get('/analytics/devices', [AdminController::class, 'getDevicesAnalytics']);
            Route::get('/analytics/geo', [AdminController::class, 'getGeoAnalytics']);
            Route::get('/analytics/traffic-sources', [AdminController::class, 'getTrafficSources']);
            Route::post('/payouts/{id}/approve', [AdminController::class, 'approvePayout']);
            Route::get('/export', [AdminController::class, 'exportData']);
            Route::get('/settings', [AdminController::class, 'getSettings']);
            Route::put('/settings', [AdminController::class, 'updateSettings']);
        });
    });
});
```

### الخطوة 6: إنشاء Webhook Controller لفلك كارت

```php
<?php
// app/Http/Controllers/FalakCartWebhookController.php

namespace App\Http\Controllers;

use App\Models\Affiliate;
use App\Models\Sale;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FalakCartWebhookController extends Controller
{
    public function handle(Request $request)
    {
        // التحقق من صحة الـ webhook
        if (!$this->verifyWebhook($request)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $eventType = $request->input('event_type');
        $data = $request->input('data');

        try {
            switch ($eventType) {
                case 'order.created':
                    $this->handleOrderCreated($data);
                    break;
                    
                case 'order.paid':
                    $this->handleOrderPaid($data);
                    break;
                    
                case 'order.cancelled':
                    $this->handleOrderCancelled($data);
                    break;
                    
                case 'order.refunded':
                    $this->handleOrderRefunded($data);
                    break;
                    
                default:
                    Log::info("Unhandled webhook event: {$eventType}");
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error("Webhook error: " . $e->getMessage(), [
                'event_type' => $eventType,
                'data' => $data
            ]);
            
            return response()->json(['error' => 'Internal error'], 500);
        }
    }

    private function verifyWebhook(Request $request)
    {
        $signature = $request->header('X-FalakCart-Signature');
        $payload = $request->getContent();
        $secret = config('services.falakcart.webhook_secret');
        
        $expectedSignature = hash_hmac('sha256', $payload, $secret);
        
        return hash_equals($signature, $expectedSignature);
    }

    private function handleOrderCreated($orderData)
    {
        // البحث عن كود الإحالة في بيانات الطلب
        $referralCode = $orderData['affiliate_code'] ?? null;
        
        if (!$referralCode) {
            return;
        }

        $affiliate = Affiliate::where('referral_code', $referralCode)
                            ->where('status', 'active')
                            ->first();
        
        if (!$affiliate) {
            return;
        }

        // التحقق من عدم وجود الطلب مسبقاً
        $existingSale = Sale::where('order_id', $orderData['id'])->first();
        if ($existingSale) {
            return;
        }

        // حساب العمولة
        $commissionAmount = $affiliate->calculateCommission($orderData['total']);

        // إنشاء سجل المبيعة
        $sale = Sale::create([
            'affiliate_id' => $affiliate->id,
            'order_id' => $orderData['id'],
            'customer_email' => $orderData['customer']['email'],
            'customer_name' => $orderData['customer']['name'],
            'customer_phone' => $orderData['customer']['phone'] ?? null,
            'amount' => $orderData['total'],
            'commission_amount' => $commissionAmount,
            'status' => 'pending',
            'falakcart_data' => $orderData
        ]);

        // تحديث رصيد الأفلييت
        $affiliate->increment('pending_balance', $commissionAmount);
        $affiliate->increment('total_earnings', $commissionAmount);

        // إرسال إشعار
        Notification::create([
            'user_id' => $affiliate->user_id,
            'title' => 'طلب جديد',
            'message' => "تم تسجيل طلب جديد برقم #{$orderData['id']} بعمولة {$commissionAmount} ريال",
            'type' => 'info'
        ]);

        Log::info("New sale tracked for affiliate {$affiliate->referral_code}", [
            'order_id' => $orderData['id'],
            'commission' => $commissionAmount
        ]);
    }

    private function handleOrderPaid($orderData)
    {
        $sale = Sale::where('order_id', $orderData['id'])->first();
        
        if ($sale && $sale->status === 'pending') {
            $sale->updateStatus('approved');
            
            // إرسال إشعار
            Notification::create([
                'user_id' => $sale->affiliate->user_id,
                'title' => 'تم تأكيد العمولة',
                'message' => "تم تأكيد عمولة الطلب #{$orderData['id']} بقيمة {$sale->commission_amount} ريال",
                'type' => 'success'
            ]);
        }
    }

    private function handleOrderCancelled($orderData)
    {
        $sale = Sale::where('order_id', $orderData['id'])->first();
        
        if ($sale && in_array($sale->status, ['pending', 'approved'])) {
            $oldStatus = $sale->status;
            $sale->updateStatus('cancelled');
            
            // إعادة تعديل رصيد الأفلييت
            if ($oldStatus === 'pending') {
                $sale->affiliate->decrement('pending_balance', $sale->commission_amount);
            } elseif ($oldStatus === 'approved') {
                $sale->affiliate->decrement('current_balance', $sale->commission_amount);
            }
            
            $sale->affiliate->decrement('total_earnings', $sale->commission_amount);
            
            // إرسال إشعار
            Notification::create([
                'user_id' => $sale->affiliate->user_id,
                'title' => 'تم إلغاء الطلب',
                'message' => "تم إلغاء الطلب #{$orderData['id']} وخصم العمولة",
                'type' => 'warning'
            ]);
        }
    }

    private function handleOrderRefunded($orderData)
    {
        // نفس منطق الإلغاء
        $this->handleOrderCancelled($orderData);
    }
}
```

## تكامل التتبع

### الخطوة 1: إنشاء سكريبت التتبع

```javascript
// public/js/falakcart-affiliate-tracker.js

(function() {
    'use strict';
    
    // إعدادات السكريبت
    const CONFIG = {
        API_URL: 'https://affiliate.yourdomain.com/api/v1',
        COOKIE_NAME: 'affiliate_ref',
        COOKIE_DURATION: 30, // أيام
        DEBUG: false
    };
    
    // وظائف مساعدة
    const Utils = {
        // الحصول على قيمة من الكوكيز
        getCookie: function(name) {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [cookieName, cookieValue] = cookie.trim().split('=');
                if (cookieName === name) {
                    return decodeURIComponent(cookieValue);
                }
            }
            return null;
        },
        
        // تعيين كوكيز
        setCookie: function(name, value, days) {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        },
        
        // الحصول على معامل من الرابط
        getUrlParameter: function(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        },
        
        // إرسال طلب HTTP
        sendRequest: function(url, method = 'GET', data = null) {
            return fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: data ? JSON.stringify(data) : null
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            }).catch(error => {
                if (CONFIG.DEBUG) {
                    console.error('Affiliate Tracker Error:', error);
                }
                return { success: false, error: error.message };
            });
        },
        
        // تسجيل رسائل التصحيح
        log: function(message, data = null) {
            if (CONFIG.DEBUG) {
                console.log('[Affiliate Tracker]', message, data);
            }
        }
    };
    
    // فئة التتبع الرئيسية
    class AffiliateTracker {
        constructor() {
            this.referralCode = null;
            this.initialized = false;
        }
        
        // تهيئة النظام
        init() {
            if (this.initialized) return;
            
            Utils.log('Initializing Affiliate Tracker');
            
            // البحث عن كود الإحالة
            this.referralCode = this.getReferralCode();
            
            if (this.referralCode) {
                Utils.log('Referral code found:', this.referralCode);
                this.trackClick();
            } else {
                Utils.log('No referral code found');
            }
            
            this.initialized = true;
        }
        
        // الحصول على كود الإحالة
        getReferralCode() {
            // أولاً من الرابط
            let code = Utils.getUrlParameter('ref');
            
            if (code) {
                // حفظ في الكوكيز
                Utils.setCookie(CONFIG.COOKIE_NAME, code, CONFIG.COOKIE_DURATION);
                Utils.log('Referral code saved to cookie:', code);
                return code;
            }
            
            // ثانياً من الكوكيز
            code = Utils.getCookie(CONFIG.COOKIE_NAME);
            if (code) {
                Utils.log('Referral code found in cookie:', code);
                return code;
            }
            
            return null;
        }
        
        // تتبع النقرة
        trackClick() {
            if (!this.referralCode) return;
            
            const url = `${CONFIG.API_URL}/track/click/${this.referralCode}`;
            const data = {
                landing_page: window.location.href,
                referrer: document.referrer,
                timestamp: new Date().toISOString()
            };
            
            Utils.sendRequest(url, 'POST', data)
                .then(response => {
                    if (response.success) {
                        Utils.log('Click tracked successfully');
                    }
                });
        }
        
        // تتبع المبيعة
        trackSale(orderData) {
            if (!this.referralCode) {
                Utils.log('No referral code for sale tracking');
                return Promise.resolve({ success: false, message: 'No referral code' });
            }
            
            // التحقق من صحة البيانات
            if (!orderData.order_id || !orderData.amount || !orderData.customer_email) {
                Utils.log('Invalid order data for tracking', orderData);
                return Promise.resolve({ success: false, message: 'Invalid order data' });
            }
            
            const url = `${CONFIG.API_URL}/track/sale`;
            const data = {
                order_id: orderData.order_id,
                amount: parseFloat(orderData.amount),
                customer_email: orderData.customer_email,
                customer_name: orderData.customer_name || '',
                customer_phone: orderData.customer_phone || '',
                ref: this.referralCode,
                metadata: orderData.metadata || {},
                timestamp: new Date().toISOString()
            };
            
            Utils.log('Tracking sale:', data);
            
            return Utils.sendRequest(url, 'POST', data)
                .then(response => {
                    if (response.success) {
                        Utils.log('Sale tracked successfully:', response);
                        
                        // إزالة كود الإحالة بعد التتبع الناجح (اختياري)
                        // Utils.setCookie(CONFIG.COOKIE_NAME, '', -1);
                    }
                    return response;
                });
        }
        
        // الحصول على معلومات الأفلييت
        getAffiliateInfo() {
            if (!this.referralCode) return null;
            
            return {
                referralCode: this.referralCode,
                hasReferral: true,
                cookieExpiry: this.getCookieExpiry()
            };
        }
        
        // الحصول على تاريخ انتهاء الكوكيز
        getCookieExpiry() {
            // حساب تاريخ انتهاء الكوكيز
            const expires = new Date();
            expires.setTime(expires.getTime() + (CONFIG.COOKIE_DURATION * 24 * 60 * 60 * 1000));
            return expires;
        }
    }
    
    // إنشاء مثيل من المتتبع
    const tracker = new AffiliateTracker();
    
    // واجهة برمجية عامة
    window.FalakAffiliateTracker = {
        // تتبع المبيعة
        trackSale: function(orderData) {
            return tracker.trackSale(orderData);
        },
        
        // الحصول على كود الإحالة
        getReferralCode: function() {
            return tracker.referralCode;
        },
        
        // الحصول على معلومات الأفلييت
        getInfo: function() {
            return tracker.getAffiliateInfo();
        },
        
        // تفعيل وضع التصحيح
        enableDebug: function() {
            CONFIG.DEBUG = true;
            Utils.log('Debug mode enabled');
        },
        
        // إعادة تهيئة النظام
        reinit: function() {
            tracker.initialized = false;
            tracker.init();
        }
    };
    
    // تهيئة تلقائية عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            tracker.init();
        });
    } else {
        tracker.init();
    }
    
    Utils.log('Affiliate Tracker loaded successfully');
})();
```

### الخطوة 2: تكامل السكريبت مع فلك كارت

#### إضافة السكريبت لجميع الصفحات

```html
<!-- إضافة هذا الكود قبل إغلاق تاج </body> في جميع صفحات فلك كارت -->
<script>
// تحميل سكريبت التتبع
(function() {
    var script = document.createElement('script');
    script.src = 'https://affiliate.yourdomain.com/js/falakcart-affiliate-tracker.js';
    script.async = true;
    document.head.appendChild(script);
})();
</script>
```

#### تتبع المبيعات في صفحة الشكر

```html
<!-- في صفحة شكراً بعد إتمام الطلب -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // انتظار تحميل سكريبت التتبع
    function waitForTracker() {
        if (window.FalakAffiliateTracker) {
            // بيانات الطلب من فلك كارت
            var orderData = {
                order_id: '{{ $order->id }}',
                amount: {{ $order->total }},
                customer_email: '{{ $order->customer_email }}',
                customer_name: '{{ $order->customer_name }}',
                customer_phone: '{{ $order->customer_phone ?? "" }}',
                metadata: {
                    order_number: '{{ $order->order_number }}',
                    payment_method: '{{ $order->payment_method }}',
                    items_count: {{ $order->items->count() }},
                    currency: 'SAR'
                }
            };
            
            // تتبع المبيعة
            window.FalakAffiliateTracker.trackSale(orderData)
                .then(function(response) {
                    if (response.success) {
                        console.log('تم تتبع المبيعة بنجاح');
                    }
                })
                .catch(function(error) {
                    console.error('خطأ في تتبع المبيعة:', error);
                });
        } else {
            // إعادة المحاولة بعد 100ms
            setTimeout(waitForTracker, 100);
        }
    }
    
    waitForTracker();
});
</script>
```
## ربط فلك كارت

### الخطوة 1: إعداد Webhook في فلك كارت

```php
// في لوحة تحكم فلك كارت، أضف webhook جديد
// URL: https://affiliate.yourdomain.com/api/v1/webhook/falakcart
// Events: order.created, order.paid, order.cancelled, order.refunded
// Secret: your-webhook-secret-key
```

### الخطوة 2: تعديل نموذج الطلب في فلك كارت

```php
// في ملف Order model في فلك كارت
// app/Models/Order.php

class Order extends Model
{
    // إضافة حقل لحفظ كود الإحالة
    protected $fillable = [
        // الحقول الموجودة...
        'affiliate_code',
        'affiliate_commission'
    ];
    
    // حفظ كود الإحالة عند إنشاء الطلب
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($order) {
            // البحث عن كود الإحالة في الكوكيز أو الجلسة
            $affiliateCode = request()->cookie('affiliate_ref') ?? session('affiliate_ref');
            
            if ($affiliateCode) {
                $order->affiliate_code = $affiliateCode;
                
                // حساب العمولة (اختياري - يمكن حسابها في نظام الأفلييت)
                $order->affiliate_commission = $order->calculateAffiliateCommission($affiliateCode);
            }
        });
    }
    
    // حساب العمولة
    public function calculateAffiliateCommission($affiliateCode)
    {
        // استدعاء API نظام الأفلييت لحساب العمولة
        try {
            $response = Http::post(config('affiliate.api_url') . '/calculate-commission', [
                'affiliate_code' => $affiliateCode,
                'order_amount' => $this->total
            ]);
            
            if ($response->successful()) {
                return $response->json()['commission'] ?? 0;
            }
        } catch (\Exception $e) {
            \Log::error('Error calculating affiliate commission: ' . $e->getMessage());
        }
        
        return 0;
    }
}
```

### الخطوة 3: إضافة Migration لجدول الطلبات

```php
// في فلك كارت - إنشاء migration جديد
// php artisan make:migration add_affiliate_fields_to_orders_table

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAffiliateFieldsToOrdersTable extends Migration
{
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('affiliate_code')->nullable()->after('total');
            $table->decimal('affiliate_commission', 8, 2)->default(0)->after('affiliate_code');
            $table->index('affiliate_code');
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['affiliate_code']);
            $table->dropColumn(['affiliate_code', 'affiliate_commission']);
        });
    }
}
```

### الخطوة 4: إعداد Webhook Controller في فلك كارت

```php
// في فلك كارت - إنشاء controller للـ webhooks
// app/Http/Controllers/WebhookController.php

<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function sendToAffiliate(Request $request)
    {
        $order = Order::find($request->order_id);
        
        if (!$order || !$order->affiliate_code) {
            return response()->json(['message' => 'No affiliate code found']);
        }
        
        $webhookData = [
            'event_type' => $request->event_type,
            'data' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total' => $order->total,
                'status' => $order->status,
                'affiliate_code' => $order->affiliate_code,
                'customer' => [
                    'name' => $order->customer_name,
                    'email' => $order->customer_email,
                    'phone' => $order->customer_phone
                ],
                'items' => $order->items->map(function($item) {
                    return [
                        'name' => $item->product_name,
                        'quantity' => $item->quantity,
                        'price' => $item->price
                    ];
                }),
                'created_at' => $order->created_at->toISOString(),
                'updated_at' => $order->updated_at->toISOString()
            ]
        ];
        
        // إرسال البيانات لنظام الأفلييت
        try {
            $signature = hash_hmac('sha256', json_encode($webhookData), config('affiliate.webhook_secret'));
            
            $response = Http::withHeaders([
                'X-FalakCart-Signature' => $signature,
                'Content-Type' => 'application/json'
            ])->post(config('affiliate.webhook_url'), $webhookData);
            
            if ($response->successful()) {
                Log::info("Affiliate webhook sent successfully for order {$order->id}");
            } else {
                Log::error("Failed to send affiliate webhook for order {$order->id}: " . $response->body());
            }
            
        } catch (\Exception $e) {
            Log::error("Error sending affiliate webhook: " . $e->getMessage());
        }
        
        return response()->json(['success' => true]);
    }
}
```

### الخطوة 5: إعداد Events في فلك كارت

```php
// في فلك كارت - إنشاء Event Listeners
// app/Listeners/SendAffiliateWebhook.php

<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use App\Events\OrderPaid;
use App\Events\OrderCancelled;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendAffiliateWebhook
{
    public function handleOrderCreated(OrderCreated $event)
    {
        $this->sendWebhook('order.created', $event->order);
    }
    
    public function handleOrderPaid(OrderPaid $event)
    {
        $this->sendWebhook('order.paid', $event->order);
    }
    
    public function handleOrderCancelled(OrderCancelled $event)
    {
        $this->sendWebhook('order.cancelled', $event->order);
    }
    
    private function sendWebhook($eventType, $order)
    {
        if (!$order->affiliate_code) {
            return;
        }
        
        $webhookData = [
            'event_type' => $eventType,
            'data' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total' => $order->total,
                'status' => $order->status,
                'affiliate_code' => $order->affiliate_code,
                'customer' => [
                    'name' => $order->customer_name,
                    'email' => $order->customer_email,
                    'phone' => $order->customer_phone
                ],
                'created_at' => $order->created_at->toISOString(),
                'updated_at' => $order->updated_at->toISOString()
            ]
        ];
        
        try {
            $signature = hash_hmac('sha256', json_encode($webhookData), config('affiliate.webhook_secret'));
            
            Http::withHeaders([
                'X-FalakCart-Signature' => $signature,
                'Content-Type' => 'application/json'
            ])->post(config('affiliate.webhook_url'), $webhookData);
            
            Log::info("Affiliate webhook sent: {$eventType} for order {$order->id}");
            
        } catch (\Exception $e) {
            Log::error("Error sending affiliate webhook: " . $e->getMessage());
        }
    }
}
```

### الخطوة 6: تسجيل Event Listeners

```php
// في فلك كارت - app/Providers/EventServiceProvider.php

protected $listen = [
    // الأحداث الموجودة...
    
    'App\Events\OrderCreated' => [
        'App\Listeners\SendAffiliateWebhook@handleOrderCreated',
    ],
    
    'App\Events\OrderPaid' => [
        'App\Listeners\SendAffiliateWebhook@handleOrderPaid',
    ],
    
    'App\Events\OrderCancelled' => [
        'App\Listeners\SendAffiliateWebhook@handleOrderCancelled',
    ],
];
```

## إعداد الفرونت إند (Next.js)

### الخطوة 1: تثبيت المشروع

```bash
# إنشاء مشروع Next.js
npx create-next-app@latest affiliate-frontend --typescript --tailwind --eslint
cd affiliate-frontend

# تثبيت الحزم المطلوبة
npm install axios
npm install @headlessui/react @heroicons/react
npm install recharts
npm install react-hook-form
npm install @hookform/resolvers yup
npm install js-cookie
npm install @types/js-cookie
```

### الخطوة 2: إعداد ملف البيئة

```env
# .env.local
NEXT_PUBLIC_API_URL=https://affiliate.yourdomain.com/api/v1
NEXT_PUBLIC_APP_URL=https://affiliate-panel.yourdomain.com
NEXT_PUBLIC_FALAKCART_URL=https://falakcart.com
```

### الخطوة 3: إعداد API Client

```typescript
// lib/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// إضافة token للطلبات
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// معالجة الأخطاء
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### الخطوة 4: إنشاء Context للمصادقة

```typescript
// context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  affiliate?: {
    id: number;
    referral_code: string;
    status: string;
    commission_rate: number;
    total_earnings: number;
    pending_balance: number;
    current_balance: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  bank_name?: string;
  bank_account?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/user');
      setUser(data.user);
    } catch (error) {
      Cookies.remove('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/login', { email, password });
    
    Cookies.set('auth_token', data.token, { 
      expires: 7, // 7 أيام
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    setUser(data.user);
  };

  const register = async (registerData: RegisterData) => {
    const { data } = await api.post('/register', registerData);
    
    if (data.success) {
      // يمكن تسجيل الدخول تلقائياً أو توجيه للتأكيد
      return data;
    } else {
      throw new Error(data.message || 'فشل في التسجيل');
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      // تجاهل أخطاء تسجيل الخروج
    } finally {
      Cookies.remove('auth_token');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## اختبار النظام

### الخطوة 1: اختبار التتبع

```html
<!-- ملف اختبار: test-tracking.html -->
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اختبار نظام التتبع</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
        .result { margin-top: 10px; padding: 10px; background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>اختبار نظام الأفلييت</h1>
    
    <div class="test-section">
        <h3>1. اختبار تتبع النقرات</h3>
        <p>الرابط الحالي: <span id="current-url"></span></p>
        <p>كود الإحالة: <span id="ref-code"></span></p>
        <button onclick="testClickTracking()">اختبار تتبع النقرة</button>
        <div id="click-result" class="result" style="display:none;"></div>
    </div>
    
    <div class="test-section">
        <h3>2. اختبار تتبع المبيعات</h3>
        <button onclick="testSaleTracking()">اختبار تتبع المبيعة</button>
        <div id="sale-result" class="result" style="display:none;"></div>
    </div>
    
    <div class="test-section">
        <h3>3. معلومات النظام</h3>
        <button onclick="showSystemInfo()">عرض معلومات النظام</button>
        <div id="system-info" class="result" style="display:none;"></div>
    </div>

    <!-- تحميل سكريبت التتبع -->
    <script src="https://affiliate.yourdomain.com/js/falakcart-affiliate-tracker.js"></script>
    
    <script>
        // تفعيل وضع التصحيح
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                if (window.FalakAffiliateTracker) {
                    window.FalakAffiliateTracker.enableDebug();
                    updatePageInfo();
                }
            }, 1000);
        });
        
        function updatePageInfo() {
            document.getElementById('current-url').textContent = window.location.href;
            const refCode = window.FalakAffiliateTracker.getReferralCode();
            document.getElementById('ref-code').textContent = refCode || 'غير موجود';
        }
        
        function testClickTracking() {
            const resultDiv = document.getElementById('click-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = 'جاري اختبار تتبع النقرة...';
            
            // محاكاة نقرة جديدة
            window.FalakAffiliateTracker.reinit();
            
            setTimeout(function() {
                const info = window.FalakAffiliateTracker.getInfo();
                if (info && info.hasReferral) {
                    resultDiv.innerHTML = `
                        <strong>نجح الاختبار!</strong><br>
                        كود الإحالة: ${info.referralCode}<br>
                        انتهاء الكوكيز: ${info.cookieExpiry}
                    `;
                    resultDiv.style.background = '#d4edda';
                } else {
                    resultDiv.innerHTML = '<strong>فشل الاختبار:</strong> لم يتم العثور على كود إحالة';
                    resultDiv.style.background = '#f8d7da';
                }
            }, 2000);
        }
        
        function testSaleTracking() {
            const resultDiv = document.getElementById('sale-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = 'جاري اختبار تتبع المبيعة...';
            
            // بيانات طلب تجريبي
            const testOrder = {
                order_id: 'TEST-' + Date.now(),
                amount: 299.99,
                customer_email: 'test@example.com',
                customer_name: 'عميل تجريبي',
                customer_phone: '0501234567',
                metadata: {
                    test: true,
                    timestamp: new Date().toISOString()
                }
            };
            
            window.FalakAffiliateTracker.trackSale(testOrder)
                .then(function(response) {
                    if (response.success) {
                        resultDiv.innerHTML = `
                            <strong>نجح الاختبار!</strong><br>
                            رقم الطلب: ${testOrder.order_id}<br>
                            العمولة: ${response.commission || 'غير محددة'}<br>
                            الرسالة: ${response.message}
                        `;
                        resultDiv.style.background = '#d4edda';
                    } else {
                        resultDiv.innerHTML = `
                            <strong>فشل الاختبار:</strong><br>
                            الخطأ: ${response.message || response.error}
                        `;
                        resultDiv.style.background = '#f8d7da';
                    }
                })
                .catch(function(error) {
                    resultDiv.innerHTML = `<strong>خطأ:</strong> ${error.message}`;
                    resultDiv.style.background = '#f8d7da';
                });
        }
        
        function showSystemInfo() {
            const resultDiv = document.getElementById('system-info');
            resultDiv.style.display = 'block';
            
            const info = window.FalakAffiliateTracker.getInfo();
            const cookies = document.cookie.split(';').map(c => c.trim()).join('<br>');
            
            resultDiv.innerHTML = `
                <strong>معلومات النظام:</strong><br>
                المتصفح: ${navigator.userAgent}<br>
                الكوكيز: ${cookies || 'لا توجد'}<br>
                معلومات الأفلييت: ${JSON.stringify(info, null, 2)}<br>
                الوقت الحالي: ${new Date().toLocaleString('ar-SA')}
            `;
        }
    </script>
</body>
</html>
```

### الخطوة 2: اختبار API

```php
<?php
// ملف اختبار: test_affiliate_api.php

require_once 'vendor/autoload.php';

class AffiliateAPITest
{
    private $baseUrl;
    private $token;
    
    public function __construct($baseUrl)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
    }
    
    public function runAllTests()
    {
        echo "بدء اختبار API نظام الأفلييت\n";
        echo "================================\n\n";
        
        $this->testRegistration();
        $this->testLogin();
        $this->testClickTracking();
        $this->testSaleTracking();
        $this->testDashboard();
        
        echo "\nانتهى الاختبار\n";
    }
    
    private function testRegistration()
    {
        echo "1. اختبار تسجيل أفلييت جديد...\n";
        
        $data = [
            'name' => 'أفلييت تجريبي',
            'email' => 'test-' . time() . '@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '0501234567',
            'bank_name' => 'البنك الأهلي',
            'bank_account' => '1234567890'
        ];
        
        $response = $this->makeRequest('POST', '/register', $data);
        
        if ($response['success']) {
            echo "✓ نجح التسجيل\n";
            echo "  كود الإحالة: " . $response['affiliate']['referral_code'] . "\n";
        } else {
            echo "✗ فشل التسجيل: " . ($response['message'] ?? 'خطأ غير معروف') . "\n";
        }
        
        echo "\n";
    }
    
    private function testLogin()
    {
        echo "2. اختبار تسجيل الدخول...\n";
        
        // استخدام بيانات المدير للاختبار
        $data = [
            'email' => 'admin@falakcart.com',
            'password' => 'password'
        ];
        
        $response = $this->makeRequest('POST', '/login', $data);
        
        if (isset($response['token'])) {
            $this->token = $response['token'];
            echo "✓ نجح تسجيل الدخول\n";
            echo "  المستخدم: " . $response['user']['name'] . "\n";
        } else {
            echo "✗ فشل تسجيل الدخول\n";
        }
        
        echo "\n";
    }
    
    private function testClickTracking()
    {
        echo "3. اختبار تتبع النقرات...\n";
        
        // استخدام كود إحالة تجريبي
        $referralCode = 'TEST1234';
        
        $response = $this->makeRequest('GET', "/track/click/{$referralCode}");
        
        if ($response['success']) {
            echo "✓ نجح تتبع النقرة\n";
        } else {
            echo "✗ فشل تتبع النقرة: " . ($response['message'] ?? 'خطأ غير معروف') . "\n";
        }
        
        echo "\n";
    }
    
    private function testSaleTracking()
    {
        echo "4. اختبار تتبع المبيعات...\n";
        
        $data = [
            'order_id' => 'TEST-ORDER-' . time(),
            'amount' => 299.99,
            'customer_email' => 'customer@example.com',
            'customer_name' => 'عميل تجريبي',
            'customer_phone' => '0501234567',
            'ref' => 'TEST1234'
        ];
        
        $response = $this->makeRequest('POST', '/track/sale', $data);
        
        if ($response['success']) {
            echo "✓ نجح تتبع المبيعة\n";
            echo "  العمولة: " . ($response['commission'] ?? 'غير محددة') . "\n";
        } else {
            echo "✗ فشل تتبع المبيعة: " . ($response['message'] ?? 'خطأ غير معروف') . "\n";
        }
        
        echo "\n";
    }
    
    private function testDashboard()
    {
        echo "5. اختبار لوحة التحكم...\n";
        
        if (!$this->token) {
            echo "✗ لا يوجد token للاختبار\n\n";
            return;
        }
        
        $response = $this->makeRequest('GET', '/affiliate/dashboard');
        
        if ($response['success']) {
            echo "✓ نجح الوصول للوحة التحكم\n";
            echo "  الإحصائيات: " . json_encode($response['stats'], JSON_UNESCAPED_UNICODE) . "\n";
        } else {
            echo "✗ فشل الوصول للوحة التحكم\n";
        }
        
        echo "\n";
    }
    
    private function makeRequest($method, $endpoint, $data = null)
    {
        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json',
            $this->token ? 'Authorization: Bearer ' . $this->token : ''
        ]);
        
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $decoded = json_decode($response, true);
        
        if ($httpCode >= 400) {
            return ['success' => false, 'message' => "HTTP Error: {$httpCode}"];
        }
        
        return $decoded ?: ['success' => false, 'message' => 'Invalid response'];
    }
}

// تشغيل الاختبار
$tester = new AffiliateAPITest('https://affiliate.yourdomain.com/api/v1');
$tester->runAllTests();
```
## النشر والتشغيل

### الخطوة 1: إعداد الخادم

#### متطلبات الخادم

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت PHP 8.1
sudo apt install php8.1 php8.1-fpm php8.1-mysql php8.1-xml php8.1-curl php8.1-zip php8.1-mbstring php8.1-gd

# تثبيت Nginx
sudo apt install nginx

# تثبيت MySQL
sudo apt install mysql-server

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# تثبيت Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# تثبيت PM2 لإدارة Node.js
sudo npm install -g pm2
```

#### إعداد قاعدة البيانات

```sql
-- إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE affiliate_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'affiliate_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON affiliate_system.* TO 'affiliate_user'@'localhost';
FLUSH PRIVILEGES;
```

### الخطوة 2: نشر الباك إند

```bash
# إنشاء مجلد المشروع
sudo mkdir -p /var/www/affiliate-backend
sudo chown $USER:$USER /var/www/affiliate-backend

# رفع الملفات
cd /var/www/affiliate-backend
git clone https://github.com/your-repo/affiliate-backend.git .

# تثبيت الحزم
composer install --no-dev --optimize-autoloader

# إعداد الصلاحيات
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# إعداد البيئة
cp .env.example .env
php artisan key:generate

# تحديث ملف .env
nano .env
```

#### إعداد Nginx للباك إند

```nginx
# /etc/nginx/sites-available/affiliate-api
server {
    listen 80;
    server_name api.affiliate.yourdomain.com;
    root /var/www/affiliate-backend/public;
    index index.php;

    # إعادة توجيه HTTP إلى HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.affiliate.yourdomain.com;
    root /var/www/affiliate-backend/public;
    index index.php;

    # شهادة SSL
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # إعدادات الأمان
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # إعدادات CORS
    add_header Access-Control-Allow-Origin "https://affiliate.yourdomain.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
    add_header Access-Control-Allow-Credentials "true" always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        
        # زيادة حجم الطلبات
        fastcgi_read_timeout 300;
        client_max_body_size 100M;
    }

    # منع الوصول للملفات الحساسة
    location ~ /\. {
        deny all;
    }

    location ~ ^/(storage|bootstrap|config|database|resources|routes|tests|vendor)/ {
        deny all;
    }

    # تحسين الأداء
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### الخطوة 3: نشر الفرونت إند

```bash
# إنشاء مجلد المشروع
sudo mkdir -p /var/www/affiliate-frontend
sudo chown $USER:$USER /var/www/affiliate-frontend

# رفع الملفات
cd /var/www/affiliate-frontend
git clone https://github.com/your-repo/affiliate-frontend.git .

# تثبيت الحزم
npm ci

# بناء المشروع
npm run build

# إعداد PM2
pm2 start npm --name "affiliate-frontend" -- start
pm2 save
pm2 startup
```

#### إعداد Nginx للفرونت إند

```nginx
# /etc/nginx/sites-available/affiliate-frontend
server {
    listen 80;
    server_name affiliate.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name affiliate.yourdomain.com;

    # شهادة SSL
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # إعدادات الأمان
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
    }

    # ملف التتبع
    location /js/falakcart-affiliate-tracker.js {
        root /var/www/affiliate-backend/public;
        add_header Access-Control-Allow-Origin "*" always;
        add_header Cache-Control "public, max-age=3600" always;
        expires 1h;
    }
}
```

### الخطوة 4: تفعيل المواقع

```bash
# تفعيل المواقع
sudo ln -s /etc/nginx/sites-available/affiliate-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/affiliate-frontend /etc/nginx/sites-enabled/

# اختبار إعدادات Nginx
sudo nginx -t

# إعادة تشغيل Nginx
sudo systemctl restart nginx

# تفعيل الخدمات
sudo systemctl enable nginx
sudo systemctl enable mysql
sudo systemctl enable php8.1-fpm
```

### الخطوة 5: إعداد شهادة SSL

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d api.affiliate.yourdomain.com
sudo certbot --nginx -d affiliate.yourdomain.com

# إعداد التجديد التلقائي
sudo crontab -e
# إضافة هذا السطر:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### الخطوة 6: تشغيل المهام المجدولة

```bash
# إضافة Cron Jobs للباك إند
sudo crontab -e

# إضافة هذه الأسطر:
# تشغيل المهام المجدولة كل دقيقة
* * * * * cd /var/www/affiliate-backend && php artisan schedule:run >> /dev/null 2>&1

# تنظيف الملفات المؤقتة يومياً
0 2 * * * cd /var/www/affiliate-backend && php artisan cache:clear && php artisan view:clear

# نسخ احتياطي للقاعدة أسبوعياً
0 3 * * 0 mysqldump -u affiliate_user -p'password' affiliate_system > /backup/affiliate_$(date +\%Y\%m\%d).sql
```

## المراقبة والصيانة

### الخطوة 1: إعداد المراقبة

```bash
# تثبيت أدوات المراقبة
sudo apt install htop iotop nethogs

# مراقبة PM2
pm2 monit

# مراقبة Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# مراقبة Laravel
tail -f /var/www/affiliate-backend/storage/logs/laravel.log
```

### الخطوة 2: إعداد التنبيهات

```php
// في Laravel - إنشاء Command للمراقبة
// app/Console/Commands/SystemHealthCheck.php

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Models\SystemSettings;

class SystemHealthCheck extends Command
{
    protected $signature = 'system:health-check';
    protected $description = 'فحص صحة النظام وإرسال تنبيهات';

    public function handle()
    {
        $issues = [];

        // فحص قاعدة البيانات
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            $issues[] = 'مشكلة في الاتصال بقاعدة البيانات: ' . $e->getMessage();
        }

        // فحص مساحة القرص
        $diskUsage = disk_free_space('/') / disk_total_space('/') * 100;
        if ($diskUsage < 10) {
            $issues[] = 'مساحة القرص منخفضة: ' . round(100 - $diskUsage, 2) . '% مستخدمة';
        }

        // فحص عدد الأخطاء
        $errorCount = DB::table('logs')->where('level', 'error')
                        ->where('created_at', '>', now()->subHour())
                        ->count();
        
        if ($errorCount > 10) {
            $issues[] = "عدد كبير من الأخطاء في الساعة الماضية: {$errorCount}";
        }

        // إرسال تنبيه إذا وجدت مشاكل
        if (!empty($issues)) {
            $this->sendAlert($issues);
        }

        $this->info('تم فحص صحة النظام');
    }

    private function sendAlert($issues)
    {
        $adminEmail = SystemSettings::getValue('admin_email', 'admin@yourdomain.com');
        
        // إرسال بريد إلكتروني أو رسالة SMS
        // Mail::to($adminEmail)->send(new SystemAlert($issues));
        
        $this->error('تم العثور على مشاكل في النظام');
        foreach ($issues as $issue) {
            $this->error('- ' . $issue);
        }
    }
}
```

## حل المشاكل الشائعة

### مشكلة 1: CORS Errors

```php
// في config/cors.php
return [
    'paths' => ['api/*', 'track/*', 'webhook/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://falakcart.com',
        'https://www.falakcart.com',
        'https://affiliate.yourdomain.com'
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

### مشكلة 2: مشاكل الكوكيز

```javascript
// في سكريبت التتبع - إعداد الكوكيز بشكل صحيح
setCookie: function(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    // إعدادات الكوكيز للعمل عبر النطاقات
    const cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; domain=.yourdomain.com; SameSite=Lax; Secure`;
    
    document.cookie = cookieString;
}
```

### مشكلة 3: مشاكل الأداء

```php
// تحسين الاستعلامات
// في Model
public function scopeWithStats($query)
{
    return $query->withCount(['clicks', 'sales'])
                 ->with(['user:id,name,email']);
}

// استخدام Cache
public function getTopAffiliates()
{
    return Cache::remember('top_affiliates', 3600, function () {
        return Affiliate::withStats()
                       ->orderBy('total_earnings', 'desc')
                       ->limit(10)
                       ->get();
    });
}
```

### مشكلة 4: مشاكل الـ Webhook

```php
// إضافة retry mechanism
public function handleWebhook(Request $request)
{
    $maxRetries = 3;
    $attempt = 0;
    
    while ($attempt < $maxRetries) {
        try {
            $this->processWebhook($request);
            break;
        } catch (\Exception $e) {
            $attempt++;
            
            if ($attempt >= $maxRetries) {
                Log::error("Webhook failed after {$maxRetries} attempts: " . $e->getMessage());
                throw $e;
            }
            
            sleep(pow(2, $attempt)); // Exponential backoff
        }
    }
}
```

## الأمان والحماية

### الخطوة 1: تأمين API

```php
// إضافة Rate Limiting
// في RouteServiceProvider
protected function configureRateLimiting()
{
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });
    
    RateLimiter::for('tracking', function (Request $request) {
        return Limit::perMinute(100)->by($request->ip());
    });
}
```

### الخطوة 2: تشفير البيانات الحساسة

```php
// في Model
protected $casts = [
    'bank_account' => 'encrypted',
    'api_key' => 'encrypted',
];
```

### الخطوة 3: تسجيل العمليات

```php
// إنشاء Audit Log
class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent'
    ];
    
    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array'
    ];
}

// في Observer
class AffiliateObserver
{
    public function updated(Affiliate $affiliate)
    {
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'updated',
            'model_type' => Affiliate::class,
            'model_id' => $affiliate->id,
            'old_values' => $affiliate->getOriginal(),
            'new_values' => $affiliate->getChanges(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent()
        ]);
    }
}
```

## الخلاصة

هذا الدليل يوفر تكاملاً شاملاً بين نظام الأفلييت وفلك كارت، مما يضمن:

1. **تتبع تلقائي كامل** للزيارات والمبيعات
2. **حساب دقيق للعمولات** بناءً على قواعد مرنة
3. **مزامنة فورية للبيانات** بين النظامين
4. **لوحة تحكم شاملة** للأفلييت والإدارة
5. **أمان عالي** وحماية للبيانات
6. **قابلية توسع** لاستيعاب النمو المستقبلي

للحصول على الدعم التقني أو الاستفسارات:
- **البريد الإلكتروني**: support@yourdomain.com
- **الوثائق**: https://docs.yourdomain.com
- **API المرجع**: https://api.yourdomain.com/docs