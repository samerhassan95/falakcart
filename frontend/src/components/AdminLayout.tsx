'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';

// Icons
const LogoutIcon = ({ className }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9V2H2V16H9V18H2ZM13 14L11.625 12.55L14.175 10H6V8H14.175L11.625 5.45L13 4L18 9L13 14Z" fill="currentColor"/>
  </svg>
);

const DashboardIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16.5 8.175V3.075C16.5 1.95 16.02 1.5 14.8275 1.5H11.7975C10.605 1.5 10.125 1.95 10.125 3.075V8.175C10.125 9.3 10.605 9.75 11.7975 9.75H14.8275C16.02 9.75 16.5 9.3 16.5 8.175Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M16.5 14.925V13.575C16.5 12.45 16.02 12 14.8275 12H11.7975C10.605 12 10.125 12.45 10.125 13.575V14.925C10.125 16.05 10.605 16.5 11.7975 16.5H14.8275C16.02 16.5 16.5 16.05 16.5 14.925Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.875 9.825V14.925C7.875 16.05 7.395 16.5 6.2025 16.5H3.1725C1.98 16.5 1.5 16.05 1.5 14.925V9.825C1.5 8.7 1.98 8.25 3.1725 8.25H6.2025C7.395 8.25 7.875 8.7 7.875 9.825Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M7.875 3.075V4.425C7.875 5.55 7.395 6 6.2025 6H3.1725C1.98 6 1.5 5.55 1.5 4.425V3.075C1.5 1.95 1.98 1.5 3.1725 1.5H6.2025C7.395 1.5 7.875 1.95 7.875 3.075Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UsersIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6.87187 8.1525C6.79687 8.145 6.70687 8.145 6.62437 8.1525C4.83937 8.0925 3.42188 6.63 3.42188 4.83C3.42187 2.9925 4.90688 1.5 6.75188 1.5C8.58938 1.5 10.0819 2.9925 10.0819 4.83C10.0744 6.63 8.65688 8.0925 6.87187 8.1525Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M12.3084 3C13.7634 3 14.9334 4.1775 14.9334 5.625C14.9334 7.0425 13.8084 8.1975 12.4059 8.25C12.3459 8.2425 12.2784 8.2425 12.2109 8.25" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.11906 10.92C1.30406 12.135 1.30406 14.115 3.11906 15.3225C5.18156 16.7025 8.56406 16.7025 10.6266 15.3225C12.4416 14.1075 12.4416 12.1275 10.6266 10.92C8.57156 9.5475 5.18906 9.5475 3.11906 10.92Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M13.7578 15C14.2978 14.8875 14.8078 14.67 15.2278 14.3475C16.3978 13.47 16.3978 12.0225 15.2278 11.145C14.8153 10.83 14.3128 10.62 13.7803 10.5" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AnalyticsIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path opacity="0.4" d="M5.16211 13.6126V12.0601" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round"/>
    <path opacity="0.4" d="M9 13.6123V10.5073" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round"/>
    <path opacity="0.4" d="M12.8379 13.6123V8.94727" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round"/>
    <g opacity="0.4">
      <path d="M12.8421 4.38721L12.4971 4.79221C10.5846 7.02721 8.01961 8.60971 5.16211 9.32221" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M10.6465 4.38721H12.844V6.57721" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <path d="M6.75 16.5H11.25C15 16.5 16.5 15 16.5 11.25V6.75C16.5 3 15 1.5 11.25 1.5H6.75C3 1.5 1.5 3 1.5 6.75V11.25C1.5 15 3 16.5 6.75 16.5Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6.75 16.5H11.25C15 16.5 16.5 15 16.5 11.25V6.75C16.5 3 15 1.5 11.25 1.5H6.75C3 1.5 1.5 3 1.5 6.75V11.25C1.5 15 3 16.5 6.75 16.5Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <g opacity="0.4">
      <path d="M11.6777 13.8747V10.9497" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.6777 5.5875V4.125" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.6766 9.48789C12.7535 9.48789 13.6266 8.61485 13.6266 7.53789C13.6266 6.46094 12.7535 5.58789 11.6766 5.58789C10.5996 5.58789 9.72656 6.46094 9.72656 7.53789C9.72656 8.61485 10.5996 9.48789 11.6766 9.48789Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.32227 13.8746V12.4121" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.32227 7.05V4.125" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.32109 12.4122C7.39805 12.4122 8.27109 11.5392 8.27109 10.4622C8.27109 9.38525 7.39805 8.51221 6.32109 8.51221C5.24414 8.51221 4.37109 9.38525 4.37109 10.4622C4.37109 11.5392 5.24414 12.4122 6.32109 12.4122Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  </svg>
);

