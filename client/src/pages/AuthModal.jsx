import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialPreset = null }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('10000');

  useEffect(() => {
    if (isOpen) {
      if (initialPreset) {
        setEmail(initialPreset.email || '');
        setPassword(initialPreset.password || '');
        setIsRegister(Boolean(initialPreset.isRegister));
      } else {
        setEmail('');
        setPassword('');
        setIsRegister(false);
      }
      setError(null);
    }
  }, [isOpen, initialPreset]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        await register({
          full_name: fullName,
          email,
          phone_number: phone,
          password,
          address,
          aadhaar_number: aadhaar,
          initial_deposit: parseFloat(initialDeposit)
        });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-[16px] max-w-md w-full p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-[#ebebeb]">
        
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
          <div>
            <h3 className="text-base font-semibold text-[#171717] tracking-tight">
              {isRegister ? 'Borrower Registration' : 'Account Sign In'}
            </h3>
            <p className="font-geist-mono text-[11px] text-[#8f8f8f] mt-0.5">
              {isRegister ? 'ATOMIC USER & WALLET CREATION' : 'AUTHENTICATE VIA BCRYPT & JWT'}
            </p>
          </div>
          <button onClick={onClose} className="text-[#8f8f8f] hover:text-[#171717] p-1">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-[6px] bg-[#fff5f5] border border-[#ffcccc] text-[#ee0000] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {isRegister && (
            <>
              <div>
                <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">Legal Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-geist w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+919800000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-geist w-full text-xs font-mono-num"
                  />
                </div>
                <div>
                  <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">12-Digit Aadhaar</label>
                  <input
                    type="text"
                    required
                    maxLength="12"
                    placeholder="123456789012"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    className="input-geist w-full text-xs font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">Residential Address</label>
                <input
                  type="text"
                  required
                  placeholder="Flat 101, Mumbai, Maharashtra"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-geist w-full text-xs"
                />
              </div>

              <div>
                <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">Initial Wallet Credit (INR)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="input-geist w-full text-xs font-mono-num"
                />
              </div>
            </>
          )}

          {!isRegister && (
            <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] font-medium tracking-wide">
                  Quick Persona Credentials
                </span>
                <span className="font-geist-mono text-[9px] text-[#8f8f8f]">PostgreSQL Seeded</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('priya@gmail.com');
                    setPassword('Priya123');
                    setError(null);
                  }}
                  className={`p-2 text-left rounded-[6px] border transition-all ${
                    email === 'priya@gmail.com'
                      ? 'border-[#171717] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                      : 'border-[#ebebeb] bg-white hover:border-[#a1a1a1]'
                  }`}
                >
                  <span className="block text-[11px] font-medium text-[#171717] truncate">Priya Sharma</span>
                  <span className="block font-geist-mono text-[9px] text-[#8f8f8f] truncate">Active Borrower</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('arvind@gmail.com');
                    setPassword('Arvind123');
                    setError(null);
                  }}
                  className={`p-2 text-left rounded-[6px] border transition-all ${
                    email === 'arvind@gmail.com'
                      ? 'border-[#171717] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                      : 'border-[#ebebeb] bg-white hover:border-[#a1a1a1]'
                  }`}
                >
                  <span className="block text-[11px] font-medium text-[#171717] truncate">Dr. Arvind Rao</span>
                  <span className="block font-geist-mono text-[9px] text-[#8f8f8f] truncate">Zero Loans</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@gov.in');
                    setPassword('Admin123');
                    setError(null);
                  }}
                  className={`p-2 text-left rounded-[6px] border transition-all ${
                    email === 'admin@gov.in'
                      ? 'border-[#171717] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                      : 'border-[#ebebeb] bg-white hover:border-[#a1a1a1]'
                  }`}
                >
                  <span className="block text-[11px] font-medium text-[#171717] truncate">Admin</span>
                  <span className="block font-geist-mono text-[9px] text-[#8f8f8f] truncate">Loan Officer</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="borrower@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-geist w-full text-xs font-mono-num"
            />
          </div>

          <div>
            <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-geist w-full text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-marketing-primary w-full text-xs py-2.5"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Register & Provision Wallet' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-[#f2f2f2] text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-[#0070f3] hover:underline font-normal"
          >
            {isRegister
              ? 'Already registered? Sign in to your account'
              : "Don't have an account? Register as a borrower"}
          </button>
        </div>

      </div>
    </div>
  );
}
