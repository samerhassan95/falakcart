'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

interface AnalyticsData {
  summary: {
    total_clicks: number;
    total_referrals: number;
    conversion_rate: number;
    total_earnings: number;
    all_time_earnings: number;
    click_trend: number;
    earnings_trend: number;
    total_traffic: number;
    total_subscriptions?: number;
    top_link_name?: string;
    top_link_share?: number;
  };
  earnings_over_time: { date: string; total: number }[];
  clicks_per_day: { date: string; count: number }[];
  referrals_per_day: { date: string; count: number }[];
  top_links: { name: string; url: string; clicks: number; referrals: number; earnings: number }[];
  traffic_sources: { name: string; value: number }[];
}

const PIE_COLORS = ['#050C9C', '#A7E6FF', '#CBD5E1'];
const DEVICE_COLORS = ['#050C9C', '#3B82F6', '#A7E6FF'];

// Animation variants for charts
const chartVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [chartView, setChartView] = useState<'earnings' | 'clicks' | 'referrals'>('earnings');

  const fetchAnalytics = useCallback(async () => {
    setIsFetching(true);
    try {
      const { data: res } = await api.get('/affiliate/analytics?days=30');
      setData(res);
    } catch (err) {
      console.error('Error fetching analytics', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'affiliate') fetchAnalytics();
  }, [user, fetchAnalytics]);

  const handleExport = () => {
    if (!data) return;
    const csvContent = "Date,Total Earnings\n" + 
      data.earnings_over_time.map(d => `"${d.date}","${d.total}"`).join("\n");
    // Add BOM for Excel compatibility
    const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics_insight_report.csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  if (loading || isFetching) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const s = data?.summary;
  
  // Ensure consistent data between server and client
  const safeTrafficSources = data?.traffic_sources?.length > 0 ? data.traffic_sources : [
    { name: 'Direct', value: 45 },
    { name: 'Social', value: 35 },
    { name: 'Referral', value: 20 },
  ];

  const totalTraffic = s?.total_traffic || safeTrafficSources.reduce((sum, source) => sum + source.value, 0);

  return (
    <div className="space-y-4 sm:space-y-6 ">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#191C1E] tracking-tight">{t('analytics.title')}</h1>
        <p className="text-sm sm:text-base text-[#505F76] mt-1">{t('analytics.subtitle')}</p>
      </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Clicks */}
          <StatCard
            icon={
              <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.7 16C8.1 15.9167 6.75 15.3 5.65 14.15C4.55 13 4 11.6167 4 10C4 8.33333 4.58333 6.91667 5.75 5.75C6.91667 4.58333 8.33333 4 10 4C11.6167 4 13 4.55 14.15 5.65C15.3 6.75 15.9167 8.1 16 9.7L13.9 9.075C13.6833 8.175 13.2167 7.4375 12.5 6.8625C11.7833 6.2875 10.95 6 10 6C8.9 6 7.95833 6.39167 7.175 7.175C6.39167 7.95833 6 8.9 6 10C6 10.95 6.2875 11.7833 6.8625 12.5C7.4375 13.2167 8.175 13.6833 9.075 13.9L9.7 16ZM10.9 19.95C10.75 19.9833 10.6 20 10.45 20C10.3 20 10.15 20 10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 10.15 20 10.3 20 10.45C20 10.6 19.9833 10.75 19.95 10.9L18 10.3V10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18C10.05 18 10.1 18 10.15 18C10.2 18 10.25 18 10.3 18L10.9 19.95ZM18.525 20.5L14.25 16.225L13 20L10 10L20 13L16.225 14.25L20.5 18.525L18.525 20.5Z" fill="#050C9C"/>
              </svg>
            }
            iconBgColor="#3ABEF91A"
            label={t('stats.totalClicks')}
            value={(s?.total_clicks || 0).toLocaleString()}
            change={`${(s?.click_trend || 0) >= 0 ? '+' : ''}${s?.click_trend || 0}%`}
            isPositive={(s?.click_trend || 0) >= 0}
            backgroundSvg={
              <svg className="absolute -bottom-0 -end-0 opacity-[0.1]" width="81" height="81" viewBox="0 0 81 81" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M38.8 64C32.4 63.6667 27 61.2 22.6 56.6C18.2 52 16 46.4667 16 40C16 33.3333 18.3333 27.6667 23 23C27.6667 18.3333 33.3333 16 40 16C46.4667 16 52 18.2 56.6 22.6C61.2 27 63.6667 32.4 64 38.8L55.6 36.3C54.7333 32.7 52.8667 29.75 50 27.45C47.1333 25.15 43.8 24 40 24C35.6 24 31.8333 25.5667 28.7 28.7C25.5667 31.8333 24 35.6 24 40C24 43.8 25.15 47.1333 27.45 50C29.75 52.8667 32.7 54.7333 36.3 55.6L38.8 64ZM43.6 79.8C43 79.9333 42.4 80 41.8 80C41.2 80 40.6 80 40 80C34.4667 80 29.2667 78.95 24.4 76.85C19.5333 74.75 15.3 71.9 11.7 68.3C8.1 64.7 5.25 60.4667 3.15 55.6C1.05 50.7333 0 45.5333 0 40C0 34.4667 1.05 29.2667 3.15 24.4C5.25 19.5333 8.1 15.3 11.7 11.7C15.3 8.1 19.5333 5.25 24.4 3.15C29.2667 1.05 34.4667 0 40 0C45.5333 0 50.7333 1.05 55.6 3.15C60.4667 5.25 64.7 8.1 68.3 11.7C71.9 15.3 74.75 19.5333 76.85 24.4C78.95 29.2667 80 34.4667 80 40C80 40.6 80 41.2 80 41.8C80 42.4 79.9333 43 79.8 43.6L72 41.2V40C72 31.0667 68.9 23.5 62.7 17.3C56.5 11.1 48.9333 8 40 8C31.0667 8 23.5 11.1 17.3 17.3C11.1 23.5 8 31.0667 8 40C8 48.9333 11.1 56.5 17.3 62.7C23.5 68.9 31.0667 72 40 72C40.2 72 40.4 72 40.6 72C40.8 72 41 72 41.2 72L43.6 79.8ZM74.1 82L57 64.9L52 80L40 40L80 52L64.9 57L82 74.1L74.1 82Z" fill="#191C1E"/>
              </svg>
            }
          />

          {/* Total Referrals */}
          <StatCard
            icon={
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 10V7H14V5H17V2H19V5H22V7H19V10H17ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="#050C9C"/>
              </svg>
            }
            iconBgColor="#EEF2FF"
            label={t('stats.totalReferrals')}
            value={(s?.total_referrals || 0).toLocaleString()}
            change={`${(s?.conversion_rate || 0) >= 0 ? '+' : ''}${s?.conversion_rate || 0}%`}
            isPositive={true}
            backgroundSvg={
              <svg className="absolute -bottom-0 -end-0 opacity-[0.1]" width="85" height="64" viewBox="0 0 85 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M68 40V28H56V20H68V8H76V20H88V28H76V40H68ZM32 32C27.6 32 23.8333 30.4333 20.7 27.3C17.5667 24.1667 16 20.4 16 16C16 11.6 17.5667 7.83333 20.7 4.7C23.8333 1.56667 27.6 0 32 0C36.4 0 40.1667 1.56667 43.3 4.7C46.4333 7.83333 48 11.6 48 16C48 20.4 46.4333 24.1667 43.3 27.3C40.1667 30.4333 36.4 32 32 32ZM0 64V52.8C0 50.5333 0.583333 48.45 1.75 46.55C2.91667 44.65 4.46667 43.2 6.4 42.2C10.5333 40.1333 14.7333 38.5833 19 37.55C23.2667 36.5167 27.6 36 32 36C36.4 36 40.7333 36.5167 45 37.55C49.2667 38.5833 53.4667 40.1333 57.6 42.2C59.5333 43.2 61.0833 44.65 62.25 46.55C63.4167 48.45 64 50.5333 64 52.8V64H0ZM8 56H56V52.8C56 52.0667 55.8167 51.4 55.45 50.8C55.0833 50.2 54.6 49.7333 54 49.4C50.4 47.6 46.7667 46.25 43.1 45.35C39.4333 44.45 35.7333 44 32 44C28.2667 44 24.5667 44.45 20.9 45.35C17.2333 46.25 13.6 47.6 10 49.4C9.4 49.7333 8.91667 50.2 8.55 50.8C8.18333 51.4 8 52.0667 8 52.8V56ZM32 24C34.2 24 36.0833 23.2167 37.65 21.65C39.2167 20.0833 40 18.2 40 16C40 13.8 39.2167 11.9167 37.65 10.35C36.0833 8.78333 34.2 8 32 8C29.8 8 27.9167 8.78333 26.35 10.35C24.7833 11.9167 24 13.8 24 16C24 18.2 24.7833 20.0833 26.35 21.65C27.9167 23.2167 29.8 24 32 24Z" fill="#191C1E"/>
              </svg>
            }
          />

          {/* Conversion Rate */}
          <StatCard
            icon={
              <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.625 13.025L0 11.85L5 3.85L8 7.35L12 0.85L15 5.35L18.375 0L20 1.175L15.05 9.025L12.075 4.55L8.275 10.725L5.25 7.2L1.625 13.025ZM13.5 17C14.2 17 14.7917 16.7583 15.275 16.275C15.7583 15.7917 16 15.2 16 14.5C16 13.8 15.7583 13.2083 15.275 12.725C14.7917 12.2417 14.2 12 13.5 12C12.8 12 12.2083 12.2417 11.725 12.725C11.2417 13.2083 11 13.8 11 14.5C11 15.2 11.2417 15.7917 11.725 16.275C12.2083 16.7583 12.8 17 13.5 17ZM18.6 21L15.9 18.3C15.55 18.5333 15.1708 18.7083 14.7625 18.825C14.3542 18.9417 13.9333 19 13.5 19C12.25 19 11.1875 18.5625 10.3125 17.6875C9.4375 16.8125 9 15.75 9 14.5C9 13.25 9.4375 12.1875 10.3125 11.3125C11.1875 10.4375 12.25 10 13.5 10C14.75 10 15.8125 10.4375 16.6875 11.3125C17.5625 12.1875 18 13.25 18 14.5C18 14.9333 17.9417 15.3542 17.825 15.7625C17.7083 16.1708 17.5333 16.55 17.3 16.9L20 19.6L18.6 21Z" fill="#EA580C"/>
              </svg>
            }
            iconBgColor="#FFF7ED"
            label={t('stats.conversionRate')}
            value={`${s?.conversion_rate || 0}%`}
            change="-2%"
            isPositive={false}
            backgroundSvg={
              <svg className="absolute -bottom-0 -end-0 opacity-[0.1]" width="80" height="84" viewBox="0 0 80 84" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.5 52.1L0 47.4L20 15.4L32 29.4L48 3.4L60 21.4L73.5 0L80 4.7L60.2 36.1L48.3 18.2L33.1 42.9L21 28.8L6.5 52.1ZM54 68C56.8 68 59.1667 67.0333 61.1 65.1C63.0333 63.1667 64 60.8 64 58C64 55.2 63.0333 52.8333 61.1 50.9C59.1667 48.9667 56.8 48 54 48C51.2 48 48.8333 48.9667 46.9 50.9C44.9667 52.8333 44 55.2 44 58C44 60.8 44.9667 63.1667 46.9 65.1C48.8333 67.0333 51.2 68 54 68ZM74.4 84L63.6 73.2C62.2 74.1333 60.6833 74.8333 59.05 75.3C57.4167 75.7667 55.7333 76 54 76C49 76 44.75 74.25 41.25 70.75C37.75 67.25 36 63 36 58C36 53 37.75 48.75 41.25 45.25C44.75 41.75 49 40 54 40C59 40 63.25 41.75 66.75 45.25C70.25 48.75 72 53 72 58C72 59.7333 71.7667 61.4167 71.3 63.05C70.8333 64.6833 70.1333 66.2 69.2 67.6L80 78.4L74.4 84Z" fill="#191C1E"/>
              </svg>
            }
          />

          {/* Total Earnings */}
          <StatCard
            icon={
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 9C12.1667 9 11.4583 8.70833 10.875 8.125C10.2917 7.54167 10 6.83333 10 6C10 5.16667 10.2917 4.45833 10.875 3.875C11.4583 3.29167 12.1667 3 13 3C13.8333 3 14.5417 3.29167 15.125 3.875C15.7083 4.45833 16 5.16667 16 6C16 6.83333 15.7083 7.54167 15.125 8.125C14.5417 8.70833 13.8333 9 13 9ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10H18C18 9.45 18.1958 8.97917 18.5875 8.5875C18.9792 8.19583 19.45 8 20 8V4C19.45 4 18.9792 3.80417 18.5875 3.4125C18.1958 3.02083 18 2.55 18 2H8C8 2.55 7.80417 3.02083 7.4125 3.4125C7.02083 3.80417 6.55 4 6 4V8C6.55 8 7.02083 8.19583 7.4125 8.5875C7.80417 8.97917 8 9.45 8 10ZM19 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16ZM6 10V2V10Z" fill="white"/>
              </svg>
            }
            iconBgColor="#FFFFFF33"
            label={t('stats.totalEarnings')}
            value={`$${(s?.total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            change={`${(s?.earnings_trend || 0) >= 0 ? '+' : ''}${s?.earnings_trend || 0}%`}
            isPositive={(s?.earnings_trend || 0) >= 0}
            gradient="linear-gradient(126.12deg, #2A14B4 0%, #4338CA 100%)"
            boxShadow="0px 8px 10px -6px #2A14B433, 0px 20px 25px -5px #2A14B433"
            textColor="#FFFFFF"
            labelColor="#FFFFFFB2"
            changeColor="#FFFFFF"
            backgroundSvg={
              <svg className="absolute -bottom-0 -end-0 opacity-20" width="38" height="72" viewBox="0 0 38 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.8 72V63.4C11.2667 62.6 8.21667 61.0667 5.65 58.8C3.08333 56.5333 1.2 53.3333 0 49.2L7.4 46.2C8.4 49.4 9.88333 51.8333 11.85 53.5C13.8167 55.1667 16.4 56 19.6 56C22.3333 56 24.65 55.3833 26.55 54.15C28.45 52.9167 29.4 51 29.4 48.4C29.4 46.0667 28.6667 44.2167 27.2 42.85C25.7333 41.4833 22.3333 39.9333 17 38.2C11.2667 36.4 7.33333 34.25 5.2 31.75C3.06667 29.25 2 26.2 2 22.6C2 18.2667 3.4 14.9 6.2 12.5C9 10.1 11.8667 8.73333 14.8 8.4V0H22.8V8.4C26.1333 8.93333 28.8833 10.15 31.05 12.05C33.2167 13.95 34.8 16.2667 35.8 19L28.4 22.2C27.6 20.0667 26.4667 18.4667 25 17.4C23.5333 16.3333 21.5333 15.8 19 15.8C16.0667 15.8 13.8333 16.45 12.3 17.75C10.7667 19.05 10 20.6667 10 22.6C10 24.8 11 26.5333 13 27.8C15 29.0667 18.4667 30.4 23.4 31.8C28 33.1333 31.4833 35.25 33.85 38.15C36.2167 41.05 37.4 44.4 37.4 48.2C37.4 52.9333 36 56.5333 33.2 59C30.4 61.4667 26.9333 63 22.8 63.6V72H14.8Z" fill="white"/>
              </svg>
            }
          />
        </div>

        {/* Performance Over Time Chart */}
        <div className="bg-white rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#191C1E]">{t('analytics.performanceOverTime')}</h3>
              <p className="text-xs sm:text-sm text-[#505F76]">{t('analytics.aggregateMetrics')}</p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 w-full sm:w-auto">
              {[
                { key: 'earnings', label: t('analytics.earnings') },
                { key: 'clicks', label: t('analytics.clicks') },
                { key: 'referrals', label: t('analytics.referrals') }
              ].map((view) => (
                <button
                  key={view.key}
                  onClick={() => setChartView(view.key as any)}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                    chartView === view.key ? 'bg-white text-[#050C9C] ' : 'text-[#505F76] hover:text-gray-700'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(chartView === 'clicks' ? data?.clicks_per_day : chartView === 'referrals' ? data?.referrals_per_day : data?.earnings_over_time) || []}>
                <defs>
                  <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Area type="monotone" dataKey={chartView === 'earnings' ? 'total' : 'count'} stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPerf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clicks + Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#505F76] mb-4 sm:mb-6">{t('analytics.clicksPerDay')}</h3>
            <div className="h-48 sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.clicks_per_day || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    interval={'preserveStartEnd'}
                    minTickGap={20}
                  />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#F2F4F6'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#050C9C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white rounded-2xl p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#505F76] mb-6 sm:mb-8">{t('analytics.trafficSources')}</h3>
            <div className="flex flex-col items-center">
              <div className="w-[160px] h-[160px] relative mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={safeTrafficSources} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={50} 
                      outerRadius={70} 
                      startAngle={0}
                      endAngle={360}
                      dataKey="value"
                      stroke="none"
                    >
                      {safeTrafficSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: 600 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-[#9CA3AF] font-medium mb-1">{t('analytics.total')}</p>
                    <p className="text-2xl font-bold text-[#191C1E]">{totalTraffic >= 1000 ? (totalTraffic/1000).toFixed(1) + 'k' : totalTraffic}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 w-full">
                <div className="flex flex-wrap items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#050C9C]"></span>
                    <span className="text-sm text-[#6B7280]">{t('analytics.direct')}</span>
                  </div>
                  <span className="text-sm font-bold text-[#191C1E]">{safeTrafficSources.find(t => t.name === 'Direct')?.value || 0}%</span>
                </div>
                <div className="flex flex-wrap items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#A7E6FF]"></span>
                    <span className="text-sm text-[#6B7280]">{t('analytics.social')}</span>
                  </div>
                  <span className="text-sm font-bold text-[#191C1E]">{safeTrafficSources.find(t => t.name === 'Social')?.value || 0}%</span>
                </div>
                <div className="flex flex-wrap items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#CBD5E1]"></span>
                    <span className="text-sm text-[#6B7280]">{t('analytics.referral')}</span>
                  </div>
                  <span className="text-sm font-bold text-[#191C1E]">{safeTrafficSources.find(t => t.name === 'Referral')?.value || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Funnel + Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#505F76] mb-4 sm:mb-6">{t('analytics.userConversionFunnel')}</h3>
            <div className="space-y-4">
              <FunnelStep step="01" label={t('stats.totalClicks')} sub={t('analytics.entranceVisitors')} value={(s?.total_clicks || 0).toLocaleString()} color="bg-[#050C9C] text-white" />
              <FunnelStep step="02" label={t('analytics.referrals')} sub={`${s?.conversion_rate || 0}% ${t('analytics.conversion')}`} value={(s?.total_referrals || 0).toLocaleString()} color="bg-[#050C9C] text-white" />
              <FunnelStep step="03" label={t('dashboard.subscriptions')} sub={`${((s?.total_subscriptions || 0) / (s?.total_referrals || 1) * 100).toFixed(1)}% ${t('analytics.retention')}`} value={(s?.total_subscriptions || 0).toString()} color="bg-[#050C9C] text-white" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-[#050C9C]" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#191C1E]">{t('analytics.growthInsights')}</h3>
            </div>
            <div className="space-y-4">
              <InsightCard
                icon={<Zap className="w-4 h-4 text-amber-600" />}
                title={t('analytics.conversionJump')}
                desc={(s?.click_trend || 0) > 0 
                  ? `زاد معدل النقرات الخاص بك بنسبة ${s.click_trend}% هذا الشهر مقارنة بالفترة الماضية.`
                  : 'أداء النقرات مستقر حالياً، حاول تنويع مصادر الزيارات لزيادة النمو.'}
                bgColor="bg-[#F2F4F6]"
              />
              <InsightCard
                icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 18V16H8V12.9C7.18333 12.7167 6.45417 12.3708 5.8125 11.8625C5.17083 11.3542 4.7 10.7167 4.4 9.95C3.15 9.8 2.10417 9.25417 1.2625 8.3125C0.420833 7.37083 0 6.26667 0 5V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H4V0H14V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V5C18 6.26667 17.5792 7.37083 16.7375 8.3125C15.8958 9.25417 14.85 9.8 13.6 9.95C13.3 10.7167 12.8292 11.3542 12.1875 11.8625C11.5458 12.3708 10.8167 12.7167 10 12.9V16H14V18H4ZM4 7.8V4H2V5C2 5.63333 2.18333 6.20417 2.55 6.7125C2.91667 7.22083 3.4 7.58333 4 7.8ZM9 11C9.83333 11 10.5417 10.7083 11.125 10.125C11.7083 9.54167 12 8.83333 12 8V2H6V8C6 8.83333 6.29167 9.54167 6.875 10.125C7.45833 10.7083 8.16667 11 9 11ZM14 7.8C14.6 7.58333 15.0833 7.22083 15.45 6.7125C15.8167 6.20417 16 5.63333 16 5V4H14V7.8Z" fill="#050C9C"/>
</svg>
}
                title={t('analytics.topPerformer')}
                desc={`رابط ${s?.top_link_name || 'الرئيسي'} يستمر في الأداء الأفضل، ويساهم بنسبة ${s?.top_link_share || 0}% من إجمالي الزيارات.`}
                 bgColor="bg-[#F2F4F6]"
              />
            </div>
            <button onClick={handleExport} className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3 bg-[#E3DFFF] text-[#050C9C] rounded-full text-xs sm:text-sm font-semibold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
              {t('analytics.fullInsightReport')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Top Performing Links */}
        <div className="bg-white rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#505F76]">{t('analytics.topPerformingLinks')}</h3>
            <Link href="/links" className="text-xs sm:text-sm font-semibold text-[#050C9C] hover:text-[#050C9C] flex items-center gap-1">
              {t('analytics.viewAllLinks')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {(data?.top_links || []).map((link, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[#050C9C] text-sm font-bold">{link.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#191C1E] text-sm truncate">{link.name}</p>
                    <p className="text-xs text-[#505F76] truncate">{link.url}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-[#505F76] mb-1">{t('links.clicks')}</p>
                    <p className="font-semibold text-[#191C1E]">{link.clicks.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#505F76] mb-1">{t('analytics.referrals')}</p>
                    <p className="font-semibold text-[#191C1E]">{link.referrals}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#505F76] mb-1">{t('analytics.earnings')}</p>
                    <p className="font-bold text-[#191C1E]">${link.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!data?.top_links || data.top_links.length === 0) && (
              <div className="px-4 py-8 text-center text-[#505F76] text-sm">{t('analytics.noLinkData')}</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-[#505F76] border-b border-gray-50">
                  <th className="px-4 py-3">{t('links.linkName')}</th>
                  <th className="px-4 py-3 text-center">{t('links.clicks')}</th>
                  <th className="px-4 py-3 text-center">{t('analytics.referrals')}</th>
                  <th className="px-4 py-3 text-right">{t('analytics.earnings')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.top_links || []).map((link, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <span className="text-[#050C9C] text-xs font-bold">{link.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#191C1E] text-sm">{link.name}</p>
                          <p className="text-xs text-[#505F76]">{link.url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-[#191C1E]">{link.clicks.toLocaleString()}</td>
                    <td className="px-4 py-4 text-center font-semibold text-[#191C1E]">{link.referrals}</td>
                    <td className="px-4 py-4 text-right font-bold text-[#191C1E]">${link.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {(!data?.top_links || data.top_links.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#505F76] text-sm">{t('analytics.noLinkData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}

function FunnelStep({ step, label, sub, value, color }: { step: string; label: string; sub: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[#EEF2FF] rounded-xl">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${color}`}>{step}</div>
      <div className="flex-1">
        <p className="font-semibold text-[#191C1E] text-sm">{label}</p>
        <p className="text-xs text-[#505F76]">{sub}</p>
      </div>
      <p className="text-xl font-bold text-[#050C9C]">{value}</p>
    </div>
  );
}

function InsightCard({ icon, title, desc, bgColor }: { icon: React.ReactNode; title: string; desc: string; bgColor: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>{icon}</div>
      <div>
        <p className="font-semibold text-[#191C1E] text-sm">{title}</p>
        <p className="text-xs text-[#505F76] mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
