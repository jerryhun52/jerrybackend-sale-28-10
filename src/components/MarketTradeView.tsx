import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CryptoPair, User, Trade } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Zap, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  ShieldCheck,
  Search,
  BarChart2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MarketTradeViewProps {
  pairs: CryptoPair[];
  currentUser: User | null;
  activeTrades: Trade[];
  onPlaceTrade: (params: {
    symbol: string;
    direction: 'UP' | 'DOWN';
    duration: number;
    amount: number;
  }) => Promise<void>;
  onOpenAuth: () => void;
  onOpenDeposit: () => void;
}

export const MarketTradeView: React.FC<MarketTradeViewProps> = ({
  pairs,
  currentUser,
  activeTrades,
  onPlaceTrade,
  onOpenAuth,
  onOpenDeposit,
}) => {
  // Selected trading pair (Default BTC/USDT)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USDT');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trade setup state
  const [selectedDuration, setSelectedDuration] = useState<number>(30); // 30s default
  const [tradeAmount, setTradeAmount] = useState<string>('50');
  const [tradeDirection, setTradeDirection] = useState<'UP' | 'DOWN'>('UP');
  const [submitting, setSubmitting] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [recentSettlement, setRecentSettlement] = useState<Trade | null>(null);

  // Timeframes & Profit percentages
  const durationOptions = [
    { duration: 30, label: '30 Seconds', profit: 20, desc: '+20% Return' },
    { duration: 60, label: '60 Seconds', profit: 40, desc: '+40% Return' },
    { duration: 120, label: '120 Seconds', profit: 65, desc: '+65% Return' },
    { duration: 300, label: '300 Seconds', profit: 85, desc: '+85% Return' },
  ];

  // Quick Amount Presets
  const amountPresets = [10, 50, 100, 250, 500, 1000];

  // Currently selected pair object
  const currentPair = useMemo(() => {
    return pairs.find(p => p.symbol === selectedSymbol) || pairs[0] || {
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      basePrice: 88450.50,
      currentPrice: 88450.50,
      change24h: 3.42,
      high24h: 89600.00,
      low24h: 86900.00,
      volume24h: '1.42B',
      precision: 2,
      volatility: 8.5
    };
  }, [pairs, selectedSymbol]);

  // Filtered pairs list
  const filteredPairs = useMemo(() => {
    if (!searchQuery.trim()) return pairs;
    const q = searchQuery.toLowerCase();
    return pairs.filter(p => p.symbol.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  }, [pairs, searchQuery]);

  // Live Chart Price Points Generator
  const [chartPoints, setChartPoints] = useState<number[]>([]);

  useEffect(() => {
    // Generate realistic historical candle data around currentPrice
    const pts: number[] = [];
    let base = currentPair.currentPrice * (1 - (currentPair.change24h / 100) * 0.5);
    for (let i = 0; i < 40; i++) {
      const step = (Math.random() - 0.48) * (currentPair.currentPrice * 0.001);
      base += step;
      pts.push(base);
    }
    pts[pts.length - 1] = currentPair.currentPrice;
    setChartPoints(pts);
  }, [currentPair.symbol]);

  // Update latest point on real-time price tick
  useEffect(() => {
    setChartPoints(prev => {
      if (prev.length === 0) return [currentPair.currentPrice];
      const updated = [...prev.slice(1), currentPair.currentPrice];
      return updated;
    });
  }, [currentPair.currentPrice]);

  // Calculate potential profit
  const selectedOption = durationOptions.find(d => d.duration === selectedDuration) || durationOptions[0];
  const parsedAmount = Number(tradeAmount) || 0;
  const potentialProfit = (parsedAmount * selectedOption.profit) / 100;
  const totalExpectedPayout = parsedAmount + potentialProfit;

  // Active trades for this user
  const userRunningTrades = activeTrades.filter(t => t.status === 'RUNNING');

  // Submit Trade Handler
  const handleProceedTrade = async (direction: 'UP' | 'DOWN') => {
    setTradeError(null);
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (parsedAmount <= 0) {
      setTradeError('Please enter a valid trade amount greater than $0');
      return;
    }

    if (currentUser.balance < parsedAmount) {
      setTradeError(`Insufficient balance ($${currentUser.balance.toFixed(2)}). Please deposit or enter a smaller amount.`);
      return;
    }

    setSubmitting(true);
    try {
      await onPlaceTrade({
        symbol: currentPair.symbol,
        direction,
        duration: selectedDuration,
        amount: parsedAmount
      });
      // Trigger subtle haptic / visual feedback
    } catch (err: any) {
      setTradeError(err.message || 'Failed to place trade contract');
    } finally {
      setSubmitting(false);
    }
  };

  // Watch for settled trades to trigger confetti
  const prevTradesRef = useRef<Trade[]>([]);
  useEffect(() => {
    if (prevTradesRef.current.length > 0) {
      activeTrades.forEach(t => {
        const prev = prevTradesRef.current.find(pt => pt.id === t.id);
        if (prev && prev.status === 'RUNNING' && t.status === 'SETTLED') {
          setRecentSettlement(t);
          if (t.outcome === 'WIN') {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
          setTimeout(() => setRecentSettlement(null), 8000);
        }
      });
    }
    prevTradesRef.current = activeTrades;
  }, [activeTrades]);

  // SVG Chart rendering calculations
  const minChart = Math.min(...chartPoints, currentPair.currentPrice * 0.998);
  const maxChart = Math.max(...chartPoints, currentPair.currentPrice * 1.002);
  const chartHeight = 220;
  const chartWidth = 600;

  const chartPath = useMemo(() => {
    if (chartPoints.length < 2) return '';
    const range = maxChart - minChart || 1;
    return chartPoints
      .map((pt, idx) => {
        const x = (idx / (chartPoints.length - 1)) * chartWidth;
        const y = chartHeight - ((pt - minChart) / range) * (chartHeight - 40) - 20;
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [chartPoints, minChart, maxChart]);

  const chartAreaPath = useMemo(() => {
    if (chartPoints.length < 2) return '';
    const range = maxChart - minChart || 1;
    const points = chartPoints
      .map((pt, idx) => {
        const x = (idx / (chartPoints.length - 1)) * chartWidth;
        const y = chartHeight - ((pt - minChart) / range) * (chartHeight - 40) - 20;
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
    return `${points} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
  }, [chartPoints, minChart, maxChart]);

  return (
    <div className="space-y-6">
      {/* Settlement Alert Notification */}
      {recentSettlement && (
        <div className={`p-4 rounded-2xl border transition-all animate-bounce flex items-center justify-between ${
          recentSettlement.outcome === 'WIN'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/20'
            : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center space-x-3">
            {recentSettlement.outcome === 'WIN' ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center font-bold text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-sm font-bold">
                {recentSettlement.outcome === 'WIN' ? '🎉 Trade Won!' : 'Trade Expired'} ({recentSettlement.symbol})
              </div>
              <div className="text-xs text-slate-300 font-mono">
                {recentSettlement.direction} Option ({recentSettlement.duration}s) • Settle Price: ${recentSettlement.settlePrice?.toFixed(4)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-black font-mono ${recentSettlement.outcome === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {recentSettlement.outcome === 'WIN' ? `+$${(recentSettlement.payout! - recentSettlement.amount).toFixed(2)} USDT` : `-$${recentSettlement.amount.toFixed(2)} USDT`}
            </div>
            <div className="text-[11px] text-slate-400">
              {recentSettlement.outcome === 'WIN' ? `Total Payout: $${recentSettlement.payout?.toFixed(2)}` : 'Margin Settled'}
            </div>
          </div>
        </div>
      )}

      {/* Main Trading Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Crypto Pairs Market List (BTC/USDT to BTS/USDT) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-[680px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Crypto Markets</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
              {pairs.length} Pairs
            </span>
          </div>

          {/* Search Pair */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search crypto (BTC, ETH, BTS...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Pairs Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {filteredPairs.map((pair, idx) => {
              const isSelected = pair.symbol === currentPair.symbol;
              const isPositive = pair.change24h >= 0;
              const isFirst = pair.symbol === 'BTC/USDT';
              const isLast = pair.symbol === 'BTS/USDT';

              return (
                <div
                  key={pair.symbol}
                  onClick={() => setSelectedSymbol(pair.symbol)}
                  className={`p-3 rounded-2xl cursor-pointer border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                      : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {pair.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-white">{pair.symbol}</span>
                        {isFirst && (
                          <span className="text-[9px] font-bold px-1 bg-amber-500/20 text-amber-300 rounded">
                            TOP
                          </span>
                        )}
                        {isLast && (
                          <span className="text-[9px] font-bold px-1 bg-teal-500/20 text-teal-300 rounded">
                            LAST
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{pair.name}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-white font-mono">
                      ${pair.currentPrice.toFixed(pair.precision)}
                    </div>
                    <div className={`text-[10px] font-semibold flex items-center justify-end space-x-0.5 ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isPositive ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                      <span>{isPositive ? '+' : ''}{pair.change24h.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center & Right Columns: Live Chart & Option Execution Desk */}
        <div className="lg:col-span-8 space-y-6">
          {/* Live Chart & Pair Header Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  {currentPair.symbol.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {currentPair.symbol}
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 rounded">
                      {currentPair.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs mt-0.5">
                    <span className="text-2xl font-extrabold text-white font-mono tracking-tight">
                      ${currentPair.currentPrice.toFixed(currentPair.precision)}
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded text-xs flex items-center space-x-0.5 ${
                      currentPair.change24h >= 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {currentPair.change24h >= 0 ? '+' : ''}{currentPair.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 24h High / Low Stats */}
              <div className="grid grid-cols-3 gap-3 text-right">
                <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">24h High</div>
                  <div className="text-xs font-bold text-slate-200 font-mono">
                    ${currentPair.high24h.toFixed(currentPair.precision)}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">24h Low</div>
                  <div className="text-xs font-bold text-slate-200 font-mono">
                    ${currentPair.low24h.toFixed(currentPair.precision)}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">24h Volume</div>
                  <div className="text-xs font-bold text-slate-200 font-mono">
                    {currentPair.volume24h}
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Live Real-Time Market Graph */}
            <div className="relative mt-4 h-56 w-full bg-slate-950/80 rounded-2xl border border-slate-800/80 p-2 overflow-hidden flex flex-col justify-between">
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-rows-4 grid-cols-6 pointer-events-none opacity-10">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="border-b border-r border-emerald-400" />
                ))}
              </div>

              {/* SVG Curve */}
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full preserve-3d"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area under curve */}
                <path d={chartAreaPath} fill="url(#chartGradient)" />
                {/* Line */}
                <path
                  d={chartPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Real-time live pulse on current price point */}
              <div className="absolute top-4 right-4 flex items-center space-x-2 bg-slate-900/90 border border-slate-700 px-3 py-1 rounded-full text-[11px] font-mono text-emerald-400 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Feed • ${currentPair.currentPrice.toFixed(currentPair.precision)}</span>
              </div>
            </div>
          </div>

          {/* Option Trade Order Placement Panel (Timed 30s/60s, Amount, Buy Up/Down) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Options Trading Desk ({currentPair.symbol})</span>
              </h3>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Binary Settle
              </span>
            </div>

            {/* Error Message */}
            {tradeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{tradeError}</span>
              </div>
            )}

            {/* 1. Duration Selection: 30s (+20%), 60s (+40%), 120s (+65%), 300s (+85%) as requested */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>1. Select Trade Duration & Profit Return:</span>
                </span>
                <span className="text-emerald-400 font-bold">
                  {selectedOption.profit}% Profit Return
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {durationOptions.map((opt) => {
                  const isDurActive = selectedDuration === opt.duration;
                  return (
                    <button
                      key={opt.duration}
                      type="button"
                      onClick={() => setSelectedDuration(opt.duration)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isDurActive
                          ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5">
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Amount Input & Quick Presets */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <span className="flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>2. Investment Amount (USDT):</span>
                </span>
                {currentUser && (
                  <span className="text-slate-400">
                    Avail Balance: <strong className="text-emerald-400 font-mono">${currentUser.balance.toFixed(2)}</strong>
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                  $
                </div>
                <input
                  id="trade-amount-input"
                  type="number"
                  min="1"
                  step="1"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder="50"
                  className="w-full pl-8 pr-24 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition"
                />
                <div className="absolute inset-y-0 right-1.5 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentUser) setTradeAmount(Math.floor(currentUser.balance).toString());
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Amount Quick Presets */}
              <div className="flex flex-wrap gap-2 mt-2.5">
                {amountPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTradeAmount(preset.toString())}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition ${
                      tradeAmount === preset.toString()
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Expected Profit Calculation Box */}
            <div className="mb-6 p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Potential Return:</span>
                <div className="text-base font-black text-emerald-400 font-mono">
                  +${potentialProfit.toFixed(2)} USDT ({selectedOption.profit}%)
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Total Settlement Payout:</span>
                <div className="text-base font-black text-white font-mono">
                  ${totalExpectedPayout.toFixed(2)} USDT
                </div>
              </div>
            </div>

            {/* 3. Action Buttons: BUY UP / BUY DOWN as explicitly requested */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* BUY UP (CALL) */}
              <button
                id="trade-buy-up-btn"
                type="button"
                disabled={submitting}
                onClick={() => handleProceedTrade('UP')}
                className="py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-base transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-3 active:scale-[0.98] disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 font-extrabold" />
                </div>
                <div className="text-left">
                  <div>BUY UP (Call)</div>
                  <div className="text-[11px] font-normal text-emerald-100 opacity-90">
                    Predict Price Rise +{selectedOption.profit}%
                  </div>
                </div>
              </button>

              {/* BUY DOWN (PUT) */}
              <button
                id="trade-buy-down-btn"
                type="button"
                disabled={submitting}
                onClick={() => handleProceedTrade('DOWN')}
                className="py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-base transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-3 active:scale-[0.98] disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <ArrowDown className="w-5 h-5 font-extrabold" />
                </div>
                <div className="text-left">
                  <div>BUY DOWN (Put)</div>
                  <div className="text-[11px] font-normal text-rose-100 opacity-90">
                    Predict Price Fall +{selectedOption.profit}%
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Running Trades Live Countdown Area */}
      {userRunningTrades.length > 0 && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Active Option Contracts Running ({userRunningTrades.length})</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono">
              Live Settle Engine Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userRunningTrades.map((t) => {
              const pair = pairs.find(p => p.symbol === t.symbol);
              const livePrice = pair ? pair.currentPrice : t.entryPrice;
              const remainingSec = Math.max(0, Math.ceil((t.expireTime - Date.now()) / 1000));
              const progressPct = Math.min(100, Math.max(0, ((t.duration - remainingSec) / t.duration) * 100));
              const isCurrentlyWinning = t.direction === 'UP' ? livePrice >= t.entryPrice : livePrice <= t.entryPrice;

              return (
                <div
                  key={t.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden"
                >
                  {/* Progress bar line */}
                  <div
                    className="absolute top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-black ${
                        t.direction === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {t.direction === 'UP' ? 'BUY UP ↑' : 'BUY DOWN ↓'}
                      </span>
                      <span className="text-sm font-bold text-white">{t.symbol}</span>
                    </div>

                    {/* Countdown timer */}
                    <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1 rounded-xl text-amber-300 font-mono text-xs font-black border border-amber-500/30">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{remainingSec}s left</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 my-2 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Trade Margin</div>
                      <div className="font-bold text-white font-mono">${t.amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Entry Price</div>
                      <div className="font-bold text-slate-300 font-mono">${t.entryPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Live Price</div>
                      <div className={`font-bold font-mono ${isCurrentlyWinning ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${livePrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Target Profit ({t.profitPercentage}%):</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      +${((t.amount * t.profitPercentage) / 100).toFixed(2)} USDT
                    </span>
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
