'use client';

import { useAuth } from '@/context/AuthContext';
import { User, Mail, Bell, Shield, Wallet, Save, Loader2, Check, Upload, Eye, EyeOff, CreditCard, Building, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'payout' | 'notifications' | 'referrals' | 'security'>('profile');
  const [avatar, setAvatar] = useState<string | null>(null);

  // Payout settings
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [iban, setIban] = useState('');
  const [minimumPayout, setMinimumPayout] = useState(50);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);

  // Referral preferences
  const [defaultLinkDestination, setDefaultLinkDestination] = useState('homepage');

  // Security settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      loadProfile();
      loadPayoutSettings();
      loadNotificationSettings();
      loadSecuritySettings();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/affiliate/profile');
      setBio(data.bio || '');
      setPhone(data.phone || '');
      setAvatar(data.avatar || null);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const loadPayoutSettings = async () => {
    try {
      const { data } = await api.get('/affiliate/payout-settings');
      setBankName(data.bank_name || '');
      setAccountNumber(data.account_number || '');
      setAccountHolderName(data.account_holder_name || '');
      setIban(data.iban || '');
      setMinimumPayout(data.minimum_payout || 50);
    } catch (err) {
      console.error('Error loading payout settings:', err);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const { data } = await api.get('/affiliate/notification-settings');
      setEmailNotifications(data.email_notifications ?? true);
      setSmsNotifications(data.sms_notifications ?? false);
      setMarketingEmails(data.marketing_emails ?? true);
      setWeeklyReports(data.weekly_reports ?? true);
    } catch (err) {
      console.error('Error loading notification settings:', err);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const { data } = await api.get('/affiliate/security-settings');
      setTwoFactorEnabled(data.two_factor_enabled ?? false);
    } catch (err) {
      console.error('Error loading security settings:', err);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'profile') {
        await api.put('/affiliate/profile', {
          name: name.trim(),
          bio: bio.trim(),
          phone: phone.trim(),
          avatar: avatar
        });
        // Trigger avatar update event for AppLayout
        window.dispatchEvent(new CustomEvent('avatarUpdated'));
      } else if (activeTab === 'payout') {
        await api.put('/affiliate/payout-settings', {
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          account_holder_name: accountHolderName.trim() || user?.name,
          iban: iban.trim(),
          minimum_payout: minimumPayout
        });
      } else if (activeTab === 'notifications') {
        await api.put('/affiliate/notification-settings', {
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
          marketing_emails: marketingEmails,
          weekly_reports: weeklyReports
        });
      } else if (activeTab === 'referrals') {
        await api.put('/affiliate/referral-settings', {
          default_link_destination: defaultLinkDestination
        });
      } else if (activeTab === 'security') {
        if (newPassword) {
          await api.put('/affiliate/change-password', {
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: confirmPassword
          });
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      alert(err.response?.data?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      const { data } = await api.post('/affiliate/toggle-2fa');
      setTwoFactorEnabled(data.enabled);
      alert(data.message);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle 2FA');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 ">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#191C1E] tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm sm:text-base text-[#505F76] mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'profile'
                ? 'bg-indigo-50 text-[#050C9C]'
                : 'text-[#505F76] hover:bg-gray-50 hover:text-[#191C1E]'
              }`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.87187 8.1525C6.79687 8.145 6.70687 8.145 6.62437 8.1525C4.83937 8.0925 3.42188 6.63 3.42188 4.83C3.42187 2.9925 4.90688 1.5 6.75188 1.5C8.58938 1.5 10.0819 2.9925 10.0819 4.83C10.0744 6.63 8.65688 8.0925 6.87187 8.1525Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path opacity="0.4" d="M12.3084 3C13.7634 3 14.9334 4.1775 14.9334 5.625C14.9334 7.0425 13.8084 8.1975 12.4059 8.25C12.3459 8.2425 12.2784 8.2425 12.2109 8.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.11906 10.92C1.30406 12.135 1.30406 14.115 3.11906 15.3225C5.18156 16.7025 8.56406 16.7025 10.6266 15.3225C12.4416 14.1075 12.4416 12.1275 10.6266 10.92C8.57156 9.5475 5.18906 9.5475 3.11906 10.92Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path opacity="0.4" d="M13.7578 15C14.2978 14.8875 14.8078 14.67 15.2278 14.3475C16.3978 13.47 16.3978 12.0225 15.2278 11.145C14.8153 10.83 14.3128 10.62 13.7803 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('notifications.myProfile')}
          </button>
          <button
            onClick={() => setActiveTab('payout')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'payout'
                ? 'bg-indigo-50 text-[#050C9C]'
                : 'text-[#505F76] hover:bg-gray-50 hover:text-[#191C1E]'
              }`}
          >
            <Wallet className="w-5 h-5" /> {t('settings.payoutMethods')}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'notifications'
                ? 'bg-indigo-50 text-[#050C9C]'
                : 'text-[#505F76] hover:bg-gray-50 hover:text-[#191C1E]'
              }`}
          >
            <Bell className="w-5 h-5" /> {t('settings.notificationPreferences')}
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'referrals'
                ? 'bg-indigo-50 text-[#050C9C]'
                : 'text-[#505F76] hover:bg-gray-50 hover:text-[#191C1E]'
              }`}
          >
            <User className="w-5 h-5" /> {t('settings.referralPreferences')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'security'
                ? 'bg-indigo-50 text-[#050C9C]'
                : 'text-[#505F76] hover:bg-gray-50 hover:text-[#191C1E]'
              }`}
          >
            <Shield className="w-5 h-5" /> {t('settings.securitySettings')}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
              <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">

                <h2 className="text-lg sm:text-xl font-bold text-[#191C1E] mb-2">{t('settings.profileInformation')}</h2>
                <p className="text-[#505F76] text-xs sm:text-sm mb-4">Update your personal information and profile picture</p>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center lg:items-start">
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          user?.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div
                        className="absolute -bottom-1 -end-1 w-8 h-8 bg-[#050C9C] rounded-full flex items-center justify-center cursor-pointer"
                        style={{
                          boxShadow: '0px 4px 6px -4px #0000001A, 0px 10px 15px -3px #0000001A'
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.05 8.4H1.79812L6.93 3.26812L6.18187 2.52L1.05 7.65188V8.4ZM0 9.45V7.21875L6.93 0.301875C7.035 0.205625 7.15094 0.13125 7.27781 0.07875C7.40469 0.02625 7.53812 0 7.67812 0C7.81812 0 7.95375 0.02625 8.085 0.07875C8.21625 0.13125 8.33 0.21 8.42625 0.315L9.14812 1.05C9.25312 1.14625 9.32969 1.26 9.37781 1.39125C9.42594 1.5225 9.45 1.65375 9.45 1.785C9.45 1.925 9.42594 2.05844 9.37781 2.18531C9.32969 2.31219 9.25312 2.42813 9.14812 2.53312L2.23125 9.45H0ZM8.4 1.785L7.665 1.05L8.4 1.785ZM6.54937 2.90062L6.18187 2.52L6.93 3.26812L6.54937 2.90062Z" fill="white" />
                          </svg>

                        </label>
                      </div>
                    </div>
                    <button className="mt-4 text-[#94A3B8] text-[10px] font-medium hover:text-[#4F46E5] transition-colors">
                      {t('settings.changeAvatar').toUpperCase()}
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('settings.fullName')}</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-6 py-4 border-1 border-[#6B7280] rounded-[16px] text-[#191C1E] text-[14px] focus:outline-none focus:border-[#4F46E5] transition-colors"
                          placeholder="Falak Guest"
                        />
                      </div>
                      <div>
                        <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('settings.emailAddress')}</label>
                        <input
                          type="email"
                          defaultValue={user?.email}
                          readOnly
                          className="w-full px-6 py-4 border-1 border-[#6B7280] rounded-[16px] text-[#191C1E] text-[14px] bg-gray-50 focus:outline-none"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('common.phone')}</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-6 py-4 border-1 border-[#6B7280] rounded-[16px] text-[#191C1E] text-[14px] focus:outline-none focus:border-[#4F46E5] transition-colors"
                          placeholder="+971 XX XXX XXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('settings.bio')}</label>
                        <input
                          type="text"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full px-6 py-4 border-1 border-[#6B7280] rounded-[16px] text-[#191C1E] text-[14px] focus:outline-none focus:border-[#4F46E5] transition-colors"
                          placeholder="Your professional bio..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Payout Methods Tab */}
          {activeTab === 'payout' && (
            <>
              <div className="relative p-4 sm:p-6 lg:p-8 rounded-2xl overflow-hidden bg-white "
                style={{
                  boxShadow: '0px 12px 32px 0px #2A14B40F',
                  border: '1px solid #3ABEF91A'
                }}>

                <div className="relative z-10">
                  {/* Header inside card */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#050C9C' }}
                    >
                      <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2H10C8.81667 2 7.85417 2.37083 7.1125 3.1125C6.37083 3.85417 6 4.81667 6 6V12C6 13.1833 6.37083 14.1458 7.1125 14.8875C7.85417 15.6292 8.81667 16 10 16H18C18 16.55 17.8042 17.0208 17.4125 17.4125C17.0208 17.8042 16.55 18 16 18H2ZM10 14C9.45 14 8.97917 13.8042 8.5875 13.4125C8.19583 13.0208 8 12.55 8 12V6C8 5.45 8.19583 4.97917 8.5875 4.5875C8.97917 4.19583 9.45 4 10 4H17C17.55 4 18.0208 4.19583 18.4125 4.5875C18.8042 4.97917 19 5.45 19 6V12C19 12.55 18.8042 13.0208 18.4125 13.4125C18.0208 13.8042 17.55 14 17 14H10ZM13 10.5C13.4333 10.5 13.7917 10.3583 14.075 10.075C14.3583 9.79167 14.5 9.43333 14.5 9C14.5 8.56667 14.3583 8.20833 14.075 7.925C13.7917 7.64167 13.4333 7.5 13 7.5C12.5667 7.5 12.2083 7.64167 11.925 7.925C11.6417 8.20833 11.5 8.56667 11.5 9C11.5 9.43333 11.6417 9.79167 11.925 10.075C12.2083 10.3583 12.5667 10.5 13 10.5Z" fill="white" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-[#191C1E]">{t('settings.bankTransferInfo')}</h2>
                      <p className="text-[#505F76] text-xs sm:text-sm">{t('settings.bankDetailsDescription')}</p>
                    </div>
                  </div>

                  {/* Payment Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    <div>
                      <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('settings.bankName')}</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                        placeholder="e.g., ADCB, Emirates NBD"
                      />
                    </div>

                    <div>
                      <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('settings.accountHolderName')}</label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                        placeholder="As it appears on your bank account"
                      />
                    </div>

                    <div>
                      <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('settings.accountNumber')}</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                        placeholder="123456789"
                      />
                    </div>

                    <div>
                      <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('settings.iban')}</label>
                      <input
                        type="text"
                        value={iban}
                        onChange={(e) => setIban(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                        placeholder="AE76 0000 0000 0000 0000 000"
                      />
                    </div>

                    <div>
                      <label className="block text-[#505F76] text-[12px] font-medium mb-3 uppercase tracking-wider">{t('settings.minimumPayout')}</label>
                      <input
                        type="number"
                        value={minimumPayout}
                        onChange={(e) => setMinimumPayout(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors"
                        min="50"
                      />
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 sm:p-4 flex items-start sm:items-center gap-3">
                    <div className="w-5 h-5 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-[#1E40AF] text-sm">
                      Your payment details are stored securely using bank-grade encryption.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <>
              <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-[#191C1E] mb-6 sm:mb-8">{t('settings.notificationPreferences')}</h2>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-wrap items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-[#191C1E] mb-1">{t('settings.emailNotifications')}</p>
                      <p className="text-[12px] text-[#505F76]">{t('settings.emailNotificationsDesc')}</p>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${emailNotifications ? 'bg-[#050C9C]' : 'bg-gray-200'
                        }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${emailNotifications ? 'rtl:translate-x-[-1.5rem] ltr:translate-x-6' : 'rtl:translate-x-[-0.25rem] ltr:translate-x-1'
                        }`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-[#191C1E] mb-1">SMS Notifications</p>
                      <p className="text-[12px] text-[#505F76]">Receive critical alerts via SMS</p>
                    </div>
                    <button
                      onClick={() => setSmsNotifications(!smsNotifications)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${smsNotifications ? 'bg-[#050C9C]' : 'bg-gray-200'
                        }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${smsNotifications ? 'rtl:translate-x-[-1.5rem] ltr:translate-x-6' : 'rtl:translate-x-[-0.25rem] ltr:translate-x-1'
                        }`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-[#191C1E] mb-1">Marketing Emails</p>
                      <p className="text-[12px] text-[#505F76]">Newsletter and product updates</p>
                    </div>
                    <button
                      onClick={() => setMarketingEmails(!marketingEmails)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${marketingEmails ? 'bg-[#050C9C]' : 'bg-gray-200'
                        }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${marketingEmails ? 'rtl:translate-x-[-1.5rem] ltr:translate-x-6' : 'rtl:translate-x-[-0.25rem] ltr:translate-x-1'
                        }`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-[#191C1E] mb-1">Weekly Reports</p>
                      <p className="text-[12px] text-[#505F76]">Summary of your performance every Monday</p>
                    </div>
                    <button
                      onClick={() => setWeeklyReports(!weeklyReports)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${weeklyReports ? 'bg-[#050C9C]' : 'bg-gray-200'
                        }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${weeklyReports ? 'rtl:translate-x-[-1.5rem] ltr:translate-x-6' : 'rtl:translate-x-[-0.25rem] ltr:translate-x-1'
                        }`} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Referral Preferences Tab */}
          {activeTab === 'referrals' && (
            <>
              <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
                <h2 className="text-lg sm:text-xl font-bold text-[#191C1E] mb-4">{t('settings.referralPreferences')}</h2>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <p className="text-[12px] font-medium text-[#505F76] uppercase tracking-wider mb-4">{t('settings.defaultLinkDestination')}</p>

                    <div className="space-y-3">
                      <div
                        className={`p-4 rounded-xl cursor-pointer transition-all ${defaultLinkDestination === 'homepage'
                            ? ' bg-[#F2F4F6]'
                            : ' bg-white '
                          }`}
                        onClick={() => setDefaultLinkDestination('homepage')}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${defaultLinkDestination === 'homepage' ? 'border-[#050C9C]' : 'border-gray-300'
                            }`}>
                            {defaultLinkDestination === 'homepage' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#050C9C]" />
                            )}
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-[#191C1E]">{t('settings.homepage')}</p>
                            <p className="text-[10px] text-[#505F76]">{t('settings.homepageDesc')}</p>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`p-4 rounded-xl  cursor-pointer transition-all ${defaultLinkDestination === 'pricing'
                            ? 'bg-[#F2F4F6]'
                            : 'bg-white '
                          }`}
                        onClick={() => setDefaultLinkDestination('pricing')}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${defaultLinkDestination === 'pricing' ? 'border-[#050C9C]' : 'border-gray-300'
                            }`}>
                            {defaultLinkDestination === 'pricing' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#050C9C]" />
                            )}
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-[#191C1E]">{t('settings.pricingPage')}</p>
                            <p className="text-[10px] text-[#505F76]">{t('settings.pricingPageDesc')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <>
              <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">

                <h2 className="text-base sm:text-lg font-bold text-[#191C1E] mb-4 sm:mb-6">{t('settings.securitySettings')}</h2>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[#191C1E] mb-3">{t('settings.changePassword')}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[#505F76] text-[12px] font-medium mb-1 uppercase tracking-wider">{t('settings.currentPassword')}</label>
                        <div className="relative">
                          <input
                            type={showPasswords ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors appearance-none" />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-[#505F76] hover:text-gray-600"
                          >
                            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[#505F76] text-[12px] font-medium mb-1 uppercase tracking-wider">{t('settings.newPassword')}</label>
                          <input
                            type={showPasswords ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors appearance-none" />
                        </div>
                        <div>
                          <label className="block text-[#505F76] text-[12px] font-medium mb-1 uppercase tracking-wider">{t('settings.confirmNewPassword')}</label>
                          <input
                            type={showPasswords ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#F2F4F6] rounded-[16px] text-[#191C1E] text-sm focus:outline-none focus:border-[#4F46E5] transition-colors appearance-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-semibold text-[#191C1E] mb-3">{t('settings.twoFactorAuth')}</h3>
                    <div className="flex flex-wrap items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#191C1E]">{t('settings.enable2fa')}</p>
                        <p className="text-xs text-[#505F76]">{t('settings.twoFactorDesc')}</p>
                      </div>
                      <button
                        onClick={handleToggle2FA}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFactorEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? 'rtl:translate-x-[-1.75rem] ltr:translate-x-6' : 'rtl:translate-x-[-0.25rem] ltr:translate-x-1'
                          }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-50 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving || (activeTab === 'profile' && name.trim() === '') || (activeTab === 'security' && newPassword !== '' && newPassword !== confirmPassword)}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 disabled:opacity-50 text-white rounded-full font-semibold transition-colors"
              style={{
                background: 'linear-gradient(106.83deg, #2A14B4 0%, #4338CA 100%)',
                fontSize: '14px',
                boxShadow: '0px 4px 6px -4px #6366F133, 0px 10px 15px -3px #6366F133'
              }}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('settings.saving')}
                </div>
              ) : saved ? (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  {t('settings.saved')}
                </div>
              ) : (
                t('settings.saveChanges')
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
