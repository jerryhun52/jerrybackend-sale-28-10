import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, AdminUser, CurrencyCode, CURRENCIES } from '../types';
import { 
  User as UserIcon, 
  Lock, 
  X, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  Globe,
  ChevronDown,
  Check,
  Zap,
  Tag
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  onAdminSuccess?: (admin: AdminUser) => void;
  initialMode?: 'login' | 'register';
}

interface CountryCurrencyOption {
  code: CurrencyCode;
  country: string;
  currency: string;
  symbol: string;
  flag: string;
}

const COUNTRY_CURRENCY_LIST: CountryCurrencyOption[] = [
  { code: 'USD', country: 'United States & International', currency: 'US Dollar (USD)', symbol: '$', flag: '🇺🇸' },
  { code: 'INR', country: 'India', currency: 'Indian Rupee (INR)', symbol: '₹', flag: '🇮🇳' },
  { code: 'PKR', country: 'Pakistan', currency: 'Pakistani Rupee (PKR)', symbol: '₨', flag: '🇵🇰' },
  { code: 'BRL', country: 'Brazil', currency: 'Brazilian Real (BRL)', symbol: 'R$', flag: '🇧🇷' },
  { code: 'EGP', country: 'Egypt', currency: 'Egyptian Pound (EGP)', symbol: 'E£', flag: '🇪🇬' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onAdminSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [showCountrySelectorWindow, setShowCountrySelectorWindow] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [lastSuggestedId, setLastSuggestedId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check URL referral code & saved username on modal open
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError(null);
      const urlParams = new URLSearchParams(window.location.search);
      const urlRef = urlParams.get('ref') || urlParams.get('invite') || urlParams.get('code') || urlParams.get('referral');
      if (urlRef) {
        setReferralCode(urlRef.trim().toUpperCase());
        setMode('register');
      }

      const saved = localStorage.getItem('last_login_username') || localStorage.getItem('last_registered_username');
      if (saved) {
        setLastSuggestedId(saved);
        if (!loginIdentifier) {
          setLoginIdentifier(saved);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSelectedCountry = COUNTRY_CURRENCY_LIST.find(c => c.code === selectedCurrency) || COUNTRY_CURRENCY_LIST[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      const cleanUser = username.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();
      const cleanFull = fullName.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();
      const cleanPass = password.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();
      const cleanConfirm = confirmPassword.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();
      const cleanRef = referralCode.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();

      if (!cleanUser) {
        setError('1. Username is required');
        return;
      }
      if (!cleanFull) {
        setError('2. Full Name is required');
        return;
      }
      if (!cleanPass) {
        setError('3. Password is required');
        return;
      }
      if (cleanPass.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (!cleanConfirm) {
        setError('4. Confirm Password is required');
        return;
      }
      if (cleanPass !== cleanConfirm && cleanPass.toLowerCase() !== cleanConfirm.toLowerCase()) {
        setError('Password and Confirm Password do not match');
        return;
      }
      if (!selectedCurrency) {
        setError('5. Please select your Country & Currency');
        return;
      }
      if (!cleanRef) {
        setError('6. Referral / Agent Code is required. Registration is by invitation only.');
        return;
      }

      setLoading(true);
      try {
        const res = await api.register(
          cleanUser, 
          cleanPass, 
          cleanFull, 
          undefined, 
          selectedCurrency,
          cleanRef
        );
        localStorage.setItem('last_login_username', cleanUser);
        localStorage.setItem('last_registered_username', cleanUser);
        localStorage.setItem('app_currency', selectedCurrency);
        onSuccess(res.user);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      const cleanIdentifier = loginIdentifier.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();
      const cleanPassword = password.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();

      if (!cleanIdentifier || !cleanPassword) {
        setError('Please enter your username and password');
        return;
      }

      setLoading(true);

      try {
        let res;
        try {
          // 1. Try with cleaned credentials first (solves mobile keyboard spacebar/autocorrect bug)
          res = await api.login(cleanIdentifier, cleanPassword);
        } catch (initialErr: any) {
          // 2. Fallback to raw password if intentionally spaced
          res = await api.login(cleanIdentifier, password);
        }

        localStorage.setItem('last_login_username', cleanIdentifier);

        if (res.isAdmin && res.admin) {
          if (onAdminSuccess) {
            onAdminSuccess(res.admin);
          } else {
            localStorage.setItem('crypto_admin', JSON.stringify(res.admin));
            window.location.reload();
          }
          onClose();
          return;
        }

        if (res.user) {
          if (res.user.currency) {
            localStorage.setItem('app_currency', res.user.currency);
          }
          onSuccess(res.user);
        }
        onClose();
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md my-8 space-y-4">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0284c7] via-[#2563eb] to-[#06b6d4] p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0b1329] rounded-[14px] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <circle cx="12" cy="12" r="9" stroke="url(#flowModalGrad)" strokeWidth="1.8" />
                  <path d="M7 12C7 9.5 9 8 12 8C15 8 17 9.5 17 12C17 14.5 15 16 12 16C9 16 7 14.5 7 12Z" stroke="#38bdf8" strokeWidth="1.4" />
                  <path d="M12 5V19M8 8.5L16 15.5" stroke="#bae6fd" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
                  <defs>
                    <linearGradient id="flowModalGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#06b6d4" />
                      <stop offset="0.5" stopColor="#3b82f6" />
                      <stop offset="1" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <span className="text-2xl font-black italic tracking-wider text-white">
              CELLS FLOWNEX
            </span>
          </div>
          <div className="text-[10px] font-bold tracking-widest text-cyan-400 mt-1 uppercase">
            TRADE • INVEST • GROW
          </div>
        </div>

        {/* Main Card */}
        <div className="relative bg-[#0a1122]/95 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl text-white overflow-hidden">
          
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Glowing Center Icon */}
          <div className="flex justify-center -mt-2 mb-4">
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 p-[2px] shadow-[0_0_20px_rgba(6,182,212,0.35)]">
              <div className="w-full h-full bg-[#091122] rounded-full flex items-center justify-center text-cyan-300">
                {mode === 'register' ? (
                  <UserIcon className="w-6 h-6 stroke-[2.2]" />
                ) : (
                  <Lock className="w-6 h-6 stroke-[2.2]" />
                )}
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-black tracking-tight text-white">
              {mode === 'register' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'register' ? 'Fill the 5 mandatory details to register your account' : 'Sign in to access your assets & orders'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <span className="font-bold">Notice:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
            
            {mode === 'register' ? (
              <>
                {/* 1. USERNAME */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    1. Username <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <input
                      type="text"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#060c18] border border-cyan-500/25 rounded-2xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    />
                  </div>
                </div>

                {/* 2. FULL NAME */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    2. Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    </div>
                    <input
                      type="text"
                      required
                      autoCapitalize="words"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#060c18] border border-cyan-500/25 rounded-2xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    />
                  </div>
                </div>

                {/* 3. PASSWORD */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    3. Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-cyan-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="new-password"
                      spellCheck={false}
                      placeholder="Enter password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-[#060c18] border border-cyan-500/25 rounded-2xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 4. CONFIRM PASSWORD */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    4. Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-cyan-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="new-password"
                      spellCheck={false}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-[#060c18] border border-cyan-500/25 rounded-2xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 5. COUNTRY & CURRENCY SELECTOR (GARAGE WINDOW POPUP) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>5. Country & Currency <span className="text-rose-400">*</span></span>
                    <span className="text-[10px] text-cyan-400 font-bold">Mandatory</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCountrySelectorWindow(true)}
                    className="w-full px-3.5 py-2.5 bg-[#060c18] hover:bg-[#0c162c] border border-cyan-500/35 hover:border-cyan-400 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center justify-between transition cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl">{currentSelectedCountry.flag}</span>
                      <div className="text-left">
                        <div className="font-extrabold text-white text-xs leading-tight">
                          {currentSelectedCountry.country}
                        </div>
                        <div className="text-[11px] text-cyan-300 font-mono">
                          {currentSelectedCountry.code} ({currentSelectedCountry.symbol})
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400 group-hover:text-cyan-300">
                      <span className="text-[11px] font-semibold">Select</span>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                </div>

                {/* 6. REFERRAL / INVITATION CODE (MANDATORY) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <span>Referral / Agent Code</span>
                      <span className="text-rose-400 font-bold">*</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wide">
                      Mandatory
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Tag className="w-4 h-4 text-cyan-400" />
                    </div>
                    <input
                      type="text"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Enter Agent / Referral Code (e.g. tesla@123)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#060c18] border border-cyan-500/40 focus:border-cyan-400 rounded-2xl text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Registration by invitation only</span>
                    {!referralCode && (
                      <button
                        type="button"
                        onClick={() => setReferralCode('tesla@123')}
                        className="text-cyan-400 hover:text-cyan-300 font-mono font-bold cursor-pointer"
                      >
                        Use tesla@123
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Login: Username or Email */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Username
                    </label>
                    {lastSuggestedId && (
                      <button
                        type="button"
                        onClick={() => setLoginIdentifier(lastSuggestedId)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline"
                      >
                        Last ID: {lastSuggestedId}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <input
                      type="text"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Enter registered username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#060c18] border border-cyan-500/25 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    />
                  </div>
                  {lastSuggestedId && loginIdentifier !== lastSuggestedId && (
                    <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-slate-400">
                      <span>Suggested:</span>
                      <button
                        type="button"
                        onClick={() => setLoginIdentifier(lastSuggestedId)}
                        className="px-2 py-0.5 bg-cyan-950/60 border border-cyan-700/50 rounded-lg text-cyan-300 font-bold hover:bg-cyan-900 transition cursor-pointer"
                      >
                        {lastSuggestedId}
                      </button>
                    </div>
                  )}
                </div>

                {/* Login: Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-cyan-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="new-password"
                      spellCheck={false}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-[#060c18] border border-cyan-500/25 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:opacity-95 text-white font-extrabold rounded-2xl shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 text-sm flex items-center justify-center space-x-2 cursor-pointer mt-3"
            >
              <span>
                {loading
                  ? 'Please wait...'
                  : mode === 'register'
                  ? 'Create Account'
                  : 'Login to Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch mode */}
          <div className="mt-5 text-center">
            {mode === 'register' ? (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Already registered? <span className="text-cyan-400 font-bold underline">Login</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Don't have an account? <span className="text-cyan-400 font-bold underline">Create Account</span>
              </button>
            )}
          </div>

        </div>

        {/* Feature Badges below card */}
        {mode === 'login' && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-[#091224]/80 border border-slate-800 flex items-center space-x-2.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">Secure & Audited</div>
                <div className="text-[10px] text-slate-400">Institutional Grade</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#091224]/80 border border-slate-800 flex items-center space-x-2.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">Instant Withdraw</div>
                <div className="text-[10px] text-slate-400">Fast Settlement</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* COUNTRY & CURRENCY SELECTION WINDOW / GARAGE POPUP */}
      {showCountrySelectorWindow && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#091122] border border-cyan-500/40 rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-white space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Select Country & Currency</h3>
                  <p className="text-[10px] text-slate-400">Mandatory selection for deposits & trading</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCountrySelectorWindow(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Countries */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {COUNTRY_CURRENCY_LIST.map((option) => {
                const isSelected = selectedCurrency === option.code;
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => {
                      setSelectedCurrency(option.code);
                      setShowCountrySelectorWindow(false);
                    }}
                    className={`w-full p-3 rounded-2xl border transition flex items-center justify-between text-left cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{option.flag}</span>
                      <div>
                        <div className="font-extrabold text-xs text-white">
                          {option.country}
                        </div>
                        <div className="text-[11px] text-cyan-300 font-mono font-semibold">
                          {option.currency} ({option.symbol})
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowCountrySelectorWindow(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
