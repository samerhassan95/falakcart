'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Link2, Users, CreditCard, TrendingUp, Copy, Check, 
  LogOut, BarChart3, ShoppingCart, Calendar, ArrowRight,
  Percent
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface Stats {
  clicks: number;
  sales: number;
  earnings: number;
  balance: number;
}

interface AffiliateProfile {
  referral_code: string;
  status: string;
  commission_rate: number;
}

interface Sale {
  id: number;
  amount: number;
  commission_amount: number;
  status: string;
  reference_id: string | null;
  created_at: string;
}

interface ClickStat {
  date: string;
  count: number;
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clickStats, setClickStats] = useState<ClickStat[]>([]);
  const [copied, setCopied] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (user && user.role === 'affiliate') {
      fetchData();
    } else if (user && user.role === 'admin') {
       // Ideally we'd have a separate component or redirect
    }
  }, [user]);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [statsRes, profileRes, salesRes, clicksRes] = await Promise.all([
        api.get('/affiliate/stats'),
        api.get('/affiliate/profile'),
        api.get('/affiliate/sales'),
        api.get('/affiliate/clicks?days=30'),
      ]);
      setStats(statsRes.data);
      setProfile(profileRes.data);
      setSales(salesRes.data);
      setClickStats(clicksRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setIsFetching(false);
    }
  };

  const copyToClipboard = () => {
    if (profile) {
      const link = `${window.location.origin}/refer/${profile.referral_code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || isFetching) return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-blue-500/20 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-zinc-500 font-medium">Synchronizing Data...</p>
      </div>
    </div>
  );

  if (!user) return <div>Redirecting to login...</div>;

  // Calculate Conversion Rate
  const conversionRate = stats && stats.clicks > 0 
    ? ((stats.sales / stats.clicks) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-black text-white min-h-screen pb-24">
      {/* Background Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
               <TrendingUp className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Partner Hub
             </h1>
          </div>
          <p className="text-zinc-400 font-medium">Hello, {user.name}. Here&apos;s your performance snapshot.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-zinc-900/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-zinc-800 flex items-center gap-4 shadow-xl">
            <div className="hidden sm:block text-sm font-semibold text-zinc-500 uppercase tracking-widest">Share Link:</div>
            <div className="bg-black/50 px-4 py-1.5 rounded-xl border border-zinc-700/50 text-blue-400 font-mono text-sm select-all">
              {profile?.referral_code ? `.../refer/${profile.referral_code}` : 'Generating...'}
            </div>
            <button 
              onClick={copyToClipboard}
              className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-all border border-blue-500/20 group"
              title="Copy referral link"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />}
            </button>
          </div>
          
          <button 
            onClick={logout}
            className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl border border-red-500/20 transition-all text-red-500 hover:text-red-400 shadow-lg shadow-red-500/10 group"
            title="Logout"
          >
            <LogOut className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Clicks" 
          value={stats?.clicks ?? 0} 
          icon={<Link2 className="w-6 h-6 text-blue-400" />} 
          trend="+12%"
          color="blue"
        />
        <StatCard 
          title="Successful Referrals" 
          value={stats?.sales ?? 0} 
          icon={<Users className="w-6 h-6 text-emerald-400" />} 
          trend={conversionRate + "% Conv."}
          color="emerald"
        />
        <StatCard 
          title="Lifetime Revenue" 
          value={`$${Number(stats?.earnings ?? 0).toFixed(2)}`} 
          icon={<TrendingUp className="w-6 h-6 text-purple-400" />} 
          trend={(profile?.commission_rate || 10) + "% Rate"}
          color="purple"
        />
        <StatCard 
          title="Available Balance" 
          value={`$${Number(stats?.balance ?? 0).toFixed(2)}`} 
          icon={<CreditCard className="w-6 h-6 text-orange-400" />} 
          trend="Withdrawal Ready"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Click Analytics Chart */}
        <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-zinc-800/50 p-8 shadow-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              Traffic Analytics
            </h2>
            <div className="flex gap-2">
               <span className="px-3 py-1 bg-zinc-800 rounded-lg text-xs font-bold text-zinc-400">Last 30 Days</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {clickStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clickStats}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#52525b" 
                    fontSize={10} 
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis stroke="#52525b" fontSize={10} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorClicks)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                <BarChart3 className="w-12 h-12 opacity-20" />
                <p>No traffic data accumulated yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Ticker / Info */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl border border-zinc-800 p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
             <Percent className="w-32 h-32 text-emerald-500" />
          </div>
          
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
             <Percent className="w-6 h-6 text-emerald-400" />
             Earnings Insight
          </h2>
          
          <div className="space-y-8 relative z-10">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-zinc-800">
               <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Base Rate</p>
                  <p className="text-2xl font-black text-white">{profile?.commission_rate || 10}%</p>
               </div>
               <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
               </div>
            </div>
            
            <div className="space-y-4">
               <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                 <ArrowRight className="w-4 h-4 text-blue-500" />
                 Next Milestone
               </h3>
               <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                 <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full w-[65%]" />
               </div>
               <p className="text-xs text-zinc-500 font-medium">Reach $500.00 to unlock Premium 15% rate</p>
            </div>

            <div className="pt-4 grid grid-cols-2 gap-4">
               <div className="p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800/50">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Clicks/Day</p>
                  <p className="text-lg font-bold">~14</p>
               </div>
               <div className="p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800/50">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">CR Index</p>
                  <p className="text-lg font-bold text-blue-400">{conversionRate}%</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-emerald-500/10 rounded-2xl">
               <ShoppingCart className="w-6 h-6 text-emerald-400" />
             </div>
             <div>
               <h2 className="text-2xl font-bold">Commission Breakdown</h2>
               <p className="text-zinc-500 text-sm font-medium">Detailed history of all attributed sales</p>
             </div>
          </div>
          <button className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Filter Archive
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/40 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Order ID / Ref</th>
                <th className="px-8 py-5 text-center">Amount</th>
                <th className="px-8 py-5 text-center">Commission</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sales.length > 0 ? sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
                       <span className="font-mono text-sm font-bold text-zinc-300 group-hover:text-blue-400 transition-colors">
                        {sale.reference_id || `SALE-${sale.id.toString().padStart(6, '0')}`}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-sm font-bold">${Number(sale.amount).toFixed(2)}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-black shadow-inner">
                      +${Number(sale.commission_amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      sale.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 
                      sale.status === 'pending' ? 'bg-orange-500/5 border-orange-500/20 text-orange-500' : 
                      'bg-red-500/5 border-red-500/20 text-red-500'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="text-sm font-medium text-zinc-400">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-zinc-600 font-bold">
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-zinc-600">
                       <ShoppingCart className="w-16 h-16 opacity-10" />
                       <p className="font-bold uppercase tracking-widest text-xs">Waiting for your first sale...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: { title: string, value: string | number, icon: React.ReactNode, trend: string, color: 'blue' | 'emerald' | 'purple' | 'orange' }) {
  const colorMap = {
    blue: 'border-blue-500/20 bg-blue-500/5 shadow-blue-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 shadow-emerald-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5 shadow-purple-500/5',
    orange: 'border-orange-500/20 bg-orange-500/5 shadow-orange-500/5',
  };

  const textMap = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  };

  return (
    <div className={`p-8 rounded-[2rem] border ${colorMap[color]} space-y-6 transition-all hover:scale-[1.02] hover:-translate-y-1 cursor-pointer group shadow-2xl relative overflow-hidden`}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-700">
         {icon}
      </div>
      
      <div className="flex justify-between items-start">
        <div className={`p-4 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl group-hover:border-zinc-700 transition-colors`}>{icon}</div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${textMap[color]} bg-black/40 border border-zinc-800`}>
           {trend}
        </div>
      </div>
      <div>
        <div className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">{title}</div>
        <div className="text-4xl font-black mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">{value}</div>
      </div>
    </div>
  );
}
