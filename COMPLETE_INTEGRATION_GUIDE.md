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

## System Architecture

The affiliate system consists of:

- **Backend API**: Laravel-based REST API for affiliate management
- **Frontend Dashboard**: Next.js application for affiliate and admin interfaces
- **Database**: MySQL/SQLite for data storage
- **Tracking Script**: JavaScript for conversion tracking

### Key Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FalakCart     │    │  Affiliate API  │    │ Affiliate Panel │
│   E-commerce    │◄──►│   (Laravel)     │◄──►│   (Next.js)     │
│   Platform      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Tracking Script │    │    Database     │    │  Admin Panel    │
│  (JavaScript)   │    │ (MySQL/SQLite)  │    │   (Next.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### System Requirements

- **PHP**: 8.1 or higher
- **Node.js**: 18.0 or higher
- **Database**: MySQL 8.0+ or SQLite 3.35+
- **Web Server**: Apache/Nginx
- **SSL Certificate**: Required for production

### Dependencies

#### Backend (Laravel)
```json
{
  "php": "^8.1",
  "laravel/framework": "^10.0",
  "tymon/jwt-auth": "^2.0",
  "laravel/sanctum": "^3.0"
}
```

#### Frontend (Next.js)
```json
{
  "next": "14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0"
}
```

## Backend Integration

### 1. Database Setup

#### Migration Files

Create the following database tables:

```sql
-- Users table (if not exists)
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'affiliate', 'user') DEFAULT 'user',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL
);

-- Affiliates table
CREATE TABLE affiliates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('active', 'pending', 'suspended') DEFAULT 'pending',
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    commission_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    commission_strategy ENUM('flat', 'tier_referrals', 'tier_volume') DEFAULT 'flat',
    commission_tiers JSON NULL,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    pending_balance DECIMAL(10,2) DEFAULT 0.00,
    current_balance DECIMAL(10,2) DEFAULT 0.00,
    bank_name VARCHAR(255) NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Clicks table
CREATE TABLE clicks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id BIGINT UNSIGNED NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    referrer_url TEXT NULL,
    landing_page TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
);

-- Sales table
CREATE TABLE sales (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id BIGINT UNSIGNED NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NULL,
    customer_name VARCHAR(255) NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
);

-- Affiliate Links table
CREATE TABLE affiliate_links (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    url TEXT NOT NULL,
    clicks_count INT DEFAULT 0,
    conversions_count INT DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    affiliate_id BIGINT UNSIGNED NOT NULL,
    type ENUM('commission', 'payout', 'adjustment') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    read_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. Laravel Models

#### Affiliate Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'bank_name'
    ];

    protected $casts = [
        'commission_tiers' => 'array',
        'total_earnings' => 'decimal:2',
        'pending_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'commission_rate' => 'decimal:2'
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
}
```

#### Sale Model
```php
<?php

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
        'amount',
        'commission_amount',
        'status'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'commission_amount' => 'decimal:2'
    ];

    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(Affiliate::class);
    }
}
```

### 3. API Controllers

#### AffiliateController
```php
<?php

namespace App\Http\Controllers;

use App\Models\Affiliate;
use App\Models\Click;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AffiliateController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role' => 'affiliate'
        ]);

        $affiliate = Affiliate::create([
            'user_id' => $user->id,
            'referral_code' => $this->generateReferralCode(),
            'status' => 'pending'
        ]);

        return response()->json([
            'message' => 'Affiliate registered successfully',
            'affiliate' => $affiliate->load('user')
        ], 201);
    }

    public function trackClick(Request $request, $referralCode)
    {
        $affiliate = Affiliate::where('referral_code', $referralCode)->first();
        
        if (!$affiliate) {
            return response()->json(['error' => 'Invalid referral code'], 404);
        }

        Click::create([
            'affiliate_id' => $affiliate->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referrer_url' => $request->header('referer'),
            'landing_page' => $request->input('landing_page')
        ]);

        // Set cookie for tracking
        $cookie = cookie('affiliate_ref', $referralCode, 60 * 24 * 30); // 30 days

        return response()->json(['success' => true])->cookie($cookie);
    }

    public function trackSale(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'customer_email' => 'required|email',
            'customer_name' => 'required|string'
        ]);

        $referralCode = $request->cookie('affiliate_ref');
        
        if (!$referralCode) {
            return response()->json(['message' => 'No affiliate referral found'], 200);
        }

        $affiliate = Affiliate::where('referral_code', $referralCode)->first();
        
        if (!$affiliate) {
            return response()->json(['message' => 'Invalid affiliate referral'], 200);
        }

        $commissionAmount = $this->calculateCommission($affiliate, $request->amount);

        $sale = Sale::create([
            'affiliate_id' => $affiliate->id,
            'order_id' => $request->order_id,
            'customer_email' => $request->customer_email,
            'customer_name' => $request->customer_name,
            'amount' => $request->amount,
            'commission_amount' => $commissionAmount,
            'status' => 'pending'
        ]);

        // Update affiliate balances
        $affiliate->increment('pending_balance', $commissionAmount);
        $affiliate->increment('total_earnings', $commissionAmount);

        return response()->json([
            'message' => 'Sale tracked successfully',
            'commission' => $commissionAmount
        ]);
    }

    private function generateReferralCode()
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (Affiliate::where('referral_code', $code)->exists());

        return $code;
    }

    private function calculateCommission(Affiliate $affiliate, $saleAmount)
    {
        if ($affiliate->commission_type === 'fixed') {
            return $affiliate->commission_rate;
        }

        return ($saleAmount * $affiliate->commission_rate) / 100;
    }
}
```

### 4. API Routes

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AffiliateController;
use App\Http\Controllers\AdminController;

// Public routes
Route::post('/affiliate/register', [AffiliateController::class, 'register']);
Route::get('/track/click/{referralCode}', [AffiliateController::class, 'trackClick']);
Route::post('/track/sale', [AffiliateController::class, 'trackSale']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Affiliate routes
    Route::prefix('affiliate')->group(function () {
        Route::get('/dashboard', [AffiliateController::class, 'dashboard']);
        Route::get('/stats', [AffiliateController::class, 'stats']);
        Route::get('/links', [AffiliateController::class, 'links']);
        Route::post('/links', [AffiliateController::class, 'createLink']);
        Route::get('/sales', [AffiliateController::class, 'sales']);
        Route::get('/earnings', [AffiliateController::class, 'earnings']);
    });

    // Admin routes
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/summary', [AdminController::class, 'summary']);
        Route::get('/affiliates', [AdminController::class, 'affiliates']);
        Route::put('/affiliates/{id}/status', [AdminController::class, 'updateAffiliateStatus']);
        Route::get('/sales', [AdminController::class, 'sales']);
        Route::get('/analytics/clicks', [AdminController::class, 'clicksAnalytics']);
        Route::get('/analytics/devices', [AdminController::class, 'devicesAnalytics']);
        Route::get('/analytics/geo', [AdminController::class, 'geoAnalytics']);
    });
});
```

## Frontend Integration

### 1. Environment Configuration

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. API Client Setup

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Authentication Context

```typescript
// context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/user');
      setUser(data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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

## Tracking Implementation

### 1. JavaScript Tracking Script

Create this script to be embedded on FalakCart pages:

```javascript
// FALAKCART_TRACKING_SCRIPT.js
(function() {
    'use strict';
    
    const AFFILIATE_API_URL = 'https://your-affiliate-domain.com/api';
    
    // Get referral code from URL or cookie
    function getReferralCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode) {
            // Store in cookie for 30 days
            document.cookie = `affiliate_ref=${refCode}; max-age=${30 * 24 * 60 * 60}; path=/`;
            return refCode;
        }
        
        // Check existing cookie
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'affiliate_ref') {
                return value;
            }
        }
        
        return null;
    }
    
    // Track click
    function trackClick(referralCode) {
        fetch(`${AFFILIATE_API_URL}/track/click/${referralCode}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        }).catch(error => {
            console.warn('Affiliate tracking error:', error);
        });
    }
    
    // Track sale/conversion
    function trackSale(orderData) {
        const referralCode = getReferralCode();
        if (!referralCode) return;
        
        fetch(`${AFFILIATE_API_URL}/track/sale`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: orderData.orderId,
                amount: orderData.amount,
                customer_email: orderData.customerEmail,
                customer_name: orderData.customerName
            })
        }).catch(error => {
            console.warn('Affiliate sale tracking error:', error);
        });
    }
    
    // Initialize tracking
    function init() {
        const referralCode = getReferralCode();
        if (referralCode) {
            trackClick(referralCode);
        }
    }
    
    // Public API
    window.FalakAffiliateTracker = {
        trackSale: trackSale,
        getReferralCode: getReferralCode
    };
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
```

### 2. Integration in FalakCart

#### Step 1: Add tracking script to all pages

Add this to your main layout template:

```html
<!-- Add before closing </body> tag -->
<script src="https://your-affiliate-domain.com/tracking.js"></script>
```

#### Step 2: Track conversions on order completion

Add this to your order success/thank you page:

```html
<script>
// After successful order
if (window.FalakAffiliateTracker) {
    window.FalakAffiliateTracker.trackSale({
        orderId: '{{ $order->id }}',
        amount: {{ $order->total }},
        customerEmail: '{{ $order->customer_email }}',
        customerName: '{{ $order->customer_name }}'
    });
}
</script>
```

#### Step 3: Handle affiliate referral links

Update your routing to handle referral parameters:

```php
// In your FalakCart routes
Route::get('/product/{slug}', function($slug) {
    $referralCode = request('ref');
    if ($referralCode) {
        // Validate referral code exists
        $affiliate = \App\Models\Affiliate::where('referral_code', $referralCode)->first();
        if ($affiliate) {
            // Set cookie and redirect to clean URL
            return redirect("/product/{$slug}")
                ->cookie('affiliate_ref', $referralCode, 60 * 24 * 30);
        }
    }
    
    // Normal product display logic
    return view('product.show', compact('slug'));
});
```

## API Endpoints

### Authentication Endpoints

```
POST /api/login
POST /api/register
POST /api/logout
GET  /api/user
```

### Affiliate Endpoints

```
GET  /api/affiliate/dashboard
GET  /api/affiliate/stats
GET  /api/affiliate/links
POST /api/affiliate/links
GET  /api/affiliate/sales
GET  /api/affiliate/earnings
PUT  /api/affiliate/profile
```

### Admin Endpoints

```
GET  /api/admin/summary
GET  /api/admin/affiliates
PUT  /api/admin/affiliates/{id}/status
GET  /api/admin/sales
GET  /api/admin/analytics/clicks
GET  /api/admin/analytics/devices
GET  /api/admin/analytics/geo
POST /api/admin/payouts/{id}/approve
```

### Tracking Endpoints

```
GET  /api/track/click/{referralCode}
POST /api/track/sale
```

## Testing

### 1. Backend Testing

Create test files for API endpoints:

```php
<?php
// tests/Feature/AffiliateTest.php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Affiliate;

