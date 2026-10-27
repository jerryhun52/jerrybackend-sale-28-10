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
  type: 'TRADE_PLACE' | 'TRADE_WIN' | 'TRADE_LOSS' | 'DEPOSIT_PENDING' | 'DEPOSIT_APPROVED' | 'DEPOSIT_REJECTED' | 'WITHDRAW_PENDING' | 'WITHDRAW_APPROVED' | 'WITHDRAW_REJECTED' | 'SYSTEM';
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
  currency?: CurrencyCode;
  createdAt: string;
  totalTrades?: number;
  winTrades?: number;
  referredByAdminId?: string;
  referredByAdminUsername?: string;
  referralCodeUsed?: string;
  notifications?: UserNotification[];
}

export interface AdminLoginSession {
  id: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  device: string;
  location?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  referralCode: string;
  permissions: AdminPermissions;
  createdAt?: string;
  lastLoginTime?: string;
  activeDevicesCount?: number;
  loginHistory?: AdminLoginSession[];
  referredClientsCount?: number;
  totalReferredBalance?: number;
  referredClients?: Array<{
    id: string;
    name: string;
    email: string;
    balance: number;
    creditScore: number;
    status: string;
    createdAt: string;
  }>;
  passwordPreview?: string;
  isOwner?: boolean;
  isPermanentMaster?: boolean;
  telegramSupportUrl?: string;
  telegramGreetingMessage?: string;
}

export interface Trade {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  symbol: string;
  direction: 'UP' | 'DOWN';
  duration: number; // in seconds (30, 60, etc.)
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

export interface BankDetails {
  method: string;
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

export interface AdminStats {
  totalUsers: number;
  totalActiveBalance: number;
  totalFrozenBalance: number;
  totalTrades: number;
  activeTrades: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
  pendingDeposits: number;
}

export interface SupportNotice {
  id: string;
  title: string;
  message: string;
  updatedAt: string;
  isActive: boolean;
  telegramSupportUrl?: string;
  telegramGreetingMessage?: string;
  assignedAdminName?: string;
}

export type CurrencyCode = 'USD' | 'INR' | 'PKR' | 'BRL' | 'EGP' | 'USDT';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  rate: number; // multiplier against USD
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, flag: '🇺🇸' },
  USDT: { code: 'USDT', name: 'Tether (USDT)', symbol: '$', rate: 1.0, flag: '🟢' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 87.2, flag: '🇮🇳' },
  PKR: { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', rate: 278.5, flag: '🇵🇰' },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 5.8, flag: '🇧🇷' },
  EGP: { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', rate: 50.5, flag: '🇪🇬' },
};

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
