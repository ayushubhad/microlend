import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const formatINR = (amt) => {
  return '₹ ' + (amt || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Deposit Modal
export function DepositModal({ isOpen, onClose, onSuccess }) {
  const { token, refreshWallet } = useAuth();
  const [amount, setAmount] = useState('5000');
  const [remarks, setRemarks] = useState('UPI Wallet Deposit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/wallet/credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount), remarks })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      await refreshWallet();
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-[16px] max-w-md w-full p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-[#ebebeb]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
          <div>
            <h3 className="font-semibold text-base text-[#171717] tracking-tight">Deposit Funds</h3>
            <p className="font-geist-mono text-[11px] text-[#8f8f8f] mt-0.5">INSTANT CREDIT // POSTGRESQL WALLET</p>
          </div>
          <button onClick={onClose} className="text-[#8f8f8f] hover:text-[#171717] p-1">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-[6px] bg-[#fff5f5] border border-[#ffcccc] text-[#ee0000] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f] block mb-1">
              Deposit Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f8f8f] text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                min="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="input-geist w-full pl-7 font-mono-num text-sm text-[#171717]"
              />
            </div>
          </div>

          <div>
            <label className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f] block mb-1">
              Payment Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="input-geist w-full text-xs text-[#171717]"
            />
          </div>

          <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-[8px] text-[11px] text-[#4d4d4d] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            <span>Appends immutable transaction record with verifiable reference number.</span>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-[6px] border border-[#ebebeb] text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-3 rounded-[6px] bg-[#171717] hover:bg-[#333333] text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Withdraw Modal
export function WithdrawModal({ isOpen, onClose, onSuccess }) {
  const { token, wallet, refreshWallet } = useAuth();
  const [amount, setAmount] = useState('2000');
  const [remarks, setRemarks] = useState('Bank Account Payout');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/wallet/debit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount), remarks })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      await refreshWallet();
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-[16px] max-w-md w-full p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-[#ebebeb]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
          <div>
            <h3 className="font-semibold text-base text-[#171717] tracking-tight">Withdraw Funds</h3>
            <p className="font-geist-mono text-[11px] text-[#8f8f8f] mt-0.5">
              AVAILABLE: {formatINR(wallet?.currentBalance)}
            </p>
          </div>
          <button onClick={onClose} className="text-[#8f8f8f] hover:text-[#171717] p-1">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-[6px] bg-[#fff5f5] border border-[#ffcccc] text-[#ee0000] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f] block mb-1">
              Withdrawal Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f8f8f] text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                min="10"
                max={wallet?.currentBalance || 9999999}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="input-geist w-full pl-7 font-mono-num text-sm text-[#171717]"
              />
            </div>
          </div>

          <div>
            <label className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f] block mb-1">
              Destination / Purpose
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="input-geist w-full text-xs text-[#171717]"
            />
          </div>

          <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-[8px] text-[11px] text-[#4d4d4d] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0070f3]"></span>
            <span>Pessimistic row-level lock protects against concurrent overdrafts.</span>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-[6px] border border-[#ebebeb] text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-3 rounded-[6px] bg-[#171717] hover:bg-[#333333] text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Apply Loan Modal
export function ApplyLoanModal({ isOpen, onClose, product, onSuccess }) {
  const { token, refreshWallet } = useAuth();
  const [loanAmount, setLoanAmount] = useState(product?.minLoanAmount || 10000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setLoanAmount(product.minLoanAmount);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const P = parseFloat(loanAmount) || 0;
  const R = product.interestRate;
  const n = product.loanTermMonths;
  const r = R / (12 * 100);
  const factor = Math.pow(1 + r, n);
  const estEmi = P > 0 ? (P * r * factor) / (factor - 1) : 0;
  const totalPayable = estEmi * n;
  const netDisbursement = Math.max(0, P - product.processingFee);

  const handleApply = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: product.productId,
          loan_amount: parseFloat(loanAmount)
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const disburseRes = await fetch(`/api/loans/${data.loan.loanId}/disburse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const disburseData = await disburseRes.json();
      if (!disburseData.success) throw new Error(disburseData.error);

      await refreshWallet();
      if (onSuccess) onSuccess(disburseData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-[16px] max-w-lg w-full p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-[#ebebeb]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
          <div>
            <h3 className="font-semibold text-base text-[#171717] tracking-tight">{product.productName}</h3>
            <p className="font-geist-mono text-[11px] text-[#8f8f8f] mt-0.5">
              TENURE: {product.loanTermMonths}M // APR: {product.interestRate}%
            </p>
          </div>
          <button onClick={onClose} className="text-[#8f8f8f] hover:text-[#171717] p-1">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-[6px] bg-[#fff5f5] border border-[#ffcccc] text-[#ee0000] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleApply} className="mt-4 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f]">
                Requested Principal
              </label>
              <span className="font-geist-mono text-[11px] text-[#8f8f8f]">
                {formatINR(product.minLoanAmount)} – {formatINR(product.maxLoanAmount)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f8f8f] text-sm">₹</span>
              <input
                type="number"
                step="500"
                min={product.minLoanAmount}
                max={product.maxLoanAmount}
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                required
                className="input-geist w-full pl-7 font-mono-num text-sm text-[#171717]"
              />
            </div>
          </div>

          <div className="p-3.5 bg-[#fafafa] border border-[#ebebeb] rounded-[10px] space-y-2 text-xs">
            <div className="flex justify-between text-[#4d4d4d]">
              <span>Monthly EMI:</span>
              <span className="font-mono-num font-semibold text-[#171717]">{formatINR(estEmi)}</span>
            </div>
            <div className="flex justify-between text-[#4d4d4d]">
              <span>Upfront Processing Fee:</span>
              <span className="font-mono-num text-[#171717]">{formatINR(product.processingFee)}</span>
            </div>
            <div className="flex justify-between text-[#4d4d4d]">
              <span>Net Credited to Wallet:</span>
              <span className="font-mono-num font-medium text-[#10b981]">{formatINR(netDisbursement)}</span>
            </div>
            <div className="pt-2 border-t border-[#ebebeb] flex justify-between font-medium text-[#171717]">
              <span>Total Payable ({n} Mos):</span>
              <span className="font-mono-num">{formatINR(totalPayable)}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-[6px] border border-[#ebebeb] text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-3 rounded-[6px] bg-[#171717] hover:bg-[#333333] text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing Application...' : 'Apply & Disburse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Repay EMI Modal
export function RepayEmiModal({ isOpen, onClose, emi, onSuccess }) {
  const { token, wallet, refreshWallet } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !emi) return null;

  const emiAmount = emi.emiAmount;
  const currentBalance = wallet?.currentBalance || 0;
  const hasSufficientBalance = currentBalance >= emiAmount;

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/emi/${emi.emiId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      await refreshWallet();
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-[16px] max-w-md w-full p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-[#ebebeb]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
          <div>
            <h3 className="font-semibold text-base text-[#171717] tracking-tight">
              Pay Installment #{emi.installmentNumber || emi.emiNumber}
            </h3>
            <p className="font-geist-mono text-[11px] text-[#8f8f8f] mt-0.5">
              DUE DATE: {emi.dueDate}
            </p>
          </div>
          <button onClick={onClose} className="text-[#8f8f8f] hover:text-[#171717] p-1">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-[6px] bg-[#fff5f5] border border-[#ffcccc] text-[#ee0000] text-xs">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="p-3.5 bg-[#fafafa] border border-[#ebebeb] rounded-[10px] space-y-2 text-xs">
            <div className="flex justify-between text-[#4d4d4d]">
              <span>Principal Portion:</span>
              <span className="font-mono-num font-medium text-[#171717]">{formatINR(emi.principalComponent)}</span>
            </div>
            <div className="flex justify-between text-[#4d4d4d]">
              <span>Interest Portion:</span>
              <span className="font-mono-num font-medium text-[#171717]">{formatINR(emi.interestComponent)}</span>
            </div>
            <div className="pt-2 border-t border-[#ebebeb] flex justify-between font-semibold text-sm text-[#171717]">
              <span>Installment Amount:</span>
              <span className="font-mono-num">{formatINR(emiAmount)}</span>
            </div>
          </div>

          <div className={`p-2.5 rounded-[6px] border text-xs flex items-center justify-between ${
            hasSufficientBalance 
              ? 'bg-[#f7faf7] border-[#d1ebd1] text-[#171717]' 
              : 'bg-[#fff5f5] border-[#ffcccc] text-[#ee0000]'
          }`}>
            <span className="text-[#4d4d4d]">Available Wallet Balance:</span>
            <span className="font-mono-num font-medium">{formatINR(currentBalance)}</span>
          </div>

          {!hasSufficientBalance && (
            <p className="text-[11px] text-[#ee0000]">
              Insufficient funds. Please deposit funds into your wallet to settle this installment.
            </p>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-[6px] border border-[#ebebeb] text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !hasSufficientBalance}
              onClick={handlePay}
              className="flex-1 py-2 px-3 rounded-[6px] bg-[#171717] hover:bg-[#333333] text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing Payment...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
