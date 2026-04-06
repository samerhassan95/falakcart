'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Wallet, Clock, CheckCircle2, MoreHorizontal, ArrowRight, Sparkles, Building, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface EarningsData {
  total_earnings: number;
  available_balance: number;
  pending_earnings: number;
  paid_earnings: number;
}

interface Transaction {
  id: number;
  created_at: string;
  type: string;
  source: string;
  amount: number;
  status: string;
}

export default function EarningsPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<EarningsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [period, setPeriod] = useState('Monthly'); // Matches days=30
  const [chartData, setChartData] = useState<any[]>([]);
  const [topLink, setTopLink] = useState<{name: string, earnings: number} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      let days = 30; // Monthly
      if (period === 'Daily') days = 1;
      if (period === 'Weekly') days = 7;

      const [earningsRes, transRes, analyticsRes] = await Promise.all([
        api.get('/affiliate/earnings'),
        api.get('/affiliate/transactions?per_page=50'),
        api.get(`/affiliate/analytics?days=${days}`)
      ]);
      setData(earningsRes.data);
      if (transRes.data.data) {
        setTransactions(transRes.data.data);
      } else {
        setTransactions(transRes.data);
      }
      
      const overTime = analyticsRes.data.earnings_over_time;
      setChartData(overTime);
      if (analyticsRes.data.top_links && analyticsRes.data.top_links.length > 0) {
        setTopLink(analyticsRes.data.top_links[0]);
      }
    } catch (err) {
      console.error('Error fetching earnings data', err);
    } finally {
      setIsFetching(false);
    }
  }, [period]);

  useEffect(() => {
    if (user && user.role === 'affiliate') fetchData();
  }, [user, fetchData]);

  const requestPayout = async () => {
    try {
      const response = await api.post('/affiliate/payout');
      
      // Show success message
      alert(`Payout requested successfully! Amount: $${response.data.amount.toFixed(2)}`);
      
      // Refresh data
      fetchData();
    } catch (err: any) {
      console.error('Payout error', err);
      
      // Show error message
      const errorMessage = err.response?.data?.error || 'Failed to request payout. Please try again.';
      alert(`Error: ${errorMessage}`);
    }
  };

  if (loading || isFetching) return (
    <AppLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  // Insight chart formatting
  const insightData = chartData.map(d => ({
    date: d.date.substring(5), // e.g., '10-01'
    val: parseFloat(d.total)
  }));

  if (insightData.length === 0) {
    insightData.push({ date: 'Today', val: 0 });
  }

  const totalPages = Math.ceil(transactions.length / itemsPerPage) || 1;
  const paginatedTransactions = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  const getNextPayoutDate = () => {
    const today = new Date();
    let nextDate = new Date(today.getFullYear(), today.getMonth(), 15);
    if (today.getDate() > 15) {
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    }
    return nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Earnings</h1>
            <p className="text-gray-500 mt-1">Financial performance summary</p>
          </div>
          <div className="flex items-center gap-4 border-b border-gray-200">
             <button className="px-4 py-3 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600">Overview Stats</button>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <div className="flex justify-between items-start mb-4">
               <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                 <Wallet className="w-5 h-5" />
               </div>
               <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                 <TrendingUp className="w-3 h-3" /> +15%
               </span>
             </div>
             <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Earnings</p>
             <p className="text-3xl font-bold tracking-tight text-gray-900">${(data?.total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>

          <StatCard icon={<Wallet className="w-5 h-5 text-indigo-600" />} label="Available Balance" value={`$${(data?.available_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} bg="bg-indigo-50" />
          <StatCard icon={<Clock className="w-5 h-5 text-orange-500" />} label="Pending Earnings" value={`$${(data?.pending_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} bg="bg-orange-50" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} label="Paid Earnings" value={`$${(data?.paid_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} bg="bg-emerald-50" />
        </div>

        {/* Charts & Payout Row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
            <div className="flex items-center justify-between mb-8 text-center sm:text-left">
               <div>
                 <h3 className="text-lg font-bold text-gray-900">Commissions Insight</h3>
                 <p className="text-sm text-gray-500">Performance over last 30 days</p>
               </div>
               <div className="flex bg-gray-50 rounded-xl p-1">
                 {['Daily', 'Weekly', 'Monthly'].map((p, i) => (
                   <button key={i} onClick={() => setPeriod(p)} className={`px-4 py-1.5 text-xs font-semibold rounded-lg ${period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                     {p}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="h-[250px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={insightData}>
                    <defs>
                      <linearGradient id="colorInsight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                    <Area type="monotone" dataKey="val" stroke="#4F46E5" strokeWidth={3} fill="url(#colorInsight)" />
                 </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
               <h3 className="text-sm font-bold text-gray-900 mb-6">Payout Details</h3>
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Available to withdraw</p>
               <p className="text-4xl font-black text-indigo-600 mb-6">${(data?.available_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
               
               <button 
                 onClick={requestPayout}
                 disabled={(data?.available_balance || 0) <= 0}
                 className="w-full flex justify-center items-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md mb-6"
               >
                 Request Payout <ArrowRight className="w-4 h-4" />
               </button>

               <div className="space-y-4 pt-4 border-t border-gray-100">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500">Payout Method</span>
                   <div className="flex items-center gap-2 font-semibold text-gray-900">
                     <Building className="w-4 h-4 text-gray-400" />
                     Bank Transfer (****4210)
                   </div>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500">Next Scheduled</span>
                   <span className="font-semibold text-gray-900">{getNextPayoutDate()}</span>
                 </div>
               </div>
            </div>

            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50 flex gap-4">
              <div className="text-indigo-600 mt-1"><Sparkles className="w-5 h-5 fill-indigo-600" /></div>
              <div>
                <h4 className="text-sm font-bold text-indigo-900 mb-1">Smart Insight</h4>
                <p className="text-xs text-indigo-800/80 leading-relaxed">
                  Great work! You have <span className="font-bold underline decoration-indigo-300">{transactions.length}</span> recorded commission transactions. 
                  {topLink && (
                    <span> Your <span className="font-semibold">{topLink.name}</span> campaign remains your top earner, pulling in ${topLink.earnings}.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden pb-4">
          <div className="p-6 flex items-center justify-between border-b border-gray-50">
            <div>
               <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
               <p className="text-sm text-gray-500 mt-1">Monitoring your latest commission events</p>
            </div>
            <button className="px-5 py-2 bg-gray-50 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-100">View All</button>
          </div>
          <table className="w-full text-left mt-2">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-50">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedTransactions.map((tr, i) => {
                const isCommission = tr.type === 'commission' || tr.amount > 0;
                return (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm font-bold text-gray-900">
                      {new Date(tr.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold capitalize">{tr.type}</span>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-600">{tr.source || 'General'}</td>
                    <td className={`px-6 py-5 text-sm font-black ${isCommission ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {isCommission ? '+' : '-'}${Math.abs(tr.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                         <span className={`w-1.5 h-1.5 rounded-full ${tr.status === 'pending' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                         <span className={tr.status === 'pending' ? 'text-orange-500' : 'text-emerald-600'}>{tr.status}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                   <td colSpan={5} className="py-8 text-center text-sm text-gray-400">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="px-6 pt-4 flex items-center justify-between text-xs text-gray-500">
             <span>Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} transactions</span>
             <div className="flex items-center gap-2">
               <button disabled={currentPage === 1} onClick={prevPage} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
               <span className="font-medium text-gray-900">{currentPage} / {totalPages}</span>
               <button disabled={currentPage === totalPages} onClick={nextPage} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
             </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, bg }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
    </div>
  );
}

function CalendarIcon(props: any) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
}
function FilterIcon(props: any) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>;
}
