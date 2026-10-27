import { User, AdminUser, Trade, WalletRequest, AdminStats, SupportNotice, CurrencyCode, UserNotification } from '../types';

const STORAGE_KEY_USERS = 'cflownex_local_users';
const STORAGE_KEY_ADMINS = 'cflownex_local_admins';
const STORAGE_KEY_TRADES = 'cflownex_local_trades';
const STORAGE_KEY_WALLET_REQUESTS = 'cflownex_local_wallet_requests';
const STORAGE_KEY_SUPPORT_NOTICE = 'cflownex_local_support_notice';
const STORAGE_KEY_APP_CONFIG = 'cflownex_local_app_config';
const STORAGE_KEY_NOTIFICATIONS = 'cflownex_local_notifications';

// Initial admin accounts
const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'admin_supreme_owner',
    username: 'jerry@786',
    email: 'jerry@786',
    name: 'Supreme Founder (Owner)',
    role: 'SUPER_ADMIN',
    referralCode: 'JERRY786',
    isOwner: true,
    isPermanentMaster: false,
    permissions: {
      manageUsers: true,
      manageTrades: true,
      manageFinance: true,
      manageSupportNotice: true,
      manageAdmins: true
    },
    createdAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'admin_owner_am9318930',
    username: 'am9318930@gmail.com',
    email: 'am9318930@gmail.com',
    name: 'Main Owner (AM)',
    role: 'SUPER_ADMIN',
    referralCode: 'tesla@123',
    isOwner: true,
    isPermanentMaster: false,
    permissions: {
      manageUsers: true,
      manageTrades: true,
      manageFinance: true,
      manageSupportNotice: true,
      manageAdmins: true
    },
    createdAt: '2026-10-27T21:40:00.000Z'
  },
  {
    id: 'admin_master',
    username: 'jerry@321',
    email: 'jerry@321',
    name: 'Master Admin (Main)',
    role: 'SUPER_ADMIN',
    referralCode: 'MASTER321',
    isPermanentMaster: true,
    permissions: {
      manageUsers: true,
      manageTrades: true,
      manageFinance: true,
      manageSupportNotice: true,
      manageAdmins: true
    },
    createdAt: '2026-09-01T00:00:00.000Z'
  }
];

// Initial passwords mapping for local fallback
const ADMIN_PASSWORDS: Record<string, string> = {
  'jerry@786': 'jerry@786',
  'am9318930@gmail.com': 'tesla@123',
  'jerry@321': 'jerry@321'
};

const INITIAL_USERS: User[] = [
  {
    id: 'user_venom',
    name: 'Venom Trader',
    username: 'venom',
    email: 'venom@flowcoin.online',
    password: 'venom',
    balance: 1000,
    freezeBalance: 0,
    creditScore: 100,
    currency: 'USD',
    status: 'active',
    tradeMode: 'AUTO',
    referredByAdminId: 'admin_master',
    referredByAdminUsername: 'jerry@321',
    referralCodeUsed: 'MASTER321',
    createdAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'user_demo_1',
    name: 'Ali Khan',
    username: 'alikhan',
    email: 'demo@flowcoin.com',
    password: 'password123',
    balance: 2450,
    freezeBalance: 150,
    creditScore: 96,
    currency: 'USD',
    status: 'active',
    tradeMode: 'AUTO',
    referredByAdminId: 'admin_master',
    referredByAdminUsername: 'jerry@321',
    referralCodeUsed: 'MASTER321',
    createdAt: '2026-08-30T10:00:00.000Z'
  },
  {
    id: 'user_demo_2',
    name: 'Hamza Trader',
    username: 'hamzatrader',
    email: 'hamza@flowcoin.com',
    password: 'password123',
    balance: 10800.5,
    freezeBalance: 500,
    creditScore: 100,
    currency: 'USD',
    status: 'active',
    tradeMode: 'AUTO',
    referredByAdminId: 'admin_master',
    referredByAdminUsername: 'jerry@321',
    referralCodeUsed: 'MASTER321',
    createdAt: '2026-09-02T14:30:00.000Z'
  }
];

