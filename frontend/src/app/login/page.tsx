'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import Image from 'next/image';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentLocale, setCurrentLocale] = useState('ar');
  const { login } = useAuth();
  const { t, isLoading } = useTranslation();

  useEffect(() => {
    // Get current locale from localStorage
    const locale = localStorage.getItem('NEXT_LOCALE') || 'ar';
    setCurrentLocale(locale);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      setError(errorResponse.response?.data?.error || t('auth.loginFailed'));
    }
  };

  // Show loading state while translations are loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#050C9C] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const logoSrc = currentLocale === 'ar' ? '/FalakLogoDarkAr.png' : '/FalakLogoDark.png';

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Image 
                src={logoSrc}
                alt="FalakCart Logo" 
                width={180} 
                height={60}
                priority
                className="object-contain"
              />
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#191C1E] mb-2">
                {t('auth.signInToAccount')}
              </h2>
              <p className="text-sm text-[#505F76]">
                {t('auth.orCreateAccount')}{' '}
                <Link href="/register" className="font-semibold text-[#050C9C] hover:text-[#050C9C]/80 transition-colors">
                  {t('auth.createNewAccount')}
                </Link>
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email-address" className="block text-sm font-semibold text-[#191C1E] mb-2">
                  {t('auth.emailAddress')}
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F8F9FA] text-[#191C1E] placeholder-[#505F76]/50 focus:outline-none focus:ring-2 focus:ring-[#050C9C]/20 focus:border-[#050C9C] transition-all"
                  placeholder={t('auth.emailAddress')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#191C1E] mb-2">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F8F9FA] text-[#191C1E] placeholder-[#505F76]/50 focus:outline-none focus:ring-2 focus:ring-[#050C9C]/20 focus:border-[#050C9C] transition-all"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg, #2A14B4 0%, #4338CA 100%)' }}
              >
                {t('auth.signIn')}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-[#505F76] mt-6">
            © 2024 FalakCart. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
