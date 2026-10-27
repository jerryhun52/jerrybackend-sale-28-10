import { User, AdminUser, Trade, CryptoPair, WalletRequest, AdminStats, BankDetails, SupportNotice } from '../types';
import { DEFAULT_PAIRS } from '../constants/initialPairs';

const API_BASE = '/api';

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
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, name: name || username, email, password, currency, referralCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    return data;
  },

  async login(usernameOrEmail: string, password: string): Promise<{ user?: User; admin?: AdminUser; isAdmin?: boolean }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login');
    return data;
  },

  // Support Team Notice
  async getSupportNotice(userId?: string): Promise<{ notice: SupportNotice }> {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await fetch(`${API_BASE}/support-notice${qs}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch support notice');
    return data;
  },

  async updateSupportNotice(title: string, message: string, isActive?: boolean, telegramSupportUrl?: string, adminId?: string): Promise<{ notice: SupportNotice }> {
    const res = await fetch(`${API_BASE}/admin/support-notice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, isActive, telegramSupportUrl, adminId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update support notice');
    return data;
  },

  async updateAdminTelegramSupport(adminId: string, telegramSupportUrl: string, telegramGreetingMessage?: string): Promise<{ success: boolean; message: string; admin: AdminUser }> {
    const res = await fetch(`${API_BASE}/admin/telegram-support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, telegramSupportUrl, telegramGreetingMessage }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update telegram support settings');
    return data;
  },

  async adminLogin(usernameOrEmail: string, password: string): Promise<{ admin: AdminUser }> {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid admin credentials');
    return data;
  },

  async getAdminProfile(adminId: string): Promise<{ admin: AdminUser }> {
    const res = await fetch(`${API_BASE}/admin/profile/${encodeURIComponent(adminId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch administrator profile');
    return data;
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oldPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  },

  async getUserProfile(userId: string, userHint?: { name?: string; email?: string }): Promise<{ user: User }> {
    const params = new URLSearchParams();
    if (userHint?.name) params.set('name', userHint.name);
    if (userHint?.email) params.set('email', userHint.email);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/user/profile/${userId}${qs}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user profile');
    return data;
  },

  async changeUserCurrency(userId: string, currency: string): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE}/user/change-currency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currency }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change currency');
    return data;
  },

  // App Config
  async getAppConfig(): Promise<{ appConfig: { playStoreUrl: string; apkUrl: string; driveUrl?: string } }> {
    try {
      const res = await fetch(`${API_BASE}/app-config`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {}
    return {
      appConfig: {
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.flowcoin.trading',
        apkUrl: '/downloads/flowcoin.apk',
        driveUrl: ''
      }
    };
  },

  async updateAppConfig(adminId: string, playStoreUrl: string, apkUrl: string, driveUrl?: string): Promise<{ appConfig: any; message: string }> {
    const res = await fetch(`${API_BASE}/admin/app-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, playStoreUrl, apkUrl, driveUrl }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Server returned non-JSON response. Check network or server logs.');
    }
    if (!res.ok) throw new Error(data.error || 'Failed to update app config');
    return data;
  },

  async uploadApkFile(adminId: string, fileBase64?: string, apkUrl?: string, driveUrl?: string): Promise<{ appConfig: any; message: string }> {
    const res = await fetch(`${API_BASE}/admin/upload-apk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, fileBase64, apkUrl, driveUrl }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Upload payload response invalid (file size may be too large or server busy). Try compressing the APK or using Google Drive URL.');
    }
    if (!res.ok) throw new Error(data.error || 'Failed to upload APK file');
    return data;
  },

  // Notifications
  async getUserNotifications(userId: string): Promise<{ notifications: any[] }> {
    const res = await fetch(`${API_BASE}/notifications/${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch notifications');
    return data;
  },

  async markNotificationsRead(userId: string, notificationId?: string): Promise<{ notifications: any[] }> {
    const res = await fetch(`${API_BASE}/notifications/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, notificationId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to mark notifications read');
    return data;
  },

  // Market
  async getMarketTickers(): Promise<{ pairs: CryptoPair[] }> {
    try {
      const res = await fetch(`${API_BASE}/market/tickers`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.pairs) && data.pairs.length > 0) {
          return data;
        }
      }
    } catch (e) {
      // Backend not available (e.g. GitHub Pages static deploy)
    }

    // Direct Binance Public API fallback for live rates when running without local Express backend
    try {
      const bRes = await fetch('https://api.binance.com/api/v3/ticker/24hr');
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
    const res = await fetch(`${API_BASE}/trades/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create trade');
    return data;
  },

  async getUserTrades(userId: string): Promise<{ trades: Trade[] }> {
    const res = await fetch(`${API_BASE}/trades/user/${userId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user trades');
    return data;
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
    const res = await fetch(`${API_BASE}/wallet/deposit-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit deposit');
    return data;
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
    const res = await fetch(`${API_BASE}/wallet/withdraw-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit withdrawal');
    return data;
  },

  async getUserWalletRequests(userId: string): Promise<{ requests: WalletRequest[] }> {
    const res = await fetch(`${API_BASE}/wallet/requests/${userId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch wallet requests');
    return data;
  },

  // Admin Controls
  async getAdminUsers(adminId?: string): Promise<{ users: User[] }> {
    const url = adminId ? `${API_BASE}/admin/users?adminId=${encodeURIComponent(adminId)}` : `${API_BASE}/admin/users`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin users');
    return data;
  },

  async updateAdminUserBalance(userId: string, action: 'ADD' | 'DEDUCT' | 'SET', amount: number, reason?: string, currency?: string): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE}/admin/user/${userId}/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, amount, reason, currency }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update balance');
    return data;
  },

  async updateAdminUserCreditScore(userId: string, creditScore: number): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/admin/user/${userId}/credit-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creditScore }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update credit score');
    return data;
  },

  async updateAdminUserFreezeBalance(userId: string, amount: number, action: 'SET' | 'UNFREEZE_ALL'): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/admin/user/${userId}/freeze-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update freeze balance');
    return data;
  },

  async updateAdminUserTradeMode(userId: string, tradeMode: 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS'): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/admin/user/${userId}/trade-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradeMode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update trade mode');
    return data;
  },

  async updateAdminUserStatus(userId: string, status: 'active' | 'suspended' | 'frozen', reason?: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/admin/user/${userId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update status');
    return data;
  },

  async getAdminTrades(adminId?: string): Promise<{ trades: Trade[] }> {
    const url = adminId ? `${API_BASE}/admin/trades?adminId=${encodeURIComponent(adminId)}` : `${API_BASE}/admin/trades`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin trades');
    return data;
  },

  async updateAdminTrade(tradeId: string, params: {
    outcome?: 'WIN' | 'LOSS';
    payout?: number;
    settlePrice?: number;
    profitPercentage?: number;
    status?: 'RUNNING' | 'SETTLED';
  }): Promise<{ trade: Trade; user?: { balance: number; freezeBalance: number } }> {
    const res = await fetch(`${API_BASE}/admin/trade/${tradeId}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to adjust trade');
    return data;
  },

  async settleAdminTradeNow(tradeId: string, forceOutcome: 'WIN' | 'LOSS'): Promise<{ trade: Trade; user?: { balance: number; freezeBalance: number } }> {
    const res = await fetch(`${API_BASE}/admin/trade/${tradeId}/settle-now`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceOutcome }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to settle trade');
    return data;
  },

  async getAdminWalletRequests(adminId?: string): Promise<{ requests: WalletRequest[] }> {
    const url = adminId ? `${API_BASE}/admin/wallet-requests?adminId=${encodeURIComponent(adminId)}` : `${API_BASE}/admin/wallet-requests`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin wallet requests');
    return data;
  },

  async handleAdminWalletRequest(requestId: string, action: 'APPROVE' | 'REJECT', remarks?: string): Promise<{ request: WalletRequest }> {
    const res = await fetch(`${API_BASE}/admin/wallet-requests/${requestId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, remarks }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to process request');
    return data;
  },

  async getAdminStats(adminId?: string): Promise<{ stats: AdminStats }> {
    const url = adminId ? `${API_BASE}/admin/stats?adminId=${encodeURIComponent(adminId)}` : `${API_BASE}/admin/stats`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin stats');
    return data;
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
      } catch (e) {
        // ignore
      }
    }
    const url = caller 
      ? `${API_BASE}/admin/administrators?callerAdminId=${encodeURIComponent(caller)}`
      : `${API_BASE}/admin/administrators`;
    const res = await fetch(url, {
      headers: caller ? { 'x-admin-id': caller } : {}
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch administrators');
    return data;
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
    const res = await fetch(`${API_BASE}/admin/administrators/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create administrator');
    return data;
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
      } catch (e) {
        // ignore
      }
    }
    const res = await fetch(`${API_BASE}/admin/administrators/${adminId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...(caller ? { 'x-admin-id': caller } : {})
      },
      body: JSON.stringify({ ...params, callerAdminId: caller }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update administrator permissions');
    return data;
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
      } catch (e) {
        // ignore
      }
    }
    const res = await fetch(`${API_BASE}/admin/administrators/${adminId}`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        ...(caller ? { 'x-admin-id': caller } : {})
      },
      body: JSON.stringify({ callerAdminId: caller }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete administrator');
    return data;
  },

  async changeAdminReferralCode(adminId: string, newReferralCode: string): Promise<{ success: boolean; message: string; referralCode: string; admin: AdminUser }> {
    const res = await fetch(`${API_BASE}/admin/change-referral-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, newReferralCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change referral code');
    return data;
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
    const res = await fetch(`${API_BASE}/admin/users/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create user account');
    return data;
  },

  async updateAdminUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string; password?: string }> {
    const res = await fetch(`${API_BASE}/admin/user/${userId}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user password');
    return data;
  },

  async deleteAdminUser(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/user/${userId}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
    return data;
  }
};
