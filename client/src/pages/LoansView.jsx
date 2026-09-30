import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR, RepayEmiModal } from '../components/Modals';

export default function LoansView({ setActiveTab }) {
  const { token, user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [loanDetails, setLoanDetails] = useState(null);
  const [selectedEmiForPay, setSelectedEmiForPay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadLoans();
    }
  }, [token]);

  useEffect(() => {
    if (selectedLoanId) {
      loadLoanDetails(selectedLoanId);
    }
  }, [selectedLoanId]);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loans/my-loans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLoans(data.loans || []);
        if (data.loans && data.loans.length > 0) {
          setSelectedLoanId(data.loans[0].loanId);
        }
      }
    } catch (err) {
      console.error('Fetch loans error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLoanDetails = async (id) => {
    try {
      const res = await fetch(`/api/loans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLoanDetails(data.loan);
      }
    } catch (err) {
      console.error('Fetch loan details error:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-base">calendar_month</span>
            <span>Loan Portfolio &amp; EMI Amortization</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">My Loan Accounts</h2>
          <p className="text-xs text-slate-500 mt-1">
            Every installment is split into Principal and Interest components via strict Reducing Balance Amortization.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('products')}
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Apply For Another Loan</span>
        </button>
      </section>

      {/* Loan Selection Tabs */}
      {loans.length === 0 ? (
        <section className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">credit_card_off</span>
          </div>
          <h3 className="font-bold text-slate-800 text-base">No active loans found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
            You do not currently have any active or past loans. Browse our loan catalog to get started.
          </p>
          <button
            onClick={() => setActiveTab('products')}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Browse Loan Catalog
          </button>
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Loan Account Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loans.map((l) => {
              const isSelected = selectedLoanId === l.loanId;
              return (
                <div
                  key={l.loanId}
                  onClick={() => setSelectedLoanId(l.loanId)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-600 shadow-sm ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-slate-900">{l.productName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.loanStatus === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : l.loanStatus === 'CLOSED'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {l.loanStatus}
                    </span>
                  </div>

                  <div className="font-mono-num text-xl font-bold text-slate-900 mb-1">
                    {formatINR(l.outstandingBalance)}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono-num mb-3">
                    Outstanding of {formatINR(l.loanAmount)}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono-num">
                    <span className="text-slate-500">EMI: {formatINR(l.emiAmount)}</span>
                    <span className="font-semibold text-blue-600">{l.paidEmis}/{l.totalEmis} Paid</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Amortization Table */}
          {loanDetails && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Amortization Schedule: {loanDetails.productName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono-num">
                    Loan ID: #{loanDetails.loanId.slice(0, 8)} • APR: {loanDetails.interestRate}% • Total Payable: {formatINR(loanDetails.totalPayable)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Monthly Installment:</span>
                  <span className="font-mono-num font-bold text-blue-600 text-sm">{formatINR(loanDetails.emiAmount)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-3"># No</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">EMI Amount</th>
                      <th className="py-2.5 px-3">Principal Split</th>
                      <th className="py-2.5 px-3">Interest Split</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Payment Timestamp</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono-num">
                    {loanDetails.schedule?.map((emi) => (
                      <tr key={emi.emiId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-700">
                          #{String(emi.emiNumber).padStart(2, '0')}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{emi.dueDate}</td>
                        <td className="py-3 px-3 font-bold text-blue-600">{formatINR(emi.emiAmount)}</td>
                        <td className="py-3 px-3 text-emerald-700 font-medium">{formatINR(emi.principalComponent)}</td>
                        <td className="py-3 px-3 text-amber-700 font-medium">{formatINR(emi.interestComponent)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            emi.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {emi.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {emi.paidDate ? new Date(emi.paidDate).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {emi.paymentStatus === 'PAID' ? (
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              Paid
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedEmiForPay(emi)}
                              className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] rounded-lg transition-colors shadow-2xs"
                            >
                              Pay EMI
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </div>
      )}

      {/* Pay EMI Modal */}
      <RepayEmiModal
        isOpen={!!selectedEmiForPay}
        onClose={() => setSelectedEmiForPay(null)}
        emi={selectedEmiForPay}
        onSuccess={() => {
          loadLoans();
          if (selectedLoanId) loadLoanDetails(selectedLoanId);
        }}
      />

    </div>
  );
}
