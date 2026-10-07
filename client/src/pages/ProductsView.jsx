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
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-geist-mono text-[11px] font-medium text-[#8f8f8f] uppercase tracking-wider block mb-1">
            Institutional Credit Catalog
          </span>
          <h2 className="text-xl font-semibold text-[#171717] tracking-tight">Standardized Loan Products</h2>
          <p className="text-xs text-[#4d4d4d] mt-1">
            Pre-configured credit products enforcing relational constraints, fixed APRs, and reducing-balance schedules.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-app-primary self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>{showCreateForm ? 'Close Form' : 'New Loan Product'}</span>
          </button>
        )}
      </section>

      {/* Admin Create Product Form */}
      {showCreateForm && (
        <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h3 className="text-sm font-semibold text-[#171717] mb-3">
            Create Loan Product (Administrator Privilege)
          </h3>

          {createError && (
            <div className="mb-4 p-2.5 rounded-[6px] bg-[#fff5f5] border border-[#ffcccc] text-[#ee0000] text-xs">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">Product Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Micro-Biz Expansion 6M"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="input-geist w-full text-xs"
              />
            </div>
            <div>
              <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">APR Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newInterestRate}
                onChange={(e) => setNewInterestRate(e.target.value)}
                className="input-geist w-full text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">Tenure (Months)</label>
              <input
                type="number"
                required
                value={newTermMonths}
                onChange={(e) => setNewTermMonths(e.target.value)}
                className="input-geist w-full text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">Processing Fee (INR)</label>
              <input
                type="number"
                step="0.01"
                value={newProcessingFee}
                onChange={(e) => setNewProcessingFee(e.target.value)}
                className="input-geist w-full text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">Min Principal (INR)</label>
              <input
                type="number"
                required
                value={newMinAmount}
                onChange={(e) => setNewMinAmount(e.target.value)}
                className="input-geist w-full text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1">Max Principal (INR)</label>
              <input
                type="number"
                required
                value={newMaxAmount}
                onChange={(e) => setNewMaxAmount(e.target.value)}
                className="input-geist w-full text-xs font-mono-num"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-app-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-app-primary"
              >
                Save Product
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Loan Products Grid (Geist Pricing Card Style) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((p) => (
          <div
            key={p.productId}
            className="bg-white rounded-[16px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-[#171717] transition-all"
          >
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-[#f2f2f2]">
                <div>
                  <h3 className="font-semibold text-[#171717] text-base">{p.productName}</h3>
                  <span className="font-geist-mono text-[11px] text-[#8f8f8f]">
                    CATALOG ID: #PRD-00{p.productId}
                  </span>
                </div>
                <span className="font-geist-mono text-xs font-medium px-2 py-0.5 rounded-[4px] border border-[#ebebeb] bg-[#fafafa] text-[#171717]">
                  {p.interestRate}% APR
                </span>
              </div>

              {/* Product Specifications Matrix */}
              <div className="grid grid-cols-2 gap-2.5 my-4 text-xs font-geist-mono">
                <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
                  <span className="text-[10px] uppercase text-[#8f8f8f] block mb-0.5">Principal Range</span>
                  <span className="font-medium text-[#171717] font-mono-num">
                    {formatINR(p.minLoanAmount)} – {formatINR(p.maxLoanAmount)}
                  </span>
                </div>
                <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
                  <span className="text-[10px] uppercase text-[#8f8f8f] block mb-0.5">Term Length</span>
                  <span className="font-medium text-[#171717]">{p.loanTermMonths} Months</span>
                </div>
                <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
                  <span className="text-[10px] uppercase text-[#8f8f8f] block mb-0.5">Processing Fee</span>
                  <span className="font-medium text-[#171717] font-mono-num">{formatINR(p.processingFee)}</span>
                </div>
                <div className="p-3 bg-[#fafafa] rounded-[8px] border border-[#ebebeb]">
                  <span className="text-[10px] uppercase text-[#8f8f8f] block mb-0.5">Formula</span>
                  <span className="font-medium text-[#0070f3]">Reducing Balance</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              {user?.role === 'ADMIN' ? (
                <div className="p-2.5 rounded-[8px] bg-[#fafafa] border border-[#ebebeb] text-center font-geist-mono text-xs text-[#8f8f8f]">
                  OFFICER MODE // BORROWER APPLICATION ONLY
                </div>
              ) : (
                <button
                  onClick={() => setSelectedProduct(p)}
                  className="btn-marketing-primary w-full text-xs py-2.5"
                >
                  <span>Apply for Micro-Credit</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
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
