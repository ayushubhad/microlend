import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../components/Modals';

export default function ApprovalsView({ setActiveTab }) {
  const { token } = useAuth();
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (token) {
      loadPendingLoans();
    }
  }, [token]);

  const loadPendingLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loans/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPendingLoans(data.pendingLoans || []);
      }
    } catch (err) {
      console.error('Fetch pending loans error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDisburse = async (loanId) => {
    if (!confirm('Authorize and disburse loan funds? This will atomically credit the borrower wallet and generate the EMI amortization schedule.')) {
      return;
    }
    setActionLoading(loanId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/loans/${loanId}/disburse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setFeedback({ type: 'success', message: `Loan #${loanId} authorized: INR ${data.data.netDisbursed.toFixed(2)} disbursed to borrower wallet.` });
      await loadPendingLoans();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (loanId) => {
    const reason = prompt('Please enter rejection reason:', 'Eligibility criteria not met');
    if (!reason) return;

    setActionLoading(loanId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/loans/${loanId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setFeedback({ type: 'success', message: `Loan #${loanId} rejected successfully.` });
      await loadPendingLoans();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-geist-mono text-[11px] font-medium text-[#8f8f8f] uppercase tracking-wider block mb-1">
            Officer Authorization Queue
          </span>
          <h2 className="text-xl font-semibold text-[#171717] tracking-tight">Loan Applications Awaiting Approval</h2>
          <p className="text-xs text-[#4d4d4d] mt-1">
            Authorize capital disbursement directly into borrower wallets with atomic amortization schedule generation, or decline requests.
          </p>
        </div>

        <button
          onClick={loadPendingLoans}
          className="btn-app-ghost self-start md:self-auto text-xs"
        >
          <span className="material-symbols-outlined text-xs">refresh</span>
          <span>Refresh Queue ({pendingLoans.length})</span>
        </button>
      </section>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-[8px] text-xs font-geist-mono flex items-center justify-between border ${
          feedback.type === 'success' 
            ? 'bg-[#f7faf7] border-[#d1ebd1] text-[#10b981]' 
            : 'bg-[#fff5f5] border-[#fcdada] text-[#ee0000]'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-[#8f8f8f] hover:text-[#171717]">✕</button>
        </div>
      )}

      {/* Applications Table */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-[#171717]">Pending Requests</h3>
            <span className="font-geist-mono text-[10px] px-2 py-0.2 rounded-[100px] bg-[#171717] text-white">
              {pendingLoans.length} PENDING
            </span>
          </div>
        </div>

        {pendingLoans.length === 0 ? (
          <div className="py-14 text-center">
            <span className="material-symbols-outlined text-3xl text-[#8f8f8f] mb-2 block">task_alt</span>
            <p className="text-sm font-semibold text-[#171717]">Queue is clear</p>
            <p className="text-xs text-[#8f8f8f] font-geist-mono mt-1">
              ALL BORROWER APPLICATIONS HAVE BEEN PROCESSED
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ebebeb] text-[#8f8f8f] font-geist-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3 font-medium">Borrower Details</th>
                  <th className="py-2.5 px-3 font-medium">Product / Term</th>
                  <th className="py-2.5 px-3 font-medium">Requested Principal</th>
                  <th className="py-2.5 px-3 font-medium">Calculated Monthly EMI</th>
                  <th className="py-2.5 px-3 font-medium">Submitted</th>
                  <th className="py-2.5 px-3 font-medium text-right">Officer Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f2]">
                {pendingLoans.map((loan) => (
                  <tr key={loan.loanId} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#171717]">{loan.borrowerName}</div>
                      <div className="font-geist-mono text-[11px] text-[#8f8f8f]">{loan.borrowerEmail}</div>
                      <div className="font-geist-mono text-[10px] text-[#8f8f8f]">{loan.borrowerPhone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#171717]">{loan.productName}</div>
                      <div className="font-geist-mono text-[11px] text-[#8f8f8f]">{loan.termMonths} Months • {loan.interestRate}% APR</div>
                      <div className="font-geist-mono text-[10px] text-[#8f8f8f]">Fee: {formatINR(loan.processingFee)}</div>
                    </td>
                    <td className="py-3 px-3 font-mono-num font-semibold text-base text-[#171717]">
                      {formatINR(loan.loanAmount)}
                    </td>
                    <td className="py-3 px-3 font-mono-num text-[#0070f3] font-medium">
                      {formatINR(loan.emiAmount)} / mo
                    </td>
                    <td className="py-3 px-3 font-geist-mono text-[11px] text-[#8f8f8f]">
                      {new Date(loan.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveDisburse(loan.loanId)}
                          disabled={actionLoading === loan.loanId}
                          className="btn-app-primary text-xs py-1.5 px-3"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          <span>Approve &amp; Disburse</span>
                        </button>
                        <button
                          onClick={() => handleReject(loan.loanId)}
                          disabled={actionLoading === loan.loanId}
                          className="px-2.5 py-1.5 rounded-[6px] text-xs font-normal border border-[#ebebeb] text-[#ee0000] hover:bg-[#fff5f5] transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                          <span>Reject</span>
                        </button>
                      </div>
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
