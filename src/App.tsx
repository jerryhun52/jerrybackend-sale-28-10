import React, { useState, useEffect, useCallback } from 'react';
import { User, AdminUser, CryptoPair, Trade, WalletRequest, CurrencyCode, CURRENCIES } from './types';
import { api } from './services/api';
import { formatMoney } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { BottomNav, ClientTab } from './components/BottomNav';
import { ClientHome } from './components/ClientHome';
import { MarketListView } from './components/MarketListView';
import { TradeDesk } from './components/TradeDesk';
import { ClientProfile } from './components/ClientProfile';
import { TradeOrdersView } from './components/TradeOrdersView';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { WalletModal } from './components/WalletModal';
import { CurrencyModal } from './components/CurrencyModal';
import { NotificationsModal, AppNotification } from './components/NotificationsModal';
import { DEFAULT_PAIRS } from './constants/initialPairs';
import { 
  Sparkles, 
  Lock, 
  ShieldCheck, 
  TrendingUp, 
  Globe 
} from 'lucide-react';

export default function App() {
  const isLoggingOutRef = React.useRef(false);

  // Session states
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('crypto_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('crypto_admin');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  // Client Currency State: USD, INR, PKR, BRL, EGP
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const savedUserStr = localStorage.getItem('crypto_user');
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u.currency && (CURRENCIES as any)[u.currency]) {
          return u.currency;
        }
      } catch (e) {}
    }
    const saved = localStorage.getItem('app_currency') as CurrencyCode;
    if (saved && (CURRENCIES as any)[saved]) {
      return saved;
    }
    return 'USD';
  });

  // Navigation state (home, market, trade, profile, orders, admin)
  const [activeTab, setActiveTab] = useState<'home' | 'market' | 'trade' | 'profile' | 'orders' | 'admin'>(() => {
    const savedAdmin = localStorage.getItem('crypto_admin');
    const savedTab = localStorage.getItem('app_active_tab');
    if (savedAdmin) {
      if (savedTab && ['home', 'market', 'trade', 'profile', 'orders', 'admin'].includes(savedTab)) {
        return savedTab as any;
      }
      return 'admin';
    }
    if (savedTab && ['home', 'market', 'trade', 'profile', 'orders'].includes(savedTab)) {
      return savedTab as any;
    }
    return 'home';
  });

  // Sync activeTab persistence
  const changeActiveTab = (tab: 'home' | 'market' | 'trade' | 'profile' | 'orders' | 'admin') => {
    setActiveTab(tab);
    localStorage.setItem('app_active_tab', tab);
  };
  const [selectedTradeSymbol, setSelectedTradeSymbol] = useState<string>('BTC/USDT');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletModalType, setWalletModalType] = useState<'deposit' | 'withdraw'>('deposit');
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  // In-app Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const savedUserStr = localStorage.getItem('crypto_user');
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        const savedNotifs = localStorage.getItem(`app_notifications_${u.id}`);
        if (savedNotifs) return JSON.parse(savedNotifs);
      } catch (e) {}
    }
    return [];
  });

  const addNotification = useCallback((
    title: string,
    message: string,
    type: AppNotification['type'] = 'system',
    status: AppNotification['status'] = 'info'
  ) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      status,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      if (currentUser?.id) {
        localStorage.setItem(`app_notifications_${currentUser.id}`, JSON.stringify(updated));
      }
      return updated;
    });

    // Try browser push notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: message, icon: '/favicon.ico' });
      } catch (e) {}
    }
  }, [currentUser?.id]);

  // Real-time market & user data
  const [pairs, setPairs] = useState<CryptoPair[]>(DEFAULT_PAIRS);
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);

  // Update currency and persist with real exchange rate conversion
  const handleSelectCurrency = async (newCurr: CurrencyCode) => {
    setCurrency(newCurr);
    localStorage.setItem('app_currency', newCurr);

    if (currentUser) {
      try {
        const res = await api.changeUserCurrency(currentUser.id, newCurr);
        if (res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('crypto_user', JSON.stringify(res.user));
        }
      } catch (err) {
        console.error('Failed to update currency on server:', err);
      }
    }
  };

  // Sync user & market tickers from backend
  const refreshMarketAndUser = useCallback(async () => {
    try {
      const pRes = await api.getMarketTickers();
      setPairs(pRes.pairs);

      if (currentUser) {
        try {
          const [uRes, tRes, wRes] = await Promise.all([
            api.getUserProfile(currentUser.id, { name: currentUser.name, email: currentUser.email }),
            api.getUserTrades(currentUser.id),
            api.getUserWalletRequests(currentUser.id),
          ]);
          if (currentUser) {
            const oldBal = currentUser.balance;
            const oldFreeze = currentUser.freezeBalance;
            const oldStatus = currentUser.status;
            const clientCurr = uRes.user.currency || currency || 'USD';

            // Detect admin balance modification
            if (oldBal !== undefined && Math.abs(uRes.user.balance - oldBal) > 0.001) {
              const diff = uRes.user.balance - oldBal;
              const formattedDiff = formatMoney(Math.abs(diff), clientCurr);
              if (diff > 0) {
                addNotification(
                  "📥 Deposit Credit",
                  `You have deposited ${formattedDiff} to your account balance.`,
                  "system",
                  "success"
                );
              } else {
                addNotification(
                  "💳 Balance Deduction",
                  `An amount of ${formattedDiff} was deducted from your account balance.`,
                  "system",
                  "info"
                );
              }
            }

            // Detect account status / freeze deactivation
            if (oldStatus && oldStatus !== uRes.user.status) {
              if (uRes.user.status === 'frozen' || uRes.user.status === 'suspended') {
                addNotification(
                  "⚠️ Account Frozen / Deactivated",
                  "Your account has been deactivated by administration. Please contact Customer Support Desk.",
                  "system",
                  "error"
                );
              } else if (uRes.user.status === 'active') {
                addNotification(
                  "✅ Account Reactivated",
                  "Your trading account has been reactivated. You can now place trades and request withdrawals.",
                  "system",
                  "success"
                );
              }
            }
          }

          setCurrentUser(uRes.user);
          if (uRes.user.currency && uRes.user.currency !== currency) {
            setCurrency(uRes.user.currency);
          }

          // Detect Wallet Request status changes (Withdrawal/Deposit Approval & Rejection)
          const clientCurr = currentUser.currency || currency || 'USD';
          wRes.requests.forEach(newReq => {
            const oldReq = walletRequests.find(r => r.id === newReq.id);
            if (oldReq && oldReq.status === 'PENDING' && newReq.status !== 'PENDING') {
              const reqType = newReq.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal';
              const isApproved = newReq.status === 'APPROVED';
              const formattedReqVal = formatMoney(newReq.amount, clientCurr);
              if (isApproved) {
                addNotification(
                  `🎉 ${reqType} Approved!`,
                  `Your ${reqType.toLowerCase()} of ${formattedReqVal} has been successfully approved and settled.`,
                  newReq.type === 'DEPOSIT' ? 'deposit' : 'withdrawal',
                  'success'
                );
              } else {
                addNotification(
                  `⚠️ ${reqType} Rejected`,
                  `Your ${reqType.toLowerCase()} of ${formattedReqVal} was rejected. ${newReq.remarks || 'Contact support for details.'}`,
                  newReq.type === 'DEPOSIT' ? 'deposit' : 'withdrawal',
                  'error'
                );
              }
            }
          });

          // Detect Trade Completion
          tRes.trades.forEach(newTrade => {
            const oldTrade = userTrades.find(t => t.id === newTrade.id);
            if (oldTrade && oldTrade.status === 'RUNNING' && newTrade.status === 'SETTLED') {
              const isWin = newTrade.outcome === 'WIN';
              const payoutVal = formatMoney(newTrade.payout || newTrade.amount * 1.8, clientCurr);
              if (isWin) {
                addNotification(
                  `🏆 Trade Win! (${newTrade.symbol})`,
                  `Your ${newTrade.direction} trade on ${newTrade.symbol} won! Return payout: ${payoutVal}.`,
                  'trade',
                  'success'
                );
              } else {
                addNotification(
                  `📉 Trade Closed (${newTrade.symbol})`,
                  `Your ${newTrade.direction} trade on ${newTrade.symbol} completed.`,
                  'trade',
                  'info'
                );
              }
            }
          });

          setUserTrades(tRes.trades);
          setWalletRequests(wRes.requests);
          if (!isLoggingOutRef.current && localStorage.getItem('crypto_user')) {
            localStorage.setItem('crypto_user', JSON.stringify(uRes.user));
          }
        } catch (uErr: any) {
          if (uErr?.message?.includes('User not found')) {
            console.warn('Session user re-syncing with backend');
          }
        }
      }
    } catch (err) {
      // General network/market tickers sync error
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.email, walletRequests, userTrades, currency, addNotification]);

  // Live interval optimized for swiftapk.io WebView performance
  useEffect(() => {
    refreshMarketAndUser();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshMarketAndUser();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [refreshMarketAndUser]);

  // Check URL params on load (only prompt auth if NOT already logged in)
  useEffect(() => {
    const savedUser = localStorage.getItem('crypto_user');
    const urlParams = new URLSearchParams(window.location.search);
    const hasLoginAction = urlParams.get('action') === 'login';
    const hasRefParam = urlParams.get('ref') || urlParams.get('invite') || urlParams.get('code');
    const hasAdminPrompt = urlParams.has('admin') || window.location.hash === '#admin' || window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');

    const savedAdmin = localStorage.getItem('crypto_admin');
    if (hasAdminPrompt) {
      if (!savedAdmin) {
        setAdminModalOpen(true);
      } else {
        changeActiveTab('admin');
      }
    }

    // If user is not logged in and has an invitation or login prompt, open auth modal
    if (!savedUser && (hasLoginAction || hasRefParam)) {
      setAuthModalOpen(true);
    }

    // Clean action param from address bar so standard page refresh never triggers unexpected auth popup
    if (hasLoginAction || (hasAdminPrompt && window.location.pathname === '/admin')) {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {}
    }
  }, []);

  // Sync admin user profile on load & refresh
  useEffect(() => {
    if (!adminUser?.id) return;
    api.getAdminProfile(adminUser.id).then(res => {
      if (res.admin) {
        setAdminUser(res.admin);
        localStorage.setItem('crypto_admin', JSON.stringify(res.admin));
      }
    }).catch(() => {
      // ignore network errors
    });
  }, [adminUser?.id]);

  // Auth Handlers
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('crypto_user', JSON.stringify(user));
    if (user.currency) {
      setCurrency(user.currency);
      localStorage.setItem('app_currency', user.currency);
    }
    setActiveTab('home');
    // Ensure URL has no lingering query parameters after successful login
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  };

  const handleAdminSuccess = (admin: AdminUser) => {
    setAdminUser(admin);
    localStorage.setItem('crypto_admin', JSON.stringify(admin));
    changeActiveTab('admin');
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  };

  const handleLogoutUser = () => {
    isLoggingOutRef.current = true;

    // 1. Instantly reset client states
    setCurrentUser(null);
    setUserTrades([]);
    setWalletRequests([]);
    changeActiveTab('home');

    // 2. Clear all local and session storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}

    // 3. Clean address bar query parameters completely
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  };

  const handleLogoutAdmin = () => {
    setAdminUser(null);
    localStorage.removeItem('crypto_admin');
    localStorage.removeItem('app_active_tab');
    sessionStorage.clear();
    changeActiveTab('home');
  };

  const [tradeToast, setTradeToast] = useState<{ title: string; symbol: string; amount: number; direction: string } | null>(null);
  const [deactivatedModalOpen, setDeactivatedModalOpen] = useState(false);

  // Place Trade Action
  const handlePlaceTrade = async (params: {
    symbol: string;
    direction: 'UP' | 'DOWN';
    duration: number;
    amount: number;
  }) => {
    if (!currentUser) return;

    if (currentUser.status === 'frozen' || currentUser.status === 'suspended') {
      setDeactivatedModalOpen(true);
      return;
    }
    const res = await api.createTrade({
      userId: currentUser.id,
      ...params,
    });
    
    // Update local state immediately
    setUserTrades(prev => [res.trade, ...prev]);
    if (res.user) {
      setCurrentUser(prev => prev ? { ...prev, ...res.user } : null);
    }

    // Trigger visual notification toast & in-app notification formatted in client's native currency
    const userCurr = currentUser.currency || currency || 'USD';
    const formattedAmt = formatMoney(params.amount, userCurr);
    const tradeMsg = `Bought ${params.direction === 'UP' ? 'Bullish Call' : 'Bearish Put'} of ${formattedAmt} on ${params.symbol} (${params.duration}s)`;
    setTradeToast({
      title: 'Order Placed Successfully!',
      symbol: params.symbol,
      amount: params.amount,
      direction: params.direction
    });
    addNotification('📈 Trade Placed', tradeMsg, 'trade', 'info');

    setTimeout(() => {
      setTradeToast(null);
    }, 4500);
  };

  // Open Coin in Trade
  const handleSelectCoinAndTrade = (symbol: string) => {
    setSelectedTradeSymbol(symbol);
    setActiveTab('trade');
  };

  // Active trades count
  const activeTradeCount = userTrades.filter(t => t.status === 'RUNNING').length;
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (currentUser?.id) {
        localStorage.setItem(`app_notifications_${currentUser.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    if (currentUser?.id) {
      localStorage.removeItem(`app_notifications_${currentUser.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        adminUser={adminUser}
        currency={currency}
        onOpenCurrencyModal={() => setCurrencyModalOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenAdminModal={() => setAdminModalOpen(true)}
        onOpenDepositModal={() => {
          if (!currentUser) { setAuthModalOpen(true); return; }
          setWalletModalType('deposit');
          setWalletModalOpen(true);
        }}
        onOpenWithdrawModal={() => {
          if (!currentUser) { setAuthModalOpen(true); return; }
          setWalletModalType('withdraw');
          setWalletModalOpen(true);
        }}
        onLogoutUser={handleLogoutUser}
        onLogoutAdmin={handleLogoutAdmin}
        onGoToTab={(tab) => setActiveTab(tab as any)}
        activeTab={activeTab}
        onOpenNotifications={() => {
          handleMarkAllNotificationsRead();
          setNotificationsModalOpen(true);
        }}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Tab 1: HOME */}
        {activeTab === 'home' && (
          <ClientHome
            user={currentUser}
            pairs={pairs}
            walletRequests={walletRequests}
            userTrades={userTrades}
            currency={currency}
            onOpenCurrencyModal={() => setCurrencyModalOpen(true)}
            onOpenDeposit={() => {
              if (!currentUser) { setAuthModalOpen(true); return; }
              setWalletModalType('deposit');
              setWalletModalOpen(true);
            }}
            onOpenWithdraw={() => {
              if (!currentUser) { setAuthModalOpen(true); return; }
              setWalletModalType('withdraw');
              setWalletModalOpen(true);
            }}
            onGoToTrade={(symbol) => {
              if (symbol) setSelectedTradeSymbol(symbol);
              setActiveTab('trade');
            }}
            onGoToMarket={() => setActiveTab('market')}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {/* Tab 2: MARKET */}
        {activeTab === 'market' && (
          <MarketListView
            pairs={pairs}
            currency={currency}
            onSelectCoin={handleSelectCoinAndTrade}
          />
        )}

        {/* Tab 3: TRADE */}
        {activeTab === 'trade' && (
          <TradeDesk
            pairs={pairs}
            selectedSymbol={selectedTradeSymbol}
            onSelectSymbol={setSelectedTradeSymbol}
            currentUser={currentUser}
            activeTrades={userTrades}
            currency={currency}
            onPlaceTrade={handlePlaceTrade}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenDeposit={() => {
              setWalletModalType('deposit');
              setWalletModalOpen(true);
            }}
            onViewTradeOrders={() => setActiveTab('orders')}
          />
        )}

        {/* Tab 4: PROFILE / ASSETS */}
        {activeTab === 'profile' && currentUser && (
          <ClientProfile
            user={currentUser}
            walletRequests={walletRequests}
            userTrades={userTrades}
            currency={currency}
            onOpenCurrencyModal={() => setCurrencyModalOpen(true)}
            onOpenWithdraw={() => {
              if (!currentUser) { setAuthModalOpen(true); return; }
              setWalletModalType('withdraw');
              setWalletModalOpen(true);
            }}
            onViewTradeOrders={() => setActiveTab('orders')}
            onGoToTrade={() => setActiveTab('trade')}
            onLogout={handleLogoutUser}
            onOpenAdminLogin={() => setAdminModalOpen(true)}
            onUserUpdated={(up) => {
              setCurrentUser(prev => prev ? { ...prev, ...up } : null);
              localStorage.setItem('crypto_user', JSON.stringify({ ...currentUser, ...up }));
            }}
          />
        )}

        {/* Tab: PROFILE (When not logged in) */}
        {activeTab === 'profile' && !currentUser && (
          <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Account Profile & Balance
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Please sign in to view your credit score points, assets, and trade history.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-sm transition shadow-sm"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* Tab: ORDERS / TRADE RESULTS */}
        {activeTab === 'orders' && (
          <TradeOrdersView
            trades={userTrades}
            pairs={pairs}
            currency={currency}
            onBackToTrade={() => setActiveTab('trade')}
          />
        )}

        {/* Tab: ADMIN DASHBOARD */}
        {activeTab === 'admin' && adminUser && (
          <AdminDashboard
            adminUser={adminUser}
            onLogoutAdmin={handleLogoutAdmin}
            onRefreshData={refreshMarketAndUser}
            onUpdateAdmin={(updated) => {
              setAdminUser(updated);
              localStorage.setItem('crypto_admin', JSON.stringify(updated));
            }}
          />
        )}
      </main>

      {/* Trade Placed Notification Toast */}
      {tradeToast && (
        <div className="fixed top-18 right-4 z-50 animate-bounce-short">
          <div className="bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
              1
            </div>
            <div>
              <div className="text-xs font-extrabold text-emerald-400 flex items-center space-x-1.5">
                <span>{tradeToast.title}</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                {tradeToast.direction === 'UP' ? '📈 Bullish Buy' : '📉 Bearish Sell'} • {tradeToast.symbol} ({formatMoney(tradeToast.amount, currency)})
              </div>
            </div>
            <button
              onClick={() => {
                setTradeToast(null);
                setActiveTab('orders');
              }}
              className="ml-2 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/40 transition cursor-pointer"
            >
              View Order
            </button>
          </div>
        </div>
      )}

      {/* Client Bottom Navigation Bar (5 Main Tabs: Home, Market, Trade, Orders, Assets) */}
      {activeTab !== 'admin' && (
        <BottomNav
          activeTab={activeTab === 'admin' ? 'home' : activeTab}
          onChangeTab={(tab) => {
            if ((tab === 'profile' || tab === 'orders') && !currentUser) {
              setAuthModalOpen(true);
            }
            changeActiveTab(tab);
          }}
          activeTradeCount={activeTradeCount}
        />
      )}

      {/* Auth Modal (Name, Email, Password) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onAdminSuccess={handleAdminSuccess}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />

      {/* Currency Switcher Modal */}
      <CurrencyModal
        isOpen={currencyModalOpen}
        onClose={() => setCurrencyModalOpen(false)}
        currentCurrency={currency}
        onSelectCurrency={handleSelectCurrency}
        isLoggedIn={Boolean(currentUser)}
      />

      {/* Wallet Deposit & Withdrawal Modal */}
      {currentUser && (
        <WalletModal
          isOpen={walletModalOpen}
          type={walletModalType}
          onClose={() => setWalletModalOpen(false)}
          user={currentUser}
          currency={currency}
          onSuccess={(updated) => {
            if (updated) {
              setCurrentUser(prev => prev ? { ...prev, ...updated } : null);
            }
            addNotification(
              walletModalType === 'withdraw' ? '📤 Withdrawal Requested' : '📥 Deposit Submitted',
              `Your ${walletModalType} request has been submitted and is currently pending review.`,
              walletModalType === 'withdraw' ? 'withdrawal' : 'deposit',
              'info'
            );
            refreshMarketAndUser();
          }}
        />
      )}

      {/* Deactivated Account Alert Modal */}
      {deactivatedModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900 my-auto animate-scale-up space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-2xl shadow-inner">
              🔒
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Account Deactivated / Frozen
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Your account is currently restricted by administration. You cannot place trades, deposit, or withdraw funds.
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-medium">
              Please contact official Customer Care Desk to review and reactivate your account.
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setDeactivatedModalOpen(false)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setDeactivatedModalOpen(false);
                  setActiveTab('profile');
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-md transition cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>Customer Support</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal Drawer */}
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onClearAll={handleClearAllNotifications}
        currency={currency}
      />
    </div>
  );
}
