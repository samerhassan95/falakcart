'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import {
  LayoutDashboard, Link2, BarChart3, Users2,
  DollarSign, Settings, LogOut, Plus
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'My Links', href: '/links', icon: Link2 },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Referrals', href: '/referrals', icon: Users2 },
  { label: 'Earnings', href: '/earnings', icon: DollarSign },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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
    <div className="flex min-h-screen bg-[#F8F9FC]">
      {/* Sidebar */}
      <aside className="w-[220px] bg-white border-r border-gray-100 flex flex-col fixed h-full z-30">
        {/* Brand */}
        <div className="px-6 pt-6 pb-2">
          <h1 className="text-xl font-bold text-indigo-600 tracking-tight">FalakCart</h1>
        </div>

        {/* User Profile Card */}
        <div className="mx-4 mt-2 mb-4 px-4 py-3 bg-indigo-50 rounded-xl">
          <div className="flex items-center gap-3">
            {renderAvatar('medium')}
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">Welcome, {user?.name || 'User'}</p>
              <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider">Affiliate Partner</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-600 rounded-r-full" />
                )}
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 pb-6 space-y-2">
          <Link
            href="/links?create=true"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Generate Link
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-red-500 rounded-xl text-sm font-medium transition-colors hover:bg-red-50"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[220px]">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-3 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search analytics..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button onClick={toggleNotifications} className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.some(n => !n.read_at) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
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
                className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:opacity-80 transition-opacity"
              >
                <span className="text-sm font-semibold text-gray-700">{user?.name || 'User'}</span>
                {renderAvatar('small')}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
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
