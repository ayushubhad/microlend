import React from 'react';

export default function LandingView({ setActiveTab, onOpenAuthModal }) {
  return (
    <div className="flex flex-col gap-10 py-4 max-w-5xl mx-auto">
      
      {/* Hero Section */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>DBMS Academic Capstone Project (AY 2026–27)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            MicroLend: Secure OLTP-Based Micro-Lending &amp; EMI Engine
          </h1>

          <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
            A production-grade, relational Online Transaction Processing (OLTP) system engineered to handle frequent, small-ticket financial transactions with uncompromising mathematical precision, ACID guarantees, and an immutable audit trail.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span>Launch Live Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 border border-slate-200"
            >
              <span className="material-symbols-outlined text-lg">terminal</span>
              <span>Inspect DBMS Schema &amp; Concurrency</span>
            </button>
          </div>
        </div>

        {/* Background Decorative Grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 pointer-events-none hidden md:block">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#000" strokeWidth="0.5" />
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </section>

      {/* Why RDBMS & PostgreSQL Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Zero Double-Spending</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Leverages PostgreSQL row-level locks (<code>SELECT ... FOR UPDATE</code>) to serialize concurrent transactions on user wallets and loan balances, preventing race conditions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono-num font-semibold text-blue-600">
            Isolation: READ COMMITTED + MVCC
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">calculate</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Numeric Precision</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monetary values strictly utilize PostgreSQL <code>NUMERIC(15, 2)</code> types rather than floating-point numbers, completely eliminating binary rounding leakage across amortization schedules.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono-num font-semibold text-emerald-600">
            Data Type: NUMERIC(15, 2)
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">history_edu</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Immutable Audit Ledger</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every financial event is appended to <code>transaction_ledger</code>. Database-level triggers raise fatal exceptions on any attempt to execute <code>UPDATE</code> or <code>DELETE</code>.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono-num font-semibold text-indigo-600">
            Trigger: trg_protect_transaction_ledger
          </div>
        </div>

      </section>

      {/* Relational 3NF Architecture Breakdown */}
      <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Academic &amp; Architectural Context</h2>
        <p className="text-xs text-slate-500 mb-6">
          Vidyalankar Institute of Technology (VIT), Mumbai • Subject: Database Management Systems • Guide: Prof. Pankaj Vanwari
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono-num">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">users</span>
            <p className="text-slate-500 font-sans text-[11px]">Borrower identity records, hashed credentials, and unique Aadhaar KYC.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">wallets</span>
            <p className="text-slate-500 font-sans text-[11px]">1:1 with users. Authoritative persistent balance, locked during financial operations.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">loan_products</span>
            <p className="text-slate-500 font-sans text-[11px]">Pre-configured terms, APR rates, and min/max principal boundaries.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">loan_accounts</span>
            <p className="text-slate-500 font-sans text-[11px]">Instantiated loan contracts, outstanding balances, and active/closed states.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">emi_schedules</span>
            <p className="text-slate-500 font-sans text-[11px]">1:M with loans. Individual installment timelines with Principal &amp; Interest breakdown.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">transaction_ledger</span>
            <p className="text-slate-500 font-sans text-[11px]">Immutable, append-only log enabling first-principles balance reconstruction.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
