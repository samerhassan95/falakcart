'use client';

import { useAuth } from '@/context/AuthContext';
import { useCallback, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import api from '@/lib/api';
import { 
  Users, DollarSign, BarChart3, Settings as SettingsIcon,
  Bell, Search, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Clock, XCircle, ChevronRight, Download,
  Filter, Calendar, MapPin, Monitor,
  Shield, UserPlus, Edit3, Plus
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Types
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

interface AnalyticsClick {
  date: string;
  count: number;
}

interface DeviceMetric {
  name: string;
  count: number;
}

interface GeoMetric {
  region: string;
  count: number;
}

interface TrafficSource {
  source: string;
  count: number;
}

interface CommissionTrendPoint {
  period: string;
  value: number;
}

interface NotificationItem {
  type: 'conversion' | 'registration';
  title: string;
  message: string;
  time: string;
  icon: 'trending' | 'user';
}

interface PlatformStats {
  systemStatus: string;
  apiHealth: string;
  activeUsers: number;
  totalRevenue: number;
}

interface CommissionsSummary {
  total_commissions: number;
  pending: number;
  approved: number;
  paid: number;
}

interface PayoutsSummary {
  available_balance: number;
  total_paid: number;
  pending_payouts: number;
  failed_payouts: number;
}

type ViewKey = 'overview' | 'analytics' | 'affiliates' | 'commissions' | 'payouts' | 'settings';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface OverviewViewProps {
  summary: Summary | null;
  affiliates: Affiliate[];
  clickStats: AnalyticsClick[];
  setActiveView: Dispatch<SetStateAction<ViewKey>>;
  updateStatus: (id: number, status: string) => void;
}

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend?: 'up' | 'down';
}

interface InsightItemProps {
  icon: ReactNode;
  text: string;
  subtext: string;
}

interface ActivityItemProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  detail: string;
  time: string;
  iconBg: string;
}

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
}

interface AnalyticsViewProps {
  summary: Summary | null;
  clickStats: AnalyticsClick[];
  affiliates: Affiliate[];
  exportCSV: () => void;
}

interface AffiliateRowProps {
  name: string;
  clicks: string;
  conversions: string;
  revenue: string;
  cvr: string;
}

interface AffiliatesViewProps {
  affiliates: Affiliate[];
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  fetchData: () => void;
  updateStatus: (id: number, status: string) => void;
  deleteAffiliate: (id: number) => void;
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

interface AllCommissionRowProps {
  date: string;
  affiliate: string;
  referralId: string;
  revenue: string;
  commission: string;
  status: string;
  payment: string;
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

interface PayoutHistoryRowProps {
  txId: string;
  date: string;
  affiliate: string;
  amount: string;
  method: string;
  status: string;
}

interface Sale {
  id: number;
  affiliate?: Affiliate;
  amount: number | string;
  commission_amount: number | string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface PayoutAffiliate extends Affiliate {
  pending_balance?: number;
  current_balance?: number;
  bank_name?: string;
  updated_at?: string;
}

const formatCurrency = (value?: number | string | null) => {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  const amount = typeof numeric === 'number' && !Number.isNaN(numeric) ? numeric : 0;
  return amount.toFixed(2);
};

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'affiliates' | 'commissions' | 'payouts' | 'settings'>('overview');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [clickStats, setClickStats] = useState<{ date: string; count: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [linkCreateError, setLinkCreateError] = useState<string | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const openGenerateLinkModal = () => {
    setNewLinkName(`Admin Link ${new Date().toISOString().slice(0, 10)}`);
    setLinkCreateError(null);
    setShowLinkModal(true);
  };

  const createLink = async () => {
    if (!newLinkName.trim()) {
      setLinkCreateError('Please enter a link name.');
      return;
    }

    setIsCreatingLink(true);
    try {
      const { data } = await api.post('/affiliate/links', { name: newLinkName.trim() });
      const url = data.referral_url || `${window.location.origin}/register?ref=${data.slug}`;
      setGeneratedLink(url);
      await navigator.clipboard.writeText(url).catch(() => {});
      setShowLinkModal(false);
      setToastType('success');
      setToastMessage('Affiliate link created and copied to clipboard.');
    } catch (err) {
      console.error('Error creating link', err);
      setLinkCreateError('Unable to create link. Please try again.');
      setToastType('error');
      setToastMessage('Failed to create affiliate link.');
    } finally {
      setIsCreatingLink(false);
    }
  };

  const closeGenerateLinkModal = () => {
    setShowLinkModal(false);
    setLinkCreateError(null);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [summaryRes, affiliatesRes, clicksRes] = await Promise.all([
        api.get('/admin/summary'),
        api.get('/admin/affiliates'),
        api.get('/admin/clicks?days=30'),
      ]);
      setSummary(summaryRes.data);
      setAffiliates(affiliatesRes.data);
      setClickStats(clicksRes.data);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const [salesRes, newAffiliatesRes] = await Promise.all([
        api.get('/admin/sales'),
        api.get('/admin/affiliates')
      ]);
      const recentSales = (salesRes.data as Sale[]).slice(0, 3);
      const recentAffiliates = (newAffiliatesRes.data as Affiliate[])
        .filter((a) => a.status === 'pending')
        .slice(0, 2);
      const notifs = [
        ...recentSales.map((sale: Sale) => ({
          type: 'conversion' as const,
          title: 'New Conversion',
          message: `${sale.affiliate?.user?.name || 'Affiliate'} earned $${formatCurrency(sale.commission_amount)}`,
          time: getTimeAgo(sale.created_at || new Date().toISOString()),
          icon: 'trending' as const
        })),
        ...recentAffiliates.map((aff) => ({
          type: 'registration' as const,
          title: 'New Registration',
          message: `${aff.user.name} joined the platform`,
          time: getTimeAgo(aff.created_at || new Date().toISOString()),
          icon: 'user' as const
        }))
      ];
      setNotifications(notifs.slice(0, 5));
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  }, []);

  const fetchPlatformStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/summary');
      setPlatformStats({
        systemStatus: 'Operational',
        apiHealth: '99.9% Uptime',
        activeUsers: data.active_affiliates,
        totalRevenue: data.total_revenue
      });
    } catch (err) {
      console.error('Error fetching platform stats', err);
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    if (user && user.role === 'admin') {
      fetchData();
      fetchNotifications();
      fetchPlatformStats();
    } else {
      setIsSyncing(false);
    }
  }, [user, loading, fetchData, fetchNotifications, fetchPlatformStats]);

