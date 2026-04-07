'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { Wallet, Clock, CheckCircle2, MoreHorizontal, ArrowRight, Sparkles, Building, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { useTranslation } from '@/hooks/useTranslation';

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
  const { t } = useTranslation();
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
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#191C1E] tracking-tight">{t('earnings.title')}</h1>
          <p className="text-[#505F76] mt-1">{t('earnings.subtitle')}</p>
        </div>
          <div className="flex items-center gap-4 border-b border-gray-200">
             <button className="px-4 py-3 text-sm font-semibold text-[#050C9C] border-b-2 border-indigo-600">{t('earnings.overviewStats')}</button>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            icon={
              <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2H10C8.81667 2 7.85417 2.37083 7.1125 3.1125C6.37083 3.85417 6 4.81667 6 6V12C6 13.1833 6.37083 14.1458 7.1125 14.8875C7.85417 15.6292 8.81667 16 10 16H18C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H2ZM10 14C9.45 14 8.97917 13.8042 8.5875 13.4125C8.19583 13.0208 8 12.55 8 12V6C8 5.45 8.19583 4.97917 8.5875 4.5875C8.97917 4.19583 9.45 4 10 4H17C17.55 4 18.0208 4.19583 18.4125 4.5875C18.8042 4.97917 19 5.45 19 6V12C19 12.55 18.8042 13.0208 18.4125 13.4125C18.0208 13.8042 17.55 14 17 14H10ZM13 10.5C13.4333 10.5 13.7917 10.3583 14.075 10.075C14.3583 9.79167 14.5 9.43333 14.5 9C14.5 8.56667 14.3583 8.20833 14.075 7.925C13.7917 7.64167 13.4333 7.5 13 7.5C12.5667 7.5 12.2083 7.64167 11.925 7.925C11.6417 8.20833 11.5 8.56667 11.5 9C11.5 9.43333 11.6417 9.79167 11.925 10.075C12.2083 10.3583 12.5667 10.5 13 10.5Z" fill="#050C9C"/>
              </svg>
            }
            iconBgColor="#F0F4FF"
            label={t('earnings.totalEarnings')}
            value={`$${(data?.total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            change="+15%"
            isPositive={true}
            backgroundSvg={<></>}
          />

          <StatCard
            icon={
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 9C12.1667 9 11.4583 8.70833 10.875 8.125C10.2917 7.54167 10 6.83333 10 6C10 5.16667 10.2917 4.45833 10.875 3.875C11.4583 3.29167 12.1667 3 13 3C13.8333 3 14.5417 3.29167 15.125 3.875C15.7083 4.45833 16 5.16667 16 6C16 6.83333 15.7083 7.54167 15.125 8.125C14.5417 8.70833 13.8333 9 13 9ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10H18C18 9.45 18.1958 8.97917 18.5875 8.5875C18.9792 8.19583 19.45 8 20 8V4C19.45 4 18.9792 3.80417 18.5875 3.4125C18.1958 3.02083 18 2.55 18 2H8C8 2.55 7.80417 3.02083 7.4125 3.4125C7.02083 3.80417 6.55 4 6 4V8C6.55 8 7.02083 8.19583 7.4125 8.5875C7.80417 8.97917 8 9.45 8 10ZM19 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16ZM6 10V2V10Z" fill="#050C9C"/>
              </svg>
            }
            iconBgColor="#F0F4FF"
            label={t('earnings.availableBalance')}
            value={`$${(data?.available_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            change="+8%"
            isPositive={true}
            backgroundSvg={<></>}
          />

          <StatCard
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.3 14.7L14.7 13.3L11 9.6V5H9V10.4L13.3 14.7ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2167 18 14.1042 17.2208 15.6625 15.6625C17.2208 14.1042 18 12.2167 18 10C18 7.78333 17.2208 5.89583 15.6625 4.3375C14.1042 2.77917 12.2167 2 10 2C7.78333 2 5.89583 2.77917 4.3375 4.3375C2.77917 5.89583 2 7.78333 2 10C2 12.2167 2.77917 14.1042 4.3375 15.6625C5.89583 17.2208 7.78333 18 10 18Z" fill="#EA580C"/>
              </svg>
            }
            iconBgColor="#FFF7ED"
            label={t('earnings.pendingEarnings')}
            value={`$${(data?.pending_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            change="+3%"
            isPositive={true}
            backgroundSvg={<></>}
          />

          <StatCard
            icon={
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="16" fill="#ECFDF5"/>
                <path d="M16.6 22.6L23.65 15.55L22.25 14.15L16.6 19.8L13.75 16.95L12.35 18.35L16.6 22.6ZM18 28C16.6167 28 15.3167 27.7375 14.1 27.2125C12.8833 26.6875 11.825 25.975 10.925 25.075C10.025 24.175 9.3125 23.1167 8.7875 21.9C8.2625 20.6833 8 19.3833 8 18C8 16.6167 8.2625 15.3167 8.7875 14.1C9.3125 12.8833 10.025 11.825 10.925 10.925C11.825 10.025 12.8833 9.3125 14.1 8.7875C15.3167 8.2625 16.6167 8 18 8C19.3833 8 20.6833 8.2625 21.9 8.7875C23.1167 9.3125 24.175 10.025 25.075 10.925C25.975 11.825 26.6875 12.8833 27.2125 14.1C27.7375 15.3167 28 16.6167 28 18C28 19.3833 27.7375 20.6833 27.2125 21.9C26.6875 23.1167 25.975 24.175 25.075 25.075C24.175 25.975 23.1167 26.6875 21.9 27.2125C20.6833 27.7375 19.3833 28 18 28ZM18 26C20.2333 26 22.125 25.225 23.675 23.675C25.225 22.125 26 20.2333 26 18C26 15.7667 25.225 13.875 23.675 12.325C22.125 10.775 20.2333 10 18 10C15.7667 10 13.875 10.775 12.325 12.325C10.775 13.875 10 15.7667 10 18C10 20.2333 10.775 22.125 12.325 23.675C13.875 25.225 15.7667 26 18 26Z" fill="#059669"/>
              </svg>
            }
            iconBgColor="#FFFFFF"
            label={t('earnings.paidEarnings')}
            value={`$${(data?.paid_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            change="+12%"
            isPositive={true}
            backgroundSvg={<></>}
          />
        </div>

        {/* Charts & Payout Row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl   p-6 relative">
            <div className="flex items-center justify-between mb-8 text-center sm:text-left">
               <div>
                 <h3 className="text-lg font-bold text-[#191C1E]">{t('earnings.commissionsInsight')}</h3>
                 <p className="text-sm text-[#505F76]">{t('earnings.performanceLast30Days')}</p>
               </div>
               <div className="flex bg-gray-50 rounded-xl p-1">
                 {[
                   { key: 'Daily', label: t('common.daily') },
                   { key: 'Weekly', label: t('common.weekly') },
                   { key: 'Monthly', label: t('common.monthly') }
                 ].map((p, i) => (
                   <button key={i} onClick={() => setPeriod(p.key)} className={`px-4 py-1.5 text-xs font-semibold rounded-lg ${period === p.key ? 'bg-white  text-[#191C1E]' : 'text-[#505F76]'}`}>
                     {p.label}
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
            <div className="bg-white rounded-2xl  p-6 ">
               <h3 className="text-[14px] font-bold text-[#191C1E] mb-6">{t('earnings.payoutDetails')}</h3>
               <p className="text-[10px] font-bold uppercase tracking-wider text-[#505F76] mb-1">{t('earnings.availableToWithdraw')}</p>
               <p className="text-[32px] font-black text-[#050C9C] mb-6">${(data?.available_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
               
               <button 
                 onClick={requestPayout}
                 disabled={(data?.available_balance || 0) <= 0}
                 className="w-full flex justify-center items-center gap-2 py-3.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all mb-6"
                 style={{ 
                   background: 'linear-gradient(100.03deg, #2A14B4 0%, #4338CA 100%)',
                   boxShadow: '0px 4px 6px -4px #6366F133, 0px 10px 15px -3px #6366F133'
                 }}
               >
                 {t('earnings.requestPayout')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
               </button>

               <div className="space-y-4 pt-4 border-t border-gray-100">
                 <div className="flex justify-between items-center text-[12px]">
                   <span className="text-[#505F76]">{t('earnings.payoutMethod')}</span>
                   <div className="flex items-center gap-2 font-semibold text-[#191C1E]">
                     <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.75 9.33333V5.25H2.91667V9.33333H1.75ZM5.25 9.33333V5.25H6.41667V9.33333H5.25ZM0 11.6667V10.5H11.6667V11.6667H0ZM8.75 9.33333V5.25H9.91667V9.33333H8.75ZM0 4.08333V2.91667L5.83333 0L11.6667 2.91667V4.08333H0ZM2.59583 2.91667H5.83333H9.07083H2.59583ZM2.59583 2.91667H9.07083L5.83333 1.3125L2.59583 2.91667Z" fill="#191C1E"/>
</svg>

                     {t('earnings.bankTransfer')} (****4210)
                   </div>
                 </div>
                 <div className="flex justify-between items-center text-[12px]">
                   <span className="text-[#505F76]">{t('earnings.nextScheduled')}</span>
                   <span className="font-semibold text-[#191C1E]">{getNextPayoutDate()}</span>
                 </div>
               </div>
            </div>

            <div className="bg-[#EEF2FF] rounded-2xl p-5 border border-[#EEF2FF] flex gap-4">
              <div className="text-[#050C9C] mt-1"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19Z" fill="#050C9C"/>
</svg>
</div>
              <div>
                <h4 className="text-sm font-bold text-indigo-900 mb-1">{t('earnings.smartInsight')}</h4>
                <p className="text-xs text-indigo-800/80 leading-relaxed">
                  {t('earnings.greatWork')} <span className="font-bold underline decoration-indigo-300">{transactions.length}</span> {t('earnings.recordedTransactions')} 
                  {topLink && (
                    <span> {t('earnings.topEarner')} <span className="font-semibold">{topLink.name}</span> campaign remains your top earner, pulling in ${topLink.earnings}.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl   overflow-hidden pb-4">
          <div className="p-6 flex items-center justify-between border-b border-gray-50">
            <div>
               <h3 className="text-lg font-bold text-[#191C1E]">{t('earnings.recentTransactions')}</h3>
               <p className="text-sm text-[#505F76] mt-1">{t('earnings.monitoringCommissions')}</p>
            </div>
            <button className="px-5 py-2 bg-gray-50 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-100">{t('dashboard.viewAll')}</button>
          </div>
          <table className="w-full text-left mt-2">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-[#505F76] border-b border-gray-50">
                <th className="px-6 py-4">{t('common.date')}</th>
                <th className="px-6 py-4">{t('earnings.type')}</th>
                <th className="px-6 py-4">{t('earnings.source')}</th>
                <th className="px-6 py-4 font-bold">{t('common.amount')}</th>
                <th className="px-6 py-4">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedTransactions.map((tr, i) => {
                const isCommission = tr.type === 'commission' || tr.amount > 0;
                return (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm font-bold text-[#191C1E]">
                      {new Date(tr.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 bg-indigo-50 text-[#050C9C] rounded-lg text-xs font-bold capitalize">{tr.type}</span>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-600">{tr.source || t('earnings.general')}</td>
                    <td className={`px-6 py-5 text-sm font-black ${isCommission ? 'text-emerald-600' : 'text-[#191C1E]'}`}>
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
                   <td colSpan={5} className="py-8 text-center text-sm text-[#505F76]">{t('earnings.noTransactionsFound')}</td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="px-6 pt-4 flex items-center justify-between text-xs text-[#505F76]">
             <span>{t('earnings.showing')} {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, transactions.length)} {t('earnings.of')} {transactions.length} {t('earnings.transactions')}</span>
             <div className="flex items-center gap-2">
               <button disabled={currentPage === 1} onClick={prevPage} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4 rtl:rotate-180" /></button>
               <span className="font-medium text-[#191C1E]">{currentPage} / {totalPages}</span>
               <button disabled={currentPage === totalPages} onClick={nextPage} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4 rtl:rotate-180" /></button>
             </div>
          </div>
        </div>

      </div>
  );
}

function CalendarIcon(props: any) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
}
function FilterIcon(props: any) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>;
}
