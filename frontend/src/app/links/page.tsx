'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Link2, MousePointerClick, DollarSign, Copy, Check, Plus, Lightbulb, ArrowRight } from 'lucide-react';

interface LinkItem {
  id: number;
  name: string;
  slug: string;
  referral_url: string;
  clicks: number;
  conversions: number;
  earnings: number;
  is_active: boolean;
  created_at: string;
}

function MyLinksContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(() => searchParams.get('create') === 'true');
  const [newLinkName, setNewLinkName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2; // Reduced for easier testing of pagination

  const fetchLinks = useCallback(async () => {
    setIsFetching(true);
    try {
      const { data } = await api.get('/affiliate/links');
      setLinks(data);
    } catch (err) {
      console.error('Error fetching links', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'affiliate') fetchLinks();
  }, [user, fetchLinks]);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreate(true);
    }
  }, [searchParams]);

  const copyLink = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createLink = async () => {
    if (!newLinkName.trim()) return;
    try {
      await api.post('/affiliate/links', { name: newLinkName });
      setNewLinkName('');
      setShowCreate(false);
      fetchLinks();
    } catch (err) {
      console.error('Error creating link', err);
    }
  };

  const totalLinks = links.length;
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const totalEarnings = links.reduce((sum, l) => sum + l.earnings, 0);

  if (loading || isFetching) return (
    <AppLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  const filtered = links.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedLinks = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Referral Links</h1>
            <p className="text-gray-500 mt-1">Create, manage, and track your affiliate links across all campaigns.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-indigo-200"
          >
            <Link2 className="w-4 h-4" />
            Create New Link
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6">
          <LinkStatCard label="Total Links" value={totalLinks.toString()} icon={<Link2 className="w-5 h-5 text-indigo-600" />} />
          <LinkStatCard label="Total Clicks" value={totalClicks.toLocaleString()} icon={<MousePointerClick className="w-5 h-5 text-indigo-600" />} />
          <LinkStatCard label="Total Earnings" value={`$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<DollarSign className="w-5 h-5 text-indigo-600" />} />
        </div>

        {/* Active Campaigns Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-900">Active Campaigns</h3>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search links..."
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-50">
                <th className="px-6 py-4">Link Name</th>
                <th className="px-6 py-4">Referral Link</th>
                <th className="px-6 py-4 text-center">Clicks</th>
                <th className="px-6 py-4 text-center">Conversions</th>
                <th className="px-6 py-4 text-right">Earnings</th>
                <th className="px-6 py-4 text-right">Date Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-gray-900">{link.name}</p>
                    <p className="text-xs text-gray-400">General Traffic</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-mono font-medium truncate max-w-[200px]">
                        {link.referral_url}
                      </span>
                      <button
                        onClick={() => copyLink(link.id, link.referral_url)}
                        className="text-gray-300 hover:text-indigo-600 transition-colors"
                      >
                        {copiedId === link.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-semibold text-gray-900">{link.clicks.toLocaleString()}</td>
                  <td className="px-6 py-5 text-center font-semibold text-gray-900">{link.conversions}</td>
                  <td className="px-6 py-5 text-right font-bold text-emerald-600">${link.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-5 text-right text-sm text-gray-400">{link.created_at}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No campaigns found. Create your first link above!</td></tr>
              )}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-400">
              <span>Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} campaigns</span>
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={prevPage} className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                <span className="text-gray-900 font-medium px-2">{currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={nextPage} className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-900">Performance Tip</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your <span className="font-semibold text-gray-900">Summer Campaign</span> link has a conversion rate of 6.9%. Consider sharing this specific link on high-traffic social platforms to maximize your earnings this week.
            </p>
          </div>

          <div className="bg-indigo-600 rounded-2xl p-6 shadow-md text-white relative overflow-hidden">
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <h3 className="text-xl font-bold mb-1">Scale Your Earnings</h3>
            <p className="text-indigo-200 text-sm mb-4">Join the Premium Affiliate tier for 2x rewards.</p>
            <button className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2">
              Upgrade Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Link Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Link</h2>
            <input
              type="text"
              placeholder="Campaign name (e.g. Summer Promo)"
              value={newLinkName}
              onChange={(e) => setNewLinkName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
              <button onClick={createLink} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Link
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function LinkStatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">{icon}</div>
      </div>
    </div>
  );
}

export default function MyLinksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyLinksContent />
    </Suspense>
  );
}
