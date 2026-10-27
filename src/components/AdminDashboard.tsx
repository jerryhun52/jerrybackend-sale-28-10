import React, { useState, useEffect } from 'react';
import { User, Trade, WalletRequest, AdminStats, AdminUser, CurrencyCode, CURRENCIES } from '../types';
import { api } from '../services/api';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  PlusCircle, 
  MinusCircle, 
  Sliders, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Search, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  LogOut,
  SlidersHorizontal,
  Zap,
  Sparkles,
  Send,
  ExternalLink,
  Coins,
  UserPlus,
  KeyRound,
  UserCheck,
  Trash2,
  Copy,
  Check,
  Tag,
  Share2,
  Crown,
  Upload
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser: AdminUser;
  onLogoutAdmin: () => void;
  onRefreshData?: () => void;
  onUpdateAdmin?: (updated: AdminUser) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogoutAdmin,
  onUpdateAdmin,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Referral copy & quick edit modal states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [myNewRefCode, setMyNewRefCode] = useState(adminUser.referralCode || '');
  const [refChangeLoading, setRefChangeLoading] = useState(false);
  const [refChangeMsg, setRefChangeMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Permissions helpers
  const isSuperAdmin = adminUser.role === 'SUPER_ADMIN';
  const isOwnerAdmin = Boolean(
    adminUser.isOwner ||
    adminUser.id === 'admin_supreme_owner' ||
    adminUser.id === 'admin_owner_am9318930' ||
    adminUser.username.toLowerCase().replace(/^[@#:]+/, '') === 'jerry@786' ||
    adminUser.username.toLowerCase() === 'am9318930@gmail.com'
  );
  const canManageUsers = isSuperAdmin || (adminUser.permissions?.manageUsers ?? true);
  const canManageTrades = isSuperAdmin || (adminUser.permissions?.manageTrades ?? true);
  const canManageFinance = isSuperAdmin || (adminUser.permissions?.manageFinance ?? true);
  const canManageNotice = isSuperAdmin || (adminUser.permissions?.manageSupportNotice ?? true);
  const canManageAdmins = isSuperAdmin;

  // Active Admin Sub-tab
  const [currentTab, setCurrentTab] = useState<'users' | 'trades' | 'withdrawals' | 'deposits' | 'notice' | 'admins' | 'support'>(() => {
    if (canManageUsers) return 'users';
    if (canManageTrades) return 'trades';
    if (canManageFinance) return 'withdrawals';
    if (canManageNotice) return 'notice';
    return 'users';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Accounts Management State (Master Admin)
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [newAdminRefCode, setNewAdminRefCode] = useState('');
  const [newAdminTelegramUrl, setNewAdminTelegramUrl] = useState('');
  const [newAdminPermUsers, setNewAdminPermUsers] = useState(true);
  const [newAdminPermTrades, setNewAdminPermTrades] = useState(true);
  const [newAdminPermFinance, setNewAdminPermFinance] = useState(true);
  const [newAdminPermNotice, setNewAdminPermNotice] = useState(false);
  const [adminMsg, setAdminMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  // Edit Admin Access & Permissions State
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminRole, setEditAdminRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [editAdminPassword, setEditAdminPassword] = useState('');
  const [editAdminRefCode, setEditAdminRefCode] = useState('');
  const [editAdminTelegramUrl, setEditAdminTelegramUrl] = useState('');
  const [editAdminTelegramGreeting, setEditAdminTelegramGreeting] = useState('');
  const [editPermUsers, setEditPermUsers] = useState(true);
  const [editPermTrades, setEditPermTrades] = useState(true);
  const [editPermFinance, setEditPermFinance] = useState(true);
  const [editPermNotice, setEditPermNotice] = useState(false);
  const [editPermAdmins, setEditPermAdmins] = useState(false);

  // Selected user for Balance / Credit Score Modification Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceAction, setBalanceAction] = useState<'ADD' | 'DEDUCT' | 'SET'>('ADD');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [newCreditScore, setNewCreditScore] = useState<number>(95);
  const [newTradeMode, setNewTradeMode] = useState<'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS'>('AUTO');
  const [freezeReasonInput, setFreezeReasonInput] = useState('');
  const [modalStatusMsg, setModalStatusMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Withdrawal Rejection Note Modal
  const [rejectingRequest, setRejectingRequest] = useState<WalletRequest | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Support Team Notice State (Global Broadcast)
  const [noticeTitle, setNoticeTitle] = useState('Support Team Notice');
  const [noticeMessage, setNoticeMessage] = useState('Welcome to CELLS FLOWNEX Trading. Our real-time settlement and customer support desk is active 24/7.');
  const [noticeActive, setNoticeActive] = useState(true);
  const [noticeTelegramUrl, setNoticeTelegramUrl] = useState('https://t.me/flowcoin_support');
  const [noticeStatusMsg, setNoticeStatusMsg] = useState<string | null>(null);
  const [noticeLoading, setNoticeLoading] = useState(false);

  // Personal Telegram Support Desk for Current Admin
  const [myTelegramUrl, setMyTelegramUrl] = useState(adminUser.telegramSupportUrl || '');
  const [myTelegramGreeting, setMyTelegramGreeting] = useState(
    adminUser.telegramGreetingMessage || 'Hello Support Team, I am trader {username} (Account ID: {id}). Please assist me.'
  );
  const [savingTelegramDesk, setSavingTelegramDesk] = useState(false);
  const [telegramDeskMsg, setTelegramDeskMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Mobile App Download Config State
  const [appPlayStoreUrl, setAppPlayStoreUrl] = useState('https://play.google.com/store/apps/details?id=com.flowcoin.trading');
  const [appApkUrl, setAppApkUrl] = useState('/downloads/flowcoin.apk');
  const [appDriveUrl, setAppDriveUrl] = useState('');
  const [savingAppConfig, setSavingAppConfig] = useState(false);
  const [appConfigMsg, setAppConfigMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Admin Referral Code State & Customization
  const [adminReferralCode, setAdminReferralCode] = useState(
    adminUser.referralCode || (adminUser.role === 'SUPER_ADMIN' ? 'MASTER321' : 'AGENT_REF')
  );
  const [isEditingRefCode, setIsEditingRefCode] = useState(false);
  const [newRefCodeInput, setNewRefCodeInput] = useState('');
  const [refCodeMsg, setRefCodeMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingRefCode, setSavingRefCode] = useState(false);

  useEffect(() => {
    if (adminUser.referralCode) {
      setAdminReferralCode(adminUser.referralCode);
    }
  }, [adminUser.referralCode]);

  // Fetch all admin data (scoped by current admin ID)
  const loadAdminData = async () => {
    try {
      setRefreshing(true);
      const [uRes, tRes, wRes, sRes, nRes, aRes, cfgRes] = await Promise.all([
        api.getAdminUsers(adminUser.id),
        api.getAdminTrades(adminUser.id),
        api.getAdminWalletRequests(adminUser.id),
        api.getAdminStats(adminUser.id),
        api.getSupportNotice().catch(() => ({ notice: null })),
        isSuperAdmin ? api.getAdminAccounts(adminUser.id).catch(() => ({ administrators: [] })) : Promise.resolve({ administrators: [] }),
        api.getAppConfig().catch(() => ({ appConfig: null })),
      ]);
      setUsers(uRes.users);
      setTrades(tRes.trades);
      setWalletRequests(wRes.requests);
      setStats(sRes.stats);
      if (cfgRes && cfgRes.appConfig) {
        setAppPlayStoreUrl(cfgRes.appConfig.playStoreUrl || '');
        setAppApkUrl(cfgRes.appConfig.apkUrl || '');
        if (cfgRes.appConfig.driveUrl !== undefined) {
          setAppDriveUrl(cfgRes.appConfig.driveUrl);
        }
      }
      if (aRes && aRes.administrators) {
        // Enforce strict hidden owner privacy:
        // jerry@786 must NEVER be visible to any other administrator under any circumstances!
        const filtered = aRes.administrators.filter(a => {
          const isTargetOwner = a.isOwner || a.id === 'admin_supreme_owner' || a.username.toLowerCase().replace(/^[@#:]+/, '') === 'jerry@786';
          if (isTargetOwner && !isOwnerAdmin) {
            return false;
          }
          return true;
        });
        setAdminList(filtered);

        // Keep current admin's personal telegram support settings updated from server
        const me = aRes.administrators.find(a => a.id === adminUser.id || a.username.toLowerCase() === adminUser.username.toLowerCase());
        if (me) {
          if (me.telegramSupportUrl !== undefined) setMyTelegramUrl(me.telegramSupportUrl);
          if (me.telegramGreetingMessage !== undefined) setMyTelegramGreeting(me.telegramGreetingMessage);
          if (me.referralCode && me.referralCode !== adminReferralCode) setAdminReferralCode(me.referralCode);
        }
      }
      if (nRes && nRes.notice) {
        setNoticeTitle(nRes.notice.title);
        setNoticeMessage(nRes.notice.message);
        setNoticeActive(nRes.notice.isActive);
        if (nRes.notice.telegramSupportUrl) {
          setNoticeTelegramUrl(nRes.notice.telegramSupportUrl);
        }
      }
    } catch (err) {
      console.error('Failed to load admin panel data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 3000); // Auto-refresh live data
    return () => clearInterval(interval);
  }, [adminUser.id]);

  const referralCodeDisplay = adminReferralCode;
  const referralLink = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(referralCodeDisplay)}`;

  const handleStartEditRefCode = () => {
    setNewRefCodeInput(adminReferralCode);
    setIsEditingRefCode(true);
    setRefCodeMsg(null);
  };

  const handleSaveReferralCode = async () => {
    const clean = newRefCodeInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (clean.length < 3) {
      setRefCodeMsg({ text: 'Referral code must be at least 3 alphanumeric characters', type: 'error' });
      return;
    }

    setSavingRefCode(true);
    setRefCodeMsg(null);
    try {
      const res = await api.changeAdminReferralCode(adminUser.id, clean);
      setAdminReferralCode(res.referralCode);
      setIsEditingRefCode(false);
      setRefCodeMsg({ text: res.message || `Referral code updated to "${clean}" successfully!`, type: 'success' });
      setTimeout(() => setRefCodeMsg(null), 4000);
      loadAdminData();
    } catch (err: any) {
      setRefCodeMsg({ text: err.message || 'Failed to update referral code', type: 'error' });
    } finally {
      setSavingRefCode(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCodeDisplay);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Helper to format clean preview Telegram URL with greetings
  const getMyTelegramPreviewUrl = () => {
    let raw = myTelegramUrl.trim();
    if (!raw) return 'https://t.me/flowcoin_support';
    let url = raw;
    if (url.startsWith('@')) url = `https://t.me/${url.substring(1)}`;
    else if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://t.me/${url}`;
    if (myTelegramGreeting.trim()) {
      const sampleGreeting = myTelegramGreeting
        .replace('{username}', 'trader_demo')
        .replace('{name}', 'Demo Trader')
        .replace('{id}', 'user_123');
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}text=${encodeURIComponent(sampleGreeting)}`;
    }
    return url;
  };

  // Save personal Telegram Support Desk
  const handleSaveTelegramDesk = async () => {
    setSavingTelegramDesk(true);
    setTelegramDeskMsg(null);
    try {
      const res = await api.updateAdminTelegramSupport(adminUser.id, myTelegramUrl, myTelegramGreeting);
      setTelegramDeskMsg({ text: res.message || 'Telegram Support Desk saved successfully!', type: 'success' });
      try {
        const currentSaved = localStorage.getItem('crypto_admin');
        if (currentSaved) {
          const parsed = JSON.parse(currentSaved);
          parsed.telegramSupportUrl = res.admin.telegramSupportUrl;
          parsed.telegramGreetingMessage = res.admin.telegramGreetingMessage;
          localStorage.setItem('crypto_admin', JSON.stringify(parsed));
        }
      } catch (e) {}
      setTimeout(() => setTelegramDeskMsg(null), 4000);
    } catch (err: any) {
      setTelegramDeskMsg({ text: err.message || 'Failed to update Telegram Support Desk', type: 'error' });
    } finally {
      setSavingTelegramDesk(false);
    }
  };

  // Save Mobile App Download Configuration (Restricted strictly to jerry@786)
  const [uploadingApkFile, setUploadingApkFile] = useState(false);

  const handleSaveAppConfig = async () => {
    if (!isOwnerAdmin) {
      setAppConfigMsg({ text: 'Permission Denied: Only Supreme System Owner (jerry@786) is authorized to modify mobile app configuration.', type: 'error' });
      return;
    }
    setSavingAppConfig(true);
    setAppConfigMsg(null);
    try {
      const res = await api.updateAppConfig(adminUser.id, appPlayStoreUrl.trim(), appApkUrl.trim(), appDriveUrl.trim());
      setAppConfigMsg({ text: res.message || 'Mobile app download configuration saved successfully!', type: 'success' });
      setTimeout(() => setAppConfigMsg(null), 4000);
    } catch (err: any) {
      setAppConfigMsg({ text: err.message || 'Failed to save mobile app configuration', type: 'error' });
    } finally {
      setSavingAppConfig(false);
    }
  };

  const handleFileUploadApk = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isOwnerAdmin) {
      setAppConfigMsg({ text: 'Permission Denied: Only Supreme System Owner (jerry@786) is authorized to upload APK files.', type: 'error' });
      return;
    }

    setUploadingApkFile(true);
    setAppConfigMsg(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await api.uploadApkFile(adminUser.id, base64, appApkUrl.trim(), appDriveUrl.trim());
          setAppApkUrl(res.appConfig.apkUrl || '/downloads/flowcoin.apk');
          setAppConfigMsg({ text: res.message || 'APK file uploaded successfully!', type: 'success' });
        } catch (err: any) {
          setAppConfigMsg({ text: err.message || 'Failed to upload APK file', type: 'error' });
        } finally {
          setUploadingApkFile(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setAppConfigMsg({ text: 'Failed to read file', type: 'error' });
      setUploadingApkFile(false);
    }
  };
  const [newClientPassword, setNewClientPassword] = useState('');
  const [clientPasswordSuccess, setClientPasswordSuccess] = useState<string | null>(null);

  // Create Client Account Modal State
  const [createClientModalOpen, setCreateClientModalOpen] = useState(false);
  const [createClientName, setCreateClientName] = useState('');
  const [createClientUsername, setCreateClientUsername] = useState('');
  const [createClientEmail, setCreateClientEmail] = useState('');
  const [createClientPassword, setCreateClientPassword] = useState('');
  const [createClientCurrency, setCreateClientCurrency] = useState<CurrencyCode>('USD');
  const [createClientBalance, setCreateClientBalance] = useState('1000');
  const [createClientCreditScore, setCreateClientCreditScore] = useState(95);
  const [createClientLoading, setCreateClientLoading] = useState(false);
  const [createClientMsg, setCreateClientMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Open Edit User Modal
  const handleOpenUserModal = (user: User) => {
    setSelectedUser(user);
    setNewCreditScore(user.creditScore || 100);
    setNewTradeMode(user.tradeMode || 'AUTO');
    setFreezeReasonInput(user.freezeReason || '');
    setBalanceAmount('');
    setBalanceAction('ADD');
    setNewClientPassword('');
    setClientPasswordSuccess(null);
    setModalStatusMsg(null);
  };

  // Submit Balance Modification
  const handleApplyBalance = async () => {
    if (!selectedUser) return;
    const num = Number(balanceAmount);
    if (isNaN(num) || num <= 0) {
      setModalStatusMsg('Please enter a valid amount');
      return;
    }

    const userCurr = selectedUser.currency || 'USD';
    setActionLoading(true);
    try {
      const res = await api.updateAdminUserBalance(selectedUser.id, balanceAction, num, 'Admin Direct Adjust', userCurr);
      setSelectedUser(res.user);
      setModalStatusMsg(`Balance updated: ${balanceAction} ${num} ${userCurr} successfully!`);
      setBalanceAmount('');
      loadAdminData();
    } catch (err: any) {
      setModalStatusMsg(err.message || 'Failed to update balance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateClientPassword = async () => {
    if (!selectedUser || !newClientPassword.trim()) return;
    setActionLoading(true);
    setClientPasswordSuccess(null);
    try {
      const res = await api.updateAdminUserPassword(selectedUser.id, newClientPassword.trim());
      setSelectedUser({ ...selectedUser, password: newClientPassword.trim() });
      setClientPasswordSuccess(res.message || `Password updated to "${newClientPassword.trim()}"`);
      setNewClientPassword('');
      loadAdminData();
    } catch (err: any) {
      setModalStatusMsg(err.message || 'Failed to update password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClientUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user @${username}?`)) return;
    try {
      await api.deleteAdminUser(userId);
      setSelectedUser(null);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleCreateClientAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createClientUsername.trim() || !createClientPassword.trim()) {
      setCreateClientMsg({ text: 'Username and password are required', type: 'error' });
      return;
    }
    setCreateClientLoading(true);
    setCreateClientMsg(null);
    try {
      const res = await api.createAdminUser({
        name: createClientName.trim() || createClientUsername.trim(),
        username: createClientUsername.trim(),
        email: createClientEmail.trim() || `${createClientUsername.trim().toLowerCase()}@trade.com`,
        password: createClientPassword.trim(),
        currency: createClientCurrency,
        balance: Number(createClientBalance) || 0,
        creditScore: createClientCreditScore || 95,
        adminId: adminUser.id,
      });

      setCreateClientMsg({ text: `Client account @${res.user.username || createClientUsername} created successfully!`, type: 'success' });
      setCreateClientName('');
      setCreateClientUsername('');
      setCreateClientEmail('');
      setCreateClientPassword('');
      setCreateClientBalance('1000');
      loadAdminData();
      setTimeout(() => {
        setCreateClientModalOpen(false);
        setCreateClientMsg(null);
      }, 2000);
    } catch (err: any) {
      setCreateClientMsg({ text: err.message || 'Failed to create client account', type: 'error' });
    } finally {
      setCreateClientLoading(false);
    }
  };

  // Submit Credit Score Modification
  const handleApplyCreditScore = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await api.updateAdminUserCreditScore(selectedUser.id, newCreditScore);
      setSelectedUser(res.user);
      setModalStatusMsg(`Credit score successfully set to ${newCreditScore}/100!`);
      loadAdminData();
    } catch (err: any) {
      setModalStatusMsg(err.message || 'Failed to update credit score');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Trade Mode Override (Auto / Force Win / Force Loss)
  const handleApplyTradeMode = async (mode: 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS') => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await api.updateAdminUserTradeMode(selectedUser.id, mode);
      setSelectedUser(res.user);
      setNewTradeMode(mode);
      setModalStatusMsg(`Trade mode set to: ${mode}`);
      loadAdminData();
    } catch (err: any) {
      setModalStatusMsg(err.message || 'Failed to update trade mode');
    } finally {
      setActionLoading(false);
    }
  };

  // Unfreeze user balance
  const handleUnfreezeUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await api.updateAdminUserFreezeBalance(selectedUser.id, 0, 'UNFREEZE_ALL');
      setSelectedUser(res.user);
      setModalStatusMsg('All frozen funds returned to available balance!');
      loadAdminData();
    } catch (err: any) {
      setModalStatusMsg(err.message || 'Failed to unfreeze funds');
    } finally {
      setActionLoading(false);
    }
  };

  // Process Withdrawal / Deposit Request
  const handleProcessRequest = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.handleAdminWalletRequest(requestId, action, `Actioned by Admin (${action})`);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to process request');
    }
  };

  // Change Own Referral Code
  const handleChangeMyReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myNewRefCode.trim()) return;
    setRefChangeLoading(true);
    setRefChangeMsg(null);
    try {
      const res = await api.changeAdminReferralCode(adminUser.id, myNewRefCode.trim().toUpperCase());
      setRefChangeMsg({ text: res.message || 'Referral code updated successfully!', type: 'success' });
      if (res.admin) {
        if (onUpdateAdmin) {
          onUpdateAdmin(res.admin);
        }
        try {
          localStorage.setItem('crypto_admin', JSON.stringify(res.admin));
        } catch (err) {}
      }
      setTimeout(() => {
        setRefModalOpen(false);
        setRefChangeMsg(null);
      }, 1500);
      loadAdminData();
    } catch (err: any) {
      setRefChangeMsg({ text: err.message || 'Failed to update referral code', type: 'error' });
    } finally {
      setRefChangeLoading(false);
    }
  };

  // Save Support Notice
  const handleSaveSupportNotice = async () => {
    setNoticeLoading(true);
    setNoticeStatusMsg(null);
    try {
      await api.updateSupportNotice(noticeTitle, noticeMessage, noticeActive, noticeTelegramUrl, adminUser.id);
      setNoticeStatusMsg('Support Notice & Telegram Support Link successfully published to all Client Asset pages!');
      setTimeout(() => setNoticeStatusMsg(null), 4000);
    } catch (err: any) {
      setNoticeStatusMsg(err.message || 'Failed to update support notice');
    } finally {
      setNoticeLoading(false);
    }
  };

  // Create new Admin Account
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      setAdminMsg({ text: 'Admin username and password are required', type: 'error' });
      return;
    }
    setAdminActionLoading(true);
    setAdminMsg(null);
    try {
      const isSuper = newAdminRole === 'SUPER_ADMIN';
      const res = await api.createAdminAccount({
        username: newAdminUsername.trim(),
        name: newAdminName.trim() || newAdminUsername.trim(),
        password: newAdminPassword.trim(),
        role: newAdminRole,
        referralCode: newAdminRefCode.trim() ? newAdminRefCode.trim().toUpperCase() : undefined,
        telegramSupportUrl: newAdminTelegramUrl.trim() ? newAdminTelegramUrl.trim() : undefined,
        permissions: {
          manageUsers: newAdminPermUsers,
          manageTrades: newAdminPermTrades,
          manageFinance: newAdminPermFinance,
          manageSupportNotice: newAdminPermNotice,
          manageAdmins: isSuper
        }
      });
      setAdminMsg({ text: res.message || 'Admin account created successfully', type: 'success' });
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminName('');
      setNewAdminRefCode('');
      setNewAdminTelegramUrl('');
      const updated = await api.getAdminAccounts(adminUser.id);
      const filtered = updated.administrators.filter(a => {
        const isTargetOwner = a.isOwner || a.id === 'admin_supreme_owner' || a.username.toLowerCase().replace(/^[@#:]+/, '') === 'jerry@786';
        if (isTargetOwner && !isOwnerAdmin) return false;
        return true;
      });
      setAdminList(filtered);
      setTimeout(() => setAdminMsg(null), 5000);
    } catch (err: any) {
      setAdminMsg({ text: err.message || 'Failed to create administrator account', type: 'error' });
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Open Edit Admin Modal
  const handleOpenEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditAdminName(admin.name || '');
    setEditAdminRole(admin.role || 'ADMIN');
    setEditAdminPassword('');
    setEditAdminRefCode(admin.referralCode || '');
    setEditAdminTelegramUrl(admin.telegramSupportUrl || '');
    setEditAdminTelegramGreeting(admin.telegramGreetingMessage || '');
    setEditPermUsers(admin.permissions?.manageUsers ?? true);
    setEditPermTrades(admin.permissions?.manageTrades ?? true);
    setEditPermFinance(admin.permissions?.manageFinance ?? true);
    setEditPermNotice(admin.permissions?.manageSupportNotice ?? false);
    setEditPermAdmins(admin.permissions?.manageAdmins ?? (admin.role === 'SUPER_ADMIN'));
  };

  // Save Edited Admin Settings & Permissions
  const handleSaveEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setAdminActionLoading(true);
    setAdminMsg(null);
    try {
      const isSuper = editAdminRole === 'SUPER_ADMIN';
      const res = await api.updateAdminAccount(editingAdmin.id, {
        name: editAdminName.trim() || undefined,
        role: editAdminRole,
        password: editAdminPassword.trim() ? editAdminPassword.trim() : undefined,
        referralCode: editAdminRefCode.trim() ? editAdminRefCode.trim().toUpperCase() : undefined,
        permissions: {
          manageUsers: editPermUsers,
          manageTrades: editPermTrades,
          manageFinance: editPermFinance,
          manageSupportNotice: editPermNotice,
          manageAdmins: isSuper ? true : editPermAdmins
        },
        callerAdminId: adminUser.id
      });

      // Also update this admin's dedicated Telegram Support settings if provided
      if (editAdminTelegramUrl !== (editingAdmin.telegramSupportUrl || '') || editAdminTelegramGreeting !== (editingAdmin.telegramGreetingMessage || '')) {
        await api.updateAdminTelegramSupport(editingAdmin.id, editAdminTelegramUrl, editAdminTelegramGreeting);
      }

      setAdminMsg({ text: res.message || 'Administrator updated successfully', type: 'success' });
      setEditingAdmin(null);
      const updated = await api.getAdminAccounts(adminUser.id);
      const filtered = updated.administrators.filter(a => {
        const isTargetOwner = a.isOwner || a.id === 'admin_supreme_owner' || a.username.toLowerCase().replace(/^[@#:]+/, '') === 'jerry@786';
        if (isTargetOwner && !isOwnerAdmin) return false;
        return true;
      });
      setAdminList(filtered);
      setTimeout(() => setAdminMsg(null), 4000);
    } catch (err: any) {
      setAdminMsg({ text: err.message || 'Failed to update administrator permissions', type: 'error' });
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Delete Admin Account (Strictly restricted to Supreme Owner Jerry@786 only)
  const handleDeleteAdmin = async (id: string, username: string) => {
    if (!isOwnerAdmin) {
      alert('Permission Denied: Administrators cannot delete other admin accounts. Only the Supreme Owner (Jerry@786) can delete administrators.');
      return;
    }
    if (id === adminUser.id) {
      alert('You cannot delete your own active administrator account while logged in.');
      return;
    }
    const isTargetOwner = id === 'admin_supreme_owner' || username.toLowerCase().replace(/^[@#:]+/, '') === 'jerry@786';
    if (isTargetOwner) {
      alert('The Supreme System Owner account is permanent and cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove administrator "${username}"?`)) return;
    try {
      const res = await api.deleteAdminAccount(id, adminUser.id);
      setAdminMsg({ text: res.message, type: 'success' });
      const updated = await api.getAdminAccounts(adminUser.id);
      const filtered = updated.administrators.filter(a => {
        const isTargetOwner = a.isOwner || a.id === 'admin_supreme_owner' || a.username.toLowerCase().replace(/^[@#:]+/, '') === 'jerry@786';
        if (isTargetOwner && !isOwnerAdmin) return false;
        return true;
      });
      setAdminList(filtered);
      setTimeout(() => setAdminMsg(null), 4000);
    } catch (err: any) {
      setAdminMsg({ text: err.message || 'Failed to delete administrator', type: 'error' });
    }
  };

  // Filtered lists (sorted by newest registered user first - supports search by username)
  const filteredUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(u => 
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.referralCodeUsed && u.referralCodeUsed.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const pendingWithdrawals = walletRequests.filter(r => r.type === 'WITHDRAWAL' || (r.type as any) === 'WITHDRAW');
  const pendingDeposits = walletRequests.filter(r => r.type === 'DEPOSIT');

  // Submit Rejection with note/reason
  const handleConfirmRejection = async () => {
    if (!rejectingRequest) return;
    const finalReason = rejectionNote.trim() || 'Withdrawal rejected by risk management department.';
    setRejectLoading(true);
    try {
      await api.handleAdminWalletRequest(rejectingRequest.id, 'REJECT', finalReason);
      setRejectingRequest(null);
      setRejectionNote('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject withdrawal');
    } finally {
      setRejectLoading(false);
    }
  };

  const newRegistrationsCount = users.filter(u => {
    const regTime = new Date(u.createdAt).getTime();
    const past24Hours = Date.now() - 24 * 60 * 60 * 1000;
    return regTime >= past24Hours;
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isOwnerAdmin
                    ? 'Supreme Owner Portal'
                    : adminUser.role === 'SUPER_ADMIN'
                    ? 'Main Super Admin Portal'
                    : 'Admin Control Portal'}
                </h1>
                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase border ${
                  isOwnerAdmin
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 font-black shadow-md'
                    : adminUser.role === 'SUPER_ADMIN'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {isOwnerAdmin
                    ? '👑 Supreme Founder (Invisible Root)'
                    : adminUser.role === 'SUPER_ADMIN'
                    ? 'Main Admin (Full Authority)'
                    : 'Authorized Sub-Admin'}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1 font-mono flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Account: <strong className="text-white font-bold">@{adminUser.username}</strong></span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{adminUser.name}</span>
                <span className="text-slate-600">•</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Session
                </span>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setMyNewRefCode(adminUser.referralCode || '');
                    setRefModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Click to edit/customize your referral code"
                >
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>Ref: {adminUser.referralCode}</span>
                  <Edit3 className="w-3 h-3 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadAdminData}
              disabled={refreshing}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>Live Sync</span>
            </button>
            <button
              onClick={onLogoutAdmin}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30 transition flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-5">
            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Managed Users</span>
                <Users className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">{stats.totalUsers}</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Total Active Balances</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                ${stats.totalActiveBalance.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Frozen Escrow</span>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-300 font-mono mt-1">
                ${stats.totalFrozenBalance.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Total Trades Placed</span>
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-xl font-bold text-teal-300 font-mono mt-1">
                {stats.totalTrades} ({stats.activeTrades} Live)
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl col-span-2 lg:col-span-1">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Pending Withdrawals</span>
                <Clock className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xl font-bold text-rose-400 font-mono mt-1">
                {stats.pendingWithdrawals} (${stats.pendingWithdrawalAmount})
              </div>
            </div>
          </div>
        )}

        {/* Admin Referral & Client Invitation Box */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-950 to-slate-950 border border-cyan-500/30 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider">Your Admin Referral Code:</span>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-md">
                    {referralCodeDisplay}
                  </span>
                  <button
                    type="button"
                    onClick={handleStartEditRefCode}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center space-x-1 cursor-pointer"
                    title="Change your referral code"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Change Code</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Traders who register with your code or link will automatically appear in your scoped admin portal. You can change your code anytime.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
              </button>
            </div>
          </div>

          {/* Inline Change Referral Code Form */}
          {isEditingRefCode && (
            <div className="mt-2 p-3.5 rounded-xl bg-slate-900 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                  Enter New Referral / Agent Code
                </label>
                <input
                  type="text"
                  value={newRefCodeInput}
                  onChange={(e) => setNewRefCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. VIP2026, FLOWAGENT, MASTER777"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg text-xs font-mono font-bold text-white placeholder-slate-500 uppercase focus:outline-none transition"
                />
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={handleSaveReferralCode}
                  disabled={savingRefCode || !newRefCodeInput.trim()}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  {savingRefCode ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingRefCode(false)}
                  disabled={savingRefCode}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {refCodeMsg && (
            <div className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center space-x-2 ${
              refCodeMsg.type === 'success' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {refCodeMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{refCodeMsg.text}</span>
            </div>
          )}

          {/* Admin's Personal Telegram Support Desk Configuration Card */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-[#229ED9]/40 space-y-3 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#229ED9]/20 border border-[#229ED9]/40 text-[#229ED9] flex items-center justify-center font-bold shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center space-x-2">
                    <span>My Personal Customer Support Desk (Telegram)</span>
                    {myTelegramUrl ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Default Support Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Traders registered under your referral code (<strong>{referralCodeDisplay}</strong>) will see this Telegram link when they click "Customer Support" on their Assets/Profile page.
                  </p>
                </div>
              </div>

              {myTelegramUrl && (
                <a
                  href={getMyTelegramPreviewUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] text-xs font-bold border border-[#229ED9]/40 transition flex items-center justify-center space-x-1 shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Link</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Your Telegram Link or Username</span>
                  <span className="text-slate-500 text-[10px]">e.g. @support_admin or https://t.me/...</span>
                </label>
                <input
                  type="text"
                  value={myTelegramUrl}
                  onChange={(e) => setMyTelegramUrl(e.target.value)}
                  placeholder="e.g. https://t.me/YourAgentSupport or @YourUsername"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-[#229ED9] rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Pre-filled Trader Message (Optional)</span>
                  <span className="text-slate-500 text-[10px]">Tokens: &#123;username&#125;, &#123;id&#125;</span>
                </label>
                <input
                  type="text"
                  value={myTelegramGreeting}
                  onChange={(e) => setMyTelegramGreeting(e.target.value)}
                  placeholder="Hello Support, I am trader {username} (ID: {id}). Please assist me."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-[#229ED9] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-400 font-mono truncate max-w-[65%]">
                {myTelegramUrl ? (
                  <span>Target: <strong className="text-cyan-300">{getMyTelegramPreviewUrl()}</strong></span>
                ) : (
                  <span>No custom link set. System default (@flowcoin_support) is used.</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveTelegramDesk}
                disabled={savingTelegramDesk}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-[#1b8bc2] hover:to-blue-500 text-white font-black text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                {savingTelegramDesk ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{savingTelegramDesk ? 'Saving...' : 'Save Support Desk'}</span>
              </button>
            </div>

            {telegramDeskMsg && (
              <div className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center space-x-2 ${
                telegramDeskMsg.type === 'success' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {telegramDeskMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{telegramDeskMsg.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setCurrentTab('support')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            currentTab === 'support'
              ? 'bg-[#229ED9] text-white shadow-md shadow-[#229ED9]/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>My Support Desk (Telegram)</span>
        </button>
        {canManageUsers && (
          <button
            onClick={() => setCurrentTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 relative ${
              currentTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management & Balances ({users.length})</span>
            {newRegistrationsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-bounce shadow-sm">
                +{newRegistrationsCount} New
              </span>
            )}
          </button>
        )}

        {canManageTrades && (
          <button
            onClick={() => setCurrentTab('trades')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              currentTab === 'trades'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>All User Trades ({trades.length})</span>
          </button>
        )}

        {canManageFinance && (
          <>
            <button
              onClick={() => setCurrentTab('withdrawals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 relative ${
                currentTab === 'withdrawals'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdrawals</span>
              {stats && stats.pendingWithdrawals > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black">
                  {stats.pendingWithdrawals}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('deposits')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                currentTab === 'deposits'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposits</span>
              {stats && stats.pendingDeposits > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-slate-950 rounded-full text-[10px] font-black">
                  {stats.pendingDeposits}
                </span>
              )}
            </button>
          </>
        )}

        {canManageNotice && (
          <button
            onClick={() => setCurrentTab('notice')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              currentTab === 'notice'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Support Team Notice</span>
          </button>
        )}

        {canManageAdmins && (
          <button
            onClick={() => setCurrentTab('admins')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              currentTab === 'admins'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Admin Settings & Accounts ({adminList.length || 1})</span>
          </button>
        )}
      </div>

      {/* TAB 1: USER MANAGEMENT & BALANCE CONTROL */}
      {currentTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          {newRegistrationsCount > 0 && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-300 font-bold mb-5 animate-fade-in shadow-md">
              <div className="flex items-center space-x-2.5">
                <UserPlus className="w-4 h-4 text-emerald-400 animate-bounce shrink-0" />
                <span>🎉 {newRegistrationsCount} New Client{newRegistrationsCount > 1 ? 's' : ''} Registered (Listed at TOP)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 font-extrabold bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-700">
                NEWEST FIRST
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Registered Trader Accounts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Control user balances, inject/deduct funds, set credit scores, and adjust trade outcome modes
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCreateClientModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Client</span>
              </button>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search client by username, name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="pb-3 px-3">Username & Client</th>
                  <th className="pb-3 px-3">Email Address</th>
                  <th className="pb-3 px-3">Referral / Agent</th>
                  <th className="pb-3 px-3">Currency</th>
                  <th className="pb-3 px-3">Registered Time</th>
                  <th className="pb-3 px-3">Available Balance</th>
                  <th className="pb-3 px-3">Frozen Balance</th>
                  <th className="pb-3 px-3">Credit Score</th>
                  <th className="pb-3 px-3">Trade Mode</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredUsers.map((user) => {
                  const isNewUser = (Date.now() - new Date(user.createdAt).getTime()) < 24 * 60 * 60 * 1000;
                  return (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-3 font-bold text-white font-sans">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-xs text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                                @{user.username || user.name}
                              </span>
                              {isNewUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500 text-slate-950 animate-pulse font-mono shadow-xs">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal mt-0.5">{user.name}</div>
                          </div>
                        </div>
                      </td>
                    <td className="py-3.5 px-3 text-slate-300">
                      {user.email}
                    </td>
                    <td className="py-3.5 px-3">
                      {user.referredByAdminUsername ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-sans">
                          {user.referredByAdminUsername} ({user.referralCode || 'REF'})
                        </span>
                      ) : user.referralCode ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {user.referralCode}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-sans">Direct</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans">
                        {user.currency === 'PKR' ? '🇵🇰 PKR (₨)' : user.currency === 'INR' ? '🇮🇳 INR (₹)' : user.currency === 'BRL' ? '🇧🇷 BRL (R$)' : user.currency === 'EGP' ? '🇪🇬 EGP (E£)' : '🇺🇸 USD ($)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 font-sans text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-emerald-400 text-sm">
                      {CURRENCIES[(user.currency || 'USD') as CurrencyCode]?.symbol || '$'}{(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-amber-300">
                      {CURRENCIES[(user.currency || 'USD') as CurrencyCode]?.symbol || '$'}{(user.freezeBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                        {user.creditScore} / 100
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.tradeMode === 'FORCE_WIN'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : user.tradeMode === 'FORCE_LOSS'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {user.tradeMode || 'AUTO'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenUserModal(user)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-1.5 ml-auto shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Manage Account</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ALL TRADES MONITORING */}
      {currentTab === 'trades' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Live Global Trades Monitor & Direct Manipulation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tracking with direct Plus (WIN) / Minus (LOSS) manual adjustment controls
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-800 text-emerald-400 font-mono text-xs rounded-xl border border-slate-700">
              {trades.length} Total Contracts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="pb-3 px-3">User</th>
                  <th className="pb-3 px-3">Symbol</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Duration</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Entry Price</th>
                  <th className="pb-3 px-3">Outcome / Payout</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Admin Trade Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {trades.map((t) => {
                  const isUp = t.direction === 'UP';
                  const isWin = t.outcome === 'WIN';
                  const isRunning = t.status === 'RUNNING';

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-sans font-bold text-white">
                        <div>{t.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{t.userEmail}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-white font-sans">{t.symbol}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {isUp ? 'BUY UP ↑' : 'BUY DOWN ↓'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{t.duration}s (+{t.profitPercentage}%)</td>
                      <td className="py-3 px-3 font-bold text-white">${t.amount.toFixed(2)}</td>
                      <td className="py-3 px-3 text-slate-400">${t.entryPrice.toFixed(4)}</td>
                      <td className="py-3 px-3">
                        {isRunning ? (
                          <span className="text-amber-300 animate-pulse">Running...</span>
                        ) : isWin ? (
                          <span className="text-emerald-400 font-bold">
                            +${t.payout?.toFixed(2)} (WIN)
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold">
                            -${t.amount.toFixed(2)} (LOSS)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRunning ? 'bg-amber-500/20 text-amber-300 animate-pulse' : isWin ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5 font-sans">
                          {/* Force WIN / Plus */}
                          <button
                            type="button"
                            title="Force Win (Plus Profit)"
                            onClick={async () => {
                              try {
                                if (isRunning) {
                                  await api.settleAdminTradeNow(t.id, 'WIN');
                                } else {
                                  await api.updateAdminTrade(t.id, { outcome: 'WIN' });
                                }
                                loadAdminData();
                              } catch (err: any) {
                                alert(err.message || 'Failed to adjust trade');
                              }
                            }}
                            className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-md text-[11px] font-bold transition border border-emerald-500/40"
                          >
                            + Plus (Win)
                          </button>

                          {/* Force LOSS / Minus */}
                          <button
                            type="button"
                            title="Force Loss (Minus)"
                            onClick={async () => {
                              try {
                                if (isRunning) {
                                  await api.settleAdminTradeNow(t.id, 'LOSS');
                                } else {
                                  await api.updateAdminTrade(t.id, { outcome: 'LOSS' });
                                }
                                loadAdminData();
                              } catch (err: any) {
                                alert(err.message || 'Failed to adjust trade');
                              }
                            }}
                            className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-md text-[11px] font-bold transition border border-rose-500/40"
                          >
                            - Minus (Loss)
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WITHDRAWAL REQUESTS CONTROL */}
      {currentTab === 'withdrawals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                User Withdrawal Approvals & Control
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Approve to release frozen funds or Reject to refund funds back to user balance
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-800 text-rose-400 font-mono text-xs rounded-xl border border-slate-700">
              {pendingWithdrawals.length} Total Requests
            </span>
          </div>

          {pendingWithdrawals.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No withdrawal requests recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="pb-3 px-3">User Details</th>
                    <th className="pb-3 px-3">Amount (USDT)</th>
                    <th className="pb-3 px-3">Network</th>
                    <th className="pb-3 px-3">Wallet Address</th>
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {pendingWithdrawals.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-sans font-bold text-white">
                        <div>{req.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.userEmail}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-rose-400 text-sm">
                        ${req.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{req.network}</td>
                      <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate" title={req.walletAddress}>
                        {req.walletAddress || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-sans text-[11px]">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300 animate-pulse'
                        }`}>
                          {req.status}
                        </span>
                        {req.status === 'REJECTED' && req.remarks && (
                          <div className="text-[10px] text-rose-400/90 font-sans mt-0.5 max-w-[150px] truncate" title={req.remarks}>
                            Reason: {req.remarks}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleProcessRequest(req.id, 'APPROVE')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectingRequest(req);
                                setRejectionNote('Bank account details mismatch. Please verify IFSC and account number.');
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition"
                            >
                              Reject & Note
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-sans text-xs">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DEPOSIT REQUESTS CONTROL */}
      {currentTab === 'deposits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Deposit Verification & Balance Crediting
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirm deposits to immediately credit funds directly into user balances
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-800 text-emerald-400 font-mono text-xs rounded-xl border border-slate-700">
              {pendingDeposits.length} Total Deposits
            </span>
          </div>

          {pendingDeposits.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No deposit submissions recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="pb-3 px-3">User Details</th>
                    <th className="pb-3 px-3">Deposit Amount</th>
                    <th className="pb-3 px-3">Network</th>
                    <th className="pb-3 px-3">TxHash / Reference</th>
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {pendingDeposits.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-sans font-bold text-white">
                        <div>{req.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.userEmail}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-400 text-sm">
                        +${req.amount.toFixed(2)} USDT
                      </td>
                      <td className="py-3 px-3 text-slate-300">{req.network}</td>
                      <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate" title={req.txHash}>
                        {req.txHash || 'Manual Slip'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-sans text-[11px]">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300 animate-pulse'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleProcessRequest(req.id, 'APPROVE')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
                            >
                              Approve & Credit
                            </button>
                            <button
                              onClick={() => handleProcessRequest(req.id, 'REJECT')}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-sans text-xs">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SUPPORT TEAM NOTICE BROADCASTER */}
      {currentTab === 'notice' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Support Team Notice Broadcaster</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Write a note or announcement here. It will immediately appear in the blue "Support Team Notice" banner on all client Asset pages.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-300 font-bold">Broadcast Active:</label>
              <input
                type="checkbox"
                checked={noticeActive}
                onChange={(e) => setNoticeActive(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {noticeStatusMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{noticeStatusMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Send className="w-3.5 h-3.5 text-[#229ED9]" />
                <span>Telegram Customer Support Contact URL (Client Asset Page Link)</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={noticeTelegramUrl}
                  onChange={(e) => setNoticeTelegramUrl(e.target.value)}
                  placeholder="e.g. https://t.me/your_official_telegram_support"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                <a
                  href={noticeTelegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] border border-[#229ED9]/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shrink-0"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                When a user clicks the "Customer Support" Telegram icon in their Assets tab, they will be redirected to this link to contact you directly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Notice Title
              </label>
              <input
                type="text"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="e.g. Official Support Notice / Maintenance Alert / Withdrawal Policy"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Notice Message Content (Appears on Client Page)
              </label>
              <textarea
                rows={4}
                value={noticeMessage}
                onChange={(e) => setNoticeMessage(e.target.value)}
                placeholder="Write the message that all clients will see on their Assets tab..."
                className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
              />
            </div>

            {/* Quick Templates for Admin */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Template Presets:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    title: 'Support Team Notice',
                    msg: 'Welcome to CELLS FLOWNEX Trading. Our 24/7 dedicated support team and automated settlement system are fully operational. Trade with confidence.'
                  },
                  {
                    title: 'Withdrawal Settlement System Active',
                    msg: 'Bank withdrawals are audited and settled promptly. Please ensure your account details and IFSC/IBAN match your registered identity.'
                  },
                  {
                    title: 'System Performance Upgrade',
                    msg: 'All high-speed trading pairs (BTC, ETH, BNB, SOL, XRP) are operating with low latency execution and guaranteed yield settlements.'
                  }
                ].map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setNoticeTitle(tpl.title);
                      setNoticeMessage(tpl.msg);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Client Preview */}
            <div className="p-4 bg-[#2563eb] rounded-2xl text-white space-y-2">
              <div className="text-[11px] font-bold tracking-wider uppercase text-blue-200">
                Live Preview (How it looks on Client Page):
              </div>
              <div className="bg-white rounded-xl p-3.5 text-slate-800 shadow-sm">
                <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1 flex justify-between items-center">
                  <span>{noticeTitle || 'Support Team Notice'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Today</span>
                </div>
                <div className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap">
                  {noticeMessage || 'No message entered.'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={noticeLoading}
                onClick={handleSaveSupportNotice}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{noticeLoading ? 'Saving...' : 'Publish / Update Notice'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNoticeMessage('');
                  setNoticeActive(false);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Clear Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.5 MY TELEGRAM SUPPORT DESK TAB */}
      {currentTab === 'support' && (
        <div className="space-y-6 animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-[#229ED9]/20 text-[#229ED9] flex items-center justify-center font-bold">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white flex items-center space-x-2">
                    <span>Personal Telegram Support Desk</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#229ED9]/20 text-[#229ED9] border border-[#229ED9]/30">
                      Scoped to Your Clients
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure your direct Telegram support link and welcome message for your assigned clients
                  </p>
                </div>
              </div>

              {myTelegramUrl && (
                <a
                  href={getMyTelegramPreviewUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] font-bold rounded-xl text-xs border border-[#229ED9]/40 transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open & Test Telegram Link</span>
                </a>
              )}
            </div>

            {/* Scope Explanation Banner */}
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start space-x-3">
              <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <div className="font-bold text-cyan-300">
                  Client Isolation & Direct Routing Guarantee:
                </div>
                <p className="leading-relaxed">
                  Every client who registered using your referral code (<strong>{referralCodeDisplay}</strong>) or was created by you will see <strong>YOUR</strong> specific Telegram link when they click the <strong>Customer Support</strong> button on their Assets / Profile page. They will never be routed to any other admin's support channel.
                </p>
              </div>
            </div>

            {telegramDeskMsg && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
                telegramDeskMsg.type === 'success' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {telegramDeskMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{telegramDeskMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuration Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Your Telegram Support Link or Username:
                  </label>
                  <input
                    type="text"
                    value={myTelegramUrl}
                    onChange={(e) => setMyTelegramUrl(e.target.value)}
                    placeholder="https://t.me/YourAgentSupport or @YourSupportBot"
                    className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#229ED9] font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports full URLs (<code>https://t.me/username</code>) or handles (<code>@username</code>).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Pre-filled Welcome Message Template:
                  </label>
                  <textarea
                    rows={4}
                    value={myTelegramGreeting}
                    onChange={(e) => setMyTelegramGreeting(e.target.value)}
                    placeholder="Hello Support Team, I am trader {username} (Account ID: {id}). I need help with my account."
                    className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#229ED9] font-sans"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-300">Available tokens:</span>
                    <button
                      type="button"
                      onClick={() => setMyTelegramGreeting(prev => prev + ' {username}')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-mono cursor-pointer"
                    >
                      &#123;username&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => setMyTelegramGreeting(prev => prev + ' {name}')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-mono cursor-pointer"
                    >
                      &#123;name&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => setMyTelegramGreeting(prev => prev + ' {id}')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-mono cursor-pointer"
                    >
                      &#123;id&#125;
                    </button>
                  </div>
                </div>

                {/* Quick Templates */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Greeting Presets:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Hello Support Team, I am trader {username} (ID: {id}). I need help with deposit/withdrawal.',
                      'Hi support agent, I am trader {username} (Account: {id}). Please verify my account balance.',
                      'Assalam o Alaikum Support, I am client {username} (ID: {id}). Looking forward to your guidance.'
                    ].map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setMyTelegramGreeting(tpl)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg border border-slate-700 text-left transition cursor-pointer"
                      >
                        Preset {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="button"
                    disabled={savingTelegramDesk}
                    onClick={handleSaveTelegramDesk}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-[#1c8ec4] hover:to-blue-500 text-white font-black rounded-xl text-xs transition shadow-md disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                  >
                    {savingTelegramDesk ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{savingTelegramDesk ? 'Saving Settings...' : 'Save Support Desk'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMyTelegramUrl('');
                      setMyTelegramGreeting('Hello Support Team, I am trader {username} (Account ID: {id}). Please assist me.');
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>

              {/* Live Client Preview Simulation */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Live Client Screen Simulation</span>
                  <span className="text-[11px] text-emerald-400 font-mono">Real-time Preview</span>
                </div>

                <div className="p-5 bg-slate-950 rounded-3xl border border-slate-800 shadow-inner space-y-4">
                  <div className="text-[11px] text-slate-500 text-center font-mono">
                    --- Client Profile & Assets Page Preview ---
                  </div>

                  {/* Customer Support Card as seen by client */}
                  <div className="p-4 bg-gradient-to-b from-[#229ED9]/15 to-transparent border border-[#229ED9]/30 rounded-2xl text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-lg shadow-[#229ED9]/30">
                      <Send className="w-6 h-6 ml-0.5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-sm flex items-center justify-center space-x-1.5">
                        <span>Customer Support</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Click here to contact official 24/7 Telegram support
                      </div>
                    </div>
                    <div className="pt-1">
                      <a
                        href={getMyTelegramPreviewUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[#229ED9] text-white shadow-xs"
                      >
                        <span>Test Link Target</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Pre-filled Message Preview */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Message Pre-filled in Telegram:
                    </div>
                    <div className="text-xs text-cyan-300 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-words whitespace-pre-wrap">
                      {myTelegramGreeting
                        .replace('{username}', 'demo_trader')
                        .replace('{name}', 'Demo Trader')
                        .replace('{id}', 'user_123')}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 text-center">
                    Connected Admin: <strong className="text-white font-mono">@{adminUser.username}</strong> • Ref Code: <strong className="text-amber-400 font-mono">{referralCodeDisplay}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile App Download Configuration (Restricted strictly to jerry@786) */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <span className="text-xl">📱</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-extrabold text-white">
                        Mobile App File Upload & Download Links
                      </h3>
                      <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold rounded-full flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>Owner Restricted (jerry@786)</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Upload APK application files or paste Play Store links for client downloads on home page.
                    </p>
                  </div>
                </div>
              </div>

              {!isOwnerAdmin && (
                <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2 font-bold">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Only the Supreme Owner (jerry@786) is authorized to upload APK files or change download links.</span>
                </div>
              )}

              {appConfigMsg && (
                <div className={`mb-4 p-3 rounded-2xl border text-xs font-bold flex items-center space-x-2 ${
                  appConfigMsg.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}>
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{appConfigMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                {/* 1. Direct APK File Upload */}
                <div className="md:col-span-2 p-4 bg-slate-900/90 border border-emerald-500/30 rounded-2xl space-y-2">
                  <label className="block text-xs font-extrabold text-emerald-400 flex items-center space-x-1.5">
                    <span>Option 1: Direct Server APK File Upload (.apk)</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Instant server storage)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                      isOwnerAdmin
                        ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                    }`}>
                      <Upload className="w-4 h-4" />
                      <span>{uploadingApkFile ? 'Uploading APK File...' : 'Choose .apk File to Upload'}</span>
                      <input
                        type="file"
                        accept=".apk"
                        disabled={!isOwnerAdmin || uploadingApkFile}
                        onChange={handleFileUploadApk}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-slate-400 font-mono">
                      Current Server File: <strong className="text-cyan-300">{appApkUrl || '/downloads/flowcoin.apk'}</strong>
                    </span>
                  </div>
                </div>

                {/* 2. Google Drive / External Mirror URL */}
                <div className="md:col-span-2 p-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl space-y-2">
                  <label className="block text-xs font-extrabold text-cyan-300 flex items-center justify-between">
                    <span>Option 2: Google Drive / Cloud Mirror Download Link</span>
                    <span className="text-[10px] text-slate-400 font-normal">e.g. https://drive.google.com/file/d/...</span>
                  </label>
                  <input
                    type="url"
                    disabled={!isOwnerAdmin}
                    placeholder="e.g. https://drive.google.com/file/d/123456789/view?usp=sharing"
                    value={appDriveUrl}
                    onChange={(e) => setAppDriveUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none transition disabled:opacity-50"
                  />
                  <p className="text-[10px] text-slate-400">
                    Paste your Google Drive link here. When clients click "Cloud / Drive Download" on the Home page, they will be sent directly to this link!
                  </p>
                </div>

                {/* Optional Play Store link */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Play Store / Fallback URL (Optional)
                  </label>
                  <input
                    type="url"
                    disabled={!isOwnerAdmin}
                    placeholder="https://play.google.com/store/apps/details?id=com.flowcoin.trading"
                    value={appPlayStoreUrl}
                    onChange={(e) => setAppPlayStoreUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-600 font-mono disabled:opacity-50"
                  />
                </div>

                <div className="md:col-span-2 pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <a
                      href="/api/download-apk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/30 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Test Direct APK Link</span>
                    </a>
                    {appDriveUrl && (
                      <a
                        href="/api/download-drive"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold border border-cyan-500/30 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Test Drive Link</span>
                      </a>
                    )}
                  </div>

                  {isOwnerAdmin && (
                    <button
                      type="button"
                      disabled={savingAppConfig || uploadingApkFile}
                      onClick={handleSaveAppConfig}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                    >
                      {savingAppConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>{savingAppConfig ? 'Saving Config...' : 'Save App Download Config'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADMIN ACCOUNTS & SETTINGS TAB */}
      {currentTab === 'admins' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">
                    Administrator Access Management
                  </h2>
                  <p className="text-xs text-slate-400">
                    Create additional admin logins and manage security authority accounts
                  </p>
                </div>
              </div>
            </div>

            {/* Notification message */}
            {adminMsg && (
              <div className={`mb-6 p-4 rounded-2xl border text-xs font-bold flex items-center space-x-2.5 ${
                adminMsg.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}>
                {adminMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{adminMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form: Create New Admin */}
              <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Create New Admin Account</h3>
                </div>

                <form onSubmit={handleCreateAdmin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Admin Username <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. admin_alex or support_lead"
                      value={newAdminUsername}
                      onChange={(e) => setNewAdminUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Admin Display Name / Role Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Support Manager"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Security Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Set access password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Authority Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewAdminRole('ADMIN')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          newAdminRole === 'ADMIN'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Sub-Administrator
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAdminRole('SUPER_ADMIN')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          newAdminRole === 'SUPER_ADMIN'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Super Admin
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Custom Referral Code <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Tag className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="e.g. AGENT_ALEX (Auto-generated if empty)"
                        value={newAdminRefCode}
                        onChange={(e) => setNewAdminRefCode(e.target.value.toUpperCase())}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Assigned Telegram Support Link <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Send className="w-4 h-4 absolute left-3 top-2.5 text-[#229ED9]" />
                      <input
                        type="text"
                        placeholder="e.g. https://t.me/admin_handle or @handle"
                        value={newAdminTelegramUrl}
                        onChange={(e) => setNewAdminTelegramUrl(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-[#229ED9] font-mono"
                      />
                    </div>
                  </div>

                  {newAdminRole === 'ADMIN' && (
                    <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                      <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        Scoped Module Permissions:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newAdminPermUsers}
                            onChange={(e) => setNewAdminPermUsers(e.target.checked)}
                            className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                          />
                          <span>Users & Balance</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newAdminPermTrades}
                            onChange={(e) => setNewAdminPermTrades(e.target.checked)}
                            className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                          />
                          <span>Trades Win/Loss</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newAdminPermFinance}
                            onChange={(e) => setNewAdminPermFinance(e.target.checked)}
                            className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                          />
                          <span>Withdrawals & Deposits</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newAdminPermNotice}
                            onChange={(e) => setNewAdminPermNotice(e.target.checked)}
                            className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                          />
                          <span>Support Notice</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={adminActionLoading || !newAdminUsername.trim() || !newAdminPassword.trim()}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{adminActionLoading ? 'Creating...' : 'Create Admin Account'}</span>
                  </button>
                </form>
              </div>

              {/* List: Existing Admin Logins */}
              <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Active System Administrators ({adminList.length || 1})</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Scoped Real-time</span>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {adminList.map((admin) => {
                    const isTargetOwner = admin.isOwner || admin.id === 'admin_supreme_owner' || admin.username.toLowerCase().replace(/^[@#:]+/, '') === 'jerry@786';
                    const isTargetMaster = admin.id === 'admin_master' || admin.username.toLowerCase().replace(/^[@#:]+/, '') === 'jerry@321';
                    const isSuper = admin.role === 'SUPER_ADMIN';
                    const isSelf = admin.id === adminUser.id || admin.username.toLowerCase() === adminUser.username.toLowerCase();

                    // Absolute security guarantee: never render Supreme Owner if caller is not Supreme Owner
                    if (isTargetOwner && !isOwnerAdmin) return null;

                    const canDelete = isOwnerAdmin && !isSelf && !isTargetOwner;
                    const canEdit = isOwnerAdmin || (!isTargetOwner && (!isTargetMaster || isSelf));

                    return (
                      <div
                        key={admin.id}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                          isTargetOwner
                            ? 'bg-gradient-to-r from-amber-950/40 to-slate-900/90 border-amber-500/60 text-white ring-1 ring-amber-500/30 shadow-lg'
                            : isSelf
                            ? 'bg-cyan-950/20 border-cyan-500/40 text-white'
                            : isSuper
                            ? 'bg-amber-500/10 border-amber-500/30 text-white'
                            : 'bg-slate-900/90 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isTargetOwner
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                              : isSuper 
                              ? 'bg-amber-500 text-slate-950 shadow-md' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {isTargetOwner ? <Crown className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-extrabold text-sm text-white font-mono">@{admin.username}</span>
                              {isTargetOwner ? (
                                <span className="px-2 py-0.5 text-[9px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-md uppercase flex items-center space-x-1 shadow-xs">
                                  <span>👑 Supreme Founder (Invisible)</span>
                                </span>
                              ) : isSuper ? (
                                <span className="px-2 py-0.5 text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md uppercase">
                                  Main Admin (Super)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700 rounded-md uppercase">
                                  Sub-Admin
                                </span>
                              )}
                              {isSelf && (
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${
                                  isOwnerAdmin 
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                }`}>
                                  {isOwnerAdmin ? 'You (Supreme Owner)' : 'You (Active)'}
                                </span>
                              )}
                              {isTargetMaster && !isOwnerAdmin && !isSelf && (
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-800/80 text-amber-300/90 border border-amber-500/30 rounded-md flex items-center space-x-1">
                                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                                  <span>Protected Master</span>
                                </span>
                              )}
                              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-md">
                                Ref: {admin.referralCode || 'N/A'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <span className="text-slate-200 font-medium">{admin.name}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-emerald-400 font-bold">
                                {admin.referredClientsCount || 0} Clients
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="text-teal-300 font-mono font-semibold">
                                ${(admin.totalReferredBalance || 0).toLocaleString()} Vol
                              </span>
                            </div>
                            {/* Permission tags */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                              <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${admin.permissions?.manageUsers ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800/60 text-slate-500'}`}>
                                Users {admin.permissions?.manageUsers ? '✓' : '✗'}
                              </span>
                              <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${admin.permissions?.manageTrades ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800/60 text-slate-500'}`}>
                                Trades {admin.permissions?.manageTrades ? '✓' : '✗'}
                              </span>
                              <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${admin.permissions?.manageFinance ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800/60 text-slate-500'}`}>
                                Finance {admin.permissions?.manageFinance ? '✓' : '✗'}
                              </span>
                              <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${admin.permissions?.manageSupportNotice ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800/60 text-slate-500'}`}>
                                Notice {admin.permissions?.manageSupportNotice ? '✓' : '✗'}
                              </span>
                              {isSuper && (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-amber-500/20 text-amber-300">
                                  Full Settings ✓
                                </span>
                              )}
                            </div>

                            {admin.telegramSupportUrl && (
                              <div className="mt-1.5 flex items-center space-x-1.5 text-[10px] text-[#229ED9] font-mono">
                                <Send className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate max-w-[200px]">Desk: {admin.telegramSupportUrl}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-end sm:self-center mt-2 sm:mt-0">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditAdmin(admin)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                              title="Edit Admin Access & Permissions"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Edit Access</span>
                            </button>
                          )}
                          {!isSelf && canDelete ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition cursor-pointer"
                              title={`Delete Administrator "${admin.username}"`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : !isSelf && !isOwnerAdmin ? (
                            <div 
                              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700/60 rounded-xl text-[10px] font-bold text-slate-400 flex items-center space-x-1 cursor-not-allowed opacity-75"
                              title="Admin deletion is permanently restricted to Supreme Owner (Jerry@786) only"
                            >
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>Permanent</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Real-time Administrator Login & Devices Audit Trail */}
            <div className="mt-6 bg-slate-950/80 border border-slate-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-black text-white">Administrator Login Sessions & Active Devices Audit</h3>
                    <p className="text-[11px] text-slate-400">Track login timestamps, IP addresses, and device history for Supreme Owner (@jerry@786), Master Admin (@jerry@321) & sub-admins.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold font-mono">
                  Live Audit Trail
                </span>
              </div>

              <div className="space-y-4">
                {adminList.map((adm) => {
                  const isTargetOwner = adm.isOwner || adm.id === 'admin_supreme_owner' || adm.username.toLowerCase().replace(/^[@#:]+/, '') === 'jerry@786';
                  if (isTargetOwner && !isOwnerAdmin) return null;

                  const logs = adm.loginHistory && adm.loginHistory.length > 0 ? adm.loginHistory : [
                    {
                      id: 'log_def_' + adm.id,
                      timestamp: adm.createdAt || new Date().toISOString(),
                      ip: '182.185.12.34',
                      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
                      device: '📱 iPhone (Mobile Safari)',
                      location: 'Web App Portal'
                    }
                  ];

                  return (
                    <div key={'audit_' + adm.id} className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3 font-sans">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-xs text-white font-mono">@{adm.username}</span>
                          <span className="text-xs text-slate-400">({adm.name})</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                            Ref: {adm.referralCode}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px]">
                          <span className="text-slate-400">Last Active:</span>
                          <strong className="text-emerald-400 font-mono font-bold">
                            {adm.lastLoginTime ? new Date(adm.lastLoginTime).toLocaleString() : 'Active Recently'}
                          </strong>
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-[9px] rounded-full">
                            {logs.length} Login Records
                          </span>
                        </div>
                      </div>

                      {/* Sessions Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] font-sans">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-800/60 font-semibold">
                              <th className="py-2 pr-3">Date & Time</th>
                              <th className="py-2 px-3">Device / Platform</th>
                              <th className="py-2 px-3">IP Address</th>
                              <th className="py-2 pl-3 text-right">Session Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono">
                            {logs.slice(0, 5).map((log, idx) => (
                              <tr key={log.id || idx} className="hover:bg-slate-800/30 transition">
                                <td className="py-2 pr-3 text-white font-medium whitespace-nowrap">
                                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                                </td>
                                <td className="py-2 px-3 text-cyan-300 font-sans font-semibold whitespace-nowrap">
                                  {log.device || 'Desktop Device'}
                                </td>
                                <td className="py-2 px-3 text-amber-300/90 whitespace-nowrap">
                                  {log.ip || '127.0.0.1'}
                                </td>
                                <td className="py-2 pl-3 text-right whitespace-nowrap font-sans">
                                  {idx === 0 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                      🟢 Current Session
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                      Historic
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ADMIN ACCESS & PERMISSIONS MODAL */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setEditingAdmin(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Edit Access:</span>
                  <span className="font-mono text-cyan-300 font-black">@{editingAdmin.username}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Adjust role, permissions, credentials, or assigned invitation code
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEditAdmin} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Administrative Authority Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditAdminRole('SUPER_ADMIN');
                      setEditPermUsers(true);
                      setEditPermTrades(true);
                      setEditPermFinance(true);
                      setEditPermNotice(true);
                      setEditPermAdmins(true);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      editAdminRole === 'SUPER_ADMIN'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-black text-sm">Main Super Admin</span>
                    <span className="text-[10px] opacity-80">Full Authority (All Modules)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditAdminRole('ADMIN')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      editAdminRole === 'ADMIN'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-black text-sm">Scoped Sub-Admin</span>
                    <span className="text-[10px] opacity-80">Selective Custom Modules</span>
                  </button>
                </div>
              </div>

              {/* Name and Referral Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editAdminName}
                    onChange={(e) => setEditAdminName(e.target.value)}
                    placeholder="Admin Display Name"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Referral Code
                  </label>
                  <input
                    type="text"
                    value={editAdminRefCode}
                    onChange={(e) => setEditAdminRefCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MASTER321"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono uppercase text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Reset Password (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Reset Password <span className="text-slate-500 font-normal">(Leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <input
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    value={editAdminPassword}
                    onChange={(e) => setEditAdminPassword(e.target.value)}
                    placeholder="Type new password to reset"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Scoped Permissions (Visible when Sub-Admin or for review) */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Module Access Permissions:
                  </span>
                  {editAdminRole === 'SUPER_ADMIN' && (
                    <span className="text-[10px] text-amber-400 font-semibold">
                      Full Access Auto-Granted
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermUsers}
                      disabled={editAdminRole === 'SUPER_ADMIN'}
                      onChange={(e) => setEditPermUsers(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Users & Balance</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermTrades}
                      disabled={editAdminRole === 'SUPER_ADMIN'}
                      onChange={(e) => setEditPermTrades(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Trades Win/Loss</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermFinance}
                      disabled={editAdminRole === 'SUPER_ADMIN'}
                      onChange={(e) => setEditPermFinance(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Withdrawals & Deposits</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermNotice}
                      disabled={editAdminRole === 'SUPER_ADMIN'}
                      onChange={(e) => setEditPermNotice(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Support Notice</span>
                  </label>
                </div>
              </div>

              {/* Personal Telegram Support Desk for this Admin */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-[#229ED9]/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center space-x-1.5">
                    <Send className="w-3.5 h-3.5 text-[#229ED9]" />
                    <span>Assigned Telegram Support Link</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Scoped Desk</span>
                </div>
                <input
                  type="text"
                  value={editAdminTelegramUrl}
                  onChange={(e) => setEditAdminTelegramUrl(e.target.value)}
                  placeholder="e.g. https://t.me/admin_handle or @handle"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-[#229ED9]"
                />
                <input
                  type="text"
                  value={editAdminTelegramGreeting}
                  onChange={(e) => setEditAdminTelegramGreeting(e.target.value)}
                  placeholder="Greeting message (Tokens: {username}, {id})"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#229ED9]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-xl text-xs transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {adminActionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{adminActionLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER MANAGEMENT & CONTROL MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <XCircle className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 font-bold text-xl flex items-center justify-center">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>User Control Room: {selectedUser.name}</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedUser.email} (ID: {selectedUser.id})
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 font-sans">
                  {selectedUser.currency === 'USDT' ? '🟢 USDT (₮)' : selectedUser.currency === 'PKR' ? '🇵🇰 PKR (₨)' : selectedUser.currency === 'INR' ? '🇮🇳 INR (₹)' : selectedUser.currency === 'BRL' ? '🇧🇷 BRL (R$)' : '🇺🇸 USD ($)'}
                </span>
              </div>
            </div>

            {/* Feedback message */}
            {modalStatusMsg && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2 font-sans">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{modalStatusMsg}</span>
              </div>
            )}

            {clientPasswordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 font-sans">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{clientPasswordSuccess}</span>
              </div>
            )}

            {/* Current Balances Snapshot */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 flex items-center justify-between font-sans">
                  <span>Available Balance</span>
                  <span className="text-amber-400 font-bold text-[10px]">{selectedUser.currency || 'USD'}</span>
                </div>
                <div className="text-xl font-bold text-emerald-400 font-mono">
                  {CURRENCIES[(selectedUser.currency || 'USD') as CurrencyCode]?.symbol || '$'}{(selectedUser.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 flex items-center justify-between font-sans">
                  <span>Frozen Balance</span>
                  <span className="text-amber-400 font-bold text-[10px]">{selectedUser.currency || 'USD'}</span>
                </div>
                <div className="text-xl font-bold text-amber-300 font-mono">
                  {CURRENCIES[(selectedUser.currency || 'USD') as CurrencyCode]?.symbol || '$'}{(selectedUser.freezeBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* 1. BALANCE INJECTION / DEDUCTION CONTROLLER */}
            <div className="mb-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-3 font-sans">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>1. Add or Deduct Balance ({selectedUser.currency || 'USD'}):</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  Currency: {selectedUser.currency || 'USD'}
                </span>
              </div>

              <div className="flex space-x-2">
                {(['ADD', 'DEDUCT', 'SET'] as const).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setBalanceAction(act)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      balanceAction === act
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {act === 'ADD' ? `+ Add ${selectedUser.currency || 'USD'}` : act === 'DEDUCT' ? `- Deduct ${selectedUser.currency || 'USD'}` : `Set ${selectedUser.currency || 'USD'}`}
                  </button>
                ))}
              </div>

              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold">
                    {CURRENCIES[(selectedUser.currency || 'USD') as CurrencyCode]?.symbol || '$'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder={`Enter amount in ${selectedUser.currency || 'USD'} (e.g. 500)`}
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleApplyBalance}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {selectedUser.freezeBalance > 0 && (
                <button
                  type="button"
                  onClick={handleUnfreezeUser}
                  className="w-full py-1.5 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/30 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unfreeze All Funds ({selectedUser.currency === 'USDT' ? '₮' : selectedUser.currency === 'PKR' ? '₨' : selectedUser.currency === 'INR' ? '₹' : selectedUser.currency === 'BRL' ? 'R$' : '$'}{selectedUser.freezeBalance.toFixed(2)}) Back to Active</span>
                </button>
              )}
            </div>

            {/* 2. CREDIT SCORE CONTROLLER */}
            <div className="mb-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-teal-400" />
                  <span>2. Credit Score Adjustment:</span>
                </span>
                <span className="text-teal-300 font-mono text-sm">{newCreditScore} / 100</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={newCreditScore}
                onChange={(e) => setNewCreditScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setNewCreditScore(100)}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg cursor-pointer"
                >
                  Set 100 (Max)
                </button>
                <button
                  type="button"
                  onClick={() => setNewCreditScore(95)}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg cursor-pointer"
                >
                  Set 95 (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setNewCreditScore(50)}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg cursor-pointer"
                >
                  Set 50 (Warning)
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleApplyCreditScore}
                  className="ml-auto px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Save Score
                </button>
              </div>
            </div>

            {/* 3. TRADE OUTCOME CONTROL (AUTO / FORCE WIN / FORCE LOSS) */}
            <div className="mb-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-3 font-sans">
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>3. Trade Outcome Engine Mode:</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyTradeMode('AUTO')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    newTradeMode === 'AUTO'
                      ? 'bg-slate-800 text-white border-slate-600'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Auto (Natural)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTradeMode('FORCE_WIN')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    newTradeMode === 'FORCE_WIN'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Force Win (100%)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTradeMode('FORCE_LOSS')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    newTradeMode === 'FORCE_LOSS'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Force Loss (0%)
                </button>
              </div>
            </div>

            {/* 4. CLIENT PASSWORD MANAGEMENT */}
            <div className="mb-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-3 font-sans">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>4. Client Login & Password Control:</span>
                </div>
                <span className="text-[10px] text-cyan-300 font-mono">
                  Username: @{selectedUser.username || selectedUser.name}
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                If the client forgets their password or cannot log in on mobile, reset it here:
              </p>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter new password (e.g. Pass1234)"
                  value={newClientPassword}
                  onChange={(e) => setNewClientPassword(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  disabled={actionLoading || !newClientPassword.trim()}
                  onClick={handleUpdateClientPassword}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </div>

            {/* 5. ACCOUNT STATUS & FREEZE CONTROL WITH REASON */}
            <div className="mb-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/90 space-y-3 font-sans">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>5. Account Freeze & Deactivation Control:</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  selectedUser.status === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {selectedUser.status === 'active' ? 'Active' : 'FROZEN / DEACTIVATED'}
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Freezing deactivates the account. Enter a reason below so the client can read why their account was blocked.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Freeze / Block Reason (Visible to Client) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Identity verification pending, Suspicious trade pattern, Audit review required"
                  value={freezeReasonInput}
                  onChange={(e) => setFreezeReasonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-rose-300 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await api.updateAdminUserStatus(selectedUser.id, 'active', '');
                      setSelectedUser(res.user);
                      setFreezeReasonInput('');
                      setModalStatusMsg('Account status set to ACTIVE!');
                      loadAdminData();
                    } catch (err: any) {
                      setModalStatusMsg(err.message || 'Failed to update status');
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    selectedUser.status === 'active'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Reactivate Account</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const finalReason = freezeReasonInput.trim() || 'Security audit verification required by administration.';
                      const res = await api.updateAdminUserStatus(selectedUser.id, 'frozen', finalReason);
                      setSelectedUser(res.user);
                      setModalStatusMsg(`Account status set to FROZEN / DEACTIVATED! Reason: "${finalReason}"`);
                      loadAdminData();
                    } catch (err: any) {
                      setModalStatusMsg(err.message || 'Failed to freeze account');
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    selectedUser.status === 'frozen' || selectedUser.status === 'suspended'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-white" />
                  <span>Freeze Account with Reason</span>
                </button>
              </div>
            </div>

            {/* 5. DANGER ZONE: DELETE CLIENT ACCOUNT */}
            <div className="p-3 bg-rose-950/20 rounded-2xl border border-rose-900/40 flex items-center justify-between font-sans">
              <div>
                <span className="text-xs font-bold text-rose-300 block">Delete Trader Account</span>
                <span className="text-[10px] text-rose-400/80">Permanently remove this user and their trade history</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteClientUser(selectedUser.id, selectedUser.username || selectedUser.name)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CLIENT ACCOUNT MODAL */}
      {createClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 text-white animate-scale-up max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => { setCreateClientModalOpen(false); setCreateClientMsg(null); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 font-bold text-xl flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Create New Trader Account</h2>
                <p className="text-xs text-slate-400">
                  Register a client directly with customized credentials & currency
                </p>
              </div>
            </div>

            {createClientMsg && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-center space-x-2 ${
                createClientMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {createClientMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{createClientMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateClientAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. trader99"
                    value={createClientUsername}
                    onChange={(e) => setCreateClientUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Secret123"
                    value={createClientPassword}
                    onChange={(e) => setCreateClientPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={createClientName}
                    onChange={(e) => setCreateClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. john@trade.com"
                    value={createClientEmail}
                    onChange={(e) => setCreateClientEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Currency Selection - Default USD */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Account Currency (Default: USD)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['USD', 'INR', 'PKR', 'BRL', 'EGP'] as CurrencyCode[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCreateClientCurrency(c)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        createClientCurrency === c
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow'
                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {c === 'USD' ? '🇺🇸 USD ($)' : c === 'INR' ? '🇮🇳 INR (₹)' : c === 'PKR' ? '🇵🇰 PKR (₨)' : c === 'BRL' ? '🇧🇷 BRL (R$)' : '🇪🇬 EGP (E£)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Initial Balance ({createClientCurrency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="1000"
                    value={createClientBalance}
                    onChange={(e) => setCreateClientBalance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Credit Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="95"
                    value={createClientCreditScore}
                    onChange={(e) => setCreateClientCreditScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-teal-400 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setCreateClientModalOpen(false); setCreateClientMsg(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createClientLoading}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {createClientLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in font-sans">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 text-white animate-scale-up">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Reject Withdrawal & Refund
                </h3>
                <p className="text-xs text-slate-400">
                  {rejectingRequest.userName} • ${rejectingRequest.amount.toFixed(2)} USDT
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-300 mb-3">
              Please enter the specific reason why this withdrawal is being rejected. This exact note will be displayed directly to the client on their withdrawal status records:
            </div>

            {/* Quick Templates */}
            <div className="space-y-1.5 mb-3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Reason Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Bank account IFSC / details mismatch',
                  'KYC verification pending. Complete KYC first.',
                  'Insufficient trade turnover requirement.',
                  'Invalid crypto USDT wallet address.',
                  'Risk audit hold: Contact customer support.'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionNote(preset)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg border border-slate-700 text-left transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Rejection Note / Client Notice:
              </label>
              <textarea
                rows={3}
                required
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Explain why withdrawal was rejected..."
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-sans"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectLoading || !rejectionNote.trim()}
                onClick={handleConfirmRejection}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {rejectLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Referral Code Customization Modal */}
      {refModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">Customize My Referral Code</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRefModalOpen(false);
                  setRefChangeMsg(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Set your custom referral code. Clients who register with this code will be directly assigned under your admin account.
            </p>

            {refChangeMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 font-bold ${
                refChangeMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {refChangeMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                <span>{refChangeMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangeMyReferralCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  New Referral Code (Alphanumeric):
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-3 text-cyan-400" />
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={myNewRefCode}
                    onChange={(e) => setMyNewRefCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    placeholder="e.g. JERRY786 or MYREF123"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-sm font-mono font-bold uppercase text-cyan-300 placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Saved directly to database.json and persists upon page refresh.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRefModalOpen(false);
                    setRefChangeMsg(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refChangeLoading || !myNewRefCode.trim()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-black rounded-xl text-xs transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {refChangeLoading ? 'Saving...' : 'Save & Activate Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
