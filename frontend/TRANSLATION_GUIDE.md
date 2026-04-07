# دليل استخدام نظام الترجمة

## نظرة عامة
تم إضافة نظام ترجمة بسيط للموقع يدعم العربية والإنجليزية. اللغة الافتراضية هي العربية.

## الملفات المهمة

### 1. ملفات الترجمة
- `messages/ar.json` - الترجمات العربية
- `messages/en.json` - الترجمات الإنجليزية

### 2. Hook الترجمة
- `src/hooks/useTranslation.ts` - Hook مخصص للترجمة

### 3. مكون تبديل اللغة
- `src/components/LanguageSwitcher.tsx` - زر تغيير اللغة

## كيفية الاستخدام

### في أي صفحة أو مكون:

```tsx
'use client';

import { useTranslation } from '@/hooks/useTranslation';

export default function MyComponent() {
  const { t, locale, changeLanguage } = useTranslation();

  return (
    <div>
      {/* استخدام الترجمة البسيطة */}
      <h1>{t('dashboard.welcome')}</h1>
      
      {/* استخدام الترجمة مع متغيرات */}
      <p>{t('dashboard.welcome', { name: 'أحمد' })}</p>
      
      {/* معرفة اللغة الحالية */}
      <p>Current language: {locale}</p>
      
      {/* تغيير اللغة برمجياً */}
      <button onClick={() => changeLanguage('en')}>
        Switch to English
      </button>
    </div>
  );
}
```

## إضافة ترجمات جديدة

### في `messages/ar.json`:
```json
{
  "mySection": {
    "title": "العنوان",
    "description": "الوصف",
    "greeting": "مرحباً {name}"
  }
}
```

### في `messages/en.json`:
```json
{
  "mySection": {
    "title": "Title",
    "description": "Description",
    "greeting": "Hello {name}"
  }
}
```

### الاستخدام:
```tsx
{t('mySection.title')}
{t('mySection.greeting', { name: 'Ahmed' })}
```

## مكون تبديل اللغة

تم إضافة `LanguageSwitcher` في الـ AppLayout. يمكنك إضافته في أي مكان:

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

<LanguageSwitcher />
```

## الترجمات المتوفرة حالياً

### الأقسام الرئيسية:
- `common` - كلمات عامة (حفظ، إلغاء، تحميل، إلخ)
- `nav` - عناصر القائمة
- `auth` - صفحات تسجيل الدخول والتسجيل
- `dashboard` - لوحة التحكم الرئيسية
- `analytics` - صفحة التحليلات
- `links` - صفحة الروابط
- `referrals` - صفحة الإحالات
- `earnings` - صفحة الأرباح
- `settings` - صفحة الإعدادات
- `admin` - لوحة الإدارة

## ملاحظات مهمة

1. اللغة الافتراضية هي العربية
2. يتم حفظ اللغة المختارة في Cookie
3. عند تغيير اللغة، يتم إعادة تحميل الصفحة تلقائياً
4. يتم تغيير اتجاه الصفحة (RTL/LTR) تلقائياً
5. يتم تغيير الخط تلقائياً (Cairo للعربية، Geist للإنجليزية)

## مثال كامل

```tsx
'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';

export default function ExamplePage() {
  const { t, locale } = useTranslation();
  const [name, setName] = useState('أحمد');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        {t('dashboard.welcome', { name })}
      </h1>
      
      <p className="mt-4">
        {t('dashboard.performanceOverview')}
      </p>
      
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        {t('common.save')}
      </button>
      
      <p className="mt-4 text-sm text-[#505F76]">
        {locale === 'ar' ? 'اللغة الحالية: العربية' : 'Current Language: English'}
      </p>
    </div>
  );
}
```

## الخطوات التالية

لترجمة صفحة معينة:

1. افتح الصفحة المطلوبة
2. أضف `import { useTranslation } from '@/hooks/useTranslation';`
3. استخدم `const { t } = useTranslation();`
4. استبدل النصوص الثابتة بـ `{t('key.path')}`
5. أضف الترجمات في `messages/ar.json` و `messages/en.json`

مثال:
```tsx
// قبل
<h1>Welcome back, {user.name}</h1>

// بعد
<h1>{t('dashboard.welcome', { name: user.name })}</h1>
```
