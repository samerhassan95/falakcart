'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import Image from 'next/image';


export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [currentLocale, setCurrentLocale] = useState('ar');
  const { register } = useAuth();
  const { t, isLoading } = useTranslation();

  useEffect(() => {
    // Get current locale from localStorage
    const locale = localStorage.getItem('NEXT_LOCALE') || 'ar';
    setCurrentLocale(locale);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    try {
      await register({ name, email, password });
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } };
      setError(errorResponse.response?.data?.error || t('auth.registrationFailed'));
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
<<<<<<< HEAD
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-4">
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
=======
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-4">
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

        {/* Register Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-[#191C1E] mb-2">
              {t('auth.createAffiliateAccount')}
            </h2>
            <p className="text-sm text-[#505F76]">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link href="/login" className="font-semibold text-[#050C9C] hover:text-[#050C9C]/80 transition-colors">
                {t('auth.signInHere')}
              </Link>
            </p>
>>>>>>> 24d311596a139609f30fa4cfde7869e5df976d82
          </div>

          {/* Register Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-[#191C1E] mb-2">
                {t('auth.createAffiliateAccount')}
              </h2>
              <p className="text-sm text-[#505F76]">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link href="/login" className="font-semibold text-[#050C9C] hover:text-[#050C9C]/80 transition-colors">
                  {t('auth.signInHere')}
                </Link>
              </p>
            </div>

            <form className="space-y-2" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-[#191C1E] mb-2">
                  {t('auth.fullName')}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-[#F8F9FA] text-[#191C1E] placeholder-[#505F76]/50 focus:outline-none focus:ring-2 focus:ring-[#050C9C]/20 focus:border-[#050C9C] transition-all"
                  placeholder={t('auth.fullName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

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
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-[#F8F9FA] text-[#191C1E] placeholder-[#505F76]/50 focus:outline-none focus:ring-2 focus:ring-[#050C9C]/20 focus:border-[#050C9C] transition-all"
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
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-[#F8F9FA] text-[#191C1E] placeholder-[#505F76]/50 focus:outline-none focus:ring-2 focus:ring-[#050C9C]/20 focus:border-[#050C9C] transition-all"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password-confirmation" className="block text-sm font-semibold text-[#191C1E] mb-2">
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="password-confirmation"
                  name="password_confirmation"
                  type="password"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-[#F8F9FA] text-[#191C1E] placeholder-[#505F76]/50 focus:outline-none focus:ring-2 focus:ring-[#050C9C]/20 focus:border-[#050C9C] transition-all"
                  placeholder={t('auth.confirmPassword')}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl mt-6"
                style={{ background: 'linear-gradient(135deg, #2A14B4 0%, #4338CA 100%)' }}
              >
                {t('auth.register')}
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
