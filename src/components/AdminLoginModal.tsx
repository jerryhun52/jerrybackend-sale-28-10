import React, { useState } from 'react';
import { api } from '../services/api';
import { AdminUser } from '../types';
import { Shield, User, Lock, X, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admin: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanUsername = username.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();
    const cleanPassword = password.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();

    try {
      // First try with cleaned credentials (removes invisible zero-width and non-breaking spaces on iOS/Android)
      const res = await api.adminLogin(cleanUsername, cleanPassword);
      onSuccess(res.admin);
      onClose();
    } catch (err: any) {
      // Fallback with raw password
      try {
        const fallbackRes = await api.adminLogin(cleanUsername, password);
        onSuccess(fallbackRes.admin);
        onClose();
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || err.message || 'Invalid admin username or security credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0a1122]/95 border border-cyan-500/25 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-white overflow-hidden backdrop-blur-xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 p-[2px] mb-3 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
            <div className="w-full h-full bg-[#080f20] rounded-full flex items-center justify-center text-cyan-300">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            Security Login
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter administrative credentials to access control portal
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#060c18] border border-cyan-500/20 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
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
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-[#060c18] border border-cyan-500/20 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:opacity-95 text-white font-extrabold rounded-2xl shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 text-sm flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Login Access'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

