import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// --- DATA TYPES & IN-MEMORY STORE WITH INITIAL SEED ---
export interface AdminPermissions {
  manageUsers: boolean;
  manageTrades: boolean;
  manageFinance: boolean;
  manageSupportNotice: boolean;
  manageAdmins: boolean;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  password?: string;
  balance: number;
  freezeBalance: number;
  creditScore: number;
  status: 'active' | 'suspended' | 'frozen';
  freezeReason?: string;
  tradeMode?: 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS';
  currency?: string;
  createdAt: string;
  avatar?: string;
  referredByAdminId?: string;
  referredByAdminUsername?: string;
  referralCodeUsed?: string;
  notifications?: UserNotification[];
}

export interface Trade {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  symbol: string;
  direction: 'UP' | 'DOWN';
  duration: number; // in seconds (e.g. 30, 60)
  amount: number;
  profitPercentage: number; // e.g. 20, 40
  entryPrice: number;
  settlePrice?: number;
  status: 'RUNNING' | 'SETTLED';
  outcome?: 'WIN' | 'LOSS';
  payout?: number;
  startTime: number;
  expireTime: number;
  createdAt: string;
}

export interface BankDetails {
  method?: string;
  country: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifscOrIban?: string;
  upiOrPixId?: string;
  network?: string;
}

export interface WalletRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  currency: string;
  network: string;
  walletAddress?: string;
  bankDetails?: BankDetails;
  txHash?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CryptoPair {
  symbol: string;
  name: string;
  basePrice: number;
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  precision: number;
  volatility: number;
}

export interface SupportNotice {
  id: string;
  title: string;
  message: string;
  updatedAt: string;
  isActive: boolean;
  telegramSupportUrl?: string;
}

export interface MobileAppConfig {
  playStoreUrl: string;
  apkUrl: string;
  driveUrl: string;
  updatedAt: string;
}

export interface AdminLoginSession {
  id: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  device: string;
  location?: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  referralCode: string;
  permissions: AdminPermissions;
  createdAt: string;
  isHiddenOwner?: boolean;
  telegramSupportUrl?: string;
  telegramGreetingMessage?: string;
  loginHistory?: AdminLoginSession[];
  lastLoginTime?: string;
}

let currentSupportNotice: SupportNotice = {
  id: 'notice_default',
  title: 'Official Support Notice',
  message: 'Welcome to CELLS FLOWNEX Trading. Our real-time settlement and customer support desk is active 24/7.',
  updatedAt: new Date().toISOString(),
  isActive: true,
  telegramSupportUrl: 'https://t.me/flowcoin_support',
};

let currentAppConfig: MobileAppConfig = {
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.flowcoin.trading',
  apkUrl: '/downloads/flowcoin.apk',
  driveUrl: '',
  updatedAt: new Date().toISOString(),
};

// --- PERSISTENT DATABASE ENGINE (database.json) ---
const DB_FILE = path.join(process.cwd(), 'database.json');

// --- MOBILE & IPHONE INPUT SANITIZATION & CREDENTIAL COMPARISON ---
function cleanMobileInput(val: any): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'string' ? val : String(val);
  // Strip zero-width spaces, non-breaking spaces, byte-order marks, carriage returns, newlines, tabs, and normalize smart quotes
  return str
    .replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();
}