  // already replaced by useCallback wrapper above
  const getTimeAgo = (dateString: string) => {
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

  if (loading || isSyncing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation */}
      <nav className="bg-[#FFFFFFCC] backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
                  <path d="M20 0L40 10V30L20 40L0 30V10L20 0Z" fill="#4F46E5"/>
                  <path d="M20 10L30 15V25L20 30L10 25V15L20 10Z" fill="white"/>
                </svg>
                <span className="text-xl font-bold text-gray-900">Falak</span>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-[#FFFFFFCC] backdrop-blur-md rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 hover:bg-[#F8FAFC] rounded-lg cursor-pointer">
                            <div className={`w-8 h-8 ${notif.icon === 'trending' ? 'bg-blue-100' : 'bg-green-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              {notif.icon === 'trending' ? (
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                              ) : (
                                <UserPlus className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                              <p className="text-xs text-gray-500">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No new notifications</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button 
                        onClick={() => {
                          setShowNotifications(false);
                          setActiveView('affiliates');
                        }}
                        className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowPlatformMenu(!showPlatformMenu)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  Platform Overview
                </button>
                
                {showPlatformMenu && (
                  <div className="absolute right-0 top-12 w-72 bg-[#FFFFFFCC] backdrop-blur-md rounded-xl shadow-lg border border-gray-200 z-50">
                    {platformStats && (
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-3">System Status</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status</span>
                            <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {platformStats.systemStatus}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">API Health</span>
                            <span className="text-sm font-semibold text-gray-900">{platformStats.apiHealth}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Active Users</span>
                            <span className="text-sm font-semibold text-gray-900">{platformStats.activeUsers}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Revenue</span>
                            <span className="text-sm font-semibold text-gray-900">${platformStats.totalRevenue?.toLocaleString() || '0'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <button 
                        onClick={() => {
                          setShowPlatformMenu(false);
                          setActiveView('analytics');
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#F8FAFC] rounded-lg"
                      >
                        Performance Metrics
                      </button>
                      <button 
                        onClick={() => {
                          setShowPlatformMenu(false);
                          setActiveView('settings');
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#F8FAFC] rounded-lg"
                      >
                        System Settings
                      </button>
                      <div className="border-t border-gray-100 my-2"></div>
                      <a 
                        href="/api-docs" 
                        target="_blank"
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#F8FAFC] rounded-lg"
                      >
                        API Documentation
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{user?.name?.charAt(0) || 'A'}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#F8FAFC] min-h-[calc(100vh-73px)] sticky top-[73px]">
          <div className="p-6">
            {/* User Profile */}
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{user?.name?.charAt(0) || 'A'}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Affiliate Partner</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              <NavItem 
                icon={<BarChart3 className="w-5 h-5" />}
                label="Overview"
                active={activeView === 'overview'}
                onClick={() => setActiveView('overview')}
              />
              <NavItem 
                icon={<Users className="w-5 h-5" />}
                label="Affiliates"
                active={activeView === 'affiliates'}
                onClick={() => setActiveView('affiliates')}
              />
              <NavItem 
                icon={<DollarSign className="w-5 h-5" />}
                label="Commissions"
                active={activeView === 'commissions'}
                onClick={() => setActiveView('commissions')}
              />
              <NavItem 
                icon={<TrendingUp className="w-5 h-5" />}
                label="Analytics"
                active={activeView === 'analytics'}
                onClick={() => setActiveView('analytics')}
              />
              <NavItem 
                icon={<Clock className="w-5 h-5" />}
                label="Payouts"
                active={activeView === 'payouts'}
                onClick={() => setActiveView('payouts')}
              />
              <NavItem 
                icon={<SettingsIcon className="w-5 h-5" />}
                label="Settings"
                active={activeView === 'settings'}
                onClick={() => setActiveView('settings')}
              />
            </nav>

            {/* Generate Link Button */}
            <button onClick={openGenerateLinkModal} className="w-full mt-8 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Generate Link
            </button>
            {generatedLink && (
              <p className="mt-3 text-xs text-gray-500 break-all">Copied link: <a href={generatedLink} target="_blank" rel="noreferrer" className="text-indigo-600 underline">{generatedLink}</a></p>
            )}

            {showLinkModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
                <div className="w-full max-w-lg rounded-3xl bg-[#FFFFFFCC] backdrop-blur-md p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Create Affiliate Link</h2>
                      <p className="text-sm text-gray-500">Enter a name for the new generated link.</p>
                    </div>
                    <button onClick={closeGenerateLinkModal} className="text-gray-400 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Link Name</label>
                      <input
                        type="text"
                        value={newLinkName}
                        onChange={(e) => setNewLinkName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                        placeholder="Enter a name for the link"
                      />
                      {linkCreateError && <p className="mt-2 text-sm text-red-600">{linkCreateError}</p>}
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button onClick={closeGenerateLinkModal} className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-[#F8FAFC]">
                      Cancel
                    </button>
                    <button
                      onClick={createLink}
                      disabled={isCreatingLink}
                      className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {isCreatingLink ? 'Creating...' : 'Create Link'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Logout */}
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeView === 'overview' && <OverviewView summary={summary} affiliates={affiliates} clickStats={clickStats} setActiveView={setActiveView} updateStatus={updateStatus} />}
          {activeView === 'analytics' && <AnalyticsView summary={summary} clickStats={clickStats} affiliates={affiliates} exportCSV={exportCSV} />}
          {activeView === 'affiliates' && <AffiliatesView affiliates={affiliates} searchQuery={searchQuery} setSearchQuery={setSearchQuery} fetchData={fetchData} updateStatus={updateStatus} deleteAffiliate={deleteAffiliate} />}
          {activeView === 'commissions' && <CommissionsView />}
          {activeView === 'payouts' && <PayoutsView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active 
          ? 'bg-indigo-50 text-indigo-600' 
          : 'text-gray-600 hover:bg-[#F8FAFC] hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <div className="ml-auto w-1 h-6 bg-indigo-600 rounded-full"></div>
      )}
    </button>
  );
}

// Overview View
function OverviewView({ summary, affiliates, clickStats, setActiveView, updateStatus }: OverviewViewProps) {
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  const topPerformers = [...affiliates]
    .sort((a: Affiliate, b: Affiliate) => (b.total_earnings || 0) - (a.total_earnings || 0))
    .slice(0, 3);

  // Calculate real stats with trends
  const totalAffiliates = summary?.total_affiliates || 0;
  const activeAffiliates = summary?.active_affiliates || 0;
  const totalClicks = summary?.total_clicks || 0;
  const totalConversions = summary?.total_sales || 0;
  const totalRevenue = summary?.total_revenue || 0;

  // Calculate trends (mock for now, can be real from backend)
  const affiliatesTrend = '+6.4%';
  const activeTrend = '+9.1%';
  const clicksTrend = totalClicks > 50 ? '-2.4%' : '+5.2%';
  const conversionsTrend = totalConversions > 20 ? '-19.8%' : '+12.3%';
  const revenueTrend = totalRevenue > 5000 ? '-22.3%' : '+18.5%';

  // Process chart data based on period
  const getChartData = () => {
    if (chartPeriod === 'daily') {
      return clickStats.slice(-7); // Last 7 days
    } else if (chartPeriod === 'weekly') {
      return clickStats.slice(-4); // Last 4 weeks
    } else {
      return clickStats.slice(-12); // Last 12 months
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search affiliates, transactions, or reports..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
          </button>
          <button className="px-4 py-2 text-sm font-medium text-indigo-600 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg hover:bg-[#F8FAFC]">
            Platform Overview
          </button>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Conversion Insight Alert */}
        {summary && summary.total_revenue > 5000 && topPerformers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Conversion Insight</h3>
              <p className="text-sm text-gray-600">
                Total revenue has reached ${totalRevenue.toLocaleString()}. Top performer {topPerformers[0]?.user.name} is leading with ${formatCurrency(topPerformers[0]?.total_earnings)}.
              </p>
            </div>
          </div>
        )}

        {/* Anomaly Detection Alert */}
        {totalClicks > 100 && totalConversions < 10 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Anomaly Detected</h3>
              <p className="text-sm text-gray-600">
                Low conversion rate detected ({((totalConversions / totalClicks) * 100).toFixed(2)}%). {totalClicks} clicks but only {totalConversions} conversions. Review your affiliate links.
              </p>
            </div>
          </div>
        )}
        
        {/* Pending Approvals Alert */}
        {affiliates.filter((a: Affiliate) => a.status === 'pending').length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Pending Actions</h3>
              <p className="text-sm text-gray-600">
                You have {affiliates.filter((a: Affiliate) => a.status === 'pending').length} affiliate{affiliates.filter((a: Affiliate) => a.status === 'pending').length > 1 ? 's' : ''} waiting for approval. 
                <button 
                  onClick={() => setActiveView('affiliates')}
                  className="text-amber-700 font-semibold hover:underline ml-1"
                >
                  Review now
                </button>
              </p>
            </div>
          </div>
        )}

        {/* High Performance Alert */}
        {summary && summary.total_revenue > 10000 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Excellent Performance</h3>
              <p className="text-sm text-gray-600">
                Your platform has generated ${totalRevenue.toLocaleString()} in revenue with {totalAffiliates} active affiliates. Keep up the great work!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard 
          label="TOTAL AFFILIATES"
          value={totalAffiliates.toLocaleString()}
          change={affiliatesTrend}
          trend={affiliatesTrend.startsWith('+') ? 'up' : 'down'}
        />
        <StatCard 
          label="ACTIVE AFFILIATES"
          value={activeAffiliates.toLocaleString()}
          change={activeTrend}
          trend={activeTrend.startsWith('+') ? 'up' : 'down'}
        />
        <StatCard 
          label="TOTAL CLICKS"
          value={totalClicks >= 1000 ? `${(totalClicks / 1000).toFixed(1)}k` : totalClicks.toString()}
          change={clicksTrend}
          trend={clicksTrend.startsWith('+') ? 'up' : 'down'}
        />
        <StatCard 
          label="CONVERSIONS"
          value={totalConversions.toLocaleString()}
          change={conversionsTrend}
          trend={conversionsTrend.startsWith('+') ? 'up' : 'down'}
        />
        <StatCard 
          label="TOTAL REVENUE"
          value={`$${totalRevenue.toLocaleString()}`}
          change={revenueTrend}
          trend={revenueTrend.startsWith('+') ? 'up' : 'down'}
        />
      </div>

      {/* Revenue Performance Chart & Widgets */}
      <div className="grid grid-cols-3 gap-6">
        {/* Revenue Performance Chart */}
        <div className="col-span-2 bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Performance</h3>
              <p className="text-sm text-gray-500">Visualizing income vs conversion rates</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setChartPeriod('daily')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  chartPeriod === 'daily' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Daily
              </button>
              <button 
                onClick={() => setChartPeriod('weekly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  chartPeriod === 'weekly' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setChartPeriod('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  chartPeriod === 'monthly' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side Widgets */}
        <div className="space-y-6">
          {/* Pending Actions Widget */}
          <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Pending Actions</h3>
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
                {affiliates.filter((a: Affiliate) => a.status === 'pending').length} URGENT
              </span>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {/* New Applications */}
              {affiliates.filter((a: Affiliate) => a.status === 'pending').slice(0, 2).map((aff: Affiliate) => (
                <div key={aff.id} className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">New Application</p>
                    <p className="text-xs text-gray-600 truncate">{aff.user.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => updateStatus(aff.id, 'active')}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => updateStatus(aff.id, 'suspended')}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Payout Requests */}
              {affiliates.filter((a: Affiliate) => (a.pending_balance || 0) > 50).slice(0, 2).map((aff: Affiliate) => (
                <div key={`payout-${aff.id}`} className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">Payout Request</p>
                    <p className="text-xs text-gray-600">${formatCurrency(aff.pending_balance)} to {aff.bank_name || 'PayPal'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {affiliates.filter((a: Affiliate) => a.status === 'pending').length === 0 && 
               affiliates.filter((a: Affiliate) => (a.pending_balance || 0) > 50).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending actions</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Widget */}
          <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Recent Activity</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {affiliates.slice(0, 4).map((aff: Affiliate, idx: number) => {
                const activities = [
                  {
                    icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
                    iconBg: 'bg-blue-100',
                    title: 'New Conversion',
                    subtitle: `from Affiliate ${aff.user.name}`,
                    detail: `+$${((aff.total_earnings || 0) / Math.max(aff.sales_count || 1, 1)).toFixed(2)} Commission`,
                    time: `${idx * 15 + 2} MINUTES AGO`
                  },
                  {
                    icon: <UserPlus className="w-4 h-4 text-green-600" />,
                    iconBg: 'bg-green-100',
                    title: 'Registration',
                    subtitle: `at Affiliate Portal`,
                    detail: aff.user.name,
                    time: `${idx * 30 + 14} MINUTES AGO`
                  },
                  {
                    icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
                    iconBg: 'bg-emerald-100',
                    title: 'Payout Completed',
                    subtitle: `to 12 accounts`,
                    detail: `Batch #${9021 + idx} cleared successfully.`,
                    time: `${idx + 1} HOUR AGO`
                  },
                  {
                    icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
                    iconBg: 'bg-red-100',
                    title: 'Flagged Activity',
                    subtitle: `by Risk Engine`,
                    detail: `Account #${1109 + idx} (Duplicate IPs)`,
                    time: `${idx + 3} HOURS AGO`
                  }
                ];
                
                const activity = activities[idx % 4];
                
                return (
                  <div key={`activity-${aff.id}-${idx}`} className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${activity.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {activity.title} <span className="font-normal text-gray-600">{activity.subtitle}</span>
                      </p>
                      <p className="text-xs text-gray-600">{activity.detail}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Affiliates Table */}
      <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Top Performing Affiliates</h3>
          <button 
            onClick={() => setActiveView('affiliates')}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View All
          </button>
        </div>
        
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 pb-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
          <div>AFFILIATE</div>
          <div className="text-center">CLICKS</div>
          <div className="text-center">CONVERSIONS</div>
          <div className="text-center">REVENUE</div>
          <div className="text-center">COMMISSION</div>
          <div className="text-center">CVR</div>
        </div>
        
        {/* Table Rows */}
        <div className="space-y-3 mt-3">
          {topPerformers.map((aff: Affiliate, idx: number) => {
            const clicks = aff.clicks_count || 0;
            const conversions = aff.sales_count || 0;
            const revenue = aff.total_earnings || 0;
            const commission = revenue * (aff.commission_rate / 100);
            const cvr = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : '0.0';
            
            return (
              <div key={aff.id} className="grid grid-cols-6 gap-4 py-3 items-center hover:bg-[#F8FAFC] rounded-lg transition-colors">
                {/* Affiliate Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                    idx === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 
                    idx === 1 ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 
                    'bg-gradient-to-br from-pink-500 to-pink-600'
                  }`}>
                    {aff.user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{aff.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{aff.user.email.split('@')[0]}</p>
                  </div>
                </div>
                
                {/* Clicks */}
                <div className="text-center">
                  <p className="font-semibold text-gray-900">{clicks.toLocaleString()}</p>
                </div>
                
                {/* Conversions */}
                <div className="text-center">
                  <p className="font-semibold text-gray-900">{conversions}</p>
                </div>
                
                {/* Revenue */}
                <div className="text-center">
                  <p className="font-semibold text-gray-900">${revenue.toLocaleString()}</p>
                </div>
                
                {/* Commission */}
                <div className="text-center">
                  <p className="font-semibold text-indigo-600">${formatCurrency(commission)}</p>
                </div>
                
                {/* CVR */}
                <div className="text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    parseFloat(cvr) > 5 ? 'bg-green-100 text-green-800' : 
                    parseFloat(cvr) > 2 ? 'bg-amber-100 text-amber-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {cvr}%
                  </span>
                </div>
              </div>
            );
          })}
          
          {topPerformers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No affiliates yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {affiliates.slice(0, 4).map((aff: Affiliate, idx: number) => {
              const activities = [
                {
                  icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
                  title: "New Conversion",
                  subtitle: `from Affiliate ${aff.user.name}`,
                  detail: `+$${((aff.total_earnings || 0) / (aff.sales_count || 1)).toFixed(2)} Commission`,
                  time: `${idx * 15 + 2} MINUTES AGO`,
                  iconBg: "bg-blue-100"
                },
                {
                  icon: <UserPlus className="w-4 h-4 text-green-600" />,
                  title: "Registration",
                  subtitle: `at Affiliate Portal ${aff.user.name}`,
                  detail: "",
                  time: `${idx * 30 + 14} MINUTES AGO`,
                  iconBg: "bg-green-100"
                }
              ];
              
              return activities[idx % 2] ? (
                <ActivityItem 
                  key={`${aff.id}-${idx}`}
                  icon={activities[idx % 2].icon}
                  title={activities[idx % 2].title}
                  subtitle={activities[idx % 2].subtitle}
                  detail={activities[idx % 2].detail}
                  time={activities[idx % 2].time}
                  iconBg={activities[idx % 2].iconBg}
                />
              ) : null;
            })}
          </div>
        </div>

      {/* System Invite Code */}
      <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">SYSTEM INVITE CODE</p>
            <p className="text-2xl font-mono font-bold text-gray-900">STRATUM-ADMIN-2024-XQ92</p>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText('STRATUM-ADMIN-2024-XQ92');
              alert('Invite code copied to clipboard!');
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm"
          >
            COPY
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, trend }: StatCardProps) {
  return (
    <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
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

function ActivityItem({ icon, title, subtitle, detail, time, iconBg }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{title} <span className="font-normal text-gray-600">{subtitle}</span></p>
        {detail && <p className="text-sm text-gray-600">{detail}</p>}
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

// Analytics View (Reports Page)
function AnalyticsView({ summary, clickStats, affiliates, exportCSV }: AnalyticsViewProps) {
  const [deviceData, setDeviceData] = useState<DeviceMetric[]>([]);
  const [geoData, setGeoData] = useState<GeoMetric[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [devicesRes, geoRes, sourcesRes] = await Promise.all([
          api.get('/admin/analytics/devices?days=30'),
          api.get('/admin/analytics/geo?days=30'),
          api.get('/admin/analytics/traffic-sources?days=30'),
        ]);

        setDeviceData(devicesRes.data.map((item: DeviceMetric) => ({
          ...item,
          count: Number(item.count) || 0,
        })));
        setGeoData(geoRes.data.map((item: GeoMetric) => ({
          ...item,
          count: Number(item.count) || 0,
        })));
        setTrafficSources(sourcesRes.data.map((item: TrafficSource) => ({
          ...item,
          count: Number(item.count) || 0,
        })));
      } catch (err) {
        console.error('Error fetching analytics data', err);
      }
    };

    fetchAnalytics();
  }, []);

  const deviceColors: Record<string, string> = {
    Mobile: '#4F46E5',
    Desktop: '#818CF8',
    Tablet: '#C7D2FE',
    Other: '#A3AED0',
  };

  const chartDeviceData = deviceData.map((item) => ({
    ...item,
    color: deviceColors[item.name] || deviceColors.Other,
  }));

  const activeGeoData = geoData.length > 0 ? geoData : [{ region: 'No data', count: 0 }];

  const sourceChartData = trafficSources.length > 0 ? trafficSources : [{ source: 'No data', count: 0 }];

  // Calculate metrics from real data
  const totalRevenue = summary?.total_revenue || 0;
  const totalConversions = summary?.total_sales || 0;
  const totalClicks = summary?.total_clicks || 0;
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0';
  const avgOrderValue = totalConversions > 0 ? (totalRevenue / totalConversions).toFixed(2) : '0.00';

  // Get top affiliates
  const topAffiliates = affiliates
    .sort((a: Affiliate, b: Affiliate) => (b.total_earnings || 0) - (a.total_earnings || 0))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Analyze platform performance and affiliate insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm font-medium">
            <option>Last 7 days</option>
            <option>30 days</option>
            <option>Custom</option>
          </select>
          <button 
            onClick={exportCSV}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="TOTAL REVENUE" value={`$${totalRevenue.toLocaleString()}`} change="+9%" />
        <MetricCard label="TOTAL CONVERSIONS" value={totalConversions.toLocaleString()} change="+8%" />
        <MetricCard label="CONVERSION RATE" value={`${conversionRate}%`} change="+2.4%" />
        <MetricCard label="AVG. ORDER VALUE" value={`$${avgOrderValue}`} change="+1.2%" />
      </div>

      {/* Revenue Performance & Smart Insights */}
      <div className="grid grid-cols-3 gap-6">
        {/* Chart */}
        <div className="col-span-2 bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Performance</h3>
              <p className="text-sm text-gray-500">Historical trend & 6-wk forecasts</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">Revenue</span>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clickStats.slice(0, 7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Smart Insights */}
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Smart Insights</h3>
          </div>
          
          <div className="space-y-4">
            <InsightItem 
              icon={<CheckCircle className="w-4 h-4 text-green-600" />}
              text="Revenue increased by 25% this month"
              subtext="Driven by successful affiliate welcome campaigns"
            />
            <InsightItem 
              icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
              text="Top affiliates generate 60% of sales"
              subtext="Consider diversifying your affiliate base to mitigate risk"
            />
            <InsightItem 
              icon={<TrendingDown className="w-4 h-4 text-red-600" />}
              text="Conversion rate dropped by 0.5%"
              subtext="Mobile checkout friction detected in the last 48 hours"
            />
          </div>
        </div>
      </div>

      {/* Affiliate Performance & Geographic Insights */}
      <div className="grid grid-cols-2 gap-6">
        {/* Affiliate Performance Table */}
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Affiliate Performance</h3>
          <p className="text-sm text-gray-500 mb-4">Top performing partners ranked by revenue</p>
          
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-gray-500 uppercase pb-2 border-b border-gray-100">
              <div>AFFILIATE</div>
              <div className="text-center">CLICKS</div>
              <div className="text-center">CONVERSIONS</div>
              <div className="text-center">REVENUE</div>
              <div className="text-center">CVR</div>
            </div>
            
            {topAffiliates.map((aff: Affiliate) => {
              const clicks = aff.clicks_count || 0;
              const conversions = aff.sales_count || 0;
              const cvr = clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : '0.00';
              
              return (
                <AffiliateRow 
                  key={aff.id}
                  name={aff.user.name} 
                  clicks={clicks.toLocaleString()} 
                  conversions={conversions.toString()} 
                  revenue={`$${formatCurrency(aff.total_earnings)}`} 
                  cvr={`${cvr}%`} 
                />
              );
            })}
          </div>
        </div>

        {/* Geographic Insights */}
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Geographic Insights</h3>
          <p className="text-sm text-gray-500 mb-6">Revenue distribution by region</p>
          
          {/* Map Placeholder */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl h-48 mb-6 flex items-center justify-center relative overflow-hidden">
            <MapPin className="w-16 h-16 text-indigo-300" />
            <div className="absolute top-4 right-4 w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
            <div className="absolute bottom-8 left-8 w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="absolute top-12 right-16 w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
          </div>

          <div className="space-y-3">
            {activeGeoData.map((item, idx) => {
              const bgClass = idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-indigo-400' : idx === 2 ? 'bg-indigo-300' : 'bg-gray-300';
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${bgClass} rounded-full`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.region}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.count.toLocaleString()} clicks</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Traffic Sources & Device Distribution */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Traffic Sources</h3>
          <p className="text-sm text-gray-500 mb-6">Click volume by referral channel</p>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceChartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="source" stroke="#9ca3af" fontSize={11} width={100} />
                <Bar dataKey="count" fill="#4F46E5" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Device Distribution</h3>
          <p className="text-sm text-gray-500 mb-6">User traffic by device type</p>
          
          <div className="space-y-4">
            {chartDeviceData.map((device, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: device.color }}></div>
                  <span className="text-sm font-medium text-gray-700">{device.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{device.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change }: MetricCardProps) {
  return (
    <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <span className="text-xs font-semibold text-green-600">{change}</span>
      </div>
    </div>
  );
}

function InsightItem({ icon, text, subtext }: InsightItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{text}</p>
        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
      </div>
    </div>
  );
}

function AffiliateRow({ name, clicks, conversions, revenue, cvr }: AffiliateRowProps) {
  return (
    <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xs">{name.charAt(0)}</span>
        </div>
        <span className="text-sm font-medium text-gray-900">{name}</span>
      </div>
      <div className="text-center text-sm text-gray-600">{clicks}</div>
      <div className="text-center text-sm text-gray-600">{conversions}</div>
      <div className="text-center text-sm font-semibold text-gray-900">{revenue}</div>
      <div className="text-center text-sm font-semibold text-emerald-600">{cvr}</div>
    </div>
  );
}

// Affiliates View
function AffiliatesView({ affiliates, searchQuery, setSearchQuery, fetchData, updateStatus, deleteAffiliate }: AffiliatesViewProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'performance' | 'name' | 'date'>('performance');
  const [page, setPage] = useState(1);
  const pageSize = 4;
  
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
          className="ml-4 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-green-600">+12%</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">TOTAL AFFILIATES</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-600">+8.4%</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ACTIVE NOW</p>
          <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">PENDING APPROVAL</p>
          <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">BLOCKED ACCOUNTS</p>
          <p className="text-2xl font-bold text-gray-900">{stats.blocked}</p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200">
        {/* Filter Tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'active' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Active
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'pending' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('suspended')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'suspended' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Blocked
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Filter className="w-5 h-5" />
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'performance' | 'name' | 'date')}
              className="px-3 py-2 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm font-medium"
            >
              <option value="performance">Sort by: Performance</option>
              <option value="name">Sort by: Name</option>
              <option value="date">Sort by: Date</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">AFFILIATE</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">CONVERSIONS</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">REVENUE</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">STATUS</th>
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
                        <p className="font-semibold text-gray-900 text-sm">{aff.user.name}</p>
                        <p className="text-xs text-gray-500">{aff.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div>
                      <p className="font-bold text-gray-900">{aff.sales_count || 0}</p>
                      <p className="text-xs text-green-600">+{aff.clicks_count || 0}%</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="font-bold text-gray-900">${formatCurrency(aff.total_earnings)}</p>
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
          <p className="text-sm text-gray-500">Showing {paginatedAffiliates.length} of {filteredAffiliates.length} affiliates</p>
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
      <div className="grid grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">This Month</button>
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
                  <p className="font-semibold text-gray-900 text-sm">{aff.user.name}</p>
                  <p className="text-xs text-gray-500">{aff.user.email.split('@')[0]}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${formatCurrency(aff.total_earnings)}</p>
                  <div className="w-20 h-1 bg-gray-100 rounded-full mt-1">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            View All Rankings
          </button>
        </div>

        {/* Pending Approvals */}
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">Pending Approvals</h3>
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">18</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Digital Nomad Agency</p>
                  <p className="text-xs text-gray-500">Joined 2h ago</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm">
                APPROVE
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Alex Thompson</p>
                  <p className="text-xs text-gray-500">Joined 5h ago</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm">
                APPROVE
              </button>
            </div>
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
          <button className="px-6 py-3 bg-[#FFFFFFCC] backdrop-blur-md text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors">
            RUN AUDIT
          </button>
        </div>
      </div>
    </div>
  );
}

// Commissions View
function CommissionsView() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commissions Management</h1>
          <p className="text-sm text-gray-500">Search orders, affiliates or payout IDs...</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-green-600">+12.5%</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">TOTAL COMMISSIONS</p>
          <p className="text-2xl font-bold text-gray-900">${(commissionsSummary?.total_commissions || 0).toLocaleString()}</p>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-amber-600">+4.2%</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">PENDING</p>
          <p className="text-2xl font-bold text-gray-900">${(commissionsSummary?.pending || 0).toLocaleString()}</p>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-600">+8.1%</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">APPROVED</p>
          <p className="text-2xl font-bold text-gray-900">${(commissionsSummary?.approved || 0).toLocaleString()}</p>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500">0.0%</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">PAID</p>
          <p className="text-2xl font-bold text-gray-900">${(commissionsSummary?.paid || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Commission Performance Chart & Insight */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Commission Performance</h3>
              <p className="text-sm text-gray-500">Historical trend of net earnings</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPeriod('daily')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${period === 'daily' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Daily
              </button>
              <button 
                onClick={() => setPeriod('weekly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${period === 'weekly' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setPeriod('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${period === 'monthly' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Monthly
              </button>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commissionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="period" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} dot={{ fill: '#4F46E5', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6" />
            <h3 className="text-lg font-bold">Commissions Increased by 22% this month</h3>
          </div>
          <p className="text-indigo-100 text-sm mb-6">
            The recent Spring Affiliate Rush campaign has driven a significant uptick in high-ticket referrals from top-tier partners.
          </p>
          <button className="w-full py-3 bg-[#FFFFFFCC] backdrop-blur-md/20 hover:bg-[#FFFFFFCC] backdrop-blur-md/30 backdrop-blur-sm rounded-xl font-semibold transition-colors">
            View Campaign Breakdown
          </button>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-gray-900">Pending Approvals</h3>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">{pendingCommissions.length} NEW</span>
          </div>
          <button onClick={reviewAllPending} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Review All</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-4 text-xs font-semibold text-gray-500 uppercase pb-2 border-b border-gray-100">
            <div>AFFILIATE</div>
            <div>SOURCE</div>
            <div>AMOUNT</div>
            <div>DATE</div>
            <div>STATUS</div>
            <div className="text-right">ACTIONS</div>
          </div>

          {pendingCommissions.slice(0, 2).map((commission: Sale) => (
            <CommissionRow 
              key={commission.id}
              name={commission.affiliate?.user?.name || 'Unknown'}
              source={`Sale #${commission.id}`}
              amount={`$${formatCurrency(commission.commission_amount)}`}
              date={new Date(commission.created_at || new Date().toISOString()).toLocaleDateString()}
              status="PENDING"
              onApprove={() => approveCommission(commission.id)}
              onReject={() => rejectCommission(commission.id)}
            />
          ))}
          
          {pendingCommissions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">No pending commissions</p>
            </div>
          )}
        </div>
      </div>

      {/* All Commissions Table */}
      <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">All Commissions</h3>
          <div className="flex items-center gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'paid');
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm font-medium"
            >
              <option value="all">Status: All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '30' | '7' | '90')}
              className="px-3 py-2 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm font-medium"
            >
              <option value="30">Last 30 Days</option>
              <option value="7">Last 7 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <button onClick={exportCommissionsCSV} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm">
              Export CSV
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-4 text-xs font-semibold text-gray-500 uppercase pb-2 border-b border-gray-100">
            <div>DATE</div>
            <div>AFFILIATE</div>
            <div>REFERRAL ID</div>
            <div>REVENUE</div>
            <div>COMMISSION</div>
            <div>STATUS</div>
            <div>PAYMENT</div>
          </div>

