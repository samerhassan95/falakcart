'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Users, DollarSign, BarChart3, ShieldCheck, 
  Download, Plus, Trash2, Edit3, 
  Search, Activity, TrendingUp, UserPlus, Shield,
  AlertTriangle, CheckCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';

interface Summary {
  total_affiliates: number;
  active_affiliates: number;
  total_sales: number;
  total_revenue: number;
  total_commissions: number;
  total_clicks: number;
}

interface Affiliate {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  referral_code: string;
  status: string;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  commission_strategy: 'flat' | 'tier_referrals' | 'tier_volume';
  commission_tiers: { threshold: number; rate: number }[] | null;
  total_earnings: number;
  clicks_count?: number;
  sales_count?: number;
}

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  affiliate?: Affiliate;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [clickStats, setClickStats] = useState<{ date: string; count: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'affiliates' | 'users' | 'analytics'>('affiliates');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(true);
  
  // Advanced Commission State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [editedRate, setEditedRate] = useState<number>(10);
  const [editedType, setEditedType] = useState<'percentage' | 'fixed'>('percentage');
  const [editedStrategy, setEditedStrategy] = useState<'flat' | 'tier_referrals' | 'tier_volume'>('flat');
  const [editedTiers, setEditedTiers] = useState<{ threshold: number; rate: number }[]>([]);

  // Add Admin Modal State
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const [summaryRes, affiliatesRes, usersRes, clicksRes] = await Promise.all([
        api.get('/admin/summary'),
        api.get('/admin/affiliates'),
        api.get('/admin/users'),
        api.get('/admin/clicks?days=30'),
      ]);
      setSummary(summaryRes.data);
      setAffiliates(affiliatesRes.data);
      setUsers(usersRes.data);
      setClickStats(clicksRes.data);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/affiliates/${id}/status`, { status });
      fetchData();
    } catch (err) {
       console.error('Error updating status', err);
    }
  };

  const openEditModal = (aff: Affiliate) => {
    setEditingAffiliate(aff);
    setEditedRate(aff.commission_rate);
    setEditedType(aff.commission_type || 'percentage');
    setEditedStrategy(aff.commission_strategy || 'flat');
    setEditedTiers(aff.commission_tiers || []);
    setIsEditModalOpen(true);
  };

  const saveAdvancedCommission = async () => {
    if (!editingAffiliate) return;
    try {
      await api.put(`/admin/affiliates/${editingAffiliate.id}/commission`, {
        commission_rate: editedRate,
        commission_type: editedType,
        commission_strategy: editedStrategy,
        commission_tiers: editedTiers
      });
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error updating commission', err);
      alert('Failed to update commission settings');
    }
  };
  const addTier = () => {
    setEditedTiers([...editedTiers, { threshold: 0, rate: 0 }]);
  };

  const updateTier = (index: number, field: 'threshold' | 'rate', value: number) => {
    const newTiers = [...editedTiers];
    newTiers[index][field] = value;
    setEditedTiers(newTiers);
  };

  const removeTier = (index: number) => {
    setEditedTiers(editedTiers.filter((_, i) => i !== index));
  };

  const deleteAffiliate = async (id: number) => {
    if (confirm('Are you sure you want to delete this affiliate? This will also delete their user account.')) {
      try {
        await api.delete(`/admin/affiliates/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting affiliate', err);
      }
    }
  };

  const promoteToAdmin = async (id: number) => {
    if (confirm('Promote this user to Admin status?')) {
      try {
        await api.put(`/admin/users/${id}/role`, { role: 'admin' });
        fetchData();
      } catch (err) {
        console.error('Error promoting user', err);
      }
    }
  };

  const exportCSV = async () => {
    try {
      const { data } = await api.get('/admin/export');
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affiliates-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      console.error('Export error', err);
    }
  };

  const createAdminUser = async () => {
    if (!newAdminName || !newAdminEmail || !newAdminPassword) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      await api.post('/admin/users', { 
        name: newAdminName, 
        email: newAdminEmail, 
        password: newAdminPassword, 
        role: 'admin' 
      });
      setIsAddAdminModalOpen(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating admin user. Check console.');
      console.error(err);
    }
  };
  if (loading || isSyncing) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F9FC]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading admin dashboard...</p>
      </div>
    </div>
  );
  
  if (!user || user.role !== 'admin') return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F9FC]">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">Admin privileges required to access this dashboard.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-indigo-600">FalakCart Admin</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-indigo-600">LIVE</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Manage affiliates, users, and monitor system performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
            <button 
              onClick={() => setIsAddAdminModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Admin
            </button>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            icon={<Users className="w-5 h-5 text-indigo-600" />}
            label="Total Affiliates"
            value={(summary?.total_affiliates ?? 0).toLocaleString()}
            subValue={`${summary?.active_affiliates} Active`}
            color="indigo"
          />
          <StatCard
            icon={<Activity className="w-5 h-5 text-amber-600" />}
            label="Total Clicks"
            value={(summary?.total_clicks ?? 0).toLocaleString()}
            subValue="Network Wide"
            color="amber"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            label="Total Revenue"
            value={`$${Number(summary?.total_revenue ?? 0).toFixed(2)}`}
            subValue={`${summary?.total_sales} Sales`}
            color="emerald"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-purple-600" />}
            label="Commissions Paid"
            value={`$${Number(summary?.total_commissions ?? 0).toFixed(2)}`}
            subValue="Total Payouts"
            color="purple"
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-8">
                <TabButton 
                  active={activeTab === 'affiliates'} 
                  onClick={() => setActiveTab('affiliates')} 
                  label="Affiliates" 
                  icon={<Users className="w-4 h-4" />} 
                />
                <TabButton 
                  active={activeTab === 'users'} 
                  onClick={() => setActiveTab('users')} 
                  label="Users" 
                  icon={<Shield className="w-4 h-4" />} 
                />
                <TabButton 
                  active={activeTab === 'analytics'} 
                  onClick={() => setActiveTab('analytics')} 
                  label="Analytics" 
                  icon={<BarChart3 className="w-4 h-4" />} 
                />
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'affiliates' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Affiliate Management</h3>
                    <p className="text-sm text-gray-500">Manage affiliate accounts, commissions, and status.</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Affiliate</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Referral Code</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Commission</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Performance</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {affiliates.filter(a => 
                        a.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        a.user.email.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((aff) => (
                        <tr key={aff.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {aff.user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{aff.user.name}</div>
                                <div className="text-sm text-gray-500">{aff.user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg font-mono text-sm text-gray-700">
                              {aff.referral_code}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => openEditModal(aff)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
                            >
                              {aff.commission_strategy === 'flat' ? (
                                <>{aff.commission_rate}{aff.commission_type === 'fixed' ? '$' : '%'}</>
                              ) : (
                                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Tiered</span>
                              )}
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Clicks</p>
                                <p className="font-semibold text-gray-900">{aff.clicks_count ?? 0}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Sales</p>
                                <p className="font-semibold text-emerald-600">{aff.sales_count ?? 0}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              aff.status === 'active' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : aff.status === 'suspended' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {aff.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {aff.status === 'active' ? (
                                <button 
                                  onClick={() => updateStatus(aff.id, 'suspended')} 
                                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" 
                                  title="Suspend"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => updateStatus(aff.id, 'active')} 
                                  className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors" 
                                  title="Activate"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => deleteAffiliate(aff.id)} 
                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" 
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">User Management</h3>
                    <p className="text-sm text-gray-500">Manage all system users and their roles.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.filter(u => 
                    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    u.email.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((usr) => (
                    <div key={usr.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-200 hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold ${
                          usr.role === 'admin' 
                            ? 'bg-gradient-to-br from-red-500 to-pink-500' 
                            : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                        }`}>
                          {usr.name.charAt(0)}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {usr.role !== 'admin' && (
                            <button 
                              onClick={() => promoteToAdmin(usr.id)} 
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" 
                              title="Promote to Admin"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => alert('Delete user functionality available in backend')} 
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" 
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 mb-4">
                        <h4 className="font-semibold text-gray-900">{usr.name}</h4>
                        <p className="text-sm text-gray-500">{usr.email}</p>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          usr.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {usr.role}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(usr.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Click Analytics</h3>
                      <p className="text-sm text-gray-500">Network-wide click tracking over the last 30 days</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-indigo-600 rounded-full" />
                      <span className="text-sm font-medium text-gray-600">Daily Clicks</span>
                    </div>
                  </div>
                  
                  <div className="h-[400px]">
                    {clickStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={clickStats}>
                          <defs>
                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '12px', 
                              fontSize: '12px', 
                              fontWeight: 600 
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#4F46E5" 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#colorClicks)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Activity className="w-16 h-16 mb-4" />
                        <p className="text-sm font-medium">No analytics data available yet</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Performance Metrics</h4>
                    <div className="space-y-4">
                      <MetricRow label="Conversion Rate" value="4.2%" color="text-emerald-600" />
                      <MetricRow label="Avg. Commission" value="$24.50" color="text-indigo-600" />
                      <MetricRow label="Active Rate" value="68%" color="text-blue-600" />
                      <MetricRow label="Error Rate" value="0.02%" color="text-gray-600" />
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-4">System Overview</h4>
                    <p className="text-gray-600 leading-relaxed">
                      The affiliate network is performing well with a <span className="font-semibold text-emerald-600">+18% increase</span> in 
                      traffic compared to last month. Most successful referrals are coming from social media channels and 
                      organic discovery. Consider expanding promotional campaigns during peak hours.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Commission Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Commission Settings</h2>
                  <p className="text-sm text-gray-500">Affiliate: {editingAffiliate?.user.name}</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Type & Strategy */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Commission Type</label>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => setEditedType('percentage')} 
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                          editedType === 'percentage' 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Percentage (%)
                      </button>
                      <button 
                        onClick={() => setEditedType('fixed')} 
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                          editedType === 'fixed' 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Fixed ($)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Strategy</label>
                    <select 
                      value={editedStrategy} 
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditedStrategy(e.target.value as 'flat' | 'tier_referrals' | 'tier_volume')}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    >
                      <option value="flat">Flat Rate</option>
                      <option value="tier_referrals">Referral Tiers</option>
                      <option value="tier_volume">Volume Tiers</option>
                    </select>
                  </div>
                </div>

                {/* Base Rate */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {editedStrategy === 'flat' ? 'Commission Rate' : 'Base Rate'}
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={editedRate}
                      onChange={(e) => setEditedRate(parseFloat(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                      {editedType === 'fixed' ? '$' : '%'}
                    </span>
                  </div>
                </div>

                {/* Tiers Logic */}
                {editedStrategy !== 'flat' && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Commission Tiers</h3>
                        <p className="text-sm text-gray-500">
                          Scale rates based on {editedStrategy === 'tier_volume' ? 'sales volume' : 'referral count'}
                        </p>
                      </div>
                      <button 
                        onClick={addTier} 
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Tier
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editedTiers.map((tier, idx) => (
                        <div key={idx} className="flex gap-3 items-center bg-gray-50 p-4 rounded-lg">
                          <div className="flex-1 space-y-1">
                            <p className="text-xs text-gray-500 font-medium">
                              Threshold ({editedStrategy === 'tier_volume' ? '$' : 'Count'})
                            </p>
                            <input 
                              type="number" 
                              value={tier.threshold}
                              onChange={(e) => updateTier(idx, 'threshold', parseFloat(e.target.value))}
                              className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-300"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-xs text-gray-500 font-medium">
                              Rate ({editedType === 'fixed' ? '$' : '%'})
                            </p>
                            <input 
                              type="number" 
                              value={tier.rate}
                              onChange={(e) => updateTier(idx, 'rate', parseFloat(e.target.value))}
                              className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-300"
                            />
                          </div>
                          <button 
                            onClick={() => removeTier(idx)} 
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {editedTiers.length === 0 && (
                        <p className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                          No tiers defined. Add one above to get started.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveAdvancedCommission} 
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Admin Modal */}
        {isAddAdminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Admin</h2>
                  <p className="text-sm text-gray-500">Create a new administrator account</p>
                </div>
                <button 
                  onClick={() => {
                    setIsAddAdminModalOpen(false);
                    setNewAdminName('');
                    setNewAdminEmail('');
                    setNewAdminPassword('');
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Full Name</label>
                  <input 
                    type="text" 
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="Enter admin name"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Email Address</label>
                  <input 
                    type="email" 
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Password</label>
                  <input 
                    type="password" 
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setIsAddAdminModalOpen(false);
                    setNewAdminName('');
                    setNewAdminEmail('');
                    setNewAdminPassword('');
                  }} 
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={createAdminUser} 
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Create Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function StatCard({ icon, label, value, subValue, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color: string;
}) {
  const colorClasses = {
    indigo: 'bg-indigo-50 border-indigo-100',
    amber: 'bg-amber-50 border-amber-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    purple: 'bg-purple-50 border-purple-100'
  };

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${colorClasses[color as keyof typeof colorClasses] || 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subValue}</p>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  icon: React.ReactNode; 
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all relative ${
        active 
          ? 'text-indigo-600 border-b-2 border-indigo-600' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MetricRow({ label, value, color }: { 
  label: string; 
  value: string; 
  color: string; 
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}