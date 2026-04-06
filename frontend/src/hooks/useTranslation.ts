'use client';

import { useState, useEffect } from 'react';

type Translations = Record<string, string>;

export function useTranslation() {
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    // Get locale from cookie or default to 'ar'
    const cookie = document.cookie.split('; ').find(row => row.startsWith('NEXT_LOCALE='));
    const savedLocale = cookie ? cookie.split('=')[1] as 'ar' | 'en' : 'ar';
    
    // Load translations
    fetch(`/locales/${savedLocale}.json`)
      .then(res => res.json())
      .then(data => {
        setTranslations(data);
        setLocale(savedLocale);
        
        // Update document direction and lang
        document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = savedLocale;
        
        // Update font
        if (savedLocale === 'ar') {
          document.body.style.fontFamily = 'var(--font-cairo)';
        } else {
          document.body.style.fontFamily = 'var(--font-geist-sans)';
        }
      });
  }, []);

  const changeLanguage = (newLocale: 'ar' | 'en') => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return { t, locale, changeLanguage };
}
