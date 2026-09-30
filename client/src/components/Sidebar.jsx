import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', badge: null },
    { id: 'wallet', label: 'My Wallet', icon: 'account_balance_wallet', badge: null },
    { id: 'products', label: 'Loan Products', icon: 'credit_score', badge: null },
    { id: 'loans', label: 'My Loans & EMIs', icon: 'calendar_month', badge: null },
    { id: 'ledger', label: 'Transaction Ledger', icon: 'receipt_long', badge: 'Verified' },
    { id: 'inspector', label: 'DBMS Schema', icon: 'account_tree', badge: 'Inspector' },
    { id: 'landing', label: 'System Overview', icon: 'info', badge: null },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 z-40 flex flex-col justify-between py-6">
      
      {/* Top Nav Section */}
      <div className="px-4 flex flex-col gap-2">
        <div className="px-3 py-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono-num">
            Financial Services
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded font-mono-num ${
                      isActive
                        ? 'bg-blue-700 text-blue-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Security / Trust Badge */}
      <div className="px-4">
        <div className="p-3.5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-lg">verified_user</span>
            <span className="text-xs font-semibold tracking-tight">Enterprise Security</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            End-to-end encrypted financial ledger with automated reconciliation.
          </p>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Core Version</span>
            <span className="font-semibold text-emerald-400">v2.4 Production</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
