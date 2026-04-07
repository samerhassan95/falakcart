'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Link2, Copy, Check, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { StatCard } from '@/components/StatCard';

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
  const { t } = useTranslation();
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
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const filtered = links.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedLinks = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[44px]  text-[#191C1E] tracking-tight">{t('links.title')}</h1>
          <p className="text-[#505F76] mt-1 text-[16px]">{t('links.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-lg"

          style={{ background: 'linear-gradient(135deg, #2A14B4 0%, #4338CA 100%)' }}          >
          <Link2 className="w-4 h-4" />
          {t('links.createNewLink')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard
          icon={<svg width="20" height="10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 10H5C3.61667 10 2.4375 9.5125 1.4625 8.5375C0.4875 7.5625 0 6.38333 0 5C0 3.61667 0.4875 2.4375 1.4625 1.4625C2.4375 0.4875 3.61667 0 5 0H9V2H5C4.16667 2 3.45833 2.29167 2.875 2.875C2.29167 3.45833 2 4.16667 2 5C2 5.83333 2.29167 6.54167 2.875 7.125C3.45833 7.70833 4.16667 8 5 8H9V10ZM6 6V4H14V6H6ZM11 10V8H15C15.8333 8 16.5417 7.70833 17.125 7.125C17.7083 6.54167 18 5.83333 18 5C18 4.16667 17.7083 3.45833 17.125 2.875C16.5417 2.29167 15.8333 2 15 2H11V0H15C16.3833 0 17.5625 0.4875 18.5375 1.4625C19.5125 2.4375 20 3.61667 20 5C20 6.38333 19.5125 7.5625 18.5375 8.5375C17.5625 9.5125 16.3833 10 15 10H11Z" fill="#050C9C" />
          </svg>}
          iconBgColor="#3ABEF91A"
          label={t('links.totalLinks')}
          value={totalLinks.toString()}
          change="+12%"
          isPositive={true} backgroundSvg={undefined}
        />
        <StatCard

          iconBgColor="#3ABEF91A"
          label={t('links.clicks')}
          value={totalClicks.toLocaleString()}
          icon={<svg width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 20C5.06667 20 3.41667 19.3167 2.05 17.95C0.683333 16.5833 0 14.9333 0 13V7C0 5.06667 0.683333 3.41667 2.05 2.05C3.41667 0.683333 5.06667 0 7 0C8.93333 0 10.5833 0.683333 11.95 2.05C13.3167 3.41667 14 5.06667 14 7V13C14 14.9333 13.3167 16.5833 11.95 17.95C10.5833 19.3167 8.93333 20 7 20ZM8 7H12C12 5.8 11.6208 4.74167 10.8625 3.825C10.1042 2.90833 9.15 2.33333 8 2.1V7ZM2 7H6V2.1C4.85 2.33333 3.89583 2.90833 3.1375 3.825C2.37917 4.74167 2 5.8 2 7ZM7 18C8.38333 18 9.5625 17.5125 10.5375 16.5375C11.5125 15.5625 12 14.3833 12 13V9H2V13C2 14.3833 2.4875 15.5625 3.4625 16.5375C4.4375 17.5125 5.61667 18 7 18Z" fill="#050C9C" />
          </svg>}
          change="+12%"
          isPositive={true} backgroundSvg={undefined}
        />

        <StatCard

          iconBgColor="#3ABEF91A"
          label={t('earnings.totalEarnings')}
          value={`$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16H2ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10C8 9.45 7.80417 8.97917 7.4125 8.5875C7.02083 8.19583 6.55 8 6 8V10H8ZM18 10H20V8C19.45 8 18.9792 8.19583 18.5875 8.5875C18.1958 8.97917 18 9.45 18 10ZM13 9C13.8333 9 14.5417 8.70833 15.125 8.125C15.7083 7.54167 16 6.83333 16 6C16 5.16667 15.7083 4.45833 15.125 3.875C14.5417 3.29167 13.8333 3 13 3C12.1667 3 11.4583 3.29167 10.875 3.875C10.2917 4.45833 10 5.16667 10 6C10 6.83333 10.2917 7.54167 10.875 8.125C11.4583 8.70833 12.1667 9 13 9ZM6 4C6.55 4 7.02083 3.80417 7.4125 3.4125C7.80417 3.02083 8 2.55 8 2H6V4ZM20 4V2H18C18 2.55 18.1958 3.02083 18.5875 3.4125C18.9792 3.80417 19.45 4 20 4Z" fill="#050C9C" />
          </svg>}
          change="+12%"
          isPositive={true} backgroundSvg={undefined}
        />

      </div>

      {/* Active Campaigns Table */}
      <div className="bg-white rounded-2xl   overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-gray-50">
          <h3 className="text-lg font-bold text-[#191C1E]">{t('links.activeCampaigns')}</h3>
          <div className="relative">
            <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505F76]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder={t('links.searchLinks')}
              className="ps-10  py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-wider text-[#505F76] border-b border-gray-50">
              <th className="px-6 py-4">{t('links.linkName')}</th>
              <th className="px-6 py-4">{t('links.referralLink')}</th>
              <th className="px-6 py-4 text-center">{t('links.clicks')}</th>
              <th className="px-6 py-4 text-center">{t('links.conversions')}</th>
              <th className="px-6 py-4 text-right">{t('earnings.title')}</th>
              <th className="px-6 py-4 text-right">{t('links.dateCreated')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedLinks.map((link) => (
              <tr key={link.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-5">
                  <p className="font-semibold text-[#191C1E]">{link.name}</p>
                  <p className="text-xs text-[#505F76]">{t('links.generalTraffic')}</p>
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
                <td className="px-6 py-5 text-right font-bold text-emerald-600">${link.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-5 text-right text-sm text-[#505F76]">{link.created_at}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-[#505F76] text-sm">{t('links.noCampaignsFound')}</td></tr>
            )}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between text-sm text-[#505F76]">
            <span>Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} {t('links.campaigns')}</span>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={prevPage} className="px-3 py-1.5 border border-gray-200 rounded-lg text-[#505F76] hover:bg-gray-50 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed">{t('common.previous')}</button>
              <span className="text-[#191C1E] font-medium px-2">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={nextPage} className="px-3 py-1.5 border border-gray-200 rounded-lg text-[#505F76] hover:bg-gray-50 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed">{t('common.next')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#F2F4F6] rounded-2xl  px-6 py-12  ">
          <div className="flex items-center  gap-3 mb-3">
            <svg width="15" height="20" viewBox="0 0 15 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 20C6.95 20 6.47917 19.8042 6.0875 19.4125C5.69583 19.0208 5.5 18.55 5.5 18H9.5C9.5 18.55 9.30417 19.0208 8.9125 19.4125C8.52083 19.8042 8.05 20 7.5 20ZM3.5 17V15H11.5V17H3.5ZM3.75 14C2.6 13.3167 1.6875 12.4 1.0125 11.25C0.3375 10.1 0 8.85 0 7.5C0 5.41667 0.729167 3.64583 2.1875 2.1875C3.64583 0.729167 5.41667 0 7.5 0C9.58333 0 11.3542 0.729167 12.8125 2.1875C14.2708 3.64583 15 5.41667 15 7.5C15 8.85 14.6625 10.1 13.9875 11.25C13.3125 12.4 12.4 13.3167 11.25 14H3.75ZM4.35 12H10.65C11.4 11.4667 11.9792 10.8083 12.3875 10.025C12.7958 9.24167 13 8.4 13 7.5C13 5.96667 12.4667 4.66667 11.4 3.6C10.3333 2.53333 9.03333 2 7.5 2C5.96667 2 4.66667 2.53333 3.6 3.6C2.53333 4.66667 2 5.96667 2 7.5C2 8.4 2.20417 9.24167 2.6125 10.025C3.02083 10.8083 3.6 11.4667 4.35 12Z" fill="#050C9C" />
            </svg>
            <h3 className="font-bold text-[16px] text-[#191C1E]">{t('links.performanceTip')}</h3>
          </div>
          <p className="text-sm  text-[#505F76] leading-relaxed">
            {t('links.your')} <span className="font-semibold text-[#191C1E]">{t('links.summerCampaign')}</span> {t('links.conversionRateTip')}
          </p>
        </div>

        <div className="bg-[#050C9C]  flex flex-col items-start  justify-center  rounded-2xl px-6 py-12 text-white relative overflow-hidden">
          <div className="absolute -bottom-6 -end-6 w-32 h-32 bg-white/10 rounded-full" />
          <h3 className="text-[20px] font-bold text-white   mb-1">{t('links.scaleEarnings')}</h3>
          <p className=" text-[14px] text-[#3572EF] mb-4">{t('links.premiumTier')}</p>
          <button className="px-5 py-2.5 text-[#050C9c] bg-white p-4  rounded-full text-sm font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2">
            {t('links.upgradeNow')}
          </button>
        </div>
      </div>

      {/* Create Link Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-[#191C1E] mb-4">{t('links.createNewLink')}</h2>
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

function LinkStatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl  p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[16px] font-bold uppercase tracking-wider text-[#505F76] mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#191C1E] tracking-tight">{value}</p>
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