const navItems = [
  { label: 'Overview', href: '/admin', icon: DashboardIcon, view: '' },
  { label: 'Affiliates', href: '/admin?view=affiliates', icon: UsersIcon, view: 'affiliates' },
  { label: 'Commissions', href: '/admin?view=commissions', icon: DashboardIcon, view: 'commissions' },
  { label: 'Analytics', href: '/admin?view=analytics', icon: AnalyticsIcon, view: 'analytics' },
  { label: 'Payouts', href: '/admin?view=payouts', icon: DashboardIcon, view: 'payouts' },
  { label: 'Settings', href: '/admin?view=settings', icon: SettingsIcon, view: 'settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRTL, setIsRTL] = useState(true);
  const [currentLocale, setCurrentLocale] = useState('ar');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentView = searchParams.get('view') || '';

  useEffect(() => {
    const updateDirection = () => {
      const dir = document.documentElement.dir;
      const locale = localStorage.getItem('NEXT_LOCALE') || 'ar';
      setIsRTL(dir === 'rtl');
      setCurrentLocale(locale);
    };
    
    updateDirection();
    const handleStorageChange = () => updateDirection();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(updateDirection, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logoSrc = currentLocale === 'ar' ? '/FalakLogoDarkAr.png' : '/FalakLogoDark.png';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-[280px] bg-[#F8FAFC] flex flex-col fixed h-full z-50 transition-transform duration-300 lg:z-30 ${
        isRTL ? 'end-0' : 'start-0'
      } ${
        isMobileMenuOpen 
          ? 'translate-x-0' 
          : isRTL 
            ? 'translate-x-full lg:translate-x-0' 
            : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 start-4 p-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Brand */}
        <div className="px-6 pt-6 pb-4">
          <img 
            src={logoSrc}
            alt="Falak Logo" 
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Admin Badge */}
        <div className="px-6 pb-6">
          <div className="px-3 py-1.5 bg-red-50 rounded-lg inline-block">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{t('admin.administrator')}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[15px] font-semibold transition-all ${
                  isActive
                    ? 'text-[#050C9C] bg-white border-e-4 border-[#050C9C]'
                    : 'text-[#64748B] hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" isActive={isActive} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 pb-6 space-y-3">
          <Link
            href="/links?create=true"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40"
            style={{ background: 'linear-gradient(135deg, #2A14B4 0%, #4338CA 100%)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {t('navigation.generateLink')}
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center justify-start gap-3 px-5 py-3 text-[#64748B] hover:text-red-500 rounded-2xl text-sm font-semibold transition-colors hover:bg-red-50"
          >
            <LogoutIcon className="w-[18px] h-[18px]" />
            {t('navigation.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${isRTL ? 'lg:mr-[280px]' : 'lg:ml-[280px]'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-[#FFFFFFCC] backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <svg className={`absolute ${isRTL ? 'end-3' : 'start-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[#505F76]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t('common.search')}
                className={`w-full ${isRTL ? 'ps-10 pe-4' : 'pl-10 pr-4'} py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#050C9C]/20 focus:border-[#050C9C] transition-all`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />

            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 sm:gap-3 sm:ps-4 sm:border-s border-gray-200 hover:opacity-80 transition-opacity"
              >
                <div className="hidden sm:block text-end">
                  <p className="text-sm font-semibold text-gray-700">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-[#505F76]">{t('admin.administrator')}</p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-red-100">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              </button>

              {showUserMenu && (
                <div className={`absolute mt-2 w-48 bg-white rounded-2xl shadow-xl py-2 z-50 ${isRTL ? 'start-0' : 'end-0'}`}>
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-sm font-semibold text-[#191C1E] truncate">{user?.name}</p>
                    <p className="text-[10px] text-[#505F76] truncate">{user?.email}</p>
                  </div>
                  <Link href="/admin?view=settings" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#050C9C]">
                    {t('admin.settings')}
                  </Link>
                  <div className="border-t border-gray-50 mt-1 pt-1">
                    <button onClick={logout} className="w-full text-start px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                      {t('auth.signOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
