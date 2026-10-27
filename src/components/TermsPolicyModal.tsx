import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Award, Code2, Globe, CheckCircle2 } from 'lucide-react';

interface TermsPolicyModalProps {
  isOpen: boolean;
  initialTab?: 'terms' | 'policy';
  onClose: () => void;
}

export const TermsPolicyModal: React.FC<TermsPolicyModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose,
}) => {
  const [tab, setTab] = useState<'terms' | 'policy'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 mb-5">
          <button
            type="button"
            onClick={() => setTab('terms')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
              tab === 'terms'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Terms & Conditions</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('policy')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
              tab === 'policy'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Privacy & Security Policy</span>
          </button>
        </div>

        {tab === 'terms' ? (
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                1. General Service Terms & Binary Option Protocols
              </h4>
              <p>
                By registering, accessing, and placing financial options contracts on this platform, you agree to adhere to standard international digital asset derivatives regulations. All trades execute in real-time based on live aggregated liquidity indices.
              </p>
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                2. 60s Contract Execution & Yield Calculation
              </h4>
              <p>
                60-second binary options trade contracts offer fixed 20% commission yields upon successful expiration. Settlement prices are indexed from synchronized decentralized price feeds. Margin is frozen during the contract duration and automatically unlocked upon expiration.
              </p>
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                3. Withdrawal Rules & Account Settlement
              </h4>
              <p>
                Users can submit withdrawal requests via supported local banking rails or crypto networks (USDT TRC20, ERC20, BEP20). All payouts are processed in compliance with risk management controls and anti-fraud protocols.
              </p>
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                4. Account Security & User Responsibility
              </h4>
              <p>
                Each user is responsible for safeguarding their login credentials and transaction keys. Suspicious or unauthorized attempts will result in temporary suspension to protect account capital.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                1. Data Protection & Encryption
              </h4>
              <p>
                Our platform utilizes enterprise-grade end-to-end 256-bit encryption for all customer session data, bank details, and trade records. Your private credentials are never shared with unauthorized third parties.
              </p>
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                2. Real-Time Risk Custody
              </h4>
              <p>
                Client balances are segregated and monitored under 100% reserve verification. Contract margins are transparently isolated during active trading cycles.
              </p>
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                3. Fair Execution & Audit Logs
              </h4>
              <p>
                All trade placements, market ticks, and settlement transactions generate immutable system logs accessible through the administrative audit monitor.
              </p>
            </div>
          </div>
        )}

        {/* Web Developer Credit Box as explicitly instructed by the user */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2f66ee] text-white flex items-center justify-center font-bold shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">
                Core Architecture & System Engine
              </div>
              <div className="text-[11px] text-blue-700 font-semibold">
                Designed & Developed by <span className="font-black underline">Jerry</span>
              </div>
            </div>
          </div>
          <span className="px-2 py-1 bg-white text-blue-800 text-[10px] font-extrabold rounded-lg border border-blue-200">
            Verified Build
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition"
        >
          Understood & Agree
        </button>
      </div>
    </div>
  );
};