const INITIAL_SUPPORT_NOTICE: SupportNotice = {
  id: 'notice_default',
  title: 'Official Support Notice',
  message: 'Welcome to CELLS FLOWNEX Trading. Our real-time settlement and customer support desk is active 24/7.',
  updatedAt: '2026-09-04T12:00:00.000Z',
  isActive: true,
  telegramSupportUrl: 'https://t.me/flowcoin_support'
};

const INITIAL_APP_CONFIG = {
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.flowcoin.trading',
  apkUrl: '/downloads/flowcoin.apk',
  driveUrl: ''
};

// Safe storage access
function getItem<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch (e) {
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

export const localStore = {
  getAdmins(): AdminUser[] {
    const admins = getItem<AdminUser[]>(STORAGE_KEY_ADMINS, INITIAL_ADMINS);
    // Ensure all 3 permanent admins are present
    const ids = new Set(admins.map(a => a.id));
    for (const initAdmin of INITIAL_ADMINS) {
      if (!ids.has(initAdmin.id)) {
        admins.push(initAdmin);
      }
    }
    // Update passwords
    return admins;
  },

  getAdminPasswords(): Record<string, string> {
    return getItem<Record<string, string>>('cflownex_admin_passwords', ADMIN_PASSWORDS);
  },

  saveAdmins(admins: AdminUser[]): void {
    setItem(STORAGE_KEY_ADMINS, admins);
  },

  getUsers(): User[] {
    return getItem<User[]>(STORAGE_KEY_USERS, INITIAL_USERS);
  },

  saveUsers(users: User[]): void {
    setItem(STORAGE_KEY_USERS, users);
  },

  getTrades(): Trade[] {
    return getItem<Trade[]>(STORAGE_KEY_TRADES, []);
  },

  saveTrades(trades: Trade[]): void {
    setItem(STORAGE_KEY_TRADES, trades);
  },

  getWalletRequests(): WalletRequest[] {
    return getItem<WalletRequest[]>(STORAGE_KEY_WALLET_REQUESTS, []);
  },

  saveWalletRequests(requests: WalletRequest[]): void {
    setItem(STORAGE_KEY_WALLET_REQUESTS, requests);
  },

  getSupportNotice(): SupportNotice {
    return getItem<SupportNotice>(STORAGE_KEY_SUPPORT_NOTICE, INITIAL_SUPPORT_NOTICE);
  },

  saveSupportNotice(notice: SupportNotice): void {
    setItem(STORAGE_KEY_SUPPORT_NOTICE, notice);
  },

  getAppConfig(): { playStoreUrl: string; apkUrl: string; driveUrl?: string } {
    return getItem(STORAGE_KEY_APP_CONFIG, INITIAL_APP_CONFIG);
  },

  saveAppConfig(cfg: { playStoreUrl: string; apkUrl: string; driveUrl?: string }): void {
    setItem(STORAGE_KEY_APP_CONFIG, cfg);
  },

  getNotifications(userId: string): UserNotification[] {
    const all = getItem<Record<string, UserNotification[]>>(STORAGE_KEY_NOTIFICATIONS, {});
    return all[userId] || [];
  },

  addNotification(userId: string, title: string, message: string, type: UserNotification['type']): void {
    const all = getItem<Record<string, UserNotification[]>>(STORAGE_KEY_NOTIFICATIONS, {});
    if (!all[userId]) all[userId] = [];
    const notif: UserNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    all[userId].unshift(notif);
    setItem(STORAGE_KEY_NOTIFICATIONS, all);
  },

  // 1. REGISTER
  register(params: {
    username: string;
    name?: string;
    email?: string;
    password?: string;
    currency?: string;
    referralCode?: string;
  }): { user: User } {
    const cleanUser = (params.username || '').trim();
    const cleanName = (params.name || cleanUser).trim();
    const cleanPass = (params.password || '').trim();
    const cleanRef = (params.referralCode || '').trim().toUpperCase();
    const cleanRefNoSpecial = cleanRef.replace(/[^A-Z0-9]/g, '');

    if (!cleanUser || !cleanPass) {
      throw new Error('Username and password are required');
    }
    if (!cleanRef) {
      throw new Error('Referral code is required. Registration is by invitation only.');
    }

    const admins = this.getAdmins();
    const matchedAdmin = admins.find(a => {
      const aRef = (a.referralCode || '').trim().toUpperCase();
      const aRefNoSpecial = aRef.replace(/[^A-Z0-9]/g, '');
      const aUser = (a.username || '').trim().toUpperCase();
      const aUserNoSpecial = aUser.replace(/[^A-Z0-9]/g, '');
      const aId = (a.id || '').trim().toUpperCase();

      return (
        aRef === cleanRef ||
        (cleanRefNoSpecial && aRefNoSpecial === cleanRefNoSpecial) ||
        aUser === cleanRef ||
        (cleanRefNoSpecial && aUserNoSpecial === cleanRefNoSpecial) ||
        aId === cleanRef ||
        (cleanRef === 'TESLA@123' && (aRef === 'TESLA123' || a.id === 'admin_owner_am9318930' || aUser.includes('AM9318930'))) ||
        (cleanRef === 'TESLA123' && (aRef === 'TESLA@123' || a.id === 'admin_owner_am9318930' || aUser.includes('AM9318930')))
      );
    });

    if (!matchedAdmin) {
      throw new Error('Invalid referral code! Please enter the exact referral code provided by your administrator.');
    }

    const users = this.getUsers();
    const finalEmail = params.email ? params.email.trim().toLowerCase() : `${cleanUser.toLowerCase().replace(/[^a-z0-9]/g, '')}@flowcoin.com`;
    const existing = users.find(u => 
      (u.username && u.username.toLowerCase() === cleanUser.toLowerCase()) ||
      u.email.toLowerCase() === finalEmail
    );
    if (existing) {
      throw new Error('An account with this username or email already exists');
    }

    const newUser: User = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      username: cleanUser,
      email: finalEmail,
      password: cleanPass,
      balance: 0.00,
      freezeBalance: 0.00,
      creditScore: 100,
      currency: (params.currency as CurrencyCode) || 'USD',
      status: 'active',
      tradeMode: 'AUTO',
      referredByAdminId: matchedAdmin.id,
      referredByAdminUsername: matchedAdmin.username,
      referralCodeUsed: cleanRef,
      createdAt: new Date().toISOString()
    };

    users.unshift(newUser);
    this.saveUsers(users);

    const { password: _, ...safeUser } = newUser;
    return { user: safeUser as User };
  },

  // 2. UNIFIED LOGIN
  login(identifier: string, pass: string): { user?: User; admin?: AdminUser; isAdmin?: boolean } {
    const cleanId = (identifier || '').trim().toLowerCase().replace(/^[@#:]+/, '');
    const cleanPass = (pass || '').trim();

    // Check Admins
    const admins = this.getAdmins();
    const passwords = this.getAdminPasswords();

    const matchedAdmin = admins.find(a => {
      const aUser = (a.username || '').trim().toLowerCase().replace(/^[@#:]+/, '');
      const aEmail = (a.email || '').trim().toLowerCase();
      const aId = (a.id || '').trim().toLowerCase();
      return aUser === cleanId || aEmail === cleanId || aId === cleanId;
    });

    if (matchedAdmin) {
      const storedPass = passwords[matchedAdmin.username] || ADMIN_PASSWORDS[matchedAdmin.username] || matchedAdmin.username;
      if (storedPass === cleanPass || matchedAdmin.username === cleanPass) {
        return {
          isAdmin: true,
          admin: {
            ...matchedAdmin,
            isOwner: Boolean(matchedAdmin.isOwner || matchedAdmin.id === 'admin_supreme_owner' || matchedAdmin.id === 'admin_owner_am9318930' || matchedAdmin.username === 'jerry@786' || matchedAdmin.username === 'am9318930@gmail.com')
          }
        };
      } else {
        throw new Error('Incorrect administrator password');
      }
    }

    // Check Users
    const users = this.getUsers();
    const matchedUser = users.find(u => {
      const uUser = (u.username || '').trim().toLowerCase().replace(/^[@#:]+/, '');
      const uEmail = (u.email || '').trim().toLowerCase();
      return uUser === cleanId || uEmail === cleanId;
    });

    if (matchedUser) {
      if ((matchedUser.password || '') === cleanPass) {
        const { password: _, ...safeUser } = matchedUser;
        return { user: safeUser as User };
      } else {
        throw new Error('Incorrect password');
      }
    }

    throw new Error('User not found. Please register or check your credentials.');
  },

  // 3. ADMIN LOGIN
  adminLogin(identifier: string, pass: string): { admin: AdminUser } {
    const res = this.login(identifier, pass);
    if (!res.isAdmin || !res.admin) {
      throw new Error('Invalid admin credentials');
    }
    return { admin: res.admin };
  },

  // 4. ADMIN USERS
  getAdminUsers(adminId?: string): { users: User[] } {
    const users = this.getUsers();
    const trades = this.getTrades();
    const admins = this.getAdmins();
    const admin = admins.find(a => a.id === adminId || a.username.toLowerCase() === (adminId || '').toLowerCase());

    const isOwnerOrSuper = !admin || admin.isOwner || admin.role === 'SUPER_ADMIN' || admin.username === 'jerry@786' || admin.username === 'am9318930@gmail.com';
    const scopedUsers = isOwnerOrSuper ? users : users.filter(u => 
      u.referredByAdminId === admin.id ||
      (u.referralCodeUsed && u.referralCodeUsed.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === (admin.referralCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')) ||
      (u.referredByAdminUsername && u.referredByAdminUsername.toLowerCase() === admin.username.toLowerCase())
    );

    const safeUsers = scopedUsers.map(u => ({
      ...u,
      username: u.username || u.name,
      totalTrades: trades.filter(t => t.userId === u.id).length,
      winTrades: trades.filter(t => t.userId === u.id && t.outcome === 'WIN').length
    }));

    return { users: safeUsers };
  },

  updateUserBalance(userId: string, action: 'ADD' | 'DEDUCT' | 'SET', amount: number): { user: User; message: string } {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const val = Number(amount);
    if (isNaN(val) || val <= 0) throw new Error('Invalid amount');

    if (action === 'ADD') {
      user.balance = Number((user.balance + val).toFixed(2));
    } else if (action === 'DEDUCT') {
      user.balance = Number(Math.max(0, user.balance - val).toFixed(2));
    } else if (action === 'SET') {
      user.balance = Number(val.toFixed(2));
    }
    this.saveUsers(users);

    const { password: _, ...safeUser } = user;
    return { user: safeUser as User, message: `Balance updated (${action} ${val})` };
  },

  updateUserCreditScore(userId: string, creditScore: number): { user: User } {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.creditScore = creditScore;
    this.saveUsers(users);
    const { password: _, ...safeUser } = user;
    return { user: safeUser as User };
  },

  updateUserFreezeBalance(userId: string, amount: number, action: 'SET' | 'UNFREEZE_ALL'): { user: User } {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    if (action === 'UNFREEZE_ALL') {
      user.balance = Number((user.balance + user.freezeBalance).toFixed(2));
      user.freezeBalance = 0;
    } else {
      user.freezeBalance = Number(amount.toFixed(2));
    }
    this.saveUsers(users);
    const { password: _, ...safeUser } = user;
    return { user: safeUser as User };
  },

  updateUserTradeMode(userId: string, tradeMode: 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS'): { user: User } {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.tradeMode = tradeMode;
    this.saveUsers(users);
    const { password: _, ...safeUser } = user;
    return { user: safeUser as User };
  },

  updateUserStatus(userId: string, status: 'active' | 'suspended' | 'frozen', reason?: string): { user: User } {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.status = status;
    if (reason) user.freezeReason = reason;
    this.saveUsers(users);
    const { password: _, ...safeUser } = user;
    return { user: safeUser as User };
  },

  updateUserPassword(userId: string, newPass: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.password = newPass.trim();
    this.saveUsers(users);
    return { success: true, message: 'User password updated successfully' };
  },

  deleteUser(userId: string): { success: boolean; message: string } {
    let users = this.getUsers();
    users = users.filter(u => u.id !== userId);
    this.saveUsers(users);
    return { success: true, message: 'User deleted successfully' };
  },

  // 5. TRADES
  createTrade(params: {
    userId: string;
    symbol: string;
    direction: 'UP' | 'DOWN';
    duration: number;
    amount: number;
  }): { trade: Trade; user: Partial<User> } {
    const users = this.getUsers();
    const user = users.find(u => u.id === params.userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error('Account is suspended or frozen');
    if (user.balance < params.amount) throw new Error('Insufficient available balance');

    user.balance = Number((user.balance - params.amount).toFixed(2));
    user.freezeBalance = Number((user.freezeBalance + params.amount).toFixed(2));

    const now = Date.now();
    const trade: Trade = {
      id: 'trade_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      symbol: params.symbol,
      direction: params.direction,
      duration: params.duration,
      amount: params.amount,
      profitPercentage: 40,
      entryPrice: 88450.50,
      status: 'RUNNING',
      startTime: now,
      expireTime: now + params.duration * 1000,
      createdAt: new Date().toISOString()
    };

    const trades = this.getTrades();
    trades.unshift(trade);
    this.saveTrades(trades);
    this.saveUsers(users);

    this.addNotification(
      user.id,
      '📈 Order Placed',
      `Placed ${params.duration}s option on ${params.symbol} (${params.direction}) for ${params.amount} ${user.currency || 'USD'}.`,
      'TRADE_PLACE'
    );

    // Auto-settlement schedule
    setTimeout(() => {
      this.settleTradeAuto(trade.id);
    }, params.duration * 1000);

    return { trade, user: { balance: user.balance, freezeBalance: user.freezeBalance } };
  },

  settleTradeAuto(tradeId: string) {
    const trades = this.getTrades();
    const trade = trades.find(t => t.id === tradeId);
    if (!trade || trade.status !== 'RUNNING') return;

    const users = this.getUsers();
    const user = users.find(u => u.id === trade.userId);

    trade.status = 'SETTLED';
    const isLoss = user && user.tradeMode === 'FORCE_LOSS';
    const isWin = !isLoss;

    if (isWin) {
      trade.outcome = 'WIN';
      const profit = (trade.amount * trade.profitPercentage) / 100;
      trade.payout = Number((trade.amount + profit).toFixed(2));
      if (user) {
        user.freezeBalance = Math.max(0, Number((user.freezeBalance - trade.amount).toFixed(2)));
        user.balance = Number((user.balance + trade.payout).toFixed(2));
        this.addNotification(
          user.id,
          '🎉 Trade Settled - WIN!',
          `Your option on ${trade.symbol} won! Payout of ${trade.payout} credited.`,
          'TRADE_WIN'
        );
      }
    } else {
      trade.outcome = 'LOSS';
      trade.payout = 0;
      if (user) {
        user.freezeBalance = Math.max(0, Number((user.freezeBalance - trade.amount).toFixed(2)));
        this.addNotification(
          user.id,
          '📉 Trade Settled - LOSS',
          `Your option on ${trade.symbol} expired.`,
          'TRADE_LOSS'
        );
      }
    }

    this.saveTrades(trades);
    this.saveUsers(users);
  },

  getAdminTrades(adminId?: string): { trades: Trade[] } {
    return { trades: this.getTrades() };
  },

  updateAdminTrade(tradeId: string, params: any): { trade: Trade } {
    const trades = this.getTrades();
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) throw new Error('Trade not found');
    Object.assign(trade, params);
    this.saveTrades(trades);
    return { trade };
  },

  settleAdminTradeNow(tradeId: string, forceOutcome: 'WIN' | 'LOSS'): { trade: Trade } {
    const trades = this.getTrades();
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) throw new Error('Trade not found');

    const users = this.getUsers();
    const user = users.find(u => u.id === trade.userId);

    trade.status = 'SETTLED';
    trade.outcome = forceOutcome;

    if (forceOutcome === 'WIN') {
      const profit = (trade.amount * (trade.profitPercentage || 40)) / 100;
      trade.payout = Number((trade.amount + profit).toFixed(2));
      if (user) {
        user.freezeBalance = Math.max(0, Number((user.freezeBalance - trade.amount).toFixed(2)));
        user.balance = Number((user.balance + trade.payout).toFixed(2));
      }
    } else {
      trade.payout = 0;
      if (user) {
        user.freezeBalance = Math.max(0, Number((user.freezeBalance - trade.amount).toFixed(2)));
      }
    }

    this.saveTrades(trades);
    this.saveUsers(users);
    return { trade };
  },

  // 6. WALLET REQUESTS
  createDepositRequest(userId: string, amount: number, currency: string, network: string, txHash?: string): { request: WalletRequest } {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const request: WalletRequest = {
      id: 'req_d_' + Math.random().toString(36).substring(2, 8),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      type: 'DEPOSIT',
      amount,
      currency,
      network,
      txHash,
      status: 'PENDING',
      remarks: 'Deposit submitted',
      createdAt: new Date().toISOString()
    };

    const requests = this.getWalletRequests();
    requests.unshift(request);
    this.saveWalletRequests(requests);

    this.addNotification(user.id, 'Deposit Request Submitted', `Submitted deposit of ${amount} ${currency}.`, 'DEPOSIT_PENDING');
    return { request };
  },

  createWithdrawRequest(userId: string, amount: number, currency: string, bankDetails?: any, walletAddress?: string): { request: WalletRequest; user: User } {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error('Account is suspended or frozen');
    if (user.balance < amount) throw new Error('Insufficient balance');

    user.balance = Number((user.balance - amount).toFixed(2));
    user.freezeBalance = Number((user.freezeBalance + amount).toFixed(2));

    const request: WalletRequest = {
      id: 'req_w_' + Math.random().toString(36).substring(2, 8),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      type: 'WITHDRAWAL',
      amount,
      currency,
      network: bankDetails?.network || 'BANK',
      walletAddress,
      bankDetails,
      status: 'PENDING',
      remarks: 'Withdrawal submitted for settlement audit',
      createdAt: new Date().toISOString()
    };

    const requests = this.getWalletRequests();
    requests.unshift(request);
    this.saveWalletRequests(requests);
    this.saveUsers(users);

    this.addNotification(user.id, 'Withdrawal Request Submitted', `Submitted withdrawal of ${amount} ${currency}.`, 'WITHDRAW_PENDING');

    const { password: _, ...safeUser } = user;
    return { request, user: safeUser as User };
  },

  getUserWalletRequests(userId: string): { requests: WalletRequest[] } {
    const all = this.getWalletRequests();
    return { requests: all.filter(r => r.userId === userId) };
  },

  getAdminWalletRequests(adminId?: string): { requests: WalletRequest[] } {
    return { requests: this.getWalletRequests() };
  },

  handleAdminWalletRequest(requestId: string, action: 'APPROVE' | 'REJECT', remarks?: string): { request: WalletRequest } {
    const requests = this.getWalletRequests();
    const request = requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    const users = this.getUsers();
    const user = users.find(u => u.id === request.userId);

    if (request.type === 'WITHDRAWAL') {
      if (action === 'APPROVE') {
        request.status = 'APPROVED';
        request.remarks = remarks || 'Withdrawal audited and settled to client account';
        if (user) {
          user.freezeBalance = Math.max(0, Number((user.freezeBalance - request.amount).toFixed(2)));
          this.addNotification(user.id, '✅ Withdrawal Approved!', `Your withdrawal of ${request.amount} has been paid.`, 'WITHDRAW_APPROVED');
        }
      } else {
        request.status = 'REJECTED';
        request.remarks = remarks || 'Withdrawal rejected';
        if (user) {
          user.freezeBalance = Math.max(0, Number((user.freezeBalance - request.amount).toFixed(2)));
          user.balance = Number((user.balance + request.amount).toFixed(2));
          this.addNotification(user.id, '❌ Withdrawal Rejected', `Your withdrawal was rejected: ${request.remarks}`, 'WITHDRAW_REJECTED');
        }
      }
    } else {
      if (action === 'APPROVE') {
        request.status = 'APPROVED';
        request.remarks = remarks || 'Deposit confirmed and credited';
        if (user) {
          user.balance = Number((user.balance + request.amount).toFixed(2));
          this.addNotification(user.id, '✅ Deposit Approved!', `Your deposit of ${request.amount} has been credited.`, 'DEPOSIT_APPROVED');
        }
      } else {
        request.status = 'REJECTED';
        request.remarks = remarks || 'Deposit rejected';
        if (user) {
          this.addNotification(user.id, '❌ Deposit Rejected', `Your deposit was rejected: ${request.remarks}`, 'DEPOSIT_REJECTED');
        }
      }
    }

    this.saveWalletRequests(requests);
    this.saveUsers(users);
    return { request };
  },

  // 7. STATS
  getAdminStats(adminId?: string): { stats: AdminStats } {
    const users = this.getUsers();
    const trades = this.getTrades();
    const requests = this.getWalletRequests();

    const totalUsers = users.length;
    const totalActiveBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
    const totalFrozenBalance = users.reduce((acc, u) => acc + (u.freezeBalance || 0), 0);
    const totalTrades = trades.length;
    const activeTrades = trades.filter(t => t.status === 'RUNNING').length;
    const pendingWithdrawals = requests.filter(r => r.type === 'WITHDRAWAL' && r.status === 'PENDING').length;
    const pendingWithdrawalAmount = requests
      .filter(r => r.type === 'WITHDRAWAL' && r.status === 'PENDING')
      .reduce((acc, r) => acc + r.amount, 0);
    const pendingDeposits = requests.filter(r => r.type === 'DEPOSIT' && r.status === 'PENDING').length;

    return {
      stats: {
        totalUsers,
        totalActiveBalance: Number(totalActiveBalance.toFixed(2)),
        totalFrozenBalance: Number(totalFrozenBalance.toFixed(2)),
        totalTrades,
        activeTrades,
        pendingWithdrawals,
        pendingWithdrawalAmount: Number(pendingWithdrawalAmount.toFixed(2)),
        pendingDeposits
      }
    };
  },

  // 8. ADMIN MANAGEMENT
  getAdminAccounts(callerAdminId?: string): { administrators: AdminUser[] } {
    const admins = this.getAdmins();
    const users = this.getUsers();
    const caller = admins.find(a => a.id === callerAdminId || a.username.toLowerCase() === (callerAdminId || '').toLowerCase());
    const isCallerOwner = Boolean(caller?.isOwner || caller?.id === 'admin_supreme_owner' || caller?.id === 'admin_owner_am9318930' || caller?.username === 'jerry@786' || caller?.username === 'am9318930@gmail.com');

    const visible = admins.filter(a => {
      const isOwner = Boolean(a.isOwner || a.id === 'admin_supreme_owner' || a.id === 'admin_owner_am9318930' || a.username === 'jerry@786' || a.username === 'am9318930@gmail.com');
      if (isOwner) return isCallerOwner;
      return true;
    });

    const safe = visible.map(a => {
      const refUsers = users.filter(u => u.referredByAdminId === a.id);
      return {
        ...a,
        referredClientsCount: refUsers.length,
        totalReferredBalance: Number(refUsers.reduce((sum, u) => sum + (u.balance || 0), 0).toFixed(2))
      };
    });

    return { administrators: safe };
  },

  createAdminAccount(params: any): { admin: AdminUser; message: string } {
    const cleanUser = (params.username || '').trim();
    const cleanPass = (params.password || '').trim();
    if (!cleanUser || !cleanPass) throw new Error('Username and password are required');

    const admins = this.getAdmins();
    if (admins.some(a => a.username.toLowerCase() === cleanUser.toLowerCase())) {
      throw new Error(`Administrator "${cleanUser}" already exists`);
    }

    const newAdmin: AdminUser = {
      id: 'admin_' + Math.random().toString(36).substring(2, 8),
      username: cleanUser,
      email: cleanUser.includes('@') ? cleanUser : `${cleanUser}@flowcoin.com`,
      name: (params.name || cleanUser).trim(),
      role: params.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
      referralCode: (params.referralCode || cleanUser.toUpperCase().replace(/[^A-Z0-9]/g, '')).trim(),
      telegramSupportUrl: params.telegramSupportUrl || '',
      telegramGreetingMessage: params.telegramGreetingMessage || '',
      permissions: params.permissions || {
        manageUsers: true,
        manageTrades: true,
        manageFinance: true,
        manageSupportNotice: false,
        manageAdmins: false
      },
      createdAt: new Date().toISOString()
    };

    admins.push(newAdmin);
    this.saveAdmins(admins);

    const passwords = this.getAdminPasswords();
    passwords[cleanUser] = cleanPass;
    setItem('cflownex_admin_passwords', passwords);

    return { admin: newAdmin, message: `Admin "${cleanUser}" created successfully` };
  },

  updateAdminAccount(adminId: string, params: any): { success: boolean; message: string; admin: AdminUser } {
    const admins = this.getAdmins();
    const admin = admins.find(a => a.id === adminId);
    if (!admin) throw new Error('Admin not found');

    if (params.name) admin.name = params.name.trim();
    if (params.role) admin.role = params.role;
    if (params.referralCode) admin.referralCode = params.referralCode.trim();
    if (params.telegramSupportUrl !== undefined) admin.telegramSupportUrl = params.telegramSupportUrl.trim();
    if (params.telegramGreetingMessage !== undefined) admin.telegramGreetingMessage = params.telegramGreetingMessage.trim();
    if (params.permissions) admin.permissions = { ...admin.permissions, ...params.permissions };

    if (params.password) {
      const passwords = this.getAdminPasswords();
      passwords[admin.username] = params.password.trim();
      setItem('cflownex_admin_passwords', passwords);
    }

    this.saveAdmins(admins);
    return { success: true, message: 'Administrator updated successfully', admin };
  },

  deleteAdminAccount(id: string, callerAdminId?: string): { success: boolean; message: string } {
    let admins = this.getAdmins();
    const target = admins.find(a => a.id === id);
    if (!target) throw new Error('Admin not found');
    if (target.isOwner || target.id === 'admin_supreme_owner' || target.id === 'admin_owner_am9318930' || target.username === 'jerry@786' || target.username === 'am9318930@gmail.com') {
      throw new Error('Owner accounts cannot be deleted');
    }

    admins = admins.filter(a => a.id !== id);
    this.saveAdmins(admins);
    return { success: true, message: `Admin removed successfully` };
  },

  changeReferralCode(adminId: string, newCode: string): { success: boolean; message: string; referralCode: string } {
    const admins = this.getAdmins();
    const admin = admins.find(a => a.id === adminId || a.username.toLowerCase() === adminId.toLowerCase());
    if (!admin) throw new Error('Admin not found');

    const clean = newCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!clean || clean.length < 3) throw new Error('Referral code must be at least 3 characters');

    admin.referralCode = clean;
    this.saveAdmins(admins);
    return { success: true, message: `Referral code updated to "${clean}"`, referralCode: clean };
  }
};
