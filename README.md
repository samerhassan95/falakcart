# FalakCart Affiliate System

نظام الأفلييت الكامل لـ FalakCart مع Laravel Backend و Next.js Frontend

## 🚀 Quick Start

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/affiliate-system.git
cd affiliate-system

# Install dependencies
npm run install-all

# Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Run migrations
npm run migrate
npm run seed

# Start development servers
npm run dev-backend  # Laravel on :8000
npm run dev-frontend # Next.js on :3000
```

### Production Deployment (aPanel)

#### Method 1: Direct Upload
```bash
# Build the project
npm run build

# Upload entire project to aPanel
# Run deployment script
npm run deploy
```

#### Method 2: Git Deployment
```bash
# Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# In aPanel terminal:
git clone https://github.com/yourusername/affiliate-system.git
cd affiliate-system
npm run deploy
```

## 📁 Project Structure

```
affiliate-system/
├── backend/                 # Laravel API
│   ├── app/
│   ├── config/
│   ├── database/
│   └── public/
├── frontend/               # Next.js App
│   ├── src/
│   ├── public/
│   └── out/               # Built static files
├── deploy-apanel.sh       # Deployment script
└── README.md
```

## 🔧 Configuration

### Backend (.env)
```env
APP_URL=https://yourdomain.com
DB_HOST=localhost
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

## 🌐 URLs After Deployment

- **API**: `https://yourdomain.com/api/`
- **Frontend**: `https://yourdomain.com/frontend/`
- **Admin Panel**: `https://yourdomain.com/frontend/admin/`
- **Login**: `https://yourdomain.com/frontend/login/`

## 📋 Features

- ✅ Complete Affiliate Management System
- ✅ Real-time Analytics Dashboard
- ✅ Multi-language Support (Arabic/English)
- ✅ Secure JWT Authentication
- ✅ Commission Tracking
- ✅ Payout Management
- ✅ FalakCart Integration
- ✅ Responsive Design

## 🛠 Tech Stack

- **Backend**: Laravel 10, MySQL, JWT
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Deployment**: aPanel, Shared Hosting Compatible

## 📞 Support

For support, contact: [your-email@domain.com]