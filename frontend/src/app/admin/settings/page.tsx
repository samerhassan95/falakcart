'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Settings, DollarSign, Bell, Shield, Users, Check, Loader2
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'general' | 'affiliate' | 'payout' | 'security' | 'notifications' | 'integrations'>('general');
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
  const [saved, setSaved] = useState(false);

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

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: any = {};
      
      if (activeTab === 'general') {
        payload.platform_name = platformName;
        payload.currency = currency;
        payload.timezone = timezone;
        payload.logo_branding = logoBranding;
      } else if (activeTab === 'affiliate') {
        payload.default_commission_rate = parseFloat(commissionRate);
        payload.cookie_duration = parseInt(cookieDuration, 10);
        payload.auto_approve = autoApprove;
      } else if (activeTab === 'payout') {
        payload.minimum_payout = parseFloat(minPayout);
        payload.payout_methods = payoutMethods;
        payload.payout_schedule = payoutSchedule;
      } else if (activeTab === 'security') {
        payload.two_factor_enabled = twoFactorEnabled;
        payload.session_timeout = parseInt(sessionTimeout, 10);
      } else if (activeTab === 'notifications') {
        payload.notification_preferences = notificationPrefs;
      } else if (activeTab === 'integrations') {
        payload.integration_api_key = integrationApiKey;
        payload.integration_status = integrationStatus;
      }

      await api.put('/admin/settings', payload);
      await fetchSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#191C1E] tracking-tight">{t('admin.settings')}</h1>
        <p className="text-sm sm:text-base text-[#505F76] mt-1">{t('admin.configureEcosystem')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'general'
                ? 'bg-indigo-50 text-[#050C9C]'
                : 'text-[#505F76] hover:bg-gray-50 hover:text-[#191C1E]'
            }`}
          >
            <Settings className="w-5 h-5" />
            {t('admin.general')}
          </button>
          <button
            onClick={() => setActiveTab('affiliate')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'affiliate'
                ? 'bg-indigo-50 text-[#050C9C]'
                : 'text-[#505F76] hover:bg-gray-50 hover:text-[#191C1E]'
            }`}
          >
            <Users className="w-5 h-5" />
            {t('admin.affiliate')}
          </button>
          <button
            onClick={() => setActiveTab('payout')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'payout'
                ? 'bg-indigo-50 text-[#050C9C]'
                : 'text-[#505F76] hover:bg-gray-50 hover:text-[#191C1E]'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            {t('admin.payout')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'security'
                ? 'bg-indigo-50 text-[#050C9C]'
                : 'text-[#505F76] hover:bg-gray-50 hover:text-[#191C1E]'
            }`}
          >
            <Shield className="w-5 h-5" />
            {t('admin.security')}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'notifications'
                ? 'bg-indigo-50 text-[#050C9C]'
                : 'text-[#505F76] hover:bg-gray-50 hover:text-[#191C1E]'
            }`}
          >
            <Bell className="w-5 h-5" />
            {t('admin.notifications')}
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'integrations'
                ? 'bg-indigo-50 text-[#050C9C]'
                : 'text-[#505F76] hover:bg-gray-50 hover:text-[#191C1E]'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2C10.5523 2 11 2.44772 11 3V5C11 5.55228 10.5523 6 10 6C9.44772 6 9 5.55228 9 5V3C9 2.44772 9.44772 2 10 2Z" fill="currentColor"/>
              <path d="M10 14C10.5523 14 11 14.4477 11 15V17C11 17.5523 10.5523 18 10 18C9.44772 18 9 17.5523 9 17V15C9 14.4477 9.44772 14 10 14Z" fill="currentColor"/>
              <path d="M3 10C3 9.44772 3.44772 9 4 9H6C6.55228 9 7 9.44772 7 10C7 10.5523 6.55228 11 6 11H4C3.44772 11 3 10.5523 3 10Z" fill="currentColor"/>
              <path d="M13 10C13 9.44772 13.4477 9 14 9H16C16.5523 9 17 9.44772 17 10C17 10.5523 16.5523 11 16 11H14C13.4477 11 13 10.5523 13 10Z" fill="currentColor"/>
              <path d="M5.75736 4.34315C6.14788 3.95262 6.78105 3.95262 7.17157 4.34315L8.58579 5.75736C8.97631 6.14788 8.97631 6.78105 8.58579 7.17157C8.19526 7.5621 7.5621 7.5621 7.17157 7.17157L5.75736 5.75736C5.36683 5.36683 5.36683 4.73367 5.75736 4.34315Z" fill="currentColor"/>
              <path d="M11.4142 12.8284C11.8047 12.4379 12.4379 12.4379 12.8284 12.8284L14.2426 14.2426C14.6332 14.6332 14.6332 15.2663 14.2426 15.6569C13.8521 16.0474 13.2189 16.0474 12.8284 15.6569L11.4142 14.2426C11.0237 13.8521 11.0237 13.2189 11.4142 12.8284Z" fill="currentColor"/>
              <path d="M14.2426 4.34315C14.6332 4.73367 14.6332 5.36683 14.2426 5.75736L12.8284 7.17157C12.4379 7.5621 11.8047 7.5621 11.4142 7.17157C11.0237 6.78105 11.0237 6.14788 11.4142 5.75736L12.8284 4.34315C13.2189 3.95262 13.8521 3.95262 14.2426 4.34315Z" fill="currentColor"/>
              <path d="M8.58579 12.8284C8.97631 13.2189 8.97631 13.8521 8.58579 14.2426L7.17157 15.6569C6.78105 16.0474 6.14788 16.0474 5.75736 15.6569C5.36683 15.2663 5.36683 14.6332 5.75736 14.2426L7.17157 12.8284C7.5621 12.4379 8.19526 12.4379 8.58579 12.8284Z" fill="currentColor"/>
            </svg>
            {t('admin.integrations')}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#191C1E]">{t('admin.generalSettings')}</h2>
                <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('admin.platformName')}</label>
                    <input 
                      type="text"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                      placeholder="Lucid Stratum"
                    />
                  </div>

                  <div>
                    <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('admin.defaultCurrency')}</label>
                    <div className="relative">
                      <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors appearance-none"
                      >
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                      </select>
                      <svg className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505F76] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('admin.timeZone')}</label>
                    <div className="relative">
                      <select 
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors appearance-none"
                      >
                        <option>UTC +00:00</option>
                        <option>EST -05:00</option>
                        <option>PST -08:00</option>
                      </select>
                      <svg className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505F76] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('admin.logoBranding')}</label>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold text-lg">{logoBranding}</span>
                      </div>
                      <button className="px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm font-medium hover:bg-gray-200 transition-colors">
                        {t('admin.replaceLogo')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-full font-semibold text-sm"
                  >
                    {loading ? t('common.saving') : t('admin.saveGeneralChanges')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Affiliate Tab */}
          {activeTab === 'affiliate' && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#191C1E]">{t('admin.affiliatePerformance')}</h2>
                <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('admin.defaultCommissionRate')}</label>
                    <input 
                      type="number"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                      placeholder="15"
                    />
                  </div>

                  <div>
                    <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('admin.cookieDuration')}</label>
                    <input 
                      type="number"
                      value={cookieDuration}
                      onChange={(e) => setCookieDuration(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F2F4F6] rounded-xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#191C1E]">{t('admin.autoApproveAffiliates')}</p>
                      <p className="text-[12px] text-[#505F76]">{t('admin.newSignupsBypass')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoApprove(!autoApprove)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      autoApprove ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      autoApprove ? 'rtl:translate-x-[-1.5rem] ltr:translate-x-6' : 'rtl:translate-x-[-0.25rem] ltr:translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex justify-center pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-full font-semibold text-sm"
                  >
                    {loading ? t('common.saving') : t('admin.updateRules')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payout Tab */}
          {activeTab === 'payout' && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-[#191C1E] mb-6">{t('admin.payoutProtocol')}</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('admin.minimumPayout')}</label>
                  <div className="relative">
                    <span className="absolute start-4 top-1/2 -translate-y-1/2 text-[#505F76] font-semibold">$</span>
                    <input 
                      type="number"
                      value={minPayout}
                      onChange={(e) => setMinPayout(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                      placeholder="100.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('admin.methods')}</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-[#F2F4F6] rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={payoutMethods.paypal}
                        onChange={(e) => setPayoutMethods(prev => ({ ...prev, paypal: e.target.checked }))}
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <span className="text-[14px] font-medium text-[#191C1E]">PayPal</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-[#F2F4F6] rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={payoutMethods.directBank}
                        onChange={(e) => setPayoutMethods(prev => ({ ...prev, directBank: e.target.checked }))}
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <span className="text-[14px] font-medium text-[#191C1E]">{t('admin.directBank')}</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-[#F2F4F6] rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={payoutMethods.crypto}
                        onChange={(e) => setPayoutMethods(prev => ({ ...prev, crypto: e.target.checked }))}
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <span className="text-[14px] font-medium text-[#191C1E]">{t('admin.crypto')}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('admin.schedule')}</label>
                  <div className="relative">
                    <select
                      value={payoutSchedule}
                      onChange={(e) => setPayoutSchedule(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors appearance-none"
                    >
                      <option>{t('admin.monthly')}</option>
                      <option>{t('admin.biweekly')}</option>
                      <option>{t('admin.weekly')}</option>
                    </select>
                    <svg className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505F76] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-full font-semibold text-sm"
                  >
                    {loading ? t('common.saving') : t('admin.saveSchedule')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#191C1E]">{t('admin.security')}</h2>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">{t('admin.active')}</span>
              </div>
              
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 bg-[#F2F4F6] rounded-xl hover:bg-gray-200 transition-colors">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-[14px] font-medium text-[#191C1E]">{t('admin.rotatePassword')}</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="flex items-center justify-between p-4 bg-[#F2F4F6] rounded-xl">
                  <span className="text-[14px] font-medium text-[#191C1E]">{t('admin.twoFactor')}</span>
                  <button
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      twoFactorEnabled ? 'bg-gray-300' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      twoFactorEnabled ? 'rtl:translate-x-[-1.5rem] ltr:translate-x-6' : 'rtl:translate-x-[-0.25rem] ltr:translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-[10px] font-bold text-[#505F76] uppercase tracking-wider mb-3">{t('admin.recentSessions')}</p>
                  <div className="flex items-center gap-3 p-3 bg-[#F2F4F6] rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#191C1E]">macOS - San Francisco, US</p>
                      <p className="text-[12px] text-[#505F76]">{t('admin.currentSession')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-[#191C1E] mb-6">{t('admin.integrations')}</h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-[#F2F4F6] rounded-xl">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#191C1E] text-sm">azlakCart</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {t('admin.connected')}
                  </span>
                </div>

                <div>
                  <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('admin.masterApiKey')}</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={integrationApiKey}
                      onChange={(e) => setIntegrationApiKey(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors pr-12"
                      placeholder="••••••••••••••"
                    />
                    <button className="absolute end-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-[#191C1E] mb-2">{t('admin.notificationPreferences')}</h2>
              <p className="text-[#505F76] text-xs sm:text-sm mb-6">{t('admin.controlAlerts')}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-4 bg-[#F2F4F6] rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.newAffiliates}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, newAffiliates: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="text-[14px] font-medium text-[#191C1E]">{t('admin.newAffiliates')}</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-[#F2F4F6] rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.newPayouts}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, newPayouts: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="text-[14px] font-medium text-[#191C1E]">{t('admin.newPayouts')}</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-[#F2F4F6] rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.systemErrors}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, systemErrors: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="text-[14px] font-medium text-[#191C1E]">{t('admin.systemErrors')}</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-[#F2F4F6] rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.commissions}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, commissions: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="text-[14px] font-medium text-[#191C1E]">{t('earnings.commission')}</span>
                </label>
              </div>

              <div className="flex justify-center pt-6">
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-full font-semibold text-sm"
                >
                  {loading ? t('common.saving') : t('admin.savePreferences')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Global Save Button - Outside tabs */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-10 py-4 disabled:opacity-50 text-white rounded-full font-bold transition-all hover:shadow-lg"
            style={{
              background: 'linear-gradient(106.83deg, #2A14B4 0%, #4338CA 100%)',
              fontSize: '14px',
              boxShadow: '0px 4px 6px -4px #6366F133, 0px 10px 15px -3px #6366F133'
            }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('admin.applying')}
              </div>
            ) : saved ? (
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                {t('admin.allSettingsApplied')}
              </div>
            ) : (
              t('admin.globalSaveApplyAll')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}