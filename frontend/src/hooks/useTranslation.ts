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
    const loadTranslations = (locale: 'ar' | 'en') => {
      setIsLoading(true);
      fetch(`/locales/${locale}.json`)
        .then(res => res.json())
        .then(data => {
          setTranslations(data);
          setLocale(locale);
          
          // Update document direction and lang
          document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = locale;
          
          // Save to localStorage
          localStorage.setItem('NEXT_LOCALE', locale);
          localStorage.setItem('NEXT_DIR', locale === 'ar' ? 'rtl' : 'ltr');
          
          // Update font
          if (locale === 'ar') {
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
    };

    // Initial load
    loadTranslations(savedLocale);

    // Listen for language changes from LanguageSwitcher
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'NEXT_LOCALE' && e.newValue) {
        loadTranslations(e.newValue as 'ar' | 'en');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const changeLanguage = (newLocale: 'ar' | 'en') => {
    setIsLoading(true);
    
    // Load new translations
    fetch(`/locales/${newLocale}.json`)
      .then(res => res.json())
      .then(data => {
        setTranslations(data);
        setLocale(newLocale);
        
        // Save to localStorage
        localStorage.setItem('NEXT_LOCALE', newLocale);
        localStorage.setItem('NEXT_DIR', newLocale === 'ar' ? 'rtl' : 'ltr');
        
        // Update document direction and lang
        document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = newLocale;
        
        // Update font
        if (newLocale === 'ar') {
          document.body.style.fontFamily = 'var(--font-cairo)';
        } else {
          document.body.style.fontFamily = 'var(--font-geist-sans)';
        }
        
        // Trigger storage event for other components to listen
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'NEXT_LOCALE',
          newValue: newLocale,
          oldValue: locale
        }));
      })
      .catch(err => {
        console.error('Failed to load translations:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
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
