import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onOpenAuthModal, activeTab, setActiveTab }) {
  const { user, wallet, logout, login } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const formatINR = (amt) => {
    return '₹ ' + (amt || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleSwitchPersona = async (email, password) => {
    try {
      await login(email, password);
      setShowPersonaMenu(false);
    } catch (err) {
      alert('Failed to switch persona: ' + err.message);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] h-16">
      <div className="h-full px-6 flex items-center justify-between">
        
        {/* Left: Brand & Engine Specs */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* MicroLend SVG Logo */}
            <div className="w-10 h-10 rounded-xl bg-[#0B192C] flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none">
                <path d="M24 8L37 14V24C37 32 29.5 38.5 24 40C18.5 38.5 11 32 11 24V14L24 8Z" stroke="#0066FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 23L23 27L30 19" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="24" cy="24" r="3" fill="#0066FF" fillOpacity="0.3"/>
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-slate-900 tracking-tight">MicroLend</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Micro-Finance Portal</span>
            </div>
          </div>

          {/* Security Status Banner */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-slate-700 font-medium">Bank-Grade Security • 256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* Right: Live Balance & Account Switcher */}
        <div className="flex items-center gap-4">
          
          {/* Verified Balance Pill */}
          {user && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Available Balance</span>
                <span className="font-mono-num text-sm font-bold text-slate-900">
                  {formatINR(wallet?.currentBalance)}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-tight flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">verified</span> Active
              </span>
            </div>
          )}

          {/* User Persona / Switcher */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2.5 p-1 pl-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col text-right hidden sm:flex">
                  <span className="text-xs font-semibold text-slate-900">{user.fullName}</span>
                  <span className="text-[10px] font-mono-num font-medium text-slate-500">
                    {user.role === 'ADMIN' ? '👑 System Admin' : '👤 Active Borrower'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {user.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="material-symbols-outlined text-slate-400 text-lg">arrow_drop_down</span>
              </button>

              {/* Persona Switcher Dropdown */}
              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Switch Account Persona</p>
                    <p className="text-xs text-slate-500 mt-0.5">Test real-time borrower vs admin permissions</p>
                  </div>

                  {/* Persona 1: Priya Sharma */}
                  <button
                    onClick={() => handleSwitchPersona('priya.sharma@example.com', 'Password@123')}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${user.email === 'priya.sharma@example.com' ? 'bg-blue-50/50' : ''}`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Priya Sharma</p>
                      <p className="text-[11px] text-slate-500">Borrower (Active Loan ₹45K)</p>
                    </div>
                    {user.email === 'priya.sharma@example.com' && (
                      <span className="material-symbols-outlined text-blue-600 text-base">check</span>
                    )}
                  </button>

                  {/* Persona 2: Admin */}
                  <button
                    onClick={() => handleSwitchPersona('admin@microlend.org', 'AdminPassword@123')}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${user.role === 'ADMIN' ? 'bg-blue-50/50' : ''}`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">System Administrator</p>
                      <p className="text-[11px] text-slate-500">Institutional Governance & Audit</p>
                    </div>
                    {user.role === 'ADMIN' && (
                      <span className="material-symbols-outlined text-blue-600 text-base">check</span>
                    )}
                  </button>

                  {/* Persona 3: Dr. Arvind Rao */}
                  <button
                    onClick={() => handleSwitchPersona('arvind.rao@example.com', 'Password@123')}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${user.email === 'arvind.rao@example.com' ? 'bg-blue-50/50' : ''}`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Dr. Arvind Rao</p>
                      <p className="text-[11px] text-slate-500">Borrower (Fresh Applicant)</p>
                    </div>
                    {user.email === 'arvind.rao@example.com' && (
                      <span className="material-symbols-outlined text-blue-600 text-base">check</span>
                    )}
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      logout();
                      setShowPersonaMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">login</span>
              Sign In / Register
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
