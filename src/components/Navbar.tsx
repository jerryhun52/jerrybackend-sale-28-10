import React from 'react';
import { User, AdminUser, CurrencyCode, CURRENCIES } from '../types';
import { Bell } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  adminUser: AdminUser | null;
  currency: CurrencyCode;
  onOpenCurrencyModal: () => void;
  onOpenAuthModal: () => void;
  onOpenAdminModal: () => void;
  onOpenDepositModal: () => void;
  onOpenWithdrawModal: () => void;
  onLogoutUser: () => void;
  onLogoutAdmin: () => void;
  onGoToTab: (tab: 'home' | 'market' | 'trade' | 'profile' | 'admin' | 'orders') => void;
  activeTab: string;
  selectedTradeSymbol?: string;
  activeTradeCount?: number;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currency,
  onOpenAuthModal,
  onGoToTab,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) => {
  const currConfig = CURRENCIES[currency] || CURRENCIES.USD;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#e2e8f0]/95 backdrop-blur-md border-b border-slate-300 shadow-xs text-slate-900 pt-3.5 sm:pt-0 pt-[max(0.85rem,env(safe-area-inset-top))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          
          {/* Left: CELLS FLOWNEX Icon & Brand Name */}
          <div className="flex items-center space-x-2.5 cursor-pointer shrink-0" onClick={() => onGoToTab('home')}>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0284c7] via-[#2563eb] to-[#06b6d4] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0b1329] rounded-[14px] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <circle cx="12" cy="12" r="9" stroke="url(#flowGrad)" strokeWidth="1.8" />
                  <path d="M7 12C7 9.5 9 8 12 8C15 8 17 9.5 17 12C17 14.5 15 16 12 16C9 16 7 14.5 7 12Z" stroke="#38bdf8" strokeWidth="1.4" />
                  <path d="M12 5V19M8 8.5L16 15.5" stroke="#bae6fd" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
                  <defs>
                    <linearGradient id="flowGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#06b6d4" />
                      <stop offset="0.5" stopColor="#3b82f6" />
                      <stop offset="1" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="flex flex-col select-none">
              <span className="text-base sm:text-xl font-black tracking-tight text-slate-900 uppercase whitespace-nowrap leading-none">
                CELLS FLOWNEX
              </span>
              <span className="text-[7px] sm:text-[9px] font-extrabold tracking-widest text-[#2563eb] uppercase mt-0.5 whitespace-nowrap">
                TRADE • INVEST
              </span>
            </div>
          </div>

          {/* Right: Static Currency Badge, Notification Bell & Login/Profile Button */}
          <div className="flex items-center justify-end space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border border-slate-300/80 bg-white text-slate-800 text-xs font-bold shadow-2xs select-none">
              <span className="text-sm">{currConfig.flag}</span>
              <span className="font-mono text-slate-800">{currency}</span>
            </div>

            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse shadow-xs">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {currentUser ? (
              <button
                onClick={() => onGoToTab('profile')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                  {currentUser.username ? currentUser.username.substring(0, 1).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline-block max-w-[80px] truncate text-slate-800">
                  {currentUser.username}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-extrabold rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
              >
                Login
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};


