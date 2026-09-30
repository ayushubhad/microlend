import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR, DepositModal, WithdrawModal } from '../components/Modals';

export default function WalletView() {
  const { user, wallet, token, refreshWallet } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [recon, setRecon] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    if (token) {
      loadWalletData();
    }
  }, [token]);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      await refreshWallet();
      const [txnsRes, reconRes] = await Promise.all([
        fetch('/api/ledger/my-history', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/ledger/reconciliation', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const txnsData = await txnsRes.json();
      const reconData = await reconRes.json();

      if (txnsData.success) setTransactions(txnsData.transactions || []);
      if (reconData.success) setRecon(reconData.reconciliation);
    } catch (err) {
      console.error('Wallet load error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Wallet Banner */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-base text-blue-600">account_balance_wallet</span>
            <span>Primary Digital Wallet</span>
          </div>
          <h2 className="text-3xl font-bold font-mono-num text-slate-900 mt-1">
            {formatINR(wallet?.currentBalance)}
          </h2>
          <p className="text-xs text-slate-500 font-mono-num mt-1">
            Wallet ID: {wallet?.walletId || 'Generating...'} • 256-Bit SSL Protected • Zero Overdraft
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeposit(true)}
            className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Deposit Funds</span>
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            <span className="material-symbols-outlined text-base">payments</span>
            <span>Withdraw Funds</span>
          </button>
        </div>
      </section>

      {/* Ledger Reconciliation Card */}
      {recon && (
        <section className={`p-5 rounded-2xl border ${
          recon.isReconciled 
            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' 
            : 'bg-rose-50/50 border-rose-200 text-rose-950'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className={`material-symbols-outlined text-2xl ${recon.isReconciled ? 'text-emerald-600' : 'text-rose-600'}`}>
                {recon.isReconciled ? 'verified' : 'warning'}
              </span>
              <div>
                <h4 className="font-bold text-sm">
                  {recon.isReconciled ? 'Automated Balance Reconciliation: 100% Balanced' : 'Discrepancy Detected'}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sum of historical credits minus debits ({formatINR(recon.computedLedgerBalance)}) matches current wallet balance ({formatINR(recon.storedWalletBalance)}) exactly across {recon.totalTransactionsAudited} ledger records.
                </p>
              </div>
            </div>

            <button
              onClick={loadWalletData}
              className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors self-start md:self-auto flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              <span>Re-Reconcile Balance</span>
            </button>
          </div>
        </section>
      )}

      {/* Wallet Transactions Table */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-4">Wallet Operation History</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">No transactions in wallet ledger.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Reference No</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Balance After</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono-num">
                {transactions.map((t) => (
                  <tr key={t.transactionId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-blue-600">{t.referenceNo}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.transactionType.includes('CREDIT') || t.transactionType.includes('DISBURSEMENT')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {t.transactionType}
                      </span>
                    </td>
                    <td className={`py-3 px-3 font-bold ${
                      t.transactionType.includes('CREDIT') || t.transactionType.includes('DISBURSEMENT')
                        ? 'text-emerald-600'
                        : 'text-slate-900'
                    }`}>
                      {t.transactionType.includes('CREDIT') || t.transactionType.includes('DISBURSEMENT') ? '+' : '-'} {formatINR(t.amount)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {formatINR(t.balanceAfter)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(t.transactionDate).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-sans text-xs">
                      {t.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modals */}
      <DepositModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        onSuccess={loadWalletData}
      />
      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        onSuccess={loadWalletData}
      />

    </div>
  );
}
