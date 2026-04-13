// Shared types, utilities, and components for admin pages
import { type ReactNode } from 'react';

// Types
export interface Summary {
  total_affiliates: number;
  total_affiliates_trend?: string;
  active_affiliates: number;
  active_affiliates_trend?: string;
  total_sales: number;
  total_sales_trend?: string;
  total_revenue: number;
  total_revenue_trend?: string;
  total_commissions: number;
  total_clicks: number;
  total_clicks_trend?: string;
}

export interface Affiliate {
  id: number;
  user: { id: number; name: string; email: string };
  referral_code: string;
  status: string;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  commission_strategy: 'flat' | 'tier_referrals' | 'tier_volume';
  commission_tiers: { threshold: number; rate: number }[] | null;
  total_earnings: number;
  clicks_count?: number;
  sales_count?: number;
  created_at?: string;
  updated_at?: string;
  pending_balance?: number;
  current_balance?: number;
  bank_name?: string;
}

export interface AnalyticsClick {
  date: string;
  count: number;
}

export interface DeviceMetric {
  name: string;
  count: number;
}

export interface GeoMetric {
  region: string;
  count: number;
}

export interface TrafficSource {
  source: string;
  count: number;
}

export interface CommissionTrendPoint {
  period: string;
  value: number;
}

export interface CommissionsSummary {
  total_commissions: number;
  pending: number;
  approved: number;
  paid: number;
}

export interface PayoutsSummary {
  available_balance: number;
  total_paid: number;
  pending_payouts: number;
  failed_payouts: number;
}

export interface Sale {
  id: number;
  affiliate?: Affiliate;
  amount: number | string;
  commission_amount: number | string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PayoutAffiliate extends Affiliate {
  pending_balance?: number;
  current_balance?: number;
  bank_name?: string;
  updated_at?: string;
}

// Utility functions
export const formatCurrency = (value?: number | string | null) => {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  const amount = typeof numeric === 'number' && !Number.isNaN(numeric) ? numeric : 0;
  return amount.toFixed(2);
};

export const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// Shared component props interfaces
export interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend?: 'up' | 'down';
}

export interface ActivityItemProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  detail: string;
  time: string;
  iconBg: string;
}

export interface MetricCardProps {
  label: string;
  value: string;
  change: string;
}

export interface InsightItemProps {
  icon: ReactNode;
  text: string;
  subtext: string;
}

// Shared components
export function StatCard({ label, value, change, trend }: StatCardProps) {
  return (
    <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-3 sm:p-4">
      <p className="text-[10px] sm:text-xs font-semibold text-[#505F76] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-xl sm:text-2xl font-bold text-[#191C1E]">{value}</p>
        <span className={`text-xs font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  );
}

export function ActivityItem({ icon, title, subtitle, detail, time, iconBg }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#191C1E] text-sm">{title} <span className="font-normal text-gray-600">{subtitle}</span></p>
        {detail && <p className="text-sm text-gray-600">{detail}</p>}
        <p className="text-xs text-[#505F76] mt-1">{time}</p>
      </div>
    </div>
  );
}

export function MetricCard({ label, value, change }: MetricCardProps) {
  return (
    <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-[#505F76] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-[#191C1E]">{value}</p>
        <span className="text-xs font-semibold text-green-600">{change}</span>
      </div>
    </div>
  );
}

export function InsightItem({ icon, text, subtext }: InsightItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#191C1E]">{text}</p>
        <p className="text-xs text-[#505F76] mt-1">{subtext}</p>
      </div>
    </div>
  );
}
