'use client';

import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import { User, Mail, Bell, Shield, Wallet, Save, Loader2, Check, Upload, Eye, EyeOff, CreditCard, Building, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
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
          avatar: avatar 
        });
        // Trigger avatar update event for AppLayout
        window.dispatchEvent(new CustomEvent('avatarUpdated'));
      } else if (activeTab === 'payout') {
        await api.put('/affiliate/payout-settings', {
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          account_holder_name: accountHolderName.trim(),
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
    <AppLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
          <p className="text-gray-500 mt-1">Manage your profile, preferences, and payment settings.</p>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Navigation Sidebar */}
          <div className="col-span-1 space-y-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <User className="w-5 h-5" /> My Profile
            </button>
            <button 
              onClick={() => setActiveTab('payout')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'payout' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Wallet className="w-5 h-5" /> Payout Methods
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'notifications' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Bell className="w-5 h-5" /> Notifications
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'security' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Shield className="w-5 h-5" /> Security
            </button>
          </div>

          {/* Main Content Area */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Profile Information</h2>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Avatar</label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md overflow-hidden">
                          {avatar ? (
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            user?.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                            id="avatar-upload"
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            Change Avatar
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="email" 
                            defaultValue={user?.email}
                            readOnly
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 focus:outline-none cursor-not-allowed font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bio / Description (Optional)</label>
                       <textarea 
                         rows={3}
                         value={bio}
                         onChange={(e) => setBio(e.target.value)}
                         placeholder="Tell your audience a little bit about yourself..."
                         className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                       />
                    </div>
                  </div>
                </>
              )}

              {/* Payout Methods Tab */}
              {activeTab === 'payout' && (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Payout Methods</h2>
                  
                  <div className="space-y-5">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-semibold text-blue-900">Bank Transfer Information</h3>
                          <p className="text-xs text-blue-700 mt-1">Add your bank details to receive payouts. Minimum payout amount is $50.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bank Name</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" 
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. Chase Bank"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Holder Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" 
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            placeholder="Full name on account"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Number</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" 
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Account number"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">IBAN (Optional)</label>
                        <input 
                          type="text" 
                          value={iban}
                          onChange={(e) => setIban(e.target.value)}
                          placeholder="International Bank Account Number"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Minimum Payout Amount ($)</label>
                      <input 
                        type="number" 
                        value={minimumPayout}
                        onChange={(e) => setMinimumPayout(Number(e.target.value))}
                        min="50"
                        max="1000"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all font-medium"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum: $50, Maximum: $1000</p>
                    </div>
                  </div>
                </>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Email Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Commission Notifications</p>
                            <p className="text-xs text-gray-500">Get notified when you earn new commissions</p>
                          </div>
                          <button
                            onClick={() => setEmailNotifications(!emailNotifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              emailNotifications ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              emailNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Weekly Reports</p>
                            <p className="text-xs text-gray-500">Receive weekly performance summaries</p>
                          </div>
                          <button
                            onClick={() => setWeeklyReports(!weeklyReports)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              weeklyReports ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              weeklyReports ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                            <p className="text-xs text-gray-500">Tips, updates, and promotional content</p>
                          </div>
                          <button
                            onClick={() => setMarketingEmails(!marketingEmails)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              marketingEmails ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              marketingEmails ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">SMS Notifications</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">SMS Alerts</p>
                          <p className="text-xs text-gray-500">Get SMS for important updates (coming soon)</p>
                        </div>
                        <button
                          onClick={() => setSmsNotifications(!smsNotifications)}
                          disabled
                          className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 opacity-50 cursor-not-allowed"
                        >
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Security Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                          <div className="relative">
                            <input 
                              type={showPasswords ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all font-medium pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(!showPasswords)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                            <input 
                              type={showPasswords ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                            <input 
                              type={showPasswords ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Enable 2FA</p>
                          <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <button
                          onClick={handleToggle2FA}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            twoFactorEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-8 pt-6 border-t border-gray-50 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={isSaving || (activeTab === 'profile' && !name.trim()) || (activeTab === 'security' && newPassword && newPassword !== confirmPassword)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-indigo-200"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
