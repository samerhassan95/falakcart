'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Affiliate } from '../shared';
import { formatCurrency } from '../shared';
import { StatCard } from '@/components/StatCard';
import { useTranslation } from '@/hooks/useTranslation';
import { Users, Plus } from 'lucide-react';

interface AffiliateFormData {
  name: string;
  email: string;
  website: string;
  commission_rate: number;
}

export default function AdminAffiliatesPage() {
  const { t, locale } = useTranslation();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'performance' | 'name' | 'date'>('performance');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreateAffiliate, setShowCreateAffiliate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [affiliateForm, setAffiliateForm] = useState<AffiliateFormData>({
    name: '',
    email: '',
    website: '',
    commission_rate: 10
  });
  const pageSize = 4;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/affiliates');
      setAffiliates(data);
    } catch (err) {
      console.error('Error fetching affiliates', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/affiliates/${id}/status`, { status });
      fetchData();
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  const deleteAffiliate = async (id: number) => {
    if (confirm(t('common.delete') + '?')) {
      try {
        await api.delete(`/admin/affiliates/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting affiliate', err);
      }
    }
  };

  const createAffiliate = async () => {
    if (!affiliateForm.name.trim() || !affiliateForm.email.trim()) return;
    
    setIsCreating(true);
    try {
      await api.post('/admin/affiliates', {
        name: affiliateForm.name,
        email: affiliateForm.email,
        password: 'defaultpass123', // You might want to generate a random password
        commission_rate: affiliateForm.commission_rate,
        website: affiliateForm.website
      });
      
      setAffiliateForm({ name: '', email: '', website: '', commission_rate: 10 });
      setShowCreateAffiliate(false);
      fetchData(); // Refresh the list
      alert(t('admin.affiliateCreated'));
    } catch (err) {
      console.error('Error creating affiliate', err);
      alert('Error creating affiliate');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredAffiliates = affiliates.filter((aff: Affiliate) => {
    const matchesFilter = filter === 'all' || aff.status === filter;
    return matchesFilter;
  });

  const sortedAffiliates = [...filteredAffiliates].sort((a, b) => {
    if (sortBy === 'name') {
      return a.user.name.localeCompare(b.user.name);
    }
    if (sortBy === 'date') {
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    }
    return (b.total_earnings || 0) - (a.total_earnings || 0);
  });

  const paginatedAffiliates = sortedAffiliates.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(sortedAffiliates.length / pageSize));

  const stats = {
    total: affiliates.length,
    active: affiliates.filter((a: Affiliate) => a.status === 'active').length,
    pending: affiliates.filter((a: Affiliate) => a.status === 'pending').length,
    blocked: affiliates.filter((a: Affiliate) => a.status === 'suspended').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#050C9C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header with Create Affiliate Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-[44px] text-[#191C1E] tracking-tight">{t('admin.affiliates')}</h1>
          <p className="text-[#505F76] mt-1 text-sm sm:text-[16px]">{t('admin.manageAffiliates')}</p>
        </div>
        <button
          onClick={() => setShowCreateAffiliate(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
          style={{ background: 'linear-gradient(135deg, #2A14B4 0%, #4338CA 100%)' }}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">{t('admin.createNewAffiliate')}</span>
          <span className="sm:hidden">{t('admin.createShort')}</span>
        </button>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
               icon={<svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM18 16V13C18 12.2667 17.7958 11.5625 17.3875 10.8875C16.9792 10.2125 16.4 9.63333 15.65 9.15C16.5 9.25 17.3 9.42083 18.05 9.6625C18.8 9.90417 19.5 10.2 20.15 10.55C20.75 10.8833 21.2083 11.2542 21.525 11.6625C21.8417 12.0708 22 12.5167 22 13V16H18ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM18 4C18 5.1 17.6083 6.04167 16.825 6.825C16.0417 7.60833 15.1 8 14 8C13.8167 8 13.5833 7.97917 13.3 7.9375C13.0167 7.89583 12.7833 7.85 12.6 7.8C13.05 7.26667 13.3958 6.675 13.6375 6.025C13.8792 5.375 14 4.7 14 4C14 3.3 13.8792 2.625 13.6375 1.975C13.3958 1.325 13.05 0.733333 12.6 0.2C12.8333 0.116667 13.0667 0.0625 13.3 0.0375C13.5333 0.0125 13.7667 0 14 0C15.1 0 16.0417 0.391667 16.825 1.175C17.6083 1.95833 18 2.9 18 4ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="#050C9C"/>
</svg>
}
          iconBgColor="#E3DFFF"
          label={t('admin.totalAffiliatesLabel')}
          value={stats.total.toLocaleString()}
          change={stats.total > 0 ? `${stats.total} ${t('common.active')}` : ''}
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
                icon={<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="36" height="36" rx="16" fill="#D0E1FB"/>
<path d="M16.6 22.6L23.65 15.55L22.25 14.15L16.6 19.8L13.75 16.95L12.35 18.35L16.6 22.6ZM18 28C16.6167 28 15.3167 27.7375 14.1 27.2125C12.8833 26.6875 11.825 25.975 10.925 25.075C10.025 24.175 9.3125 23.1167 8.7875 21.9C8.2625 20.6833 8 19.3833 8 18C8 16.6167 8.2625 15.3167 8.7875 14.1C9.3125 12.8833 10.025 11.825 10.925 10.925C11.825 10.025 12.8833 9.3125 14.1 8.7875C15.3167 8.2625 16.6167 8 18 8C19.3833 8 20.6833 8.2625 21.9 8.7875C23.1167 9.3125 24.175 10.025 25.075 10.925C25.975 11.825 26.6875 12.8833 27.2125 14.1C27.7375 15.3167 28 16.6167 28 18C28 19.3833 27.7375 20.6833 27.2125 21.9C26.6875 23.1167 25.975 24.175 25.075 25.075C24.175 25.975 23.1167 26.6875 21.9 27.2125C20.6833 27.7375 19.3833 28 18 28ZM18 26C20.2333 26 22.125 25.225 23.675 23.675C25.225 22.125 26 20.2333 26 18C26 15.7667 25.225 13.875 23.675 12.325C22.125 10.775 20.2333 10 18 10C15.7667 10 13.875 10.775 12.325 12.325C10.775 13.875 10 15.7667 10 18C10 20.2333 10.775 22.125 12.325 23.675C13.875 25.225 15.7667 26 18 26Z" fill="#050C9C"/>
</svg>
}
          iconBgColor="#D0E1FB"
          label={t('admin.activeNow')}
          value={stats.active.toString()}
          change="+8.4%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
                 icon={<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="36" height="36" rx="16" fill="#FFDBCD"/>
<path d="M13 19.5C13.4167 19.5 13.7708 19.3542 14.0625 19.0625C14.3542 18.7708 14.5 18.4167 14.5 18C14.5 17.5833 14.3542 17.2292 14.0625 16.9375C13.7708 16.6458 13.4167 16.5 13 16.5C12.5833 16.5 12.2292 16.6458 11.9375 16.9375C11.6458 17.2292 11.5 17.5833 11.5 18C11.5 18.4167 11.6458 18.7708 11.9375 19.0625C12.2292 19.3542 12.5833 19.5 13 19.5ZM18 19.5C18.4167 19.5 18.7708 19.3542 19.0625 19.0625C19.3542 18.7708 19.5 18.4167 19.5 18C19.5 17.5833 19.3542 17.2292 19.0625 16.9375C18.7708 16.6458 18.4167 16.5 18 16.5C17.5833 16.5 17.2292 16.6458 16.9375 16.9375C16.6458 17.2292 16.5 17.5833 16.5 18C16.5 18.4167 16.6458 18.7708 16.9375 19.0625C17.2292 19.3542 17.5833 19.5 18 19.5ZM23 19.5C23.4167 19.5 23.7708 19.3542 24.0625 19.0625C24.3542 18.7708 24.5 18.4167 24.5 18C24.5 17.5833 24.3542 17.2292 24.0625 16.9375C23.7708 16.6458 23.4167 16.5 23 16.5C22.5833 16.5 22.2292 16.6458 21.9375 16.9375C21.6458 17.2292 21.5 17.5833 21.5 18C21.5 18.4167 21.6458 18.7708 21.9375 19.0625C22.2292 19.3542 22.5833 19.5 23 19.5ZM18 28C16.6167 28 15.3167 27.7375 14.1 27.2125C12.8833 26.6875 11.825 25.975 10.925 25.075C10.025 24.175 9.3125 23.1167 8.7875 21.9C8.2625 20.6833 8 19.3833 8 18C8 16.6167 8.2625 15.3167 8.7875 14.1C9.3125 12.8833 10.025 11.825 10.925 10.925C11.825 10.025 12.8833 9.3125 14.1 8.7875C15.3167 8.2625 16.6167 8 18 8C19.3833 8 20.6833 8.2625 21.9 8.7875C23.1167 9.3125 24.175 10.025 25.075 10.925C25.975 11.825 26.6875 12.8833 27.2125 14.1C27.7375 15.3167 28 16.6167 28 18C28 19.3833 27.7375 20.6833 27.2125 21.9C26.6875 23.1167 25.975 24.175 25.075 25.075C24.175 25.975 23.1167 26.6875 21.9 27.2125C20.6833 27.7375 19.3833 28 18 28ZM18 26C20.2333 26 22.125 25.225 23.675 23.675C25.225 22.125 26 20.2333 26 18C26 15.7667 25.225 13.875 23.675 12.325C22.125 10.775 20.2333 10 18 10C15.7667 10 13.875 10.775 12.325 12.325C10.775 13.875 10 15.7667 10 18C10 20.2333 10.775 22.125 12.325 23.675C13.875 25.225 15.7667 26 18 26Z" fill="#7D2D00"/>
</svg>
}
          iconBgColor="#FFDBCD"
          label={t('admin.pendingApprovalLabel')}
          value={stats.pending.toString()}
          change={stats.pending > 0 ? `${stats.pending} ${t('admin.waiting')}` : t('admin.none')}
          isPositive={false}
          backgroundSvg={undefined}
          changeColor="#F59E0B"
        />
        <StatCard
           icon={<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="36" height="36" rx="16" fill="#FFDAD6"/>
<path d="M18 28C16.6167 28 15.3167 27.7375 14.1 27.2125C12.8833 26.6875 11.825 25.975 10.925 25.075C10.025 24.175 9.3125 23.1167 8.7875 21.9C8.2625 20.6833 8 19.3833 8 18C8 16.6167 8.2625 15.3167 8.7875 14.1C9.3125 12.8833 10.025 11.825 10.925 10.925C11.825 10.025 12.8833 9.3125 14.1 8.7875C15.3167 8.2625 16.6167 8 18 8C19.3833 8 20.6833 8.2625 21.9 8.7875C23.1167 9.3125 24.175 10.025 25.075 10.925C25.975 11.825 26.6875 12.8833 27.2125 14.1C27.7375 15.3167 28 16.6167 28 18C28 19.3833 27.7375 20.6833 27.2125 21.9C26.6875 23.1167 25.975 24.175 25.075 25.075C24.175 25.975 23.1167 26.6875 21.9 27.2125C20.6833 27.7375 19.3833 28 18 28ZM18 26C18.9 26 19.7667 25.8542 20.6 25.5625C21.4333 25.2708 22.2 24.85 22.9 24.3L11.7 13.1C11.15 13.8 10.7292 14.5667 10.4375 15.4C10.1458 16.2333 10 17.1 10 18C10 20.2333 10.775 22.125 12.325 23.675C13.875 25.225 15.7667 26 18 26ZM24.3 22.9C24.85 22.2 25.2708 21.4333 25.5625 20.6C25.8542 19.7667 26 18.9 26 18C26 15.7667 25.225 13.875 23.675 12.325C22.125 10.775 20.2333 10 18 10C17.1 10 16.2333 10.1458 15.4 10.4375C14.5667 10.7292 13.8 11.15 13.1 11.7L24.3 22.9Z" fill="#BA1A1A"/>
</svg>
}
          iconBgColor="#FFDAD6"
          label={t('admin.blockedAccounts')}
          value={stats.blocked.toString()}
          change={stats.blocked > 0 ? `${stats.blocked} ${t('admin.blocked')}` : t('admin.none')}
          isPositive={false}
          backgroundSvg={undefined}
          changeColor="#EF4444"
        />
      </div>

      {/* Main Layout: Table (2/3) + Sidebar (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Table (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Filters & Table */}
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === 'all' ? 'bg-[#050C9C] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('admin.all')}
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === 'active' ? 'bg-[#050C9C] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('common.active')}
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === 'pending' ? 'bg-[#050C9C] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('common.pending')}
            </button>
            <button 
              onClick={() => setFilter('suspended')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === 'suspended' ? 'bg-[#050C9C] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('common.blocked')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'performance' | 'name' | 'date')}
              className="px-3 py-2 bg-[#F2F4F6] border-0 rounded-lg text-xs sm:text-sm font-medium"
            >
              <option value="performance">{t('admin.sortByPerformance')}</option>
              <option value="name">{t('admin.sortByName')}</option>
              <option value="date">{t('admin.sortByDate')}</option>
            </select>
            <button className="p-2 text-[#505F76] hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg width="34" height="28" viewBox="0 0 34 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 20V18H19V20H15ZM11 15V13H23V15H11ZM8 10V8H26V10H8Z" fill="#505F76"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden divide-y divide-gray-50">
          {paginatedAffiliates.map((aff: Affiliate) => (
            <div key={aff.id} className="p-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{aff.user.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#191C1E] truncate">{aff.user.name}</p>
                    <p className="text-xs text-[#505F76] truncate">{aff.user.email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  aff.status === 'active' ? 'bg-green-100 text-green-800' :
                  aff.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {aff.status === 'active' ? t('common.active').toUpperCase() :
                   aff.status === 'pending' ? t('common.pending').toUpperCase() :
                   t('common.suspended').toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-[#505F76]">{t('admin.conversions')}</p>
                  <p className="font-semibold text-[#191C1E]">{aff.sales_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-[#505F76]">{t('admin.revenue')}</p>
                  <p className="font-bold text-emerald-600">${formatCurrency(aff.total_earnings)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1">
                <button
                  onClick={() => updateStatus(aff.id, 'active')}
                  className="px-2 py-1 text-[10px] font-semibold text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                  title={t('common.activate')}
                >
                  {locale === 'ar' ? 'تفعيل' : 'ACT'}
                </button>
                <button
                  onClick={() => updateStatus(aff.id, 'suspended')}
                  className="px-2 py-1 text-[10px] font-semibold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
                  title={t('common.suspended')}
                >
                  {locale === 'ar' ? 'تعليق' : 'SUS'}
                </button>
                <button
                  onClick={() => deleteAffiliate(aff.id)}
                  className="px-2 py-1 text-[10px] font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                  title={t('common.delete')}
                >
                  {locale === 'ar' ? 'حذف' : 'DEL'}
                </button>
              </div>
            </div>
          ))}
          {paginatedAffiliates.length === 0 && (
            <div className="px-6 py-12 text-center text-[#505F76] text-sm">{t('admin.noAffiliatesFound')}</div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-[#050C9C] [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-[#505F76] border-b border-gray-50">
                <th className="px-6 py-4">{t('common.name')}</th>
                <th className="px-6 py-4 text-center">{t('admin.conversions')}</th>
                <th className="px-6 py-4 text-center">{t('admin.revenue')}</th>
                <th className="px-6 py-4 text-center">{t('common.status')}</th>
                <th className="px-6 py-4 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedAffiliates.map((aff: Affiliate) => (
                <tr key={aff.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{aff.user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#191C1E] text-sm">{aff.user.name}</p>
                        <p className="text-xs text-[#505F76]">{aff.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div>
                      <p className="font-bold text-[#191C1E]">{aff.sales_count || 0}</p>
                      <p className="text-xs text-blue-600">{aff.clicks_count || 0} {t('links.clicks')}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="font-bold text-[#191C1E]">${formatCurrency(aff.total_earnings)}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      aff.status === 'active' ? 'bg-green-100 text-green-800' :
                      aff.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {aff.status === 'active' ? t('common.active').toUpperCase() :
                       aff.status === 'pending' ? t('common.pending').toUpperCase() :
                       t('common.suspended').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => updateStatus(aff.id, 'active')}
                        className="px-2 py-1 text-[10px] font-semibold text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                        title={t('common.activate')}
                      >
                        {locale === 'ar' ? 'تفعيل' : 'ACT'}
                      </button>
                      <button
                        onClick={() => updateStatus(aff.id, 'suspended')}
                        className="px-2 py-1 text-[10px] font-semibold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
                        title={t('common.suspended')}
                      >
                        {locale === 'ar' ? 'تعليق' : 'SUS'}
                      </button>
                      <button
                        onClick={() => deleteAffiliate(aff.id)}
                        className="px-2 py-1 text-[10px] font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                        title={t('common.delete')}
                      >
                        {locale === 'ar' ? 'حذف' : 'DEL'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
              <p className="text-sm text-[#505F76]">{t('admin.showingAffiliates', { count: paginatedAffiliates.length, total: filteredAffiliates.length })}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm font-medium text-[#505F76] hover:text-[#191C1E] disabled:opacity-50 disabled:cursor-not-allowed"
                >{t('admin.prev')}</button>
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                        page === pageNum
                          ? 'bg-[#050C9C] text-white'
                          : 'text-[#505F76] hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                  disabled={page >= pageCount}
                  className="px-3 py-1.5 text-sm font-medium text-[#505F76] hover:text-[#191C1E] disabled:opacity-50 disabled:cursor-not-allowed"
                >{t('admin.next')}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar (1/3 width) */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Top Performers */}
          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b-1 border-[#F8FAFC] ">
              <h3 className="text-[16px] font-bold text-[#191C1E]">{t('admin.topPerformers')}</h3>
              <button className="px-4 py-2 bg-[#3ABEF91A] text-[#050C9C] text-[10px] font-semibold rounded-ull transition-colors">
                {t('admin.thisMonth')}
              </button>
            </div>
            
            <div className="space-y-6 pt-4">
              {[...affiliates].sort((a,b)=>(b.total_earnings || 0) - (a.total_earnings || 0)).slice(0, 3).map((aff: Affiliate, idx: number) => {
                const maxEarnings = Math.max(...affiliates.map(a => a.total_earnings || 0));
                const progressWidth = maxEarnings > 0 ? ((aff.total_earnings || 0) / maxEarnings) * 100 : 0;
                
                return (
                  <div key={aff.id} className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-[14px]">{aff.user.name.charAt(0)}</span>
                      </div>
                      <div className={`absolute -top-2 -start-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[12px] ${
                        idx === 0 ? 'bg-[#F59E0B]' : idx === 1 ? 'bg-[#505F76]' : 'bg-[#FBBF24]'
                      }`}>
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#505F76] text-[14px] truncate">{aff.user.name}</p>
                      <p className="text-[12px] text-[#505F76] truncate">{aff.user.email.split('@')[0]} {t('admin.media')}</p>
                      <div className="mt-2 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#050C9C] rounded-full transition-all duration-500" 
                          style={{ width: `${progressWidth}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-[#191C1E] text-[14px]">${formatCurrency(aff.total_earnings)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button className="w-full mt-6 py-3 text-[14px] font-semibold text-[#050C9C] hover:bg-[#F8FAFC] rounded-xl transition-colors">
              {t('admin.viewAllRankings')}
            </button>
          </div>

          {/* Pending Approvals */}
          <div className="bg-[#3ABEF91A] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-bold text-[#050C9C]">{t('admin.pendingApprovals')}</h3>
              <span className="px-3 py-1 bg-[#050C9C] text-white text-sm font-bold rounded-full">
                {stats.pending}
              </span>
            </div>
            
            <div className="space-y-4">
              {affiliates.filter(a => a.status === 'pending').slice(0, 2).map((aff) => (
                <div key={aff.id} className="bg-[#050C9C] backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-[#191C1E] text-[12px]">{aff.user.name}</p>
                      <p className="text-[10x] text-[#505F76]">{t('admin.joinedAgo')}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20ZM11 17V11H13V17H11ZM11 9V7H13V9H11Z" fill="#050C9C"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateStatus(aff.id, 'active')}
                      className="flex-1 py-3 bg-[#050C9C] hover:bg-[#040a7a] text-white rounded-xl font-bold text-sm uppercase transition-colors"
                    >
                      {t('admin.approve')}
                    </button>
                    <button 
                      onClick={() => deleteAffiliate(aff.id)}
                      className="p-3 text-[#94A3B8] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 18C4.45 18 3.97917 17.8042 3.5875 17.4125C3.19583 17.0208 3 16.55 3 16V4H2V2H7V1H13V2H18V4H17V16C17 16.55 16.8042 17.0208 16.4125 17.4125C16.0208 17.8042 15.55 18 15 18H5ZM15 4H5V16H15V4ZM7 14H9V6H7V14ZM11 14H13V6H11V14Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {affiliates.filter(a => a.status === 'pending').length === 0 && (
                <div className="text-center py-8 text-[#505F76]">
                  <p className="text-sm">{t('admin.noPendingApprovals')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Network Health Card */}
          <div className="bg-gradient-to-br from-[#0A1628] via-[#0F1E3A] to-[#1A2847] rounded-2xl p-6 text-white relative overflow-hidden">
            {/* Background image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/ReviewNet.png)' }}
            ></div>
            
            {/* Background gradient overlay */}
            <div 
              className="absolute inset-0 opacity-80" 
              style={{ background: 'linear-gradient(0deg, #312E81 0%, rgba(49, 46, 129, 0) 100%)' }}
            ></div>
            
            <div className="relative pt-12 z-10">
              <h3 className="text-[18px] font-bold text-white mb-2">{t('admin.reviewNetworkHealth')}</h3>
              <p className="text-[#E0E7FF] text-[12px] mb-4">{t('admin.algorithmDescription')}</p>
              <button className="px-6 py-2.5 bg-white text-[#050C9C] rounded-full font-bold text-sm uppercase hover:bg-gray-100 transition-colors">
                {t('admin.runAudit')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Affiliate Modal */}
      {showCreateAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#191C1E]">{t('admin.addNewAffiliate')}</h2>
              <button 
                onClick={() => setShowCreateAffiliate(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm text-[#505F76] mb-6">{t('admin.inviteNewPartner')}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#505F76] mb-2 uppercase tracking-wider">
                  {t('admin.fullName')}
                </label>
                <input
                  type="text"
                  placeholder={t('admin.fullNamePlaceholder')}
                  value={affiliateForm.name}
                  onChange={(e) => setAffiliateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[#505F76] mb-2 uppercase tracking-wider">
                  {t('admin.emailAddress')}
                </label>
                <input
                  type="email"
                  placeholder={t('admin.emailPlaceholder')}
                  value={affiliateForm.email}
                  onChange={(e) => setAffiliateForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[#505F76] mb-2 uppercase tracking-wider">
                  {t('admin.websiteOrChannel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    placeholder={t('admin.websitePlaceholder')}
                    value={affiliateForm.website}
                    onChange={(e) => setAffiliateForm(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#505F76] mb-2 uppercase tracking-wider">
                    {t('admin.startingCommissionRate')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={affiliateForm.commission_rate}
                      onChange={(e) => setAffiliateForm(prev => ({ ...prev, commission_rate: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-[#505F76] mb-2 uppercase tracking-wider">
                    {t('admin.assignToCampaign')}
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300">
                    <option>{t('admin.summerLaunch2024')}</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button 
                onClick={() => setShowCreateAffiliate(false)} 
                className="px-5 py-2.5 text-[#505F76] hover:text-gray-700 text-sm font-medium"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={createAffiliate}
                disabled={isCreating || !affiliateForm.name.trim() || !affiliateForm.email.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-[#050C9C] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('admin.creating')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {t('admin.sendInvitation')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

