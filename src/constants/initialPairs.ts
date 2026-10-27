import { CryptoPair } from '../types';

export const DEFAULT_PAIRS: CryptoPair[] = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', basePrice: 88450.50, currentPrice: 88450.50, change24h: 3.42, high24h: 89600.00, low24h: 86900.00, volume24h: '1.42B', precision: 2, volatility: 8.5 },
  { symbol: 'ETH/USDT', name: 'Ethereum', basePrice: 2840.25, currentPrice: 2840.25, change24h: 2.15, high24h: 2910.00, low24h: 2780.00, volume24h: '840M', precision: 2, volatility: 1.5 },
  { symbol: 'SOL/USDT', name: 'Solana', basePrice: 178.60, currentPrice: 178.60, change24h: 5.84, high24h: 184.20, low24h: 171.10, volume24h: '520M', precision: 2, volatility: 0.25 },
  { symbol: 'BNB/USDT', name: 'BNB Chain', basePrice: 620.30, currentPrice: 620.30, change24h: 1.12, high24h: 632.00, low24h: 612.00, volume24h: '310M', precision: 2, volatility: 0.4 },
  { symbol: 'XRP/USDT', name: 'Ripple', basePrice: 2.3450, currentPrice: 2.3450, change24h: -1.25, high24h: 2.4500, low24h: 2.2800, volume24h: '410M', precision: 4, volatility: 0.005 },
  { symbol: 'DOGE/USDT', name: 'Dogecoin', basePrice: 0.2185, currentPrice: 0.2185, change24h: 4.60, high24h: 0.2310, low24h: 0.2050, volume24h: '280M', precision: 4, volatility: 0.001 },
  { symbol: 'ADA/USDT', name: 'Cardano', basePrice: 0.7840, currentPrice: 0.7840, change24h: 0.95, high24h: 0.8100, low24h: 0.7600, volume24h: '195M', precision: 4, volatility: 0.002 },
  { symbol: 'AVAX/USDT', name: 'Avalanche', basePrice: 32.40, currentPrice: 32.40, change24h: -0.45, high24h: 33.80, low24h: 31.90, volume24h: '160M', precision: 2, volatility: 0.1 },
  { symbol: 'DOT/USDT', name: 'Polkadot', basePrice: 7.85, currentPrice: 7.85, change24h: 1.80, high24h: 8.15, low24h: 7.60, volume24h: '110M', precision: 2, volatility: 0.03 },
  { symbol: 'TRX/USDT', name: 'TRON', basePrice: 0.2450, currentPrice: 0.2450, change24h: 0.40, high24h: 0.2510, low24h: 0.2410, volume24h: '140M', precision: 4, volatility: 0.001 },
  { symbol: 'LINK/USDT', name: 'Chainlink', basePrice: 18.90, currentPrice: 18.90, change24h: 3.10, high24h: 19.50, low24h: 18.20, volume24h: '95M', precision: 2, volatility: 0.05 },
  { symbol: 'LTC/USDT', name: 'Litecoin', basePrice: 94.20, currentPrice: 94.20, change24h: 1.05, high24h: 96.80, low24h: 92.50, volume24h: '85M', precision: 2, volatility: 0.15 },
  { symbol: 'NEAR/USDT', name: 'NEAR Protocol', basePrice: 5.62, currentPrice: 5.62, change24h: -2.30, high24h: 5.95, low24h: 5.48, volume24h: '78M', precision: 2, volatility: 0.02 },
  { symbol: 'SHIB/USDT', name: 'Shiba Inu', basePrice: 0.0000215, currentPrice: 0.0000215, change24h: 6.20, high24h: 0.0000230, low24h: 0.0000201, volume24h: '220M', precision: 7, volatility: 0.0000002 },
  { symbol: 'BTS/USDT', name: 'BitShares', basePrice: 0.003420, currentPrice: 0.003420, change24h: 1.15, high24h: 0.003600, low24h: 0.003310, volume24h: '24M', precision: 6, volatility: 0.000015 },
];
