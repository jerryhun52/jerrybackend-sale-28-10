import React, { useState } from 'react';
import { CurrencyCode, CURRENCIES } from '../types';
import { X, Check, Globe, Lock, AlertCircle } from 'lucide-react';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCurrency: CurrencyCode;
  onSelectCurrency: (code: CurrencyCode) => void;
  isLoggedIn?: boolean;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  currentCurrency,
  onSelectCurrency,
  isLoggedIn = false,
}) => {
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const list: CurrencyCode[] = ['USD', 'INR', 'PKR', 'BRL', 'EGP'];

  const handleAttemptSelect = (code: CurrencyCode) => {
    if (isLoggedIn && code !== currentCurrency) {
      setNoticeMsg(`Account currency is fixed to ${currentCurrency} (${CURRENCIES[currentCurrency]?.symbol || ''}) selected at registration.`);
      setTimeout(() => setNoticeMsg(null), 4000);
      return;
    }
    onSelectCurrency(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-bold text-slate-900 text-base">Account Currency</h3>
                {isLoggedIn && (
                  <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-full flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Fixed</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isLoggedIn ? 'Your account currency is locked' : 'Choose display & calculation currency'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoggedIn && (
          <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Your account currency is registered as <strong>{currentCurrency} ({CURRENCIES[currentCurrency]?.symbol})</strong> and remains fixed for all trading & withdrawals.
            </span>
          </div>
        )}

        {noticeMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-bounce-short">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{noticeMsg}</span>
          </div>
        )}

        <div className="mt-4 space-y-2.5">
          {list.map((code) => {
            const config = CURRENCIES[code];
            const isSelected = currentCurrency === code;
            const isDisabled = isLoggedIn && !isSelected;

            return (
              <button
                key={code}
                onClick={() => handleAttemptSelect(code)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 text-slate-900 shadow-sm font-bold'
                    : isDisabled
                    ? 'border-slate-100 bg-slate-50/60 text-slate-400 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{config.flag}</span>
                  <div className="text-left">
                    <div className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                      <span>{config.code}</span>
                      <span className="text-xs font-normal text-slate-500">({config.symbol})</span>
                    </div>
                    <div className="text-xs text-slate-500">{config.name}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : isDisabled ? (
                    <Lock className="w-4 h-4 text-slate-400" />
                  ) : (
                    <span className="text-xs font-mono font-medium text-slate-500">
                      {code === 'USD' ? '1 USD = $1' : `1 USD = ${config.symbol}${config.rate}`}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            {isLoggedIn
              ? 'Multi-currency registration ensures exact local settlements.'
              : 'Real-time currency conversion is applied across all balances, trading margins, and payouts.'}
          </p>
        </div>
      </div>
    </div>
  );
};
