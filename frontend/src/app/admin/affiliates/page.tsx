'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users, CheckCircle, Clock, XCircle, Search, Filter, Shield } from 'lucide-react';
import type { Affiliate } from '../shared';
import { formatCurrency } from '../shared';
import { StatCard } from '@/components/StatCard';

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'performance' | 'name' | 'date'>('performance');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
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
    if (confirm('Are you sure you want to delete this affiliate?')) {
      try {
        await api.delete(`/admin/affiliates/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting affiliate', err);
      }
    }
  };

  const filteredAffiliates = affiliates.filter((aff: Affiliate) => {
    const matchesSearch = aff.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         aff.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || aff.status === filter;
    return matchesSearch && matchesFilter;
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
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#505F76]" />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>
        <button
          onClick={fetchData}
          className="sm:ml-4 px-4 py-2 text-sm font-semibold text-[#050C9C] bg-indigo-50 rounded-lg hover:bg-indigo-100"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-[#050C9C]" />}
          iconBgColor="#E0E7FF"
          label="TOTAL AFFILIATES"
          value={stats.total.toLocaleString()}
          change="+12%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          iconBgColor="#D1FAE5"
          label="ACTIVE NOW"
          value={stats.active.toString()}
          change="+8.4%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          iconBgColor="#FEF3C7"
          label="PENDING APPROVAL"
          value={stats.pending.toString()}
          change={stats.pending > 0 ? `${stats.pending} waiting` : "None"}
          isPositive={false}
          backgroundSvg={undefined}
          changeColor="#F59E0B"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5 text-red-600" />}
          iconBgColor="#FEE2E2"
          label="BLOCKED ACCOUNTS"
          value={stats.blocked.toString()}
          change={stats.blocked > 0 ? `${stats.blocked} blocked` : "None"}
          isPositive={false}
          backgroundSvg={undefined}
          changeColor="#EF4444"
        />
      </div>

      {/* Filters & Table */}
      <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200">
        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === 'active' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Active
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === 'pending' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('suspended')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === 'suspended' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Blocked
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-[#505F76] hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Filter className="w-5 h-5" />
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'performance' | 'name' | 'date')}
              className="px-3 py-2 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-xs sm:text-sm font-medium"
            >
              <option value="performance">Sort by: Performance</option>
              <option value="name">Sort by: Name</option>
              <option value="date">Sort by: Date</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#505F76] uppercase tracking-wider">AFFILIATE</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#505F76] uppercase tracking-wider">CONVERSIONS</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#505F76] uppercase tracking-wider">REVENUE</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#505F76] uppercase tracking-wider">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedAffiliates.map((aff: Affiliate) => (
                <tr key={aff.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{aff.user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#191C1E] text-sm">{aff.user.name}</p>
                        <p className="text-xs text-[#505F76]">{aff.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div>
                      <p className="font-bold text-[#191C1E]">{aff.sales_count || 0}</p>
                      <p className="text-xs text-green-600">+{aff.clicks_count || 0}%</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="font-bold text-[#191C1E]">${formatCurrency(aff.total_earnings)}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="space-y-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        aff.status === 'active' ? 'bg-green-100 text-green-800' :
                        aff.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {aff.status.toUpperCase()}
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateStatus(aff.id, 'active')}
                          className="px-2 py-1 text-[10px] font-semibold text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                        >
                          ACT
                        </button>
                        <button
                          onClick={() => updateStatus(aff.id, 'suspended')}
                          className="px-2 py-1 text-[10px] font-semibold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
                        >
                          SUS
                        </button>
                        <button
                          onClick={() => deleteAffiliate(aff.id)}
                          className="px-2 py-1 text-[10px] font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                        >
                          DEL
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-[#505F76]">Showing {paginatedAffiliates.length} of {filteredAffiliates.length} affiliates</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >Prev</button>
            <button
              onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              disabled={page >= pageCount}
              className="px-3 py-1 text-sm font-medium bg-indigo-600 text-white rounded-lg disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>

      {/* Top Performers & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Performers */}
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#191C1E]">Top Performers</h3>
            <button className="text-sm font-medium text-[#050C9C] hover:text-[#050C9C]">This Month</button>
          </div>
          
          <div className="space-y-4">
            {affiliates.slice(0, 3).map((aff: Affiliate, idx: number) => (
              <div key={aff.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                  idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-600'
                }`}>
                  {idx + 1}
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{aff.user.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#191C1E] text-sm">{aff.user.name}</p>
                  <p className="text-xs text-[#505F76]">{aff.user.email.split('@')[0]}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#191C1E]">${formatCurrency(aff.total_earnings)}</p>
                  <div className="w-20 h-1 bg-gray-100 rounded-full mt-1">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 py-2 text-sm font-medium text-[#050C9C] hover:bg-indigo-50 rounded-lg transition-colors">
            View All Rankings
          </button>
        </div>

        {/* Pending Approvals */}
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#191C1E]">Pending Approvals</h3>
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">{stats.pending}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {affiliates.filter(a => a.status === 'pending').slice(0, 2).map((aff) => (
              <div key={aff.id} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#050C9C]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#191C1E] text-sm">{aff.user.name}</p>
                    <p className="text-xs text-[#505F76]">Joined recently</p>
                  </div>
                </div>
                <button 
                  onClick={() => updateStatus(aff.id, 'active')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-[#050C9C] text-white rounded-lg font-semibold text-sm"
                >
                  APPROVE
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Network Health Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Review Network Health Performance</h3>
            <p className="text-gray-300">Our algorithm identifies low-quality traffic patterns automatically.</p>
          </div>
          <button className="px-6 py-3 bg-[#FFFFFFCC] backdrop-blur-md text-[#191C1E] rounded-xl font-bold hover:bg-gray-100 transition-colors">
            RUN AUDIT
          </button>
        </div>
      </div>
    </div>
  );
}
