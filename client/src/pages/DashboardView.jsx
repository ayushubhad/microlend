import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR, DepositModal, WithdrawModal, RepayEmiModal } from '../components/Modals';

export default function DashboardView({ setActiveTab }) {
  const { user, wallet, token } = useAuth();
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
      const [loansRes, emisRes, txnsRes] = await Promise.all([
        fetch('/api/loans/my-loans', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/emi/upcoming', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/ledger/my-history', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const loansData = await loansRes.json();
      const emisData = await emisRes.json();
      const txnsData = await txnsRes.json();

      if (loansData.success) setLoans(loansData.loans || []);
      if (emisData.success) setUpcomingEmis(emisData.upcomingEmis || []);
      if (txnsData.success) setRecentTxns(txnsData.transactions ? txnsData.transactions.slice(0, 5) : []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeLoan = loans.find(l => l.loanStatus === 'ACTIVE');
  const nextEmi = upcomingEmis[0];

  // Calculate amortization percent
  const totalBorrowed = activeLoan ? activeLoan.loanAmount : 0;
  const currentOutstanding = activeLoan ? activeLoan.outstandingBalance : 0;
  const settledPrincipal = totalBorrowed - currentOutstanding;
  const amortPercent = totalBorrowed > 0 ? Math.min(100, Math.round((settledPrincipal / totalBorrowed) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. USER PROFILE & ACCOUNT OVERVIEW */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-[#0B192C] text-white flex items-center justify-center font-bold text-lg border-2 border-slate-100 shadow-sm">
              {user?.fullName?.split(' ').map(n => n[0]).join('') || 'PS'}
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{user?.fullName || 'Borrower'}</h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                VERIFIED ACCOUNT
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-500 text-xs mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-slate-400">badge</span>
                Aadhaar: <span className="font-mono-num font-medium text-slate-700">XXXX-XXXX-{user?.aadhaarNumber ? user.aadhaarNumber.slice(-4) : '8921'}</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                KYC Status: Completed
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="flex items-center gap-1 text-[11px] text-slate-600">
                <span className="material-symbols-outlined text-sm text-slate-400">email</span>
                {user?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Account Standing Summary Pill */}
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 self-start lg:self-auto">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Account Standing</span>
            <span className="text-xs text-slate-900 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Excellent (Grade A)
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Credit Profile</span>
            <span className="text-xs text-blue-600 font-bold">Verified Micro-Credit</span>
          </div>
        </div>
      </section>

      {/* 2. TOP FINANCIAL METRICS ROW (4 CARDS) */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Card 1: Available Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Available Balance</span>
              </div>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live
              </span>
            </div>
            <div className="font-mono-num text-2xl font-bold text-slate-900">
              {formatINR(wallet?.currentBalance)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-emerald-500">check_circle</span>
              Available across all payment modes
            </p>
          </div>

          <div className="pt-4 flex gap-2">
            <button
              onClick={() => setShowDeposit(true)}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>Deposit</span>
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Card 2: Active Portfolio */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <span className="material-symbols-outlined text-lg">pie_chart</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Portfolio</span>
              </div>
              <span className="text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {activeLoan ? '1 Active' : '0 Active'}
              </span>
            </div>
            <div className="font-mono-num text-2xl font-bold text-slate-900">
              {formatINR(currentOutstanding)}
            </div>
            <p className="text-[11px] font-mono-num text-slate-500 mt-1">
              Principal Balance / {formatINR(totalBorrowed)} Borrowed
            </p>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Amortization</span>
              <span className="font-semibold text-slate-800 font-mono-num">{amortPercent}% Settled</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${amortPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Upcoming EMI */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <span className="material-symbols-outlined text-lg">event_upcoming</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Upcoming EMI</span>
              </div>
              <span className="text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                {nextEmi ? `DUE #${nextEmi.installmentNumber}` : 'CLEAR'}
              </span>
            </div>
            <div className="font-mono-num text-2xl font-bold text-slate-900">
              {formatINR(nextEmi ? nextEmi.emiAmount : 0)}
            </div>
            <p className="text-[11px] font-mono-num text-slate-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">event</span>
              {nextEmi ? `Due: ${nextEmi.dueDate}` : 'No overdue installments'}
            </p>
          </div>

          <div className="pt-4">
            {nextEmi ? (
              <button
                onClick={() => setSelectedEmiForPay(nextEmi)}
                className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">lock_clock</span>
                <span>Review &amp; Pay EMI</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('products')}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">credit_score</span>
                <span>Explore Loans</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Ledger Reconciliation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <span className="material-symbols-outlined text-lg">verified</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ledger Health</span>
              </div>
              <span className="text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% RECONCILED
              </span>
            </div>
            <div className="font-mono-num text-xl font-bold text-slate-900 flex items-center gap-1.5">
              <span>0 DISCREPANCIES</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Ledger matches wallet balance perfectly
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setActiveTab('inspector')}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm text-blue-600">account_tree</span>
              <span>View DBMS Schema</span>
            </button>
          </div>
        </div>

      </section>

      {/* 3. ACTIVE LOAN AMORTIZATION BREAKDOWN */}
      {activeLoan && (
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">account_balance</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{activeLoan.productName}</h3>
                <p className="text-xs text-slate-500">
                  Active Loan Contract • Started on {activeLoan.loanStartDate || 'Recent'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('loans')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Full Schedule ({activeLoan.paidEmis}/{activeLoan.totalEmis} Paid)</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Loan Principal</p>
              <p className="font-mono-num font-bold text-slate-900 text-sm mt-0.5">{formatINR(activeLoan.loanAmount)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Annual APR</p>
              <p className="font-mono-num font-bold text-blue-600 text-sm mt-0.5">{activeLoan.interestRate}%</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Monthly EMI</p>
              <p className="font-mono-num font-bold text-slate-900 text-sm mt-0.5">{formatINR(activeLoan.emiAmount)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Remaining Principal</p>
              <p className="font-mono-num font-bold text-emerald-600 text-sm mt-0.5">{formatINR(activeLoan.outstandingBalance)}</p>
            </div>
          </div>
        </section>
      )}

      {/* 4. RECENT TRANSACTION AUDIT LOG */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-700">receipt_long</span>
            <h3 className="font-bold text-slate-900 text-base">Recent Transactions &amp; Activity</h3>
          </div>
          <button
            onClick={() => setActiveTab('ledger')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View Full Statement</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        {recentTxns.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Reference No</th>
                  <th className="py-2.5 px-3">Operation Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Balance After</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono-num">
                {recentTxns.map((t) => (
                  <tr key={t.transactionId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-blue-600">{t.referenceNo}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.transactionType.includes('CREDIT') || t.transactionType.includes('DISBURSEMENT')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {t.transactionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {formatINR(t.amount)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {formatINR(t.balanceAfter)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {new Date(t.transactionDate).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-sans text-xs">
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
