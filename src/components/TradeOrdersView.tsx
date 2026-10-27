import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Trade, CryptoPair, CurrencyCode } from '../types';
import { formatMoney, formatCryptoPrice } from '../utils/formatters';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  ArrowLeft,
  X,
  Info,
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

interface TradeOrdersViewProps {
  trades: Trade[];
  pairs: CryptoPair[];
  currency: CurrencyCode;
  onBackToTrade: () => void;
}

export const TradeOrdersView: React.FC<TradeOrdersViewProps> = ({
  trades,
  pairs,
  currency,
  onBackToTrade,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'RUNNING' | 'SETTLED'>('ALL');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const runningTrades = trades.filter((t) => t.status === 'RUNNING');
  const settledTrades = trades.filter((t) => t.status === 'SETTLED');

  const filteredTrades = filter === 'ALL'
    ? trades
    : filter === 'RUNNING'
    ? runningTrades
    : settledTrades;

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto animate-fade-in font-sans">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToTrade}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              My Trade Orders
            </h2>
            <p className="text-xs text-slate-500">
              Total {trades.length} trade order records
            </p>
          </div>
        </div>

        <button
          onClick={onBackToTrade}
          className="px-3.5 py-2 bg-[#2f66ee] hover:bg-blue-600 text-white font-bold rounded-xl text-xs shadow-xs transition"
        >
          + New Trade
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            filter === 'ALL'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All ({trades.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('RUNNING')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 ${
            filter === 'RUNNING'
              ? 'bg-white text-emerald-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Running</span>
          {runningTrades.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
          <span>({runningTrades.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter('SETTLED')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            filter === 'SETTLED'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Settled ({settledTrades.length})
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-2.5">
        {filteredTrades.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs">
            No trade orders found in this filter.
          </div>
        ) : (
          filteredTrades.map((t) => {
            const isRunning = t.status === 'RUNNING';
            const isWin = t.outcome === 'WIN';
            const isUp = t.direction === 'UP';
            const secondsLeft = isRunning ? Math.max(0, Math.ceil((t.expireTime - Date.now()) / 1000)) : 0;
            const currentP = pairs.find((p) => p.symbol === t.symbol)?.currentPrice || t.entryPrice;
            const netProfit = isWin ? (t.payout || 0) - t.amount : -t.amount;

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTrade(t)}
                className={`p-4 rounded-2xl border transition shadow-xs cursor-pointer ${
                  isRunning
                    ? 'bg-emerald-50/40 border-emerald-300 hover:bg-emerald-50/80'
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 text-sm">{t.symbol}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      BUY {t.direction} • {t.duration}s
                    </span>
                  </div>

                  {isRunning ? (
                    <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-mono font-bold flex items-center space-x-1 animate-pulse">
                      <Clock className="w-3 h-3" />
                      <span>{secondsLeft}s</span>
                    </span>
                  ) : (
                    <div className="text-right">
                      <span className={`text-xs font-extrabold font-mono block ${
                        isWin ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isWin ? `Profit: +${formatMoney(netProfit, currency)} (+${t.profitPercentage}%)` : `Loss: -${formatMoney(t.amount, currency)}`}
                      </span>
                      {isWin && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Total Payout: {formatMoney(t.payout || t.amount * 1.2, currency)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div>
                    <span>Trade Amount: </span>
                    <strong className="text-slate-900 font-bold font-mono">{formatMoney(t.amount, currency)}</strong>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-blue-600 font-bold hover:underline">
                    <span>View Full Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Trade Detail Modal (Full-Screen Mobile Responsive Modal via Portal with Pinned Cancel Button) */}
      {selectedTrade && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in font-sans overflow-hidden">
          <div className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-scale-up my-auto">
            
            {/* Modal Header */}
            <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2f66ee] flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                    Order Record Details
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Order ID: {selectedTrade.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTrade(null)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-2xl hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs font-sans">
              
              {/* Asset & Direction Banner */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Asset Pair</span>
                  <span className="font-black text-sm tracking-tight text-white">{selectedTrade.symbol}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Contract Type</span>
                  <span className={`font-black text-xs px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                    selectedTrade.direction === 'UP' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    BUY {selectedTrade.direction}
                  </span>
                </div>
              </div>

              {/* Order Data Breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Contract Duration:</span>
                  <span className="font-bold text-slate-900">{selectedTrade.duration} Seconds</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Trade Margin Amount:</span>
                  <span className="font-mono font-extrabold text-slate-900">
                    {formatMoney(selectedTrade.amount, currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Profit Rate / Yield:</span>
                  <span className="font-bold text-emerald-600">+{selectedTrade.profitPercentage}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Calculated Profit:</span>
                  <span className="font-mono font-extrabold text-emerald-600">
                    +{formatMoney((selectedTrade.amount * selectedTrade.profitPercentage) / 100, currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                  <span className="text-slate-900 font-extrabold">Total Return / Payout:</span>
                  <span className="font-mono font-black text-emerald-600 text-sm">
                    {formatMoney(selectedTrade.payout || selectedTrade.amount * (1 + selectedTrade.profitPercentage / 100), currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Entry Index Price:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTrade.entryPrice}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Settlement Price:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedTrade.settlePrice || 'Awaiting Settlement'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Outcome Status:</span>
                  <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-[10px] ${
                    selectedTrade.status === 'RUNNING'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : selectedTrade.outcome === 'WIN'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {selectedTrade.status === 'RUNNING' ? 'ACTIVE RUNNING' : selectedTrade.outcome === 'WIN' ? 'WIN (+Profit)' : 'LOSS'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                  <span>Execution Date & Time:</span>
                  <span className="font-mono">{new Date(selectedTrade.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Pinned Footer with Cancel Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setSelectedTrade(null)}
                className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-extrabold rounded-2xl text-xs shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Cancel / Close Record</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
