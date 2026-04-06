# 🚀 تشغيل المشروع مع نظام الترجمة

## ✅ تم إضافة نظام الترجمة بنجاح!

### المميزات:
- ✅ دعم العربية والإنجليزية
- ✅ اللغة الافتراضية: العربية
- ✅ زر تبديل اللغة في الـ Header
- ✅ تغيير اتجاه الصفحة تلقائياً (RTL/LTR)
- ✅ تغيير الخط تلقائياً (Cairo للعربية)
- ✅ حفظ اللغة المختارة في Cookie

## 🎯 كيفية التشغيل

### 1. تشغيل الـ Backend (Laravel)
```bash
cd backend
php artisan serve
```

### 2. تشغيل الـ Frontend (Next.js)
```bash
cd frontend
npm run dev
```

### 3. افتح المتصفح
```
http://localhost:3000
```

## 🌐 استخدام نظام الترجمة

### في أي صفحة:
```tsx
import { useTranslation } from '@/hooks/useTranslation';

export default function MyPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.welcome', { name: 'أحمد' })}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

## 📁 الملفات المهمة

### ملفات الترجمة:
- `messages/ar.json` - الترجمات العربية
- `messages/en.json` - الترجمات الإنجليزية

### Hook الترجمة:
- `src/hooks/useTranslation.ts`

### مكون تبديل اللغة:
- `src/components/LanguageSwitcher.tsx`

## 📖 دليل كامل
اقرأ `TRANSLATION_GUIDE.md` للتفاصيل الكاملة

## 🎨 مكان زر اللغة
تم إضافة زر تبديل اللغة في:
- الـ Header بجانب الإشعارات
- يظهر في كل الصفحات

## ⚡ الخطوات التالية

لترجمة أي صفحة:
1. افتح الصفحة
2. أضف `import { useTranslation } from '@/hooks/useTranslation';`
3. استخدم `const { t } = useTranslation();`
4. استبدل النصوص بـ `{t('key.path')}`
5. أضف الترجمات في ملفات JSON

## 🔥 مثال سريع

### قبل:
```tsx
<h1>Welcome back, {user.name}</h1>
<button>Save Changes</button>
```

### بعد:
```tsx
const { t } = useTranslation();

<h1>{t('dashboard.welcome', { name: user.name })}</h1>
<button>{t('common.save')}</button>
```

## ✨ كل شيء جاهز!
الموقع الآن يدعم العربية والإنجليزية بشكل كامل. فقط شغل المشروع وجرب زر اللغة! 🎉
