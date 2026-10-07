import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = isAdmin ? [
    { id: 'dashboard', label: 'Officer Dashboard', icon: 'space_dashboard' },
    { id: 'approvals', label: 'Loan Approvals', icon: 'fact_check' },
    { id: 'borrowers', label: 'Borrower Directory', icon: 'group' },
    { id: 'products', label: 'Loan Products', icon: 'account_tree' },
    { id: 'ledger', label: 'Institutional Ledger', icon: 'receipt_long' },
    { id: 'inspector', label: 'DBMS Schema', icon: 'data_object' },
    { id: 'landing', label: 'Documentation', icon: 'menu_book' },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { id: 'loans', label: 'Loans & EMIs', icon: 'credit_card' },
    { id: 'products', label: 'Loan Products', icon: 'account_tree' },
    { id: 'wallet', label: 'My Wallet', icon: 'account_balance_wallet' },
    { id: 'ledger', label: 'Transaction Ledger', icon: 'receipt_long' },
    { id: 'inspector', label: 'DBMS Schema', icon: 'data_object' },
    { id: 'landing', label: 'Documentation', icon: 'menu_book' },
  ];

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-64 bg-[#fafafa] border-r border-[#ebebeb] z-40 flex flex-col justify-between py-5">
      
      {/* Navigation */}
      <div className="px-3 flex flex-col gap-2">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-xs transition-colors ${
                  isActive
                    ? 'bg-[#f2f2f2] text-[#171717] font-medium'
                    : 'text-[#4d4d4d] hover:bg-[#f7f7f7] hover:text-[#171717]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-[#171717]' : 'text-[#8f8f8f]'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.id === 'ledger' && (
                  <span className="font-geist-mono text-[9px] uppercase px-1.5 py-0.2 rounded-[4px] border border-[#ebebeb] bg-white text-[#8f8f8f]">
                    Audit
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Info */}
      <div className="px-3">
        <div className="p-3 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-geist-mono text-[10px] text-[#8f8f8f] uppercase">Engine</span>
            <span className="font-geist-mono text-[10px] text-[#171717] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
              PostgreSQL 18.4
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-geist-mono text-[10px] text-[#8f8f8f] uppercase">Isolation</span>
            <span className="font-geist-mono text-[10px] text-[#171717]">READ_COMMITTED</span>
          </div>

          <div className="pt-2 border-t border-[#f2f2f2] flex items-center justify-between text-[11px] text-[#8f8f8f]">
            <span className="font-geist-mono text-[10px]">Pessimistic Locks</span>
            <span className="font-geist-mono text-[10px] text-[#171717] font-medium">ROW_LOCK</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
