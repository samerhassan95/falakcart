'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';

interface AuthLayoutProps {
  children: React.ReactNode;
  showLanguageSwitcher?: boolean;
  backgroundColor?: string;
}

export default function AuthLayout({ 
  children, 
  showLanguageSwitcher = true,
  backgroundColor = 'bg-[#F8F9FA]'
}: AuthLayoutProps) {
  const [currentLocale, setCurrentLocale] = useState('ar');
  const { isLoading } = useTranslation();

  useEffect(() => {
    const locale = localStorage.getItem('NEXT_LOCALE') || 'ar';
    setCurrentLocale(locale);
  }, []);

  if (isLoading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${backgroundColor}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#050C9C] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${backgroundColor} relative`}>
      {/* Language Switcher - positioned absolutely */}
      {showLanguageSwitcher && (
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher />
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}