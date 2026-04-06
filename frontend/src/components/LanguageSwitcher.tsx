'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<'ar' | 'en'>('ar');
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('NEXT_LOCALE='));
    const locale = cookie ? cookie.split('=')[1] as 'ar' | 'en' : 'ar';
    setCurrentLocale(locale);
  }, []);

  const changeLanguage = (locale: 'ar' | 'en') => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLocale === 'ar' ? 'العربية' : 'English'}</span>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button
              onClick={() => changeLanguage('ar')}
              className={`block w-full text-right px-4 py-2 text-sm hover:bg-gray-50 transition-colors rounded-t-lg ${
                currentLocale === 'ar' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`block w-full text-right px-4 py-2 text-sm hover:bg-gray-50 transition-colors rounded-b-lg ${
                currentLocale === 'en' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'
              }`}
            >
              English
            </button>
          </div>
        </>
      )}
    </div>
  );
}
