import React, { useState, useEffect } from 'react';
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
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(user ? 'dashboard' : 'home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPreset, setAuthPreset] = useState(null);

  // Sync tab state when authentication status changes
  useEffect(() => {
    if (user && activeTab === 'home') {
      setActiveTab('dashboard');
    } else if (!user && activeTab !== 'home') {
      setActiveTab('home');
    }
  }, [user]);

  const handleSignOut = () => {
    logout();
    setActiveTab('home');
    setAuthPreset(null);
    setShowAuthModal(true);
  };

  const handleOpenAuthModal = (preset = null) => {
    setAuthPreset(preset);
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#171717] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-geist-mono text-xs uppercase tracking-wider text-[#8f8f8f]">
            INITIALIZING MICROLEND // POSTGRESQL
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717]">
      {/* Fixed Header */}
      <Header
        onOpenAuthModal={handleOpenAuthModal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
      />

      {/* Fixed Sidebar (Rendered only for authenticated users) */}
      {user && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Main Content Area */}
      <main className={`${user ? 'pl-64' : ''} pt-14 min-h-screen`}>
        <div className="max-w-7xl mx-auto p-6 sm:p-8">
          {(!user || activeTab === 'home') && (
            <LandingView
              setActiveTab={setActiveTab}
              onOpenAuthModal={handleOpenAuthModal}
            />
          )}

          {user && activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {user && activeTab === 'approvals' && <ApprovalsView setActiveTab={setActiveTab} />}
          {user && activeTab === 'borrowers' && <BorrowersView setActiveTab={setActiveTab} />}
          {user && activeTab === 'wallet' && <WalletView />}
          {user && activeTab === 'products' && <ProductsView setActiveTab={setActiveTab} />}
          {user && activeTab === 'loans' && <LoansView setActiveTab={setActiveTab} />}
          {user && activeTab === 'ledger' && <LedgerView />}
          {user && activeTab === 'inspector' && <InspectorView />}
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialPreset={authPreset}
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
