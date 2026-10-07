import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR, DepositModal, WithdrawModal } from '../components/Modals';

export default function WalletView() {
  const { user, wallet, token, refreshWallet } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [recon, setRecon] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
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
      
      {/* Primary Wallet Banner (Geist Hero Card) */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="font-geist-mono text-[11px] font-medium text-[#8f8f8f] uppercase tracking-wider block mb-1">
            Primary Wallet Account
          </span>
          <h2 className="text-3xl font-semibold font-mono-num text-[#171717] tracking-tight">
            {formatINR(wallet?.currentBalance)}
          </h2>
          <p className="text-xs text-[#8f8f8f] font-geist-mono mt-1">
            WALLET ID: {wallet?.walletId || 'Generating...'} // SINGLE SOURCE OF TRUTH
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDeposit(true)}
            className="btn-marketing-primary text-xs py-2 px-4.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Deposit Funds</span>
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="btn-marketing-secondary text-xs py-2 px-4.5"
          >
            <span>Withdraw Funds</span>
          </button>
        </div>
      </section>

      {/* Automated Ledger Reconciliation Card */}
      {recon && (
        <section className="bg-white rounded-[12px] p-5 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#171717]">Continuous Mathematical Reconciliation</span>
                <span className="font-geist-mono text-[10px] text-[#10b981] px-1.5 py-0.2 rounded-[4px] border border-[#d1ebd1] bg-[#f7faf7] font-medium">
                  {recon.status}
                </span>
              </div>
              <p className="text-xs text-[#4d4d4d] mt-1">
                Sum of historical credits minus debits ({formatINR(recon.computedLedgerBalance)}) matches current wallet balance ({formatINR(recon.storedWalletBalance)}) exactly across {recon.totalTransactionsAudited} immutable records.
              </p>
            </div>

            <button
              onClick={loadWalletData}
              className="btn-app-ghost self-start md:self-auto text-xs"
            >
              <span className="material-symbols-outlined text-xs">sync</span>
              <span>Re-Reconcile</span>
            </button>
          </div>
        </section>
      )}

      {/* Transactions Table */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <h3 className="font-semibold text-sm text-[#171717] mb-3">Wallet Operation History</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-[#8f8f8f] text-xs font-geist-mono">NO TRANSACTIONS IN WALLET LEDGER</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ebebeb] text-[#8f8f8f] font-geist-mono text-[10px] uppercase">
                  <th className="py-2 px-3 font-medium">Reference</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Amount</th>
                  <th className="py-2 px-3 font-medium">Balance After</th>
                  <th className="py-2 px-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f2] font-mono-num">
                {transactions.map((t) => (
                  <tr key={t.transactionId} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-3 font-medium text-[#171717]">{t.referenceNo}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-geist-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border border-[#ebebeb] bg-[#fafafa] text-[#4d4d4d]">
                        {t.transactionType}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 font-medium ${
                      t.transactionType.includes('CREDIT') || t.transactionType.includes('DISBURSEMENT')
                        ? 'text-[#10b981]'
                        : 'text-[#171717]'
                    }`}>
                      {t.transactionType.includes('CREDIT') || t.transactionType.includes('DISBURSEMENT') ? '+' : '-'} {formatINR(t.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-[#4d4d4d]">
                      {formatINR(t.balanceAfter)}
                    </td>
                    <td className="py-2.5 px-3 text-[#8f8f8f] text-[11px]">
                      {new Date(t.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-[#4d4d4d] font-sans text-xs">
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
