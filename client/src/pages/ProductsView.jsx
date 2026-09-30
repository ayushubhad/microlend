import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR, ApplyLoanModal } from '../components/Modals';

export default function ProductsView({ setActiveTab }) {
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin New Product Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newInterestRate, setNewInterestRate] = useState('11.00');
  const [newTermMonths, setNewTermMonths] = useState('6');
  const [newProcessingFee, setNewProcessingFee] = useState('200.00');
  const [newMinAmount, setNewMinAmount] = useState('5000');
  const [newMaxAmount, setNewMaxAmount] = useState('30000');
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setCreateError(null);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          product_name: newProductName,
          interest_rate: parseFloat(newInterestRate),
          loan_term_months: parseInt(newTermMonths, 10),
          processing_fee: parseFloat(newProcessingFee),
          min_loan_amount: parseFloat(newMinAmount),
          max_loan_amount: parseFloat(newMaxAmount)
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setShowCreateForm(false);
      setNewProductName('');
      await loadProducts();
    } catch (err) {
      setCreateError(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Banner */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-base">credit_score</span>
            <span>Institutional Loan Catalog</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Configured Loan Products</h2>
          <p className="text-xs text-slate-500 mt-1">
            Every product enforces strict database-level loan limits, fixed APR interest rates, and term durations.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>{showCreateForm ? 'Close Form' : 'Create New Product'}</span>
          </button>
        )}
      </section>

      {/* Admin Create Product Form */}
      {showCreateForm && (
        <section className="bg-white rounded-2xl p-6 border border-blue-200 shadow-md">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">settings_applications</span>
            <span>Define New Loan Product (Admin Only)</span>
          </h3>

          {createError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Product Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Micro-Biz Expansion 6M"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">APR Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newInterestRate}
                onChange={(e) => setNewInterestRate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Tenure (Months)</label>
              <input
                type="number"
                required
                value={newTermMonths}
                onChange={(e) => setNewTermMonths(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Processing Fee (INR)</label>
              <input
                type="number"
                step="0.01"
                value={newProcessingFee}
                onChange={(e) => setNewProcessingFee(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Min Loan Amount (INR)</label>
              <input
                type="number"
                required
                value={newMinAmount}
                onChange={(e) => setNewMinAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-num"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Max Loan Amount (INR)</label>
              <input
                type="number"
                required
                value={newMaxAmount}
                onChange={(e) => setNewMaxAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-num"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="py-2 px-4 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs"
              >
                Save Product to Catalog
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Loan Products Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((p) => (
          <div
            key={p.productId}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{p.productName}</h3>
                  <span className="text-[11px] font-mono-num text-slate-500 font-medium">
                    Product ID: #PRD-00{p.productId}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-mono-num border border-blue-200">
                  {p.interestRate}% APR
                </span>
              </div>

              {/* Product Specifications Table */}
              <div className="grid grid-cols-2 gap-3 my-4 text-xs font-mono-num">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Loan Range</span>
                  <span className="font-bold text-slate-900">
                    {formatINR(p.minLoanAmount)} - {formatINR(p.maxLoanAmount)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Tenure Period</span>
                  <span className="font-bold text-slate-900">{p.loanTermMonths} Installments (Months)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Processing Fee</span>
                  <span className="font-bold text-slate-900">{formatINR(p.processingFee)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Calculation</span>
                  <span className="font-bold text-blue-600">Reducing Balance</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedProduct(p)}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">bolt</span>
                <span>Apply &amp; Disburse Instant Loan</span>
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Apply Loan Modal */}
      <ApplyLoanModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onSuccess={() => {
          setActiveTab('loans');
        }}
      />

    </div>
  );
}
