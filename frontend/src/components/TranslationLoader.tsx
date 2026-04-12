'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { ReactNode } from 'react';

export default function TranslationLoader({ children }: { children: ReactNode }) {
  const { isLoading } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#050C9C] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