class AffiliateTest extends TestCase
{
    public function test_affiliate_registration()
    {
        $response = $this->postJson('/api/affiliate/register', [
            'name' => 'Test Affiliate',
            'email' => 'test@example.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'affiliate' => [
                        'id',
                        'referral_code',
                        'user' => ['name', 'email']
                    ]
                ]);
    }

    public function test_click_tracking()
    {
        $affiliate = Affiliate::factory()->create();
        
        $response = $this->getJson("/api/track/click/{$affiliate->referral_code}");
        
        $response->assertStatus(200);
        $this->assertDatabaseHas('clicks', [
            'affiliate_id' => $affiliate->id
        ]);
    }
}
```

### 2. Frontend Testing

Test the tracking script:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Affiliate Tracking Test</title>
</head>
<body>
    <h1>Test Page</h1>
    <button onclick="testSaleTracking()">Test Sale Tracking</button>
    
    <script src="https://your-affiliate-domain.com/tracking.js"></script>
    <script>
        function testSaleTracking() {
            if (window.FalakAffiliateTracker) {
                window.FalakAffiliateTracker.trackSale({
                    orderId: 'TEST-' + Date.now(),
                    amount: 99.99,
                    customerEmail: 'test@example.com',
                    customerName: 'Test Customer'
                });
                alert('Sale tracking test completed');
            }
        }
    </script>
</body>
</html>
```

