import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CryptoPair, CandleData, CurrencyCode } from '../types';
import { formatCryptoPrice } from '../utils/formatters';

interface CandleChartProps {
  pair: CryptoPair;
  currency: CurrencyCode;
}

type Timeframe = '1m' | '5m' | '15m' | '1h';

export const CandleChart: React.FC<CandleChartProps> = ({ pair, currency }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  // Measure container width for responsive SVG rendering
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Generate realistic candle series connected seamlessly to current live price
  useEffect(() => {
    const count = 35;
    const now = Date.now();
    const intervalMs = timeframe === '1m' ? 60000 : timeframe === '5m' ? 300000 : timeframe === '15m' ? 900000 : 3600000;
    const volatility = pair.currentPrice * 0.0025;
    
    // Build candles backwards from live price so the latest candle's open price
    // is realistically centered around current price rather than artificially depressed
    const candlesBackwards: CandleData[] = [];
    const currentIntervalTime = Math.floor(now / intervalMs) * intervalMs;
    
    // Latest active candle (can be green or red depending on micro-drift)
    const openOffset = (Math.random() - 0.5) * volatility * 0.4;
    const latestOpen = Number(Math.max(0.000001, pair.currentPrice - openOffset).toFixed(pair.precision));
    const latestHigh = Number(Math.max(latestOpen, pair.currentPrice, pair.high24h > pair.currentPrice ? pair.currentPrice + Math.random() * volatility * 0.3 : pair.currentPrice).toFixed(pair.precision));
    const latestLow = Number(Math.min(latestOpen, pair.currentPrice, pair.low24h < pair.currentPrice ? pair.currentPrice - Math.random() * volatility * 0.3 : pair.currentPrice).toFixed(pair.precision));

    candlesBackwards.push({
      time: currentIntervalTime,
      open: latestOpen,
      high: latestHigh,
      low: latestLow,
      close: pair.currentPrice,
      volume: Math.floor(Math.random() * 8000 + 4000),
    });

    let walkingPrice = latestOpen;

    // Preceding historical candles generated backwards in time
    for (let i = 1; i < count; i++) {
      const time = currentIntervalTime - i * intervalMs;
      const close = walkingPrice;
      const delta = (Math.random() - 0.5) * volatility * 1.6;
      const open = Number(Math.max(0.000001, close - delta).toFixed(pair.precision));
      const wickTop = Math.random() * volatility * 0.5;
      const wickBottom = Math.random() * volatility * 0.5;
      const high = Number((Math.max(open, close) + wickTop).toFixed(pair.precision));
      const low = Number(Math.max(0.000001, Math.min(open, close) - wickBottom).toFixed(pair.precision));
      const volume = Math.floor(Math.random() * 14000 + 3000);

      candlesBackwards.push({
        time,
        open,
        high,
        low,
        close,
        volume,
      });

      walkingPrice = open;
    }

    // Chronological order (oldest to newest)
    setCandles(candlesBackwards.reverse());
  }, [pair.symbol, timeframe]);

  // Update latest candle on live price change with natural up/down motion & interval rollover
  useEffect(() => {
    setCandles(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      const last = { ...updated[lastIndex] };
      const intervalMs = timeframe === '1m' ? 60000 : timeframe === '5m' ? 300000 : timeframe === '15m' ? 900000 : 3600000;
      const now = Date.now();
      const currentIntervalStart = Math.floor(now / intervalMs) * intervalMs;

      // When interval expires, seal the current candle and roll into a fresh candle
      if (currentIntervalStart > last.time) {
        const newCandle: CandleData = {
          time: currentIntervalStart,
          open: last.close,
          high: Math.max(last.close, pair.currentPrice),
          low: Math.min(last.close, pair.currentPrice),
          close: pair.currentPrice,
          volume: Math.floor(Math.random() * 2000 + 1000),
        };
        return [...updated.slice(1), newCandle];
      }

      // Live update of current candle
      last.close = pair.currentPrice;
      if (pair.currentPrice > last.high) last.high = pair.currentPrice;
      if (pair.currentPrice < last.low) last.low = pair.currentPrice;
      updated[lastIndex] = last;
      return updated;
    });
  }, [pair.currentPrice, timeframe]);

  // Chart dimensions & scaling
  const height = 300;
  const padding = { top: 20, right: 65, bottom: 40, left: 10 };
  const chartWidth = Math.max(containerWidth - padding.left - padding.right, 240);
  const chartHeight = height - padding.top - padding.bottom;

  // Price range calculation
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 1, priceRange: 1 };
    let min = Infinity;
    let max = -Infinity;
    candles.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });
    // Add 5% buffer top & bottom
    const span = max - min || 1;
    const bufferedMin = Math.max(0, min - span * 0.05);
    const bufferedMax = max + span * 0.05;
    return {
      minPrice: bufferedMin,
      maxPrice: bufferedMax,
      priceRange: bufferedMax - bufferedMin || 1,
    };
  }, [candles]);

  // Max volume for volume histogram
  const maxVolume = useMemo(() => {
    return Math.max(...candles.map(c => c.volume), 1);
  }, [candles]);

  const candleWidth = useMemo(() => {
    const total = candles.length || 1;
    return Math.max(4, Math.min(14, (chartWidth / total) * 0.7));
  }, [candles.length, chartWidth]);

  // Convert price to Y coordinate
  const getY = (price: number) => {
    return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  // Convert index to X coordinate
  const getX = (index: number) => {
    if (candles.length <= 1) return padding.left;
    return padding.left + (index / (candles.length - 1)) * chartWidth;
  };

  // Moving Average MA7
  const ma7Points = useMemo(() => {
    if (candles.length < 7) return '';
    const points: string[] = [];
    for (let i = 6; i < candles.length; i++) {
      const slice = candles.slice(i - 6, i + 1);
      const avg = slice.reduce((sum, c) => sum + c.close, 0) / 7;
      const x = getX(i);
      const y = getY(avg);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }, [candles, minPrice, maxPrice, chartWidth]);

  // Price Grid Lines (4 horizontal lines)
  const gridLines = useMemo(() => {
    const lines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const price = minPrice + (priceRange / steps) * i;
      const y = getY(price);
      lines.push({ price, y });
    }
    return lines;
  }, [minPrice, priceRange]);

  const currentPriceY = getY(pair.currentPrice);
  const isUp = pair.change24h >= 0;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 select-none">
      {/* Timeframe & Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1">
          {(['1m', '5m', '15m', '1h'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                timeframe === tf
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
          <span className="hidden sm:inline-flex items-center text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded ml-2 border border-amber-200">
            MA(7)
          </span>
        </div>

        {/* Hover / Current Candle Info */}
        <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500">
          {hoveredCandle ? (
            <>
              <span>O: <strong className="text-slate-800">{hoveredCandle.open}</strong></span>
              <span>H: <strong className="text-emerald-600">{hoveredCandle.high}</strong></span>
              <span>L: <strong className="text-rose-600">{hoveredCandle.low}</strong></span>
              <span>C: <strong className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-600' : 'text-rose-600'}>{hoveredCandle.close}</strong></span>
            </>
          ) : (
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600 font-sans font-semibold">Live Candlestick Feed</span>
            </span>
          )}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="w-full relative overflow-hidden">
        <svg
          width="100%"
          height={height}
          className="overflow-visible"
          onMouseLeave={() => setHoveredCandle(null)}
        >
          {/* Horizontal Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={padding.left + chartWidth}
                y2={line.y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={padding.left + chartWidth + 8}
                y={line.y + 4}
                fill="#64748b"
                fontSize={10}
                fontFamily="monospace"
              >
                {line.price > 100 ? line.price.toFixed(1) : line.price.toFixed(pair.precision)}
              </text>
            </g>
          ))}

          {/* Volume Sub-chart (bottom 15% of chart) */}
          {candles.map((c, idx) => {
            const x = getX(idx);
            const isBull = c.close >= c.open;
            const volHeight = Math.max(2, (c.volume / maxVolume) * (chartHeight * 0.18));
            const volY = padding.top + chartHeight - volHeight;
            return (
              <rect
                key={`vol-${idx}`}
                x={x - candleWidth / 2}
                y={volY}
                width={candleWidth}
                height={volHeight}
                fill={isBull ? '#10b981' : '#f43f5e'}
                opacity={0.25}
              />
            );
          })}

          {/* Candlestick Wicks & Bodies */}
          {candles.map((c, idx) => {
            const x = getX(idx);
            const isBull = c.close >= c.open;
            const highY = getY(c.high);
            const lowY = getY(c.low);
            const openY = getY(c.open);
            const closeY = getY(c.close);
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
            const color = isBull ? '#10b981' : '#f43f5e';

            return (
              <g
                key={`candle-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredCandle(c)}
              >
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={color}
                  strokeWidth={1.5}
                />
                {/* Candle Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyY}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  rx={1}
                />
              </g>
            );
          })}

          {/* MA7 Curve */}
          {ma7Points && (
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeOpacity={0.85}
              points={ma7Points}
            />
          )}

          {/* Current Live Price Line & Tag */}
          {currentPriceY >= padding.top && currentPriceY <= padding.top + chartHeight && (
            <g>
              <line
                x1={padding.left}
                y1={currentPriceY}
                x2={padding.left + chartWidth}
                y2={currentPriceY}
                stroke={isUp ? '#10b981' : '#f43f5e'}
                strokeWidth={1.2}
                strokeDasharray="4 2"
              />
              <rect
                x={padding.left + chartWidth + 2}
                y={currentPriceY - 10}
                width={56}
                height={20}
                fill={isUp ? '#10b981' : '#f43f5e'}
                rx={4}
              />
              <text
                x={padding.left + chartWidth + 6}
                y={currentPriceY + 4}
                fill="#ffffff"
                fontSize={10}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {pair.currentPrice > 1000 ? pair.currentPrice.toFixed(0) : pair.currentPrice.toFixed(pair.precision > 2 ? 4 : 2)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
        <span>24h High: <strong className="text-slate-800">{formatCryptoPrice(pair.high24h, pair.precision, currency)}</strong></span>
        <span>24h Low: <strong className="text-slate-800">{formatCryptoPrice(pair.low24h, pair.precision, currency)}</strong></span>
        <span>24h Vol: <strong className="text-slate-800">{pair.volume24h} USDT</strong></span>
      </div>
    </div>
  );
};
