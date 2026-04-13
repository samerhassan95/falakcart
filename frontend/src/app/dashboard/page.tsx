'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Copy, Check, TrendingUp, TrendingDown,
  CheckCircle, DollarSign, Download,
  Calendar
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import Link from 'next/link';

interface Stats {
  clicks: number;
  referrals: number;
  subscriptions: number;
  earnings: number;
  conversion_rate: number;
  available_bal: number;
  pending_bal: number;
  paid_bal: number;
}

interface AffiliateProfile {
  referral_code: string;
  status: string;
  commission_rate: number;
  main_referral_url?: string;
}

interface ActivityItem {
  type: string;
  title: string;
  subtitle: string;
  created_at: string;
}

interface ClickStat {
  date: string;
  count: number;
}

export default function AffiliateDashboard() {
  const { user, loading } = useAuth();
  const { t, isLoading: translationsLoading } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [earningsData, setEarningsData] = useState<ClickStat[]>([]);
  const [copied, setCopied] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [period, setPeriod] = useState('This Month');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close share menu if clicked outside
  useEffect(() => {
    if (!showShareMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [showShareMenu]);

  const getPeriodLabel = (periodKey: string) => {
    const periodMap: Record<string, string> = {
      'Today': t('common.today'),
      'This Week': t('common.thisWeek'),
      'This Month': t('common.thisMonth'),
      'All Time': t('common.allTime')
    };
    return periodMap[periodKey] || periodKey;
  };

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    setHasError(false);
    setErrorMessage('');
    
    try {
      const periodParam = period === 'Today' ? '1' : period === 'This Week' ? '7' : period === 'This Month' ? '30' : '999';
      
      // Fetch data with individual error handling
      const results = await Promise.allSettled([
        api.get(`/affiliate/stats?days=${periodParam}`),
        api.get('/affiliate/profile'),
        api.get('/affiliate/recent-activity'),
        api.get(`/affiliate/analytics?days=${periodParam}`),
      ]);

      let hasAnyError = false;
      let errorDetails = [];

      // Handle stats
      if (results[0].status === 'fulfilled') {
        setStats(results[0].value.data);
      } else {
        hasAnyError = true;
        errorDetails.push('Stats API failed');
        console.error('Failed to fetch stats:', results[0].reason);
        setStats({
          clicks: 0,
          referrals: 0,
          subscriptions: 0,
          earnings: 0,
          conversion_rate: 0,
          available_bal: 0,
          pending_bal: 0,
          paid_bal: 0
        });
      }

      // Handle profile
      if (results[1].status === 'fulfilled') {
        setProfile(results[1].value.data);
      } else {
        hasAnyError = true;
        errorDetails.push('Profile API failed');
        console.error('Failed to fetch profile:', results[1].reason);
        setProfile({
          referral_code: 'LOADING',
          status: 'active',
          commission_rate: 15,
          main_referral_url: ''
        });
      }

      // Handle activity
      if (results[2].status === 'fulfilled') {
        setActivity(results[2].value.data);
      } else {
        hasAnyError = true;
        errorDetails.push('Activity API failed');
        console.error('Failed to fetch activity:', results[2].reason);
        setActivity([]);
      }

      // Handle clicks data
      if (results[3].status === 'fulfilled') {
        const analyticsData = results[3].value.data;
        // The chart expects 'earningsData' but it's labeled 'Earnings Performance'
        // So we should use 'earnings_over_time' which has 'date' and 'total'
        if (analyticsData.earnings_over_time) {
          setEarningsData(analyticsData.earnings_over_time.map((item: any) => ({
             date: item.date,
             count: Number(item.total) || 0 // Keep 'count' name to avoid breaking Recharts if possible or update it
          })));
        } else {
          setEarningsData([]);
        }
      } else {

        hasAnyError = true;
        errorDetails.push('Clicks API failed');
        console.error('Failed to fetch clicks data:', results[3].reason);
        setEarningsData([]);
      }

      if (hasAnyError) {
        setHasError(true);
        setErrorMessage(`Some data couldn't be loaded: ${errorDetails.join(', ')}`);
      }

    } catch (err) {
      console.error('Error fetching dashboard data', err);
      setHasError(true);
      setErrorMessage('Failed to load dashboard data. Please check your connection.');
      
      // Set default values if everything fails
      setStats({
        clicks: 0,
        referrals: 0,
        subscriptions: 0,
        earnings: 0,
        conversion_rate: 0,
        available_bal: 0,
        pending_bal: 0,
        paid_bal: 0
      });
      setProfile({
        referral_code: 'ERROR',
        status: 'active',
        commission_rate: 15,
        main_referral_url: ''
      });
      setActivity([]);
      setEarningsData([]);
    } finally {
      setIsFetching(false);
    }
  }, [period]);

  useEffect(() => {
    if (user && user.role === 'affiliate') {
      fetchData();
    }
  }, [user, fetchData]);

  const copyLink = () => {
    if (profile) {
      const referralUrl = profile.main_referral_url || `https://falakcart.com/register?ref=${profile.referral_code}`;
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = () => {
    const csvContent = "Type,Title,Date\n" + 
      activity.map(a => `"${a.type}","${a.title}","${a.created_at}"`).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dashboard_report.csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const shareOnWhatsApp = () => {
    if (profile) {
      const referralUrl = profile.main_referral_url || `https://falakcart.com/register?ref=${profile.referral_code}`;
      const message = t('dashboard.shareMessage', { url: referralUrl });
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const shareOnFacebook = () => {
    if (profile) {
      const referralUrl = profile.main_referral_url || `https://falakcart.com/register?ref=${profile.referral_code}`;
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, '_blank');
    }
  };

  if (loading || isFetching || translationsLoading || !mounted) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[#505F76] text-sm font-medium">{t('dashboard.loadingDashboard')}</p>
      </div>
    </div>
  );

  if (!user) return null;

  const goalTarget = 2000;
  const goalProgress = Math.min(Math.round(((stats?.earnings || 0) / goalTarget) * 100), 100);

  return (
    <div className="space-y-6 sm:space-y-8">
        {/* Error Banner */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 text-red-500">⚠️</div>
              <div>
                <h4 className="text-sm font-semibold text-red-800">Dashboard Loading Issues</h4>
                <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                <button 
                  onClick={fetchData}
                  className="text-xs text-red-700 underline mt-2 hover:text-red-800"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#191C1E] tracking-tight">
              {t('dashboard.welcomeBack', { name: user.name })}
            </h1>
            <p className="text-[#505F76] mt-1 text-sm sm:text-base">{t('dashboard.performanceOverview')}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-700 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                {getPeriodLabel(period)}
              </button>
              {showPeriodMenu && (
                <div className="absolute end-0 mt-2 w-48 bg-white rounded-2xl py-2 z-50 shadow-xl">
                  {[
                    { key: 'Today', label: t('common.today') },
                    { key: 'This Week', label: t('common.thisWeek') },
                    { key: 'This Month', label: t('common.thisMonth') },
                    { key: 'All Time', label: t('common.allTime') }
                  ].map(p => (
                    <button 
                      key={p.key} 
                      onClick={() => { setPeriod(p.key); setShowPeriodMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${period === p.key ? 'text-[#050C9C] font-semibold bg-[#F2F4F6]/50' : 'text-gray-600'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={handleExport} 
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2A14B4 0%, #4338CA 100%)' }}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('dashboard.exportReport')}</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Campaign + Goal Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 relative">

            {/* Decorative blur circle */}
            <div 
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '350px',
                height: '350px',
                background: 'rgba(58, 190, 249, 0.08)',
                filter: 'blur(80px)',
                bottom: '-175px',
                right: '-100px'
              }}
            />
            
            <div className="relative z-10">
              <span className="inline-block px-3 py-2 bg-[#E3DFFF] text-[#050C9C] text-[10px] font-bold uppercase tracking-wider rounded-full mb-3">{t('dashboard.primaryCampaign')}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#191C1E] mb-1">{t('dashboard.shareAndEarn')}</h2>
              <p className="text-[#505F76] text-sm mb-5">{t('dashboard.commissionDescription', { rate: profile?.commission_rate || 15 })}</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 px-4 py-3 bg-[#F2F4F6] border border-indigo-100 rounded-xl overflow-hidden">
                  <span className="text-xs sm:text-sm font-medium text-[#050C9C] font-mono break-all">
                    {profile?.main_referral_url || `https://falakcart.com/register?ref=${profile?.referral_code || '...'}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyLink}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-full shadow-md text-sm font-semibold text-[#050C9C] hover:bg-gray-50 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? t('common.copied') : t('common.copy')}
                  </button>
                  <div className="relative share-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowShareMenu(!showShareMenu);
                      }}
                      className="p-3 bg-[#3ABEF91A] border border-gray-200 rounded-full text-[#505F76] hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </button>
                                      {showShareMenu && (
                      <div className="absolute left-0 top-full mt-3 flex items-center gap-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[100] animate-in fade-in zoom-in duration-200">
                        <button
                          onClick={shareOnWhatsApp}
                          title={t('dashboard.shareOnWhatsApp')}
                          className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </button>
                        <button
                          onClick={shareOnFacebook}
                          title={t('dashboard.shareOnFacebook')}
                          className="w-10 h-10 bg-[#1877F2]/10 rounded-xl flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all duration-300"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.64c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.248h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>


                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#F2F4F6] rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-[18px] font-semibold text-black">{t('dashboard.goalProgress')}</h3>
              <span className="text-xl sm:text-[24px] font-bold text-[#050C9C]">{goalProgress}%</span>
            </div>
            <p className="text-xs sm:text-[14px] text-[#505F76] mb-3">{t('dashboard.monthlyTarget', { target: goalTarget.toLocaleString() })}</p>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="text-xs sm:text-[12px] text-[#505F76]">
              <span className="font-semibold text-[#191C1E]">{t('dashboard.greatJob')}</span> {t('dashboard.awayFromGoal', { amount: Math.max(0, goalTarget - (stats?.earnings || 0)).toLocaleString() })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard
            icon={
              <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.7 16C8.1 15.9167 6.75 15.3 5.65 14.15C4.55 13 4 11.6167 4 10C4 8.33333 4.58333 6.91667 5.75 5.75C6.91667 4.58333 8.33333 4 10 4C11.6167 4 13 4.55 14.15 5.65C15.3 6.75 15.9167 8.1 16 9.7L13.9 9.075C13.6833 8.175 13.2167 7.4375 12.5 6.8625C11.7833 6.2875 10.95 6 10 6C8.9 6 7.95833 6.39167 7.175 7.175C6.39167 7.95833 6 8.9 6 10C6 10.95 6.2875 11.7833 6.8625 12.5C7.4375 13.2167 8.175 13.6833 9.075 13.9L9.7 16ZM10.9 19.95C10.75 19.9833 10.6 20 10.45 20C10.3 20 10.15 20 10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 10.15 20 10.3 20 10.45C20 10.6 19.9833 10.75 19.95 10.9L18 10.3V10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18C10.05 18 10.1 18 10.15 18C10.2 18 10.25 18 10.3 18L10.9 19.95ZM18.525 20.5L14.25 16.225L13 20L10 10L20 13L16.225 14.25L20.5 18.525L18.525 20.5Z" fill="#050C9C"/>
              </svg>
            }
            label={t('stats.totalClicks')}
            value={(stats?.clicks || 0).toLocaleString()}
            change="+12%"
            positive
            bgColor="bg-[#EEF2FF]"
          />
          <StatCard
            icon={
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 10V7H14V5H17V2H19V5H22V7H19V10H17ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="#16A34A"/>
              </svg>
            }
            label={t('dashboard.referrals')}
            value={(stats?.referrals || 0).toLocaleString()}
            change="+5.2%"
            positive
            bgColor="bg-[#F0FDF4]"
          />
          <StatCard
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 15.5L14.5 12C14.6833 11.8167 14.8292 11.6 14.9375 11.35C15.0458 11.1 15.1 10.8333 15.1 10.55C15.1 9.98333 14.9 9.5 14.5 9.1C14.1 8.7 13.6167 8.5 13.05 8.5C12.7333 8.5 12.4208 8.59167 12.1125 8.775C11.8042 8.95833 11.4333 9.26667 11 9.7C10.5 9.23333 10.1083 8.91667 9.825 8.75C9.54167 8.58333 9.25 8.5 8.95 8.5C8.38333 8.5 7.9 8.7 7.5 9.1C7.1 9.5 6.9 9.98333 6.9 10.55C6.9 10.8333 6.95417 11.1 7.0625 11.35C7.17083 11.6 7.31667 11.8167 7.5 12L11 15.5ZM19.4 12.25L12.25 19.4C12.05 19.6 11.825 19.75 11.575 19.85C11.325 19.95 11.075 20 10.825 20C10.575 20 10.325 19.95 10.075 19.85C9.825 19.75 9.6 19.6 9.4 19.4L0.575 10.575C0.391667 10.3917 0.25 10.1792 0.15 9.9375C0.05 9.69583 0 9.44167 0 9.175V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.7 0.0541667 9.95 0.1625C10.2 0.270833 10.4167 0.416667 10.6 0.6L19.4 9.425C19.6 9.625 19.7458 9.85 19.8375 10.1C19.9292 10.35 19.975 10.6 19.975 10.85C19.975 11.1 19.9292 11.3458 19.8375 11.5875C19.7458 11.8292 19.6 12.05 19.4 12.25ZM10.825 18L17.975 10.85L9.15 2H2V9.15L10.825 18ZM4.5 6C4.91667 6 5.27083 5.85417 5.5625 5.5625C5.85417 5.27083 6 4.91667 6 4.5C6 4.08333 5.85417 3.72917 5.5625 3.4375C5.27083 3.14583 4.91667 3 4.5 3C4.08333 3 3.72917 3.14583 3.4375 3.4375C3.14583 3.72917 3 4.08333 3 4.5C3 4.91667 3.14583 5.27083 3.4375 5.5625C3.72917 5.85417 4.08333 6 4.5 6Z" fill="#EA580C"/>
              </svg>
            }
            label={t('dashboard.subscriptions')}
            value={(stats?.subscriptions || 0).toLocaleString()}
            change="-1.4%"
            positive={false}
            bgColor="bg-[#FFF7ED]"
          />
          <StatCard
            icon={
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 9C12.1667 9 11.4583 8.70833 10.875 8.125C10.2917 7.54167 10 6.83333 10 6C10 5.16667 10.2917 4.45833 10.875 3.875C11.4583 3.29167 12.1667 3 13 3C13.8333 3 14.5417 3.29167 15.125 3.875C15.7083 4.45833 16 5.16667 16 6C16 6.83333 15.7083 7.54167 15.125 8.125C14.5417 8.70833 13.8333 9 13 9ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10H18C18 9.45 18.1958 8.97917 18.5875 8.5875C18.9792 8.19583 19.45 8 20 8V4C19.45 4 18.9792 3.80417 18.5875 3.4125C18.1958 3.02083 18 2.55 18 2H8C8 2.55 7.80417 3.02083 7.4125 3.4125C7.02083 3.80417 6.55 4 6 4V8C6.55 8 7.02083 8.19583 7.4125 8.5875C7.80417 8.97917 8 9.45 8 10ZM19 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16ZM6 10V2V10Z" fill="white"/>
              </svg>
            }
            label={t('dashboard.totalEarnings')}
            value={`$${(stats?.earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            change="+24%"
            positive
            highlighted
                     bgColor="bg-[#050C9C]"
          />
        </div>

        {/* Chart + Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#191C1E]">{t('dashboard.earningsPerformance')}</h3>
                <p className="text-xs sm:text-sm text-[#505F76]">{t('dashboard.dailyCommissionTracking')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                <span className="text-xs font-medium text-[#505F76]">{t('dashboard.thisPeriod')}</span>
              </div>
            </div>
            <div className="h-64 sm:h-[280px]">
              {earningsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsData}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-300 text-sm">{t('common.noData')}</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base sm:text-lg font-bold text-[#191C1E]">{t('dashboard.recentActivity')}</h3>
              <Link href="/earnings" className="text-xs sm:text-sm font-semibold text-[#050C9C] hover:text-[#050C9C]">{t('dashboard.viewAll')}</Link>
            </div>
            <div className="space-y-4 sm:space-y-5">
              {activity.length > 0 ? activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.type === 'commission' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#F2F4F6] text-[#050C9C]'
                  }`}>
                    {item.type === 'commission' ? <DollarSign className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#191C1E] truncate">{item.title}</p>
                    <p className="text-xs text-[#505F76]">{item.created_at} &bull; {item.subtitle}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-[#505F76] text-center py-6">{t('dashboard.noRecentActivity')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

function StatCard({ icon, label, value, change, positive, highlighted, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  highlighted?: boolean;
  bgColor?: string;
}) {
  return (
    <div className={`rounded-2xl p-4 sm:p-6 transition-all ${
      highlighted
        ? 'bg-white'
        : 'bg-white'
    }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${highlighted ? bgColor : bgColor || 'bg-[#F2F4F6]'}`}>
          {icon}
        </div>
        <span className={`text-xs font-bold flex items-center gap-1 ${
        positive ? 'text-emerald-600' : 'text-red-500'
        }`}>
          {positive ? <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          {change}
        </span>
      </div>
      <p className={`text-[10px] sm:text-[12px] font-bold uppercase tracking-wider mb-1 ${
        highlighted ? 'text-[#505F76]' : 'text-[#505F76]'
      }`}>{label}</p>
      <p className={`text-xl sm:text-[24px] font-bold tracking-tight ${highlighted ? 'text-[#050C9C]' : 'text-[#191C1E]'}`}>{value}</p>
    </div>
  );
}
