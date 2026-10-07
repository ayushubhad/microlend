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
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-geist-mono text-[11px] font-medium text-[#8f8f8f] uppercase tracking-wider block mb-1">
            Amortization Schedules
          </span>
          <h2 className="text-xl font-semibold text-[#171717] tracking-tight">Active Loan Accounts &amp; EMIs</h2>
          <p className="text-xs text-[#4d4d4d] mt-1">
            Every installment is split into principal and interest via strict reducing-balance mathematical formula.
          </p>
        </div>

        {user?.role !== 'ADMIN' && (
          <button
            onClick={() => setActiveTab('products')}
            className="btn-app-primary self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Apply For Loan</span>
          </button>
        )}
      </section>

      {/* Loan Selection Cards or Empty State */}
      {loans.length === 0 ? (
        <section className="bg-white rounded-[12px] p-12 text-center border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <span className="material-symbols-outlined text-3xl text-[#8f8f8f] mb-2 block">credit_card_off</span>
          <h3 className="font-semibold text-sm text-[#171717]">No active loans found</h3>
          <p className="text-xs text-[#8f8f8f] mt-1 mb-4 max-w-sm mx-auto font-geist-mono">
            ZERO CONTRACTS ACTIVE IN POSTGRESQL DATABASE
          </p>
          <button
            onClick={() => setActiveTab('products')}
            className="btn-app-primary"
          >
            Browse Products
          </button>
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Loan Account Cards (Geist Tiles) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loans.map((l) => {
              const isSelected = selectedLoanId === l.loanId;
              return (
                <div
                  key={l.loanId}
                  onClick={() => setSelectedLoanId(l.loanId)}
                  className={`p-5 rounded-[12px] border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-[#171717] shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-[#171717]'
                      : 'bg-white border-[#ebebeb] hover:border-[#a1a1a1]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-[#171717]">{l.productName}</span>
                    <span className="font-geist-mono text-[10px] uppercase px-1.5 py-0.2 rounded-[4px] border border-[#ebebeb] bg-[#fafafa] text-[#171717]">
                      {l.loanStatus}
                    </span>
                  </div>

                  <div className="font-mono-num text-xl font-semibold text-[#171717] mb-1">
                    {formatINR(l.outstandingBalance)}
                  </div>
                  <p className="text-xs text-[#8f8f8f] font-mono-num mb-3">
                    Outstanding of {formatINR(l.loanAmount)}
                  </p>

                  <div className="pt-2.5 border-t border-[#f2f2f2] flex items-center justify-between text-xs font-geist-mono text-[#8f8f8f]">
                    <span>EMI: {formatINR(l.emiAmount)}</span>
                    <span className="text-[#171717] font-medium">{l.paidEmis}/{l.totalEmis} Paid</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Amortization Table */}
          {loanDetails && (
            <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f2f2f2] mb-4 gap-2">
                <div>
                  <h3 className="font-semibold text-sm text-[#171717]">
                    Amortization Schedule: {loanDetails.productName}
                  </h3>
                  <p className="font-geist-mono text-[11px] text-[#8f8f8f] mt-0.5">
                    ID: #{loanDetails.loanId.slice(0, 8)} // APR: {loanDetails.interestRate}% // TOTAL: {formatINR(loanDetails.totalPayable)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-geist-mono text-xs text-[#8f8f8f]">Monthly Installment:</span>
                  <span className="font-mono-num font-semibold text-[#171717] text-sm">{formatINR(loanDetails.emiAmount)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#ebebeb] text-[#8f8f8f] font-geist-mono text-[10px] uppercase">
                      <th className="py-2.5 px-3 font-medium">#</th>
                      <th className="py-2.5 px-3 font-medium">Due Date</th>
                      <th className="py-2.5 px-3 font-medium">Total EMI</th>
                      <th className="py-2.5 px-3 font-medium">Principal Portion</th>
                      <th className="py-2.5 px-3 font-medium">Interest Portion</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 px-3 font-medium">Paid Date</th>
                      <th className="py-2.5 px-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2f2f2] font-mono-num">
                    {loanDetails.schedule?.map((emi) => (
                      <tr key={emi.emiId} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-2.5 px-3 font-medium text-[#171717]">
                          #{String(emi.emiNumber).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3 text-[#171717]">{emi.dueDate}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#171717]">{formatINR(emi.emiAmount)}</td>
                        <td className="py-2.5 px-3 text-[#4d4d4d]">{formatINR(emi.principalComponent)}</td>
                        <td className="py-2.5 px-3 text-[#8f8f8f]">{formatINR(emi.interestComponent)}</td>
                        <td className="py-2.5 px-3">
                          <span className={`font-geist-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border ${
                            emi.paymentStatus === 'PAID'
                              ? 'border-[#d1ebd1] bg-[#f7faf7] text-[#10b981]'
                              : 'border-[#ffeed0] bg-[#fffbf2] text-[#f5a623]'
                          }`}>
                            {emi.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#8f8f8f] text-[11px]">
                          {emi.paidDate ? new Date(emi.paidDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {emi.paymentStatus === 'PAID' ? (
                            <span className="font-geist-mono text-[11px] text-[#10b981] inline-flex items-center gap-1">
                              Settled
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedEmiForPay(emi)}
                              className="btn-app-primary text-xs py-1 px-2.5"
                            >
                              Pay Now
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
