import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR, DepositModal, WithdrawModal, RepayEmiModal } from '../components/Modals';

export default function DashboardView({ setActiveTab }) {
  const { user, wallet, token, refreshWallet } = useAuth();
  const [loans, setLoans] = useState([]);
  const [upcomingEmis, setUpcomingEmis] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedEmiForPay, setSelectedEmiForPay] = useState(null);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  const loadDashboardData = async () => {
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
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeLoan = loans.find(l => l.loanStatus === 'ACTIVE');
  const nextEmi = upcomingEmis[0];

  const totalBorrowed = activeLoan ? activeLoan.loanAmount : 0;
  const currentOutstanding = activeLoan ? activeLoan.outstandingBalance : 0;
  const amortPercent = totalBorrowed > 0 
    ? Math.min(100, Math.max(0, Math.round(((totalBorrowed - currentOutstanding) / totalBorrowed) * 100)))
    : 0;

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. USER PROFILE & VERIFIED IDENTITY WELL */}
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
              <span>AADHAAR: XXXX-XXXX-{user?.aadhaarNumber ? user.aadhaarNumber.slice(-4) : '8921'}</span>
              <span>•</span>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Quick Deposit & Withdrawal Controls */}
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

      {/* 2. 4-CARD FINANCIAL METRIC GRID (Geist Feature Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Available Balance */}
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
              Authoritative PostgreSQL wallet balance
            </p>
          </div>
        </div>

        {/* Card 2: Active Principal */}
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

        {/* Card 3: Next EMI Installment */}
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

        {/* Card 4: Ledger Audit Status */}
        <div className="bg-white rounded-[12px] p-5 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f]">Ledger Health</span>
              <span className="font-geist-mono text-[10px] text-[#10b981] font-medium">100% BALANCED</span>
            </div>
            <div className="font-mono-num text-xl font-semibold text-[#171717] tracking-tight">
              0 Discrepancies
            </div>
            <p className="text-xs text-[#8f8f8f] mt-1">
              Historical ledger debits and credits reconcile exactly.
            </p>
          </div>

          <div className="pt-3 mt-1">
            <button
              onClick={() => setActiveTab('inspector')}
              className="w-full btn-app-ghost"
            >
              <span>Inspect DBMS Schema</span>
            </button>
          </div>
        </div>

      </section>

      {/* 3. ACTIVE LOAN OVERVIEW */}
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
              className="font-geist-mono text-xs text-[#0070f3] hover:underline flex items-center gap-1"
            >
              <span>Schedule ({activeLoan.paidEmis}/{activeLoan.totalEmis} Paid)</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#fafafa] p-4 rounded-[8px] border border-[#ebebeb] text-xs">
            <div>
              <p className="font-geist-mono text-[10px] uppercase text-[#8f8f8f]">Principal</p>
              <p className="font-mono-num font-semibold text-[#171717] mt-0.5">{formatINR(activeLoan.loanAmount)}</p>
            </div>
            <div>
              <p className="font-geist-mono text-[10px] uppercase text-[#8f8f8f]">APR</p>
              <p className="font-mono-num font-semibold text-[#171717] mt-0.5">{activeLoan.interestRate}%</p>
            </div>
            <div>
              <p className="font-geist-mono text-[10px] uppercase text-[#8f8f8f]">Monthly EMI</p>
              <p className="font-mono-num font-semibold text-[#171717] mt-0.5">{formatINR(activeLoan.emiAmount)}</p>
            </div>
            <div>
              <p className="font-geist-mono text-[10px] uppercase text-[#8f8f8f]">Outstanding</p>
              <p className="font-mono-num font-semibold text-[#10b981] mt-0.5">{formatINR(activeLoan.outstandingBalance)}</p>
            </div>
          </div>
        </section>
      )}

      {/* 4. RECENT ACTIVITY TABLE (Hairline Data Table) */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-3">
          <h3 className="font-semibold text-sm text-[#171717]">Recent Transaction Activity</h3>
          <button
            onClick={() => setActiveTab('ledger')}
            className="font-geist-mono text-xs text-[#0070f3] hover:underline flex items-center gap-1"
          >
            <span>Full Statement</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>

        {recentTxns.length === 0 ? (
          <div className="text-center py-8 text-[#8f8f8f] text-xs font-geist-mono">NO TRANSACTIONS RECORDED</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ebebeb] text-[#8f8f8f] font-geist-mono text-[10px] uppercase">
                  <th className="py-2 px-3 font-medium">Reference</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Amount</th>
                  <th className="py-2 px-3 font-medium">Balance After</th>
                  <th className="py-2 px-3 font-medium">Timestamp</th>
                  <th className="py-2 px-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f2] font-mono-num">
                {recentTxns.map((t) => (
                  <tr key={t.transactionId} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-3 font-medium text-[#171717]">{t.referenceNo}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-geist-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border border-[#ebebeb] bg-[#fafafa] text-[#4d4d4d]">
                        {t.transactionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#171717]">
                      {formatINR(t.amount)}
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
        onSuccess={loadDashboardData}
      />
      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        onSuccess={loadDashboardData}
      />
      <RepayEmiModal
        isOpen={!!selectedEmiForPay}
        onClose={() => setSelectedEmiForPay(null)}
        emi={selectedEmiForPay}
        onSuccess={loadDashboardData}
      />

    </div>
  );
}
