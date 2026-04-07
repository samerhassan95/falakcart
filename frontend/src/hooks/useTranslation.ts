'use client';

import { useState, useEffect } from 'react';

type Translations = Record<string, string>;

export function useTranslation() {
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get locale from localStorage or default to 'ar'
    const savedLocale = (localStorage.getItem('NEXT_LOCALE') as 'ar' | 'en') || 'ar';
    
    // Load translations
    setIsLoading(true);
    fetch(`/locales/${savedLocale}.json`)
      .then(res => res.json())
      .then(data => {
        setTranslations(data);
        setLocale(savedLocale);
        
        // Update document direction and lang
        document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = savedLocale;
        
        // Save to localStorage
        localStorage.setItem('NEXT_LOCALE', savedLocale);
        localStorage.setItem('NEXT_DIR', savedLocale === 'ar' ? 'rtl' : 'ltr');
        
        // Update font
        if (savedLocale === 'ar') {
          document.body.style.fontFamily = 'var(--font-cairo)';
        } else {
          document.body.style.fontFamily = 'var(--font-geist-sans)';
        }
      })
      .catch(err => {
        console.error('Failed to load translations:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const changeLanguage = (newLocale: 'ar' | 'en') => {
    // Save to localStorage
    localStorage.setItem('NEXT_LOCALE', newLocale);
    localStorage.setItem('NEXT_DIR', newLocale === 'ar' ? 'rtl' : 'ltr');
    
    // Update document direction and lang immediately
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
    
    // Reload to apply changes
    window.location.reload();
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[key] || key;
    
    // Replace placeholders like {name}, {rate}, etc.
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`{${param}}`, 'g'), String(params[param]));
      });
    }
    
    return translation;
  };

  return { t, locale, changeLanguage, isLoading };
}
