'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Copy, Check, TrendingUp, TrendingDown,
  UserPlus, CheckCircle, DollarSign, Download,
  Calendar, MousePointerClick, Settings
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

export default function Dashboard() {
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

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      const periodParam = period === 'Today' ? '1' : period === 'This Week' ? '7' : period === 'This Month' ? '30' : '999';
      const [statsRes, profileRes, activityRes, clicksRes] = await Promise.all([
        api.get(`/affiliate/stats?days=${periodParam}`),
        api.get('/affiliate/profile'),
        api.get('/affiliate/recent-activity'),
        api.get(`/affiliate/clicks?days=${periodParam}`),
      ]);
      setStats(statsRes.data);
      setProfile(profileRes.data);
      setActivity(activityRes.data);
      setEarningsData(clicksRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
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

  if (loading || isFetching || translationsLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[#505F76] text-sm font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  if (!user) return null;

  const goalTarget = 2000;
  const goalProgress = Math.min(Math.round(((stats?.earnings || 0) / goalTarget) * 100), 100);

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#191C1E] tracking-tight">
              Welcome back, {user.name} 👋
            </h1>
            <p className="text-[#505F76] mt-1">Here's your performance overview for the last 30 days.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-700 transition-colors shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                {period}
              </button>
              {showPeriodMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl  py-2 z-50">
                  {['Today', 'This Week', 'This Month', 'All Time'].map(p => (
                    <button 
                      key={p} 
                      onClick={() => { setPeriod(p); setShowPeriodMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${period === p ? 'text-[#050C9C] font-semibold bg-[#F2F4F6]/50' : 'text-gray-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={handleExport} 
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2A14B4 0%, #4338CA 100%)' }}
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Campaign + Goal Row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative overflow-hidden">
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
              <h2 className="text-2xl font-bold text-[#191C1E] mb-1">{t('dashboard.shareAndEarn')}</h2>
              <p className="text-[#505F76] text-sm mb-5">{t('dashboard.commissionDescription', { rate: profile?.commission_rate || 15 })}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-3 bg-[#F2F4F6] border border-indigo-100 rounded-xl">
                  <span className="text-sm font-medium text-[#050C9C] font-mono">
                    {profile?.main_referral_url || `https://falakcart.com/register?ref=${profile?.referral_code || '...'}`}
                  </span>
                </div>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-full shadow-md text-sm font-semibold text-[#050C9C] hover:bg-gray-50 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
                  <Link href="/settings" className="p-3 bg-[#3ABEF91A] border border-gray-200 rounded-full text-[#505F76] hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.75 11.6667C8.26389 11.6667 7.85069 11.4965 7.51042 11.1562C7.17014 10.816 7 10.4028 7 9.91667C7 9.85833 7.01458 9.72222 7.04375 9.50833L2.94583 7.11667C2.79028 7.2625 2.61042 7.37674 2.40625 7.45937C2.20208 7.54201 1.98333 7.58333 1.75 7.58333C1.26389 7.58333 0.850694 7.41319 0.510417 7.07292C0.170139 6.73264 0 6.31944 0 5.83333C0 5.34722 0.170139 4.93403 0.510417 4.59375C0.850694 4.25347 1.26389 4.08333 1.75 4.08333C1.98333 4.08333 2.20208 4.12465 2.40625 4.20729C2.61042 4.28993 2.79028 4.40417 2.94583 4.55L7.04375 2.15833C7.02431 2.09028 7.01215 2.02465 7.00729 1.96146C7.00243 1.89826 7 1.82778 7 1.75C7 1.26389 7.17014 0.850694 7.51042 0.510417C7.85069 0.170139 8.26389 0 8.75 0C9.23611 0 9.64931 0.170139 9.98958 0.510417C10.3299 0.850694 10.5 1.26389 10.5 1.75C10.5 2.23611 10.3299 2.64931 9.98958 2.98958C9.64931 3.32986 9.23611 3.5 8.75 3.5C8.51667 3.5 8.29792 3.45868 8.09375 3.37604C7.88958 3.2934 7.70972 3.17917 7.55417 3.03333L3.45625 5.425C3.47569 5.49306 3.48785 5.55868 3.49271 5.62187C3.49757 5.68507 3.5 5.75556 3.5 5.83333C3.5 5.91111 3.49757 5.9816 3.49271 6.04479C3.48785 6.10799 3.47569 6.17361 3.45625 6.24167L7.55417 8.63333C7.70972 8.4875 7.88958 8.37326 8.09375 8.29062C8.29792 8.20799 8.51667 8.16667 8.75 8.16667C9.23611 8.16667 9.64931 8.33681 9.98958 8.67708C10.3299 9.01736 10.5 9.43056 10.5 9.91667C10.5 10.4028 10.3299 10.816 9.98958 11.1562C9.64931 11.4965 9.23611 11.6667 8.75 11.6667ZM8.75 10.5C8.91528 10.5 9.05382 10.4441 9.16562 10.3323C9.27743 10.2205 9.33333 10.0819 9.33333 9.91667C9.33333 9.75139 9.27743 9.61285 9.16562 9.50104C9.05382 9.38924 8.91528 9.33333 8.75 9.33333C8.58472 9.33333 8.44618 9.38924 8.33438 9.50104C8.22257 9.61285 8.16667 9.75139 8.16667 9.91667C8.16667 10.0819 8.22257 10.2205 8.33438 10.3323C8.44618 10.4441 8.58472 10.5 8.75 10.5ZM1.75 6.41667C1.91528 6.41667 2.05382 6.36076 2.16563 6.24896C2.27743 6.13715 2.33333 5.99861 2.33333 5.83333C2.33333 5.66806 2.27743 5.52951 2.16563 5.41771C2.05382 5.3059 1.91528 5.25 1.75 5.25C1.58472 5.25 1.44618 5.3059 1.33438 5.41771C1.22257 5.52951 1.16667 5.66806 1.16667 5.83333C1.16667 5.99861 1.22257 6.13715 1.33438 6.24896C1.44618 6.36076 1.58472 6.41667 1.75 6.41667ZM8.75 2.33333C8.91528 2.33333 9.05382 2.27743 9.16562 2.16563C9.27743 2.05382 9.33333 1.91528 9.33333 1.75C9.33333 1.58472 9.27743 1.44618 9.16562 1.33438C9.05382 1.22257 8.91528 1.16667 8.75 1.16667C8.58472 1.16667 8.44618 1.22257 8.33438 1.33438C8.22257 1.44618 8.16667 1.58472 8.16667 1.75C8.16667 1.91528 8.22257 2.05382 8.33438 2.16563C8.44618 2.27743 8.58472 2.33333 8.75 2.33333Z" fill="#54647A"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-[#F2F4F6] rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold text-black">{t('dashboard.goalProgress')}</h3>
              <span className="text-[24px] font-bold text-[#050C9C]">{goalProgress}%</span>
            </div>
            <p className="text-[14px] text-[#505F76] mb-3">{t('dashboard.monthlyTarget', { target: goalTarget.toLocaleString() })}</p>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="text-[12px] text-[#505F76]">
              <span className="font-semibold text-[#191C1E]">{t('dashboard.greatJob')}</span> {t('dashboard.awayFromGoal', { amount: Math.max(0, goalTarget - (stats?.earnings || 0)).toLocaleString() })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            icon={
              <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.7 16C8.1 15.9167 6.75 15.3 5.65 14.15C4.55 13 4 11.6167 4 10C4 8.33333 4.58333 6.91667 5.75 5.75C6.91667 4.58333 8.33333 4 10 4C11.6167 4 13 4.55 14.15 5.65C15.3 6.75 15.9167 8.1 16 9.7L13.9 9.075C13.6833 8.175 13.2167 7.4375 12.5 6.8625C11.7833 6.2875 10.95 6 10 6C8.9 6 7.95833 6.39167 7.175 7.175C6.39167 7.95833 6 8.9 6 10C6 10.95 6.2875 11.7833 6.8625 12.5C7.4375 13.2167 8.175 13.6833 9.075 13.9L9.7 16ZM10.9 19.95C10.75 19.9833 10.6 20 10.45 20C10.3 20 10.15 20 10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 10.15 20 10.3 20 10.45C20 10.6 19.9833 10.75 19.95 10.9L18 10.3V10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18C10.05 18 10.1 18 10.15 18C10.2 18 10.25 18 10.3 18L10.9 19.95ZM18.525 20.5L14.25 16.225L13 20L10 10L20 13L16.225 14.25L20.5 18.525L18.525 20.5Z" fill="#050C9C"/>
              </svg>
            }
            label="TOTAL CLICKS"
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
            label="REFERRALS"
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
            label="SUBSCRIPTIONS"
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
            label="TOTAL EARNINGS"
            value={`$${(stats?.earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            change="+24%"
            positive
            highlighted
                     bgColor="bg-[#050C9C]"
          />
        </div>

        {/* Chart + Activity Row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 ">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#191C1E]">Earnings Performance</h3>
                <p className="text-sm text-[#505F76]">Daily commission revenue tracking</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                <span className="text-xs font-medium text-[#505F76]">This Period</span>
              </div>
            </div>
            <div className="h-[280px]">
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
                <div className="h-full flex items-center justify-center text-gray-300 text-sm">No data yet</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 ">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#191C1E]">Recent Activity</h3>
              <Link href="/earnings" className="text-sm font-semibold text-[#050C9C] hover:text-[#050C9C]">View All</Link>
            </div>
            <div className="space-y-5">
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
                <p className="text-sm text-[#505F76] text-center py-6">No recent activity</p>
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
    <div className={`rounded-2xl border p-6 shadow-sm transition-all ${
      highlighted
        ? 'bg-white border-gray-100'
        : 'bg-white border-gray-100'
    }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${highlighted ? bgColor : bgColor || 'bg-[#F2F4F6]'}`}>
          {icon}
        </div>
        <span className={`text-xs font-bold flex items-center gap-1 ${
        positive ? 'text-emerald-600' : 'text-red-500'
        }`}>
          {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {change}
        </span>
      </div>
      <p className={`text-[12px] font-bold uppercase tracking-wider mb-1 ${
        highlighted ? 'text-[#505F76]' : 'text-[#505F76]'
      }`}>{label}</p>
      <p className={`text-[24px] font-bold tracking-tight ${highlighted ? 'text-[#050C9C]' : 'text-[#191C1E]'}`}>{value}</p>
    </div>
  );
}
