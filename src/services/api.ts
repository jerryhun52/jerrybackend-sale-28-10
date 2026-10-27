import { User, AdminUser, Trade, CryptoPair, WalletRequest, AdminStats, BankDetails, SupportNotice } from '../types';
import { DEFAULT_PAIRS } from '../constants/initialPairs';
import { localStore } from './localFallbackStore';

const API_BASE = '/api';

const rawFetch = globalThis.fetch;

// Safe request helper that detects 404 (static hosting like Hostinger Vite or GitHub Pages)
// and handles fallback seamlessly without throwing SyntaxError or 404 errors.
async function safeServerCall<T>(
  url: string, 
  options: RequestInit | undefined, 
  fallbackFn: () => T | Promise<T>
): Promise<T> {
  try {
    const res = await rawFetch(url, options);
    // If static host returns 404, or proxy 502/503
    if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504) {
      return await fallbackFn();
    }
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      // Non-JSON response (e.g. static HTML page returned)
      return await fallbackFn();
    }

    if (!res.ok) {
      throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
    }

    return data as T;
  } catch (err: any) {
    const msg = (err?.message || '').toLowerCase();
    if (
      msg.includes('failed to fetch') || 
      msg.includes('networkerror') || 
      msg.includes('connection refused') ||
      msg.includes('load failed')
    ) {
      return await fallbackFn();
    }
    throw err;
  }
}

