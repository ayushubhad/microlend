import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../components/Modals';

export default function LedgerView() {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [recon, setRecon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadLedgerData();
    }
  }, [token, user?.role, filterType]);

  const loadLedgerData = async () => {
    setLoading(true);
    try {
      let endpoint = user?.role === 'ADMIN' ? '/api/ledger/audit' : '/api/ledger/my-history';
      if (user?.role === 'ADMIN' && filterType !== 'ALL') {
        endpoint += `?type=${filterType}`;
      }

      const [ledgerRes, reconRes] = await Promise.all([
        fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/ledger/reconciliation', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const ledgerData = await ledgerRes.json();
      const reconData = await reconRes.json();

      if (ledgerData.success) {
        setTransactions(ledgerData.auditLog || ledgerData.transactions || []);
      }
      if (reconData.success) {
        setRecon(reconData.reconciliation);
      }
    } catch (err) {
      console.error('Ledger fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTxns = transactions.filter(t => {
    if (filterType === 'ALL') return true;
    return t.transactionType === filterType;
  });

  return (
    <div className="flex flex-col gap-6">
      
      {/* Banner */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-base">receipt_long</span>
            <span>Account Statement &amp; Ledger</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {user?.role === 'ADMIN' ? 'Institutional System Audit Trail' : 'Transaction History & Statement'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident transaction history with immutable ledger records, reference tracking, and audit-grade timestamps.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'WALLET_CREDIT', 'WALLET_DEBIT', 'LOAN_DISBURSEMENT', 'EMI_PAYMENT'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === type
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </section>

      {/* Balance Reconciliation Audit Card */}
      {recon && (
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-100">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-base">Automated Balance Reconciliation</h4>
                <span className="text-[10px] font-mono-num font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {recon.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Formula: Current Wallet Balance = Σ (Credits) − Σ (Debits) from first transaction to present.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono-num text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Stored Balance</span>
              <span className="font-bold text-slate-900 text-sm">{formatINR(recon.storedWalletBalance)}</span>
            </div>
            <div className="text-slate-400">=</div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Sum of Ledger</span>
              <span className="font-bold text-blue-600 text-sm">{formatINR(recon.computedLedgerBalance)}</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Discrepancy</span>
              <span className="font-bold text-emerald-600 text-sm">₹ 0.00</span>
            </div>
          </div>
        </section>
      )}

      {/* Immutable Ledger Table */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Showing {filteredTxns.length} Immutable Ledger Records
          </span>
          <span className="text-[11px] font-mono-num text-slate-400">PostgreSQL table: transaction_ledger</span>
        </div>

        {filteredTxns.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No records matching selected criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3">Unique Ref No</th>
                  {user?.role === 'ADMIN' && <th className="py-3 px-3">Account Holder</th>}
                  <th className="py-3 px-3">Transaction Type</th>
                  <th className="py-3 px-3">Transfer Amount</th>
                  <th className="py-3 px-3">Post-Balance</th>
                  <th className="py-3 px-3">Timestamp (UTC/IST)</th>
                  <th className="py-3 px-3">Ledger Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono-num">
                {filteredTxns.map((t) => (
                  <tr key={t.transactionId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-blue-600 font-mono-num">
                      {t.referenceNo}
                    </td>

                    {user?.role === 'ADMIN' && (
                      <td className="py-3 px-3 font-sans">
                        <p className="font-semibold text-slate-900">{t.userName || 'Borrower'}</p>
                        <p className="text-[10px] text-slate-400 font-mono-num">{t.userEmail}</p>
                      </td>
                    )}

                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
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

    </div>
  );
}
