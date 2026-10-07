import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR, DepositModal, WithdrawModal, RepayEmiModal } from '../components/Modals';

export default function DashboardView({ setActiveTab }) {
  const { user, wallet, token, refreshWallet } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [loans, setLoans] = useState([]);
  const [upcomingEmis, setUpcomingEmis] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);

  const [adminMetrics, setAdminMetrics] = useState(null);
  const [pendingLoans, setPendingLoans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedEmiForPay, setSelectedEmiForPay] = useState(null);

  useEffect(() => {
    if (token) {
      if (isAdmin) {
        loadAdminDashboardData();
      } else {
        loadBorrowerDashboardData();
      }
    }
  }, [token, isAdmin]);

  const loadBorrowerDashboardData = async () => {
    setLoading(true);
    try {
      await refreshWallet();
      const [loansRes, upcomingRes, txnsRes] = await Promise.all([
        fetch('/api/loans/my-loans', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/emi/upcoming', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/ledger/my-history', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const loansData = await loansRes.json();
      const upcomingData = await upcomingRes.json();
      const txnsData = await txnsRes.json();

      if (loansData.success) setLoans(loansData.loans || []);
      if (upcomingData.success) setUpcomingEmis(upcomingData.upcomingEmis || []);
      if (txnsData.success) setRecentTxns((txnsData.transactions || []).slice(0, 6));
    } catch (err) {
      console.error('Failed to load borrower dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, pendingRes, ledgerRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/loans/pending', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/ledger/my-history', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const metricsData = await metricsRes.json();
      const pendingData = await pendingRes.json();
      const ledgerData = await ledgerRes.json();

      if (metricsData.success) setAdminMetrics(metricsData.metrics);
      if (pendingData.success) setPendingLoans(pendingData.pendingLoans || []);
      if (ledgerData.success) setRecentTxns((ledgerData.transactions || []).slice(0, 8));
    } catch (err) {
      console.error('Failed to load admin dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDisburse = async (loanId) => {
    if (!confirm('Authorize and disburse loan funds to borrower wallet?')) return;
    setActionLoading(loanId);
    try {
      const res = await fetch(`/api/loans/${loanId}/disburse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      await loadAdminDashboardData();
    } catch (err) {
      alert('Error during authorization: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (loanId) => {
    const reason = prompt('Enter rejection reason:', 'Eligibility criteria not met');
    if (!reason) return;
    setActionLoading(loanId);
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

      await loadAdminDashboardData();
    } catch (err) {
      alert('Error during rejection: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Admin Officer Dashboard
  if (isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        
        {/* Officer Identity */}
        <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[8px] bg-[#171717] text-white flex items-center justify-center font-semibold text-base">
              SA
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-[#171717] tracking-tight">System Administrator</h1>
                <span className="font-geist-mono text-[10px] text-[#171717] px-2 py-0.5 rounded-[4px] border border-[#ebebeb] bg-[#fafafa] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                  OFFICER CONSOLE
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#8f8f8f] mt-1 font-geist-mono flex-wrap">
                <span>{user?.email || 'admin@microlend.org'}</span>
                <span>•</span>
                <span>Institutional Portfolio &amp; Risk Management</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('approvals')}
              className="btn-app-primary"
            >
              <span className="material-symbols-outlined text-[16px]">fact_check</span>
              <span>Approvals Queue ({pendingLoans.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('borrowers')}
              className="btn-app-ghost"
            >
              <span>Borrower Directory</span>
            </button>
          </div>
        </section>

        {/* KPI Metric Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[12px] p-5 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f]">Disbursed Capital</span>
                <span className="font-geist-mono text-[10px] text-[#10b981]">INSTITUTIONAL</span>
              </div>
              <div className="font-mono-num text-2xl font-semibold text-[#171717] tracking-tight">
                {formatINR(adminMetrics?.totalDisbursed)}
              </div>
              <p className="text-xs text-[#8f8f8f] mt-1">
                Cumulative capital disbursed to borrowers
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[12px] p-5 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f]">Active Portfolio Debt</span>
                <span className="font-geist-mono text-[10px] text-[#171717] font-medium">
                  {adminMetrics?.activeLoansCount || 0} CONTRACTS
                </span>
              </div>
              <div className="font-mono-num text-2xl font-semibold text-[#171717] tracking-tight">
                {formatINR(adminMetrics?.activePortfolioDebt)}
              </div>
              <p className="text-xs text-[#8f8f8f] mt-1">
                Current unamortized principal balance
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[12px] p-5 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f]">Pending Approvals</span>
                <span className={`font-geist-mono text-[10px] font-medium ${pendingLoans.length > 0 ? 'text-[#0070f3]' : 'text-[#10b981]'}`}>
                  {pendingLoans.length > 0 ? 'ACTION REQUIRED' : 'CLEAR'}
                </span>
              </div>
              <div className="font-mono-num text-2xl font-semibold text-[#171717] tracking-tight">
                {pendingLoans.length}
              </div>
              <p className="text-xs text-[#8f8f8f] mt-1 font-geist-mono">
                Loan requests awaiting officer review
              </p>
            </div>

            <div className="pt-3 mt-1">
              <button
                onClick={() => setActiveTab('approvals')}
                className="w-full btn-app-primary"
              >
                <span>Authorize Requests</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[12px] p-5 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f]">Managed Borrowers</span>
                <span className="font-geist-mono text-[10px] text-[#171717] font-medium">VERIFIED KYC</span>
              </div>
              <div className="font-mono-num text-2xl font-semibold text-[#171717] tracking-tight">
                {adminMetrics?.borrowersCount || 0} Profiles
              </div>
              <p className="text-xs text-[#8f8f8f] mt-1">
                Borrower accounts under officer management
              </p>
            </div>

            <div className="pt-3 mt-1">
              <button
                onClick={() => setActiveTab('borrowers')}
                className="w-full btn-app-ghost"
              >
                <span>View Directory</span>
              </button>
            </div>
          </div>
        </section>

        {/* Pending Loan Requests */}
        <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-4">
            <div>
              <h3 className="font-semibold text-sm text-[#171717]">Pending Loan Requests</h3>
              <p className="font-geist-mono text-[11px] text-[#8f8f8f] mt-0.5">
                DISBURSE CAPITAL TO BORROWER OR DECLINE APPLICATION
              </p>
            </div>

            <span className="font-geist-mono text-[10px] px-2 py-0.5 rounded-[100px] bg-[#171717] text-white">
              {pendingLoans.length} PENDING
            </span>
          </div>

          {pendingLoans.length === 0 ? (
            <div className="py-8 text-center text-[#8f8f8f] text-xs font-geist-mono">
              ZERO PENDING REQUESTS // ALL LOAN APPLICATIONS ARE PROCESSED
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ebebeb] text-[#8f8f8f] font-geist-mono text-[10px] uppercase">
                    <th className="py-2 px-3 font-medium">Borrower</th>
                    <th className="py-2 px-3 font-medium">Product / Term</th>
                    <th className="py-2 px-3 font-medium">Requested Principal</th>
                    <th className="py-2 px-3 font-medium">Monthly EMI</th>
                    <th className="py-2 px-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f2]">
                  {pendingLoans.slice(0, 5).map((loan) => (
                    <tr key={loan.loanId} className="hover:bg-[#fafafa]">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-[#171717]">{loan.borrowerName}</div>
                        <div className="font-geist-mono text-[11px] text-[#8f8f8f]">{loan.borrowerEmail}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-[#171717]">{loan.productName}</div>
                        <div className="font-geist-mono text-[11px] text-[#8f8f8f]">{loan.termMonths}M • {loan.interestRate}% APR</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono-num font-semibold text-[#171717]">
                        {formatINR(loan.loanAmount)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-[#0070f3]">
                        {formatINR(loan.emiAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveDisburse(loan.loanId)}
                            disabled={actionLoading === loan.loanId}
                            className="btn-app-primary text-xs py-1 px-2.5"
                          >
                            Approve &amp; Disburse
                          </button>
                          <button
                            onClick={() => handleReject(loan.loanId)}
                            disabled={actionLoading === loan.loanId}
                            className="px-2 py-1 rounded-[6px] text-xs border border-[#ebebeb] text-[#ee0000] hover:bg-[#fff5f5]"
                          >
                            Reject
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

        {/* Transaction Ledger Feed */}
        <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-3">
            <div>
              <h3 className="font-semibold text-sm text-[#171717]">System Transaction Ledger Feed</h3>
              <p className="font-geist-mono text-[11px] text-[#8f8f8f] mt-0.5">
                REAL-TIME FINANCIAL ACTIVITY ACROSS ALL MANAGED BORROWERS
              </p>
            </div>
            <button
              onClick={() => setActiveTab('ledger')}
              className="btn-app-ghost text-xs"
            >
              Full Institutional Ledger
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ebebeb] text-[#8f8f8f] font-geist-mono text-[10px] uppercase">
                  <th className="py-2 px-3 font-medium">Borrower</th>
                  <th className="py-2 px-3 font-medium">Operation</th>
                  <th className="py-2 px-3 font-medium">Amount</th>
                  <th className="py-2 px-3 font-medium">Timestamp</th>
                  <th className="py-2 px-3 font-medium">Reference Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f2] font-mono-num">
                {recentTxns.map((t) => (
                  <tr key={t.transactionId} className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-3">
                      <span className="font-sans font-medium text-[#171717]">{t.userName || 'System'}</span>
                      <span className="font-geist-mono text-[11px] text-[#8f8f8f] block">{t.userEmail}</span>
                    </td>
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
                    <td className="py-2.5 px-3 text-[#8f8f8f] text-[11px]">
                      {new Date(t.transactionDate).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#171717] text-[11px]">
                      {t.referenceNo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    );
  }

  // Borrower Dashboard
  const activeLoan = loans.find(l => l.loanStatus === 'ACTIVE');
  const nextEmi = upcomingEmis[0];

  const totalBorrowed = activeLoan ? activeLoan.loanAmount : 0;
  const currentOutstanding = activeLoan ? activeLoan.outstandingBalance : 0;
  const amortPercent = totalBorrowed > 0 
    ? Math.min(100, Math.max(0, Math.round(((totalBorrowed - currentOutstanding) / totalBorrowed) * 100)))
    : 0;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Borrower Profile */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[8px] bg-[#171717] text-white flex items-center justify-center font-semibold text-base">
            {user?.fullName?.split(' ').map(n => n[0]).join('') || 'PS'}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-[#171717] tracking-tight">{user?.fullName || 'Borrower'}</h1>
              <span className="font-geist-mono text-[10px] text-[#10b981] px-1.5 py-0.5 rounded-[4px] border border-[#d1ebd1] bg-[#f7faf7] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                KYC VERIFIED
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#8f8f8f] mt-1 font-geist-mono flex-wrap">
              <span>{user?.email}</span>
              {user?.phone && (
                <>
                  <span>•</span>
                  <span>{user?.phone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowDeposit(true)}
            className="btn-app-primary"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Deposit</span>
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="btn-app-ghost"
          >
            <span>Withdraw</span>
          </button>
        </div>
      </section>

      {/* Financial Overview Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-[12px] p-5 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f]">Available Balance</span>
              <span className="font-geist-mono text-[10px] text-[#10b981]">LIVE</span>
            </div>
            <div className="font-mono-num text-2xl font-semibold text-[#171717] tracking-tight">
              {formatINR(wallet?.currentBalance)}
            </div>
            <p className="text-xs text-[#8f8f8f] mt-1">
              Verified digital wallet balance
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-5 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f]">Active Principal</span>
              <span className="font-geist-mono text-[10px] text-[#171717] font-medium">
                {activeLoan ? '1 ACTIVE' : '0 ACTIVE'}
              </span>
            </div>
            <div className="font-mono-num text-2xl font-semibold text-[#171717] tracking-tight">
              {formatINR(currentOutstanding)}
            </div>
            <div className="mt-2.5">
              <div className="flex justify-between text-[11px] font-geist-mono text-[#8f8f8f] mb-1">
                <span>Amortization</span>
                <span>{amortPercent}% Settled</span>
              </div>
              <div className="w-full bg-[#f2f2f2] rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#171717] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${amortPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-5 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f]">Upcoming EMI</span>
              <span className="font-geist-mono text-[10px] text-[#0070f3] font-medium">
                {nextEmi ? `DUE #${nextEmi.installmentNumber}` : 'CLEAR'}
              </span>
            </div>
            <div className="font-mono-num text-2xl font-semibold text-[#171717] tracking-tight">
              {formatINR(nextEmi ? nextEmi.emiAmount : 0)}
            </div>
            <p className="text-xs text-[#8f8f8f] mt-1 font-geist-mono">
              {nextEmi ? `Due: ${nextEmi.dueDate}` : 'No pending installments'}
            </p>
          </div>

          <div className="pt-3 mt-1">
            {nextEmi ? (
              <button
                onClick={() => setSelectedEmiForPay(nextEmi)}
                className="w-full btn-app-primary"
              >
                <span>Pay Installment</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('products')}
                className="w-full btn-app-ghost"
              >
                <span>Explore Loans</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Active Loan Details */}
      {activeLoan && (
        <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-4">
            <div>
              <h3 className="font-semibold text-sm text-[#171717]">{activeLoan.productName}</h3>
              <p className="font-geist-mono text-[11px] text-[#8f8f8f] mt-0.5">
                DISBURSED: {activeLoan.loanStartDate || 'Recent'} // CONTRACT ACTIVE
              </p>
            </div>

            <button
              onClick={() => setActiveTab('loans')}
              className="btn-app-ghost text-xs"
            >
              Full Schedule
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-geist-mono">
            <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
              <span className="text-[10px] uppercase text-[#8f8f8f] block mb-0.5">Loan Amount</span>
              <span className="font-mono-num font-semibold text-sm text-[#171717]">{formatINR(activeLoan.loanAmount)}</span>
            </div>
            <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
              <span className="text-[10px] uppercase text-[#8f8f8f] block mb-0.5">Monthly EMI</span>
              <span className="font-mono-num font-semibold text-sm text-[#0070f3]">{formatINR(activeLoan.emiAmount)}</span>
            </div>
            <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
              <span className="text-[10px] uppercase text-[#8f8f8f] block mb-0.5">Interest Rate</span>
              <span className="font-medium text-[#171717]">{activeLoan.interestRate}% APR</span>
            </div>
            <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
              <span className="text-[10px] uppercase text-[#8f8f8f] block mb-0.5">Progress</span>
              <span className="font-medium text-[#10b981]">{activeLoan.paidEmis || 0} / {activeLoan.totalEmis || 12} Paid</span>
            </div>
          </div>
        </section>
      )}

      {/* Recent Transactions */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-3">
          <h3 className="font-semibold text-sm text-[#171717]">Recent Transaction History</h3>
          <button
            onClick={() => setActiveTab('ledger')}
            className="text-xs text-[#8f8f8f] hover:text-[#171717] font-geist-mono"
          >
            View All ({recentTxns.length}) →
          </button>
        </div>

        {recentTxns.length === 0 ? (
          <div className="py-6 text-center text-[#8f8f8f] text-xs font-geist-mono">NO TRANSACTIONS YET</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ebebeb] text-[#8f8f8f] font-geist-mono text-[10px] uppercase">
                  <th className="py-2 px-3 font-medium">Operation</th>
                  <th className="py-2 px-3 font-medium">Amount</th>
                  <th className="py-2 px-3 font-medium">Post Balance</th>
                  <th className="py-2 px-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Reference Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f2] font-mono-num">
                {recentTxns.map((t) => (
                  <tr key={t.transactionId} className="hover:bg-[#fafafa]">
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
                    <td className="py-2.5 px-3 font-medium text-[#171717] text-[11px]">
                      {t.referenceNo}
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
        onSuccess={loadBorrowerDashboardData}
      />
      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        currentBalance={wallet?.currentBalance || 0}
        onSuccess={loadBorrowerDashboardData}
      />
      <RepayEmiModal
        isOpen={!!selectedEmiForPay}
        onClose={() => setSelectedEmiForPay(null)}
        emi={selectedEmiForPay}
        walletBalance={wallet?.currentBalance || 0}
        onSuccess={loadBorrowerDashboardData}
      />

    </div>
  );
}
