'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect, useMemo } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus } from 'lucide-react';
import api from '@/lib/api';

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
const CommissionsIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
<g opacity="0.4">
<path d="M6 8.55015C6 9.12765 6.45 9.60015 6.9975 9.60015H8.1225C8.6025 9.60015 8.9925 9.18765 8.9925 8.68515C8.9925 8.13765 8.7525 7.94265 8.4 7.81515L6.6 7.18515C6.24 7.05765 6 6.86265 6 6.31515C6 5.81265 6.39 5.40015 6.87 5.40015H7.995C8.55 5.40765 9 5.87265 9 6.45015" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M7.5 9.63721V10.1922" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M7.5 4.80762V5.39262" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
</g>
<path d="M7.4925 13.485C10.8021 13.485 13.485 10.8021 13.485 7.4925C13.485 4.18293 10.8021 1.5 7.4925 1.5C4.18293 1.5 1.5 4.18293 1.5 7.4925C1.5 10.8021 4.18293 13.485 7.4925 13.485Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
<path opacity="0.4" d="M9.73828 14.91C10.4133 15.8625 11.5158 16.485 12.7758 16.485C14.8233 16.485 16.4883 14.82 16.4883 12.7725C16.4883 11.5275 15.8733 10.425 14.9358 9.75" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>

);
const PayoutsIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
<path d="M13.53 10.1625C13.215 10.47 13.035 10.9125 13.08 11.385C13.1475 12.195 13.89 12.7875 14.7 12.7875H16.125V13.68C16.125 15.2325 14.8575 16.5 13.305 16.5H4.695C3.1425 16.5 1.875 15.2325 1.875 13.68V8.63251C1.875 7.08001 3.1425 5.8125 4.695 5.8125H13.305C14.8575 5.8125 16.125 7.08001 16.125 8.63251V9.71251H14.61C14.19 9.71251 13.8075 9.87749 13.53 10.1625Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
<path opacity="0.4" d="M1.875 9.30772V5.88026C1.875 4.98776 2.4225 4.19273 3.255 3.87773L9.21 1.62773C10.14 1.27523 11.1375 1.96525 11.1375 2.96275V5.81274" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M16.9191 10.4776V12.0227C16.9191 12.4352 16.5891 12.7726 16.1691 12.7876H14.6991C13.8891 12.7876 13.1466 12.1951 13.0791 11.3851C13.0341 10.9126 13.2141 10.4701 13.5291 10.1626C13.8066 9.87763 14.1891 9.71265 14.6091 9.71265H16.1691C16.5891 9.72765 16.9191 10.0651 16.9191 10.4776Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
<path opacity="0.4" d="M5.25 9H10.5" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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
  { label: 'admin.overview', href: '/admin/overview', icon: DashboardIcon },
  { label: 'admin.affiliates', href: '/admin/affiliates', icon: UsersIcon },
  { label: 'admin.allLinks', href: '/admin/links', icon: ({ className, isActive }: { className?: string; isActive?: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M8.1 10.8H4.5C3.15 10.8 2.025 9.675 2.025 8.325C2.025 6.975 3.15 5.85 4.5 5.85H8.1V7.2H4.5C3.9 7.2 3.375 7.725 3.375 8.325C3.375 8.925 3.9 9.45 4.5 9.45H8.1V10.8ZM5.4 9H12.6V7.65H5.4V9ZM9.9 10.8V9.45H13.5C14.1 9.45 14.625 8.925 14.625 8.325C14.625 7.725 14.1 7.2 13.5 7.2H9.9V5.85H13.5C14.85 5.85 15.975 6.975 15.975 8.325C15.975 9.675 14.85 10.8 13.5 10.8H9.9Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) },
  { label: 'admin.commissions', href: '/admin/commissions', icon: CommissionsIcon },
  { label: 'navigation.analytics', href: '/admin/analytics', icon: AnalyticsIcon },
  { label: 'admin.payouts', href: '/admin/payouts', icon: PayoutsIcon },
  { label: 'admin.settings', href: '/admin/settings', icon: SettingsIcon },
]; 

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, locale } = useTranslation();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isRTL, setIsRTL] = useState(true);
  const [currentLocale, setCurrentLocale] = useState('ar');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const renderAvatar = useMemo(() => {
    return (size: 'small' | 'medium') => {
      const sizeClasses = size === 'small' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
      
      if (userAvatar) {
        return (
          <img 
            src={userAvatar} 
            alt="User Avatar" 
            className={`${sizeClasses} rounded-full object-cover ring-2 ring-indigo-100`}
          />
        );
      }
      
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold ${size === 'small' ? 'ring-2 ring-indigo-100' : ''}`}>
          {user?.name?.charAt(0) || 'U'}
        </div>
      );
    };
  }, [userAvatar, user?.name]);

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
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/admin/notifications');
      setNotifications(data);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchNotifications();
    }
  }, [user]);

  const toggleNotifications = () => {
    if (!showNotifications) {
      setShowNotifications(true);
      if (notifications.some(n => !n.read_at)) {
        api.post('/admin/notifications/read').then(() => fetchNotifications()).catch(() => {});
      }
    } else {
      setShowNotifications(false);
    }
  };

  const createLink = async () => {
    if (!newLinkName.trim()) return;
    try {
      const response = await api.post('/admin/links', { name: newLinkName });
      setNewLinkName('');
      setShowCreateLink(false);
      console.log('Link created successfully:', response.data);
    } catch (err) {
      console.error('Error creating link', err);
    }
  };

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
            className={`w-auto object-contain ${currentLocale === 'ar' ? 'h-16' : 'h-12'}`}
          />
        </div>
        {/* User Profile Card */}
        <div className="mb-8 px-4 pt-4 b-2 bg-[#F8FAFC] rounded-2xl">
          <div className="flex flex-wrap items-center gap-3">
            {renderAvatar('medium')}
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[#191C1E] truncate">{user?.name || 'User'}</p>
              <p className="text-xs font-medium text-[#64748B] tracking-wide">
                {user?.role === 'admin' ? t('admin.administrator') : t('common.affiliatePartner')}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Badge */}
        {/* <div className="px-6 pb-6">
          <div className="px-3 py-1.5 bg-red-50 rounded-lg inline-block">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{t('admin.administrator')}</span>
          </div>
        </div> */}

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
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
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 pb-6 space-y-3">
          <button
            onClick={() => setShowCreateLink(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40"
            style={{ background: 'linear-gradient(135deg, #2A14B4 0%, #4338CA 100%)' }}
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            {t('links.createNewLink')}
          </button>
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
        <header className="sticky top-0 z-20 bg-[#FFFFFFCC] backdrop-blur-md  px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
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

            <div className="relative" ref={notifRef}>
              <button onClick={toggleNotifications} className="relative p-2 text-[#505F76] hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.some(n => !n.read_at) && (
                  <span className={`absolute top-1 ${isRTL ? 'start-1' : 'end-1'} w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse`} />
                )}
              </button>
              
              {showNotifications && (
                <div className={`absolute mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto bg-white rounded-2xl shadow-xl py-2 z-50 ${isRTL ? 'end-0' : 'end-0'}`}>
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#191C1E]">{t('notifications.title')}</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-[#505F76] text-sm">
                      {t('notifications.noNewNotifications')}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((notif, i) => (
                        <div key={i} className={`p-4 hover:bg-gray-50 transition-colors ${!notif.read_at ? 'bg-indigo-50/30' : ''}`}>
                          <p className="text-sm font-semibold text-[#191C1E] mb-1">{notif.title}</p>
                          <p className="text-xs text-[#505F76] leading-relaxed">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

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
                  <Link href="/admin/settings" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#050C9C]">
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

      {/* Create Link Modal */}
      {showCreateLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-[#191C1E] mb-4">{t('links.createNewLink')}</h2>
            <input
              type="text"
              placeholder={t('links.campaignNamePlaceholder')}
              value={newLinkName}
              onChange={(e) => setNewLinkName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreateLink(false)} className="px-5 py-2.5 text-[#505F76] hover:text-gray-700 text-sm font-medium">{t('common.cancel')}</button>
              <button onClick={createLink} className="px-6 py-2.5 bg-indigo-600 hover:bg-[#050C9C] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> {t('links.createLink')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
