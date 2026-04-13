'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  AlertTriangle, XCircle, CheckCircle, 
  DollarSign
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { useTranslation } from '@/hooks/useTranslation';

// Types
interface PayoutsSummary {
  available_balance: number;
  total_paid: number;
  pending_payouts: number;
  failed_payouts: number;
}

interface PayoutAffiliate {
  id: number;
  user?: { name: string };
  pending_balance?: number;
  current_balance?: number;
  bank_name?: string;
  updated_at?: string;
}

interface Sale {
  id: number;
  affiliate?: PayoutAffiliate;
  commission_amount: number | string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface PayoutRequestRowProps {
  name: string;
  id: string;
  amount: string;
  date: string;
  method: string;
  status: string;
  onApprove?: () => void;
}

const formatCurrency = (value?: number | string | null) => {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  const amount = typeof numeric === 'number' && !Number.isNaN(numeric) ? numeric : 0;
  return amount.toFixed(2);
};

const getDefaultDateRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(firstDay), end: fmt(lastDay) };
};

export default function AdminPayoutsPage() {
  const { t } = useTranslation();
  const { start: defaultStart, end: defaultEnd } = getDefaultDateRange();
  const [payoutsSummary, setPayoutsSummary] = useState<PayoutsSummary | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState<PayoutAffiliate[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<Sale[]>([]);
  const [paymentHealth, setPaymentHealth] = useState({ successRate: 0, processed: 0, total: 0, methods: { bankTransfer: 0, paypal: 0, crypto: 0 } });
  const [historyFilter, setHistoryFilter] = useState<'all' | 'paid' | 'failed'>('all');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const historyPageSize = 10;

  const filteredPayoutHistory = payoutHistory.filter((payout) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'paid') return payout.status === 'paid';
    return payout.status === 'failed';
  });

  const paginatedPayoutHistory = filteredPayoutHistory.slice((currentHistoryPage - 1) * historyPageSize, currentHistoryPage * historyPageSize);

  const fetchPayoutsData = useCallback(async () => {
    try {
      const [summaryRes, pendingRes, historyRes] = await Promise.all([
        api.get('/admin/payouts/summary', { params: { start_date: startDate, end_date: endDate } }),
        api.get('/admin/payouts/pending'),
        api.get('/admin/payouts/history', { params: { start_date: startDate, end_date: endDate } }),
      ]);
      
      setPayoutsSummary(summaryRes.data);
      setPendingPayouts(pendingRes.data);
      setPayoutHistory(historyRes.data);
      const health = summaryRes.data.payment_health ?? {};
      setPaymentHealth({
        successRate: health.success_rate ?? 0,
        processed: health.processed ?? 0,
        total: health.total ?? 0,
        methods: {
          bankTransfer: health.methods?.bank_transfer ?? 0,
          paypal: health.methods?.paypal ?? 0,
          crypto: health.methods?.crypto ?? 0,
        },
      });
    } catch (err) {
      console.error('Error fetching payouts:', err);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchPayoutsData();
  }, [fetchPayoutsData]);

  const approvePayout = async (affiliateId: number, amount: number) => {
    try {
      await api.post(`/admin/payouts/${affiliateId}/approve`, { amount });
      fetchPayoutsData();
    } catch (err) {
      console.error('Error approving payout:', err);
    }
  };

  const bulkApprovePending = async () => {
    try {
      await Promise.all(pendingPayouts.map((affiliate) =>
        api.post(`/admin/payouts/${affiliate.id}/approve`, { amount: affiliate.pending_balance || 0 })
      ));
      fetchPayoutsData();
    } catch (err) {
      console.error('Error bulk approving payouts:', err);
    }
  };

  const exportPayoutHistoryCSV = () => {
    const rows = [
      ['Transaction ID', 'Date', 'Affiliate', 'Amount', 'Method', 'Status'],
      ...filteredPayoutHistory.map((payout) => [
        `TXN-${payout.id}`,
        new Date(payout.updated_at || payout.created_at || new Date().toISOString()).toLocaleString(),
        payout.affiliate?.user?.name || 'Unknown',
        `${formatCurrency(payout.commission_amount)}`,
        payout.affiliate?.bank_name || 'Bank Transfer',
        (payout.status || 'paid').toUpperCase(),
      ])
    ];

    const csvContent = rows.map((row) => row.map((value) => `"${value}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-history-${historyFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#191C1E]">{t('payouts.title')}</h1>
          <p className="text-sm text-[#505F76] mt-1">{t('payouts.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm font-medium text-gray-700 border-none outline-none bg-transparent cursor-pointer"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm font-medium text-gray-700 border-none outline-none bg-transparent cursor-pointer"
            />
          </div>
          <button 
            onClick={fetchPayoutsData} 
            className="px-5 py-2.5 bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#050C9C] rounded-lg font-semibold text-sm transition-colors"
          >
            {t('payouts.filterResults')}
          </button>
        </div>
      </div>

      {/* Alert */}
      <div className="bg-[#FFDAD64D] border border-[#BA1A1A1A] rounded-xl p-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm font-semibold text-red-900">
            {t('payouts.failedPayoutAttempts', { 
              count: payoutsSummary?.failed_payouts ?? 0,
              plural: (payoutsSummary?.failed_payouts ?? 0) === 1 ? '' : 's'
            })}
          </p>
        </div>
        <button onClick={fetchPayoutsData} className="px-4 py-2 text-[#BA1A1A] rounded-lg font-semibold text-sm">
          {t('payouts.reviewNow')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16H2ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10C8 9.45 7.80417 8.97917 7.4125 8.5875C7.02083 8.19583 6.55 8 6 8V10H8ZM18 10H20V8C19.45 8 18.9792 8.19583 18.5875 8.5875C18.1958 8.97917 18 9.45 18 10ZM13 9C13.8333 9 14.5417 8.70833 15.125 8.125C15.7083 7.54167 16 6.83333 16 6C16 5.16667 15.7083 4.45833 15.125 3.875C14.5417 3.29167 13.8333 3 13 3C12.1667 3 11.4583 3.29167 10.875 3.875C10.2917 4.45833 10 5.16667 10 6C10 6.83333 10.2917 7.54167 10.875 8.125C11.4583 8.70833 12.1667 9 13 9ZM6 4C6.55 4 7.02083 3.80417 7.4125 3.4125C7.80417 3.02083 8 2.55 8 2H6V4ZM20 4V2H18C18 2.55 18.1958 3.02083 18.5875 3.4125C18.9792 3.80417 19.45 4 20 4Z" fill="#050C9C"/>
</svg>
}
          iconBgColor="#E3DFFF"
          label={t('payouts.availableBalance').toUpperCase()}
          value={`$${(payoutsSummary?.available_balance || 0)}`}
          change="+12%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13 9C12.1667 9 11.4583 8.70833 10.875 8.125C10.2917 7.54167 10 6.83333 10 6C10 5.16667 10.2917 4.45833 10.875 3.875C11.4583 3.29167 12.1667 3 13 3C13.8333 3 14.5417 3.29167 15.125 3.875C15.7083 4.45833 16 5.16667 16 6C16 6.83333 15.7083 7.54167 15.125 8.125C14.5417 8.70833 13.8333 9 13 9ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10H18C18 9.45 18.1958 8.97917 18.5875 8.5875C18.9792 8.19583 19.45 8 20 8V4C19.45 4 18.9792 3.80417 18.5875 3.4125C18.1958 3.02083 18 2.55 18 2H8C8 2.55 7.80417 3.02083 7.4125 3.4125C7.02083 3.80417 6.55 4 6 4V8C6.55 8 7.02083 8.19583 7.4125 8.5875C7.80417 8.97917 8 9.45 8 10ZM19 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16ZM6 10V2V10Z" fill="#10B981"/>
</svg>
}
          iconBgColor="#ECFDF5"
          label={t('payouts.totalPaidMtd').toUpperCase()}
          value={`$${(payoutsSummary?.total_paid || 0)}`}
          change={t('payouts.lastPayment')}
          isPositive={true}
          backgroundSvg={undefined}
          changeColor="#64748B"
        />
        <StatCard
          icon={<svg width="19" height="21" viewBox="0 0 19 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 21C12.6167 21 11.4375 20.5125 10.4625 19.5375C9.4875 18.5625 9 17.3833 9 16C9 14.6167 9.4875 13.4375 10.4625 12.4625C11.4375 11.4875 12.6167 11 14 11C15.3833 11 16.5625 11.4875 17.5375 12.4625C18.5125 13.4375 19 14.6167 19 16C19 17.3833 18.5125 18.5625 17.5375 19.5375C16.5625 20.5125 15.3833 21 14 21ZM15.675 18.375L16.375 17.675L14.5 15.8V13H13.5V16.2L15.675 18.375ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H6.175C6.35833 1.41667 6.71667 0.9375 7.25 0.5625C7.78333 0.1875 8.36667 0 9 0C9.66667 0 10.2625 0.1875 10.7875 0.5625C11.3125 0.9375 11.6667 1.41667 11.85 2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V10.25C17.7 10.0333 17.3833 9.85 17.05 9.7C16.7167 9.55 16.3667 9.41667 16 9.3V4H14V7H4V4H2V18H7.3C7.41667 18.3667 7.55 18.7167 7.7 19.05C7.85 19.3833 8.03333 19.7 8.25 20H2ZM9 4C9.28333 4 9.52083 3.90417 9.7125 3.7125C9.90417 3.52083 10 3.28333 10 3C10 2.71667 9.90417 2.47917 9.7125 2.2875C9.52083 2.09583 9.28333 2 9 2C8.71667 2 8.47917 2.09583 8.2875 2.2875C8.09583 2.47917 8 2.71667 8 3C8 3.28333 8.09583 3.52083 8.2875 3.7125C8.47917 3.90417 8.71667 4 9 4Z" fill="#F59E0B"/>
</svg>
}
          iconBgColor="#FFFBEB"
          label={t('payouts.pendingPayouts').toUpperCase()}
          value={`$${(payoutsSummary?.pending_payouts || 0)}`}
          change={`${pendingPayouts.length} ${t('payouts.requests')}`}
          isPositive={false}
          backgroundSvg={undefined}
          changeColor="#F59E0B"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5 text-red-600" />}
          iconBgColor="#FEE2E2"
          label={t('payouts.failedPayouts').toUpperCase()}
          value={`$${(payoutsSummary?.failed_payouts || 0)}`}
          change={`0 ${t('payouts.failures')}`}
          isPositive={false}
          backgroundSvg={undefined}
          changeColor="#EF4444"
        />
      </div>

      {/* Pending Payout Requests & Payment Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Requests */}
        <div className="col-span-2 bg-[#FFFFFFCC] backdrop-blur-md rounded-xl  p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#191C1E]">{t('payouts.pendingPayoutRequests')}</h3>
            <button onClick={bulkApprovePending} className="px-4 py-2 bg-[#3ABEF91A] text-[#050C9C] rounded-lg font-semibold text-sm">
              {t('payouts.bulkApprove')}
            </button>
          </div>
          <p className="text-sm text-[#505F76] mb-6">{t('payouts.reviewAndApprove')}</p>

          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-[#505F76] uppercase pb-2 ">
              <div>{t('payouts.affiliate')}</div>
              <div>{t('payouts.requestedAmount')}</div>
              <div>{t('payouts.method')}</div>
              <div>{t('payouts.status')}</div>
              <div className="text-right">{t('payouts.actions')}</div>
            </div>

            {pendingPayouts.slice(0, 3).map((affiliate: PayoutAffiliate) => (
              <PayoutRequestRow 
                key={affiliate.id}
                name={affiliate.user?.name || 'Unknown'}
                id={`ID: AFF-${affiliate.id}`}
                amount={`${formatCurrency(affiliate.pending_balance)}`}
                date={new Date(affiliate.updated_at || new Date().toISOString()).toLocaleDateString()}
                method={affiliate.bank_name || 'Bank Transfer'}
                status="PENDING"
                onApprove={() => approvePayout(affiliate.id, affiliate.pending_balance || 0)}
              />
            ))}
            
            {pendingPayouts.length === 0 && (
              <div className="text-center py-8 text-[#505F76]">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">{t('payouts.noPendingRequests')}</p>
              </div>
            )}
          </div>

          {pendingPayouts.length > 3 && (
            <button onClick={() => setCurrentHistoryPage(1)} className="w-full mt-6 py-2 text-sm font-medium text-[#050C9C] hover:bg-indigo-50 rounded-lg transition-colors">
              {t('payouts.viewAllPending', { count: pendingPayouts.length })}
            </button>
          )}
        </div>

        {/* Payment Health */}
        <div className="bg-white rounded-2xl  p-6">
          <h3 className="text-[18px] font-bold text-[#191C1E] mb-8">{t('payouts.paymentHealth')}</h3>
          
          <div className="space-y-8">
            {/* Success Rate */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#D1FAE5] rounded-full flex items-center justify-center flex-shrink-0">
       <svg width="22" height="13" viewBox="0 0 22 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.65 12.025L0 6.375L1.425 4.975L5.675 9.225L7.075 10.625L5.65 12.025ZM11.3 12.025L5.65 6.375L7.05 4.95L11.3 9.2L20.5 0L21.9 1.425L11.3 12.025ZM11.3 6.375L9.875 4.975L14.825 0.025L16.25 1.425L11.3 6.375Z" fill="#059669"/>
</svg>

              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-1">
                  <div>
                    <h4 className="text-[14px] font-bold text-[#191C1E]">{t('payouts.successRate')}</h4>
                    <p className="text-[10px] text-[#505F76]">{t('payouts.past30Days')}</p>
                  </div>
                  <span className="text-3xl font-bold text-[#10B981]">{paymentHealth.successRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Payouts Processed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-[#191C1E]">{t('payouts.payoutsProcessed')}</span>
                <span className="text-[12px] font-bold text-[#191C1E]">
                  {paymentHealth.processed > 0 ? `${paymentHealth.processed}/${paymentHealth.total}` : `${payoutHistory.filter(p => p.status === 'paid' || p.status === 'completed').length}/${payoutHistory.length || 1}`}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#050C9C] rounded-full transition-all duration-500" 
                  style={{ width: `${paymentHealth.total > 0 ? (paymentHealth.processed / paymentHealth.total) * 100 : payoutHistory.length > 0 ? (payoutHistory.filter(p => p.status === 'paid' || p.status === 'completed').length / payoutHistory.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Most Used Methods */}
            <div className="pt-6 border-t border-gray-100">
              <p className="text-[12px] font-bold text-[#505F76] uppercase tracking-wider mb-6">{t('payouts.mostUsedMethods')}</p>
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-3 h-3 bg-[#050C9C] rounded-full"></div>
                    <span className="text-[14px] font-medium text-[#191C1E]">{t('payouts.bankTransfer')}</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#191C1E]">{paymentHealth.methods.bankTransfer}%</span>
                </div>
                <div className="flex flex-wrap items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-3 h-3 bg-[#050C9C] rounded-full"></div>
                    <span className="text-[14px] font-medium text-[#191C1E]">{t('payouts.paypal')}</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#191C1E]">{paymentHealth.methods.paypal}%</span>
                </div>
                <div className="flex flex-wrap items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-3 h-3 bg-[#505F76] rounded-full"></div>
                    <span className="text-[14px] font-medium text-[#191C1E]">{t('payouts.crypto')}</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#191C1E]">{paymentHealth.methods.crypto}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Payout History */}
      <div className="bg-white rounded-2xl  p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#191C1E]">{t('payouts.allPayoutHistory')}</h3>
            <p className="text-sm text-[#505F76] mt-1">{t('payouts.completeTransactionRecords')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => { setHistoryFilter('all'); setCurrentHistoryPage(1); }}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  historyFilter === 'all' 
                    ? 'bg-white text-[#050C9C] shadow-sm' 
                    : 'text-[#505F76] hover:text-gray-700'
                }`}
              >
                {t('payouts.all')}
              </button>
              <button
                onClick={() => { setHistoryFilter('paid'); setCurrentHistoryPage(1); }}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  historyFilter === 'paid' 
                    ? 'bg-white text-[#050C9C] shadow-sm' 
                    : 'text-[#505F76] hover:text-gray-700'
                }`}
              >
                {t('payouts.paid')}
              </button>
              <button
                onClick={() => { setHistoryFilter('failed'); setCurrentHistoryPage(1); }}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  historyFilter === 'failed' 
                    ? 'bg-white text-[#050C9C] shadow-sm' 
                    : 'text-[#505F76] hover:text-gray-700'
                }`}
              >
                {t('payouts.failed')}
              </button>
            </div>
            <button 
              onClick={exportPayoutHistoryCSV} 
              className="px-4 py-2 bg-[#050C9C] hover:bg-[#040a7a] text-white rounded-lg font-semibold text-sm"
            >
              {t('payouts.exportCsv')}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-4 text-xs font-semibold text-[#505F76] uppercase pb-3 ">
            <div>{t('payouts.transactionId')}</div>
            <div>{t('payouts.date')}</div>
            <div>{t('payouts.affiliate')}</div>
            <div className="text-center">{t('payouts.amount')}</div>
            <div className="text-center">{t('payouts.method')}</div>
            <div className="text-center">{t('common.status')}</div>
          </div>

          {paginatedPayoutHistory.length > 0 ? (
            paginatedPayoutHistory.map((payout: Sale) => {
              const affiliateName = payout.affiliate?.user?.name || 'Unknown';
              const statusValue = (payout.status || 'paid').toUpperCase();
              
              return (
                <div key={payout.id} className="grid grid-cols-6 gap-4 py-4 border-b border-gray-50 last:border-0 items-center">
                  <div className="text-sm font-medium text-[#050C9C]">TXN-{payout.id}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(payout.updated_at || payout.created_at || new Date().toISOString()).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">{affiliateName.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-[#191C1E] truncate">{affiliateName}</span>
                  </div>
                  <div className="text-center text-sm font-semibold text-[#191C1E]">
                    ${formatCurrency(payout.commission_amount)}
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    {payout.affiliate?.bank_name || 'Bank Transfer'}
                  </div>
                  <div className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      statusValue === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                      statusValue === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {statusValue}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-[#505F76]">
              <p className="text-sm">{t('payouts.noPayoutHistory')}</p>
            </div>
          )}
        </div>

        {filteredPayoutHistory.length > historyPageSize && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-[#505F76]">
              {t('payouts.showingResults', {
                from: ((currentHistoryPage - 1) * historyPageSize) + 1,
                to: Math.min(currentHistoryPage * historyPageSize, filteredPayoutHistory.length),
                total: filteredPayoutHistory.length
              })}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentHistoryPage(Math.max(1, currentHistoryPage - 1))}
                disabled={currentHistoryPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white  rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('payouts.previous')}
              </button>
              <button
                onClick={() => setCurrentHistoryPage(Math.min(Math.ceil(filteredPayoutHistory.length / historyPageSize), currentHistoryPage + 1))}
                disabled={currentHistoryPage >= Math.ceil(filteredPayoutHistory.length / historyPageSize)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white  rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('payouts.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PayoutRequestRow({ name, id, amount, date, method, status, onApprove }: PayoutRequestRowProps) {
  return (
    <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-semibold text-[#191C1E]">{name}</p>
        <p className="text-xs text-[#505F76]">{id}</p>
        <p className="text-xs text-[#505F76]">{date}</p>
      </div>
      <div className="text-sm font-bold text-[#191C1E]">{amount}</div>
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-[#505F76]" />
        <span className="text-sm text-gray-700">{method}</span>
      </div>
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
        <button onClick={() => console.warn('Reject payout feature coming soon.')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Reject (coming soon)">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
