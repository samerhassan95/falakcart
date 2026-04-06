'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import LanguageSwitcher from './LanguageSwitcher';
import { Plus } from 'lucide-react';

// Custom SVG Icons
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

const LinkIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path opacity="0.4" d="M9.15211 8.85016L8.09459 9.90767C7.50959 10.4927 7.50959 11.4452 8.09459 12.0302C8.67959 12.6152 9.6321 12.6152 10.2171 12.0302L11.8821 10.3652C13.0521 9.19518 13.0521 7.29768 11.8821 6.12018C10.7121 4.95018 8.8146 4.95018 7.6371 6.12018L5.82211 7.93516C4.81711 8.94016 4.81711 10.5677 5.82211 11.5727" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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

const ReferralsIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6.87187 8.1525C6.79687 8.145 6.70687 8.145 6.62437 8.1525C4.83937 8.0925 3.42188 6.63 3.42188 4.83C3.42187 2.9925 4.90688 1.5 6.75188 1.5C8.58938 1.5 10.0819 2.9925 10.0819 4.83C10.0744 6.63 8.65688 8.0925 6.87187 8.1525Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M12.3084 3C13.7634 3 14.9334 4.1775 14.9334 5.625C14.9334 7.0425 13.8084 8.1975 12.4059 8.25C12.3459 8.2425 12.2784 8.2425 12.2109 8.25" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.11906 10.92C1.30406 12.135 1.30406 14.115 3.11906 15.3225C5.18156 16.7025 8.56406 16.7025 10.6266 15.3225C12.4416 14.1075 12.4416 12.1275 10.6266 10.92C8.57156 9.5475 5.18906 9.5475 3.11906 10.92Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M13.7578 15C14.2978 14.8875 14.8078 14.67 15.2278 14.3475C16.3978 13.47 16.3978 12.0225 15.2278 11.145C14.8153 10.83 14.3128 10.62 13.7803 10.5" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EarningsIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g opacity="0.4">
      <path d="M6 8.55039C6 9.12789 6.45 9.60039 6.9975 9.60039H8.1225C8.6025 9.60039 8.9925 9.18789 8.9925 8.68539C8.9925 8.13789 8.7525 7.94289 8.4 7.81539L6.6 7.18539C6.24 7.05789 6 6.86289 6 6.31539C6 5.81289 6.39 5.40039 6.87 5.40039H7.995C8.55 5.40789 9 5.87289 9 6.45039" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 9.63721V10.1922" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 4.80762V5.39262" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <path d="M7.4925 13.485C10.8021 13.485 13.485 10.8021 13.485 7.4925C13.485 4.18293 10.8021 1.5 7.4925 1.5C4.18293 1.5 1.5 4.18293 1.5 7.4925C1.5 10.8021 4.18293 13.485 7.4925 13.485Z" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity="0.4" d="M9.73828 14.91C10.4133 15.8625 11.5158 16.485 12.7758 16.485C14.8233 16.485 16.4883 14.82 16.4883 12.7725C16.4883 11.5275 15.8733 10.425 14.9358 9.75" stroke={isActive ? "#050C9C" : "currentColor"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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
  { label: 'Dashboard', href: '/', icon: DashboardIcon },
  { label: 'My Links', href: '/links', icon: LinkIcon },
  { label: 'Analytics', href: '/analytics', icon: AnalyticsIcon },
  { label: 'Referrals', href: '/referrals', icon: ReferralsIcon },
  { label: 'Earnings', href: '/earnings', icon: EarningsIcon },
  { label: 'Settings', href: '/settings', icon: SettingsIcon },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isRTL, setIsRTL] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect current direction
    const dir = document.documentElement.dir;
    setIsRTL(dir === 'rtl');
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/affiliate/notifications');
      setNotifications(data);
    } catch (e) {}
  };

  const fetchUserProfile = async () => {
    try {
      const { data } = await api.get('/affiliate/profile');
      if (data.avatar) {
        setUserAvatar(data.avatar);
      }
    } catch (e) {
      console.error('Error loading user profile:', e);
    }
  };

  useEffect(() => {
    if (user && user.role === 'affiliate') {
      fetchNotifications();
      fetchUserProfile();
    }
  }, [user]);

  // Listen for avatar updates from settings page
  useEffect(() => {
    const handleAvatarUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, []);

  const toggleNotifications = () => {
    if (!showNotifications) {
      setShowNotifications(true);
      if (notifications.some(n => !n.read_at)) {
        api.post('/affiliate/notifications/read').then(() => fetchNotifications());
      }
    } else {
      setShowNotifications(false);
    }
  };

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

  const renderAvatar = (size: 'small' | 'medium') => {
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

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className={`w-[280px]  flex flex-col fixed h-full z-30  ${isRTL ? 'right-0' : 'left-0'}`}>
        {/* Brand */}
        <div className="px-6 pt-6 pb-6">
          <img 
            src="/FalakLogoDark.png" 
            alt="Falak Logo" 
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* User Profile Card */}
        <div className=" mb-8 px-4 pt-4 b-2 bg-[#F8FAFC] rounded-2xl">
          <div className="flex items-center gap-3">
            {renderAvatar('medium')}
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs font-medium text-[#64748B] tracking-wide">Affiliate Partner</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[15px] font-semibold transition-all relative ${
                  isActive
                    ? 'text-[#050C9C] bg-white  border-e-5 border-[#050C9C] '
                    : 'text-[#64748B]'
                }`}
              >
       
                <Icon className="w-5 h-5 flex-shrink-0" isActive={isActive} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 pb-2 space-y-3">
           <Link
            href="/links?create=true"
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40"
            style={{ background: 'linear-gradient(135deg, #2A14B4 0%, #4338CA 100%)' }}
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Generate Link
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center justify-start gap-3 px-5 py-3 text-[#64748B] hover:text-red-500 rounded-2xl text-sm font-semibold transition-colors hover:bg-red-50"
          >
            <LogoutIcon className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${isRTL ? 'mr-[280px]' : 'ml-[280px]'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-[#FFFFFFCC] backdrop-blur-md border-b border-gray-100 px-8 py-3 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search analytics..."
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all`}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="relative" ref={notifRef}>
              <button onClick={toggleNotifications} className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.some(n => !n.read_at) && (
                  <span className={`absolute top-1 ${isRTL ? 'left-1' : 'right-1'} w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse`} />
                )}
              </button>
              
              {showNotifications && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50`}>
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      No new notifications right now.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((notif, i) => (
                        <div key={i} className={`p-4 hover:bg-gray-50 transition-colors ${!notif.read_at ? 'bg-indigo-50/30' : ''}`}>
                          <p className="text-sm font-semibold text-gray-900 mb-1">{notif.title}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
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
                className={`flex items-center gap-3 ${isRTL ? 'pr-4 border-r' : 'pl-4 border-l'} border-gray-200 hover:opacity-80 transition-opacity`}
              >
                <span className="text-sm font-semibold text-gray-700">{user?.name || 'User'}</span>
                {renderAvatar('small')}
              </button>

              {showUserMenu && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50`}>
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <Link href="/settings" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600">
                    My Profile
                  </Link>
                  <Link href="/settings" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600">
                    Account Settings
                  </Link>
                  <div className="border-t border-gray-50 mt-1 pt-1">
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
