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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/90 backdrop-blur-md border-b border-[#ebebeb] h-14">
      <div className="h-full px-6 flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Left: Vercel Delta Brand & Breadcrumb */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Iconic Vercel Delta Glyph */}
            <div className="w-6 h-6 flex items-center justify-center">
              <svg width="18" height="16" viewBox="0 0 76 65" fill="#171717">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/>
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#171717]">MicroLend</span>
          </div>

          <span className="text-[#a1a1a1] text-xs">/</span>

          <span className="font-geist-mono text-[11px] uppercase tracking-wider text-[#8f8f8f] hidden sm:inline-block">
            {activeTab}
          </span>
        </div>

        {/* Center / Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'loans', label: 'Loans' },
            { id: 'wallet', label: 'Wallet' },
            { id: 'ledger', label: 'Ledger' },
            { id: 'inspector', label: 'Schema' },
            { id: 'landing', label: 'Overview' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1 rounded-[6px] text-xs font-normal transition-colors ${
                activeTab === item.id 
                  ? 'text-[#171717] font-medium bg-[#f2f2f2]' 
                  : 'text-[#4d4d4d] hover:text-[#171717] hover:bg-[#f5f5f5]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Live Balance & Persona Controls */}
        <div className="flex items-center gap-3">
          
          {/* Geist Hairline Balance Badge */}
          {user && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-[#ebebeb] rounded-[6px] shadow-[0_1px_1px_rgba(0,0,0,0.03)]">
              <span className="font-geist-mono text-[11px] text-[#8f8f8f] uppercase">BAL</span>
              <span className="font-mono-num text-xs font-medium text-[#171717]">
                {formatINR(wallet?.currentBalance)}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" title="PostgreSQL Real-Time Connected"></span>
            </div>
          )}

          {/* User Persona / Account Switcher */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2 p-1 pl-2 bg-white border border-[#ebebeb] hover:border-[#a1a1a1] rounded-[6px] transition-colors shadow-[0_1px_1px_rgba(0,0,0,0.02)]"
              >
                <span className="text-xs font-medium text-[#171717] hidden sm:inline-block">
                  {user.fullName}
                </span>
                <span className="font-geist-mono text-[10px] text-[#8f8f8f] px-1 py-0.2 bg-[#f2f2f2] rounded-[3px]">
                  {user.role}
                </span>
                <span className="material-symbols-outlined text-[#8f8f8f] text-base">expand_more</span>
              </button>

              {/* Elevated Floating Dropdown Menu (Level 2 Elevation) */}
              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#ebebeb] py-2 z-50">
                  <div className="px-3.5 py-2 border-b border-[#f2f2f2]">
                    <p className="font-geist-mono text-[10px] font-medium uppercase tracking-wider text-[#8f8f8f]">Switch User Persona</p>
                    <p className="text-xs text-[#4d4d4d] mt-0.5">Toggle between borrower and administrator</p>
                  </div>

                  {/* Persona 1: Priya Sharma */}
                  <button
                    onClick={() => handleSwitchPersona('priya.sharma@example.com', 'Password@123')}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-[#fafafa] transition-colors ${user.email === 'priya.sharma@example.com' ? 'bg-[#f7f7f7]' : ''}`}
                  >
                    <div>
                      <p className="text-xs font-medium text-[#171717]">Priya Sharma</p>
                      <p className="font-geist-mono text-[10px] text-[#8f8f8f]">Borrower (Active Loan ₹45K)</p>
                    </div>
                    {user.email === 'priya.sharma@example.com' && (
                      <span className="material-symbols-outlined text-[#171717] text-sm">check</span>
                    )}
                  </button>

                  {/* Persona 2: Admin */}
                  <button
                    onClick={() => handleSwitchPersona('admin@microlend.org', 'AdminPassword@123')}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-[#fafafa] transition-colors ${user.role === 'ADMIN' ? 'bg-[#f7f7f7]' : ''}`}
                  >
                    <div>
                      <p className="text-xs font-medium text-[#171717]">System Administrator</p>
                      <p className="font-geist-mono text-[10px] text-[#8f8f8f]">Institutional Audit & Control</p>
                    </div>
                    {user.role === 'ADMIN' && (
                      <span className="material-symbols-outlined text-[#171717] text-sm">check</span>
                    )}
                  </button>

                  {/* Persona 3: Dr. Arvind Rao */}
                  <button
                    onClick={() => handleSwitchPersona('arvind.rao@example.com', 'Password@123')}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-[#fafafa] transition-colors ${user.email === 'arvind.rao@example.com' ? 'bg-[#f7f7f7]' : ''}`}
                  >
                    <div>
                      <p className="text-xs font-medium text-[#171717]">Dr. Arvind Rao</p>
                      <p className="font-geist-mono text-[10px] text-[#8f8f8f]">Borrower (Zero Loans)</p>
                    </div>
                    {user.email === 'arvind.rao@example.com' && (
                      <span className="material-symbols-outlined text-[#171717] text-sm">check</span>
                    )}
                  </button>

                  <div className="border-t border-[#f2f2f2] my-1"></div>

                  <button
                    onClick={() => {
                      logout();
                      setShowPersonaMenu(false);
                    }}
                    className="w-full px-3.5 py-1.5 text-left text-xs font-normal text-[#ee0000] hover:bg-[#fff5f5] flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuthModal}
                className="btn-app-ghost"
              >
                Log In
              </button>
              <button
                onClick={onOpenAuthModal}
                className="btn-app-primary"
              >
                Sign Up
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