### 3. Integration Testing

Test the complete flow:

1. Visit: `https://falakcart.com/product/example?ref=ABC12345`
2. Complete a purchase
3. Check affiliate dashboard for tracked click and sale
4. Verify commission calculation

## Deployment

### 1. Backend Deployment

```bash
# Clone repository
git clone https://github.com/your-repo/affiliate-system.git
cd affiliate-system/backend

# Install dependencies
composer install --no-dev --optimize-autoloader

# Set up environment
cp .env.example .env
php artisan key:generate

# Configure database
php artisan migrate --force
php artisan db:seed --class=AdminSeeder

# Set permissions
chmod -R 755 storage bootstrap/cache
```

### 2. Frontend Deployment

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm ci

# Build application
npm run build

# Start production server
npm start
```

### 3. Web Server Configuration

#### Nginx Configuration

```nginx
# Backend API
server {
    listen 80;
    server_name api.your-affiliate-domain.com;
    root /var/www/affiliate-system/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}

# Frontend Application
server {
    listen 80;
    server_name your-affiliate-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Tracking Script
server {
    listen 80;
    server_name your-affiliate-domain.com;
    
    location /tracking.js {
        root /var/www/affiliate-system;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=3600";
    }
}
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors

Add CORS configuration to Laravel:

```php
// config/cors.php
return [
    'paths' => ['api/*', 'track/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['https://falakcart.com'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

#### 2. Cookie Issues

Ensure cookies are set with correct domain:

```php
// In your tracking controller
return response()->json(['success' => true])
    ->cookie('affiliate_ref', $referralCode, 60 * 24 * 30, '/', '.falakcart.com', true, false);
```

#### 3. Database Connection Issues

Check database configuration:

```php
// .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=affiliate_system
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### Debug Mode

Enable debug logging:

```php
// .env
APP_DEBUG=true
LOG_LEVEL=debug
```

### Performance Optimization

1. **Database Indexing**:
```sql
CREATE INDEX idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX idx_clicks_affiliate_id ON clicks(affiliate_id);
CREATE INDEX idx_sales_affiliate_id ON sales(affiliate_id);
```

2. **Caching**:
```php
// Cache affiliate data
Cache::remember("affiliate.{$referralCode}", 3600, function() use ($referralCode) {
    return Affiliate::where('referral_code', $referralCode)->first();
});
```

## Support

For technical support or questions:

- **Email**: support@your-affiliate-domain.com
- **Documentation**: https://docs.your-affiliate-domain.com
- **API Reference**: https://api.your-affiliate-domain.com/docs

## Security Considerations

1. **Rate Limiting**: Implement rate limiting on tracking endpoints
2. **Input Validation**: Validate all input data
3. **HTTPS Only**: Use HTTPS in production
4. **API Authentication**: Secure admin endpoints with proper authentication
5. **Data Encryption**: Encrypt sensitive data in database

## Conclusion

This integration guide provides a complete implementation of the FalakCart Affiliate System. Follow the steps carefully and test thoroughly before deploying to production.

For any questions or issues during integration, please contact our support team.