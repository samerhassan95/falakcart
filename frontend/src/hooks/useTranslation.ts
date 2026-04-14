'use client';

import { useState, useEffect } from 'react';

type Translations = Record<string, any>;

export function useTranslation() {
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get locale from localStorage or default to 'ar'
    const savedLocale = (localStorage.getItem('NEXT_LOCALE') as 'ar' | 'en') || 'ar';
    
    // Set initial document direction for Arabic if no locale is saved
    if (!localStorage.getItem('NEXT_LOCALE')) {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
      localStorage.setItem('NEXT_LOCALE', 'ar');
      localStorage.setItem('NEXT_DIR', 'rtl');
      // Set Arabic font as default
      document.body.style.fontFamily = 'var(--font-cairo)';
    }
    
    // Load translations
    const loadTranslations = (locale: 'ar' | 'en') => {
      // Force refresh for this specific update to solve the 22% bug
      const cacheVersion = 'v6';
      const cacheKey = `translations_${locale}_${cacheVersion}`;
      
      // Clear old cache versions
      for (let i = 1; i <= 5; i++) {
        sessionStorage.removeItem(`translations_${locale}_v${i}`);
        sessionStorage.removeItem(`translations_${locale}`);
      }
      
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {

        try {
          const data = JSON.parse(cached);
          setTranslations(data);
          setLocale(locale);
          
          // Update document direction and lang
          document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = locale;
          
          // Update font
          if (locale === 'ar') {
            document.body.style.fontFamily = 'var(--font-cairo)';
          } else {
            document.body.style.fontFamily = 'var(--font-geist-sans)';
          }
          
          setIsLoading(false);
          return;
        } catch (err) {
          console.error('Failed to parse cached translations:', err);
        }
      }
      
      // If not cached, fetch from server
      setIsLoading(true);
      fetch(`/locales/${locale}.json?v=${new Date().getTime()}&cache=false`)
        .then(res => {

          if (!res.ok) {
            throw new Error(`Failed to load ${locale}.json: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log(`Loaded ${locale} translations:`, Object.keys(data));
          
          // Cache translations in sessionStorage
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          } catch (err) {
            console.error('Failed to cache translations:', err);
          }
          
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
          // Fallback to empty translations
          setTranslations({});
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
    // Check if translations are cached
    const cacheKey = `translations_${newLocale}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const data = JSON.parse(cached);
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
        
        // Trigger storage event
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'NEXT_LOCALE',
          newValue: newLocale,
          oldValue: locale
        }));
        
        return;
      } catch (err) {
        console.error('Failed to parse cached translations:', err);
      }
    }
    
    setIsLoading(true);
    
    // Load new translations
    fetch(`/locales/${newLocale}.json?v=${new Date().getTime()}&cache=false`)
      .then(res => res.json())
      .then(data => {
        // Cache translations
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (err) {
          console.error('Failed to cache translations:', err);
        }
        
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
    // Handle nested keys like 'navigation.dashboard'
    const keys = key.split('.');
    let translation: any = translations;
    
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // If key not found, return the original key
        console.warn(`Translation key not found: ${key} for locale: ${locale}`, {
          availableKeys: Object.keys(translations),
          searchedPath: keys,
          currentTranslation: translation
        });
        translation = key;
        break;
      }
    }
    
    // Ensure we have a string
    if (typeof translation !== 'string') {
      console.warn(`Translation is not a string for key: ${key}, got:`, translation);
      translation = key;
    }
    
    // Replace placeholders like {name}, {rate}, etc.
    if (params && typeof translation === 'string') {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param]));
      });
    }
    
    return translation;
  };

  return { t, locale, changeLanguage, isLoading };
}
