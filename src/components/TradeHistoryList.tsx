import React, { useState } from 'react';
import { Trade } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Calendar,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface TradeHistoryListProps {
  trades: Trade[];
  onGoToTrade: () => void;
}

export const TradeHistoryList: React.FC<TradeHistoryListProps> = ({
  trades,
  onGoToTrade,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'RUNNING' | 'WIN' | 'LOSS'>('ALL');

  const filteredTrades = trades.filter((t) => {
    if (filter === 'RUNNING') return t.status === 'RUNNING';
    if (filter === 'WIN') return t.outcome === 'WIN';
    if (filter === 'LOSS') return t.outcome === 'LOSS';
    return true;
  });

  const totalWon = trades.filter(t => t.outcome === 'WIN').length;
  const totalLost = trades.filter(t => t.outcome === 'LOSS').length;
  const totalProfit = trades.reduce((acc, t) => {
    if (t.outcome === 'WIN' && t.payout) return acc + (t.payout - t.amount);
    if (t.outcome === 'LOSS') return acc - t.amount;
    return acc;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">Total Orders Placed</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{trades.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">Winning Trades</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{totalWon}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">Loss Trades</div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">{totalLost}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">Net Realized PnL</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)} USDT
          </div>
        </div>
      </div>

      {/* Trades Table & Filter Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              My Trading Records & Option Contracts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive log of all live countdowns and settled binary option contracts
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'RUNNING', 'WIN', 'LOSS'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === f
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">No trading records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't placed any trades under this filter yet. Choose a crypto pair and test your forecast!
            </p>
            <button
              onClick={onGoToTrade}
              className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              Open Trading Desk
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="pb-3 px-3">Trading Pair</th>
                  <th className="pb-3 px-3">Option Type</th>
                  <th className="pb-3 px-3">Duration</th>
                  <th className="pb-3 px-3">Margin Amount</th>
                  <th className="pb-3 px-3">Entry Price</th>
                  <th className="pb-3 px-3">Settle Price</th>
                  <th className="pb-3 px-3">Outcome / PnL</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTrades.map((t) => {
                  const isUp = t.direction === 'UP';
                  const isRunning = t.status === 'RUNNING';
                  const isWin = t.outcome === 'WIN';
                  const pnl = isWin ? (t.payout || 0) - t.amount : -t.amount;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-3 font-bold text-white font-sans">
                        {t.symbol}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isUp
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {isUp ? 'BUY UP ↑' : 'BUY DOWN ↓'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        {t.duration}s (+{t.profitPercentage}%)
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white">
                        ${t.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        ${t.entryPrice.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        {t.settlePrice ? `$${t.settlePrice.toFixed(4)}` : 'In Progress...'}
                      </td>
                      <td className="py-3.5 px-3">
                        {isRunning ? (
                          <span className="text-amber-300 animate-pulse">Calculating...</span>
                        ) : isWin ? (
                          <span className="text-emerald-400 font-bold">
                            +${pnl.toFixed(2)} (Win)
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold">
                            -${Math.abs(pnl).toFixed(2)} (Loss)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRunning
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : isWin
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {isRunning ? 'RUNNING' : isWin ? 'WON' : 'SETTLED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-slate-400 font-sans">
                        {new Date(t.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