function normalizeKey(val: any): string {
  return cleanMobileInput(val)
    .toLowerCase()
    .replace(/^[@#:]+/, '') // strip leading @, #, :
    .replace(/[^a-z0-9]/g, ''); // alphanumeric only for fuzzy mobile comparison
}

function isPasswordEquivalent(stored: any, provided: any): boolean {
  if (stored === null || stored === undefined || provided === null || provided === undefined) return false;
  const sClean = cleanMobileInput(stored);
  const pClean = cleanMobileInput(provided);
  if (!sClean || !pClean) return false;

  // 1. Direct exact match
  if (sClean === pClean) return true;
  
  // 2. Trimmed exact match
  if (sClean.trim() === pClean.trim()) return true;

  // 3. Case-insensitive match (handles mobile keyboard auto-capitalization)
  if (sClean.toLowerCase() === pClean.toLowerCase()) return true;

  // 4. Trimmed case-insensitive match
  if (sClean.trim().toLowerCase() === pClean.trim().toLowerCase()) return true;

  return false;
}

// Helpers to identify Supreme Owners (jerry@786, am9318930@gmail.com) and Master Admin (jerry@321)
function isSupremeOwnerAdmin(a?: { id?: string; username?: string; isHiddenOwner?: boolean } | null): boolean {
  if (!a) return false;
  const u = cleanMobileInput(a.username || '').toLowerCase().replace(/^[@#:]+/, '');
  const id = cleanMobileInput(a.id || '').toLowerCase();
  return (
    u === 'jerry@786' ||
    u === 'am9318930@gmail.com' ||
    id === 'admin_supreme_owner' ||
    id === 'admin_owner_am9318930' ||
    Boolean(a.isHiddenOwner)
  );
}

function isMasterAdmin321(a?: { id?: string; username?: string } | null): boolean {
  if (!a) return false;
  const u = cleanMobileInput(a.username || '').toLowerCase().replace(/^[@#:]+/, '');
  return u === 'jerry@321' || a.id === 'admin_master';
}

// Track admin login device, IP, and timestamp
function recordAdminLogin(admin: AdminAccount, req: Request) {
  try {
    const rawIp = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const ip = String(rawIp).split(',')[0].trim();
    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Browser';
    
    let device = 'Desktop Device';
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone')) device = '📱 iPhone (Mobile Safari)';
    else if (ua.includes('ipad')) device = '📱 iPad (Safari)';
    else if (ua.includes('android')) device = '📱 Android Phone / App';
    else if (ua.includes('macintosh') || ua.includes('mac os')) device = '💻 Mac Desktop';
    else if (ua.includes('windows')) device = '💻 Windows PC';
    else if (ua.includes('linux')) device = '💻 Linux Workstation';
    else if (ua.includes('mobile')) device = '📱 Mobile Device';

    const now = new Date().toISOString();
    const sessionRecord: AdminLoginSession = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: now,
      ip: ip || '127.0.0.1',
      userAgent,
      device,
      location: 'Web Client / SSL'
    };

    if (!admin.loginHistory) {
      admin.loginHistory = [];
    }
    
    admin.loginHistory.unshift(sessionRecord);
    if (admin.loginHistory.length > 30) {
      admin.loginHistory = admin.loginHistory.slice(0, 30);
    }
    admin.lastLoginTime = now;
    saveDatabase();
  } catch (e) {
    console.error('Failed to record admin login audit:', e);
  }
}

// Admin accounts storage with Supreme Owner jerry@786, Main Owner am9318930@gmail.com, and Master Admin jerry@321
const adminAccounts: AdminAccount[] = [
  {
    id: 'admin_supreme_owner',
    username: 'jerry@786',
    password: 'jerry@786',
    name: 'Supreme Founder (Owner)',
    role: 'SUPER_ADMIN',
    referralCode: 'JERRY786',
    permissions: {
      manageUsers: true,
      manageTrades: true,
      manageFinance: true,
      manageSupportNotice: true,
      manageAdmins: true
    },
    createdAt: new Date().toISOString(),
    isHiddenOwner: true
  },
  {
    id: 'admin_owner_am9318930',
    username: 'am9318930@gmail.com',
    password: 'tesla@123',
    name: 'Main Owner (AM)',
    role: 'SUPER_ADMIN',
    referralCode: 'TESLA123',
    permissions: {
      manageUsers: true,
      manageTrades: true,
      manageFinance: true,
      manageSupportNotice: true,
      manageAdmins: true
    },
    createdAt: new Date().toISOString(),
    isHiddenOwner: true
  },
  {
    id: 'admin_master',
    username: 'jerry@321',
    password: 'jerry@321',
    name: 'Master Admin (Main)',
    role: 'SUPER_ADMIN',
    referralCode: 'MASTER321',
    permissions: {
      manageUsers: true,
      manageTrades: true,
      manageFinance: true,
      manageSupportNotice: true,
      manageAdmins: true
    },
    createdAt: new Date().toISOString()
  }
];

// Initial crypto pairs starting with BTC/USDT and ending with BTS/USDT as requested
const INITIAL_PAIRS: CryptoPair[] = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', basePrice: 88450.50, currentPrice: 88450.50, change24h: 3.42, high24h: 89600.00, low24h: 86900.00, volume24h: '1.42B', precision: 2, volatility: 8.5 },
  { symbol: 'ETH/USDT', name: 'Ethereum', basePrice: 2840.25, currentPrice: 2840.25, change24h: 2.15, high24h: 2910.00, low24h: 2780.00, volume24h: '840M', precision: 2, volatility: 1.5 },
  { symbol: 'SOL/USDT', name: 'Solana', basePrice: 178.60, currentPrice: 178.60, change24h: 5.84, high24h: 184.20, low24h: 171.10, volume24h: '520M', precision: 2, volatility: 0.25 },
  { symbol: 'BNB/USDT', name: 'BNB Chain', basePrice: 620.30, currentPrice: 620.30, change24h: 1.12, high24h: 632.00, low24h: 612.00, volume24h: '310M', precision: 2, volatility: 0.4 },
  { symbol: 'XRP/USDT', name: 'Ripple', basePrice: 2.3450, currentPrice: 2.3450, change24h: -1.25, high24h: 2.4500, low24h: 2.2800, volume24h: '410M', precision: 4, volatility: 0.005 },
  { symbol: 'DOGE/USDT', name: 'Dogecoin', basePrice: 0.2185, currentPrice: 0.2185, change24h: 4.60, high24h: 0.2310, low24h: 0.2050, volume24h: '280M', precision: 4, volatility: 0.001 },
  { symbol: 'ADA/USDT', name: 'Cardano', basePrice: 0.7840, currentPrice: 0.7840, change24h: 0.95, high24h: 0.8100, low24h: 0.7600, volume24h: '195M', precision: 4, volatility: 0.002 },
  { symbol: 'AVAX/USDT', name: 'Avalanche', basePrice: 32.40, currentPrice: 32.40, change24h: -0.45, high24h: 33.80, low24h: 31.90, volume24h: '160M', precision: 2, volatility: 0.1 },
  { symbol: 'DOT/USDT', name: 'Polkadot', basePrice: 7.85, currentPrice: 7.85, change24h: 1.80, high24h: 8.15, low24h: 7.60, volume24h: '110M', precision: 2, volatility: 0.03 },
  { symbol: 'TRX/USDT', name: 'TRON', basePrice: 0.2450, currentPrice: 0.2450, change24h: 0.40, high24h: 0.2510, low24h: 0.2410, volume24h: '140M', precision: 4, volatility: 0.001 },
  { symbol: 'LINK/USDT', name: 'Chainlink', basePrice: 18.90, currentPrice: 18.90, change24h: 3.10, high24h: 19.50, low24h: 18.20, volume24h: '95M', precision: 2, volatility: 0.05 },
  { symbol: 'LTC/USDT', name: 'Litecoin', basePrice: 94.20, currentPrice: 94.20, change24h: 1.05, high24h: 96.80, low24h: 92.50, volume24h: '85M', precision: 2, volatility: 0.15 },
  { symbol: 'NEAR/USDT', name: 'NEAR Protocol', basePrice: 5.62, currentPrice: 5.62, change24h: -2.30, high24h: 5.95, low24h: 5.48, volume24h: '78M', precision: 2, volatility: 0.02 },
  { symbol: 'SHIB/USDT', name: 'Shiba Inu', basePrice: 0.0000215, currentPrice: 0.0000215, change24h: 6.20, high24h: 0.0000230, low24h: 0.0000201, volume24h: '220M', precision: 7, volatility: 0.0000002 },
  { symbol: 'BTS/USDT', name: 'BitShares', basePrice: 0.003420, currentPrice: 0.003420, change24h: 1.15, high24h: 0.003600, low24h: 0.003310, volume24h: '24M', precision: 6, volatility: 0.000015 },
];

// Persistent Users Storage
const users: User[] = [
  {
    id: 'user_venom',
    name: 'Venom Trader',
    username: 'venom',
    email: 'venom@flowcoin.online',
    password: 'venom',
    balance: 1000.00,
    freezeBalance: 0.00,
    creditScore: 100,
    currency: 'USDT',
    status: 'active',
    tradeMode: 'AUTO',
    referredByAdminId: 'admin_master',
    referredByAdminUsername: 'jerry@321',
    referralCodeUsed: 'MASTER321',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'user_demo_1',
    name: 'Ali Khan',
    username: 'alikhan',
    email: 'demo@flowcoin.com',
    password: 'password123',
    balance: 2450.00,
    freezeBalance: 150.00,
    creditScore: 96,
    status: 'active',
    tradeMode: 'AUTO',
    referralCodeUsed: 'MASTER321',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'user_demo_2',
    name: 'Hamza Trader',
    username: 'hamzatrader',
    email: 'hamza@flowcoin.com',
    password: 'password123',
    balance: 10800.50,
    freezeBalance: 500.00,
    creditScore: 100,
    status: 'active',
    tradeMode: 'AUTO',
    referralCodeUsed: 'MASTER321',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

const trades: Trade[] = [
  {
    id: 'trade_init_1',
    userId: 'user_demo_1',
    userName: 'Ali Khan',
    userEmail: 'demo@trading.com',
    symbol: 'BTC/USDT',
    direction: 'UP',
    duration: 30,
    amount: 100,
    profitPercentage: 20,
    entryPrice: 88200.00,
    settlePrice: 88350.50,
    status: 'SETTLED',
    outcome: 'WIN',
    payout: 120.00,
    startTime: Date.now() - 60000 * 15,
    expireTime: Date.now() - 60000 * 15 + 30000,
    createdAt: new Date(Date.now() - 60000 * 15).toISOString(),
  },
  {
    id: 'trade_init_2',
    userId: 'user_demo_1',
    userName: 'Ali Khan',
    userEmail: 'demo@trading.com',
    symbol: 'ETH/USDT',
    direction: 'UP',
    duration: 60,
    amount: 200,
    profitPercentage: 40,
    entryPrice: 2830.00,
    settlePrice: 2845.00,
    status: 'SETTLED',
    outcome: 'WIN',
    payout: 280.00,
    startTime: Date.now() - 60000 * 10,
    expireTime: Date.now() - 60000 * 10 + 60000,
    createdAt: new Date(Date.now() - 60000 * 10).toISOString(),
  }
];

const walletRequests: WalletRequest[] = [
  {
    id: 'req_w_1',
    userId: 'user_demo_1',
    userName: 'Ali Khan',
    userEmail: 'demo@trading.com',
    type: 'WITHDRAWAL',
    amount: 150,
    currency: 'USDT',
    network: 'TRC20',
    walletAddress: 'TYDzsxdczk83KLAoPqmzJsh7492LKwqb',
    status: 'PENDING',
    remarks: 'Standard profit withdrawal',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'req_d_1',
    userId: 'user_demo_2',
    userName: 'Hamza Trader',
    userEmail: 'hamza@crypto.com',
    type: 'DEPOSIT',
    amount: 1000,
    currency: 'USDT',
    network: 'TRC20',
    txHash: '0x889df93a4b912c9820f18837265bc716e912',
    status: 'APPROVED',
    remarks: 'Approved by admin',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
  }
];

// Database Persistence Logic (Atomic & Crash-Safe)
function saveDatabase() {
  try {
    const data = {
      users,
      adminAccounts,
      trades,
      walletRequests,
      currentSupportNotice,
      currentAppConfig,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, jsonStr, 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
    try {
      fs.writeFileSync(`${DB_FILE}.bak`, jsonStr, 'utf-8');
    } catch (bErr) {
      // Ignore backup error
    }
  } catch (err) {
    console.error('[DATABASE] Failed to write database.json:', err);
  }
}

function ensureAdminIntegrity() {
  // 1. Supreme Owner jerry@786
  let ownerJerry = adminAccounts.find(a => {
    const u = cleanMobileInput(a.username || '').toLowerCase().replace(/^[@#:]+/, '');
    return u === 'jerry@786' || a.id === 'admin_supreme_owner';
  });
  if (!ownerJerry) {
    ownerJerry = {
      id: 'admin_supreme_owner',
      username: 'jerry@786',
      password: 'jerry@786',
      name: 'Supreme Founder (Owner)',
      role: 'SUPER_ADMIN',
      referralCode: 'JERRY786',
      permissions: {
        manageUsers: true,
        manageTrades: true,
        manageFinance: true,
        manageSupportNotice: true,
        manageAdmins: true
      },
      createdAt: new Date().toISOString(),
      isHiddenOwner: true
    };
    adminAccounts.unshift(ownerJerry);
  } else {
    ownerJerry.username = ownerJerry.username || 'jerry@786';
    if (!ownerJerry.password) ownerJerry.password = 'jerry@786';
    ownerJerry.isHiddenOwner = true;
    ownerJerry.role = 'SUPER_ADMIN';
  }

  // 2. Main Owner am9318930@gmail.com
  let ownerAM = adminAccounts.find(a => {
    const u = cleanMobileInput(a.username || '').toLowerCase();
    return u === 'am9318930@gmail.com' || a.id === 'admin_owner_am9318930';
  });
  if (!ownerAM) {
    ownerAM = {
      id: 'admin_owner_am9318930',
      username: 'am9318930@gmail.com',
      password: 'tesla@123',
      name: 'Main Owner (AM)',
      role: 'SUPER_ADMIN',
      referralCode: 'TESLA123',
      permissions: {
        manageUsers: true,
        manageTrades: true,
        manageFinance: true,
        manageSupportNotice: true,
        manageAdmins: true
      },
      createdAt: new Date().toISOString(),
      isHiddenOwner: true
    };
    adminAccounts.push(ownerAM);
  } else {
    ownerAM.username = 'am9318930@gmail.com';
    ownerAM.password = 'tesla@123';
    ownerAM.role = 'SUPER_ADMIN';
    ownerAM.isHiddenOwner = true;
    ownerAM.permissions = {
      manageUsers: true,
      manageTrades: true,
      manageFinance: true,
      manageSupportNotice: true,
      manageAdmins: true
    };
  }

  // 3. Master Admin jerry@321
  let master = adminAccounts.find(a => isMasterAdmin321(a));
  if (!master) {
    master = {
      id: 'admin_master',
      username: 'jerry@321',
      password: 'jerry@321',
      name: 'Master Admin (Main)',
      role: 'SUPER_ADMIN',
      referralCode: 'MASTER321',
      permissions: {
        manageUsers: true,
        manageTrades: true,
        manageFinance: true,
        manageSupportNotice: true,
        manageAdmins: true
      },
      createdAt: new Date().toISOString()
    };
    adminAccounts.push(master);
  } else {
    master.username = master.username || 'jerry@321';
    if (!master.password) master.password = 'jerry@321';
  }
}

function ensureVenomUser() {
  const normVenom = users.find(u => {
    const uUser = cleanMobileInput(u.username).toLowerCase().replace(/^[@#:]+/, '');
    return uUser === 'venom';
  });
  if (!normVenom) {
    users.unshift({
      id: 'user_venom',
      name: 'Venom Trader',
      username: 'venom',
      email: 'venom@flowcoin.online',
      password: 'venom',
      balance: 1000.00,
      freezeBalance: 0.00,
      creditScore: 100,
      currency: 'USD',
      status: 'active',
      tradeMode: 'AUTO',
      referredByAdminId: 'admin_master',
      referredByAdminUsername: 'jerry@321',
      referralCodeUsed: 'MASTER321',
      createdAt: '2026-09-01T00:00:00.000Z'
    });
  } else {
    if (!normVenom.password) normVenom.password = 'venom';
    if (!normVenom.currency || normVenom.currency === 'USDT') normVenom.currency = 'USD';
  }
}

function loadDatabase() {
  let loadedData: any = null;

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      if (raw && raw.trim()) {
        loadedData = JSON.parse(raw);
      }
    } catch (err) {
      console.error('[DATABASE] Primary database.json read failed, checking backup:', err);
      if (fs.existsSync(`${DB_FILE}.bak`)) {
        try {
          const bakRaw = fs.readFileSync(`${DB_FILE}.bak`, 'utf-8');
          if (bakRaw && bakRaw.trim()) {
            loadedData = JSON.parse(bakRaw);
          }
        } catch (bErr) {
          console.error('[DATABASE] Backup database read failed:', bErr);
        }
      }
    }
  }

  if (loadedData) {
    if (Array.isArray(loadedData.users) && loadedData.users.length > 0) {
      // Retain all file users and add defaults only if missing
      const fileUserIds = new Set(loadedData.users.map((u: any) => u.id));
      const hardcodedMissing = users.filter(u => !fileUserIds.has(u.id));
      users.length = 0;
      users.push(...loadedData.users, ...hardcodedMissing);
    }
    if (Array.isArray(loadedData.adminAccounts) && loadedData.adminAccounts.length > 0) {
      const fileAdminIds = new Set(loadedData.adminAccounts.map((a: any) => a.id));
      const hardcodedMissingAdmins = adminAccounts.filter(a => !fileAdminIds.has(a.id));
      adminAccounts.length = 0;
      adminAccounts.push(...loadedData.adminAccounts, ...hardcodedMissingAdmins);
    }
    if (Array.isArray(loadedData.trades) && loadedData.trades.length > 0) {
      trades.length = 0;
      trades.push(...loadedData.trades);
    }
    if (Array.isArray(loadedData.walletRequests) && loadedData.walletRequests.length > 0) {
      walletRequests.length = 0;
      walletRequests.push(...loadedData.walletRequests);
    }
    if (loadedData.currentSupportNotice) {
      currentSupportNotice = loadedData.currentSupportNotice;
    }
    if (loadedData.currentAppConfig) {
      currentAppConfig = loadedData.currentAppConfig;
    }
  }

  ensureAdminIntegrity();
  ensureVenomUser();
  saveDatabase();
}

function addNotification(userId: string, title: string, message: string, type: string) {
  const user = users.find(u => u.id === userId);
  if (!user) return;
  if (!user.notifications) user.notifications = [];
  const notif: UserNotification = {
    id: 'notif_' + Math.random().toString(36).substring(2, 9),
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };
  user.notifications.unshift(notif);
  if (user.notifications.length > 50) {
    user.notifications = user.notifications.slice(0, 50);
  }
}

// Multi-Currency Exchange Rates & Conversion Helpers
const CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
  USDT: 1.0,
  INR: 87.2,
  PKR: 278.5,
  BRL: 5.8,
  EGP: 50.5,
};

function convertCurrency(amount: number, fromCurr: string, toCurr: string): number {
  const fromCode = (fromCurr || 'USD').toUpperCase();
  const toCode = (toCurr || 'USD').toUpperCase();
  if (fromCode === toCode) return Number(amount.toFixed(2));

  const fromRate = CURRENCY_RATES[fromCode] || 1.0;
  const toRate = CURRENCY_RATES[toCode] || 1.0;

  const rawConverted = (amount / fromRate) * toRate;
  if (rawConverted > 0 && rawConverted < 0.01) {
    return Number(rawConverted.toFixed(4));
  }
  return Number(rawConverted.toFixed(2));
}

function toBaseUSD(amount: number, currency?: string): number {
  const code = (currency || 'USD').toUpperCase();
  const rate = CURRENCY_RATES[code] || 1.0;
  return Number((amount / rate).toFixed(6));
}

function fromBaseUSD(amountUSD: number, currency?: string): number {
  const code = (currency || 'USD').toUpperCase();
  const rate = CURRENCY_RATES[code] || 1.0;
  return Number((amountUSD * rate).toFixed(2));
}

const marketPairs: CryptoPair[] = [...INITIAL_PAIRS];

// --- REAL-TIME LIVE CRYPTO MARKET PRICES (BINANCE INTEGRATION) ---
async function syncRealCryptoPrices() {
  try {
    const symbolMap: Record<string, string> = {
      'BTCUSDT': 'BTC/USDT',
      'ETHUSDT': 'ETH/USDT',
      'SOLUSDT': 'SOL/USDT',
      'BNBUSDT': 'BNB/USDT',
      'XRPUSDT': 'XRP/USDT',
      'DOGEUSDT': 'DOGE/USDT',
      'ADAUSDT': 'ADA/USDT',
      'AVAXUSDT': 'AVAX/USDT',
      'DOTUSDT': 'DOT/USDT',
      'TRXUSDT': 'TRX/USDT',
      'LINKUSDT': 'LINK/USDT',
      'LTCUSDT': 'LTC/USDT',
      'NEARUSDT': 'NEAR/USDT',
      'SHIBUSDT': 'SHIB/USDT',
    };
    const symbols = Object.keys(symbolMap);
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (FLOWCOIN)' } });
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data)) return;

    data.forEach((item: any) => {
      const standardSymbol = symbolMap[item.symbol];
      if (!standardSymbol) return;
      const pair = marketPairs.find(p => p.symbol === standardSymbol);
      if (pair) {
        const last = parseFloat(item.lastPrice);
        const change = parseFloat(item.priceChangePercent);
        const high = parseFloat(item.highPrice);
        const low = parseFloat(item.lowPrice);
        const open = parseFloat(item.openPrice);
        const qVol = parseFloat(item.quoteVolume);

        if (!isNaN(last) && last > 0) {
          pair.currentPrice = last;
          pair.basePrice = (!isNaN(open) && open > 0) ? open : last;
          pair.change24h = !isNaN(change) ? Number(change.toFixed(2)) : pair.change24h;
          pair.high24h = (!isNaN(high) && high > 0) ? high : Math.max(pair.high24h, last);
          pair.low24h = (!isNaN(low) && low > 0) ? low : Math.min(pair.low24h, last);
          if (!isNaN(qVol) && qVol > 0) {
            if (qVol >= 1e9) pair.volume24h = (qVol / 1e9).toFixed(2) + 'B';
            else if (qVol >= 1e6) pair.volume24h = (qVol / 1e6).toFixed(1) + 'M';
            else pair.volume24h = (qVol / 1e3).toFixed(0) + 'K';
          }
        }
      }
    });
  } catch (err) {
    // Fallback gracefully to simulator micro-variations
  }
}

// Initial live fetch and recurring real-time sync every 3 seconds
syncRealCryptoPrices();
setInterval(syncRealCryptoPrices, 3000);

// --- LIVE MARKET SIMULATOR & TICKER GENERATOR ---
setInterval(() => {
  const now = Date.now();
  const runningTrades = trades.filter(t => t.status === 'RUNNING');

  marketPairs.forEach(pair => {
    // Check if there is an active running trade for this symbol
    const activeTrade = runningTrades.find(t => t.symbol === pair.symbol);
    let deltaPercent = (Math.random() - 0.50) * 0.0016; // Balanced two-way real-time fluctuation

    if (activeTrade) {
      const user = users.find(u => u.id === activeTrade.userId);
      const isForcedLoss = user && user.tradeMode === 'FORCE_LOSS';
      // If win expected, steer price gently in the direction of the trade
      if (!isForcedLoss) {
        if (activeTrade.direction === 'UP') {
          deltaPercent = (Math.random() - 0.40) * 0.0020; // Bullish drift for win
        } else {
          deltaPercent = (Math.random() - 0.60) * 0.0020; // Bearish drift for win
        }
      } else {
        if (activeTrade.direction === 'UP') {
          deltaPercent = (Math.random() - 0.65) * 0.0020; // Bearish drift for forced loss
        } else {
          deltaPercent = (Math.random() - 0.35) * 0.0020; // Bullish drift for forced loss
        }
      }
    }

    const microVariation = pair.currentPrice * deltaPercent;
    const nextPrice = Math.max(0.000001, pair.currentPrice + microVariation);
    pair.currentPrice = Number(nextPrice.toFixed(pair.precision));
    
    // Update 24h high/low and change
    if (pair.currentPrice > pair.high24h) pair.high24h = pair.currentPrice;
    if (pair.currentPrice < pair.low24h) pair.low24h = pair.currentPrice;
    const change = ((pair.currentPrice - pair.basePrice) / pair.basePrice) * 100;
    pair.change24h = Number(change.toFixed(2));
  });

  // Check active trades that have expired
  trades.forEach(trade => {
    if (trade.status === 'RUNNING' && now >= trade.expireTime) {
      const user = users.find(u => u.id === trade.userId);
      const pair = marketPairs.find(p => p.symbol === trade.symbol);
      const settlePrice = pair ? pair.currentPrice : trade.entryPrice;
      trade.settlePrice = settlePrice;
      trade.status = 'SETTLED';

      let isWin = true; // Default always profit/win as requested
      if (user && user.tradeMode === 'FORCE_LOSS') {
        isWin = false;
      } else if (user && user.tradeMode === 'FORCE_WIN') {
        isWin = true;
      } else {
        // Auto / Default behavior: Always Win/Profit unless Admin sets FORCE_LOSS
        isWin = true;
      }

      // Adjust settle price to match the outcome realistically
      if (isWin) {
        if (trade.direction === 'UP') {
          trade.settlePrice = Math.max(pair ? pair.currentPrice : trade.entryPrice, Number((trade.entryPrice * 1.0025).toFixed(pair?.precision || 2)));
        } else {
          trade.settlePrice = Math.min(pair ? pair.currentPrice : trade.entryPrice, Number((trade.entryPrice * 0.9975).toFixed(pair?.precision || 2)));
        }
      } else {
        if (trade.direction === 'UP') {
          trade.settlePrice = Math.min(pair ? pair.currentPrice : trade.entryPrice, Number((trade.entryPrice * 0.9975).toFixed(pair?.precision || 2)));
        } else {
          trade.settlePrice = Math.max(pair ? pair.currentPrice : trade.entryPrice, Number((trade.entryPrice * 1.0025).toFixed(pair?.precision || 2)));
        }
      }

      if (isWin) {
        trade.outcome = 'WIN';
        const profit = (trade.amount * trade.profitPercentage) / 100;
        const totalPayout = trade.amount + profit;
        trade.payout = Number(totalPayout.toFixed(2));

        if (user) {
          user.freezeBalance = Math.max(0, Number((user.freezeBalance - trade.amount).toFixed(2)));
          user.balance = Number((user.balance + totalPayout).toFixed(2));
          addNotification(
            user.id,
            '🎉 Trade Settled - WIN!',
            `Your ${trade.duration}s option on ${trade.symbol} won! Payout of ${trade.payout} ${user.currency || 'USD'} has been credited.`,
            'TRADE_WIN'
          );
        }
      } else {
        trade.outcome = 'LOSS';
        trade.payout = 0;

        if (user) {
          user.freezeBalance = Math.max(0, Number((user.freezeBalance - trade.amount).toFixed(2)));
          addNotification(
            user.id,
            '📉 Trade Settled - LOSS',
            `Your ${trade.duration}s option on ${trade.symbol} expired.`,
            'TRADE_LOSS'
          );
        }
      }
      saveDatabase();
    }
  });
}, 1000);

async function startServer() {
  // Load persistent records from database.json on server start
  loadDatabase();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Body parser limit increased to 100mb for large APK file uploads
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Static APK downloads directory with proper mime headers
  const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }
  app.use('/downloads', express.static(downloadsDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.apk')) {
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', 'attachment; filename="flowcoin.apk"');
      }
    }
  }));

  // --- API ROUTES ---

  // Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. AUTH ROUTES
  // User Registration (Supports Username, Name, Password, Referral Code, Country & Currency)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { username, name, email, password, currency, referralCode } = req.body;
    const finalName = cleanMobileInput(username || name);
    const finalUsername = cleanMobileInput(username || name);
    const rawPassword = typeof password === 'string' ? password : '';
    const cleanPassword = cleanMobileInput(rawPassword);

    if (!finalName || !cleanPassword) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Strict Requirement: Referral Code is Mandatory and must be exact & correct
    const rawRef = typeof referralCode === 'string' ? cleanMobileInput(referralCode) : '';
    if (!rawRef) {
      return res.status(400).json({ error: 'Referral code is required. Registration is by invitation only.' });
    }

    // Match against registered administrators (case-insensitive and whitespace-tolerant)
    const cleanRawRef = rawRef.trim().toUpperCase().replace(/^[@#:]+/, '');
    let matchedAdmin = adminAccounts.find(a => {
      const aRef = cleanMobileInput(a.referralCode).trim().toUpperCase();
      const aUser = cleanMobileInput(a.username).trim().toUpperCase().replace(/^[@#:]+/, '');
      const aId = cleanMobileInput(a.id).trim().toUpperCase();
      return aRef === cleanRawRef || aUser === cleanRawRef || aId === cleanRawRef;
    });

    if (!matchedAdmin) {
      return res.status(400).json({ error: 'Invalid referral code! Please enter the exact referral code or username provided by your administrator.' });
    }

    const finalEmail = (email && cleanMobileInput(email)) 
      ? cleanMobileInput(email).toLowerCase() 
      : `${finalName.toLowerCase().replace(/[^a-z0-9]/g, '')}@flowcoin.com`;

    const existing = users.find(u => 
      cleanMobileInput(u.email).toLowerCase() === finalEmail.toLowerCase() || 
      cleanMobileInput(u.name).toLowerCase() === finalName.toLowerCase() ||
      (u.username && cleanMobileInput(u.username).toLowerCase() === finalUsername.toLowerCase())
    );
    if (existing) {
      return res.status(400).json({ error: 'An account with this username or email already exists' });
    }

    const validCurrency = (currency && ['USD', 'INR', 'PKR', 'BRL', 'EGP'].includes(currency)) ? currency : 'USD';

    const referredByAdminId = matchedAdmin ? matchedAdmin.id : 'admin_master';
    const referredByAdminUsername = matchedAdmin ? matchedAdmin.username : 'jerry@321';
    const referralCodeUsed = matchedAdmin ? matchedAdmin.referralCode : rawRef;

    const newUser: User = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      name: finalName,
      username: finalUsername,
      email: finalEmail,
      password: cleanPassword,
      balance: 0.00, // Initial balance 0.00 as requested
      freezeBalance: 0.00,
      creditScore: 100, // Initial credit score 100 as requested
      currency: validCurrency,
      status: 'active',
      tradeMode: 'AUTO',
      referredByAdminId,
      referredByAdminUsername,
      referralCodeUsed,
      createdAt: new Date().toISOString(),
    };

    users.unshift(newUser);
    saveDatabase();
    const { password: _, ...safeUser } = newUser;
    return res.status(201).json({ success: true, user: safeUser });
  });

  // Unified Login (Directly detects and routes Admin credentials or Client credentials)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    const rawIdentifier = cleanMobileInput(username || email);
    const rawPassword = typeof password === 'string' ? password : '';
    const cleanPassword = cleanMobileInput(rawPassword);

    if (!rawIdentifier || !cleanPassword) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanId = rawIdentifier.toLowerCase().replace(/^[@#:]+/, '');
    const normId = normalizeKey(rawIdentifier);

    // 1. Check if identifier matches ANY Administrator (Super Admin or Sub-Admin)
    const admin = adminAccounts.find(a => {
      const aId = cleanMobileInput(a.id).toLowerCase();
      const aUser = cleanMobileInput(a.username).toLowerCase().replace(/^[@#:]+/, '');
      const aUserRaw = cleanMobileInput(a.username).toLowerCase();
      const aEmail = cleanMobileInput(a.username.includes('@') ? a.username : `${a.username}@flowcoin.com`).toLowerCase();
      const aRef = cleanMobileInput(a.referralCode).toLowerCase();
      const normAUser = normalizeKey(a.username);
      const normAId = normalizeKey(a.id);
      
      return (
        aUser === cleanId ||
        aUserRaw === cleanId ||
        aId === cleanId ||
        aEmail === cleanId ||
        aRef === cleanId ||
        (normId && (normId === normAUser || normId === normAId)) ||
        (cleanId === 'admin@trading.com' && (aUser === 'jerry@321' || a.role === 'SUPER_ADMIN')) ||
        (cleanId === 'admin' && a.role === 'SUPER_ADMIN')
      );
    });

    if (admin) {
      const isMatch = isPasswordEquivalent(admin.password, rawPassword);
      if (isMatch) {
        recordAdminLogin(admin, req);
        return res.json({
          success: true,
          isAdmin: true,
          admin: {
            id: admin.id,
            name: admin.name,
            email: admin.username.includes('@') ? admin.username : `${admin.username}@flowcoin.com`,
            username: admin.username,
            role: admin.role,
            referralCode: admin.referralCode,
            permissions: admin.permissions,
            createdAt: admin.createdAt,
            lastLoginTime: admin.lastLoginTime,
            loginHistory: admin.loginHistory || [],
            activeDevicesCount: (admin.loginHistory || []).length,
            isOwner: isSupremeOwnerAdmin(admin),
            isPermanentMaster: isMasterAdmin321(admin),
            telegramSupportUrl: admin.telegramSupportUrl || '',
            telegramGreetingMessage: admin.telegramGreetingMessage || ''
          }
        });
      } else {
        return res.status(401).json({ error: 'Incorrect administrator password' });
      }
    }

    // 2. Otherwise check normal registered clients
    const user = users.find(u => {
      const uUser = cleanMobileInput(u.username).toLowerCase().replace(/^[@#:]+/, '');
      const uEmail = cleanMobileInput(u.email).toLowerCase();
      const uName = cleanMobileInput(u.name).toLowerCase();
      const normUUser = normalizeKey(u.username);
      const normUName = normalizeKey(u.name);

      return (
        uEmail === cleanId ||
        uName === cleanId ||
        uUser === cleanId ||
        (normId && (normId === normUUser || normId === normUName))
      );
    });

    if (!user || !isPasswordEquivalent(user.password || '', rawPassword)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account has been suspended by administration' });
    }

    const { password: _, ...safeUser } = user;
    return res.json({ success: true, isAdmin: false, user: safeUser });
  });

  // Support Team Notice (Client & Admin with Per-Admin Telegram Desk Support)
  app.get('/api/support-notice', (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const adminId = req.query.adminId as string | undefined;

    let targetAdmin: AdminAccount | undefined;

    if (userId) {
      const user = users.find(u => u.id === userId || cleanMobileInput(u.username).toLowerCase() === cleanMobileInput(userId).toLowerCase());
      if (user) {
        if (user.referredByAdminId) {
          targetAdmin = adminAccounts.find(a => a.id === user.referredByAdminId);
        }
        if (!targetAdmin && user.referralCodeUsed) {
          targetAdmin = adminAccounts.find(a => cleanMobileInput(a.referralCode).toUpperCase() === cleanMobileInput(user.referralCodeUsed).toUpperCase());
        }
        if (!targetAdmin && user.referredByAdminUsername) {
          targetAdmin = adminAccounts.find(a => cleanMobileInput(a.username).toLowerCase() === cleanMobileInput(user.referredByAdminUsername).toLowerCase());
        }
      }
    } else if (adminId) {
      targetAdmin = adminAccounts.find(a => a.id === adminId || cleanMobileInput(a.username).toLowerCase() === cleanMobileInput(adminId).toLowerCase());
    }

    let dynamicTelegramUrl = (targetAdmin?.telegramSupportUrl && targetAdmin.telegramSupportUrl.trim()) || 
                             (currentSupportNotice.telegramSupportUrl && currentSupportNotice.telegramSupportUrl.trim()) || 
                             'https://t.me/flowcoin_support';
                             
    let greetingMessage = (targetAdmin?.telegramGreetingMessage && targetAdmin.telegramGreetingMessage.trim()) || 
                          'Hello Customer Support, I need assistance with my account.';
    let assignedAdminName = targetAdmin ? targetAdmin.name : 'Customer Support Desk';

    // If userId was provided, personalize the pre-filled greeting message
    if (userId) {
      const user = users.find(u => u.id === userId || cleanMobileInput(u.username).toLowerCase() === cleanMobileInput(userId).toLowerCase());
      if (user) {
        const uName = user.username || user.name;
        greetingMessage = greetingMessage
          .replace(/{username}/gi, uName)
          .replace(/{userId}/gi, user.id)
          .replace(/{id}/gi, user.id)
          .replace(/{name}/gi, user.name);
      }
    }

    // Format clean direct link for Telegram with pre-filled greeting text
    let finalTelegramLink = dynamicTelegramUrl;
    if (finalTelegramLink) {
      let handleOrUrl = finalTelegramLink.trim();
      if (!handleOrUrl.startsWith('http://') && !handleOrUrl.startsWith('https://')) {
        handleOrUrl = `https://t.me/${handleOrUrl.replace(/^@+/, '')}`;
      }
      try {
        const urlObj = new URL(handleOrUrl);
        urlObj.searchParams.set('text', greetingMessage);
        finalTelegramLink = urlObj.toString();
      } catch (e) {
        finalTelegramLink = `${handleOrUrl}?text=${encodeURIComponent(greetingMessage)}`;
      }
    }

    res.json({
      success: true,
      notice: {
        ...currentSupportNotice,
        telegramSupportUrl: finalTelegramLink,
        rawTelegramUrl: dynamicTelegramUrl,
        telegramGreetingMessage: greetingMessage,
        assignedAdminName: assignedAdminName
      }
    });
  });

  // Mobile App Configuration & Public Download Endpoints (Restricted to Supreme Owner jerry@786)
  app.get('/api/app-config', (req: Request, res: Response) => {
    res.json({
      success: true,
      appConfig: currentAppConfig
    });
  });

  app.post('/api/admin/app-config', (req: Request, res: Response) => {
    const { playStoreUrl, apkUrl, driveUrl, adminId } = req.body;
    
    // Strict requirement: Only Main Owner jerry@786 can upload/change mobile app links!
    const requester = adminAccounts.find(a => a.id === adminId || cleanMobileInput(a.username).toLowerCase() === cleanMobileInput(adminId).toLowerCase());
    if (!requester || !isSupremeOwnerAdmin(requester)) {
      return res.status(403).json({ error: 'Permission Denied: Only Supreme System Owner (jerry@786) is authorized to upload or modify mobile app links.' });
    }

    if (playStoreUrl !== undefined) {
      currentAppConfig.playStoreUrl = cleanMobileInput(playStoreUrl);
    }
    if (apkUrl !== undefined) {
      currentAppConfig.apkUrl = cleanMobileInput(apkUrl);
    }
    if (driveUrl !== undefined) {
      currentAppConfig.driveUrl = cleanMobileInput(driveUrl);
    }
    currentAppConfig.updatedAt = new Date().toISOString();
    saveDatabase();
    res.json({ success: true, appConfig: currentAppConfig, message: 'Mobile app download configuration updated successfully!' });
  });

  // Direct APK File Upload Endpoint (Restricted to jerry@786)
  app.post('/api/admin/upload-apk', (req: Request, res: Response) => {
    const { adminId, fileName, fileBase64, apkUrl, driveUrl } = req.body;
    
    const requester = adminAccounts.find(a => a.id === adminId || cleanMobileInput(a.username).toLowerCase() === cleanMobileInput(adminId).toLowerCase());
    if (!requester || !isSupremeOwnerAdmin(requester)) {
      return res.status(403).json({ error: 'Permission Denied: Only Supreme System Owner (jerry@786) can upload APK files.' });
    }

    if (driveUrl && typeof driveUrl === 'string' && driveUrl.trim()) {
      currentAppConfig.driveUrl = driveUrl.trim();
    }
    if (apkUrl && typeof apkUrl === 'string' && apkUrl.trim()) {
      currentAppConfig.apkUrl = apkUrl.trim();
    }

    if (fileBase64 && typeof fileBase64 === 'string' && fileBase64.trim()) {
      try {
        const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
        if (!fs.existsSync(downloadsDir)) {
          fs.mkdirSync(downloadsDir, { recursive: true });
        }
        const cleanBase64 = fileBase64.replace(/^data:.*;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const targetPath = path.join(downloadsDir, 'flowcoin.apk');
        fs.writeFileSync(targetPath, buffer);

        currentAppConfig.apkUrl = '/downloads/flowcoin.apk';
        currentAppConfig.updatedAt = new Date().toISOString();
        saveDatabase();
        return res.json({
          success: true,
          appConfig: currentAppConfig,
          message: 'APK file uploaded successfully! Clients can now download it directly.'
        });
      } catch (err: any) {
        return res.status(500).json({ error: 'Failed to save APK file on server: ' + err.message });
      }
    }

    currentAppConfig.updatedAt = new Date().toISOString();
    saveDatabase();
    return res.json({ success: true, appConfig: currentAppConfig, message: 'Mobile app links updated successfully!' });
  });

  // 1. Direct Server APK File Download
  app.get('/api/download-apk', (req: Request, res: Response) => {
    const localApk = path.join(process.cwd(), 'public', 'downloads', 'flowcoin.apk');
    if (fs.existsSync(localApk)) {
      return res.download(localApk, 'flowcoin.apk');
    }
    if (currentAppConfig.driveUrl && currentAppConfig.driveUrl.trim().startsWith('http')) {
      return res.redirect(302, currentAppConfig.driveUrl.trim());
    }
    if (currentAppConfig.apkUrl && currentAppConfig.apkUrl.trim().startsWith('http')) {
      return res.redirect(302, currentAppConfig.apkUrl.trim());
    }
    return res.status(404).json({ error: 'No APK file uploaded on server yet. Please upload file in Admin panel or set Drive link.' });
  });

  // 2. Google Drive / External Mirror Link Redirect
  app.get('/api/download-drive', (req: Request, res: Response) => {
    let target = currentAppConfig.driveUrl || currentAppConfig.apkUrl || '';
    if (target && target.trim().startsWith('http')) {
      return res.redirect(302, target.trim());
    }
    return res.redirect(302, '/api/download-apk');
  });

  // 3. Fallback Route
  app.get('/api/download-app', (req: Request, res: Response) => {
    const type = req.query.type as string | undefined;
    if (type === 'drive' || type === 'mirror') {
      return res.redirect(302, '/api/download-drive');
    }
    return res.redirect(302, '/api/download-apk');
  });

  // Client User Notifications API Endpoints
  app.get('/api/notifications/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, notifications: user.notifications || [] });
  });

  app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
    const { userId, notificationId } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.notifications) {
      user.notifications.forEach(n => {
        if (!notificationId || n.id === notificationId) {
          n.read = true;
        }
      });
      saveDatabase();
    }
    res.json({ success: true, notifications: user.notifications || [] });
  });

  app.post('/api/admin/support-notice', (req: Request, res: Response) => {
    const { title, message, isActive, telegramSupportUrl, adminId } = req.body;
    
    // Check permission if sub-admin
    if (adminId) {
      const requester = adminAccounts.find(a => a.id === adminId);
      if (requester && requester.role !== 'SUPER_ADMIN' && !requester.permissions?.manageSupportNotice) {
        return res.status(403).json({ error: 'Permission denied: Only Super Admin can change Telegram Support URL' });
      }
    }

    currentSupportNotice = {
      id: 'notice_' + Date.now(),
      title: (title || 'Support Team Notice').trim(),
      message: (message || '').trim(),
      updatedAt: new Date().toISOString(),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      telegramSupportUrl: telegramSupportUrl !== undefined ? telegramSupportUrl.trim() : (currentSupportNotice.telegramSupportUrl || 'https://t.me/flowcoin_support'),
    };
    saveDatabase();
    res.json({ success: true, notice: currentSupportNotice });
  });

  // Admin Update Their Own Telegram Support Desk
  app.post('/api/admin/telegram-support', (req: Request, res: Response) => {
    const { adminId, telegramSupportUrl, telegramGreetingMessage } = req.body;
    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    const admin = adminAccounts.find(a => a.id === adminId || cleanMobileInput(a.username).toLowerCase() === cleanMobileInput(adminId).toLowerCase());
    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    let cleanUrl = typeof telegramSupportUrl === 'string' ? telegramSupportUrl.trim() : '';
    if (cleanUrl) {
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://t.me/${cleanUrl.replace(/^@+/, '')}`;
      }
    }

    admin.telegramSupportUrl = cleanUrl;
    if (telegramGreetingMessage !== undefined) {
      admin.telegramGreetingMessage = typeof telegramGreetingMessage === 'string' ? telegramGreetingMessage.trim() : '';
    }

    if (isMasterAdmin321(admin) || isSupremeOwnerAdmin(admin)) {
      if (cleanUrl) {
        currentSupportNotice.telegramSupportUrl = cleanUrl;
      }
    }

    saveDatabase();

    return res.json({
      success: true,
      message: 'Your personal client customer support Telegram link has been updated successfully!',
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        referralCode: admin.referralCode,
        permissions: admin.permissions,
        createdAt: admin.createdAt,
        telegramSupportUrl: admin.telegramSupportUrl,
        telegramGreetingMessage: admin.telegramGreetingMessage
      }
    });
  });

  // User Change Password
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const { userId, oldPassword, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password are required' });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (oldPassword && user.password && user.password !== oldPassword) {
      return res.status(400).json({ error: 'Current password does not match' });
    }

    user.password = newPassword;
    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser, message: 'Password successfully updated' });
  });

  // Admin Login Direct Endpoint (Supports jerry@321 as requested and any created admin accounts)
  app.post('/api/auth/admin-login', (req: Request, res: Response) => {
    const { email, username, password } = req.body;
    const rawIdentifier = cleanMobileInput(username || email);
    const rawPassword = typeof password === 'string' ? password : '';
    const cleanPassword = cleanMobileInput(rawPassword);
    
    if (!rawIdentifier || !cleanPassword) {
      return res.status(400).json({ error: 'Admin username and password are required' });
    }

    const cleanId = rawIdentifier.toLowerCase().replace(/^[@#:]+/, '');
    const normId = normalizeKey(rawIdentifier);

    const admin = adminAccounts.find(a => {
      const aId = cleanMobileInput(a.id).toLowerCase();
      const aUser = cleanMobileInput(a.username).toLowerCase().replace(/^[@#:]+/, '');
      const aUserRaw = cleanMobileInput(a.username).toLowerCase();
      const aEmail = cleanMobileInput(a.username.includes('@') ? a.username : `${a.username}@flowcoin.com`).toLowerCase();
      const aRef = cleanMobileInput(a.referralCode).toLowerCase();
      const normAUser = normalizeKey(a.username);
      const normAId = normalizeKey(a.id);
      
      return (
        aUser === cleanId ||
        aUserRaw === cleanId ||
        aId === cleanId ||
        aEmail === cleanId ||
        aRef === cleanId ||
        (normId && (normId === normAUser || normId === normAId)) ||
        (cleanId === 'admin@trading.com' && (aUser === 'jerry@321' || a.role === 'SUPER_ADMIN')) ||
        (cleanId === 'admin' && a.role === 'SUPER_ADMIN')
      );
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin username or credentials' });
    }

    const isMatch = isPasswordEquivalent(admin.password, rawPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect administrator password' });
    }

    recordAdminLogin(admin, req);

    return res.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.username.includes('@') ? admin.username : `${admin.username}@flowcoin.com`,
        username: admin.username,
        role: admin.role,
        referralCode: admin.referralCode,
        permissions: admin.permissions,
        createdAt: admin.createdAt,
        lastLoginTime: admin.lastLoginTime,
        loginHistory: admin.loginHistory || [],
        activeDevicesCount: (admin.loginHistory || []).length,
        isOwner: isSupremeOwnerAdmin(admin),
        isPermanentMaster: isMasterAdmin321(admin),
        telegramSupportUrl: admin.telegramSupportUrl || '',
        telegramGreetingMessage: admin.telegramGreetingMessage || ''
      }
    });
  });

  // Fetch individual admin profile by ID or username for session refresh & persistence
  app.get('/api/admin/profile/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const cleanId = cleanMobileInput(id).toLowerCase().replace(/^[@#:]+/, '');
    const admin = adminAccounts.find(a => 
      a.id === id || 
      cleanMobileInput(a.username).toLowerCase().replace(/^[@#:]+/, '') === cleanId
    );
    if (!admin) {
      return res.status(404).json({ error: 'Administrator not found' });
    }
    return res.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.username.includes('@') ? admin.username : `${admin.username}@flowcoin.com`,
        username: admin.username,
        role: admin.role,
        referralCode: admin.referralCode,
        permissions: admin.permissions,
        createdAt: admin.createdAt,
        lastLoginTime: admin.lastLoginTime,
        loginHistory: admin.loginHistory || [],
        activeDevicesCount: (admin.loginHistory || []).length,
        isOwner: isSupremeOwnerAdmin(admin),
        isPermanentMaster: isMasterAdmin321(admin),
        telegramSupportUrl: admin.telegramSupportUrl || '',
        telegramGreetingMessage: admin.telegramGreetingMessage || ''
      }
    });
  });

  // Admin Management Routes (Master Super Admin only)
  app.get('/api/admin/administrators', (req: Request, res: Response) => {
    const callerId = (req.query.callerAdminId as string) || (req.headers['x-admin-id'] as string) || '';
    const caller = adminAccounts.find(a => 
      a.id === callerId || 
      cleanMobileInput(a.username).toLowerCase() === cleanMobileInput(callerId).toLowerCase()
    );

    const isCallerOwner = isSupremeOwnerAdmin(caller);

    // CRITICAL USER MANDATE:
    // "mean me sab se bara admin hun liken yeah ksi admin ko show nhe hona chaye ke yeah admin hy"
    // "ksi b admin ke active system me show nhe hona chaye"
    // The Supreme Owner (jerry@786) MUST be completely invisible unless the caller IS jerry@786!
    const visibleAccounts = adminAccounts.filter(a => {
      if (isSupremeOwnerAdmin(a)) {
        return isCallerOwner; // Only visible if caller is jerry@786!
      }
      return true;
    });

    const safeAdmins = visibleAccounts.map(a => {
      const referredUsers = users.filter(u => u.referredByAdminId === a.id);
      const totalBalance = referredUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
      return {
        id: a.id,
        username: a.username,
        name: a.name,
        role: a.role,
        referralCode: a.referralCode,
        permissions: a.permissions,
        createdAt: a.createdAt,
        lastLoginTime: a.lastLoginTime,
        loginHistory: a.loginHistory || [],
        activeDevicesCount: (a.loginHistory || []).length,
        isOwner: isSupremeOwnerAdmin(a),
        isPermanentMaster: isMasterAdmin321(a),
        telegramSupportUrl: a.telegramSupportUrl || '',
        telegramGreetingMessage: a.telegramGreetingMessage || '',
        referredClientsCount: referredUsers.length,
        totalReferredBalance: Number(totalBalance.toFixed(2)),
        referredClients: referredUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          balance: u.balance,
          creditScore: u.creditScore,
          status: u.status,
          createdAt: u.createdAt
        })),
        passwordPreview: a.password.length > 2 ? `${a.password.substring(0, 2)}••••${a.password.slice(-1)}` : '••••'
      };
    });
    res.json({ success: true, administrators: safeAdmins });
  });

  app.post('/api/admin/administrators/create', (req: Request, res: Response) => {
    const { username, name, password, role, referralCode, telegramSupportUrl, telegramGreeting, telegramGreetingMessage, permissions } = req.body;
    const cleanUsername = cleanMobileInput(username);
    const cleanPassword = cleanMobileInput(password);
    const cleanName = cleanMobileInput(name) || cleanUsername || 'System Administrator';

    if (!cleanUsername || !cleanPassword) {
      return res.status(400).json({ error: 'Admin username and password are required' });
    }

    if (adminAccounts.some(a => cleanMobileInput(a.username).toLowerCase() === cleanUsername.toLowerCase())) {
      return res.status(400).json({ error: 'An admin with this username already exists' });
    }

    let finalRefCode = cleanMobileInput(referralCode).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!finalRefCode) {
      const sanitized = cleanUsername.toUpperCase().replace(/[^A-Z0-9]/g, '');
      finalRefCode = `REF_${sanitized || 'ADMIN'}_${Math.floor(100 + Math.random() * 900)}`;
    }

    if (adminAccounts.some(a => cleanMobileInput(a.referralCode).toUpperCase() === finalRefCode.toUpperCase())) {
      return res.status(400).json({ error: 'This referral code is already assigned to another administrator' });
    }

    const isSuper = role === 'SUPER_ADMIN';
    const defaultPermissions: AdminPermissions = {
      manageUsers: permissions?.manageUsers !== undefined ? Boolean(permissions.manageUsers) : true,
      manageTrades: permissions?.manageTrades !== undefined ? Boolean(permissions.manageTrades) : true,
      manageFinance: permissions?.manageFinance !== undefined ? Boolean(permissions.manageFinance) : true,
      manageSupportNotice: permissions?.manageSupportNotice !== undefined ? Boolean(permissions.manageSupportNotice) : isSuper,
      manageAdmins: isSuper ? true : (permissions?.manageAdmins !== undefined ? Boolean(permissions.manageAdmins) : false)
    };

    const newAdmin: AdminAccount = {
      id: 'admin_' + Math.random().toString(36).substring(2, 9),
      username: cleanUsername,
      password: cleanPassword,
      name: cleanName,
      role: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
      referralCode: finalRefCode,
      permissions: defaultPermissions,
      createdAt: new Date().toISOString(),
      telegramSupportUrl: telegramSupportUrl ? cleanMobileInput(telegramSupportUrl) : undefined,
      telegramGreetingMessage: (telegramGreetingMessage || telegramGreeting) ? cleanMobileInput(telegramGreetingMessage || telegramGreeting) : undefined,
    };

    adminAccounts.push(newAdmin);
    saveDatabase();

    res.status(201).json({
      success: true,
      message: `Admin account "${cleanUsername}" created with referral code "${finalRefCode}"`,
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        name: newAdmin.name,
        role: newAdmin.role,
        referralCode: newAdmin.referralCode,
        permissions: newAdmin.permissions,
        createdAt: newAdmin.createdAt,
        telegramSupportUrl: newAdmin.telegramSupportUrl || '',
        telegramGreetingMessage: newAdmin.telegramGreetingMessage || ''
      }
    });
  });

  // Admin Update Permissions, Role, Password, or Details
  app.put('/api/admin/administrators/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, role, permissions, password, referralCode, telegramSupportUrl, telegramGreeting, telegramGreetingMessage } = req.body;
    const callerId = (req.body?.callerAdminId as string) || (req.headers['x-admin-id'] as string) || '';
    const caller = adminAccounts.find(a => 
      a.id === callerId || 
      cleanMobileInput(a.username).toLowerCase() === cleanMobileInput(callerId).toLowerCase()
    );
    const isCallerOwner = isSupremeOwnerAdmin(caller);

    const admin = adminAccounts.find(a => a.id === id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    // Protection: Supreme Owner jerry@786 can NEVER be edited by other admins
    if (isSupremeOwnerAdmin(admin) && !isCallerOwner) {
      return res.status(403).json({ error: 'Access Denied: Supreme System Owner account cannot be modified by any other administrator.' });
    }

    // Protection: Master Admin jerry@321 can only be modified by the Supreme Owner or himself
    if (isMasterAdmin321(admin) && !isCallerOwner && caller?.id !== admin.id) {
      return res.status(403).json({ error: 'Access Denied: Only the Supreme Owner (jerry@786) can modify the Master Administrator account.' });
    }

    if (name) {
      const cleanName = cleanMobileInput(name);
      if (cleanName) admin.name = cleanName;
    }

    if (role && (role === 'SUPER_ADMIN' || role === 'ADMIN')) {
      admin.role = role;
    }

    if (password) {
      const cleanPass = cleanMobileInput(password);
      if (cleanPass) admin.password = cleanPass;
    }

    if (telegramSupportUrl !== undefined) {
      admin.telegramSupportUrl = cleanMobileInput(telegramSupportUrl);
    }

    if (telegramGreetingMessage !== undefined || telegramGreeting !== undefined) {
      admin.telegramGreetingMessage = cleanMobileInput(telegramGreetingMessage || telegramGreeting);
    }

    if (referralCode) {
      const cleanRef = cleanMobileInput(referralCode).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (cleanRef.length >= 3) {
        const duplicate = adminAccounts.find(a => a.id !== id && cleanMobileInput(a.referralCode).toUpperCase() === cleanRef);
        if (duplicate) {
          return res.status(400).json({ error: `Referral code "${cleanRef}" is already used by another admin` });
        }
        admin.referralCode = cleanRef;
      }
    }

    if (permissions && typeof permissions === 'object') {
      const isSuper = admin.role === 'SUPER_ADMIN';
      admin.permissions = {
        manageUsers: permissions.manageUsers !== undefined ? Boolean(permissions.manageUsers) : admin.permissions.manageUsers,
        manageTrades: permissions.manageTrades !== undefined ? Boolean(permissions.manageTrades) : admin.permissions.manageTrades,
        manageFinance: permissions.manageFinance !== undefined ? Boolean(permissions.manageFinance) : admin.permissions.manageFinance,
        manageSupportNotice: permissions.manageSupportNotice !== undefined ? Boolean(permissions.manageSupportNotice) : admin.permissions.manageSupportNotice,
        manageAdmins: isSuper ? true : (permissions.manageAdmins !== undefined ? Boolean(permissions.manageAdmins) : admin.permissions.manageAdmins)
      };
    }

    saveDatabase();

    res.json({
      success: true,
      message: `Administrator "${admin.username}" access and permissions updated successfully`,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        referralCode: admin.referralCode,
        permissions: admin.permissions,
        createdAt: admin.createdAt,
        isOwner: isSupremeOwnerAdmin(admin),
        isPermanentMaster: isMasterAdmin321(admin),
        telegramSupportUrl: admin.telegramSupportUrl || '',
        telegramGreetingMessage: admin.telegramGreetingMessage || ''
      }
    });
  });

  app.delete('/api/admin/administrators/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { callerAdminId } = req.body || {};
    const callerId = (callerAdminId as string) || (req.headers['x-admin-id'] as string) || '';
    const caller = adminAccounts.find(a => 
      a.id === callerId || 
      cleanMobileInput(a.username).toLowerCase() === cleanMobileInput(callerId).toLowerCase()
    );
    const isCallerOwner = isSupremeOwnerAdmin(caller);

    // CRITICAL: Only Supreme Owner (Jerry@786) can delete other admins! No other admin can delete any admin.
    if (!isCallerOwner) {
      return res.status(403).json({ error: 'Permission Denied: Administrators cannot delete other admin accounts. Only the Supreme Owner (Jerry@786) can delete admin accounts.' });
    }

    const index = adminAccounts.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    const targetAdmin = adminAccounts[index];

    // Supreme Owner jerry@786 can NEVER be deleted by anyone!
    if (isSupremeOwnerAdmin(targetAdmin)) {
      return res.status(403).json({ error: 'Permission Denied: The Supreme System Owner account is permanent and cannot be deleted.' });
    }

    if (callerId && targetAdmin.id === callerId) {
      return res.status(403).json({ error: 'You cannot delete your own active administrator account while logged in.' });
    }

    adminAccounts.splice(index, 1);
    saveDatabase();
    res.json({ success: true, message: `Admin "${targetAdmin.username}" removed successfully` });
  });

  // Admin Change Their Own Referral Code
  app.post('/api/admin/change-referral-code', (req: Request, res: Response) => {
    const { adminId, newReferralCode } = req.body;
    if (!adminId || !newReferralCode || typeof newReferralCode !== 'string' || !newReferralCode.trim()) {
      return res.status(400).json({ error: 'Admin ID and new referral code are required' });
    }

    const cleanCode = newReferralCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode.length < 3) {
      return res.status(400).json({ error: 'Referral code must be at least 3 alphanumeric characters' });
    }

    const cleanReqId = cleanMobileInput(adminId).toLowerCase().replace(/^[@#:]+/, '');
    const admin = adminAccounts.find(a => 
      a.id === adminId || 
      cleanMobileInput(a.username).toLowerCase().replace(/^[@#:]+/, '') === cleanReqId
    );
    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    // Check if another admin already uses this code
    const duplicate = adminAccounts.find(a => a.id !== admin.id && cleanMobileInput(a.referralCode).toUpperCase() === cleanCode);
    if (duplicate) {
      return res.status(400).json({ error: `Referral code "${cleanCode}" is already in use by another administrator` });
    }

    const oldCode = admin.referralCode;
    admin.referralCode = cleanCode;

    // Synchronize referral code on existing linked clients
    users.forEach(u => {
      if (u.referredByAdminId === admin.id || 
         (u.referredByAdminUsername && cleanMobileInput(u.referredByAdminUsername).toLowerCase() === cleanMobileInput(admin.username).toLowerCase()) ||
         (u.referralCodeUsed && cleanMobileInput(u.referralCodeUsed).toUpperCase() === cleanMobileInput(oldCode).toUpperCase())) {
        u.referralCodeUsed = cleanCode;
      }
    });

    saveDatabase();

    return res.json({
      success: true,
      message: `Referral code successfully updated from "${oldCode}" to "${cleanCode}"`,
      referralCode: cleanCode,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.username.includes('@') ? admin.username : `${admin.username}@flowcoin.com`,
        role: admin.role,
        referralCode: admin.referralCode,
        permissions: admin.permissions,
        createdAt: admin.createdAt,
        lastLoginTime: admin.lastLoginTime,
        loginHistory: admin.loginHistory || [],
        activeDevicesCount: (admin.loginHistory || []).length,
        isOwner: isSupremeOwnerAdmin(admin),
        isPermanentMaster: isMasterAdmin321(admin),
        telegramSupportUrl: admin.telegramSupportUrl || '',
        telegramGreetingMessage: admin.telegramGreetingMessage || ''
      }
    });
  });

  // 2. USER PROFILE & BALANCE
  app.get('/api/user/profile/:userId', (req: Request, res: Response) => {
    const userId = req.params.userId;
    let user = users.find(u => u.id === userId);
    
    // Check fallback by email if provided in query
    if (!user && req.query.email && typeof req.query.email === 'string') {
      user = users.find(u => u.email.toLowerCase() === (req.query.email as string).toLowerCase().trim());
    }

    // Auto-rehydrate or create user in memory if session ID is provided
    if (!user && userId) {
      const name = typeof req.query.name === 'string' && req.query.name.trim() ? req.query.name.trim() : 'Trader';
      const email = typeof req.query.email === 'string' && req.query.email.trim() ? req.query.email.trim() : `${userId}@trading.com`;
      const newUser: User = {
        id: userId,
        name,
        email,
        password: 'password123',
        balance: 1000.00,
        freezeBalance: 0.00,
        creditScore: 95,
        status: 'active',
        tradeMode: 'AUTO',
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      user = newUser;
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // 3. MARKET PAIRS & LIVE TICKERS
  app.get('/api/market/tickers', (req: Request, res: Response) => {
    res.json({ success: true, pairs: marketPairs });
  });

  // 4. TRADING SYSTEM
  // Create Option Trade (30s: 20%, 60s: 40%, 120s: 65%, 300s: 85%)
  app.post('/api/trades/create', (req: Request, res: Response) => {
    const { userId, symbol, direction, duration, amount } = req.body;
    if (!userId || !symbol || !direction || !duration || !amount) {
      return res.status(400).json({ error: 'Missing required trade fields' });
    }

    const tradeAmount = Number(amount);
    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      return res.status(400).json({ error: 'Invalid trade amount' });
    }

    let user = users.find(u => u.id === userId);
    if (!user) {
      user = {
        id: userId,
        name: req.body.userName || 'Trader',
        email: req.body.userEmail || `${userId}@trading.com`,
        password: 'password123',
        balance: 1000.00,
        freezeBalance: 0.00,
        creditScore: 95,
        status: 'active',
        tradeMode: 'AUTO',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is restricted from placing trades' });
    }

    if (user.balance < tradeAmount) {
      return res.status(400).json({ error: `Insufficient balance. Available: $${user.balance.toFixed(2)}` });
    }

    const pair = marketPairs.find(p => p.symbol === symbol);
    if (!pair) {
      return res.status(404).json({ error: 'Trading pair not found' });
    }

    // Determine profit percentage by duration (60s gives exactly 20% profit/commission as requested)
    let profitPercentage = 20;
    const dur = Number(duration);
    if (dur <= 60) profitPercentage = 20; // 60s: 20% profit
    else if (dur <= 120) profitPercentage = 40; // 120s: 40% profit
    else if (dur <= 180) profitPercentage = 60; // 180s: 60% profit
    else profitPercentage = 80;

    // Deduct active balance and freeze trade margin
    user.balance = Number((user.balance - tradeAmount).toFixed(2));
    user.freezeBalance = Number((user.freezeBalance + tradeAmount).toFixed(2));

    const now = Date.now();
    const newTrade: Trade = {
      id: 'tr_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      symbol: pair.symbol,
      direction: direction === 'UP' ? 'UP' : 'DOWN',
      duration: dur,
      amount: tradeAmount,
      profitPercentage,
      entryPrice: pair.currentPrice,
      status: 'RUNNING',
      startTime: now,
      expireTime: now + dur * 1000,
      createdAt: new Date().toISOString(),
    };

    trades.unshift(newTrade);
    addNotification(
      user.id,
      '📈 Trade Placed',
      `Order placed: BUY ${newTrade.direction} on ${newTrade.symbol} (${tradeAmount} ${user.currency || 'USD'}).`,
      'TRADE_PLACE'
    );
    saveDatabase();
    return res.status(201).json({
      success: true,
      trade: newTrade,
      user: {
        balance: user.balance,
        freezeBalance: user.freezeBalance,
        creditScore: user.creditScore
      }
    });
  });

  // Get user trade history
  app.get('/api/trades/user/:userId', (req: Request, res: Response) => {
    const userTrades = trades.filter(t => t.userId === req.params.userId);
    res.json({ success: true, trades: userTrades });
  });

  // 5. DEPOSIT & WITHDRAWAL REQUESTS
  app.post('/api/wallet/deposit-request', (req: Request, res: Response) => {
    const { userId, amount, currency, network, txHash, remarks } = req.body;
    let user = users.find(u => u.id === userId);
    if (!user) {
      user = {
        id: userId,
        name: req.body.userName || 'Trader',
        email: req.body.userEmail || `${userId}@trading.com`,
        password: 'password123',
        balance: 1000.00,
        freezeBalance: 0.00,
        creditScore: 95,
        status: 'active',
        tradeMode: 'AUTO',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    }

    const depAmount = Number(amount);
    if (isNaN(depAmount) || depAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    const targetCurrency = currency || user.currency || 'USD';

    const request: WalletRequest = {
      id: 'dep_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      type: 'DEPOSIT',
      amount: depAmount,
      currency: targetCurrency,
      network: network || 'TRC20',
      txHash: txHash || 'Pending Verification',
      remarks: remarks || 'User manual deposit request',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    walletRequests.unshift(request);
    addNotification(
      user.id,
      '📥 Deposit Submitted',
      `Deposit request of ${depAmount} ${targetCurrency} submitted for verification.`,
      'DEPOSIT_PENDING'
    );
    saveDatabase();
    res.status(201).json({ success: true, request });
  });

  app.post('/api/wallet/withdraw-request', (req: Request, res: Response) => {
    const { userId, amount, currency, network, walletAddress, bankDetails, remarks } = req.body;
    let user = users.find(u => u.id === userId);
    if (!user) {
      user = {
        id: userId,
        name: req.body.userName || 'Trader',
        email: req.body.userEmail || `${userId}@trading.com`,
        password: 'password123',
        balance: 1000.00,
        freezeBalance: 0.00,
        creditScore: 95,
        status: 'active',
        tradeMode: 'AUTO',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    }

    const withAmount = Number(amount);
    if (isNaN(withAmount) || withAmount < 100) {
      return res.status(400).json({ error: `Minimum withdrawal limit is 100 ${user.currency || 'USD'}` });
    }

    const targetCurrency = currency || user.currency || 'USD';
    const amountInUserCurrency = convertCurrency(withAmount, targetCurrency, user.currency || 'USD');

    if (user.balance < amountInUserCurrency - 0.0001) {
      return res.status(400).json({ error: 'Insufficient balance to withdraw' });
    }

    // Freeze withdrawal balance while pending admin approval (in user's currency)
    user.balance = Number(Math.max(0, user.balance - amountInUserCurrency).toFixed(2));
    user.freezeBalance = Number((user.freezeBalance + amountInUserCurrency).toFixed(2));

    const request: WalletRequest = {
      id: 'wth_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      type: 'WITHDRAWAL',
      amount: withAmount,
      currency: targetCurrency,
      network: network || bankDetails?.method || 'TRC20',
      walletAddress: walletAddress || bankDetails?.accountNumber || bankDetails?.upiOrPixId || '',
      bankDetails: bankDetails || undefined,
      remarks: remarks || 'Withdrawal request',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    walletRequests.unshift(request);
    addNotification(
      user.id,
      '📤 Withdrawal Submitted',
      `Withdrawal request of ${withAmount} ${targetCurrency} submitted and pending processing.`,
      'WITHDRAW_PENDING'
    );
    saveDatabase();
    res.status(201).json({
      success: true,
      request,
      user: {
        balance: user.balance,
        freezeBalance: user.freezeBalance
      }
    });
  });

  app.get('/api/wallet/requests/:userId', (req: Request, res: Response) => {
    const userReqs = walletRequests.filter(r => r.userId === req.params.userId);
    res.json({ success: true, requests: userReqs });
  });

  // 6. ADMIN CONTROL ROUTES (Backend Control Panel)
  // Helper to resolve admin scope
  const getScopedAdminData = (adminId?: string) => {
    if (!adminId) {
      return { isSubAdmin: false, scopedUsers: users, scopedAdmin: null };
    }
    const admin = adminAccounts.find(a => 
      a.id === adminId || 
      cleanMobileInput(a.username).toLowerCase() === cleanMobileInput(adminId).toLowerCase()
    );
    if (!admin || isSupremeOwnerAdmin(admin) || isMasterAdmin321(admin) || admin.role === 'SUPER_ADMIN') {
      return { isSubAdmin: false, scopedUsers: users, scopedAdmin: admin };
    }
    const scopedUsers = users.filter(u => 
      u.referredByAdminId === admin.id ||
      (u.referralCodeUsed && cleanMobileInput(u.referralCodeUsed).toUpperCase() === cleanMobileInput(admin.referralCode).toUpperCase()) ||
      (u.referredByAdminUsername && cleanMobileInput(u.referredByAdminUsername).toLowerCase() === cleanMobileInput(admin.username).toLowerCase())
    );
    return { isSubAdmin: true, scopedUsers, scopedAdmin: admin };
  };

  // Get all users (scoped if sub-admin, sorted with newly registered users at the top)
  app.get('/api/admin/users', (req: Request, res: Response) => {
    const adminId = req.query.adminId as string | undefined;
    const { scopedUsers } = getScopedAdminData(adminId);

    const sortedUsers = [...scopedUsers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const safeUsers = sortedUsers.map((u) => ({
      ...u,
      username: u.username || u.name,
      password: u.password || '******',
      totalTrades: trades.filter(t => t.userId === u.id).length,
      winTrades: trades.filter(t => t.userId === u.id && t.outcome === 'WIN').length,
    }));
    res.json({ success: true, users: safeUsers });
  });

  // Admin Create Client Account directly
  app.post('/api/admin/users/create', (req: Request, res: Response) => {
    const { username, name, email, password, currency, balance, creditScore, referralCode, adminId } = req.body;
    const cleanUser = cleanMobileInput(username || name);
    const cleanPass = cleanMobileInput(password);
    if (!cleanUser || !cleanPass) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const cleanId = cleanUser.toLowerCase().replace(/^[@#:]+/, '');
    const existing = users.find(u => {
      const uUser = cleanMobileInput(u.username).toLowerCase().replace(/^[@#:]+/, '');
      const uEmail = cleanMobileInput(u.email).toLowerCase();
      return uUser === cleanId || uEmail === cleanId;
    });
    if (existing) {
      return res.status(400).json({ error: 'A user with this username already exists' });
    }

    const callingAdmin = adminAccounts.find(a => a.id === adminId) || adminAccounts[0];
    const validCurrency = (currency && ['USD', 'USDT', 'INR', 'PKR', 'BRL', 'EGP'].includes(currency)) ? currency : 'USD';
    const initialBalance = Number(balance) > 0 ? Number(Number(balance).toFixed(2)) : 0.00;

    const newUser: User = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      name: name ? cleanMobileInput(name) : cleanUser,
      username: cleanUser,
      email: email ? cleanMobileInput(email).toLowerCase() : `${cleanId}@flowcoin.online`,
      password: cleanPass,
      balance: initialBalance,
      freezeBalance: 0.00,
      creditScore: Number(creditScore) > 0 ? Number(creditScore) : 100,
      currency: validCurrency,
      status: 'active',
      tradeMode: 'AUTO',
      referredByAdminId: callingAdmin?.id || 'admin_master',
      referredByAdminUsername: callingAdmin?.username || 'jerry@321',
      referralCodeUsed: referralCode || callingAdmin?.referralCode || 'MASTER321',
      createdAt: new Date().toISOString()
    };

    users.unshift(newUser);
    saveDatabase();
    res.status(201).json({ success: true, user: newUser, message: `Trader account @${newUser.username} created successfully!` });
  });

  // Admin update user password
  app.post('/api/admin/user/:userId/password', (req: Request, res: Response) => {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const cleanPass = cleanMobileInput(newPassword);
    if (!cleanPass) return res.status(400).json({ error: 'Password cannot be empty' });

    user.password = cleanPass;
    saveDatabase();
    res.json({ success: true, message: `Password for @${user.username} updated to "${cleanPass}" successfully!`, password: cleanPass });
  });

  // Admin delete user
  const handleDeleteUser = (req: Request, res: Response) => {
    const { userId } = req.params;
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    users.splice(idx, 1);
    saveDatabase();
    res.json({ success: true, message: 'User deleted successfully' });
  };
  app.post('/api/admin/user/:userId/delete', handleDeleteUser);
  app.delete('/api/admin/user/:userId', handleDeleteUser);

  // Admin Add / Deduct / Set Balance to User Account (In User's Native Currency)
  app.post('/api/admin/user/:userId/balance', (req: Request, res: Response) => {
    const { userId } = req.params;
    const { action, amount, reason, currency } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const rawVal = Number(amount);
    if (isNaN(rawVal) || rawVal <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const userCurrency = (user.currency || 'USD').toUpperCase();

    if (action === 'ADD') {
      user.balance = Number((user.balance + rawVal).toFixed(2));
    } else if (action === 'DEDUCT') {
      user.balance = Number(Math.max(0, user.balance - rawVal).toFixed(2));
    } else if (action === 'SET') {
      user.balance = Number(rawVal.toFixed(2));
    } else {
      return res.status(400).json({ error: 'Invalid action: use ADD, DEDUCT, or SET' });
    }

    saveDatabase();
    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      user: safeUser,
      message: `Balance updated successfully (${action} ${rawVal} ${userCurrency})`
    });
  });

  // User change account currency (converts active balance & freeze balance dynamically)
  app.post('/api/user/change-currency', (req: Request, res: Response) => {
    const { userId, currency } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newCode = (currency || 'USD').toUpperCase();
    if (!CURRENCY_RATES[newCode]) {
      return res.status(400).json({ error: 'Invalid currency code' });
    }

    const oldCode = (user.currency || 'USD').toUpperCase();
    if (oldCode !== newCode) {
      user.balance = convertCurrency(user.balance, oldCode, newCode);
      user.freezeBalance = convertCurrency(user.freezeBalance, oldCode, newCode);
      user.currency = newCode;
      saveDatabase();
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser, message: `Account currency updated to ${newCode}` });
  });

  // Admin update Credit Score
  app.post('/api/admin/user/:userId/credit-score', (req: Request, res: Response) => {
    const { userId } = req.params;
    const { creditScore } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const score = Number(creditScore);
    if (isNaN(score) || score < 0 || score > 100) {
      return res.status(400).json({ error: 'Credit score must be between 0 and 100' });
    }

    user.creditScore = score;
    saveDatabase();
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Admin update Freeze Balance directly
  app.post('/api/admin/user/:userId/freeze-balance', (req: Request, res: Response) => {
    const { userId } = req.params;
    const { amount, action } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const val = Number(amount);
    if (isNaN(val) || val < 0) return res.status(400).json({ error: 'Invalid amount' });

    if (action === 'SET') {
      user.freezeBalance = Number(val.toFixed(2));
    } else if (action === 'UNFREEZE_ALL') {
      user.balance = Number((user.balance + user.freezeBalance).toFixed(2));
      user.freezeBalance = 0;
    }

    saveDatabase();
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Admin trade mode control (AUTO / FORCE_WIN / FORCE_LOSS)
  app.post('/api/admin/user/:userId/trade-mode', (req: Request, res: Response) => {
    const { userId } = req.params;
    const { tradeMode } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!['AUTO', 'FORCE_WIN', 'FORCE_LOSS'].includes(tradeMode)) {
      return res.status(400).json({ error: 'Invalid trade mode' });
    }

    user.tradeMode = tradeMode;
    saveDatabase();
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Admin user status toggle (active / suspended / frozen) with freezeReason
  app.post('/api/admin/user/:userId/status', (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status, reason, freezeReason } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!['active', 'suspended', 'frozen'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    user.status = status;
    user.freezeReason = typeof (reason || freezeReason) === 'string' ? (reason || freezeReason).trim() : (status === 'frozen' ? 'Audit verification required' : '');
    saveDatabase();
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Admin view trades (scoped if sub-admin)
  app.get('/api/admin/trades', (req: Request, res: Response) => {
    const adminId = req.query.adminId as string | undefined;
    const { isSubAdmin, scopedUsers } = getScopedAdminData(adminId);

    if (isSubAdmin) {
      const userIds = new Set(scopedUsers.map(u => u.id));
      const scopedTrades = trades.filter(t => userIds.has(t.userId));
      return res.json({ success: true, trades: scopedTrades });
    }

    res.json({ success: true, trades });
  });

  // Admin directly adjust any trade (force win/plus, force loss/minus, change payout, settle price, or profit %)
  app.post('/api/admin/trade/:tradeId/adjust', (req: Request, res: Response) => {
    const { tradeId } = req.params;
    const { outcome, payout, settlePrice, profitPercentage, status } = req.body;
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    const user = users.find(u => u.id === trade.userId);
    const oldOutcome = trade.outcome;
    const oldPayout = trade.payout || 0;
    const oldStatus = trade.status;

    if (outcome && ['WIN', 'LOSS'].includes(outcome)) {
      trade.outcome = outcome;
      if (outcome === 'WIN') {
        const pct = profitPercentage !== undefined ? Number(profitPercentage) : trade.profitPercentage;
        trade.profitPercentage = pct;
        const profit = (trade.amount * pct) / 100;
        trade.payout = payout !== undefined ? Number(payout) : Number((trade.amount + profit).toFixed(2));
      } else {
        trade.payout = 0;
      }
    }

    if (settlePrice !== undefined && !isNaN(Number(settlePrice))) {
      trade.settlePrice = Number(settlePrice);
    }

    if (status && ['RUNNING', 'SETTLED'].includes(status)) {
      trade.status = status;
    }

    // If trade was running and is now settled by admin
    if (oldStatus === 'RUNNING' && trade.status === 'SETTLED') {
      if (user) {
        user.freezeBalance = Math.max(0, Number((user.freezeBalance - trade.amount).toFixed(2)));
        if (trade.outcome === 'WIN') {
          user.balance = Number((user.balance + (trade.payout || 0)).toFixed(2));
        }
      }
    } else if (oldStatus === 'SETTLED' && trade.status === 'SETTLED') {
      // Re-adjust balance difference if outcome or payout was altered
      if (user) {
        const netDiff = (trade.payout || 0) - oldPayout;
        user.balance = Math.max(0, Number((user.balance + netDiff).toFixed(2)));
      }
    }

    saveDatabase();
    res.json({ success: true, trade, user: user ? { balance: user.balance, freezeBalance: user.freezeBalance } : undefined });
  });

  // Admin instantly settle a running trade (Plus/WIN or Minus/LOSS)
  app.post('/api/admin/trade/:tradeId/settle-now', (req: Request, res: Response) => {
    const { tradeId } = req.params;
    const { forceOutcome } = req.body; // 'WIN' or 'LOSS'
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    const user = users.find(u => u.id === trade.userId);
    const pair = marketPairs.find(p => p.symbol === trade.symbol);

    trade.status = 'SETTLED';
    const isWin = forceOutcome === 'WIN';
    trade.outcome = isWin ? 'WIN' : 'LOSS';

    if (isWin) {
      trade.settlePrice = trade.direction === 'UP' 
        ? Number((trade.entryPrice * 1.003).toFixed(pair?.precision || 2))
        : Number((trade.entryPrice * 0.997).toFixed(pair?.precision || 2));
      const profit = (trade.amount * trade.profitPercentage) / 100;
      trade.payout = Number((trade.amount + profit).toFixed(2));

      if (user) {
        user.freezeBalance = Math.max(0, Number((user.freezeBalance - trade.amount).toFixed(2)));
        user.balance = Number((user.balance + trade.payout).toFixed(2));
      }
    } else {
      trade.settlePrice = trade.direction === 'UP'
        ? Number((trade.entryPrice * 0.997).toFixed(pair?.precision || 2))
        : Number((trade.entryPrice * 1.003).toFixed(pair?.precision || 2));
      trade.payout = 0;

      if (user) {
        user.freezeBalance = Math.max(0, Number((user.freezeBalance - trade.amount).toFixed(2)));
      }
    }

    saveDatabase();
    res.json({ success: true, trade, user: user ? { balance: user.balance, freezeBalance: user.freezeBalance } : undefined });
  });

  // Admin view wallet requests (scoped if sub-admin)
  app.get('/api/admin/wallet-requests', (req: Request, res: Response) => {
    const adminId = req.query.adminId as string | undefined;
    const { isSubAdmin, scopedUsers } = getScopedAdminData(adminId);

    if (isSubAdmin) {
      const userIds = new Set(scopedUsers.map(u => u.id));
      const scopedReqs = walletRequests.filter(r => userIds.has(r.userId));
      return res.json({ success: true, requests: scopedReqs });
    }

    res.json({ success: true, requests: walletRequests });
  });

  // Admin action on withdrawal request (APPROVE or REJECT)
  app.post('/api/admin/wallet-requests/:requestId/action', (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { action, remarks } = req.body;
    const request = walletRequests.find(r => r.id === requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request is already processed' });
    }

    const user = users.find(u => u.id === request.userId);

    if (request.type === 'WITHDRAWAL') {
      const amountVal = Number(request.amount);
      const reqCurr = request.currency || user?.currency || 'USD';
      const userCurr = user?.currency || 'USD';
      const valInUserCurr = convertCurrency(amountVal, reqCurr, userCurr);

      if (action === 'APPROVE') {
        request.status = 'APPROVED';
        request.remarks = remarks || 'Approved by Admin';
        request.updatedAt = new Date().toISOString();
        if (user) {
          // Release frozen funds (already deducted from main balance)
          user.freezeBalance = Math.max(0, Number((user.freezeBalance - valInUserCurr).toFixed(2)));
          addNotification(
            user.id,
            '✅ Withdrawal Approved!',
            `Your withdrawal request of ${request.amount} ${request.currency} has been approved and processed successfully.`,
            'WITHDRAW_APPROVED'
          );
        }
      } else if (action === 'REJECT') {
        request.status = 'REJECTED';
        request.remarks = remarks || 'Rejected by Admin';
        request.updatedAt = new Date().toISOString();
        if (user) {
          // Refund frozen funds back to user's active balance
          user.freezeBalance = Math.max(0, Number((user.freezeBalance - valInUserCurr).toFixed(2)));
          user.balance = Number((user.balance + valInUserCurr).toFixed(2));
          addNotification(
            user.id,
            '❌ Withdrawal Rejected',
            `Your withdrawal request of ${request.amount} ${request.currency} was rejected. Funds refunded to balance. Remarks: ${request.remarks}`,
            'WITHDRAW_REJECTED'
          );
        }
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }
    } else if (request.type === 'DEPOSIT') {
      const amountVal = Number(request.amount);
      const reqCurr = request.currency || user?.currency || 'USD';
      const userCurr = user?.currency || 'USD';
      const valInUserCurr = convertCurrency(amountVal, reqCurr, userCurr);

      if (action === 'APPROVE') {
        request.status = 'APPROVED';
        request.remarks = remarks || 'Deposit confirmed and credited';
        request.updatedAt = new Date().toISOString();
        if (user) {
          // Credit amount to user's balance
          user.balance = Number((user.balance + valInUserCurr).toFixed(2));
          addNotification(
            user.id,
            '✅ Deposit Approved!',
            `Your deposit request of ${request.amount} ${request.currency} has been approved and credited to your balance.`,
            'DEPOSIT_APPROVED'
          );
        }
      } else if (action === 'REJECT') {
        request.status = 'REJECTED';
        request.remarks = remarks || 'Deposit rejected';
        request.updatedAt = new Date().toISOString();
        if (user) {
          addNotification(
            user.id,
            '❌ Deposit Rejected',
            `Your deposit request of ${request.amount} ${request.currency} was rejected. Remarks: ${request.remarks}`,
            'DEPOSIT_REJECTED'
          );
        }
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }
    }

    saveDatabase();
    res.json({ success: true, request });
  });

  // Admin Overview Statistics (scoped if sub-admin)
  app.get('/api/admin/stats', (req: Request, res: Response) => {
    const adminId = req.query.adminId as string | undefined;
    const { isSubAdmin, scopedUsers } = getScopedAdminData(adminId);

    const relevantUsers = scopedUsers;
    const relevantUserIds = new Set(relevantUsers.map(u => u.id));
    const relevantTrades = isSubAdmin ? trades.filter(t => relevantUserIds.has(t.userId)) : trades;
    const relevantRequests = isSubAdmin ? walletRequests.filter(r => relevantUserIds.has(r.userId)) : walletRequests;

    const totalUsers = relevantUsers.length;
    const totalActiveBalance = relevantUsers.reduce((acc, u) => acc + u.balance, 0);
    const totalFrozenBalance = relevantUsers.reduce((acc, u) => acc + u.freezeBalance, 0);
    const totalTrades = relevantTrades.length;
    const activeTrades = relevantTrades.filter(t => t.status === 'RUNNING').length;
    const pendingWithdrawals = relevantRequests.filter(r => r.type === 'WITHDRAWAL' && r.status === 'PENDING').length;
    const pendingWithdrawalAmount = relevantRequests
      .filter(r => r.type === 'WITHDRAWAL' && r.status === 'PENDING')
      .reduce((acc, r) => acc + r.amount, 0);
    const pendingDeposits = relevantRequests.filter(r => r.type === 'DEPOSIT' && r.status === 'PENDING').length;

    res.json({
      success: true,
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
    });
  });

  // Vite middleware for development vs static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Crypto Trading & Admin Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