          {paginatedCommissions.map((commission: Sale) => (
            <AllCommissionRow 
              key={commission.id}
              date={new Date(commission.created_at || new Date().toISOString()).toLocaleDateString()}
              affiliate={commission.affiliate?.user?.name || 'Unknown'}
              referralId={`#REF-${commission.id}`}
              revenue={`$${formatCurrency(commission.amount)}`}
              commission={`$${formatCurrency(commission.commission_amount)}`}
              status={commission.status?.toUpperCase() || 'PENDING'}
              payment={commission.status === 'paid' ? 'ACH Sent' : commission.status === 'approved' ? 'Unscheduled' : 'N/A'}
            />
          ))}
          
          {filteredCommissions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No commissions found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          {[...Array(pageCount)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-8 h-8 rounded-lg font-semibold text-sm ${currentPage === index + 1 ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
            disabled={currentPage >= pageCount}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CommissionRow({ name, source, amount, date, status, onApprove, onReject }: CommissionRowProps) {
  return (
    <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="text-sm font-medium text-gray-900">{name}</div>
      <div className="text-sm text-gray-600">{source}</div>
      <div className="text-sm font-semibold text-gray-900">{amount}</div>
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

function AllCommissionRow({ date, affiliate, referralId, revenue, commission, status, payment }: AllCommissionRowProps) {
  return (
    <div className="grid grid-cols-7 gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="text-sm text-gray-600">{date}</div>
      <div className="text-sm font-medium text-gray-900">{affiliate}</div>
      <div className="text-sm text-gray-600">{referralId}</div>
      <div className="text-sm font-semibold text-gray-900">{revenue}</div>
      <div className="text-sm font-bold text-indigo-600">{commission}</div>
      <div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          status === 'APPROVED' ? 'bg-green-100 text-green-800' :
          status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      </div>
      <div className="text-sm text-gray-600">{payment}</div>
    </div>
  );
}

// Payouts View
function PayoutsView() {
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
        `$${formatCurrency(payout.commission_amount)}`,
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
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="text-sm text-gray-500">Manage affiliate payments and payout requests</p>
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
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
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
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AVAILABLE BALANCE</p>
          <p className="text-2xl font-bold text-gray-900">${(payoutsSummary?.available_balance || 0).toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3 text-green-600" />
            <span className="text-xs font-semibold text-green-600">12% increase</span>
          </div>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">TOTAL PAID (MTD)</p>
          <p className="text-2xl font-bold text-gray-900">${(payoutsSummary?.total_paid || 0).toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">Last payment 2h ago</span>
          </div>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">PENDING PAYOUTS</p>
          <p className="text-2xl font-bold text-gray-900">${(payoutsSummary?.pending_payouts || 0).toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2">
            <Clock className="w-3 h-3 text-amber-600" />
            <span className="text-xs font-semibold text-amber-600">{pendingPayouts.length} Requests</span>
          </div>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">FAILED PAYOUTS</p>
          <p className="text-2xl font-bold text-red-600">${(payoutsSummary?.failed_payouts || 0).toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2">
            <XCircle className="w-3 h-3 text-red-600" />
            <span className="text-xs font-semibold text-red-600">0 Failures</span>
          </div>
        </div>
      </div>

      {/* Pending Payout Requests & Payment Health */}
      <div className="grid grid-cols-3 gap-6">
        {/* Pending Requests */}
        <div className="col-span-2 bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Pending Payout Requests</h3>
            <button onClick={bulkApprovePending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm">
              BULK APPROVE
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-6">Review and approve pending transactions</p>

          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-gray-500 uppercase pb-2 border-b border-gray-100">
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
                amount={`$${formatCurrency(affiliate.pending_balance)}`}
                date={new Date(affiliate.updated_at || new Date().toISOString()).toLocaleDateString()}
                method={affiliate.bank_name || 'Bank Transfer'}
                status="PENDING"
                onApprove={() => approvePayout(affiliate.id, affiliate.pending_balance || 0)}
              />
            ))}
            
            {pendingPayouts.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">No pending payout requests</p>
              </div>
            )}
          </div>

          {pendingPayouts.length > 3 && (
            <button onClick={() => setCurrentHistoryPage(1)} className="w-full mt-6 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              VIEW ALL {pendingPayouts.length} PENDING REQUESTS
            </button>
          )}
        </div>

        {/* Payment Health */}
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Payment Health</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Success Rate</span>
                <span className="text-sm font-bold text-emerald-600">{paymentHealth.successRate.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, paymentHealth.successRate))}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Fast 30 days</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">MOST USED METHODS</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">Bank Transfer</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{paymentHealth.methods.bankTransfer}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">PayPal</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{paymentHealth.methods.paypal}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">Crypto</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{paymentHealth.methods.crypto}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Payout History */}
      <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">All Payout History</h3>
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
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-4 text-xs font-semibold text-gray-500 uppercase pb-2 border-b border-gray-100">
            <div>TRANSACTION ID</div>
            <div>DATE</div>
            <div>AFFILIATE</div>
            <div>AMOUNT</div>
            <div>METHOD</div>
            <div>STATUS</div>
          </div>

          {paginatedPayoutHistory.map((payout: Sale) => (
            <PayoutHistoryRow 
              key={payout.id}
              txId={`TXN-${payout.id}`}
              date={new Date(payout.updated_at || payout.created_at || new Date().toISOString()).toLocaleString()}
              affiliate={payout.affiliate?.user?.name || 'Unknown'}
              amount={`$${formatCurrency(payout.commission_amount)}`}
              method={payout.affiliate?.bank_name || 'Bank Transfer'}
              status={(payout.status || 'paid').toUpperCase()}
            />
          ))}
          
          {filteredPayoutHistory.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No payout history found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={() => setCurrentHistoryPage((prev) => Math.max(1, prev - 1))}
            disabled={currentHistoryPage <= 1}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          {[...Array(Math.max(1, Math.ceil(filteredPayoutHistory.length / historyPageSize)))].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHistoryPage(index + 1)}
              className={`w-8 h-8 rounded-lg font-semibold text-sm ${currentHistoryPage === index + 1 ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentHistoryPage((prev) => Math.min(Math.max(1, Math.ceil(filteredPayoutHistory.length / historyPageSize)), prev + 1))}
            disabled={currentHistoryPage >= Math.max(1, Math.ceil(filteredPayoutHistory.length / historyPageSize))}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PayoutRequestRow({ name, id, amount, date, method, status, onApprove }: PayoutRequestRowProps) {
  return (
    <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{id}</p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <div className="text-sm font-bold text-gray-900">{amount}</div>
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-gray-400" />
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

function PayoutHistoryRow({ txId, date, affiliate, amount, method, status }: PayoutHistoryRowProps) {
  return (
    <div className="grid grid-cols-6 gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="text-sm font-mono text-gray-600">{txId}</div>
      <div className="text-sm text-gray-600">{date}</div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xs">{affiliate.charAt(0)}</span>
        </div>
        <span className="text-sm font-medium text-gray-900">{affiliate}</span>
      </div>
      <div className="text-sm font-semibold text-gray-900">{amount}</div>
      <div className="text-sm text-gray-600">{method}</div>
      <div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
          status === 'FAILED' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
}

// Settings View
function SettingsView() {
  const [activeTab, setActiveTab] = useState<'general' | 'affiliate' | 'payout' | 'security' | 'notifications'>('general');
  const [platformName, setPlatformName] = useState('Lucid Stratum');
  const [currency, setCurrency] = useState('USD ($)');
  const [timezone, setTimezone] = useState('UTC +00:00');
  const [logoBranding, setLogoBranding] = useState('LS');
  const [commissionRate, setCommissionRate] = useState('15');
  const [cookieDuration, setCookieDuration] = useState('30');
  const [autoApprove, setAutoApprove] = useState(false);
  const [minPayout, setMinPayout] = useState('100.00');
  const [payoutMethods, setPayoutMethods] = useState({ paypal: true, directBank: true, crypto: false });
  const [payoutSchedule, setPayoutSchedule] = useState('Monthly');
  const [notificationPrefs, setNotificationPrefs] = useState({
    newAffiliates: true,
    newPayouts: true,
    systemErrors: false,
    commissions: true,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [integrationApiKey, setIntegrationApiKey] = useState('');
  const [integrationStatus, setIntegrationStatus] = useState('Connected');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings');
      setPlatformName(data.platform_name || 'Lucid Stratum');
      setCurrency(data.currency || 'USD ($)');
      setTimezone(data.timezone || 'UTC +00:00');
      setLogoBranding(data.logo_branding || 'LS');
      setCommissionRate(data.default_commission_rate?.toString() || '15');
      setCookieDuration(data.cookie_duration?.toString() || '30');
      setAutoApprove(Boolean(data.auto_approve));
      setMinPayout(data.minimum_payout?.toFixed(2) || '100.00');
      setPayoutMethods({
        paypal: data.payout_methods?.paypal ?? true,
        directBank: data.payout_methods?.directBank ?? true,
        crypto: data.payout_methods?.crypto ?? false,
      });
      setPayoutSchedule(data.payout_schedule || 'Monthly');
      setNotificationPrefs({
        newAffiliates: data.notification_preferences?.newAffiliates ?? true,
        newPayouts: data.notification_preferences?.newPayouts ?? true,
        systemErrors: data.notification_preferences?.systemErrors ?? false,
        commissions: data.notification_preferences?.commissions ?? true,
      });
      setTwoFactorEnabled(Boolean(data.two_factor_enabled ?? true));
      setSessionTimeout(data.session_timeout?.toString() || '30');
      setIntegrationApiKey(data.integration_api_key || '');
      setIntegrationStatus(data.integration_status || 'Connected');
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const saveGeneralSettings = async () => {
    setLoading(true);
    try {
      await api.put('/admin/settings', {
        platform_name: platformName,
        currency,
        timezone,
        logo_branding: logoBranding,
      });
      await fetchSettings();
      alert('General settings saved successfully!');
    } catch (err) {
      console.error('Error saving general settings:', err);
      alert('Failed to save general settings');
    } finally {
      setLoading(false);
    }
  };

  const saveAffiliateSettings = async () => {
    setLoading(true);
    try {
      await api.put('/admin/settings', {
        default_commission_rate: parseFloat(commissionRate),
        cookie_duration: parseInt(cookieDuration, 10),
        auto_approve: autoApprove,
      });
      await fetchSettings();
      alert('Affiliate settings saved successfully!');
    } catch (err) {
      console.error('Error saving affiliate settings:', err);
      alert('Failed to save affiliate settings');
    } finally {
      setLoading(false);
    }
  };

  const savePayoutSettings = async () => {
    setLoading(true);
    try {
      await api.put('/admin/settings', {
        minimum_payout: parseFloat(minPayout),
        payout_methods: payoutMethods,
        payout_schedule: payoutSchedule,
      });
      await fetchSettings();
      alert('Payout protocol saved successfully!');
    } catch (err) {
      console.error('Error saving payout settings:', err);
      alert('Failed to save payout settings');
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    setLoading(true);
    try {
      await api.put('/admin/settings', {
        notification_preferences: notificationPrefs,
      });
      await fetchSettings();
      alert('Notification preferences saved successfully!');
    } catch (err) {
      console.error('Error saving notification settings:', err);
      alert('Failed to save notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const saveSecuritySettings = async () => {
    setLoading(true);
    try {
      await api.put('/admin/settings', {
        two_factor_enabled: twoFactorEnabled,
        session_timeout: parseInt(sessionTimeout, 10),
      });
      await fetchSettings();
      alert('Security settings saved successfully!');
    } catch (err) {
      console.error('Error saving security settings:', err);
      alert('Failed to save security settings');
    } finally {
      setLoading(false);
    }
  };

  const saveIntegrationSettings = async () => {
    setLoading(true);
    try {
      await api.put('/admin/settings', {
        integration_api_key: integrationApiKey,
        integration_status: integrationStatus,
      });
      await fetchSettings();
      alert('Integration settings saved successfully!');
    } catch (err) {
      console.error('Error saving integration settings:', err);
      alert('Failed to save integration settings');
    } finally {
      setLoading(false);
    }
  };

  const saveAllSettings = async () => {
    setLoading(true);
    try {
      await api.put('/admin/settings', {
        platform_name: platformName,
        currency,
        timezone,
        logo_branding: logoBranding,
        default_commission_rate: parseFloat(commissionRate),
        cookie_duration: parseInt(cookieDuration, 10),
        auto_approve: autoApprove,
        minimum_payout: parseFloat(minPayout),
        payout_methods: payoutMethods,
        payout_schedule: payoutSchedule,
        notification_preferences: notificationPrefs,
        two_factor_enabled: twoFactorEnabled,
        session_timeout: parseInt(sessionTimeout, 10),
        integration_api_key: integrationApiKey,
        integration_status: integrationStatus,
      });
      await fetchSettings();
      alert('All settings saved successfully!');
    } catch (err) {
      console.error('Error saving all settings:', err);
      alert('Failed to save all settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search parameters..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200">
        <div className="flex items-center gap-8 px-6 py-4 border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('general')}
            className={`pb-2 text-sm font-semibold transition-colors relative ${
              activeTab === 'general' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            General
            {activeTab === 'general' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('affiliate')}
            className={`pb-2 text-sm font-semibold transition-colors relative ${
              activeTab === 'affiliate' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Affiliate
          </button>
          <button 
            onClick={() => setActiveTab('payout')}
            className={`pb-2 text-sm font-semibold transition-colors relative ${
              activeTab === 'payout' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Payout
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`pb-2 text-sm font-semibold transition-colors relative ${
              activeTab === 'security' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Security
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`pb-2 text-sm font-semibold transition-colors relative ${
              activeTab === 'notifications' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Notifications
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
          <p className="text-sm text-gray-500 mb-8">Configure your affiliate ecosystem and system preferences.</p>

          {activeTab === 'general' && (
            <div className="grid grid-cols-2 gap-8">
              {/* General Settings */}
              <div className="space-y-6">
                <div className="bg-[#F8FAFC] rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PLATFORM NAME</label>
                      <input 
                        type="text"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">DEFAULT CURRENCY</label>
                      <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                      >
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">TIME ZONE</label>
                      <select 
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                      >
                        <option>UTC +00:00</option>
                        <option>EST -05:00</option>
                        <option>PST -08:00</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">LOGO BRANDING</label>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] items-center">
                        <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{logoBranding}</span>
                        </div>
                        <input
                          type="text"
                          value={logoBranding}
                          onChange={(e) => setLogoBranding(e.target.value.slice(0, 3).toUpperCase())}
                          maxLength={3}
                          className="w-full px-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                          placeholder="Brand initials"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={saveGeneralSettings}
                    disabled={loading}
                    className="w-full mt-6 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-semibold"
                  >
                    {loading ? 'Saving...' : 'Save General Changes'}
                  </button>
                </div>
              </div>

              {/* Payout Protocol & Security */}
              <div className="space-y-6">
                <div className="bg-[#F8FAFC] rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Payout Protocol</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">MINIMUM PAYOUT</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                        <input 
                          type="number"
                          value={minPayout}
                          onChange={(e) => setMinPayout(e.target.value)}
                          className="w-full pl-8 pr-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">METHODS</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={payoutMethods.paypal}
                            onChange={(e) => setPayoutMethods(prev => ({ ...prev, paypal: e.target.checked }))}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="text-sm text-gray-700">PayPal</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={payoutMethods.directBank}
                            onChange={(e) => setPayoutMethods(prev => ({ ...prev, directBank: e.target.checked }))}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Direct Bank</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={payoutMethods.crypto}
                            onChange={(e) => setPayoutMethods(prev => ({ ...prev, crypto: e.target.checked }))}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Crypto (USDT)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">SCHEDULE</label>
                      <select
                        value={payoutSchedule}
                        onChange={(e) => setPayoutSchedule(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                      >
                        <option>Monthly</option>
                        <option>Bi-weekly</option>
                        <option>Weekly</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={savePayoutSettings}
                    disabled={loading}
                    className="w-full mt-6 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-sm"
                  >
                    {loading ? 'Saving...' : 'Save Payout Settings'}
                  </button>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-bold text-gray-900">Security</h3>
                    <span className="ml-auto px-2 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full">ACTIVE</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Rotate Password</span>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-emerald-100">
                      <span className="text-sm font-medium text-gray-700">Two-Factor (2FA)</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFFFFCC] backdrop-blur-md after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-emerald-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">RECENT SESSIONS</p>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Monitor className="w-4 h-4" />
                      <span>macOS - San Francisco, US</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current Session</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'affiliate' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#F8FAFC] rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Affiliate Performance</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">DEFAULT COMMISSION RATE (%)</label>
                    <input 
                      type="number"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">COOKIE DURATION (DAYS)</label>
                    <input 
                      type="number"
                      value={cookieDuration}
                      onChange={(e) => setCookieDuration(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Auto-Approve Affiliates</p>
                      <p className="text-xs text-gray-500">New signups bypass manual review</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoApprove}
                        onChange={(e) => setAutoApprove(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFFFFCC] backdrop-blur-md after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={saveAffiliateSettings}
                  disabled={loading}
                  className="w-full mt-6 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-semibold"
                >
                  {loading ? 'Saving...' : 'Update Rules'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#F8FAFC] rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-500">Require 2FA for admin access and privileged actions.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={twoFactorEnabled}
                        onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFFFFCC] backdrop-blur-md after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SESSION TIMEOUT (MINUTES)</label>
                    <input
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    />
                  </div>
                </div>

                <button
                  onClick={saveSecuritySettings}
                  disabled={loading}
                  className="w-full mt-6 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-semibold"
                >
                  {loading ? 'Saving...' : 'Save Security Settings'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-[#F8FAFC] rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h3>
                <p className="text-sm text-gray-500 mb-6">Control how you receive alerts and system updates</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.newAffiliates}
                        onChange={(e) => setNotificationPrefs(prev => ({ ...prev, newAffiliates: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-900">New Affiliates</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.newPayouts}
                        onChange={(e) => setNotificationPrefs(prev => ({ ...prev, newPayouts: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-900">New Payouts</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.systemErrors}
                        onChange={(e) => setNotificationPrefs(prev => ({ ...prev, systemErrors: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-900">System Errors</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.commissions}
                        onChange={(e) => setNotificationPrefs(prev => ({ ...prev, commissions: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-900">Commissions</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={saveNotificationSettings}
                  disabled={loading}
                  className="w-full mt-6 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-semibold"
                >
                  {loading ? 'Saving...' : 'Save Notifications'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Integrations</h3>
        
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">FalakCart</p>
              <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                {integrationStatus}
              </span>
            </div>
          </div>

          <div className="space-y-4 p-4 bg-[#F8FAFC] rounded-xl">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">MASTER API KEY</label>
              <input
                type="text"
                value={integrationApiKey}
                onChange={(e) => setIntegrationApiKey(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                placeholder="Enter or replace API key"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={saveIntegrationSettings}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-semibold"
              >
                {loading ? 'Saving...' : 'Save Integration'}
              </button>
              <button
                onClick={() => setIntegrationApiKey('')}
                className="px-4 py-3 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-[#F8FAFC]"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Save Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={saveAllSettings}
          disabled={loading}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg shadow-lg"
        >
          {loading ? 'Saving All...' : 'Global Save: Apply All Settings'}
        </button>
      </div>
    </div>
  );
}

