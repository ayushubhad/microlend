import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './pages/DashboardView';
import ApprovalsView from './pages/ApprovalsView';
import BorrowersView from './pages/BorrowersView';
import WalletView from './pages/WalletView';
import ProductsView from './pages/ProductsView';
import LoansView from './pages/LoansView';
import LedgerView from './pages/LedgerView';
import InspectorView from './pages/InspectorView';
import LandingView from './pages/LandingView';
import AuthModal from './pages/AuthModal';

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#171717] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-geist-mono text-xs uppercase tracking-wider text-[#8f8f8f]">INITIALIZING MICROLEND // POSTGRESQL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717]">
      {/* Fixed Header */}
      <Header
        onOpenAuthModal={() => setShowAuthModal(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Fixed Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="pl-64 pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 sm:p-8">
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'approvals' && <ApprovalsView setActiveTab={setActiveTab} />}
          {activeTab === 'borrowers' && <BorrowersView setActiveTab={setActiveTab} />}
          {activeTab === 'wallet' && <WalletView />}
          {activeTab === 'products' && <ProductsView setActiveTab={setActiveTab} />}
          {activeTab === 'loans' && <LoansView setActiveTab={setActiveTab} />}
          {activeTab === 'ledger' && <LedgerView />}
          {activeTab === 'inspector' && <InspectorView />}
          {activeTab === 'landing' && (
            <LandingView
              setActiveTab={setActiveTab}
              onOpenAuthModal={() => setShowAuthModal(true)}
            />
          )}
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
