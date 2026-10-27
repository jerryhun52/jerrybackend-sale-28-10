import { CurrencyCode, CURRENCIES } from '../types';

export function formatMoney(amount: number, currency: CurrencyCode = 'USD'): string {
  const config = CURRENCIES[currency] || CURRENCIES.USD;
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;

  if (currency === 'USD' || currency === 'USDT') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  }

  if (currency === 'INR') {
    return `${config.symbol} ${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)}`;
  }

  if (currency === 'PKR') {
    return `${config.symbol} ${new Intl.NumberFormat('ur-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)}`;
  }

  if (currency === 'BRL') {
    return `${config.symbol} ${new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)}`;
  }

  if (currency === 'EGP') {
    return `${config.symbol} ${new Intl.NumberFormat('en-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)}`;
  }

  return `${config?.symbol || '$'} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCryptoPrice(priceInUSD: number, precision: number = 2, currency: CurrencyCode = 'USD'): string {
  const config = CURRENCIES[currency] || CURRENCIES.USD;
  const converted = (priceInUSD || 0) * (config?.rate || 1.0);

  if (currency === 'USD') {
    if (precision > 4) {
      return `$${converted.toFixed(precision)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Math.min(precision, 2),
      maximumFractionDigits: precision,
    }).format(converted);
  }

  return `${config?.symbol || '$'} ${converted.toFixed(precision)}`;
}
