import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('microlend_token') || null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  async function fetchUser(authToken) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setWallet({
          walletId: data.user.walletId,
          currentBalance: data.user.walletBalance,
          lastUpdated: data.user.walletLastUpdated
        });
      } else {
        logout();
      }
    } catch (err) {
      console.error('Fetch user error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('microlend_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setWallet({
        walletId: data.user.walletId,
        currentBalance: data.user.walletBalance
      });
      return data;
    } catch (err) {
      throw err;
    }
  }

  async function register(userData) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('microlend_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setWallet({
        walletId: data.user.walletId,
        currentBalance: data.user.walletBalance
      });
      return data;
    } catch (err) {
      throw err;
    }
  }

  function logout() {
    localStorage.removeItem('microlend_token');
    setToken(null);
    setUser(null);
    setWallet(null);
  }

  async function refreshWallet() {
    if (!token) return;
    try {
      const res = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWallet(data.wallet);
        if (user) {
          setUser(prev => ({ ...prev, walletBalance: data.wallet.currentBalance }));
        }
      }
    } catch (err) {
      console.error('Wallet refresh error:', err);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        wallet,
        loading,
        login,
        register,
        logout,
        refreshWallet
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
