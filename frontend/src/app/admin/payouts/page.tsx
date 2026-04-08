'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  AlertTriangle, Calendar, TrendingUp, Clock, XCircle, CheckCircle, 
  DollarSign
} from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { StatCard } from '@/components/StatCard';

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

export default function AdminPayoutsPage() {
  const [payoutsSummary, setPayoutsSummary] = useState<PayoutsSummary | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState<PayoutAffiliate[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<Sale[]>([]);
  const [paymentHealth, setPaymentHealth] = useState({ successRate: 0, methods: { bankTransfer: 0, paypal: 0, crypto: 0 } });
  const [historyFilter, setHistoryFilter] = useState<'all' | 'paid' | 'failed'>('all');
  const [daysRange, setDaysRange] = useState(30);
  const dateRange = daysRange === 7 ? 'Last 7 Days' : daysRange === 90 ? 'Last 90 Days' : 'Last 30 Days';
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
        api.get('/admin/payouts/summary', { params: { days: daysRange } }),
        api.get('/admin/payouts/pending'),
        api.get('/admin/payouts/history', { params: { days: daysRange } }),
      ]);
      
      setPayoutsSummary(summaryRes.data);
      setPendingPayouts(pendingRes.data);
      setPayoutHistory(historyRes.data);
      setPaymentHealth({
        successRate: summaryRes.data.payment_health?.success_rate ?? 0,
        methods: {
          bankTransfer: summaryRes.data.payment_health?.methods?.bank_transfer ?? 0,
          paypal: summaryRes.data.payment_health?.methods?.paypal ?? 0,
          crypto: summaryRes.data.payment_health?.methods?.crypto ?? 0,
        },
      });
    } catch (err) {
      console.error('Error fetching payouts:', err);
    }
  }, [daysRange]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191C1E]">Payouts</h1>
          <p className="text-sm text-[#505F76]">Manage affiliate payments and payout requests</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4" />
            {dateRange}
          </div>
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setDaysRange(days)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${daysRange === days ? 'bg-indigo-600 text-white' : 'bg-[#FFFFFFCC] backdrop-blur-md text-gray-700 border border-gray-200 hover:bg-[#F8FAFC]'}`}
              >
                {days === 7 ? '7D' : days === 30 ? '30D' : '90D'}
              </button>
            ))}
          </div>
          <button onClick={fetchPayoutsData} className="px-4 py-2 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm font-medium hover:bg-[#F8FAFC]">
            Filter Results
          </button>
        </div>
      </div>

      {/* Alert */}
      <div className="bg-red-50 border border-[#BA1A1A] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm font-semibold text-red-900">
            You have {payoutsSummary?.failed_payouts ?? 0} failed payout attempt{(payoutsSummary?.failed_payouts ?? 0) === 1 ? '' : 's'} that require immediate attention.
          </p>
        </div>
        <button onClick={fetchPayoutsData} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm">
          REVIEW NOW
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-[#050C9C]" />}
          iconBgColor="#E0E7FF"
          label="AVAILABLE BALANCE"
          value={`$${(payoutsSummary?.available_balance || 0)}`}
          change="+12%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          iconBgColor="#D1FAE5"
          label="TOTAL PAID (MTD)"
          value={`$${(payoutsSummary?.total_paid || 0)}`}
          change="Last payment 2h ago"
          isPositive={true}
          backgroundSvg={undefined}
          changeColor="#64748B"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          iconBgColor="#FEF3C7"
          label="PENDING PAYOUTS"
          value={`$${(payoutsSummary?.pending_payouts || 0)}`}
          change={`${pendingPayouts.length} Requests`}
          isPositive={false}
          backgroundSvg={undefined}
          changeColor="#F59E0B"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5 text-red-600" />}
          iconBgColor="#FEE2E2"
          label="FAILED PAYOUTS"
          value={`$${(payoutsSummary?.failed_payouts || 0)}`}
          change="0 Failures"
          isPositive={false}
          backgroundSvg={undefined}
          changeColor="#EF4444"
        />
      </div>

      {/* Pending Payout Requests & Payment Health */}
      <div className="grid grid-cols-3 gap-6">
        {/* Pending Requests */}
        <div className="col-span-2 bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#191C1E]">Pending Payout Requests</h3>
            <button onClick={bulkApprovePending} className="px-4 py-2 bg-indigo-600 hover:bg-[#050C9C] text-white rounded-lg font-semibold text-sm">
              BULK APPROVE
            </button>
          </div>
          <p className="text-sm text-[#505F76] mb-6">Review and approve pending transactions</p>

          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-[#505F76] uppercase pb-2 border-b border-gray-100">
              <div>AFFILIATE</div>
              <div>REQUESTED AMOUNT</div>
              <div>METHOD</div>
              <div>STATUS</div>
              <div className="text-right">ACTIONS</div>
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
                <p className="text-sm">No pending payout requests</p>
              </div>
            )}
          </div>

          {pendingPayouts.length > 3 && (
            <button onClick={() => setCurrentHistoryPage(1)} className="w-full mt-6 py-2 text-sm font-medium text-[#050C9C] hover:bg-indigo-50 rounded-lg transition-colors">
              VIEW ALL {pendingPayouts.length} PENDING REQUESTS
            </button>
          )}
        </div>

        {/* Payment Health */}
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-[#191C1E] mb-6">Payment Health</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Success Rate</span>
                <span className="text-sm font-bold text-emerald-600">{paymentHealth.successRate.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, paymentHealth.successRate))}%` }}></div>
              </div>
              <p className="text-xs text-[#505F76] mt-1">Fast 30 days</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">MOST USED METHODS</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">Bank Transfer</span>
                  </div>
                  <span className="text-sm font-semibold text-[#191C1E]">{paymentHealth.methods.bankTransfer}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">PayPal</span>
                  </div>
                  <span className="text-sm font-semibold text-[#191C1E]">{paymentHealth.methods.paypal}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">Crypto</span>
                  </div>
                  <span className="text-sm font-semibold text-[#191C1E]">{paymentHealth.methods.crypto}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Payout History */}
      <DataTable
        title="All Payout History"
        searchComponent={
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setHistoryFilter('all'); setCurrentHistoryPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${historyFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >All</button>
            <button
              onClick={() => { setHistoryFilter('paid'); setCurrentHistoryPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${historyFilter === 'paid' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >Paid</button>
            <button
              onClick={() => { setHistoryFilter('failed'); setCurrentHistoryPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${historyFilter === 'failed' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >Failed</button>
            <button onClick={exportPayoutHistoryCSV} className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg">CSV</button>
          </div>
        }
        columns={[
          { key: 'txId', label: 'TRANSACTION ID' },
          { key: 'date', label: 'DATE' },
          { 
            key: 'affiliate', 
            label: 'AFFILIATE',
            render: (value: any, row: any) => (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">{row.affiliateInitial}</span>
                </div>
                <span className="text-sm font-medium text-[#191C1E]">{value}</span>
              </div>
            )
          },
          { key: 'amount', label: 'AMOUNT' },
          { key: 'method', label: 'METHOD' },
          { 
            key: 'status', 
            label: 'STATUS',
            render: (value: any, row: any) => (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                row.statusValue === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                row.statusValue === 'FAILED' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {value}
              </span>
            )
          }
        ]}
        data={paginatedPayoutHistory.map((payout: Sale) => {
          const affiliateName = payout.affiliate?.user?.name || 'Unknown';
          const statusValue = (payout.status || 'paid').toUpperCase();
          return {
            txId: `TXN-${payout.id}`,
            date: new Date(payout.updated_at || payout.created_at || new Date().toISOString()).toLocaleString(),
            affiliate: affiliateName,
            affiliateInitial: affiliateName.charAt(0),
            amount: `${formatCurrency(payout.commission_amount)}`,
            method: payout.affiliate?.bank_name || 'Bank Transfer',
            status: statusValue,
            statusValue: statusValue
          };
        })}
        emptyMessage="No payout history found"
      />
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
        <button onClick={() => alert('Reject payout is not supported yet.')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
