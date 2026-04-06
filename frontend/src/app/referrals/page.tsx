'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Users2, PlaySquare, TrendingUp, Download, Eye, TrendingDown, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [filter, setFilter] = useState('All');
  const [period, setPeriod] = useState('This Month');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRef, setSelectedRef] = useState<Referral | null>(null);
  const itemsPerPage = 5;
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <AppLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  const totalReferrals = referrals.length;
  const activeSubscriptions = referrals.filter(r => r.status === 'subscribed').length;
  const conversionRate = totalReferrals > 0 ? ((activeSubscriptions / totalReferrals) * 100).toFixed(1) : '0.0';

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

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Referrals</h1>
            <p className="text-gray-500 mt-1">Track users who signed up using your links</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-xl p-1">
              {['All', 'Signed Up', 'Subscribed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setFilter(tab); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    filter === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <CalendarIcon className="w-4 h-4" />
                {period}
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {showPeriodDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10">
                  {['Today', 'This Week', 'This Month', 'All Time'].map((option) => (
                    <button
                      key={option}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${period === option ? 'text-indigo-600 bg-indigo-50/50 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                      onClick={() => { setPeriod(option); setShowPeriodDropdown(false); setCurrentPage(1); }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-3 gap-6">
          <StatCard
            icon={<Users2 className="w-5 h-5 text-indigo-600" />}
            label="Total Referrals"
            value={totalReferrals.toString()}
            change="+5%"
            positive
          />
          <StatCard
            icon={<PlaySquare className="w-5 h-5 text-emerald-600" />}
            label="Active Subscriptions"
            value={activeSubscriptions.toString()}
            change="+8%"
            positive
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
            label="Conversion Rate"
            value={`${conversionRate}%`}
            change="-2%"
            positive={false}
          />
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <button onClick={handleExport} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Download CSV <Download className="w-4 h-4" />
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-50">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Referral Link</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Plan Amount</th>
                <th className="px-6 py-4 text-right">Commission</th>
                <th className="px-6 py-4">Date Joined</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedReferrals.map((ref, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
                        {ref.user.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm border-b border-dashed border-gray-300 inline-block pb-0.5">{ref.user}</p>
                        <p className="text-xs text-gray-400 opacity-60">#ID-{(99000 + idx).toString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-md text-xs font-mono truncate max-w-[150px] inline-block">
                      {ref.referral_link.split('/ref/')[1] || 'falakcart'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      ref.status === 'subscribed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {ref.status === 'subscribed' ? 'SUBSCRIBED' : 'SIGNED UP'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-semibold text-gray-900">{ref.plan_amount === '--' ? '—' : ref.plan_amount}</td>
                  <td className="px-6 py-5 text-right font-bold text-indigo-600">
                    ${ref.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-500">{ref.date_joined}</td>
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => setSelectedRef(ref)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm bg-white"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedReferrals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No referrals found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-400">
             <span>Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, displayedReferrals.length)} of {displayedReferrals.length} referrals</span>
             <div className="flex gap-1">
               <button disabled={currentPage === 1} onClick={prevPage} className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-400 disabled:opacity-50">Previous</button>
               <span className="px-3 py-1.5 font-medium text-gray-900">{currentPage} / {totalPages}</span>
               <button disabled={currentPage === totalPages} onClick={nextPage} className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50">Next</button>
             </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Referral Velocity</h3>
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                 <span className="text-xs font-semibold text-gray-900">Daily Conversions</span>
              </div>
            </div>
            <div className="h-[200px]">
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

          <div className="col-span-2 bg-indigo-800 rounded-2xl p-8 text-white relative shadow-lg overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 blur-3xl rounded-full opacity-50 translate-x-1/2 -translate-y-1/2" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Milestone Progress</h3>
            <h2 className="text-3xl font-bold mb-3">Refer {milestoneTarget.toLocaleString()} users</h2>
            <p className="text-sm text-indigo-200 leading-relaxed mb-6">
              You&apos;re only {milestoneTarget - totalReferrals} signups away from unlocking the "Platinum" commission tier.
            </p>
            <div className="space-y-2">
              <div className="w-full h-2.5 bg-indigo-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${milestonePercent}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
                <span className="text-white">{totalReferrals} Referred</span>
                <span className="text-indigo-300">{milestoneTarget.toLocaleString()} Target</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Referral Details</h2>
              <button onClick={() => setSelectedRef(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500">User</span>
                <span className="text-sm font-bold text-gray-900">{selectedRef.user}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500">Status</span>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${selectedRef.status === 'subscribed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {selectedRef.status === 'subscribed' ? 'Subscribed' : 'Signed Up'}
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500">Plan Selected</span>
                <span className="text-sm font-bold text-gray-900">{selectedRef.plan_amount}</span>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl flex items-center justify-between border border-indigo-100">
                <span className="text-sm font-semibold text-indigo-700">Commission Earned</span>
                <span className="text-lg font-black text-indigo-700">${selectedRef.commission.toFixed(2)}</span>
              </div>
            </div>
            
            <button onClick={() => setSelectedRef(null)} className="w-full mt-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
              Close Details
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StatCard({ icon, label, value, change, positive }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${positive ? 'bg-indigo-50' : 'bg-orange-50'}`}>
           {icon}
        </div>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  );
}

function CalendarIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  );
}
