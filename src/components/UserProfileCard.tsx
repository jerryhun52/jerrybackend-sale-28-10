import React from 'react';
import { User, WalletRequest } from '../types';
import { formatMoney } from '../utils/formatters';
import { 
  Wallet, 
  Lock, 
  ShieldCheck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  User as UserIcon
} from 'lucide-react';

interface UserProfileCardProps {
  user: User;
  walletRequests: WalletRequest[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onGoToTrade: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  walletRequests,
  onOpenDeposit,
  onOpenWithdraw,
  onGoToTrade,
  onRefresh,
  refreshing,
}) => {
  // Determine credit score tier
  const getCreditScoreDetails = (score: number) => {
    if (score >= 90) return { label: 'Excellent Rating', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (score >= 75) return { label: 'Good Standing', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' };
    if (score >= 60) return { label: 'Fair Rating', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { label: 'Low Rating (Restricted)', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const creditDetails = getCreditScoreDetails(user.creditScore);

  return (
    <div className="space-y-6">
      {/* Main Profile Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {user.name}
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Verified Trader
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Balance & Score"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onGoToTrade}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-md shadow-emerald-500/20 flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Go to Live Trade</span>
            </button>
          </div>
        </div>

        {/* Primary Stat Grid: Credit Score, Total Balance, Freeze Balance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {/* Total Available Balance */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-5 relative group hover:border-emerald-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center space-x-1.5 font-medium">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Available Balance</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {user.currency || 'USD'}
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {formatMoney(user.balance, user.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Ready for 30s/60s crypto option trades
            </p>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={onOpenDeposit}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Deposit</span>
              </button>
              <button
                onClick={onOpenWithdraw}
                className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center space-x-1.5"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                <span>Withdraw</span>
              </button>
            </div>
          </div>

          {/* Freeze Balance */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-5 relative group hover:border-amber-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center space-x-1.5 font-medium">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Freeze Balance</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded">
                {user.currency || 'USD'} Locked
              </span>
            </div>
            <div className="text-3xl font-extrabold text-amber-300 font-mono tracking-tight">
              {formatMoney(user.freezeBalance, user.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Funds in active option contracts or pending withdrawal
            </p>
            <div className="mt-4 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Security State:</span>
              <span className="font-semibold text-emerald-400">Escrow Guaranteed</span>
            </div>
          </div>

          {/* Credit Score */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-5 relative group hover:border-teal-500/30 transition">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center space-x-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Credit Score</span>
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${creditDetails.bg} ${creditDetails.color} ${creditDetails.border}`}>
                {creditDetails.label}
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-extrabold text-teal-300 font-mono tracking-tight">
                {user.creditScore}
              </div>
              <div className="text-sm font-semibold text-slate-500">/ 100</div>
            </div>

            {/* Score progress gauge bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, user.creditScore))}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Maintained & certified via Administration risk policy
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Activity / Requests Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Recent Deposit & Withdrawal Requests</span>
          </h3>
          <span className="text-xs text-slate-400">
            Controlled & Reviewed via Admin Backend
          </span>
        </div>

        {walletRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No recent deposit or withdrawal requests submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {walletRequests.slice(0, 5).map((req) => (
              <div key={req.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${
                    req.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {req.type === 'DEPOSIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {req.type === 'DEPOSIT' ? 'Deposit Request' : 'Withdrawal Request'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {req.network} • {new Date(req.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-white font-mono">
                    {req.type === 'DEPOSIT' ? '+' : '-'}${req.amount.toFixed(2)} USDT
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : req.status === 'REJECTED'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
