import React, { useState } from 'react';
import { CryptoPair, CurrencyCode } from '../types';
import { formatCryptoPrice } from '../utils/formatters';
import { Search, TrendingUp, TrendingDown, ChevronRight, Sparkles } from 'lucide-react';

interface MarketListViewProps {
  pairs: CryptoPair[];
  currency: CurrencyCode;
  onSelectCoin: (symbol: string) => void;
}

export const MarketListView: React.FC<MarketListViewProps> = ({
  pairs,
  currency,
  onSelectCoin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gainers' | 'losers'>('all');

  const filteredPairs = pairs.filter((p) => {
    const matchesSearch =
      p.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'gainers') return p.change24h > 0;
    if (filterType === 'losers') return p.change24h < 0;
    return true;
  });

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto animate-fade-in">
      {/* Header & Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Crypto Market Rates
            </h2>
            <p className="text-xs text-slate-500">
              Live spot tickers from BTC/USDT to BTS/USDT • Click any coin to open Candlestick Trade Desk
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({pairs.length})
            </button>
            <button
              onClick={() => setFilterType('gainers')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                filterType === 'gainers'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Top Gainers
            </button>
            <button
              onClick={() => setFilterType('losers')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                filterType === 'losers'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Losers
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search coin name or symbol (e.g. BTC, ETH, BTS)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Coins List Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden divide-y divide-slate-100">
        {/* Table Header for larger screens */}
        <div className="hidden sm:grid grid-cols-12 px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
          <div className="col-span-4">Coin Pair</div>
          <div className="col-span-3 text-right">Live Price ({currency})</div>
          <div className="col-span-2 text-right">24h Change</div>
          <div className="col-span-3 text-right pr-4">24h High / Low</div>
        </div>

        {filteredPairs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No crypto pairs matching "{searchTerm}"
          </div>
        ) : (
          filteredPairs.map((pair, idx) => {
            const isUp = pair.change24h >= 0;
            const symbolRoot = pair.symbol.split('/')[0];

            return (
              <div
                key={pair.symbol}
                onClick={() => onSelectCoin(pair.symbol)}
                className="p-4 sm:px-5 hover:bg-slate-50/80 cursor-pointer transition flex items-center justify-between sm:grid sm:grid-cols-12 group"
              >
                {/* Column 1: Coin Info */}
                <div className="sm:col-span-4 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-extrabold text-slate-800 text-xs shadow-xs group-hover:border-emerald-500/40 group-hover:bg-emerald-50/40 transition">
                    {symbolRoot.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-600 transition">
                        {pair.symbol}
                      </span>
                      {idx === 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          TOP 1
                        </span>
                      )}
                      {pair.symbol === 'BTS/USDT' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                          END
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 block">{pair.name}</span>
                  </div>
                </div>

                {/* Column 2: Live Price */}
                <div className="sm:col-span-3 text-right">
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base font-mono">
                    {formatCryptoPrice(pair.currentPrice, pair.precision, currency)}
                  </div>
                  <div className="text-[10px] text-slate-400 sm:hidden">
                    24h High: {formatCryptoPrice(pair.high24h, pair.precision, currency)}
                  </div>
                </div>

                {/* Column 3: 24h Change */}
                <div className="sm:col-span-2 text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                      isUp
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-3 h-3 mr-1 text-emerald-600" /> : <TrendingDown className="w-3 h-3 mr-1 text-rose-600" />}
                    {isUp ? '+' : ''}{pair.change24h.toFixed(2)}%
                  </span>
                </div>

                {/* Column 4: 24h High / Low & Action */}
                <div className="hidden sm:col-span-3 sm:flex items-center justify-end space-x-3 text-right">
                  <div className="text-xs text-slate-500 font-mono">
                    <div>H: {formatCryptoPrice(pair.high24h, pair.precision, currency)}</div>
                    <div className="text-slate-400">L: {formatCryptoPrice(pair.low24h, pair.precision, currency)}</div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition shadow-xs">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
