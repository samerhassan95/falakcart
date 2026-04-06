'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { MousePointerClick, Users2, TrendingUp, DollarSign, Sparkles, ArrowRight, Zap, Target } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import Link from 'next/link';

interface AnalyticsData {
  summary: {
    total_clicks: number;
    total_referrals: number;
    conversion_rate: number;
    total_earnings: number;
  };
  earnings_over_time: { date: string; total: number }[];
  clicks_per_day: { date: string; count: number }[];
  referrals_per_day: { date: string; count: number }[];
  top_links: { name: string; url: string; clicks: number; referrals: number; earnings: number }[];
}

const PIE_COLORS = ['#4F46E5', '#8B5CF6', '#A78BFA'];

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
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
    <AppLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  const s = data?.summary;
  const trafficSources = [
    { name: 'Direct', value: 45 },
    { name: 'Social', value: 25 },
    { name: 'Referral', value: 30 },
  ];

  const totalTraffic = trafficSources.reduce((sum, t) => sum + t.value, 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-indigo-600 tracking-tight">Analytics</h1>
          <p className="text-gray-500 mt-1">Track your performance and optimize your results.</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-4 gap-6">
          <AnalyticsStat icon={<MousePointerClick className="w-5 h-5" />} label="Total Clicks" value={(s?.total_clicks || 0).toLocaleString()} change="+12%" positive />
          <AnalyticsStat icon={<Users2 className="w-5 h-5" />} label="Total Referrals" value={(s?.total_referrals || 0).toLocaleString()} change="+6%" positive />
          <AnalyticsStat icon={<TrendingUp className="w-5 h-5" />} label="Conversion Rate" value={`${s?.conversion_rate || 0}%`} change="-2%" positive={false} />
          <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-white/70" />
              <span className="text-xs font-bold text-white/70 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +18%</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Total Earnings</p>
            <p className="text-2xl font-bold">${(s?.total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Performance Over Time Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Performance Over Time</h3>
              <p className="text-sm text-gray-400">Aggregate performance metrics across all channels</p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(['earnings', 'clicks', 'referrals'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setChartView(view)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                    chartView === view ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(chartView === 'clicks' ? data?.clicks_per_day : chartView === 'referrals' ? data?.referrals_per_day : data?.earnings_over_time) as any[]}>
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
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Clicks Per Day</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.clicks_per_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                  <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Traffic Sources</h3>
            <div className="flex items-center gap-8">
              <div className="w-[140px] h-[140px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={trafficSources} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                      {trafficSources.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 font-medium">Total</p>
                    <p className="text-lg font-bold text-gray-900">{(s?.total_clicks || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {trafficSources.map((source, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-sm text-gray-500">{source.name}</span>
                    <span className="text-sm font-bold text-gray-900 ml-auto">{Math.round((source.value / totalTraffic) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Funnel + Insights */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">User Conversion Funnel</h3>
            <div className="space-y-4">
              <FunnelStep step="01" label="Total Clicks" sub="Entrance visitors" value={(s?.total_clicks || 0).toLocaleString()} color="bg-indigo-50 text-indigo-600" />
              <FunnelStep step="02" label="Referrals" sub={`${s?.conversion_rate || 0}% conversion`} value={(s?.total_referrals || 0).toLocaleString()} color="bg-amber-50 text-amber-600" />
              <FunnelStep step="03" label="Subscriptions" sub="0.65% retention" value="0" color="bg-emerald-50 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Growth Insights</h3>
            </div>
            <div className="space-y-4">
              <InsightCard
                icon={<Zap className="w-4 h-4 text-amber-600" />}
                title="Conversion Jump"
                desc="Your conversion rate increased by 15% this week compared to the last period."
                bgColor="bg-amber-50"
              />
              <InsightCard
                icon={<Target className="w-4 h-4 text-indigo-600" />}
                title="Top Performer"
                desc="Your pricing page link continues to perform best, contributing to 42% of total earnings."
                bgColor="bg-indigo-50"
              />
            </div>
            <button onClick={handleExport} className="w-full mt-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
              Full Insight Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Performing Links */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Top Performing Links</h3>
            <Link href="/links" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All Links <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-50">
                <th className="px-4 py-3">Link Name</th>
                <th className="px-4 py-3 text-center">Clicks</th>
                <th className="px-4 py-3 text-center">Referrals</th>
                <th className="px-4 py-3 text-right">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.top_links || []).map((link, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-600 text-xs font-bold">{link.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{link.name}</p>
                        <p className="text-xs text-gray-400">{link.url}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-900">{link.clicks.toLocaleString()}</td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-900">{link.referrals}</td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900">${link.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {(!data?.top_links || data.top_links.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No link data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function AnalyticsStat({ icon, label, value, change, positive }: { icon: React.ReactNode; label: string; value: string; change: string; positive: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">{icon}</div>
        <span className={`text-xs font-bold flex items-center gap-1 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
          <TrendingUp className={`w-3 h-3 ${!positive ? 'rotate-180' : ''}`} /> {change}
        </span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  );
}

function FunnelStep({ step, label, sub, value, color }: { step: string; label: string; sub: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${color}`}>{step}</div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function InsightCard({ icon, title, desc, bgColor }: { icon: React.ReactNode; title: string; desc: string; bgColor: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>{icon}</div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
