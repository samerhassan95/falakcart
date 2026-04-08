'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import api from '@/lib/api';
import { 
  DollarSign, Clock, CheckCircle, TrendingUp, XCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { DataTable } from '@/components/DataTable';
import { StatCard } from '@/components/StatCard';

// Types
interface CommissionsSummary {
  total_commissions: number;
  pending: number;
  approved: number;
  paid: number;
}

interface Sale {
  id: number;
  affiliate?: {
    user?: { name: string };
  };
  amount: number | string;
  commission_amount: number | string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface CommissionTrendPoint {
  period: string;
  value: number;
}

interface CommissionRowProps {
  name: string;
  source: string;
  amount: string;
  date: string;
  status: string;
  onApprove?: () => void;
  onReject?: () => void;
}

const formatCurrency = (value?: number | string | null) => {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  const amount = typeof numeric === 'number' && !Number.isNaN(numeric) ? numeric : 0;
  return amount.toFixed(2);
};

export default function AdminCommissionsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [commissionsSummary, setCommissionsSummary] = useState<CommissionsSummary | null>(null);
  const [pendingCommissions, setPendingCommissions] = useState<Sale[]>([]);
  const [allCommissions, setAllCommissions] = useState<Sale[]>([]);
  const [commissionTrend, setCommissionTrend] = useState<CommissionTrendPoint[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');
  const [dateRange, setDateRange] = useState<'30' | '7' | '90'>('30');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredCommissions = allCommissions.filter((commission) => {
    if (statusFilter === 'all') return true;
    return commission.status === statusFilter;
  });

  const pageCount = Math.max(1, Math.ceil(filteredCommissions.length / pageSize));
  const paginatedCommissions = filteredCommissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const fetchCommissionsData = useCallback(async () => {
    try {
      const [summaryRes, pendingRes, allRes] = await Promise.all([
        api.get('/admin/commissions/summary'),
        api.get('/admin/commissions/pending'),
        api.get(`/admin/commissions?status=${statusFilter}`)
      ]);
      
      setCommissionsSummary(summaryRes.data);
      setPendingCommissions(pendingRes.data);
      setAllCommissions(allRes.data);
    } catch (err) {
      console.error('Error fetching commissions:', err);
    }
  }, [statusFilter]);

  const fetchCommissionTrend = useCallback(async () => {
    try {
      const response = await api.get(`/admin/analytics/commission-trend?period=${period}`);
      setCommissionTrend(
        response.data.map((item: CommissionTrendPoint) => ({
          period: item.period,
          value: Number(item.value) || 0,
        }))
      );
    } catch (err) {
      console.error('Error fetching commission trend:', err);
    }
  }, [period]);

  useEffect(() => {
    fetchCommissionTrend();
  }, [fetchCommissionTrend]);

  useEffect(() => {
    fetchCommissionsData();
  }, [fetchCommissionsData]);

  const approveCommission = async (id: number) => {
    try {
      await api.put(`/admin/commissions/${id}/approve`);
      fetchCommissionsData();
    } catch (err) {
      console.error('Error approving commission:', err);
    }
  };

  const rejectCommission = async (id: number) => {
    try {
      await api.put(`/admin/commissions/${id}/reject`);
      fetchCommissionsData();
    } catch (err) {
      console.error('Error rejecting commission:', err);
    }
  };

  const exportCommissionsCSV = () => {
    const rows = [
      ['Date', 'Affiliate', 'Referral ID', 'Revenue', 'Commission', 'Status', 'Payment'],
      ...filteredCommissions.map((commission) => [
        new Date(commission.created_at || new Date().toISOString()).toLocaleDateString(),
        commission.affiliate?.user?.name || 'Unknown',
        `REF-${commission.id}`,
        formatCurrency(commission.amount),
        formatCurrency(commission.commission_amount),
        commission.status?.toUpperCase() || 'PENDING',
        commission.status === 'paid' ? 'ACH Sent' : commission.status === 'approved' ? 'Unscheduled' : 'N/A',
      ])
    ];

    const csvContent = rows.map((row) => row.map((value) => `"${value}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${statusFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reviewAllPending = () => {
    setStatusFilter('pending');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191C1E]">{t('admin.commissionsManagement')}</h1>
          <p className="text-sm text-[#505F76]">{t('admin.searchOrdersAffiliates')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 16V2C2 2 2 2.37083 2 3.1125C2 3.85417 2 4.81667 2 6V12C2 13.1833 2 14.1458 2 14.8875C2 15.6292 2 16 2 16ZM2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2V4.5H16V2H2V16H16V13.5H18V16C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H2ZM10 14C9.45 14 8.97917 13.8042 8.5875 13.4125C8.19583 13.0208 8 12.55 8 12V6C8 5.45 8.19583 4.97917 8.5875 4.5875C8.97917 4.19583 9.45 4 10 4H17C17.55 4 18.0208 4.19583 18.4125 4.5875C18.8042 4.97917 19 5.45 19 6V12C19 12.55 18.8042 13.0208 18.4125 13.4125C18.0208 13.8042 17.55 14 17 14H10ZM17 12V6H10V12H17ZM13 10.5C13.4167 10.5 13.7708 10.3542 14.0625 10.0625C14.3542 9.77083 14.5 9.41667 14.5 9C14.5 8.58333 14.3542 8.22917 14.0625 7.9375C13.7708 7.64583 13.4167 7.5 13 7.5C12.5833 7.5 12.2292 7.64583 11.9375 7.9375C11.6458 8.22917 11.5 8.58333 11.5 9C11.5 9.41667 11.6458 9.77083 11.9375 10.0625C12.2292 10.3542 12.5833 10.5 13 10.5Z" fill="#050C9C"/>
</svg>
}
          iconBgColor="#3ABEF91A"
          label={t('stats.totalCommissions')}
          value={`$${(commissionsSummary?.total_commissions || 0).toLocaleString()}`}
          change="+12.5%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<svg width="35" height="37" viewBox="0 0 35 37" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="35" height="37" rx="16" fill="#FFFBEB"/>
<path d="M22 29C20.6167 29 19.4375 28.5125 18.4625 27.5375C17.4875 26.5625 17 25.3833 17 24C17 22.6167 17.4875 21.4375 18.4625 20.4625C19.4375 19.4875 20.6167 19 22 19C23.3833 19 24.5625 19.4875 25.5375 20.4625C26.5125 21.4375 27 22.6167 27 24C27 25.3833 26.5125 26.5625 25.5375 27.5375C24.5625 28.5125 23.3833 29 22 29ZM23.675 26.375L24.375 25.675L22.5 23.8V21H21.5V24.2L23.675 26.375ZM10 28C9.45 28 8.97917 27.8042 8.5875 27.4125C8.19583 27.0208 8 26.55 8 26V12C8 11.45 8.19583 10.9792 8.5875 10.5875C8.97917 10.1958 9.45 10 10 10H14.175C14.3583 9.41667 14.7167 8.9375 15.25 8.5625C15.7833 8.1875 16.3667 8 17 8C17.6667 8 18.2625 8.1875 18.7875 8.5625C19.3125 8.9375 19.6667 9.41667 19.85 10H24C24.55 10 25.0208 10.1958 25.4125 10.5875C25.8042 10.9792 26 11.45 26 12V18.25C25.7 18.0333 25.3833 17.85 25.05 17.7C24.7167 17.55 24.3667 17.4167 24 17.3V12H22V15H12V12H10V26H15.3C15.4167 26.3667 15.55 26.7167 15.7 27.05C15.85 27.3833 16.0333 27.7 16.25 28H10ZM17 12C17.2833 12 17.5208 11.9042 17.7125 11.7125C17.9042 11.5208 18 11.2833 18 11C18 10.7167 17.9042 10.4792 17.7125 10.2875C17.5208 10.0958 17.2833 10 17 10C16.7167 10 16.4792 10.0958 16.2875 10.2875C16.0958 10.4792 16 10.7167 16 11C16 11.2833 16.0958 11.5208 16.2875 11.7125C16.4792 11.9042 16.7167 12 17 12Z" fill="#F59E0B"/>
</svg>
}
          iconBgColor="#FFFBEB"
          label={t('common.pending').toUpperCase()}
          value={`$${(commissionsSummary?.pending || 0).toLocaleString()}`}
          change="+4.2%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<svg width="38" height="37" viewBox="0 0 38 37" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="38" height="37" rx="16" fill="#EEF2FF"/>
<path d="M15.6 29L13.7 25.8L10.1 25L10.45 21.3L8 18.5L10.45 15.7L10.1 12L13.7 11.2L15.6 8L19 9.45L22.4 8L24.3 11.2L27.9 12L27.55 15.7L30 18.5L27.55 21.3L27.9 25L24.3 25.8L22.4 29L19 27.55L15.6 29ZM16.45 26.45L19 25.35L21.6 26.45L23 24.05L25.75 23.4L25.5 20.6L27.35 18.5L25.5 16.35L25.75 13.55L23 12.95L21.55 10.55L19 11.65L16.4 10.55L15 12.95L12.25 13.55L12.5 16.35L10.65 18.5L12.5 20.6L12.25 23.45L15 24.05L16.45 26.45ZM17.95 22.05L23.6 16.4L22.2 14.95L17.95 19.2L15.8 17.1L14.4 18.5L17.95 22.05Z" fill="#3572EF"/>
</svg>
}
          iconBgColor="#EEF2FF"
          label={t('common.approved').toUpperCase()}
          value={`$${(commissionsSummary?.approved || 0).toLocaleString()}`}
          change="+8.1%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<svg width="38" height="32" viewBox="0 0 38 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="38" height="32" rx="16" fill="#ECFDF5"/>
<path d="M21 17C20.1667 17 19.4583 16.7083 18.875 16.125C18.2917 15.5417 18 14.8333 18 14C18 13.1667 18.2917 12.4583 18.875 11.875C19.4583 11.2917 20.1667 11 21 11C21.8333 11 22.5417 11.2917 23.125 11.875C23.7083 12.4583 24 13.1667 24 14C24 14.8333 23.7083 15.5417 23.125 16.125C22.5417 16.7083 21.8333 17 21 17ZM14 20C13.45 20 12.9792 19.8042 12.5875 19.4125C12.1958 19.0208 12 18.55 12 18V10C12 9.45 12.1958 8.97917 12.5875 8.5875C12.9792 8.19583 13.45 8 14 8H28C28.55 8 29.0208 8.19583 29.4125 8.5875C29.8042 8.97917 30 9.45 30 10V18C30 18.55 29.8042 19.0208 29.4125 19.4125C29.0208 19.8042 28.55 20 28 20H14ZM16 18H26C26 17.45 26.1958 16.9792 26.5875 16.5875C26.9792 16.1958 27.45 16 28 16V12C27.45 12 26.9792 11.8042 26.5875 11.4125C26.1958 11.0208 26 10.55 26 10H16C16 10.55 15.8042 11.0208 15.4125 11.4125C15.0208 11.8042 14.55 12 14 12V16C14.55 16 15.0208 16.1958 15.4125 16.5875C15.8042 16.9792 16 17.45 16 18ZM27 24H10C9.45 24 8.97917 23.8042 8.5875 23.4125C8.19583 23.0208 8 22.55 8 22V11H10V22H27V24ZM14 18V10V18Z" fill="#10B981"/>
</svg>
}
          iconBgColor="#ECFDF5"
          label={t('admin.paid')}
          value={`$${(commissionsSummary?.paid || 0).toLocaleString()}`}
          change="0.0%"
          isPositive={false}
          backgroundSvg={undefined}
        />
      </div>

      {/* Commission Performance Chart & Insight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#191C1E]">{t('admin.commissionPerformance')}</h3>
              <p className="text-xs sm:text-sm text-[#505F76]">{t('admin.historicalTrendEarnings')}</p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 w-full sm:w-auto">
              <button 
                onClick={() => setPeriod('daily')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  period === 'daily' ? 'bg-white text-[#050C9C]' : 'text-[#505F76] hover:text-gray-700'
                }`}
              >
                {t('common.daily')}
              </button>
              <button 
                onClick={() => setPeriod('weekly')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  period === 'weekly' ? 'bg-white text-[#050C9C]' : 'text-[#505F76] hover:text-gray-700'
                }`}
              >
                {t('common.weekly')}
              </button>
              <button 
                onClick={() => setPeriod('monthly')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  period === 'monthly' ? 'bg-white text-[#050C9C]' : 'text-[#505F76] hover:text-gray-700'
                }`}
              >
                {t('common.monthly')}
              </button>
            </div>
          </div>
          
          <div className="h-64 sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commissionTrend}>
                <defs>
                  <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="period" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: '#4F46E5', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl p-8 text-white flex flex-col" style={{ background: 'linear-gradient(135deg, #2A14B4 0%, #4338CA 100%)' }}>
          <div className="flex flex-col items-start gap-2 mb-6">
           <svg width="28" height="22" viewBox="0 0 28 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.5 21.25C1.8125 21.25 1.22396 21.0052 0.734375 20.5156C0.244792 20.026 0 19.4375 0 18.75C0 18.0625 0.244792 17.474 0.734375 16.9844C1.22396 16.4948 1.8125 16.25 2.5 16.25C2.625 16.25 2.73438 16.25 2.82812 16.25C2.92188 16.25 3.02083 16.2708 3.125 16.3125L8.8125 10.625C8.77083 10.5208 8.75 10.4219 8.75 10.3281C8.75 10.2344 8.75 10.125 8.75 10C8.75 9.3125 8.99479 8.72396 9.48438 8.23438C9.97396 7.74479 10.5625 7.5 11.25 7.5C11.9375 7.5 12.526 7.74479 13.0156 8.23438C13.5052 8.72396 13.75 9.3125 13.75 10C13.75 10.0417 13.7292 10.25 13.6875 10.625L16.875 13.8125C16.9792 13.7708 17.0781 13.75 17.1719 13.75C17.2656 13.75 17.375 13.75 17.5 13.75C17.625 13.75 17.7344 13.75 17.8281 13.75C17.9219 13.75 18.0208 13.7708 18.125 13.8125L22.5625 9.375C22.5208 9.27083 22.5 9.17188 22.5 9.07812C22.5 8.98438 22.5 8.875 22.5 8.75C22.5 8.0625 22.7448 7.47396 23.2344 6.98438C23.724 6.49479 24.3125 6.25 25 6.25C25.6875 6.25 26.276 6.49479 26.7656 6.98438C27.2552 7.47396 27.5 8.0625 27.5 8.75C27.5 9.4375 27.2552 10.026 26.7656 10.5156C26.276 11.0052 25.6875 11.25 25 11.25C24.875 11.25 24.7656 11.25 24.6719 11.25C24.5781 11.25 24.4792 11.2292 24.375 11.1875L19.9375 15.625C19.9792 15.7292 20 15.8281 20 15.9219C20 16.0156 20 16.125 20 16.25C20 16.9375 19.7552 17.526 19.2656 18.0156C18.776 18.5052 18.1875 18.75 17.5 18.75C16.8125 18.75 16.224 18.5052 15.7344 18.0156C15.2448 17.526 15 16.9375 15 16.25C15 16.125 15 16.0156 15 15.9219C15 15.8281 15.0208 15.7292 15.0625 15.625L11.875 12.4375C11.7708 12.4792 11.6719 12.5 11.5781 12.5C11.4844 12.5 11.375 12.5 11.25 12.5C11.2083 12.5 11 12.4792 10.625 12.4375L4.9375 18.125C4.97917 18.2292 5 18.3281 5 18.4219C5 18.5156 5 18.625 5 18.75C5 19.4375 4.75521 20.026 4.26562 20.5156C3.77604 21.0052 3.1875 21.25 2.5 21.25ZM3.75 8.71875L2.96875 7.03125L1.28125 6.25L2.96875 5.46875L3.75 3.78125L4.53125 5.46875L6.21875 6.25L4.53125 7.03125L3.75 8.71875ZM17.5 7.5L16.3125 4.9375L13.75 3.75L16.3125 2.5625L17.5 0L18.6875 2.5625L21.25 3.75L18.6875 4.9375L17.5 7.5Z" fill="white"/>
</svg>

            <h3 className="text-[20px] text-white font-bold">{t('admin.commissionsIncreasedBy')}</h3>
          </div>
          <p className="text-[#FFFFFFB2] text-[14px] mb-6">
            {t('admin.springCampaignDescription')}
          </p>
          <button className="w-full py-3 text-[14px] rounded-xl font-semibold transition-colors mt-auto" style={{ background: '#FFFFFF1A', backdropFilter: 'blur(4px)' }}>
            {t('admin.viewCampaignBreakdown')}
          </button>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl  p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-bold text-[#191C1E]">{t('admin.pendingApprovals')}</h3>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">{pendingCommissions.length} {t('admin.new')}</span>
          </div>
          <button onClick={reviewAllPending} className="text-sm font-medium text-[#050C9C] hover:text-[#050C9C]">{t('admin.reviewAll')}</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-4 text-xs font-semibold text-[#505F76] uppercase pb-2 border-b border-gray-100">
            <div>{t('admin.affiliate')}</div>
            <div>{t('admin.source')}</div>
            <div>{t('common.amount')}</div>
            <div>{t('common.date')}</div>
            <div>{t('common.status')}</div>
            <div className="text-right">{t('common.actions')}</div>
          </div>

          {pendingCommissions.slice(0, 2).map((commission: Sale) => (
            <CommissionRow 
              key={commission.id}
              name={commission.affiliate?.user?.name || 'Unknown'}
              source={`Sale #${commission.id}`}
              amount={`${formatCurrency(commission.commission_amount)}`}
              date={new Date(commission.created_at || new Date().toISOString()).toLocaleDateString()}
              status={t('common.pending').toUpperCase()}
              onApprove={() => approveCommission(commission.id)}
              onReject={() => rejectCommission(commission.id)}
            />
          ))}
          
          {pendingCommissions.length === 0 && (
            <div className="text-center py-8 text-[#505F76]">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">{t('admin.noPendingCommissions')}</p>
            </div>
          )}
        </div>
      </div>

      {/* All Commissions Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-50">
          <h3 className="text-base sm:text-lg font-bold text-[#191C1E]">{t('admin.allCommissions')}</h3>
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'paid');
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-[#F2F4F6] border-0 rounded-lg text-sm font-medium"
            >
              <option value="all">{t('admin.statusAll')}</option>
              <option value="pending">{t('common.pending')}</option>
              <option value="approved">{t('common.approved')}</option>
              <option value="paid">{t('common.paid')}</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '30' | '7' | '90')}
              className="px-3 py-2 bg-[#F2F4F6] border-0 rounded-lg text-sm font-medium"
            >
              <option value="30">{t('common.last30Days')}</option>
              <option value="7">{t('common.last7Days')}</option>
              <option value="90">{t('common.last90Days')}</option>
            </select>
            <button onClick={exportCommissionsCSV} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm">
              {t('admin.exportCsv')}
            </button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden divide-y divide-gray-50">
          {paginatedCommissions.map((commission: Sale) => {
            const statusValue = commission.status || 'pending';
            return (
              <div key={commission.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#191C1E] truncate">{commission.affiliate?.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-[#505F76] truncate">REF-{commission.id}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusValue === 'approved' ? 'bg-green-100 text-green-800' :
                    statusValue === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {statusValue.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-[#505F76]">{t('links.revenue')}</p>
                    <p className="font-semibold text-[#191C1E]">${formatCurrency(commission.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#505F76]">{t('earnings.commission')}</p>
                    <p className="font-bold text-emerald-600">${formatCurrency(commission.commission_amount)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#505F76]">
                  <span>{new Date(commission.created_at || new Date().toISOString()).toLocaleDateString()}</span>
                  <span>{statusValue === 'paid' ? t('admin.achSent') : statusValue === 'approved' ? t('admin.unscheduled') : 'N/A'}</span>
                </div>
              </div>
            );
          })}
          {paginatedCommissions.length === 0 && (
            <div className="px-6 py-12 text-center text-[#505F76] text-sm">{t('admin.noCommissionsFound')}</div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-[#050C9C] [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-[#505F76] border-b border-gray-50">
                <th className="px-6 py-4">{t('common.date')}</th>
                <th className="px-6 py-4">{t('admin.affiliate')}</th>
                <th className="px-6 py-4 text-center">{t('admin.referralId')}</th>
                <th className="px-6 py-4 text-center">{t('links.revenue')}</th>
                <th className="px-6 py-4 text-center">{t('earnings.commission')}</th>
                <th className="px-6 py-4 text-center">{t('common.status')}</th>
                <th className="px-6 py-4 text-center">{t('admin.payment')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedCommissions.map((commission: Sale) => {
                const statusValue = commission.status || 'pending';
                return (
                  <tr key={commission.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5 text-sm text-[#505F76]">
                      {new Date(commission.created_at || new Date().toISOString()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#191C1E] truncate">{commission.affiliate?.user?.name || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center font-medium text-[#191C1E]">REF-{commission.id}</td>
                    <td className="px-6 py-5 text-center font-semibold text-[#191C1E]">${formatCurrency(commission.amount)}</td>
                    <td className="px-6 py-5 text-center font-bold text-emerald-600">${formatCurrency(commission.commission_amount)}</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        statusValue === 'approved' ? 'bg-green-100 text-green-800' :
                        statusValue === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {statusValue.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center text-sm text-[#505F76]">
                      {statusValue === 'paid' ? t('admin.achSent') : statusValue === 'approved' ? t('admin.unscheduled') : 'N/A'}
                    </td>
                  </tr>
                );
              })}
              {paginatedCommissions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#505F76] text-sm">
                    {t('admin.noCommissionsFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
          <p className="text-sm text-[#505F76]">
            {t('earnings.showing')} {((currentPage - 1) * pageSize) + 1} {t('earnings.of')} {Math.min(currentPage * pageSize, filteredCommissions.length)} {t('earnings.of')} {filteredCommissions.length} {t('common.noResults')}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-[#505F76] hover:text-[#191C1E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous')}
            </button>
            {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'text-[#505F76] hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage === pageCount}
              className="px-3 py-1.5 text-sm font-medium text-[#505F76] hover:text-[#191C1E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommissionRow({ name, source, amount, date, status, onApprove, onReject }: CommissionRowProps) {
  return (
    <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="text-sm font-medium text-[#191C1E]">{name}</div>
      <div className="text-sm text-gray-600">{source}</div>
      <div className="text-sm font-semibold text-[#191C1E]">{amount}</div>
      <div className="text-sm text-gray-600">{date}</div>
      <div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          {status}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2">
        {onApprove && (
          <button onClick={onApprove} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
        {onReject && (
          <button onClick={onReject} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
