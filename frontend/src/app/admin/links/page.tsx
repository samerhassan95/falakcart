'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Copy, Check, Plus, Link2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { StatCard } from '@/components/StatCard';

interface LinkItem {
  id: number;
  name: string;
  slug: string;
  referral_url: string;
  clicks: number;
  conversions: number;
  is_active: boolean;
  affiliate_name: string;
  affiliate_id: number;
  created_at: string;
}

export default function AdminLinksPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLinks = useCallback(async () => {
    setIsFetching(true);
    try {
      const { data } = await api.get('/admin/links');
      setLinks(data);
    } catch (err) {
      console.error('Error fetching links', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') fetchLinks();
  }, [user, fetchLinks]);

  const copyLink = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createLink = async () => {
    if (!newLinkName.trim()) return;
    try {
      await api.post('/admin/links', { name: newLinkName });
      setNewLinkName('');
      setShowCreate(false);
      fetchLinks();
    } catch (err) {
      console.error('Error creating link', err);
    }
  };

  const totalLinks = links.length;
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const totalConversions = links.reduce((sum, l) => sum + l.conversions, 0);

  if (loading || isFetching) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const filtered = links.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.affiliate_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedLinks = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-[44px] text-[#191C1E] tracking-tight">{t('admin.allLinks')}</h1>
          <p className="text-[#505F76] mt-1 text-sm sm:text-[16px]">{t('admin.manageAllAffiliateLinks')}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
          style={{ background: 'linear-gradient(135deg, #2A14B4 0%, #4338CA 100%)' }}
        >
          <Link2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('links.createNewLink')}</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          icon={<svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 10H5C3.61667 10 2.4375 9.5125 1.4625 8.5375C0.4875 7.5625 0 6.38333 0 5C0 3.61667 0.4875 2.4375 1.4625 1.4625C2.4375 0.4875 3.61667 0 5 0H9V2H5C4.16667 2 3.45833 2.29167 2.875 2.875C2.29167 3.45833 2 4.16667 2 5C2 5.83333 2.29167 6.54167 2.875 7.125C3.45833 7.70833 4.16667 8 5 8H9V10ZM6 6V4H14V6H6ZM11 10V8H15C15.8333 8 16.5417 7.70833 17.125 7.125C17.7083 6.54167 18 5.83333 18 5C18 4.16667 17.7083 3.45833 17.125 2.875C16.5417 2.29167 15.8333 2 15 2H11V0H15C16.3833 0 17.5625 0.4875 18.5375 1.4625C19.5125 2.4375 20 3.61667 20 5C20 6.38333 19.5125 7.5625 18.5375 8.5375C17.5625 9.5125 16.3833 10 15 10H11Z" fill="#050C9C" />
          </svg>}
          iconBgColor="#3ABEF91A"
          label={t('links.totalLinks')}
          value={totalLinks.toString()}
          change="+12%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          iconBgColor="#3ABEF91A"
          label={t('links.clicks')}
          value={totalClicks.toLocaleString()}
          icon={<svg width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 20C5.06667 20 3.41667 19.3167 2.05 17.95C0.683333 16.5833 0 14.9333 0 13V7C0 5.06667 0.683333 3.41667 2.05 2.05C3.41667 0.683333 5.06667 0 7 0C8.93333 0 10.5833 0.683333 11.95 2.05C13.3167 3.41667 14 5.06667 14 7V13C14 14.9333 13.3167 16.5833 11.95 17.95C10.5833 19.3167 8.93333 20 7 20ZM8 7H12C12 5.8 11.6208 4.74167 10.8625 3.825C10.1042 2.90833 9.15 2.33333 8 2.1V7ZM2 7H6V2.1C4.85 2.33333 3.89583 2.90833 3.1375 3.825C2.37917 4.74167 2 5.8 2 7ZM7 18C8.38333 18 9.5625 17.5125 10.5375 16.5375C11.5125 15.5625 12 14.3833 12 13V9H2V13C2 14.3833 2.4875 15.5625 3.4625 16.5375C4.4375 17.5125 5.61667 18 7 18Z" fill="#050C9C" />
          </svg>}
          change="+12%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          iconBgColor="#3ABEF91A"
          label={t('links.conversions')}
          value={totalConversions.toString()}
          icon={<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.625 13.025L0 11.85L5 3.85L8 7.35L12 0.85L15 5.35L18.375 0L20 1.175L15.05 9.025L12.075 4.55L8.275 10.725L5.25 7.2L1.625 13.025ZM13.5 17C14.2 17 14.7917 16.7583 15.275 16.275C15.7583 15.7917 16 15.2 16 14.5C16 13.8 15.7583 13.2083 15.725 12.725C11.2417 13.2083 11 13.8 11 14.5C11 15.2 11.2417 15.7917 11.725 16.275C12.2083 16.7583 12.8 17 13.5 17ZM18.6 21L15.9 18.3C15.55 18.5333 15.1708 18.7083 14.7625 18.825C14.3542 18.9417 13.9333 19 13.5 19C12.25 19 11.1875 18.5625 10.3125 17.6875C9.4375 16.8125 9 15.75 9 14.5C9 13.25 9.4375 12.1875 10.3125 11.3125C11.1875 10.4375 12.25 10 13.5 10C14.75 10 15.8125 10.4375 16.6875 11.3125C17.5625 12.1875 18 13.25 18 14.5C18 14.9333 17.9417 15.3542 17.825 15.7625C17.7083 16.1708 17.5333 16.55 17.3 16.9L20 19.6L18.6 21Z" fill="#EA580C"/>
          </svg>}
          change="+12%"
          isPositive={true}
          backgroundSvg={undefined}
        />
      </div>

      {/* Links Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-50">
          <h3 className="text-base sm:text-lg font-bold text-[#191C1E]">{t('admin.allAffiliateLinks')}</h3>
          <div className="relative">
            <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505F76]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder={t('admin.searchLinks')}
              className="w-full sm:w-auto ps-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-[#505F76] border-b border-gray-50">
                <th className="px-6 py-4">{t('links.linkName')}</th>
                <th className="px-6 py-4">{t('admin.affiliate')}</th>
                <th className="px-6 py-4">{t('links.referralLink')}</th>
                <th className="px-6 py-4 text-center">{t('links.clicks')}</th>
                <th className="px-6 py-4 text-center">{t('links.conversions')}</th>
                <th className="px-6 py-4 text-right">{t('links.dateCreated')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-[#191C1E]">{link.name}</p>
                    <p className="text-xs text-[#505F76]">ID: {link.id}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-semibold text-[#191C1E]">{link.affiliate_name}</p>
                    <p className="text-xs text-[#505F76]">ID: {link.affiliate_id}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-indigo-50 text-[#050C9C] rounded-lg text-xs font-mono font-medium truncate max-w-[200px]">
                        {link.referral_url}
                      </span>
                      <button
                        onClick={() => copyLink(link.id, link.referral_url)}
                        className="text-gray-300 hover:text-[#050C9C] transition-colors"
                      >
                        {copiedId === link.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-semibold text-[#191C1E]">{link.clicks.toLocaleString()}</td>
                  <td className="px-6 py-5 text-center font-semibold text-[#191C1E]">{link.conversions}</td>
                  <td className="px-6 py-5 text-right text-sm text-[#505F76]">{link.created_at}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[#505F76] text-sm">{t('admin.noLinksFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#505F76]">
            <span className="text-xs sm:text-sm">Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} links</span>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={prevPage} className="px-3 py-1.5 border border-gray-200 rounded-lg text-[#505F76] hover:bg-gray-50 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed">{t('common.previous')}</button>
              <span className="text-[#191C1E] font-medium px-2">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={nextPage} className="px-3 py-1.5 border border-gray-200 rounded-lg text-[#505F76] hover:bg-gray-50 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed">{t('common.next')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Link Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-[#191C1E] mb-4">{t('links.createNewLink')}</h2>
            <input
              type="text"
              placeholder={t('links.campaignNamePlaceholder')}
              value={newLinkName}
              onChange={(e) => setNewLinkName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-[#505F76] hover:text-gray-700 text-sm font-medium">{t('common.cancel')}</button>
              <button onClick={createLink} className="px-6 py-2.5 bg-indigo-600 hover:bg-[#050C9C] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> {t('links.createLink')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}