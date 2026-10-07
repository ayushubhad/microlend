import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../components/Modals';

export default function BorrowersView({ setActiveTab }) {
  const { token } = useAuth();
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [borrowerDetail, setBorrowerDetail] = useState(null);

  useEffect(() => {
    if (token) {
      loadBorrowers();
    }
  }, [token]);

  const loadBorrowers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/borrowers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBorrowers(data.borrowers || []);
      }
    } catch (err) {
      console.error('Fetch borrowers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectBorrower = async (b) => {
    setSelectedBorrower(b);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/borrowers/${b.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBorrowerDetail(data.borrower);
      }
    } catch (err) {
      console.error('Fetch borrower detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-geist-mono text-[11px] font-medium text-[#8f8f8f] uppercase tracking-wider block mb-1">
            Institutional Borrower Directory
          </span>
          <h2 className="text-xl font-semibold text-[#171717] tracking-tight">Borrower Accounts Under Management</h2>
          <p className="text-xs text-[#4d4d4d] mt-1">
            Real-time oversight of all borrower profiles, verified digital wallets, active loans, and credit risk statuses.
          </p>
        </div>

        <button
          onClick={loadBorrowers}
          className="btn-app-ghost self-start md:self-auto text-xs"
        >
          <span className="material-symbols-outlined text-xs">refresh</span>
          <span>Refresh Directory ({borrowers.length})</span>
        </button>
      </section>

      {/* Borrowers Table */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-[#171717]">Registered Borrowers</h3>
            <span className="font-geist-mono text-[10px] px-2 py-0.2 rounded-[100px] bg-[#f2f2f2] text-[#4d4d4d]">
              {borrowers.length} PROFILES
            </span>
          </div>
        </div>

        {borrowers.length === 0 ? (
          <div className="py-12 text-center text-[#8f8f8f] text-xs font-geist-mono">
            NO BORROWERS REGISTERED IN DATABASE
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ebebeb] text-[#8f8f8f] font-geist-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3 font-medium">Borrower Identity</th>
                  <th className="py-2.5 px-3 font-medium">Verified Wallet Balance</th>
                  <th className="py-2.5 px-3 font-medium">Loans Count</th>
                  <th className="py-2.5 px-3 font-medium">Active Debt Portfolio</th>
                  <th className="py-2.5 px-3 font-medium">Registration Date</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f2]">
                {borrowers.map((b) => (
                  <tr key={b.userId} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#171717]">{b.fullName}</div>
                      <div className="font-geist-mono text-[11px] text-[#8f8f8f]">{b.email}</div>
                      <div className="font-geist-mono text-[10px] text-[#8f8f8f]">{b.phone}</div>
                    </td>
                    <td className="py-3 px-3 font-mono-num font-semibold text-sm text-[#10b981]">
                      {formatINR(b.walletBalance)}
                    </td>
                    <td className="py-3 px-3 font-geist-mono">
                      <span className="text-[#171717] font-medium">{b.activeLoans} Active</span>
                      <span className="text-[#8f8f8f] text-[11px]"> / {b.totalLoans} Total</span>
                    </td>
                    <td className="py-3 px-3 font-mono-num text-[#171717] font-medium">
                      {formatINR(b.activeDebt)}
                    </td>
                    <td className="py-3 px-3 font-geist-mono text-[11px] text-[#8f8f8f]">
                      {new Date(b.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleInspectBorrower(b)}
                        className="btn-app-ghost text-xs py-1 px-2.5"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        <span>Inspect Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Borrower Detail Modal / Drawer */}
      {selectedBorrower && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-[16px] max-w-2xl w-full p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-[#ebebeb] max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#171717] tracking-tight">
                  Borrower Profile: {selectedBorrower.fullName}
                </h3>
                <p className="font-geist-mono text-[11px] text-[#8f8f8f]">
                  {selectedBorrower.email} • {selectedBorrower.phone}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedBorrower(null);
                  setBorrowerDetail(null);
                }}
                className="text-[#8f8f8f] hover:text-[#171717] text-xl"
              >
                ✕
              </button>
            </div>

            {detailLoading || !borrowerDetail ? (
              <div className="py-12 text-center font-geist-mono text-xs text-[#8f8f8f]">
                LOADING BORROWER CREDIT DOSSIER...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 font-geist-mono text-xs">
                  <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
                    <span className="text-[10px] text-[#8f8f8f] uppercase block mb-0.5">Wallet Balance</span>
                    <span className="font-semibold text-sm text-[#10b981] font-mono-num">
                      {formatINR(borrowerDetail.walletBalance)}
                    </span>
                  </div>
                  <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
                    <span className="text-[10px] text-[#8f8f8f] uppercase block mb-0.5">Address</span>
                    <span className="text-[#171717] text-[11px] font-sans block truncate">
                      {borrowerDetail.address}
                    </span>
                  </div>
                  <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
                    <span className="text-[10px] text-[#8f8f8f] uppercase block mb-0.5">Registered</span>
                    <span className="text-[#171717] text-[11px]">
                      {new Date(borrowerDetail.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Loan Contracts */}
                <div>
                  <h4 className="font-semibold text-xs text-[#171717] mb-2 font-geist-mono uppercase">
                    Loan Contracts ({borrowerDetail.loans.length})
                  </h4>
                  {borrowerDetail.loans.length === 0 ? (
                    <p className="text-xs text-[#8f8f8f] font-geist-mono">No loans recorded for this borrower.</p>
                  ) : (
                    <div className="space-y-2">
                      {borrowerDetail.loans.map((l) => (
                        <div key={l.loanId} className="p-3 rounded-[8px] border border-[#ebebeb] flex items-center justify-between text-xs font-geist-mono">
                          <div>
                            <span className="font-semibold text-[#171717] font-sans">{l.productName}</span>
                            <span className="text-[#8f8f8f] ml-2 text-[11px] font-mono-num">Principal: {formatINR(l.loanAmount)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[#0070f3] font-mono-num font-medium">Outstanding: {formatINR(l.outstandingBalance)}</span>
                            <span className="px-2 py-0.5 rounded-[4px] bg-[#fafafa] border border-[#ebebeb] text-[#171717]">
                              {l.loanStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Ledger Transactions */}
                <div>
                  <h4 className="font-semibold text-xs text-[#171717] mb-2 font-geist-mono uppercase">
                    Recent Ledger Activity
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-geist-mono">
                      <thead>
                        <tr className="border-b border-[#ebebeb] text-[#8f8f8f] text-[10px] uppercase">
                          <th className="py-2 px-2">Type</th>
                          <th className="py-2 px-2">Amount</th>
                          <th className="py-2 px-2">Post Balance</th>
                          <th className="py-2 px-2">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f2f2f2]">
                        {borrowerDetail.recentTransactions.slice(0, 5).map((t) => (
                          <tr key={t.transactionId}>
                            <td className="py-2 px-2 text-[#171717]">{t.transactionType}</td>
                            <td className="py-2 px-2 font-mono-num">{formatINR(t.amount)}</td>
                            <td className="py-2 px-2 font-mono-num text-[#8f8f8f]">{formatINR(t.balanceAfter)}</td>
                            <td className="py-2 px-2 text-[10px] text-[#8f8f8f]">{new Date(t.transactionDate).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            <div className="mt-6 pt-3 border-t border-[#f2f2f2] flex justify-end">
              <button
                onClick={() => {
                  setSelectedBorrower(null);
                  setBorrowerDetail(null);
                }}
                className="btn-app-ghost"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
