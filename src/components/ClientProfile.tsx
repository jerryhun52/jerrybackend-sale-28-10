import React, { useState, useEffect } from 'react';
import { User, WalletRequest, Trade, CurrencyCode, CURRENCIES, SupportNotice } from '../types';
import { formatMoney } from '../utils/formatters';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  ArrowUpRight, 
  LogOut, 
  Clock, 
  KeyRound, 
  ChevronRight, 
  Bell, 
  Mail, 
  Wallet, 
  FileSpreadsheet, 
  FileText,
  AlertCircle,
  X,
  Info,
  Send
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { TermsPolicyModal } from './TermsPolicyModal';

interface ClientProfileProps {
  user: User;
  walletRequests: WalletRequest[];
  userTrades: Trade[];
  currency: CurrencyCode;
  onOpenCurrencyModal: () => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw: () => void;
  onViewTradeOrders: () => void;
  onGoToTrade?: () => void;
  onLogout: () => void;
  onOpenAdminLogin?: () => void;
  onUserUpdated?: (updatedUser: User) => void;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({
  user,
  walletRequests,
  userTrades,
  currency,
  onOpenCurrencyModal,
  onOpenWithdraw,
  onViewTradeOrders,
  onGoToTrade,
  onLogout,
  onOpenAdminLogin,
  onUserUpdated,
}) => {
  const currConfig = CURRENCIES[currency] || CURRENCIES.USD;
  const withdrawRequests = walletRequests.filter(r => r.type === 'WITHDRAWAL' || (r.type as any) === 'WITHDRAW');
  
  // Pending & Rejected withdrawal count for notification badges
  const pendingWithdrawCount = withdrawRequests.filter(r => r.status === 'PENDING').length;
  const rejectedWithdrawCount = withdrawRequests.filter(r => r.status === 'REJECTED').length;

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyInitialTab, setPolicyInitialTab] = useState<'terms' | 'policy'>('terms');
  const [showWithdrawHistoryModal, setShowWithdrawHistoryModal] = useState(false);
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);
  
  // Selected rejection reason modal state
  const [selectedRejectReason, setSelectedRejectReason] = useState<{ amount: number; reason: string; date: string } | null>(null);

  // Live Support Team Notice from Admin (scoped to this user's referring admin)
  const [supportNotice, setSupportNotice] = useState<SupportNotice | null>(null);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await api.getSupportNotice(user.id);
        if (res?.notice) {
          setSupportNotice(res.notice);
        }
      } catch (err) {
        // silent fail
      }
    };
    fetchNotice();
    const interval = setInterval(fetchNotice, 4000);
    return () => clearInterval(interval);
  }, [user.id]);

  const getTelegramSupportHref = () => {
    let raw = (supportNotice?.telegramSupportUrl || '').trim();
    if (!raw) {
      raw = 'https://t.me/flowcoin_support';
    }
    let url = raw;
    if (url.startsWith('@')) {
      url = `https://t.me/${url.substring(1)}`;
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://t.me/${url}`;
    }

    if (supportNotice?.telegramGreetingMessage) {
      const customMsg = supportNotice.telegramGreetingMessage
        .replace('{username}', user.username || user.name || 'Trader')
        .replace('{name}', user.name || user.username || 'Trader')
        .replace('{id}', user.id || '');
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}text=${encodeURIComponent(customMsg)}`;
    }
    return url;
  };

  const formatAssetVal = (amt: number) => {
    return formatMoney(amt, currency);
  };

  const tickerItems = [
    { icon: '🚀', symbol: 'BTC', price: '$107,250', change: '+2.4%' },
    { icon: '💎', symbol: 'ETH', price: '$6,850', change: '+1.8%' },
    { icon: '🟢', symbol: 'BNB', price: '$1,245', change: '+3.1%' },
    { icon: '🔥', symbol: 'SOL', price: '$385', change: '+4.7%' },
    { icon: '⚡', symbol: 'XRP', price: '$4.12', change: '+2.2%' },
  ];

  const isDeactivated = user.status === 'frozen' || user.status === 'suspended';

  return (
    <div className="space-y-4 pb-28 max-w-lg mx-auto animate-fade-in font-sans">
      
      {/* 1. TOP PROFILE & ASSET CARD */}
      <div className={`text-white rounded-3xl p-6 shadow-lg relative overflow-hidden transition ${
        isDeactivated 
          ? 'bg-gradient-to-br from-rose-950 via-rose-900 to-[#1e40af] border-2 border-rose-500 shadow-rose-900/40' 
          : 'bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6]'
      }`}>
        
        {/* Ambient background glow */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          
          {/* Deactivated Warning Banner */}
          {isDeactivated && (
            <div className="p-3.5 bg-rose-500/25 border border-rose-400/50 rounded-2xl text-rose-200 text-xs font-extrabold space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
                  <span>ACCOUNT FROZEN / DEACTIVATED</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBlockReasonModal(true)}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white text-[10px] font-extrabold rounded-xl shadow-xs transition cursor-pointer"
                >
                  View Block Reason
                </button>
              </div>
              <p className="text-[11px] text-rose-200/90 font-normal">
                Reason: "{user.freezeReason || 'Security audit verification required by administration.'}"
              </p>
            </div>
          )}

          {/* Top Row: User registered Name + UID + Currency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-400 via-amber-300 to-rose-400 p-[2px] shadow-md">
                <div className="w-full h-full bg-[#0f172a] rounded-[14px] flex items-center justify-center text-cyan-200 font-black text-xl">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-white text-lg sm:text-xl leading-tight tracking-tight">
                    {user.name || user.username || 'Trader'}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck className="w-3 h-3 mr-0.5 text-emerald-300" />
                    Verified Trader
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-blue-100/90 font-mono mt-0.5">
                  <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/20">
                    Username: <strong className="text-white font-bold">{user.username || user.name || (user.id ? user.id.slice(0, 8) : 'trader')}</strong>
                  </span>
                  <span>•</span>
                  <span className="truncate max-w-[140px] sm:max-w-none">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Currency Pill */}
            <button
              onClick={onOpenCurrencyModal}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition text-white text-xs font-bold backdrop-blur-xs shadow-xs cursor-pointer"
            >
              <span>{currConfig.flag}</span>
              <span className="font-mono">{currency}</span>
            </button>
          </div>

          {/* Balance Breakdown */}
          <div className="pt-3 border-t border-white/15 space-y-3">
            
            {/* 1. Available Balance */}
            <div>
              <div className="text-xs text-blue-100 font-medium">Available Balance</div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono mt-0.5">
                {formatAssetVal(user.balance)}
              </div>
            </div>

            {/* 2. Freeze Amount (Frozen Margin in BOLD & WHITE) */}
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white font-semibold">Freeze Amount (In-Trade):</span>
              </div>
              <span className="font-black text-white text-sm sm:text-base">
                {formatAssetVal(user.freezeBalance)}
              </span>
            </div>

            {/* 3. Account Status & Credit Score */}
            <div className="flex items-center justify-between text-xs text-blue-100/90 pt-1">
              <span>Credit Score: <strong className="text-white font-mono">{user.creditScore || 100}</strong></span>
              <span>Account Status: <strong className={isDeactivated ? "text-rose-400 font-extrabold uppercase" : "text-emerald-300 font-bold"}>{isDeactivated ? 'DEACTIVATED / FROZEN' : 'Active'}</strong></span>
            </div>

          </div>

        </div>
      </div>

      {/* 2. REAL-TIME TICKER MARQUEE BAR */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl py-2 px-3 shadow-xs">
        <div className="flex items-center">
          <div className="animate-marquee space-x-6 text-xs font-mono font-bold whitespace-nowrap text-slate-800">
            {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
              <div key={idx} className="inline-flex items-center space-x-2">
                <span>{item.icon}</span>
                <span className="text-slate-900 font-black">{item.symbol}</span>
                <span className="text-blue-600 font-bold">{item.price}</span>
                <span className="text-emerald-600 font-bold">▲{item.change}</span>
                <span className="text-slate-300">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. OPTION 1: WITHDRAW */}
      <button
        onClick={onOpenWithdraw}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl transition shadow-xs group text-left cursor-pointer"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-sm">Withdraw</div>
            <div className="text-xs text-slate-500">Withdraw funds to your local bank or wallet</div>
          </div>
        </div>

        <div className="p-2 rounded-xl text-slate-400 group-hover:text-slate-700 transition">
          <ChevronRight className="w-5 h-5" />
        </div>
      </button>

      {/* 4. OPTION 2: WITHDRAWAL RECORDS & REQUESTS (With Active Notification Badge Counter) */}
      <button
        onClick={() => setShowWithdrawHistoryModal(true)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl transition shadow-xs group text-left cursor-pointer relative"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition relative">
            <FileSpreadsheet className="w-5 h-5" />
            {pendingWithdrawCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-black shadow-xs animate-bounce">
                {pendingWithdrawCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 text-sm">Withdrawal Request Records</span>
              {pendingWithdrawCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                  {pendingWithdrawCount} Request Pending
                </span>
              )}
              {rejectedWithdrawCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                  Notice
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">View status & audit history of your withdrawals</div>
          </div>
        </div>

        <div className="p-2 rounded-xl text-slate-400 group-hover:text-slate-700 transition">
          <ChevronRight className="w-5 h-5" />
        </div>
      </button>

      {/* 5. SUPPORT TEAM NOTICE BANNER (Real-time Message from Admin) */}
      <div className="bg-[#2563eb] text-white rounded-3xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-300 fill-amber-300" />
            <h3 className="font-extrabold text-white text-sm">Support Team Notice</h3>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-900/60 text-blue-100 uppercase tracking-wider border border-blue-400/30">
            OFFICIAL
          </span>
        </div>

        {/* Dynamic Support Message Box */}
        <div className="bg-white rounded-2xl p-5 text-slate-700 space-y-2 shadow-xs">
          {supportNotice && supportNotice.isActive && supportNotice.message ? (
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="font-extrabold text-slate-900 text-xs">
                  {supportNotice.title || 'Support Team Notice'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(supportNotice.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">
                {supportNotice.message}
              </p>
            </div>
          ) : (
            <div className="text-center py-2 space-y-1">
              <div className="w-9 h-9 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <div className="font-bold text-slate-800 text-xs">No new messages</div>
              <div className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Important notices from the Support Team will appear here.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. USER SETTINGS & CHANGE PASSWORD */}
      <button
        onClick={() => setIsPasswordModalOpen(true)}
        className="w-full flex items-center justify-center space-x-2 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl border border-slate-200 transition text-xs shadow-xs cursor-pointer"
      >
        <KeyRound className="w-4 h-4 text-blue-600" />
        <span>Change Account Password</span>
      </button>

      {/* 7. TERMS & PRIVACY POLICY */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => {
            setPolicyInitialTab('terms');
            setIsPolicyModalOpen(true);
          }}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Terms & Conditions</span>
        </button>

        <button
          onClick={() => {
            setPolicyInitialTab('policy');
            setIsPolicyModalOpen(true);
          }}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Privacy Policy</span>
        </button>
      </div>

      {/* 8. LOGOUT BUTTON */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center space-x-2 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl border border-rose-200 transition text-xs shadow-xs cursor-pointer"
      >
        <LogOut className="w-4 h-4 text-rose-600" />
        <span>Logout Account</span>
      </button>

      {/* 8b. REGISTERED REFERRAL CODE DISPLAY BADGE */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1 text-xs">
        <div className="text-slate-500 font-medium text-[11px]">
          Account Registration Invitation:
        </div>
        <div className="font-mono font-bold text-slate-800 flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-slate-600">You registered using code:</span>
          <span className="px-2 py-0.5 bg-blue-100 text-[#2f66ee] border border-blue-200 rounded-md font-extrabold uppercase">
            {user.referralCodeUsed || 'MASTER321'}
          </span>
        </div>
      </div>

      {/* 9. TELEGRAM CUSTOMER SUPPORT LINK */}
      <div className="pt-2">
        <a
          href={getTelegramSupportHref()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#229ED9]/10 to-transparent hover:from-[#229ED9]/20 hover:to-[#229ED9]/5 border border-[#229ED9]/30 hover:border-[#229ED9]/60 rounded-3xl transition shadow-xs group cursor-pointer text-center space-y-2"
        >
          <div className="w-12 h-12 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-lg shadow-[#229ED9]/30 group-hover:scale-110 transition">
            <Send className="w-6 h-6 ml-0.5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-sm flex items-center justify-center space-x-1.5">
              <span>Customer Support</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Click here to contact official 24/7 Telegram support
            </div>
          </div>
        </a>
      </div>

      {/* 10. NICKNAME "[ Status Log ]" BUTTON FOR OWNER TO ACCESS ADMIN */}
      <div className="pt-2 pb-2 text-center">
        <button
          onClick={() => {
            if (onOpenAdminLogin) onOpenAdminLogin();
          }}
          className="text-[11px] text-slate-400 hover:text-blue-600 font-mono tracking-tight px-3 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200"
        >
          [ Status Log ]
        </button>
      </div>

      {/* Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        user={user}
        onPasswordChanged={(upUser) => {
          if (onUserUpdated) onUserUpdated(upUser);
        }}
      />

      {/* Policy & Terms Modal */}
      <TermsPolicyModal
        isOpen={isPolicyModalOpen}
        initialTab={policyInitialTab}
        onClose={() => setIsPolicyModalOpen(false)}
      />

      {/* Withdraw Request History Modal */}
      {showWithdrawHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto relative animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  My Withdrawal Requests
                </h3>
                <p className="text-xs text-slate-500">
                  Total {withdrawRequests.length} withdrawal record(s)
                </p>
              </div>
              <button
                onClick={() => setShowWithdrawHistoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No withdrawal records found.
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawRequests.map((req) => {
                  const isRejected = req.status === 'REJECTED';
                  const isApproved = req.status === 'APPROVED';
                  const isPending = req.status === 'PENDING';

                  return (
                    <div
                      key={req.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                        isRejected
                          ? 'bg-rose-50/50 border-rose-200'
                          : isApproved
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 font-mono text-sm">
                          {formatMoney(req.amount, req.currency || currency)}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPending ? 'UNDER REVIEW' : req.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono">
                        {req.network || 'Bank Transfer'} • {new Date(req.createdAt).toLocaleString()}
                      </div>

                      {/* If rejected, show View Reason button */}
                      {isRejected && (
                        <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-rose-700 flex items-center space-x-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Withdrawal Rejected</span>
                          </span>
                          <button
                            onClick={() => {
                              setSelectedRejectReason({
                                amount: req.amount,
                                reason: req.remarks || 'Account verification or audit requirements needed. Please contact support.',
                                date: req.updatedAt ? new Date(req.updatedAt).toLocaleString() : new Date(req.createdAt).toLocaleString(),
                              });
                            }}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition cursor-pointer"
                          >
                            View Reason
                          </button>
                        </div>
                      )}

                      {/* If approved note */}
                      {isApproved && req.remarks && (
                        <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                          <strong>Admin Note: </strong>{req.remarks}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reason Detail Modal for Rejection */}
      {selectedRejectReason && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Withdrawal Rejection Reason
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  Amount: {formatMoney(selectedRejectReason.amount, currency)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs space-y-2 text-rose-950">
              <div className="font-bold text-rose-800">Reason Stated by Admin:</div>
              <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-medium">
                "{selectedRejectReason.reason}"
              </p>
              <div className="text-[10px] text-slate-400 font-mono pt-1">
                Audited: {selectedRejectReason.date}
              </div>
            </div>

            <button
              onClick={() => setSelectedRejectReason(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Account Block Reason Modal */}
      {showBlockReasonModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-rose-200 space-y-4 animate-scale-up">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">
                  Account Freeze / Block Reason
                </h4>
                <p className="text-xs text-rose-600 font-extrabold">
                  Status: DEACTIVATED
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-2 text-rose-950">
              <div className="font-extrabold text-rose-900">Reason Stated by Administration:</div>
              <p className="text-xs leading-relaxed text-slate-800 font-medium whitespace-pre-wrap">
                "{user.freezeReason || 'Security audit verification required by administration.'}"
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={getTelegramSupportHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Contact Support on Telegram</span>
              </a>

              <button
                onClick={() => setShowBlockReasonModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
