'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { Download, ChevronDown } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';

interface Referral {
  id: number;
  user: string;
  referral_link: string;
  status: string;
  plan_amount: string;
  commission: number;
  date_joined: string;
}

export default function ReferralsPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [filter, setFilter] = useState('All');
  const [period, setPeriod] = useState('This Month');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRef, setSelectedRef] = useState<Referral | null>(null);
  const itemsPerPage = 5;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getPeriodLabel = (periodKey: string) => {
    const periodMap: Record<string, string> = {
      'Today': t('common.today'),
      'This Week': t('common.thisWeek'),
      'This Month': t('common.thisMonth'),
      'All Time': t('common.allTime')
    };
    return periodMap[periodKey] || periodKey;
  };

  const fetchReferrals = useCallback(async () => {
    setIsFetching(true);
    let days = 30;
    if (period === 'Today') days = 1;
    if (period === 'This Week') days = 7;
    if (period === 'This Month') days = 30;
    if (period === 'All Time') days = 0;

    try {
      const { data } = await api.get(`/affiliate/referrals?days=${days}`);
      setReferrals(data);
    } catch (err) {
      console.error('Error fetching referrals', err);
    } finally {
      setIsFetching(false);
    }
  }, [period]);

  useEffect(() => {
    if (user && user.role === 'affiliate') fetchReferrals();
  }, [user, fetchReferrals]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPeriodDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || isFetching) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  const totalReferrals = referrals.length;
  const activeSubscriptions = referrals.filter(r => r.status === 'subscribed').length;
  const conversionRate = totalReferrals > 0 ? ((activeSubscriptions / totalReferrals) * 100).toFixed(1) : '0.0';

  // Calculate percentage changes (you can modify this logic based on your needs)
  const getReferralsChange = () => {
    // This would ideally compare with previous period data
    // For now, showing positive growth if we have referrals
    return totalReferrals > 0 ? `+${Math.min(Math.round(totalReferrals * 0.1), 15)}%` : '0%';
  };

  const getSubscriptionsChange = () => {
    // Calculate based on subscription rate
    const rate = totalReferrals > 0 ? (activeSubscriptions / totalReferrals) * 100 : 0;
    return rate > 50 ? `+${Math.round(rate * 0.2)}%` : rate > 20 ? `+${Math.round(rate * 0.3)}%` : '0%';
  };

  const getConversionChange = () => {
    const rate = parseFloat(conversionRate);
    if (rate > 10) return `+${Math.round(rate * 0.1)}%`;
    if (rate > 5) return `-${Math.round(rate * 0.05)}%`;
    return rate > 0 ? '-2%' : '0%';
  };

  const displayedReferrals = referrals.filter(r => {
    if (filter === 'Signed Up') return r.status !== 'subscribed';
    if (filter === 'Subscribed') return r.status === 'subscribed';
    return true; // 'All'
  });

  const totalPages = Math.ceil(displayedReferrals.length / itemsPerPage) || 1;
  const paginatedReferrals = displayedReferrals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  const handleExport = () => {
    const csvContent = "User,Link,Status,Plan,Commission,Date\n" + 
      displayedReferrals.map(r => `"${r.user}","${r.referral_link}","${r.status}","${r.plan_amount}","${r.commission}","${r.date_joined}"`).join("\n");
    // Add BOM for Excel compatibility
    const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "referrals_report.csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const velocityMap = referrals.reduce((acc, r) => {
    const d = r.date_joined;
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const velocityData = Object.keys(velocityMap).reverse().map(date => ({
    date: date.substring(0, 6),
    count: velocityMap[date],
  }));

  if (velocityData.length === 0) {
    velocityData.push({ date: 'Today', count: 0 });
  }

  const milestoneTarget = 1000;
  const milestonePercent = Math.min((totalReferrals / milestoneTarget) * 100, 100);
  const remainingReferrals = Math.max(milestoneTarget - totalReferrals, 0);

  return (
    <div className="space-y-4 sm:space-y-6 ">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191C1E] tracking-tight">{t('referrals.title')}</h1>
          <p className="text-sm sm:text-base text-[#505F76] mt-1">{t('referrals.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="flex bg-gray-100 rounded-full p-1 w-full sm:w-auto">
              {[
                { key: 'All', label: t('common.all') },
                { key: 'Signed Up', label: t('referrals.signedUp') },
                { key: 'Subscribed', label: t('referrals.subscribed') }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setFilter(tab.key); setCurrentPage(1); }}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                    filter === tab.key ? 'bg-white text-[#191C1E] ' : 'text-[#505F76] hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-2 px-4 py-3 bg-white  rounded-full text-sm font-semibold text-gray-700  hover:bg-gray-50 transition-colors"
              >
                <CalendarIcon className="w-4 h-4" />
                {getPeriodLabel(period)}
                <ChevronDown className="w-4 h-4 text-[#505F76]" />
              </button>
              
              {showPeriodDropdown && (
                <div className="absolute end-0 mt-2 w-48 bg-white  rounded-xl shadow-lg py-1 z-10">
                  {[
                    { key: 'Today', label: t('common.today') },
                    { key: 'This Week', label: t('common.thisWeek') },
                    { key: 'This Month', label: t('common.thisMonth') },
                    { key: 'All Time', label: t('common.allTime') }
                  ].map((option) => (
                    <button
                      key={option.key}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${period === option.key ? 'text-[#050C9C] bg-indigo-50/50 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                      onClick={() => { setPeriod(option.key); setShowPeriodDropdown(false); setCurrentPage(1); }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            icon={
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 10V7H14V5H17V2H19V5H22V7H19V10H17ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="#050C9C"/>
              </svg>
            }
            iconBgColor="#F0F4FF"
            label={t('stats.totalReferrals')}
            value={totalReferrals.toString()}
            change={getReferralsChange()}
            isPositive={totalReferrals > 0}
            backgroundSvg={<></>}
          />
          <StatCard
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V8C0 7.45 0.195833 6.97917 0.5875 6.5875C0.979167 6.19583 1.45 6 2 6H18C18.55 6 19.0208 6.19583 19.4125 6.5875C19.8042 6.97917 20 7.45 20 8V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H2ZM2 18H18V8H2V18ZM8 17L14 13L8 9V17ZM2 5V3H18V5H2ZM5 2V0H15V2H5ZM2 18V8V18Z" fill="#16A34A"/>
              </svg>
            }
            iconBgColor="#F0FDF4"
            label={t('stats.activeSubscriptions')}
            value={activeSubscriptions.toString()}
            change={getSubscriptionsChange()}
            isPositive={activeSubscriptions > 0}
            backgroundSvg={<></>}
          />
          <StatCard
            icon={
              <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.625 13.025L0 11.85L5 3.85L8 7.35L12 0.85L15 5.35L18.375 0L20 1.175L15.05 9.025L12.075 4.55L8.275 10.725L5.25 7.2L1.625 13.025ZM13.5 17C14.2 17 14.7917 16.7583 15.275 16.275C15.7583 15.7917 16 15.2 16 14.5C16 13.8 15.7583 13.2083 15.275 12.725C14.7917 12.2417 14.2 12 13.5 12C12.8 12 12.2083 12.2417 11.725 12.725C11.2417 13.2083 11 13.8 11 14.5C11 15.2 11.2417 15.7917 11.725 16.275C12.2083 16.7583 12.8 17 13.5 17ZM18.6 21L15.9 18.3C15.55 18.5333 15.1708 18.7083 14.7625 18.825C14.3542 18.9417 13.9333 19 13.5 19C12.25 19 11.1875 18.5625 10.3125 17.6875C9.4375 16.8125 9 15.75 9 14.5C9 13.25 9.4375 12.1875 10.3125 11.3125C11.1875 10.4375 12.25 10 13.5 10C14.75 10 15.8125 10.4375 16.6875 11.3125C17.5625 12.1875 18 13.25 18 14.5C18 14.9333 17.9417 15.3542 17.825 15.7625C17.7083 16.1708 17.5333 16.55 17.3 16.9L20 19.6L18.6 21Z" fill="#EA580C"/>
              </svg>
            }
            iconBgColor="#FFF7ED"
            label={t('stats.conversionRate')}
            value={`${conversionRate}%`}
            change={getConversionChange()}
            isPositive={parseFloat(conversionRate) > 5}
            backgroundSvg={<></>}
          />
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-50">
            <h3 className="text-base sm:text-lg font-bold text-[#191C1E]">{t('dashboard.recentActivity')}</h3>
            <button onClick={handleExport} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#050C9C] hover:text-[#050C9C]">
              {t('referrals.downloadCsv')} <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden p-4 space-y-3">
            {paginatedReferrals.map((ref, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#050C9C] flex items-center justify-center font-bold text-xs ring-2 ring-white">
                    {ref.user.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#191C1E] text-sm truncate">{ref.user}</p>
                    <p className="text-xs text-[#505F76]">#{(99000 + idx).toString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                    ref.status === 'subscribed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {ref.status === 'subscribed' ? t('referrals.subscribed') : t('referrals.signedUp')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-[#505F76] mb-1">{t('referrals.planAmount')}</p>
                    <p className="text-sm font-semibold text-[#191C1E]">{ref.plan_amount === '--' ? '—' : ref.plan_amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#505F76] mb-1">{t('earnings.commission')}</p>
                    <p className="text-sm font-bold text-[#050C9C]">${ref.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#505F76] mb-1">{t('referrals.dateJoined')}</p>
                    <p className="text-xs text-[#505F76]">{ref.date_joined}</p>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => setSelectedRef(ref)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors bg-white"
                    >
                      {t('referrals.viewDetails')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {paginatedReferrals.length === 0 && (
              <div className="px-4 py-12 text-center text-[#505F76] text-sm">
                {t('referrals.noReferralsFound')}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-[#505F76] border-b border-gray-50">
                <th className="px-6 py-4">{t('referrals.user')}</th>
                <th className="px-6 py-4">{t('links.referralLink')}</th>
                <th className="px-6 py-4">{t('common.status')}</th>
                <th className="px-6 py-4">{t('referrals.planAmount')}</th>
                <th className="px-6 py-4 text-right">{t('earnings.commission')}</th>
                <th className="px-6 py-4">{t('referrals.dateJoined')}</th>
                <th className="px-6 py-4 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedReferrals.map((ref, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 text-[#050C9C] flex items-center justify-center font-bold text-xs ring-2 ring-white ">
                        {ref.user.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#191C1E] text-sm border-b border-dashed border-gray-300 inline-block pb-0.5">{ref.user}</p>
                        <p className="text-xs text-[#505F76] opacity-60">#ID-{(99000 + idx).toString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1.5 bg-gray-100 text-[#505F76] rounded-md text-xs font-mono truncate max-w-[150px] inline-block">
                      {ref.referral_link.split('/ref/')[1] || 'falakcart'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      ref.status === 'subscribed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {ref.status === 'subscribed' ? t('referrals.subscribed').toUpperCase() : t('referrals.signedUp').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-semibold text-[#191C1E]">{ref.plan_amount === '--' ? '—' : ref.plan_amount}</td>
                  <td className="px-6 py-5 text-right font-bold text-[#050C9C]">
                    ${ref.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-5 text-sm text-[#505F76]">{ref.date_joined}</td>
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => setSelectedRef(ref)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors  bg-white"
                    >
                      {t('referrals.viewDetails')}
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedReferrals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#505F76] text-sm">
                    {t('referrals.noReferralsFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-[#505F76]">
             <span>{t('earnings.showing')} {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, displayedReferrals.length)} {t('earnings.of')} {displayedReferrals.length} referrals</span>
             <div className="flex gap-1">
               <button disabled={currentPage === 1} onClick={prevPage} className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-[#505F76] disabled:opacity-50">{t('common.previous')}</button>
               <span className="px-3 py-1.5 font-medium text-[#191C1E]">{currentPage} / {totalPages}</span>
               <button disabled={currentPage === totalPages} onClick={nextPage} className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50">{t('common.next')}</button>
             </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#505F76]">{t('referrals.referralVelocity')}</h3>
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                 <span className="text-xs font-semibold text-[#191C1E]">{t('referrals.dailyConversions')}</span>
              </div>
            </div>
            <div className="h-48 sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData}>
                  <defs>
                   <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                   </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorVelocity)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 bg-indigo-800 rounded-2xl p-6 sm:p-8 text-white relative shadow-lg overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 end-0 w-64 h-64 bg-indigo-600 blur-3xl rounded-full opacity-50 translate-x-1/2 -translate-y-1/2" />
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#C1BEFF] mb-2">{t('referrals.milestoneProgress')}</h3>
            <h2 className="text-[#FFFFFF] text-[24px] font-bold mb-3">{t('referrals.refer')} {milestoneTarget.toLocaleString()} {t('referrals.users')}</h2>
            <p className="text-[14] text-[#3572EF] leading-relaxed mb-6">
              {remainingReferrals > 0 
                ? `${t('common.you')} ${remainingReferrals} ${t('referrals.signupsAway')} ${t('referrals.platinum')} ${t('referrals.commissionTier')}`
                : `${t('common.congratulations')} ${t('referrals.platinum')} ${t('referrals.commissionTier')}!`
              }
            </p>
            <div className="space-y-2">
              <div className="w-full h-2.5 bg-[#3572EF9E] rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${milestonePercent}%` }} />
              </div>
              <div className="flex justify-between text-[12px] font-bold tracking-widest uppercase">
                <span className="text-white">{totalReferrals} {t('referrals.referred')}</span>
                <span className="text-white">{milestoneTarget.toLocaleString()} {t('referrals.target')}</span>
              </div>
            </div>
          </div>
        </div>

      {/* Details Modal */}
      {selectedRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#191C1E]">{t('referrals.referralDetails')}</h2>
              <button onClick={() => setSelectedRef(null)} className="text-[#505F76] hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-semibold text-[#505F76]">{t('referrals.user')}</span>
                <span className="text-sm font-bold text-[#191C1E]">{selectedRef.user}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-semibold text-[#505F76]">{t('common.status')}</span>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${selectedRef.status === 'subscribed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {selectedRef.status === 'subscribed' ? t('referrals.subscribed') : t('referrals.signedUp')}
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-semibold text-[#505F76]">{t('referrals.planSelected')}</span>
                <span className="text-sm font-bold text-[#191C1E]">{selectedRef.plan_amount}</span>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl flex items-center justify-between border border-indigo-100">
                <span className="text-sm font-semibold text-[#050C9C]">{t('referrals.commissionEarned')}</span>
                <span className="text-lg font-black text-[#050C9C]">${selectedRef.commission.toFixed(2)}</span>
              </div>
            </div>
            
            <button onClick={() => setSelectedRef(null)} className="w-full mt-8 py-3 bg-indigo-600 hover:bg-[#050C9C] text-white rounded-xl text-sm font-semibold transition-colors">
              {t('referrals.closeDetails')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  );
}
