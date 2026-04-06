'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
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

  if (loading || isFetching) return (
    <AppLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    </AppLayout>
  );

  if (!user) return null;

  const goalTarget = 2000;
  const goalProgress = Math.min(Math.round(((stats?.earnings || 0) / goalTarget) * 100), 100);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back, {user.name} 👋
            </h1>
            <p className="text-gray-500 mt-1">Here&apos;s your performance overview for the last 30 days.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                {period}
              </button>
              {showPeriodMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                  {['Today', 'This Week', 'This Month', 'All Time'].map(p => (
                    <button 
                      key={p} 
                      onClick={() => { setPeriod(p); setShowPeriodMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${period === p ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-gray-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Campaign + Goal Row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md mb-3">Primary Campaign</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Share your link and earn</h2>
            <p className="text-gray-500 text-sm mb-5">Earn {profile?.commission_rate || 15}% commission for every active subscription made through your unique referral link.</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <span className="text-sm font-medium text-indigo-700 font-mono">
                  {profile?.main_referral_url || `https://falakcart.com/register?ref=${profile?.referral_code || '...'}`}
                </span>
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <Link href="/settings" className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500">Goal Progress</h3>
              <span className="text-3xl font-bold text-indigo-600">{goalProgress}%</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">Monthly Target: ${goalTarget.toLocaleString()}</p>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">Great job!</span> You&apos;re only ${Math.max(0, goalTarget - (stats?.earnings || 0)).toLocaleString()} away from hitting your monthly reward bonus.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            icon={<MousePointerClick className="w-5 h-5 text-indigo-600" />}
            label="Total Clicks"
            value={(stats?.clicks || 0).toLocaleString()}
            change="+12%"
            positive
          />
          <StatCard
            icon={<UserPlus className="w-5 h-5 text-indigo-600" />}
            label="Referrals"
            value={(stats?.referrals || 0).toLocaleString()}
            change="+5.2%"
            positive
          />
          <StatCard
            icon={<TrendingDown className="w-5 h-5 text-orange-500" />}
            label="Subscriptions"
            value={(stats?.subscriptions || 0).toLocaleString()}
            change="-1.4%"
            positive={false}
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
            label="Total Earnings"
            value={`$${(stats?.earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            change="+24%"
            positive
            highlighted
          />
        </div>

        {/* Chart + Activity Row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Earnings Performance</h3>
                <p className="text-sm text-gray-400">Daily commission revenue tracking</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                <span className="text-xs font-medium text-gray-500">This Period</span>
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

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              <Link href="/earnings" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View All</Link>
            </div>
            <div className="space-y-5">
              {activity.length > 0 ? activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.type === 'commission' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {item.type === 'commission' ? <DollarSign className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.created_at} &bull; {item.subtitle}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-6">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, change, positive, highlighted }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  highlighted?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all ${
      highlighted
        ? 'bg-indigo-600 border-indigo-500 text-white'
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${highlighted ? 'bg-white/20' : 'bg-indigo-50'}`}>
          {icon}
        </div>
        <span className={`text-xs font-bold flex items-center gap-1 ${
          highlighted ? 'text-white/80' : positive ? 'text-emerald-600' : 'text-red-500'
        }`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${highlighted ? 'text-white/70' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${highlighted ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
