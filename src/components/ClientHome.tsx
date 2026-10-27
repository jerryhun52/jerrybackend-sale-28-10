import React from 'react';
import { User, CryptoPair, WalletRequest, Trade, CurrencyCode, CURRENCIES } from '../types';
import { formatMoney, formatCryptoPrice } from '../utils/formatters';
import { 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Headphones, 
  Globe, 
  User as UserIcon, 
  LogIn, 
  BarChart3, 
  Users, 
  Percent, 
  Shield, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ClientHomeProps {
  user: User | null;
  pairs: CryptoPair[];
  walletRequests: WalletRequest[];
  userTrades: Trade[];
  currency: CurrencyCode;
  onOpenCurrencyModal: () => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw: () => void;
  onGoToTrade: (symbol?: string) => void;
  onGoToMarket: () => void;
  onOpenAuth: () => void;
}

export const ClientHome: React.FC<ClientHomeProps> = ({
  user,
  pairs,
  walletRequests,
  userTrades,
  currency,
  onOpenCurrencyModal,
  onOpenWithdraw,
  onGoToTrade,
  onGoToMarket,
  onOpenAuth,
}) => {
  const currConfig = CURRENCIES[currency] || CURRENCIES.USD;

  // Marquee list of top ticker coins
  const tickerItems = [
    { icon: '🚀', symbol: 'BTC', price: '$107,250', change: '+2.4%' },
    { icon: '💎', symbol: 'ETH', price: '$6,850', change: '+1.8%' },
    { icon: '🟢', symbol: 'BNB', price: '$1,245', change: '+3.1%' },
    { icon: '🔥', symbol: 'SOL', price: '$385', change: '+4.7%' },
    { icon: '⚡', symbol: 'XRP', price: '$4.12', change: '+2.2%' },
    { icon: '🐶', symbol: 'DOGE', price: '$0.48', change: '+5.6%' },
    { icon: '🐸', symbol: 'PEPE', price: '$0.000018', change: '+8.4%' },
  ];

  // Market quotes ranked list
  const marketQuotes = [
    { rank: 1, symbol: 'BTC / USDT', name: 'Bitcoin', price: 107250, change: 2.4, color: 'from-amber-400 to-orange-500', logo: '₿' },
    { rank: 2, symbol: 'ETH / USDT', name: 'Ethereum', price: 6850, change: 1.8, color: 'from-blue-400 to-indigo-600', logo: '♦' },
    { rank: 3, symbol: 'BNB / USDT', name: 'BNB', price: 1245, change: 3.1, color: 'from-yellow-400 to-amber-500', logo: 'BNB' },
    { rank: 4, symbol: 'SOL / USDT', name: 'Solana', price: 385, change: 4.7, color: 'from-purple-400 to-pink-500', logo: '◎' },
    { rank: 5, symbol: 'XRP / USDT', name: 'Ripple', price: 4.12, change: 2.2, color: 'from-cyan-400 to-blue-500', logo: '✕' },
    { rank: 6, symbol: 'DOGE / USDT', name: 'Dogecoin', price: 0.48, change: 5.6, color: 'from-amber-300 to-yellow-600', logo: 'Ð' },
    { rank: 7, symbol: 'PEPE / USDT', name: 'Pepe', price: 0.000018, change: 8.4, color: 'from-emerald-400 to-teal-500', logo: '🐸' },
  ];

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto animate-fade-in text-white font-sans">
      
      {/* 1. HERO SECTION (Matching Screenshot 1 & 2) */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0a1124] to-[#080d1a] border border-cyan-500/20 rounded-3xl p-6 sm:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        
        {/* Subtle Ambient Background Lighting */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headline, Subtitle, CTAs, 4-Features Grid */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Trusted Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0d1b33] border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-sm">
              <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px]">
                🛡️
              </span>
              <span>Trusted by Traders Worldwide</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                <span className="block text-white">Trade Smarter,</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Invest Better,
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Grow Together.
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
              Professional crypto trading platform with advanced tools, secure wallet, fast withdrawals and real-time market data.
            </p>

            {/* 1. Download Mobile App Card (Ultra Professional Trader Release Theme) */}
            <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0c1f38] via-[#08152b] to-[#0a1122] border border-cyan-500/40 shadow-[0_12px_35px_rgba(6,182,212,0.15)] space-y-4">
              
              {/* Background Accent Glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
                    📱
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="font-black text-white text-base tracking-tight">CELLS FLOWNEX Mobile App</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        <span>v2.4 Official Android</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      60s Options, Real-time Binance Charts, 100% Virus-Free & Fast Local Withdrawals
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                  <span className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold flex items-center space-x-1">
                    <span>⚡ 100% Verified</span>
                  </span>
                </div>
              </div>

              {/* 2 Clean Download Buttons (Direct APK Download & Google Drive Cloud Download) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 relative z-10">
                <a
                  href="/api/download-apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2.5 px-5 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-emerald-500/25 transition transform active:scale-95 cursor-pointer text-center"
                >
                  <span className="text-base">⬇️</span>
                  <div className="text-left">
                    <div className="font-black leading-none">Direct APK Download</div>
                    <div className="text-[10px] font-bold text-slate-900/80 mt-0.5">High Speed Direct Server File</div>
                  </div>
                </a>
                
                <a
                  href="/api/download-drive"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2.5 px-5 py-3.5 bg-[#0d1e38] hover:bg-[#122848] text-cyan-300 font-black rounded-2xl text-xs border border-cyan-500/40 shadow-md transition transform active:scale-95 cursor-pointer text-center"
                >
                  <span className="text-base">📁</span>
                  <div className="text-left">
                    <div className="font-black text-white leading-none">Google Drive / Cloud Download</div>
                    <div className="text-[10px] font-semibold text-cyan-400/90 mt-0.5">External Mirror Cloud Link</div>
                  </div>
                </a>
              </div>

            </div>

            {/* 2. Account CTAs (Create Account / Login) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => {
                  if (user) {
                    onGoToTrade();
                  } else {
                    onOpenAuth();
                  }
                }}
                className="flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-cyan-500/25 transition transform active:scale-95 cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-white" />
                <span>{user ? 'Trade 60s Options' : 'Create Account'}</span>
              </button>

              <button
                onClick={() => {
                  if (user) {
                    onOpenWithdraw();
                  } else {
                    onOpenAuth();
                  }
                }}
                className="flex items-center space-x-2 px-6 py-3.5 bg-[#0a162c] hover:bg-[#0f2142] border border-cyan-500/40 text-cyan-300 font-extrabold rounded-2xl text-sm shadow-md transition transform active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-cyan-400" />
                <span>{user ? 'Withdrawal Amount' : 'Login Account'}</span>
              </button>
            </div>

            {/* 4 Feature Badges (Matching Screenshot 1 & 2) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
              
              {/* 1 */}
              <div className="flex flex-col items-start space-y-1">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white leading-tight">Bank Level Security</div>
                <div className="text-[10px] text-slate-400">256-bit SSL Encryption</div>
              </div>

              {/* 2 */}
              <div className="flex flex-col items-start space-y-1">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white leading-tight">Instant Withdrawals</div>
                <div className="text-[10px] text-slate-400">Fast & Reliable</div>
              </div>

              {/* 3 */}
              <div className="flex flex-col items-start space-y-1">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white leading-tight">24/7 Live Support</div>
                <div className="text-[10px] text-slate-400">We're Here For You</div>
              </div>

              {/* 4 */}
              <div className="flex flex-col items-start space-y-1">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white leading-tight">Global Platform</div>
                <div className="text-[10px] text-slate-400">Trusted Worldwide</div>
              </div>

            </div>

          </div>

          {/* Right Column: Holographic Glowing Bitcoin Sphere (Matching Screenshot 1) */}
          <div className="lg:col-span-5 flex items-center justify-center py-6">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              
              {/* Outer pulsing neon ring */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/30 bg-gradient-to-tr from-cyan-500/10 to-blue-600/10 blur-md animate-pulse-glow" />
              
              {/* Middle circular portal */}
              <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-[#081226] border-2 border-cyan-400/50 shadow-[0_0_50px_rgba(6,182,212,0.3)] flex items-center justify-center relative overflow-hidden">
                
                {/* Background grid scanlines */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
                
                {/* Glowing Bitcoin Symbol */}
                <div className="relative text-cyan-400 text-7xl sm:text-8xl font-black drop-shadow-[0_0_20px_rgba(56,189,248,0.8)] select-none">
                  ₿
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 2. REAL-TIME LIVE MOVING TICKER MARQUEE (Right to Left continuous stream) */}
      <div className="relative overflow-hidden bg-[#0a1224] border border-cyan-500/20 rounded-2xl py-3 px-4 shadow-md">
        <div className="flex items-center">
          <div className="animate-marquee space-x-6 text-xs font-mono font-bold whitespace-nowrap">
            {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
              <div key={idx} className="inline-flex items-center space-x-2">
                <span>{item.icon}</span>
                <span className="text-white font-extrabold">{item.symbol}</span>
                <span className="text-cyan-300">{item.price}</span>
                <span className="text-emerald-400">▲{item.change}</span>
                <span className="text-slate-600">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 4 GLOSSY STATS BOXES (Matching Screenshot 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Box 1 */}
        <div className="glossy-card rounded-2xl p-4 text-center group hover:border-cyan-400/40 transition">
          <div className="w-9 h-9 mx-auto rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-2">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-cyan-400 tracking-tight">24+</div>
          <div className="text-xs text-slate-300 font-medium mt-0.5">Trading Pairs</div>
        </div>

        {/* Box 2 */}
        <div className="glossy-card rounded-2xl p-4 text-center group hover:border-cyan-400/40 transition">
          <div className="w-9 h-9 mx-auto rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2">
            <Percent className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-cyan-400 tracking-tight">0.01%</div>
          <div className="text-xs text-slate-300 font-medium mt-0.5">Minimum Fee</div>
        </div>

        {/* Box 3 */}
        <div className="glossy-card rounded-2xl p-4 text-center group hover:border-cyan-400/40 transition">
          <div className="w-9 h-9 mx-auto rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-cyan-400 tracking-tight">99.9%</div>
          <div className="text-xs text-slate-300 font-medium mt-0.5">Uptime & Reliability</div>
        </div>

        {/* Box 4 */}
        <div className="glossy-card rounded-2xl p-4 text-center group hover:border-cyan-400/40 transition">
          <div className="w-9 h-9 mx-auto rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-cyan-400 tracking-tight">1M+</div>
          <div className="text-xs text-slate-300 font-medium mt-0.5">Happy Users</div>
        </div>

      </div>

      {/* 4. MARKET QUOTES (Matching Screenshot 3) */}
      <div className="glossy-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📊</span>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Market Quotes
            </h2>
          </div>
          <button
            onClick={onGoToMarket}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quotes List */}
        <div className="space-y-2.5">
          {marketQuotes.map((item) => (
            <div
              key={item.symbol}
              onClick={() => onGoToTrade(item.symbol.split(' ')[0])}
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#091224]/80 hover:bg-[#0d1a33] border border-cyan-500/15 hover:border-cyan-400/40 transition cursor-pointer group"
            >
              {/* Rank & Coin Icon & Name */}
              <div className="flex items-center space-x-3.5">
                <span className="text-xs font-mono font-bold text-slate-400 w-4">
                  {item.rank}
                </span>
                
                {/* Coin Icon */}
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center font-black text-white text-sm shadow-md`}>
                  {item.logo}
                </div>

                <div>
                  <div className="text-sm font-black text-white group-hover:text-cyan-300 transition">
                    {item.symbol}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {item.name}
                  </div>
                </div>
              </div>

              {/* Price & Percentage */}
              <div className="text-right">
                <div className="text-sm sm:text-base font-extrabold font-mono text-white">
                  ${item.price.toLocaleString()}
                </div>
                <div className="text-xs font-extrabold font-mono text-emerald-400">
                  +{item.change}%
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

