'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Translations = Record<string, any>;

interface TranslationContextType {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: 'ar' | 'en';
  changeLanguage: (newLocale: 'ar' | 'en') => void;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
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
      document.body.style.fontFamily = 'var(--font-cairo)';
    }
    
    // Load translations
    const loadTranslations = async (locale: 'ar' | 'en') => {
      setIsLoading(true);
      try {
        const res = await fetch(`/locales/${locale}.json`);
        if (!res.ok) {
          throw new Error(`Failed to load ${locale}.json: ${res.status}`);
        }
        const data = await res.json();
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
      } catch (err) {
        console.error('Failed to load translations:', err);
        setTranslations({});
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    loadTranslations(savedLocale);

    // Listen for language changes
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

  const changeLanguage = async (newLocale: 'ar' | 'en') => {
    setIsLoading(true);
    
    try {
      const res = await fetch(`/locales/${newLocale}.json`);
      const data = await res.json();
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
    } catch (err) {
      console.error('Failed to load translations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let translation: any = translations;
    
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        translation = key;
        break;
      }
    }
    
    if (typeof translation !== 'string') {
      translation = key;
    }
    
    if (params && typeof translation === 'string') {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param]));
      });
    }
    
    return translation;
  };

  return (
    <TranslationContext.Provider value={{ t, locale, changeLanguage, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
