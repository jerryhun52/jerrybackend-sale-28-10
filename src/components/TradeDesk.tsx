import React, { useState, useEffect, useMemo } from 'react';
import { CryptoPair, User, Trade, CurrencyCode, CURRENCIES } from '../types';
import { formatMoney, formatCryptoPrice } from '../utils/formatters';
import { CandleChart } from './CandleChart';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  DollarSign, 
  CheckCircle2, 
  Sparkles,
  ChevronDown,
  AlertCircle,
  Zap
} from 'lucide-react';

interface TradeDeskProps {
  pairs: CryptoPair[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  currentUser: User | null;
  activeTrades: Trade[];
  currency: CurrencyCode;
  onPlaceTrade: (params: {
    symbol: string;
    direction: 'UP' | 'DOWN';
    duration: number;
    amount: number;
  }) => Promise<void>;
  onOpenAuth: () => void;
  onOpenDeposit?: () => void;
  onViewTradeOrders: () => void;
}

export const TradeDesk: React.FC<TradeDeskProps> = ({
  pairs,
  selectedSymbol,
  onSelectSymbol,
  currentUser,
  activeTrades,
  currency,
  onPlaceTrade,
  onOpenAuth,
  onViewTradeOrders,
}) => {
  const currencyConfig = CURRENCIES[currency] || CURRENCIES.USD;
  const rate = currencyConfig.rate || 1;
  const currencySymbol = currencyConfig.symbol;
  const currencyCode = currencyConfig.code;

  // Preset chips customized for each currency
  const presets = useMemo(() => {
    if (currency === 'PKR') return [500, 1000, 2500, 5000, 10000, 25000];
    if (currency === 'INR') return [200, 500, 1000, 2500, 5000, 10000];
    if (currency === 'BRL') return [50, 100, 250, 500, 1000, 2500];
    return [10, 50, 100, 250, 500, 1000];
  }, [currency]);

  // Default trade amount adjusted to selected currency
  const [tradeAmount, setTradeAmount] = useState<number>(() => {
    if (currency === 'PKR') return 1000;
    if (currency === 'INR') return 500;
    if (currency === 'BRL') return 100;
    return 50;
  });

  // When currency changes from header/settings, adjust default amount
  useEffect(() => {
    if (currency === 'PKR') setTradeAmount(1000);
    else if (currency === 'INR') setTradeAmount(500);
    else if (currency === 'BRL') setTradeAmount(100);
    else setTradeAmount(50);
  }, [currency]);

  const [duration, setDuration] = useState<number>(60); // 60s, 120s, 180s
  const [submitting, setSubmitting] = useState(false);
  const [tradeSuccessToast, setTradeSuccessToast] = useState<{
    symbol: string;
    direction: 'UP' | 'DOWN';
    amount: number;
    currencySymbol: string;
    currencyCode: string;
    payout: number;
  } | null>(null);

  // Active Pair
  const currentPair = pairs.find((p) => p.symbol === selectedSymbol) || pairs[0] || {
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    basePrice: 88450.50,
    currentPrice: 88450.50,
    change24h: 3.42,
    high24h: 89600.00,
    low24h: 86900.00,
    volume24h: '1.42B',
    precision: 2,
    volatility: 8.5,
  };

  // Time durations with profit rates as requested: 60s gives strictly 20% profit/commission
  const durationOptions = [
    { seconds: 60, label: '60s', profitRate: 20, tag: 'Standard • 20%' },
    { seconds: 120, label: '120s', profitRate: 40, tag: 'High Yield • 40%' },
    { seconds: 180, label: '180s', profitRate: 60, tag: 'Extended • 60%' },
  ];

  const availableBalanceInCurrency = currentUser ? currentUser.balance : 0;

  const selectedDurationObj = durationOptions.find(d => d.seconds === duration) || durationOptions[0];
  const profitPercentage = selectedDurationObj.profitRate;
  const estimatedProfitInCurrency = (tradeAmount * profitPercentage) / 100;
  const totalEstimatedPayoutInCurrency = tradeAmount + estimatedProfitInCurrency;

  const handleExecuteTrade = async (direction: 'UP' | 'DOWN') => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (tradeAmount <= 0) return;
    if (tradeAmount > availableBalanceInCurrency) {
      alert(`Insufficient available balance (${currencySymbol} ${availableBalanceInCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Your trade amount is ${currencySymbol} ${tradeAmount.toLocaleString()}.`);
      return;
    }

    const tradeAmountNative = Number(tradeAmount.toFixed(2));
    setSubmitting(true);
    try {
      await onPlaceTrade({
        symbol: currentPair.symbol,
        direction,
        duration,
        amount: tradeAmountNative,
      });

      setTradeSuccessToast({
        symbol: currentPair.symbol,
        direction,
        amount: tradeAmount,
        currencySymbol,
        currencyCode,
        payout: totalEstimatedPayoutInCurrency,
      });

      setTimeout(() => {
        setTradeSuccessToast(null);
      }, 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter running trades for this user
  const runningTrades = activeTrades.filter(t => t.status === 'RUNNING');
  const isUp = currentPair.change24h >= 0;

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto animate-fade-in">
      {/* Top Pair Selector & Price Summary Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Pair Dropdown */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <select
                value={currentPair.symbol}
                onChange={(e) => onSelectSymbol(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-2xl pl-3.5 pr-9 py-2 font-extrabold text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer shadow-xs"
              >
                {pairs.map((p) => (
                  <option key={p.symbol} value={p.symbol}>
                    {p.symbol} • {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Spot Options Contract
            </span>
          </div>

          {/* Live Price & Change */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
                {formatCryptoPrice(currentPair.currentPrice, currentPair.precision, currency)}
              </div>
              <div className="text-[11px] text-slate-400">
                Live Index Price
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 mr-1 text-rose-600" />}
              {isUp ? '+' : ''}{currentPair.change24h.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Candlestick Chart */}
      <CandleChart pair={currentPair} currency={currency} />

      {/* Trade Configuration Form */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5">
        {/* Section 1: Trade Amount (Upper) */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span className="flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Investment Amount ({currencyCode})</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Available:</span>
              <span className="font-bold text-slate-900">
                {currentUser ? formatMoney(currentUser.balance, currency) : formatMoney(0, currency)}
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm font-mono flex items-center space-x-1">
              <span>{currencyCode}</span>
              <span className="text-emerald-600 font-black">{currencySymbol}</span>
            </div>
            <input
              type="number"
              min="1"
              value={tradeAmount || ''}
              onChange={(e) => setTradeAmount(Number(e.target.value))}
              placeholder={`Enter trade amount in ${currencyCode}`}
              className="w-full pl-22 pr-28 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 font-mono">
              {currency !== 'USD' && currency !== 'USDT'
                ? `≈ $${(tradeAmount / rate).toFixed(2)} USD`
                : `${currencyCode}`}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {presets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setTradeAmount(val)}
                className={`px-3 py-1 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  tradeAmount === val
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {currencySymbol}{val.toLocaleString()}
              </button>
            ))}
            {currentUser && (
              <button
                type="button"
                onClick={() => setTradeAmount(Math.floor(availableBalanceInCurrency))}
                className="px-3 py-1 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition ml-auto cursor-pointer"
              >
                MAX ({currencyCode})
              </button>
            )}
          </div>
        </div>

        {/* Section 2: Time Duration Selection (60s, 120s, 180s) */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Select Expiry Time & Profit Rate</span>
            </span>
            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
              Guaranteed Auto Profit Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {durationOptions.map((opt) => {
              const isSelected = duration === opt.seconds;
              return (
                <button
                  key={opt.seconds}
                  type="button"
                  onClick={() => setDuration(opt.seconds)}
                  className={`p-3.5 rounded-2xl border text-center transition relative overflow-hidden cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    {opt.tag}
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    {opt.label}
                  </div>
                  <div className="text-xs font-extrabold text-emerald-600 mt-0.5">
                    +{opt.profitRate}% Profit
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Payout Summary Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block">Expected Profit Return:</span>
            <span className="font-bold text-emerald-600 text-sm font-mono">
              +{currencySymbol} {estimatedProfitInCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{profitPercentage}%)
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Total Est. Payout:</span>
            <span className="font-extrabold text-slate-900 text-base font-mono">
              {currencySymbol} {totalEstimatedPayoutInCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Section 4: Action Buttons (BUY UP / BUY DOWN) */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Buy UP Button */}
          <button
            onClick={() => handleExecuteTrade('UP')}
            disabled={submitting}
            className="flex flex-col items-center justify-center py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl font-extrabold shadow-sm transition disabled:opacity-50 group cursor-pointer"
          >
            <div className="flex items-center space-x-1.5 text-base sm:text-lg">
              <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition" />
              <span>BUY UP {currencySymbol}{tradeAmount > 0 ? tradeAmount.toLocaleString() : ''}</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-100 mt-0.5">
              +{profitPercentage}% Profit in {duration}s
            </span>
          </button>

          {/* Buy DOWN Button */}
          <button
            onClick={() => handleExecuteTrade('DOWN')}
            disabled={submitting}
            className="flex flex-col items-center justify-center py-3.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white rounded-2xl font-extrabold shadow-sm transition disabled:opacity-50 group cursor-pointer"
          >
            <div className="flex items-center space-x-1.5 text-base sm:text-lg">
              <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition" />
              <span>BUY DOWN {currencySymbol}{tradeAmount > 0 ? tradeAmount.toLocaleString() : ''}</span>
            </div>
            <span className="text-[11px] font-semibold text-rose-100 mt-0.5">
              +{profitPercentage}% Profit in {duration}s
            </span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {tradeSuccessToast && (
        <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm">
                Trade Placed Successfully!
              </div>
              <div className="text-xs text-emerald-100 font-mono">
                {tradeSuccessToast.direction} {tradeSuccessToast.symbol} ({tradeSuccessToast.currencySymbol} {tradeSuccessToast.amount.toLocaleString()}) • Est. Payout: {tradeSuccessToast.currencySymbol} {tradeSuccessToast.payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <button
            onClick={onViewTradeOrders}
            className="px-3 py-1.5 bg-white text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-50 transition shadow-xs cursor-pointer"
          >
            Check Trade
          </button>
        </div>
      )}

      {/* Active Running Orders Floating View */}
      {runningTrades.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-600 animate-spin" />
              <h3 className="font-bold text-slate-900 text-sm">
                Active Running Trades ({runningTrades.length})
              </h3>
            </div>
            <button
              onClick={onViewTradeOrders}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              View Full History →
            </button>
          </div>

          <div className="space-y-2.5">
            {runningTrades.map((t) => {
              const secondsLeft = Math.max(0, Math.ceil((t.expireTime - Date.now()) / 1000));
              const currentP = pairs.find(p => p.symbol === t.symbol)?.currentPrice || t.entryPrice;
              return (
                <div
                  key={t.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-xl text-xs font-bold ${
                      t.direction === 'UP' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {t.direction}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {t.symbol} • Margin: {formatMoney(t.amount, currency)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Entry: {t.entryPrice} → Live: {currentP}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold text-emerald-600 animate-pulse font-mono">
                      {secondsLeft}s left
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Est. +{formatMoney((t.amount * t.profitPercentage) / 100, currency)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
