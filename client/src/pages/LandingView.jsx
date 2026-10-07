import React from 'react';

export default function LandingView({ setActiveTab, onOpenAuthModal }) {
  return (
    <div className="flex flex-col gap-16 py-4 max-w-6xl mx-auto">
      
      {/* Hero Section */}
      <section className="relative rounded-[20px] p-8 sm:p-14 md:p-20 border border-[#ebebeb] overflow-hidden bg-white hero-mesh-gradient">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[100px] bg-white border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#171717] animate-pulse"></span>
            <span className="font-geist-mono text-xs uppercase tracking-wider text-[#171717] font-medium">
              Academic DBMS Capstone // AY 2026–27
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#171717] tracking-display-xl leading-[1.05]">
            MicroLend: Secure OLTP Micro-Finance Engine
          </h1>

          <p className="text-[#4d4d4d] text-base sm:text-lg mt-5 leading-relaxed max-w-2xl font-normal">
            A production-grade, strictly relational micro-lending and EMI management system engineered in PostgreSQL with 3NF normalization, ACID transaction boundaries, pessimistic row-level locking, and an immutable audit trail.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="btn-marketing-primary"
            >
              <span>Launch Dashboard</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className="btn-marketing-secondary"
            >
              <span className="material-symbols-outlined text-base">account_tree</span>
              <span>Inspect DBMS Schema</span>
            </button>
          </div>
        </div>
      </section>

      {/* Spec Strip */}
      <section className="py-4 border-y border-[#ebebeb] bg-[#fafafa]">
        <div className="flex flex-wrap items-center justify-between gap-6 px-4 text-xs font-geist-mono text-[#8f8f8f]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            VIDYALANKAR INSTITUTE OF TECHNOLOGY (VIT)
          </span>
          <span>POSTGRESQL 18.4 RELATIONAL ENGINE</span>
          <span>ACID OLTP TRANSACTIONS</span>
          <span>REDUCING BALANCE AMORTIZATION</span>
          <span>THIRD NORMAL FORM (3NF)</span>
        </div>
      </section>

      {/* Architectural Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-[16px] border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-[#171717] transition-all">
          <div>
            <div className="w-full h-1 rounded-full bg-gradient-to-r from-[#007cf0] to-[#00dfd8] mb-5"></div>
            <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f] block mb-1">
              Concurrency Defense
            </span>
            <h3 className="font-semibold text-lg text-[#171717] tracking-tight mb-2">Zero Double-Spending</h3>
            <p className="text-xs text-[#4d4d4d] leading-relaxed">
              Enforces PostgreSQL pessimistic row-level locking (<code>SELECT ... FOR UPDATE</code>) on wallets and accounts. Parallel withdrawal attempts are serialized deterministically, eliminating overdraft anomalies.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-[#f2f2f2] font-geist-mono text-[11px] text-[#171717]">
            Locking: EXCLUSIVE ROW LOCK
          </div>
        </div>

        <div className="bg-white p-7 rounded-[16px] border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-[#171717] transition-all">
          <div>
            <div className="w-full h-1 rounded-full bg-gradient-to-r from-[#7928ca] to-[#ff0080] mb-5"></div>
            <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f] block mb-1">
              Exact Arithmetic
            </span>
            <h3 className="font-semibold text-lg text-[#171717] tracking-tight mb-2">Numeric Precision</h3>
            <p className="text-xs text-[#4d4d4d] leading-relaxed">
              All financial figures strictly utilize arbitrary-precision <code>NUMERIC(15, 2)</code> types. Binary floating-point errors (IEEE 754) are forbidden, ensuring legal banking compliance across amortization schedules.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-[#f2f2f2] font-geist-mono text-[11px] text-[#171717]">
            Data Type: NUMERIC(15, 2)
          </div>
        </div>

        <div className="bg-white p-7 rounded-[16px] border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-[#171717] transition-all">
          <div>
            <div className="w-full h-1 rounded-full bg-gradient-to-r from-[#ff4d4d] to-[#f9cb28] mb-5"></div>
            <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f] block mb-1">
              Engine Defenses
            </span>
            <h3 className="font-semibold text-lg text-[#171717] tracking-tight mb-2">Immutable Audit Ledger</h3>
            <p className="text-xs text-[#4d4d4d] leading-relaxed">
              All transactions append to an immutable ledger. PostgreSQL engine triggers (<code>trg_protect_transaction_ledger</code>) raise fatal exceptions on any attempt to execute <code>UPDATE</code> or <code>DELETE</code>.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-[#f2f2f2] font-geist-mono text-[11px] text-[#171717]">
            Trigger: BEFORE UPDATE OR DELETE
          </div>
        </div>
      </section>

      {/* Transaction SQL Spec */}
      <section className="bg-white rounded-[16px] p-6 sm:p-8 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between pb-4 border-b border-[#f2f2f2] mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#171717]"></span>
            <span className="font-geist-mono text-xs text-[#171717] font-medium">schema.sql // RELATIONAL TRANSACTION BOUNDARY</span>
          </div>
          <span className="font-geist-mono text-[11px] text-[#8f8f8f]">PL/pgSQL</span>
        </div>

        <pre className="font-geist-mono text-xs text-[#171717] bg-[#fafafa] p-5 rounded-[8px] border border-[#ebebeb] overflow-x-auto leading-relaxed">
{`-- Atomic Loan Repayment & Amortization in PostgreSQL
BEGIN;

  -- 1. Acquire exclusive lock on borrower wallet
  SELECT wallet_id, current_balance FROM wallets WHERE user_id = $1 FOR UPDATE;

  -- 2. Deduct EMI from wallet
  UPDATE wallets SET current_balance = current_balance - $2 WHERE wallet_id = $3;

  -- 3. Amortize loan balance and mark installment paid
  UPDATE emi_schedules SET payment_status = 'PAID', paid_date = CURRENT_TIMESTAMP WHERE emi_id = $4;
  UPDATE loan_accounts SET outstanding_balance = outstanding_balance - $5 WHERE loan_id = $6;

  -- 4. Append immutable entry to transaction ledger (Trigger-Protected)
  INSERT INTO transaction_ledger (user_id, wallet_id, loan_id, transaction_type, amount, balance_after_transaction, reference_no)
  VALUES ($1, $3, $6, 'EMI_PAYMENT', $2, $7, $8);

COMMIT;`}
        </pre>
      </section>

      {/* Relational Entities */}
      <section className="bg-white rounded-[16px] p-6 sm:p-8 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <h2 className="text-xl font-semibold text-[#171717] tracking-tight mb-1">
          Normalized Relational Entities (3NF)
        </h2>
        <p className="text-xs text-[#8f8f8f] font-geist-mono mb-6 uppercase">
          Department of Computer Engineering // Vidyalankar Institute of Technology, Mumbai
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-geist-mono">
          <div className="p-4 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
            <span className="font-semibold text-[#171717] block mb-1">users</span>
            <p className="text-[#4d4d4d] font-sans text-xs">Customer profiles, hashed authentication credentials, unique Aadhaar KYC references.</p>
          </div>

          <div className="p-4 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
            <span className="font-semibold text-[#171717] block mb-1">wallets</span>
            <p className="text-[#4d4d4d] font-sans text-xs">1:1 with users. Authoritative balance store, subject to exclusive row locks.</p>
          </div>

          <div className="p-4 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
            <span className="font-semibold text-[#171717] block mb-1">loan_products</span>
            <p className="text-[#4d4d4d] font-sans text-xs">Institutional catalog specifying APR rates, tenure months, and principal limits.</p>
          </div>

          <div className="p-4 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
            <span className="font-semibold text-[#171717] block mb-1">loan_accounts</span>
            <p className="text-[#4d4d4d] font-sans text-xs">Active loan contracts, outstanding balances, and disbursement dates.</p>
          </div>

          <div className="p-4 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
            <span className="font-semibold text-[#171717] block mb-1">emi_schedules</span>
            <p className="text-[#4d4d4d] font-sans text-xs">Monthly installment schedule with mathematical principal/interest split.</p>
          </div>

          <div className="p-4 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
            <span className="font-semibold text-[#171717] block mb-1">transaction_ledger</span>
            <p className="text-[#4d4d4d] font-sans text-xs">Tamper-evident, trigger-defended append-only audit trail enabling mathematical reconciliation.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-white rounded-[16px] p-8 sm:p-14 border border-[#ebebeb] text-center flex flex-col items-center justify-center">
        <h2 className="text-3xl sm:text-4xl font-semibold text-[#171717] tracking-display-xl mb-3">
          Explore the Live MicroLend Engine
        </h2>
        <p className="text-[#4d4d4d] text-sm max-w-md mb-6">
          Log in with pre-seeded borrower or admin personas to test transactions, apply for loans, and run live concurrency simulations.
        </p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="btn-marketing-primary"
        >
          <span>Open Web Application</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </section>

      {/* Footer */}
      <footer className="pt-8 pb-12 border-t border-[#ebebeb] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8f8f8f] gap-4 font-geist-mono">
        <div>
          <span>MICROLEND // ACADEMIC DBMS CAPSTONE (AY 2026–27)</span>
        </div>
        <div>
          <span>SUPERVISED BY PROF. PANKAJ VANWARI • VIT MUMBAI</span>
        </div>
      </footer>

    </div>
  );
}
