import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Helper for currency formatting
export const formatINR = (amt) => {
  return '₹ ' + (amt || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * 1. DEPOSIT MODAL (Wallet Credit)
 */
export function DepositModal({ isOpen, onClose, onSuccess }) {
  const { token, refreshWallet } = useAuth();
  const [amount, setAmount] = useState('5000');
  const [remarks, setRemarks] = useState('Digital NetBanking Top-Up');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B192C]/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">add_circle</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Add Funds to Wallet</h3>
              <p className="text-[11px] text-slate-500 font-mono-num">Instant deposit via UPI / Net Banking</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Deposit Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                min="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono-num text-sm text-slate-900 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Transaction Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base">verified_user</span>
            <span>Funds are credited instantly with an automated transaction receipt.</span>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <span>Processing Deposit...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">payments</span>
                  <span>Confirm Deposit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 2. WITHDRAW MODAL (Wallet Debit)
 */
export function WithdrawModal({ isOpen, onClose, onSuccess }) {
  const { token, wallet, refreshWallet } = useAuth();
  const [amount, setAmount] = useState('2000');
  const [remarks, setRemarks] = useState('ATM/Vendor Withdrawal');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B192C]/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Withdraw From Wallet</h3>
              <p className="text-[11px] text-slate-500 font-mono-num">Current: {formatINR(wallet?.currentBalance)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Withdrawal Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                min="10"
                max={wallet?.currentBalance || 9999999}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono-num text-sm text-slate-900 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason / Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-base">shield</span>
            <span>Transfers are processed securely with zero settlement delay.</span>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <span>Processing Withdrawal...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Confirm Withdrawal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 3. APPLY LOAN MODAL
 */
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

  // Real-time client-side preview calculation (reducing balance formula)
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
      // 1. Submit Application
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

      // 2. Auto-Disburse for seamless end-to-end user experience in demo
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B192C]/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Apply: {product.productName}</h3>
            <p className="text-[11px] text-slate-500 font-mono-num">
              Tenure: {product.loanTermMonths} Months • APR: {product.interestRate}%
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleApply} className="mt-4 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Requested Loan Amount
              </label>
              <span className="text-[11px] text-slate-500 font-mono-num">
                Limit: {formatINR(product.minLoanAmount)} - {formatINR(product.maxLoanAmount)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
              <input
                type="number"
                step="500"
                min={product.minLoanAmount}
                max={product.maxLoanAmount}
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono-num text-sm text-slate-900 font-bold"
              />
            </div>
          </div>

          {/* Amortization Calculation Summary */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Estimated Monthly EMI:</span>
              <span className="font-mono-num font-bold text-blue-600 text-sm">{formatINR(estEmi)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Processing Fee (Deducted upfront):</span>
              <span className="font-mono-num font-semibold text-slate-800">{formatINR(product.processingFee)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Net Credited to Wallet:</span>
              <span className="font-mono-num font-bold text-emerald-600">{formatINR(netDisbursement)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-semibold text-slate-900">
              <span>Total Repayable over {n} Months:</span>
              <span className="font-mono-num text-slate-900">{formatINR(totalPayable)}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <span>Processing Application...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  <span>Apply &amp; Disburse to Wallet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 4. REPAY EMI MODAL
 */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B192C]/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Pay Installment #{emi.installmentNumber || emi.emiNumber}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono-num">
              Due Date: {emi.dueDate}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Principal Component:</span>
              <span className="font-mono-num font-semibold text-slate-800">{formatINR(emi.principalComponent)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Interest Component:</span>
              <span className="font-mono-num font-semibold text-slate-800">{formatINR(emi.interestComponent)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
              <span>Total EMI Amount:</span>
              <span className="font-mono-num text-blue-600">{formatINR(emiAmount)}</span>
            </div>
          </div>

          {/* Balance Check */}
          <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            hasSufficientBalance 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span className="font-medium">Wallet Balance:</span>
            <span className="font-mono-num font-bold">{formatINR(currentBalance)}</span>
          </div>

          {!hasSufficientBalance && (
            <p className="text-[11px] text-rose-600">
              Insufficient funds. Please credit your wallet first.
            </p>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !hasSufficientBalance}
              onClick={handlePay}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <span>Processing Payment...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">lock_clock</span>
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
