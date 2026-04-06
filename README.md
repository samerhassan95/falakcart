# FalakCart Affiliate System

A standalone, secure, and premium affiliate platform built with Laravel and Next.js.

## Tech Stack
- **Backend**: PHP Laravel (API only)
- **Authentication**: JWT (JSON Web Token)
- **Frontend**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS 4
- **Database**: MySQL

## Quick Start

### 1. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
# Configure your MySQL database in .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan serve
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Usage Flow
1. **Register** as a new account on the frontend.
2. **Login** to access your **Affiliate Dashboard**.
3. **Copy your Referral Link** (e.g., `http://localhost:3000/refer/CODE`).
4. **Visit the Link** in a new tab/browser. You will be tracked and redirected to the welcome page.
5. **Simulate a Sale** by clicking "Complete Subscription" on the welcome page.
6. **Refresh the Dashboard** to see your earnings and stats update automatically!

## Features
- **JWT Auth**: Secure token-based authentication.
- **Dynamic Links**: Generate unique referral codes for every affiliate.
- **Real-time Tracking**: Clicks and sales are recorded instantly.
- **Admin Panel**: Manage status and view network-wide performance.
- **Premium UI**: Sleek dark mode with glassmorphism and smooth animations.
