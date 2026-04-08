'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  AlertTriangle, CheckCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  type Summary, 
  type Affiliate, 
  type AnalyticsClick,
  formatCurrency,
  ActivityItem
} from '../shared';
import { StatCard } from '@/components/StatCard';
import { useTranslation } from '@/hooks/useTranslation';

export default function AdminOverviewPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [clickStats, setClickStats] = useState<AnalyticsClick[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [summaryRes, affiliatesRes, clicksRes] = await Promise.all([
        api.get('/admin/summary'),
        api.get('/admin/affiliates'),
        api.get('/admin/clicks?days=30'),
      ]);
      setSummary(summaryRes.data);
      setAffiliates(affiliatesRes.data);
      setClickStats(clicksRes.data);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user && user.role === 'admin') {
      fetchData();
    } else {
      setIsSyncing(false);
    }
  }, [user, loading, fetchData]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/affiliates/${id}/status`, { status });
      fetchData();
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  const topPerformers = [...affiliates]
    .sort((a, b) => (b.total_earnings || 0) - (a.total_earnings || 0))
    .slice(0, 3);

  const totalAffiliates = summary?.total_affiliates || 0;
  const activeAffiliates = summary?.active_affiliates || 0;
  const totalClicks = summary?.total_clicks || 0;
  const totalConversions = summary?.total_sales || 0;
  const totalRevenue = summary?.total_revenue || 0;

  const affiliatesTrend = '+6.4%';
  const activeTrend = '+9.1%';
  const clicksTrend = totalClicks > 50 ? '-2.4%' : '+5.2%';
  const conversionsTrend = totalConversions > 20 ? '-19.8%' : '+12.3%';
  const revenueTrend = totalRevenue > 5000 ? '-22.3%' : '+18.5%';

  const getChartData = () => {
    if (chartPeriod === 'daily') return clickStats.slice(-7);
    if (chartPeriod === 'weekly') return clickStats.slice(-4);
    return clickStats.slice(-12);
  };

  if (loading || isSyncing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[#464554] text-sm font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#191C1E] mb-2">{t('auth.accessDenied')}</h2>
          <p className="text-[#505F76]">{t('auth.adminPrivilegesRequired')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0 sm:space-y-0">


      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-6 ">
        {summary && summary.total_revenue > 5000 && topPerformers.length > 0 &&  (
          <div className="bg-[#3ABEF91A] border-s-4 border-[#050C9C] rounded-xl p-4 flex items-start gap-3">
            <div className=" flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19ZM8 14.15L9 12L11.15 11L9 10L8 7.85L7 10L4.85 11L7 12L8 14.15Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#050C9C] text-[14px] mb-1">{t('admin.conversionInsight')}</h3>
              <p className="text-[14px] text-[#464554]">
                {t('admin.revenueReached')} ${totalRevenue.toLocaleString()}. {t('admin.topPerformer')} {topPerformers[0]?.user.name} {t('admin.leadingWith')} ${formatCurrency(topPerformers[0]?.total_earnings)}.
              </p>
            </div>
          </div>
        )}

        {totalClicks > 100 && totalConversions < 10 && (
          <div className="bg-red-50  border-s-4 border-[#BA1A1A] rounded-xl p-4 flex items-start gap-3">
            <div className="  flex items-center justify-center flex-shrink-0">
              <svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 19L11 0L22 19H0ZM3.45 17H18.55L11 4L3.45 17ZM11 16C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14C10.7167 14 10.4792 14.0958 10.2875 14.2875C10.0958 14.4792 10 14.7167 10 15C10 15.2833 10.0958 15.5208 10.2875 15.7125C10.4792 15.9042 10.7167 16 11 16ZM10 13H12V8H10V13Z" fill="#BA1A1A"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#BA1A1A] text-[14px] mb-1">{t('admin.anomalyDetected')}</h3>
              <p className="text-[14px] text-[#464554]">
                {t('admin.lowConversionRate')} ({((totalConversions / totalClicks) * 100).toFixed(2)}%). {totalClicks} {t('admin.clicksButOnly')} {totalConversions} {t('admin.conversions')}.
              </p>
            </div>
          </div>
        )}
        
        {affiliates.filter(a => a.status === 'pending').length > 0 && (
          <div className="bg-amber-50 border-s-4 border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <div className=" flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 22C9.61667 22 8.31667 21.7375 7.1 21.2125C5.88333 20.6875 4.825 19.975 3.925 19.075C3.025 18.175 2.3125 17.1167 1.7875 15.9C1.2625 14.6833 1 13.3833 1 12C1 10.6167 1.2625 9.31667 1.7875 8.1C2.3125 6.88333 3.025 5.825 3.925 4.925C4.825 4.025 5.88333 3.3125 7.1 2.7875C8.31667 2.2625 9.61667 2 11 2C12.3833 2 13.6833 2.2625 14.9 2.7875C16.1167 3.3125 17.175 4.025 18.075 4.925C18.975 5.825 19.6875 6.88333 20.2125 8.1C20.7375 9.31667 21 10.6167 21 12C21 13.3833 20.7375 14.6833 20.2125 15.9C19.6875 17.1167 18.975 18.175 18.075 19.075C17.175 19.975 16.1167 20.6875 14.9 21.2125C13.6833 21.7375 12.3833 22 11 22ZM11 20C13.2333 20 15.125 19.225 16.675 17.675C18.225 16.125 19 14.2333 19 12C19 9.76667 18.225 7.875 16.675 6.325C15.125 4.775 13.2333 4 11 4C8.76667 4 6.875 4.775 5.325 6.325C3.775 7.875 3 9.76667 3 12C3 14.2333 3.775 16.125 5.325 17.675C6.875 19.225 8.76667 20 11 20ZM10 16H12V10H10V16ZM11 8C11.2833 8 11.5208 7.90417 11.7125 7.7125C11.9042 7.52083 12 7.28333 12 7C12 6.71667 11.9042 6.47917 11.7125 6.2875C11.5208 6.09583 11.2833 6 11 6C10.7167 6 10.4792 6.09583 10.2875 6.2875C10.0958 6.47917 10 6.71667 10 7C10 7.28333 10.0958 7.52083 10.2875 7.7125C10.4792 7.90417 10.7167 8 11 8Z" fill="#F59E0B"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-200 text-[14px] mb-1">{t('admin.pendingActions')}</h3>
              <p className="text-[14px] text-[#464554]">
                {t('common.you')} {affiliates.filter(a => a.status === 'pending').length} {affiliates.filter(a => a.status === 'pending').length > 1 ? t('admin.affiliatesWaiting') : t('admin.affiliateWaiting')} {t('admin.waitingForApproval')}. 
                <Link href="/admin/affiliates" className="text-amber-700 font-semibold hover:underline ml-1">
                  {t('admin.reviewNow')}
                </Link>
              </p>
            </div>
          </div>
        )}

        {summary && summary.total_revenue > 10000 && (
          <div className="bg-green-50 border-s-4 border-green-200 rounded-xl p-4 flex items-start gap-3">
            <div className=" flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19ZM8 14.15L9 12L11.15 11L9 10L8 7.85L7 10L4.85 11L7 12L8 14.15Z" fill="#10B981"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-500 text-[14px] mb-1">{t('admin.excellentPerformance')}</h3>
              <p className="text-[14px] text-[#464554]">
                {t('admin.platformGenerated')} ${totalRevenue.toLocaleString()} {t('admin.inRevenue')} {totalAffiliates} {t('admin.activeAffiliates')}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard 
          icon={<svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM18 16V13C18 12.2667 17.7958 11.5625 17.3875 10.8875C16.9792 10.2125 16.4 9.63333 15.65 9.15C16.5 9.25 17.3 9.42083 18.05 9.6625C18.8 9.90417 19.5 10.2 20.15 10.55C20.75 10.8833 21.2083 11.2542 21.525 11.6625C21.8417 12.0708 22 12.5167 22 13V16H18ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM18 4C18 5.1 17.6083 6.04167 16.825 6.825C16.0417 7.60833 15.1 8 14 8C13.8167 8 13.5833 7.97917 13.3 7.9375C13.0167 7.89583 12.7833 7.85 12.6 7.8C13.05 7.26667 13.3958 6.675 13.6375 6.025C13.8792 5.375 14 4.7 14 4C14 3.3 13.8792 2.625 13.6375 1.975C13.3958 1.325 13.05 0.733333 12.6 0.2C12.8333 0.116667 13.0667 0.0625 13.3 0.0375C13.5333 0.0125 13.7667 0 14 0C15.1 0 16.0417 0.391667 16.825 1.175C17.6083 1.95833 18 2.9 18 4ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="#050C9C"/>
</svg>
}
          iconBgColor="#EEF2FF"
          label={t('stats.totalAffiliates').toUpperCase()}
          value={totalAffiliates.toString()}
          change={affiliatesTrend}
          isPositive={affiliatesTrend.startsWith('+')}
          backgroundSvg={undefined}
        />
        <StatCard 
          icon={<svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17 10V7H14V5H17V2H19V5H22V7H19V10H17ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="#050C9C"/>
</svg>

}
          iconBgColor="#EEF2FF"
          label={t('stats.activeAffiliates').toUpperCase()}
          value={activeAffiliates.toString()}
          change={activeTrend}
          isPositive={activeTrend.startsWith('+')}
          backgroundSvg={undefined}
        />
        <StatCard 
          icon={<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.7 16C8.1 15.9167 6.75 15.3 5.65 14.15C4.55 13 4 11.6167 4 10C4 8.33333 4.58333 6.91667 5.75 5.75C6.91667 4.58333 8.33333 4 10 4C11.6167 4 13 4.55 14.15 5.65C15.3 6.75 15.9167 8.1 16 9.7L13.9 9.075C13.6833 8.175 13.2167 7.4375 12.5 6.8625C11.7833 6.2875 10.95 6 10 6C8.9 6 7.95833 6.39167 7.175 7.175C6.39167 7.95833 6 8.9 6 10C6 10.95 6.2875 11.7833 6.8625 12.5C7.4375 13.2167 8.175 13.6833 9.075 13.9L9.7 16ZM10.9 19.95C10.75 19.9833 10.6 20 10.45 20C10.3 20 10.15 20 10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 10.15 20 10.3 20 10.45C20 10.6 19.9833 10.75 19.95 10.9L18 10.3V10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18C10.05 18 10.1 18 10.15 18C10.2 18 10.25 18 10.3 18L10.9 19.95ZM18.525 20.5L14.25 16.225L13 20L10 10L20 13L16.225 14.25L20.5 18.525L18.525 20.5Z" fill="#050C9C"/>
</svg>
}
          iconBgColor="#3ABEF91A"
          label={t('stats.totalClicks').toUpperCase()}
          value={totalClicks >= 1000 ? `${(totalClicks / 1000).toFixed(1)}k` : totalClicks.toString()}
          change={clicksTrend}
          isPositive={clicksTrend.startsWith('+')}
          backgroundSvg={undefined}
        />
        <StatCard 
          icon={<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.625 13.025L0 11.85L5 3.85L8 7.35L12 0.85L15 5.35L18.375 0L20 1.175L15.05 9.025L12.075 4.55L8.275 10.725L5.25 7.2L1.625 13.025ZM13.5 17C14.2 17 14.7917 16.7583 15.275 16.275C15.7583 15.7917 16 15.2 16 14.5C16 13.8 15.7583 13.2083 15.275 12.725C14.7917 12.2417 14.2 12 13.5 12C12.8 12 12.2083 12.2417 11.725 12.725C11.2417 13.2083 11 13.8 11 14.5C11 15.2 11.2417 15.7917 11.725 16.275C12.2083 16.7583 12.8 17 13.5 17ZM18.6 21L15.9 18.3C15.55 18.5333 15.1708 18.7083 14.7625 18.825C14.3542 18.9417 13.9333 19 13.5 19C12.25 19 11.1875 18.5625 10.3125 17.6875C9.4375 16.8125 9 15.75 9 14.5C9 13.25 9.4375 12.1875 10.3125 11.3125C11.1875 10.4375 12.25 10 13.5 10C14.75 10 15.8125 10.4375 16.6875 11.3125C17.5625 12.1875 18 13.25 18 14.5C18 14.9333 17.9417 15.3542 17.825 15.7625C17.7083 16.1708 17.5333 16.55 17.3 16.9L20 19.6L18.6 21Z" fill="#EA580C"/>
</svg>
}
          iconBgColor="#FFF7ED"
          label={t('stats.totalConversions').toUpperCase()}
          value={totalConversions.toString()}
          change={conversionsTrend}
          isPositive={conversionsTrend.startsWith('+')}
          backgroundSvg={undefined}
        />
        <StatCard 
          icon={<svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2H10C8.81667 2 7.85417 2.37083 7.1125 3.1125C6.37083 3.85417 6 4.81667 6 6V12C6 13.1833 6.37083 14.1458 7.1125 14.8875C7.85417 15.6292 8.81667 16 10 16H18C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H2ZM10 14C9.45 14 8.97917 13.8042 8.5875 13.4125C8.19583 13.0208 8 12.55 8 12V6C8 5.45 8.19583 4.97917 8.5875 4.5875C8.97917 4.19583 9.45 4 10 4H17C17.55 4 18.0208 4.19583 18.4125 4.5875C18.8042 4.97917 19 5.45 19 6V12C19 12.55 18.8042 13.0208 18.4125 13.4125C18.0208 13.8042 17.55 14 17 14H10ZM13 10.5C13.4333 10.5 13.7917 10.3583 14.075 10.075C14.3583 9.79167 14.5 9.43333 14.5 9C14.5 8.56667 14.3583 8.20833 14.075 7.925C13.7917 7.64167 13.4333 7.5 13 7.5C12.5667 7.5 12.2083 7.64167 11.925 7.925C11.6417 8.20833 11.5 8.56667 11.5 9C11.5 9.43333 11.6417 9.79167 11.925 10.075C12.2083 10.3583 12.5667 10.5 13 10.5Z" fill="#050C9C"/>
</svg>
}
          iconBgColor="#EEF2FF"
          label={t('stats.totalRevenue').toUpperCase()}
          value={`$${totalRevenue}`}
          change={revenueTrend}
          isPositive={revenueTrend.startsWith('+')}
          backgroundSvg={undefined}
        />
      </div>

      {/* Main Content Layout: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Revenue Performance & Top Performers */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Revenue Performance Chart */}
          <div className="bg-white rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#191C1E]">{t('admin.revenuePerformance')}</h3>
              <p className="text-xs sm:text-sm text-[#505F76]">{t('admin.visualizingIncome')}</p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 w-full sm:w-auto">
              <button 
                onClick={() => setChartPeriod('daily')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  chartPeriod === 'daily' ? 'bg-white text-[#050C9C]' : 'text-[#505F76] hover:text-gray-700'
                }`}
              >
                {t('common.daily')}
              </button>
              <button 
                onClick={() => setChartPeriod('weekly')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  chartPeriod === 'weekly' ? 'bg-white text-[#050C9C]' : 'text-[#505F76] hover:text-gray-700'
                }`}
              >
                {t('common.weekly')}
              </button>
              <button 
                onClick={() => setChartPeriod('monthly')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  chartPeriod === 'monthly' ? 'bg-white text-[#050C9C]' : 'text-[#505F76] hover:text-gray-700'
                }`}
              >
                {t('common.monthly')}
              </button>
            </div>
          </div>
          
          <div className="h-64 sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

          {/* Top Performing Affiliates */}
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-50">
              <h3 className="text-base sm:text-lg font-bold text-[#191C1E]">{t('admin.topPerformingAffiliates')}</h3>
              <Link href="/admin/affiliates" className="text-xs sm:text-sm font-medium text-[#050C9C] hover:text-[#050C9C]">
                {t('admin.viewAll')}
              </Link>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-gray-50">
              {topPerformers.map((aff, idx) => {
                const clicks = aff.clicks_count || 0;
                const conversions = aff.sales_count || 0;
                const revenue = aff.total_earnings || 0;
                const commission = revenue * (aff.commission_rate / 100);
                const cvr = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : '0.0';
                
                return (
                  <div key={aff.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                          idx === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 
                          idx === 1 ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 
                          'bg-gradient-to-br from-pink-500 to-pink-600'
                        }`}>
                          {aff.user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#191C1E] truncate">{aff.user.name}</p>
                          <p className="text-xs text-[#505F76] truncate">{aff.user.email.split('@')[0]}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-[#505F76]">{t('links.clicks')}</p>
                        <p className="font-semibold text-[#191C1E]">{clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#505F76]">{t('links.conversions')}</p>
                        <p className="font-semibold text-[#191C1E]">{conversions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#505F76]">CVR</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          parseFloat(cvr) > 5 ? 'bg-green-100 text-green-800' : 
                          parseFloat(cvr) > 2 ? 'bg-amber-100 text-amber-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {cvr}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#505F76]">{t('links.revenue')}</p>
                        <p className="font-semibold text-[#191C1E]">${revenue.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#505F76]">{t('earnings.commission')}</p>
                        <p className="font-bold text-emerald-600">${formatCurrency(commission)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {topPerformers.length === 0 && (
                <div className="px-6 py-12 text-center text-[#505F76] text-sm">{t('admin.noAffiliatesYet')}</div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-[#050C9C] [&::-webkit-scrollbar-thumb]:rounded-full">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-[#505F76] border-b border-gray-50">
                    <th className="px-6 py-4">{t('admin.affiliates').toUpperCase()}</th>
                    <th className="px-6 py-4 text-center">{t('links.clicks').toUpperCase()}</th>
                    <th className="px-6 py-4 text-center">{t('links.conversions').toUpperCase()}</th>
                    <th className="px-6 py-4 text-center">{t('links.revenue').toUpperCase()}</th>
                    <th className="px-6 py-4 text-center">{t('earnings.commission').toUpperCase()}</th>
                    <th className="px-6 py-4 text-center">CVR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topPerformers.map((aff, idx) => {
                    const clicks = aff.clicks_count || 0;
                    const conversions = aff.sales_count || 0;
                    const revenue = aff.total_earnings || 0;
                    const commission = revenue * (aff.commission_rate / 100);
                    const cvr = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : '0.0';
                    
                    return (
                      <tr key={aff.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                              idx === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 
                              idx === 1 ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 
                              'bg-gradient-to-br from-pink-500 to-pink-600'
                            }`}>
                              {aff.user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#191C1E] truncate">{aff.user.name}</p>
                              <p className="text-xs text-[#505F76] truncate">{aff.user.email.split('@')[0]}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center font-semibold text-[#191C1E]">{clicks.toLocaleString()}</td>
                        <td className="px-6 py-5 text-center font-semibold text-[#191C1E]">{conversions}</td>
                        <td className="px-6 py-5 text-center font-semibold text-[#191C1E]">${revenue.toLocaleString()}</td>
                        <td className="px-6 py-5 text-center font-bold text-emerald-600">${formatCurrency(commission)}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            parseFloat(cvr) > 5 ? 'bg-green-100 text-green-800' : 
                            parseFloat(cvr) > 2 ? 'bg-amber-100 text-amber-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {cvr}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {topPerformers.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-[#505F76] text-sm">{t('admin.noAffiliatesYet')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-[#FFFFFF] border-t-4 border-[#BA1A1A] backdrop-blur-md rounded-xl  overflow-hidden">
            <div className="  px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-[#BA1A1A] text-[16px]">{t('admin.pendingActions')}</h3>
              <span className="px-2 py-0.5 text-[#93000A] bg-[#FFDAD6] text-[10px] font-bold rounded">
                {affiliates.filter(a => a.status === 'pending').length} {t('admin.urgent')}
              </span>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {affiliates.filter(a => a.status === 'pending').slice(0, 2).map((aff) => (
                <div key={aff.id} className="flex items-start gap-3 p-3 bg-[#F2F4F6] rounded-[12px]">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg width="19" height="14" viewBox="0 0 19 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.1667 8.33333V5.83333H11.6667V4.16667H14.1667V1.66667H15.8333V4.16667H18.3333V5.83333H15.8333V8.33333H14.1667ZM6.66667 6.66667C5.75 6.66667 4.96528 6.34028 4.3125 5.6875C3.65972 5.03472 3.33333 4.25 3.33333 3.33333C3.33333 2.41667 3.65972 1.63194 4.3125 0.979167C4.96528 0.326389 5.75 0 6.66667 0C7.58333 0 8.36806 0.326389 9.02083 0.979167C9.67361 1.63194 10 2.41667 10 3.33333C10 4.25 9.67361 5.03472 9.02083 5.6875C8.36806 6.34028 7.58333 6.66667 6.66667 6.66667ZM0 13.3333V11C0 10.5278 0.121528 10.0938 0.364583 9.69792C0.607639 9.30208 0.930556 9 1.33333 8.79167C2.19444 8.36111 3.06944 8.03819 3.95833 7.82292C4.84722 7.60764 5.75 7.5 6.66667 7.5C7.58333 7.5 8.48611 7.60764 9.375 7.82292C10.2639 8.03819 11.1389 8.36111 12 8.79167C12.4028 9 12.7257 9.30208 12.9688 9.69792C13.2118 10.0938 13.3333 10.5278 13.3333 11V13.3333H0ZM1.66667 11.6667H11.6667V11C11.6667 10.8472 11.6285 10.7083 11.5521 10.5833C11.4757 10.4583 11.375 10.3611 11.25 10.2917C10.5 9.91667 9.74306 9.63542 8.97917 9.44792C8.21528 9.26042 7.44444 9.16667 6.66667 9.16667C5.88889 9.16667 5.11806 9.26042 4.35417 9.44792C3.59028 9.63542 2.83333 9.91667 2.08333 10.2917C1.95833 10.3611 1.85764 10.4583 1.78125 10.5833C1.70486 10.7083 1.66667 10.8472 1.66667 11V11.6667ZM6.66667 5C7.125 5 7.51736 4.83681 7.84375 4.51042C8.17014 4.18403 8.33333 3.79167 8.33333 3.33333C8.33333 2.875 8.17014 2.48264 7.84375 2.15625C7.51736 1.82986 7.125 1.66667 6.66667 1.66667C6.20833 1.66667 5.81597 1.82986 5.48958 2.15625C5.16319 2.48264 5 2.875 5 3.33333C5 3.79167 5.16319 4.18403 5.48958 4.51042C5.81597 4.83681 6.20833 5 6.66667 5Z" fill="#94A3B8"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-black text-[14px]">{t('admin.newApplication')}</p>
                    <p className="text-[12px] text-[#64748B] truncate">{aff.user.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => updateStatus(aff.id, 'active')}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.325 7.01458L0 3.68958L0.83125 2.85833L3.325 5.35208L8.67708 0L9.50833 0.83125L3.325 7.01458Z" fill="#16A34A"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => updateStatus(aff.id, 'suspended')}
                      className="p-1 text-[#BA1A1A] hover:bg-red-50 rounded"
                    >
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.816667 8.16667L0 7.35L3.26667 4.08333L0 0.816667L0.816667 0L4.08333 3.26667L7.35 0L8.16667 0.816667L4.9 4.08333L8.16667 7.35L7.35 8.16667L4.08333 4.9L0.816667 8.16667Z" fill="#DC2626"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {affiliates.filter(a => (a.pending_balance || 0) > 50).slice(0, 2).map((aff) => (
                <div key={`payout-${aff.id}`} className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.66667 13.3333V1.66667C1.66667 1.66667 1.66667 1.97569 1.66667 2.59375C1.66667 3.21181 1.66667 4.01389 1.66667 5V10C1.66667 10.9861 1.66667 11.7882 1.66667 12.4062C1.66667 13.0243 1.66667 13.3333 1.66667 13.3333ZM1.66667 15C1.20833 15 0.815972 14.8368 0.489583 14.5104C0.163194 14.184 0 13.7917 0 13.3333V1.66667C0 1.20833 0.163194 0.815972 0.489583 0.489583C0.815972 0.163194 1.20833 0 1.66667 0H13.3333C13.7917 0 14.184 0.163194 14.5104 0.489583C14.8368 0.815972 15 1.20833 15 1.66667V3.75H13.3333V1.66667H1.66667V13.3333H13.3333V11.25H15V13.3333C15 13.7917 14.8368 14.184 14.5104 14.5104C14.184 14.8368 13.7917 15 13.3333 15H1.66667ZM8.33333 11.6667C7.875 11.6667 7.48264 11.5035 7.15625 11.1771C6.82986 10.8507 6.66667 10.4583 6.66667 10V5C6.66667 4.54167 6.82986 4.14931 7.15625 3.82292C7.48264 3.49653 7.875 3.33333 8.33333 3.33333H14.1667C14.625 3.33333 15.0174 3.49653 15.3438 3.82292C15.6701 4.14931 15.8333 4.54167 15.8333 5V10C15.8333 10.4583 15.6701 10.8507 15.3438 11.1771C15.0174 11.5035 14.625 11.6667 14.1667 11.6667H8.33333ZM14.1667 10V5H8.33333V10H14.1667ZM10.8333 8.75C11.1806 8.75 11.4757 8.62847 11.7188 8.38542C11.9618 8.14236 12.0833 7.84722 12.0833 7.5C12.0833 7.15278 11.9618 6.85764 11.7188 6.61458C11.4757 6.37153 11.1806 6.25 10.8333 6.25C10.4861 6.25 10.191 6.37153 9.94792 6.61458C9.70486 6.85764 9.58333 7.15278 9.58333 7.5C9.58333 7.84722 9.70486 8.14236 9.94792 8.38542C10.191 8.62847 10.4861 8.75 10.8333 8.75Z" fill="#94A3B8"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#191C1E] text-sm">{t('admin.payoutRequest')}</p>
                    <p className="text-xs text-[#464554]">${formatCurrency(aff.pending_balance)} {t('activity.to')} {aff.bank_name || 'PayPal'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.325 7.01458L0 3.68958L0.83125 2.85833L3.325 5.35208L8.67708 0L9.50833 0.83125L3.325 7.01458Z" fill="#16A34A"/>
                      </svg>
                    </button>
                    <button className="p-1 text-[#BA1A1A] hover:bg-red-50 rounded">
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.816667 8.16667L0 7.35L3.26667 4.08333L0 0.816667L0.816667 0L4.08333 3.26667L7.35 0L8.16667 0.816667L4.9 4.08333L8.16667 7.35L7.35 8.16667L4.08333 4.9L0.816667 8.16667Z" fill="#DC2626"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {affiliates.filter(a => a.status === 'pending').length === 0 && 
               affiliates.filter(a => (a.pending_balance || 0) > 50).length === 0 && (
                <div className="text-center py-8 text-[#505F76]">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('admin.noPendingActions')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl ">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[#191C1E] text-[16px]">{t('admin.recentActivity')}</h3>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {affiliates.slice(0, 4).map((aff, idx) => {
                const activities = [
                  {
                    icon: <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.82083 9.45L6.83958 5.83333H4.50625L4.92917 2.52292L2.23125 6.41667H4.25833L3.82083 9.45ZM2.33333 11.6667L2.91667 7.58333H0L5.25 0H6.41667L5.83333 4.66667H9.33333L3.5 11.6667H2.33333Z" fill="#54647A"/></svg>,
                    iconBg: 'bg-blue-100',
                    title: t('activity.newConversion'),
                    subtitle: `${t('activity.fromAffiliate')} #${aff.id}`,
                    detail: `+$${((aff.total_earnings || 0) / Math.max(aff.sales_count || 1, 1)).toFixed(2)} ${t('earnings.commission')}`,
                    time: `${idx * 15 + 2} ${t('time.minutesAgo')}`
                  },
                  {
                    icon: <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.66667 4.66667C4.025 4.66667 3.47569 4.43819 3.01875 3.98125C2.56181 3.52431 2.33333 2.975 2.33333 2.33333C2.33333 1.69167 2.56181 1.14236 3.01875 0.685417C3.47569 0.228472 4.025 0 4.66667 0C5.30833 0 5.85764 0.228472 6.31458 0.685417C6.77153 1.14236 7 1.69167 7 2.33333C7 2.975 6.77153 3.52431 6.31458 3.98125C5.85764 4.43819 5.30833 4.66667 4.66667 4.66667ZM0 9.33333V7.7C0 7.36944 0.0850694 7.06563 0.255208 6.78854C0.425347 6.51146 0.651389 6.3 0.933333 6.15417C1.53611 5.85278 2.14861 5.62674 2.77083 5.47604C3.39306 5.32535 4.025 5.25 4.66667 5.25C5.30833 5.25 5.94028 5.32535 6.5625 5.47604C7.18472 5.62674 7.79722 5.85278 8.4 6.15417C8.68194 6.3 8.90799 6.51146 9.07812 6.78854C9.24826 7.06563 9.33333 7.36944 9.33333 7.7V9.33333H0ZM1.16667 8.16667H8.16667V7.7C8.16667 7.59306 8.13993 7.49583 8.08646 7.40833C8.03299 7.32083 7.9625 7.25278 7.875 7.20417C7.35 6.94167 6.82014 6.74479 6.28542 6.61354C5.75069 6.48229 5.21111 6.41667 4.66667 6.41667C4.12222 6.41667 3.58264 6.48229 3.04792 6.61354C2.51319 6.74479 1.98333 6.94167 1.45833 7.20417C1.37083 7.25278 1.30035 7.32083 1.24688 7.40833C1.1934 7.49583 1.16667 7.59306 1.16667 7.7V8.16667ZM4.66667 3.5C4.9875 3.5 5.26215 3.38576 5.49062 3.15729C5.7191 2.92882 5.83333 2.65417 5.83333 2.33333C5.83333 2.0125 5.7191 1.73785 5.49062 1.50937C5.26215 1.2809 4.9875 1.16667 4.66667 1.16667C4.34583 1.16667 4.07118 1.2809 3.84271 1.50937C3.61424 1.73785 3.5 2.0125 3.5 2.33333C3.5 2.65417 3.61424 2.92882 3.84271 3.15729C4.07118 3.38576 4.34583 3.5 4.66667 3.5Z" fill="currentColor"/></svg>,
                    iconBg: 'bg-blue-50',
                    title: t('activity.registration'),
                    subtitle: t('activity.atAffiliatePortal'),
                    detail: `${aff.user.name} (${aff.user.email.split('@')[0]})`,
                    time: `${idx * 30 + 14} ${t('time.minutesAgo')}`
                  },
                  {
                    icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.01667 8.51667L9.12917 4.40417L8.3125 3.5875L5.01667 6.88333L3.35417 5.22083L2.5375 6.0375L5.01667 8.51667ZM5.83333 11.6667C5.02639 11.6667 4.26806 11.5135 3.55833 11.2073C2.84861 10.901 2.23125 10.4854 1.70625 9.96042C1.18125 9.43542 0.765625 8.81806 0.459375 8.10833C0.153125 7.39861 0 6.64028 0 5.83333C0 5.02639 0.153125 4.26806 0.459375 3.55833C0.765625 2.84861 1.18125 2.23125 1.70625 1.70625C2.23125 1.18125 2.84861 0.765625 3.55833 0.459375C4.26806 0.153125 5.02639 0 5.83333 0C6.64028 0 7.39861 0.153125 8.10833 0.459375C8.81806 0.765625 9.43542 1.18125 9.96042 1.70625C10.4854 2.23125 10.901 2.84861 11.2073 3.55833C11.5135 4.26806 11.6667 5.02639 11.6667 5.83333C11.6667 6.64028 11.5135 7.39861 11.2073 8.10833C10.901 8.81806 10.4854 9.43542 9.96042 9.96042C9.43542 10.4854 8.81806 10.901 8.10833 11.2073C7.39861 11.5135 6.64028 11.6667 5.83333 11.6667ZM5.83333 10.5C7.13611 10.5 8.23958 10.0479 9.14375 9.14375C10.0479 8.23958 10.5 7.13611 10.5 5.83333C10.5 4.53056 10.0479 3.42708 9.14375 2.52292C8.23958 1.61875 7.13611 1.16667 5.83333 1.16667C4.53056 1.16667 3.42708 1.61875 2.52292 2.52292C1.61875 3.42708 1.16667 4.53056 1.16667 5.83333C1.16667 7.13611 1.61875 8.23958 2.52292 9.14375C3.42708 10.0479 4.53056 10.5 5.83333 10.5Z" fill="#16A34A"/></svg>,
                    iconBg: 'bg-green-50',
                    title: t('activity.payoutCompleted'),
                    subtitle: `${t('activity.to')} ${aff.sales_count || 1} ${t('activity.accounts')}`,
                    detail: `${t('activity.batch')} #${9000 + idx} ${t('activity.clearedSuccessfully')}`,
                    time: `${idx * 60 + 60} ${t('time.minutesAgo')}`
                  },
                  {
                    icon: <svg width="9" height="10" viewBox="0 0 9 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 9.91667V0H5.25L5.48333 1.16667H8.75V7H4.66667L4.43333 5.83333H1.16667V9.91667H0ZM5.62917 5.83333H7.58333V2.33333H4.52083L4.2875 1.16667H1.16667V4.66667H5.39583L5.62917 5.83333Z" fill="#93000A"/></svg>,
                    iconBg: 'bg-red-50',
                    title: t('activity.flaggedActivity'),
                    subtitle: t('activity.byRiskEngine'),
                    detail: `${t('activity.account')} #${1100 + idx} (${t('activity.duplicateIps')})`,
                    time: `${idx * 180 + 180} ${t('time.minutesAgo')}`
                  }
                ];
                
                const activity = activities[idx % 4];
                
                return (
                  <ActivityItem 
                    key={`activity-${aff.id}-${idx}`}
                    icon={activity.icon}
                    title={activity.title}
                    subtitle={activity.subtitle}
                    detail={activity.detail}
                    time={activity.time}
                    iconBg={activity.iconBg}
                  />
                );
              })}
            </div>
          </div>

          {/* System Invite Code */}
          <div className="bg-[#FFFFFF] rounded-xl p-6">
            <h3 className="text-[16px] font-bold uppercase tracking-wider text-[#505F76] mb-4">{t('admin.systemInviteCode')}</h3>
            <div className="flex items-center gap-3 bg-[#F2F4F6] rounded-xl p-4">
              <span className="flex-1 text-[12px] font-mono text-[#475569] tracking-wide">STRATUM-ADMIN-2024-XQ92</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('STRATUM-ADMIN-2024-XQ92');
                  setInviteCodeCopied(true);
                  setTimeout(() => setInviteCodeCopied(false), 2000);
                }}
                className="px-4 py-2 bg-[#050C9C] text-white text-[12px] font-semibold rounded-lg hover:bg-[#040a7a] transition-colors uppercase"
              >
                {inviteCodeCopied ? t('common.copied').toUpperCase() : t('common.copy').toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
