import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../components/Modals';

export default function LedgerView() {
  const { token, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [recon, setRecon] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadLedger();
    }
  }, [token]);

  const loadLedger = async () => {
    setLoading(true);
    try {
      const endpoint = user?.role === 'ADMIN' ? '/api/ledger/all' : '/api/ledger/my-history';
      const [txnsRes, reconRes] = await Promise.all([
        fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/ledger/reconciliation', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const txnsData = await txnsRes.json();
      const reconData = await reconRes.json();

      if (txnsData.success) setTransactions(txnsData.transactions || []);
      if (reconData.success) setRecon(reconData.reconciliation);
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
      
      {/* Header */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-geist-mono text-[11px] font-medium text-[#8f8f8f] uppercase tracking-wider block mb-1">
            Immutable Audit Trail
          </span>
          <h2 className="text-xl font-semibold text-[#171717] tracking-tight">
            {user?.role === 'ADMIN' ? 'System Transaction Ledger' : 'My Financial Statement'}
          </h2>
          <p className="text-xs text-[#4d4d4d] mt-1">
            Append-only financial records protected by PostgreSQL triggers against modification or deletion.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'WALLET_CREDIT', 'WALLET_DEBIT', 'LOAN_DISBURSEMENT', 'EMI_PAYMENT'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-[64px] text-xs font-normal transition-colors border ${
                filterType === type
                  ? 'bg-[#171717] text-white border-[#171717]'
                  : 'bg-white text-[#4d4d4d] border-[#ebebeb] hover:border-[#a1a1a1]'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </section>

      {/* Reconciliation Audit */}
      {recon && (
        <section className="bg-white rounded-[12px] p-5 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#171717]">Mathematical Ledger Verification</span>
              <span className="font-geist-mono text-[10px] text-[#10b981] px-1.5 py-0.2 rounded-[4px] border border-[#d1ebd1] bg-[#f7faf7] font-medium">
                {recon.status}
              </span>
            </div>
            <p className="text-xs text-[#4d4d4d] mt-1">
              Calculated Ledger Balance matches Stored Wallet Balance ({formatINR(recon.storedWalletBalance)}) with zero drift across {recon.totalTransactionsAudited} rows.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-geist-mono self-start md:self-auto">
            <div>
              <span className="text-[#8f8f8f] block text-[10px] uppercase">Net Credits</span>
              <span className="font-semibold text-[#10b981]">{formatINR(recon.totalCredits)}</span>
            </div>
            <div>
              <span className="text-[#8f8f8f] block text-[10px] uppercase">Net Debits</span>
              <span className="font-semibold text-[#171717]">{formatINR(recon.totalDebits)}</span>
            </div>
            <div>
              <span className="text-[#8f8f8f] block text-[10px] uppercase">Discrepancy</span>
              <span className="font-semibold text-[#171717]">{formatINR(recon.difference)}</span>
            </div>
          </div>
        </section>
      )}

      {/* Ledger Table */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-3">
          <h3 className="font-semibold text-sm text-[#171717]">
            Ledger Entries ({filteredTxns.length})
          </h3>
          <span className="font-geist-mono text-xs text-[#8f8f8f]">
            FILTER: {filterType}
          </span>
        </div>

        {filteredTxns.length === 0 ? (
          <div className="text-center py-10 text-[#8f8f8f] text-xs font-geist-mono">NO RECORDS FOUND</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ebebeb] text-[#8f8f8f] font-geist-mono text-[10px] uppercase">
                  {user?.role === 'ADMIN' && <th className="py-2 px-3 font-medium">Borrower</th>}
                  <th className="py-2 px-3 font-medium">Reference Code</th>
                  <th className="py-2 px-3 font-medium">Operation</th>
                  <th className="py-2 px-3 font-medium">Amount</th>
                  <th className="py-2 px-3 font-medium">Balance After</th>
                  <th className="py-2 px-3 font-medium">Timestamp</th>
                  <th className="py-2 px-3 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f2] font-mono-num">
                {filteredTxns.map((t) => (
                  <tr key={t.transactionId} className="hover:bg-[#fafafa] transition-colors">
                    {user?.role === 'ADMIN' && (
                      <td className="py-2.5 px-3">
                        <span className="font-sans font-medium text-[#171717]">{t.userName || 'System'}</span>
                        <span className="font-geist-mono text-[10px] text-[#8f8f8f] block">{t.userEmail}</span>
                      </td>
                    )}
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
                      {new Date(t.transactionDate).toLocaleString()}
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

    </div>
  );
}
