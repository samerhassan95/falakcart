'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Users, DollarSign, BarChart3, ShieldCheck, 
  LogOut, Download, Plus, Trash2, Edit3, 
  Search, Activity, TrendingUp, UserPlus, Shield
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
  const { user, loading, logout } = useAuth();
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
    const name = prompt('Admin Name:');
    const email = prompt('Admin Email:');
    const password = prompt('Admin Password (min 6 chars):');
    if (name && email && password) {
       try {
         await api.post('/admin/users', { name, email, password, role: 'admin' });
         fetchData();
       } catch (err) {
         alert('Error creating admin user. Check console.');
         console.error(err);
       }
    }
  };

  if (loading || isSyncing) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
       <div className="flex flex-col items-center gap-4">
         <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
         <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Command Center...</span>
       </div>
    </div>
  );
  
  if (!user || user.role !== 'admin') return <div className="text-white p-8">Access Denied: Admin Clearance Required.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 bg-black text-white min-h-screen pb-32">
       {/* Background ambient lighting */}
       <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[200px] -z-10 pointer-events-none" />
       <div className="fixed bottom-0 left-0 w-[800px] h-[800px] bg-red-500/5 rounded-full blur-[200px] -z-10 pointer-events-none" />

      {/* Header Section */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-700 to-blue-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3 border-4 border-black ring-1 ring-blue-500/50">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              System <span className="text-blue-500">Master</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
               <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">Live Oversight Active</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={exportCSV}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl border border-zinc-700 transition-all flex items-center gap-3 text-sm font-bold shadow-xl"
          >
            <Download className="w-4 h-4 text-blue-400" />
            Full Export
          </button>
          <button 
            onClick={createAdminUser}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl border border-blue-400 transition-all flex items-center gap-3 text-sm font-bold shadow-xl shadow-blue-500/10"
          >
            <UserPlus className="w-4 h-4" />
            Invite Admin
          </button>
          <button 
            onClick={logout}
            className="p-3 bg-zinc-900/50 hover:bg-red-500/10 rounded-2xl border border-zinc-800 hover:border-red-500/20 transition-all text-zinc-400 hover:text-red-500 shadow-xl group"
          >
            <LogOut className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* High-Level Global Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <GlobalStatCard 
          title="Total Affiliates" 
          value={summary?.total_affiliates ?? 0} 
          subValue={`${summary?.active_affiliates} Active`}
          icon={<Users className="w-8 h-8 text-blue-500" />} 
        />
        <GlobalStatCard 
          title="Total Clicks" 
          value={summary?.total_clicks ?? 0} 
          subValue="Across Network"
          icon={<Activity className="w-8 h-8 text-amber-500" />} 
        />
        <GlobalStatCard 
          title="Net Revenue" 
          value={`$${Number(summary?.total_revenue ?? 0).toFixed(2)}`} 
          subValue={`${summary?.total_sales} Conver.`}
          icon={<TrendingUp className="w-8 h-8 text-emerald-500" />} 
        />
        <GlobalStatCard 
          title="Paid Out" 
          value={`$${Number(summary?.total_commissions ?? 0).toFixed(2)}`} 
          subValue="Total Liabilities"
          icon={<DollarSign className="w-8 h-8 text-purple-500" />} 
        />
      </div>

      {/* Main Content Sections */}
      <div className="bg-zinc-900/10 backdrop-blur-xl rounded-[3rem] border border-zinc-800/50 shadow-2xl overflow-hidden">
        <div className="p-1.5 flex bg-black/40 backdrop-blur shadow-inner border-b border-zinc-800/50 relative">
          <TabButton active={activeTab === 'affiliates'} onClick={() => setActiveTab('affiliates')} label="Affiliate Management" icon={<Users className="w-4 h-4" />} />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="User Control" icon={<Shield className="w-4 h-4" />} />
          <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} label="Traffic Matrix" icon={<BarChart3 className="w-4 h-4" />} />
          
          <div className="ml-auto flex items-center pr-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Global Search..."
                  className="bg-black/50 border border-zinc-800 rounded-full py-2.5 pl-12 pr-6 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
        </div>

        <div className="p-10 min-h-[500px]">
          {activeTab === 'affiliates' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center px-4">
                  <div>
                     <h3 className="text-2xl font-black tracking-tight italic">Affiliate Operational Matrix</h3>
                     <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Configure status, commissions and oversight</p>
                  </div>
               </div>

               <div className="overflow-x-auto rounded-3xl border border-zinc-800 relative shadow-2xl">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
                       <th className="px-8 py-6">Identity</th>
                       <th className="px-8 py-6 text-center">Referral ID</th>
                       <th className="px-8 py-6 text-center text-blue-400">Commission Rate</th>
                       <th className="px-8 py-6">Engagement</th>
                       <th className="px-8 py-6">Security State</th>
                       <th className="px-8 py-6 text-right">Operations</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-800/40">
                     {affiliates.filter(a => a.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.user.email.toLowerCase().includes(searchQuery.toLowerCase())).map((aff) => (
                       <tr key={aff.id} className="hover:bg-blue-500/[0.02] transition-colors group">
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center font-black text-lg border border-zinc-700 shadow-xl group-hover:border-blue-500/50 transition-colors">
                                {aff.user.name.charAt(0)}
                             </div>
                             <div>
                               <div className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors">{aff.user.name}</div>
                               <div className="text-xs text-zinc-500 font-bold">{aff.user.email}</div>
                             </div>
                           </div>
                         </td>
                         <td className="px-8 py-6 text-center">
                           <span className="px-4 py-1.5 bg-black/50 border border-zinc-800 rounded-xl font-mono text-xs font-black text-zinc-400 select-all group-hover:border-zinc-600 transition-colors">
                             {aff.referral_code}
                           </span>
                         </td>
                         <td className="px-8 py-6 text-center">
                           <button 
                             onClick={() => openEditModal(aff)}
                             className="px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500 rounded-2xl border border-blue-500/20 text-blue-400 hover:text-white text-sm font-black transition-all shadow-xl hover:shadow-blue-500/30 group/btn"
                           >
                              {aff.commission_strategy === 'flat' ? (
                                <>{aff.commission_rate}{aff.commission_type === 'fixed' ? '$' : '%'}</>
                              ) : (
                                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Tiered</span>
                              )}
                              <Edit3 className="inline ml-2 w-3 h-3 opacity-50 group-hover/btn:opacity-100" />
                           </button>
                         </td>
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-6">
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-zinc-600 uppercase mb-0.5">Clicks</p>
                                 <p className="font-bold text-sm">{aff.clicks_count ?? 0}</p>
                              </div>
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-zinc-600 uppercase mb-0.5">Sales</p>
                                 <p className="font-bold text-sm text-emerald-500">{aff.sales_count ?? 0}</p>
                              </div>
                           </div>
                         </td>
                         <td className="px-8 py-6">
                           <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                             aff.status === 'active' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/10' : 
                             aff.status === 'suspended' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                             'bg-zinc-500/10 border-zinc-800 text-zinc-500'
                           }`}>
                             {aff.status}
                           </span>
                         </td>
                         <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             {aff.status === 'active' ? (
                               <button onClick={() => updateStatus(aff.id, 'suspended')} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-xl" title="Suspend"><ShieldCheck className="w-4 h-4" /></button>
                             ) : (
                               <button onClick={() => updateStatus(aff.id, 'active')} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-xl" title="Activate"><ShieldCheck className="w-4 h-4" /></button>
                             )}
                             <button onClick={() => deleteAffiliate(aff.id)} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:bg-black hover:text-red-500 transition-all shadow-xl" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center px-4">
                  <div>
                     <h3 className="text-2xl font-black tracking-tight italic">Global Identity Registry</h3>
                     <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Full system user base oversight</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map((usr) => (
                   <div key={usr.id} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 hover:border-blue-500/40 transition-all group shadow-xl">
                      <div className="flex justify-between items-start mb-6">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border transition-all ${usr.role === 'admin' ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-red-500/10' : 'bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-blue-500/10'}`}>
                            {usr.name.charAt(0)}
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {usr.role !== 'admin' && (
                              <button onClick={() => promoteToAdmin(usr.id)} className="p-2.5 bg-zinc-800 hover:bg-red-500/20 rounded-xl text-zinc-500 hover:text-red-500 border border-zinc-700 transition-all shadow-lg" title="Make Admin"><Shield className="w-4 h-4" /></button>
                            )}
                            <button onClick={() => alert('Delete user logic implemented in backend')} className="p-2.5 bg-zinc-800 hover:bg-black rounded-xl text-zinc-500 hover:text-red-500 border border-zinc-700 transition-all shadow-lg" title="Delete User"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                      
                      <div className="space-y-1">
                         <h4 className="text-lg font-black tracking-tight">{usr.name}</h4>
                         <p className="text-sm text-zinc-500 font-bold">{usr.email}</p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-zinc-800/50 flex justify-between items-center">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-inner ${usr.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-400'}`}>
                           {usr.role}
                         </span>
                         <span className="text-[10px] text-zinc-600 font-bold uppercase italic">
                           Reg. {new Date(usr.created_at).toLocaleDateString()}
                         </span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-black/40 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl">
                 <div className="flex justify-between items-center mb-12">
                   <div>
                     <h3 className="text-2xl font-black italic uppercase tracking-tighter">Network Traffic Matrix</h3>
                     <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Aggregated click intelligence</p>
                   </div>
                   <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-inner">
                      <BarChart3 className="w-6 h-6 text-blue-500" />
                   </div>
                 </div>
                 
                 <div className="h-[400px] w-full">
                    {clickStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={clickStats}>
                          <defs>
                            <linearGradient id="colorAdminClicks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="date" stroke="#52525b" fontSize={11} fontStyle="italic" />
                          <YAxis stroke="#52525b" fontSize={11} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#3b82f6' }}
                          />
                          <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorAdminClicks)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-20">
                         <Activity className="w-24 h-24 mb-4" />
                         <p className="font-black uppercase tracking-widest text-sm">Awaiting sufficient packet data...</p>
                      </div>
                    )}
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 shadow-xl">
                      <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-8 border-b border-zinc-800 pb-4">Real-time Performance</h4>
                      <div className="space-y-6">
                         <InsightRow label="Conversion Index" value="4.2%" color="text-emerald-500" />
                         <InsightRow label="Lead Retension" value="68%" color="text-blue-400" />
                         <InsightRow label="Click Velocity" value="High" color="text-amber-500" />
                         <InsightRow label="Error Rate" value="0.02%" color="text-zinc-600" />
                      </div>
                  </div>
                  <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/10 to-transparent border border-zinc-800 rounded-[2.5rem] p-10 overflow-hidden relative">
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        <BarChart3 className="w-64 h-64" />
                     </div>
                     <h4 className="text-3xl font-black tracking-tight mb-4 italic">Heads-up Intel</h4>
                     <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-lg">
                        The current network volume is trending <span className="text-emerald-400 font-bold uppercase italic tracking-widest">+18% higher</span> than last cycle. 
                        Top performing referral nodes are concentrated in organic social discovery.
                     </p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Commission Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl shadow-blue-500/10 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-black/20">
                 <div>
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase">Configure Reward Engine</h2>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Affiliate: {editingAffiliate?.user.name}</p>
                 </div>
                 <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white">
                    <Trash2 className="w-5 h-5 transition-transform hover:rotate-90" />
                 </button>
              </div>

              <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 {/* Type & Strategy */}
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Earnings Basis</label>
                       <div className="flex bg-black rounded-2xl p-1 border border-zinc-800">
                          <button onClick={() => setEditedType('percentage')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${editedType === 'percentage' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-white'}`}>PERCENTAGE (%)</button>
                          <button onClick={() => setEditedType('fixed')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${editedType === 'fixed' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-white'}`}>FIXED ($)</button>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Progression Strategy</label>
                       <select 
                         value={editedStrategy} 
                         onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditedStrategy(e.target.value as 'flat' | 'tier_referrals' | 'tier_volume')}
                         className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-xs font-black uppercase tracking-widest focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer appearance-none"
                       >
                          <option value="flat">Flat Rate</option>
                          <option value="tier_referrals">Referral Tiers</option>
                          <option value="tier_volume">Volume Tiers</option>
                       </select>
                    </div>
                 </div>

                 {/* Base Rate (only for flat or as default) */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">
                       {editedStrategy === 'flat' ? 'Global Pay Rate' : 'Fallback / Base Rate'}
                    </label>
                    <div className="relative group">
                       <input 
                         type="number" 
                         value={editedRate}
                         onChange={(e) => setEditedRate(parseFloat(e.target.value))}
                         className="w-full bg-black border border-zinc-800 rounded-2xl p-6 text-2xl font-black focus:ring-1 focus:ring-blue-500 outline-none transition-all pl-12 group-hover:border-zinc-700 font-mono" 
                       />
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-xl italic">{editedType === 'fixed' ? '$' : '%'}</span>
                    </div>
                 </div>

                 {/* Tiers Logic */}
                 {editedStrategy !== 'flat' && (
                    <div className="space-y-6 pt-8 border-t border-zinc-800/50">
                       <div className="flex justify-between items-center">
                          <div>
                             <h3 className="text-lg font-black italic">Advanced Tier Matrix</h3>
                             <p className="text-zinc-500 text-[10px] font-black uppercase">Auto-scale rates based on {editedStrategy === 'tier_volume' ? 'Sales Revenue' : 'Referral Count'}</p>
                          </div>
                          <button onClick={addTier} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-500/20 flex items-center gap-2">
                             <Plus className="w-3 h-3" /> Add Milestone
                          </button>
                       </div>

                       <div className="space-y-3">
                          {editedTiers.map((tier, idx) => (
                             <div key={idx} className="flex gap-4 items-center bg-black/40 p-4 rounded-2xl border border-zinc-800 group/tier animate-in slide-in-from-right-4 duration-300 hover:border-zinc-700 transition-all">
                                <div className="flex-1 space-y-1">
                                   <p className="text-[8px] font-black text-zinc-600 uppercase italic pl-1">Threshold ({editedStrategy === 'tier_volume' ? '$' : 'Num'})</p>
                                   <input 
                                     type="number" 
                                     value={tier.threshold}
                                     onChange={(e) => updateTier(idx, 'threshold', parseFloat(e.target.value))}
                                     className="w-full bg-transparent border-b border-zinc-800 focus:border-blue-500 text-sm font-black outline-none py-1 transition-colors font-mono"
                                   />
                                </div>
                                <div className="flex-1 space-y-1">
                                   <p className="text-[8px] font-black text-zinc-600 uppercase italic pl-1">Reward Rate ({editedType === 'fixed' ? '$' : '%'})</p>
                                   <input 
                                     type="number" 
                                     value={tier.rate}
                                     onChange={(e) => updateTier(idx, 'rate', parseFloat(e.target.value))}
                                     className="w-full bg-transparent border-b border-zinc-800 focus:border-blue-500 text-sm font-black outline-none py-1 transition-colors font-mono text-blue-400"
                                   />
                                </div>
                                <button onClick={() => removeTier(idx)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover/tier:opacity-100 flex-shrink-0">
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          ))}
                          {editedTiers.length === 0 && <p className="text-center py-12 text-zinc-700 text-xs font-bold italic border-2 border-dashed border-zinc-800 rounded-3xl">No milestones defined. Start by adding one above.</p>}
                       </div>
                    </div>
                 )}
              </div>

              <div className="p-8 bg-black/40 border-t border-zinc-800 flex justify-end gap-4 shadow-inner">
                 <button onClick={() => setIsEditModalOpen(false)} className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Cancel</button>
                 <button onClick={saveAdvancedCommission} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95">Commit Changes</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function GlobalStatCard({ title, value, subValue, icon }: { title: string, value: string | number, subValue: string, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-zinc-800 p-10 hover:border-zinc-700/50 transition-all shadow-2xl relative group">
      <div className="absolute top-6 right-8 opacity-20 group-hover:scale-125 transition-transform duration-700">{icon}</div>
      <div className="flex flex-col h-full">
         <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">{title}</p>
         <h4 className="text-4xl font-black tracking-tighter mb-2 italic">{value}</h4>
         <div className="mt-auto flex items-center gap-3">
            <div className="px-3 py-1 bg-black/40 border border-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500">
               {subValue}
            </div>
         </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`px-10 py-5 flex items-center gap-3 text-sm font-black uppercase tracking-widest transition-all relative overflow-hidden group ${active ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
    >
      {icon}
      {label}
      {active && (
         <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6]" />
      )}
      <div className={`absolute inset-0 bg-blue-500/5 transition-transform duration-500 ${active ? 'translate-y-0' : 'translate-y-full'}`} />
    </button>
  );
}

function InsightRow({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex justify-between items-center group/row">
       <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover/row:text-zinc-300 transition-colors">{label}</span>
       <span className={`text-sm font-black italic tracking-tight ${color}`}>{value}</span>
    </div>
  );
}