export const api = {
  // Auth
  async register(
    username: string, 
    password: string, 
    name?: string, 
    email?: string, 
    currency?: string,
    referralCode?: string
  ): Promise<{ user: User }> {
    return safeServerCall(
      `${API_BASE}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name: name || username, email, password, currency, referralCode }),
      },
      () => localStore.register({ username, password, name, email, currency, referralCode })
    );
  },

  async login(usernameOrEmail: string, password: string): Promise<{ user?: User; admin?: AdminUser; isAdmin?: boolean }> {
    return safeServerCall(
      `${API_BASE}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail, password }),
      },
      () => localStore.login(usernameOrEmail, password)
    );
  },

  // Support Team Notice
  async getSupportNotice(userId?: string): Promise<{ notice: SupportNotice }> {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return safeServerCall(
      `${API_BASE}/support-notice${qs}`,
      undefined,
      () => ({ notice: localStore.getSupportNotice() })
    );
  },

  async updateSupportNotice(title: string, message: string, isActive?: boolean, telegramSupportUrl?: string, adminId?: string): Promise<{ notice: SupportNotice }> {
    return safeServerCall(
      `${API_BASE}/admin/support-notice`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, isActive, telegramSupportUrl, adminId }),
      },
      () => {
        const cur = localStore.getSupportNotice();
        const updated: SupportNotice = {
          ...cur,
          title,
          message,
          isActive: isActive !== undefined ? isActive : cur.isActive,
          telegramSupportUrl: telegramSupportUrl || cur.telegramSupportUrl,
          updatedAt: new Date().toISOString()
        };
        localStore.saveSupportNotice(updated);
        return { notice: updated };
      }
    );
  },

  async updateAdminTelegramSupport(adminId: string, telegramSupportUrl: string, telegramGreetingMessage?: string): Promise<{ success: boolean; message: string; admin: AdminUser }> {
    return safeServerCall(
      `${API_BASE}/admin/telegram-support`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, telegramSupportUrl, telegramGreetingMessage }),
      },
      () => {
        const admins = localStore.getAdmins();
        const admin = admins.find(a => a.id === adminId || a.username.toLowerCase() === adminId.toLowerCase());
        if (!admin) throw new Error('Admin not found');
        admin.telegramSupportUrl = telegramSupportUrl;
        if (telegramGreetingMessage !== undefined) admin.telegramGreetingMessage = telegramGreetingMessage;
        localStore.saveAdmins(admins);
        return { success: true, message: 'Telegram support updated', admin };
      }
    );
  },

  async adminLogin(usernameOrEmail: string, password: string): Promise<{ admin: AdminUser }> {
    return safeServerCall(
      `${API_BASE}/auth/admin-login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail, password }),
      },
      () => localStore.adminLogin(usernameOrEmail, password)
    );
  },

  async getAdminProfile(adminId: string): Promise<{ admin: AdminUser }> {
    return safeServerCall(
      `${API_BASE}/admin/profile/${encodeURIComponent(adminId)}`,
      undefined,
      () => {
        const admins = localStore.getAdmins();
        const admin = admins.find(a => a.id === adminId || a.username.toLowerCase() === adminId.toLowerCase());
        if (admin) return { admin };
        throw new Error('Admin not found');
      }
    );
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ user: User; message: string }> {
    return safeServerCall(
      `${API_BASE}/auth/change-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, oldPassword, newPassword }),
      },
      () => {
        const users = localStore.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');
        if (user.password && user.password !== oldPassword) throw new Error('Current password is incorrect');
        user.password = newPassword.trim();
        localStore.saveUsers(users);
        const { password: _, ...safe } = user;
        return { user: safe as User, message: 'Password changed successfully' };
      }
    );
  },

  async getUserProfile(userId: string, userHint?: { name?: string; email?: string }): Promise<{ user: User }> {
    const params = new URLSearchParams();
    if (userHint?.name) params.set('name', userHint.name);
    if (userHint?.email) params.set('email', userHint.email);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return safeServerCall(
      `${API_BASE}/user/profile/${userId}${qs}`,
      undefined,
      () => {
        const users = localStore.getUsers();
        const u = users.find(usr => usr.id === userId || (userHint?.email && usr.email === userHint.email));
        if (u) {
          const { password: _, ...safe } = u;
          return { user: safe as User };
        }
        throw new Error('User not found');
      }
    );
  },

  async changeUserCurrency(userId: string, currency: string): Promise<{ user: User; message: string }> {
    return safeServerCall(
      `${API_BASE}/user/change-currency`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currency }),
      },
      () => {
        const users = localStore.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');
        user.currency = currency as any;
        localStore.saveUsers(users);
        const { password: _, ...safe } = user;
        return { user: safe as User, message: `Account currency updated to ${currency}` };
      }
    );
  },

  // App Config
  async getAppConfig(): Promise<{ appConfig: { playStoreUrl: string; apkUrl: string; driveUrl?: string } }> {
    return safeServerCall(
      `${API_BASE}/app-config`,
      undefined,
      () => ({ appConfig: localStore.getAppConfig() })
    );
  },

  async updateAppConfig(adminId: string, playStoreUrl: string, apkUrl: string, driveUrl?: string): Promise<{ appConfig: any; message: string }> {
    return safeServerCall(
      `${API_BASE}/admin/app-config`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, playStoreUrl, apkUrl, driveUrl }),
      },
      () => {
        const cfg = { playStoreUrl, apkUrl, driveUrl: driveUrl || '' };
        localStore.saveAppConfig(cfg);
        return { appConfig: cfg, message: 'App config updated' };
      }
    );
  },

  async uploadApkFile(adminId: string, fileBase64?: string, apkUrl?: string, driveUrl?: string): Promise<{ appConfig: any; message: string }> {
    return safeServerCall(
      `${API_BASE}/admin/upload-apk`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, fileBase64, apkUrl, driveUrl }),
      },
      () => {
        const cfg = { playStoreUrl: '', apkUrl: apkUrl || '/downloads/flowcoin.apk', driveUrl: driveUrl || '' };
        localStore.saveAppConfig(cfg);
        return { appConfig: cfg, message: 'APK configuration updated' };
      }
    );
  },

  // Notifications
  async getUserNotifications(userId: string): Promise<{ notifications: any[] }> {
    return safeServerCall(
      `${API_BASE}/notifications/${encodeURIComponent(userId)}`,
      undefined,
      () => ({ notifications: localStore.getNotifications(userId) })
    );
  },

  async markNotificationsRead(userId: string, notificationId?: string): Promise<{ notifications: any[] }> {
    return safeServerCall(
      `${API_BASE}/notifications/mark-read`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId }),
      },
      () => {
        const notifs = localStore.getNotifications(userId);
        notifs.forEach(n => {
          if (!notificationId || n.id === notificationId) n.read = true;
        });
        return { notifications: notifs };
      }
    );
  },

  // Market
  async getMarketTickers(): Promise<{ pairs: CryptoPair[] }> {
    try {
      const res = await rawFetch(`${API_BASE}/market/tickers`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.pairs) && data.pairs.length > 0) {
          return data;
        }
      }
    } catch (e) {
      // Backend not available (e.g. GitHub Pages or Hostinger static deploy)
    }

    // Direct Binance Public API fallback for live rates when running without local Express backend
    try {
      const bRes = await rawFetch('https://api.binance.com/api/v3/ticker/24hr');
      if (bRes.ok) {
        const binanceList = await bRes.json();
        const binanceMap = new Map<string, any>();
        for (const item of binanceList) {
          binanceMap.set(item.symbol, item);
        }
        const updatedPairs = DEFAULT_PAIRS.map(pair => {
          const rawSymbol = pair.symbol.replace('/', '');
          const bData = binanceMap.get(rawSymbol);
          if (bData) {
            const lastPrice = parseFloat(bData.lastPrice) || pair.currentPrice;
            const priceChangePercent = parseFloat(bData.priceChangePercent) || pair.change24h;
            const highPrice = parseFloat(bData.highPrice) || pair.high24h;
            const lowPrice = parseFloat(bData.lowPrice) || pair.low24h;
            return {
              ...pair,
              currentPrice: lastPrice,
              change24h: Number(priceChangePercent.toFixed(2)),
              high24h: highPrice,
              low24h: lowPrice,
            };
          }
          return pair;
        });
        return { pairs: updatedPairs };
      }
    } catch (e) {
      // Fallback to default pairs
    }

    return { pairs: DEFAULT_PAIRS };
  },

  // Trades
  async createTrade(params: {
    userId: string;
    symbol: string;
    direction: 'UP' | 'DOWN';
    duration: number;
    amount: number;
  }): Promise<{ trade: Trade; user: Partial<User> }> {
    return safeServerCall(
      `${API_BASE}/trades/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      () => localStore.createTrade(params)
    );
  },

  async getUserTrades(userId: string): Promise<{ trades: Trade[] }> {
    return safeServerCall(
      `${API_BASE}/trades/user/${userId}`,
      undefined,
      () => ({ trades: localStore.getTrades().filter(t => t.userId === userId) })
    );
  },

  // Wallet
  async submitDepositRequest(params: {
    userId: string;
    amount: number;
    currency?: string;
    network?: string;
    txHash?: string;
    remarks?: string;
  }): Promise<{ request: WalletRequest }> {
    return safeServerCall(
      `${API_BASE}/wallet/deposit-request`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      () => localStore.createDepositRequest(
        params.userId, 
        params.amount, 
        params.currency || 'USD', 
        params.network || 'TRC20', 
        params.txHash
      )
    );
  },

  async submitWithdrawRequest(params: {
    userId: string;
    amount: number;
    currency?: string;
    walletAddress?: string;
    network?: string;
    bankDetails?: BankDetails;
    remarks?: string;
  }): Promise<{ request: WalletRequest; user: Partial<User> }> {
    return safeServerCall(
      `${API_BASE}/wallet/withdraw-request`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      () => localStore.createWithdrawRequest(
        params.userId,
        params.amount,
        params.currency || 'USD',
        params.bankDetails,
        params.walletAddress
      )
    );
  },

  async getUserWalletRequests(userId: string): Promise<{ requests: WalletRequest[] }> {
    return safeServerCall(
      `${API_BASE}/wallet/requests/${userId}`,
      undefined,
      () => localStore.getUserWalletRequests(userId)
    );
  },

  // Admin Controls
  async getAdminUsers(adminId?: string): Promise<{ users: User[] }> {
    const url = adminId ? `${API_BASE}/admin/users?adminId=${encodeURIComponent(adminId)}` : `${API_BASE}/admin/users`;
    return safeServerCall(
      url,
      undefined,
      () => localStore.getAdminUsers(adminId)
    );
  },

  async updateAdminUserBalance(userId: string, action: 'ADD' | 'DEDUCT' | 'SET', amount: number, reason?: string, currency?: string): Promise<{ user: User; message: string }> {
    return safeServerCall(
      `${API_BASE}/admin/user/${userId}/balance`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, amount, reason, currency }),
      },
      () => localStore.updateUserBalance(userId, action, amount)
    );
  },

  async updateAdminUserCreditScore(userId: string, creditScore: number): Promise<{ user: User }> {
    return safeServerCall(
      `${API_BASE}/admin/user/${userId}/credit-score`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditScore }),
      },
      () => localStore.updateUserCreditScore(userId, creditScore)
    );
  },

  async updateAdminUserFreezeBalance(userId: string, amount: number, action: 'SET' | 'UNFREEZE_ALL'): Promise<{ user: User }> {
    return safeServerCall(
      `${API_BASE}/admin/user/${userId}/freeze-balance`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, action }),
      },
      () => localStore.updateUserFreezeBalance(userId, amount, action)
    );
  },

  async updateAdminUserTradeMode(userId: string, tradeMode: 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS'): Promise<{ user: User }> {
    return safeServerCall(
      `${API_BASE}/admin/user/${userId}/trade-mode`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeMode }),
      },
      () => localStore.updateUserTradeMode(userId, tradeMode)
    );
  },

  async updateAdminUserStatus(userId: string, status: 'active' | 'suspended' | 'frozen', reason?: string): Promise<{ user: User }> {
    return safeServerCall(
      `${API_BASE}/admin/user/${userId}/status`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      },
      () => localStore.updateUserStatus(userId, status, reason)
    );
  },

  async getAdminTrades(adminId?: string): Promise<{ trades: Trade[] }> {
    const url = adminId ? `${API_BASE}/admin/trades?adminId=${encodeURIComponent(adminId)}` : `${API_BASE}/admin/trades`;
    return safeServerCall(
      url,
      undefined,
      () => localStore.getAdminTrades(adminId)
    );
  },

  async updateAdminTrade(tradeId: string, params: {
    outcome?: 'WIN' | 'LOSS';
    payout?: number;
    settlePrice?: number;
    profitPercentage?: number;
    status?: 'RUNNING' | 'SETTLED';
  }): Promise<{ trade: Trade; user?: { balance: number; freezeBalance: number } }> {
    return safeServerCall(
      `${API_BASE}/admin/trade/${tradeId}/adjust`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      () => localStore.updateAdminTrade(tradeId, params)
    );
  },

  async settleAdminTradeNow(tradeId: string, forceOutcome: 'WIN' | 'LOSS'): Promise<{ trade: Trade; user?: { balance: number; freezeBalance: number } }> {
    return safeServerCall(
      `${API_BASE}/admin/trade/${tradeId}/settle-now`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceOutcome }),
      },
      () => localStore.settleAdminTradeNow(tradeId, forceOutcome)
    );
  },

  async getAdminWalletRequests(adminId?: string): Promise<{ requests: WalletRequest[] }> {
    const url = adminId ? `${API_BASE}/admin/wallet-requests?adminId=${encodeURIComponent(adminId)}` : `${API_BASE}/admin/wallet-requests`;
    return safeServerCall(
      url,
      undefined,
      () => localStore.getAdminWalletRequests(adminId)
    );
  },

  async handleAdminWalletRequest(requestId: string, action: 'APPROVE' | 'REJECT', remarks?: string): Promise<{ request: WalletRequest }> {
    return safeServerCall(
      `${API_BASE}/admin/wallet-requests/${requestId}/action`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remarks }),
      },
      () => localStore.handleAdminWalletRequest(requestId, action, remarks)
    );
  },

  async getAdminStats(adminId?: string): Promise<{ stats: AdminStats }> {
    const url = adminId ? `${API_BASE}/admin/stats?adminId=${encodeURIComponent(adminId)}` : `${API_BASE}/admin/stats`;
    return safeServerCall(
      url,
      undefined,
      () => localStore.getAdminStats(adminId)
    );
  },

  async getAdminAccounts(callerAdminId?: string): Promise<{ administrators: AdminUser[] }> {
    let caller = callerAdminId;
    if (!caller) {
      try {
        const saved = localStorage.getItem('crypto_admin');
        if (saved) {
          const parsed = JSON.parse(saved);
          caller = parsed?.id || parsed?.username;
        }
      } catch (e) {}
    }
    const url = caller 
      ? `${API_BASE}/admin/administrators?callerAdminId=${encodeURIComponent(caller)}`
      : `${API_BASE}/admin/administrators`;
    return safeServerCall(
      url,
      { headers: caller ? { 'x-admin-id': caller } : {} },
      () => localStore.getAdminAccounts(caller)
    );
  },

  async createAdminAccount(params: {
    username: string;
    name: string;
    password: string;
    role?: string;
    referralCode?: string;
    telegramSupportUrl?: string;
    telegramGreetingMessage?: string;
    permissions?: Partial<AdminUser['permissions']>;
  }): Promise<{ admin: AdminUser; message: string }> {
    return safeServerCall(
      `${API_BASE}/admin/administrators/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
      () => localStore.createAdminAccount(params)
    );
  },

  async updateAdminAccount(adminId: string, params: {
    name?: string;
    role?: 'SUPER_ADMIN' | 'ADMIN';
    password?: string;
    referralCode?: string;
    telegramSupportUrl?: string;
    telegramGreetingMessage?: string;
    permissions?: Partial<AdminUser['permissions']>;
    callerAdminId?: string;
  }): Promise<{ success: boolean; message: string; admin: AdminUser }> {
    let caller = params.callerAdminId;
    if (!caller) {
      try {
        const saved = localStorage.getItem('crypto_admin');
        if (saved) {
          const parsed = JSON.parse(saved);
          caller = parsed?.id || parsed?.username;
        }
      } catch (e) {}
    }
    return safeServerCall(
      `${API_BASE}/admin/administrators/${adminId}`,
      {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(caller ? { 'x-admin-id': caller } : {})
        },
        body: JSON.stringify({ ...params, callerAdminId: caller }),
      },
      () => localStore.updateAdminAccount(adminId, params)
    );
  },

  async deleteAdminAccount(adminId: string, callerAdminId?: string): Promise<{ success: boolean; message: string }> {
    let caller = callerAdminId;
    if (!caller) {
      try {
        const saved = localStorage.getItem('crypto_admin');
        if (saved) {
          const parsed = JSON.parse(saved);
          caller = parsed?.id || parsed?.username;
        }
      } catch (e) {}
    }
    return safeServerCall(
      `${API_BASE}/admin/administrators/${adminId}`,
      {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          ...(caller ? { 'x-admin-id': caller } : {})
        },
        body: JSON.stringify({ callerAdminId: caller }),
      },
      () => localStore.deleteAdminAccount(adminId, caller)
    );
  },

  async changeAdminReferralCode(adminId: string, newReferralCode: string): Promise<{ success: boolean; message: string; referralCode: string; admin: AdminUser }> {
    return safeServerCall(
      `${API_BASE}/admin/change-referral-code`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, newReferralCode }),
      },
      () => {
        const res = localStore.changeReferralCode(adminId, newReferralCode);
        const admins = localStore.getAdmins();
        const admin = admins.find(a => a.id === adminId || a.username.toLowerCase() === adminId.toLowerCase())!;
        return { success: true, message: res.message, referralCode: res.referralCode, admin };
      }
    );
  },

  async createAdminUser(userData: {
    username: string;
    password: string;
    name?: string;
    email?: string;
    balance?: number;
    currency?: string;
    tradeMode?: 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS';
    creditScore?: number;
    adminId?: string;
  }): Promise<{ user: User }> {
    return safeServerCall(
      `${API_BASE}/admin/users/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      },
      () => {
        const users = localStore.getUsers();
        const newUser: User = {
          id: 'user_' + Math.random().toString(36).substring(2, 9),
          username: userData.username,
          name: userData.name || userData.username,
          email: userData.email || `${userData.username.toLowerCase()}@flowcoin.com`,
          password: userData.password,
          balance: userData.balance || 0,
          freezeBalance: 0,
          creditScore: userData.creditScore || 100,
          currency: (userData.currency as any) || 'USD',
          status: 'active',
          tradeMode: userData.tradeMode || 'AUTO',
          referredByAdminId: userData.adminId || 'admin_master',
          createdAt: new Date().toISOString()
        };
        users.unshift(newUser);
        localStore.saveUsers(users);
        const { password: _, ...safe } = newUser;
        return { user: safe as User };
      }
    );
  },

  async updateAdminUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string; password?: string }> {
    return safeServerCall(
      `${API_BASE}/admin/user/${userId}/password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      },
      () => localStore.updateUserPassword(userId, newPassword)
    );
  },

  async deleteAdminUser(userId: string): Promise<{ success: boolean; message: string }> {
    return safeServerCall(
      `${API_BASE}/admin/user/${userId}/delete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      () => localStore.deleteUser(userId)
    );
  }
};
