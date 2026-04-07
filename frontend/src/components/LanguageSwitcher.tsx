'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<'ar' | 'en'>('ar');
  const [isOpen, setIsOpen] = useState(false);
  const [isRTL, setIsRTL] = useState(true);
  
  useEffect(() => {
    // Get locale from localStorage or default to 'ar'
    const locale = (localStorage.getItem('NEXT_LOCALE') as 'ar' | 'en') || 'ar';
    setCurrentLocale(locale);
    setIsRTL(locale === 'ar');
  }, []);

  const changeLanguage = (locale: 'ar' | 'en') => {
    // Save to localStorage
    localStorage.setItem('NEXT_LOCALE', locale);
    localStorage.setItem('NEXT_DIR', locale === 'ar' ? 'rtl' : 'ltr');
    
    // Update document direction and lang
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    
    // Update state
    setCurrentLocale(locale);
    setIsRTL(locale === 'ar');
    setIsOpen(false);
    
    // Reload to apply changes
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#191C1E] hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50`}>
            <button
              onClick={() => changeLanguage('ar')}
              className={`block w-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors rounded-t-lg ${
                currentLocale === 'ar' ? 'bg-indigo-50 text-[#050C9C] font-semibold' : 'text-gray-700'
              } ${isRTL ? 'text-right' : 'text-left'}`}
            >
              العربية
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`block w-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors rounded-b-lg ${
                currentLocale === 'en' ? 'bg-indigo-50 text-[#050C9C] font-semibold' : 'text-gray-700'
              } ${isRTL ? 'text-right' : 'text-left'}`}
            >
              English
            </button>
          </div>
        </>
      )}
    </div>
  );
}
