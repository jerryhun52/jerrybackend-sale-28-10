import React, { useState } from 'react';
import { User, CurrencyCode, CURRENCIES, BankDetails } from '../types';
import { api } from '../services/api';
import { formatMoney } from '../utils/formatters';
import { 
  ArrowUpRight, 
  X, 
  Check, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  Wallet,
  Coins,
  QrCode,
  Smartphone
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  type?: 'deposit' | 'withdraw';
  onClose: () => void;
  user: User;
  currency?: CurrencyCode;
  onSuccess: (updatedUser?: Partial<User>) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  type = 'withdraw',
  onClose,
  user,
  currency = 'USD',
  onSuccess,
}) => {
  const isWithdraw = type === 'withdraw';
  const currentCurrency: CurrencyCode = ((user?.currency || currency || 'USD') as CurrencyCode);
  const currConfig = CURRENCIES[currentCurrency] || CURRENCIES.USD;
  const userBalance = user?.balance || 0;

  // Local payment channel methods
  const [method, setMethod] = useState<string>(() => {
    if (currentCurrency === 'INR') return 'BANK';
    if (currentCurrency === 'PKR') return 'BANK';
    if (currentCurrency === 'BRL') return 'PIX';
    return 'BANK';
  });

  const [amount, setAmount] = useState('');
  
  // Common Recipient & Bank Fields
  const [receiverName, setReceiverName] = useState(user?.name || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  // Mobile Wallet fields (PKR)
  const [walletProvider, setWalletProvider] = useState<'Easypaisa' | 'JazzCash' | 'SadaPay' | 'NayaPay' | 'Zindagi'>('Easypaisa');
  const [walletMobileNumber, setWalletMobileNumber] = useState('');

  // PIX fields (BRL)
  const [pixKeyType, setPixKeyType] = useState<'CPF' | 'Phone' | 'Email' | 'Random Key'>('CPF');
  const [pixKey, setPixKey] = useState('');

  // Crypto USDT fields (USD)
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState<'TRC20' | 'BEP20' | 'ERC20'>('TRC20');
  const [txHash, setTxHash] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (user?.status === 'frozen' || user?.status === 'suspended') {
      setError('Account Restricted: Your account is currently frozen/deactivated. Please contact Customer Care Desk.');
      return;
    }

    const num = Number(amount);

    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (isWithdraw) {
      if (num < 100) {
        setError(`Minimum withdrawal limit is 100 ${currentCurrency}`);
        return;
      }

      if (num > userBalance + 0.01) {
        setError(`Cannot withdraw more than available balance (${formatMoney(userBalance, currentCurrency)})`);
        return;
      }
    } else {
      if (num < 100) {
        setError(`Minimum deposit amount is 100 ${currentCurrency}`);
        return;
      }
    }

    let bankObj: BankDetails | undefined = undefined;
    let recipientAddress = '';
    let networkName = '';

    // 1. INDIA (INR)
    if (currentCurrency === 'INR') {
      if (method === 'BANK') {
        if (!bankName.trim() || !ifscCode.trim() || !accountNumber.trim() || !receiverName.trim()) {
          setError('Please fill in all 4 Bank details: Bank Name, IFSC, Account Number, and Receiver Name');
          return;
        }
        bankObj = {
          method: 'INR_BANK',
          country: 'INR',
          bankName: bankName.trim(),
          ifscOrIban: ifscCode.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: receiverName.trim(),
        };
        recipientAddress = `${accountNumber.trim()} (IFSC: ${ifscCode.trim()}, Name: ${receiverName.trim()})`;
        networkName = `INR Bank Transfer (${bankName.trim()})`;
      } else { // UPI
        if (!upiId.trim() || !receiverName.trim()) {
          setError('Please fill in UPI ID and Receiver Name');
          return;
        }
        bankObj = {
          method: 'INR_UPI',
          country: 'INR',
          upiOrPixId: upiId.trim(),
          accountHolder: receiverName.trim(),
        };
        recipientAddress = `UPI: ${upiId.trim()} (${receiverName.trim()})`;
        networkName = 'INR UPI Transfer';
      }
    } 
    // 2. PAKISTAN (PKR)
    else if (currentCurrency === 'PKR') {
      if (method === 'BANK') {
        if (!bankName.trim() || !accountNumber.trim() || !receiverName.trim()) {
          setError('Please fill in Bank Name, Account Number, and Receiver Name');
          return;
        }
        bankObj = {
          method: 'PKR_BANK',
          country: 'PKR',
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: receiverName.trim(),
        };
        recipientAddress = `${accountNumber.trim()} (${bankName.trim()}, Name: ${receiverName.trim()})`;
        networkName = `PKR Bank (${bankName.trim()})`;
      } else { // WALLET (Easypaisa, JazzCash, SadaPay, NayaPay, Zindagi)
        if (!walletMobileNumber.trim() || !receiverName.trim()) {
          setError('Please enter Mobile/Account Number and Receiver Name');
          return;
        }
        bankObj = {
          method: 'PKR_WALLET',
          country: 'PKR',
          bankName: walletProvider,
          accountNumber: walletMobileNumber.trim(),
          accountHolder: receiverName.trim(),
        };
        recipientAddress = `${walletProvider}: ${walletMobileNumber.trim()} (${receiverName.trim()})`;
        networkName = `PKR Wallet (${walletProvider})`;
      }
    }
    // 3. BRAZIL (BRL)
    else if (currentCurrency === 'BRL') {
      if (method === 'PIX') {
        if (!pixKey.trim() || !receiverName.trim()) {
          setError('Please fill in PIX Key and Receiver Name');
          return;
        }
        bankObj = {
          method: 'BRL_PIX',
          country: 'BRL',
          upiOrPixId: pixKey.trim(),
          accountHolder: receiverName.trim(),
        };
        recipientAddress = `PIX (${pixKeyType}): ${pixKey.trim()} (${receiverName.trim()})`;
        networkName = 'BRL PIX Instant';
      } else {
        if (!bankName.trim() || !accountNumber.trim() || !receiverName.trim()) {
          setError('Please fill in Bank Name, Account Number, and Receiver Name');
          return;
        }
        bankObj = {
          method: 'BRL_BANK',
          country: 'BRL',
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: receiverName.trim(),
        };
        recipientAddress = `${accountNumber.trim()} (${bankName.trim()}, Name: ${receiverName.trim()})`;
        networkName = `BRL Bank (${bankName.trim()})`;
      }
    }
    // 4. USD & OTHERS
    else {
      if (method === 'BANK') {
        if (!bankName.trim() || !accountNumber.trim() || !receiverName.trim()) {
          setError('Please fill in Bank Name, Account Number/IBAN, and Receiver Name');
          return;
        }
        bankObj = {
          method: 'BANK_WIRE',
          country: currentCurrency,
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscOrIban: ifscCode.trim() || 'N/A',
          accountHolder: receiverName.trim(),
        };
        recipientAddress = `${accountNumber.trim()} (${bankName.trim()}, Name: ${receiverName.trim()})`;
        networkName = `Bank Wire (${currentCurrency})`;
      } else { // CRYPTO
        if (!cryptoAddress.trim()) {
          setError('Please enter your USDT wallet address');
          return;
        }
        recipientAddress = cryptoAddress.trim();
        networkName = `USDT-${cryptoNetwork}`;
      }
    }

    setLoading(true);
    try {
      if (isWithdraw) {
        const res = await api.submitWithdrawRequest({
          userId: user.id,
          amount: num,
          currency: currentCurrency,
          walletAddress: recipientAddress,
          network: networkName,
          bankDetails: bankObj,
          remarks: `Withdrawal request in ${currentCurrency} via ${networkName} to ${receiverName || user.name}`,
        });

        setSuccessMsg(`Withdrawal of ${formatMoney(num, currentCurrency)} submitted successfully!`);
        setTimeout(() => {
          onSuccess(res.user);
          onClose();
        }, 1500);
      } else {
        const res = await api.submitDepositRequest({
          userId: user.id,
          amount: num,
          currency: currentCurrency,
          network: networkName,
          txHash: txHash.trim() || 'Manual Direct Deposit',
          remarks: `Deposit request of ${num} ${currentCurrency}`,
        });

        setSuccessMsg(`Deposit request of ${formatMoney(num, currentCurrency)} submitted for verification!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Transaction request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in font-sans overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900 my-auto animate-scale-up max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-2xl hover:bg-slate-100 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {isWithdraw ? `Withdraw Funds (${currentCurrency})` : `Deposit Funds (${currentCurrency})`}
            </h3>
            <p className="text-xs text-slate-500">
              Account balance: <strong className="text-slate-900 font-mono font-bold">{formatMoney(userBalance, currentCurrency)}</strong>
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 font-medium">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Payment Channels Tabs based on Currency */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {currentCurrency === 'INR' && (
            <>
              <button
                type="button"
                onClick={() => setMethod('BANK')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  method === 'BANK'
                    ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>1. Bank Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  method === 'UPI'
                    ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>2. UPI</span>
              </button>
            </>
          )}

          {currentCurrency === 'PKR' && (
            <>
              <button
                type="button"
                onClick={() => setMethod('BANK')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  method === 'BANK'
                    ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>1. Bank Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('WALLET')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  method === 'WALLET'
                    ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>2. Mobile Wallet</span>
              </button>
            </>
          )}

          {currentCurrency === 'BRL' && (
            <>
              <button
                type="button"
                onClick={() => setMethod('PIX')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  method === 'PIX'
                    ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>1. PIX Instant</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('BANK')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  method === 'BANK'
                    ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>2. Bank Transfer</span>
              </button>
            </>
          )}

          {currentCurrency !== 'INR' && currentCurrency !== 'PKR' && currentCurrency !== 'BRL' && (
            <>
              <button
                type="button"
                onClick={() => setMethod('BANK')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  method === 'BANK'
                    ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>1. Bank Wire</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('CRYPTO')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  method === 'CRYPTO'
                    ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>2. USDT Crypto</span>
              </button>
            </>
          )}
        </div>

        {/* Withdrawal / Deposit Dynamic Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* INDIA (INR) FORMS */}
          {currentCurrency === 'INR' && (
            <>
              {method === 'BANK' ? (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    🇮🇳 Indian Bank Details (4 Requirements):
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC Bank, SBI, ICICI, Axis Bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. IFSC Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SBIN0001234 or HDFC0000123"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      3. Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full bank account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      4. Receiver Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full legal name as on bank account"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    🇮🇳 UPI Details (2 Requirements):
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. UPI ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. username@paytm, name@ybl, mobile@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. Receiver Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full name registered on UPI app"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* PAKISTAN (PKR) FORMS */}
          {currentCurrency === 'PKR' && (
            <>
              {method === 'BANK' ? (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    🇵🇰 Pakistani Bank Details (3 Requirements):
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Meezan Bank, HBL, UBL, Allied, MCB"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. Account Number / IBAN *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 010100123456789 or PK24MEZN..."
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      3. Receiver Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full account title on bank"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    🇵🇰 Mobile Wallet Selection (3 Requirements):
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. Select Mobile Wallet *
                    </label>
                    <select
                      value={walletProvider}
                      onChange={(e: any) => setWalletProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Easypaisa">Easypaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="SadaPay">SadaPay</option>
                      <option value="NayaPay">NayaPay</option>
                      <option value="Zindagi">Zindagi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. Account / Mobile Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 03001234567"
                      value={walletMobileNumber}
                      onChange={(e) => setWalletMobileNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      3. Receiver Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full account title on wallet app"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* BRAZIL (BRL) FORMS */}
          {currentCurrency === 'BRL' && (
            <>
              {method === 'PIX' ? (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    🇧🇷 PIX Transfer Details:
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      PIX Key Type *
                    </label>
                    <select
                      value={pixKeyType}
                      onChange={(e: any) => setPixKeyType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CPF">CPF / CNPJ</option>
                      <option value="Phone">Phone Number</option>
                      <option value="Email">Email Address</option>
                      <option value="Random Key">Random Key (Chave Aleatória)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      PIX Key *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your PIX key"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Receiver Name / CPF *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full name registered on PIX account"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    🇧🇷 Brazilian Bank Transfer:
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nubank, Itaú, Bradesco, Banco do Brasil"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Account Number & Agency *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Agency 0001 / Account 12345-6"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Receiver Name / CPF *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full account title"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* USD & GENERIC FORMS */}
          {currentCurrency !== 'INR' && currentCurrency !== 'PKR' && currentCurrency !== 'BRL' && (
            <>
              {method === 'BANK' ? (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chase, Bank of America, HSBC"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Account Number / IBAN *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter account number or IBAN"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Receiver Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full name on bank account"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Select Network *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['TRC20', 'BEP20', 'ERC20'] as const).map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setCryptoNetwork(net)}
                          className={`py-1.5 text-xs font-mono font-bold rounded-xl border transition cursor-pointer ${
                            cryptoNetwork === net
                              ? 'bg-blue-50 border-[#2563eb] text-[#2563eb]'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          {net}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      USDT Address ({cryptoNetwork}) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`Enter your USDT ${cryptoNetwork} wallet address`}
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Amount Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">
                Amount ({currentCurrency}) * <span className="text-[10px] text-slate-500">(Min: 100 {currentCurrency})</span>
              </label>
              {isWithdraw && (
                <button
                  type="button"
                  onClick={() => setAmount(userBalance.toString())}
                  className="text-[11px] font-bold text-[#2563eb] hover:underline cursor-pointer"
                >
                  Max ({formatMoney(userBalance, currentCurrency)})
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                min="100"
                max={isWithdraw ? userBalance : undefined}
                placeholder={`Minimum 100 ${currentCurrency}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 font-mono">
                {currentCurrency} ({currConfig.symbol})
              </span>
            </div>
          </div>

          {/* Security Note */}
          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#2563eb]" />
            <span>
              {isWithdraw 
                ? `Withdrawals processed directly in your local currency (${currentCurrency}). Minimum limit: 100 ${currentCurrency}.`
                : `Deposits verified & credited in your account currency (${currentCurrency}).`}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (isWithdraw && userBalance <= 0)}
            className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-2xl text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Submitting Request...</span>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>{isWithdraw ? `Submit ${currentCurrency} Withdrawal` : `Submit ${currentCurrency} Deposit`}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
