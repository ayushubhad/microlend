import React, { useState, useEffect } from 'react';
import { formatINR } from '../components/Modals';

export default function InspectorView() {
  const [schema, setSchema] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [selectedTable, setSelectedTable] = useState('loan_accounts');
  const [loading, setLoading] = useState(true);

  // Concurrency Simulation State
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Trigger Test State
  const [testingTrigger, setTestingTrigger] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);

  useEffect(() => {
    loadInspectorData();
  }, []);

  const loadInspectorData = async () => {
    setLoading(true);
    try {
      const [schemaRes, metricsRes] = await Promise.all([
        fetch('/api/inspector/schema'),
        fetch('/api/inspector/metrics')
      ]);

      const schemaData = await schemaRes.json();
      const metricsData = await metricsRes.json();

      if (schemaData.success) setSchema(schemaData.schema);
      if (metricsData.success) setMetrics(metricsData.metrics);
    } catch (err) {
      console.error('Inspector load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateConcurrency = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch('/api/inspector/simulate-race-condition', { method: 'POST' });
      const data = await res.json();
      setSimResult(data.simulation);
    } catch (err) {
      alert('Simulation error: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleTestTrigger = async () => {
    setTestingTrigger(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/inspector/test-trigger-protection', { method: 'POST' });
      const data = await res.json();
      setTriggerResult(data);
    } catch (err) {
      alert('Trigger test error: ' + err.message);
    } finally {
      setTestingTrigger(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-base">account_tree</span>
            <span>Relational Architecture Console</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">PostgreSQL Schema &amp; Integrity Console</h2>
          <p className="text-xs text-slate-500 mt-1">
            Interactive inspection of 3NF relational schemas, column constraints, primary/foreign keys, and real-time transaction concurrency tests.
          </p>
        </div>

        <button
          onClick={loadInspectorData}
          className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Refresh Metadata</span>
        </button>
      </section>

      {/* 1. INTERACTIVE CONCURRENCY & TRIGGER EXPERIMENTS ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Experiment A: Concurrency & Double-Spending Simulation */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">sync_problem</span>
                <h3 className="font-bold text-slate-900 text-sm">Concurrency &amp; Race Condition Test</h3>
              </div>
              <span className="text-[10px] font-mono-num font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                SELECT ... FOR UPDATE
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Launches <strong>Thread A</strong> and <strong>Thread B</strong> simultaneously in parallel via <code>Promise.all</code>, both attempting to withdraw <strong>₹ 400.00</strong> from a test wallet funded with only <strong>₹ 500.00</strong>.
            </p>

            {simResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-mono-num text-xs mb-4">
                <div className="flex justify-between font-bold">
                  <span>Initial Balance: {formatINR(simResult.initialBalance)}</span>
                  <span className={simResult.doubleSpendingPrevented ? 'text-emerald-600' : 'text-rose-600'}>
                    Final: {formatINR(simResult.finalBalance)}
                  </span>
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-sans font-medium">
                  {simResult.conclusion}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Thread A (100ms lock hold)</span>
                    <span className="text-emerald-600 font-bold">{simResult.threadA.status}</span>
                    <p className="text-slate-500 mt-0.5">{simResult.threadA.durationMs}ms duration</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Thread B (Concurrent)</span>
                    <span className="text-rose-600 font-bold">{simResult.threadB.status}</span>
                    <p className="text-slate-500 mt-0.5">Blocked by row lock &amp; rejected</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSimulateConcurrency}
            disabled={simulating}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            {simulating ? (
              <span>Executing Concurrent Parallel Threads...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">play_circle</span>
                <span>Launch Live Concurrency Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Experiment B: Trigger Protection (Immutability Defense) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">security</span>
                <h3 className="font-bold text-slate-900 text-sm">Trigger Ledger Protection Test</h3>
              </div>
              <span className="text-[10px] font-mono-num font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                trg_protect_transaction_ledger
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Directly executes an unauthorized <code>UPDATE transaction_ledger SET amount = 0.00</code> to prove that the database engine itself rejects any tampering attempt.
            </p>

            {triggerResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 font-mono-num text-xs mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Trigger Enforced:</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    PASSED (RAISED EXCEPTION)
                  </span>
                </div>

                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-mono-num">
                  <span className="font-bold block mb-0.5">PostgreSQL Exception:</span>
                  {triggerResult.databaseResponse}
                </div>

                <p className="text-[11px] text-slate-500 font-sans">
                  {triggerResult.explanation}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleTestTrigger}
            disabled={testingTrigger}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            {testingTrigger ? (
              <span>Executing Query Against Trigger...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">shield</span>
                <span>Test Trigger Tampering Prevention</span>
              </>
            )}
          </button>
        </div>

      </section>

      {/* 2. COMPLEX AGGREGATIONS & GROUP BY METRICS */}
      {metrics && (
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">bar_chart</span>
            <span>DBMS Aggregate Analysis (GROUP BY, SUM, AVG, COUNT)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Total Capital Disbursed</span>
              <span className="font-mono-num font-bold text-slate-900 text-lg">{formatINR(metrics.portfolio.totalDisbursed)}</span>
              <p className="text-[10px] text-slate-400 font-mono-num mt-0.5">across {metrics.portfolio.totalLoans} loan contracts</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Active Outstanding</span>
              <span className="font-mono-num font-bold text-indigo-600 text-lg">{formatINR(metrics.portfolio.outstandingBalance)}</span>
              <p className="text-[10px] text-slate-400 font-mono-num mt-0.5">in servicing portfolio</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Principal Recovery Ratio</span>
              <span className="font-mono-num font-bold text-emerald-600 text-lg">{metrics.portfolio.recoveryRatePercent}%</span>
              <p className="text-[10px] text-slate-400 font-mono-num mt-0.5">{formatINR(metrics.portfolio.principalSettled)} collected</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Vault Liquidity</span>
              <span className="font-mono-num font-bold text-slate-900 text-lg">{formatINR(metrics.vault.totalLiquidity)}</span>
              <p className="text-[10px] text-slate-400 font-mono-num mt-0.5">across {metrics.vault.totalWallets} active wallets</p>
            </div>
          </div>

          {/* Group By: Transaction Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Volume Breakdown by Transaction Type
              </h4>
              <div className="space-y-2 text-xs font-mono-num">
                {metrics.transactionVolumeByType.map((t) => (
                  <div key={t.type} className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-600">{t.type} ({t.count}x)</span>
                    <span className="font-bold text-slate-900">{formatINR(t.totalVolume)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Portfolio Distribution by Loan Product
              </h4>
              <div className="space-y-2 text-xs font-mono-num">
                {metrics.productExposure.map((p) => (
                  <div key={p.productName} className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-600">{p.productName} ({p.loansCount} loans)</span>
                    <span className="font-bold text-slate-900">{formatINR(p.totalBorrowed)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. LIVE RELATIONAL SCHEMA INSPECTOR */}
      {schema && (
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Relational Schema Inspector (3NF)</h3>
              <p className="text-xs text-slate-500 font-mono-num">
                Inspect physical tables, primary keys, and foreign keys in the active PostgreSQL database.
              </p>
            </div>

            {/* Table Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.keys(schema).map((tableName) => (
                <button
                  key={tableName}
                  onClick={() => setSelectedTable(tableName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-num font-semibold transition-colors ${
                    selectedTable === tableName
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tableName} ({schema[tableName].rowCount})
                </button>
              ))}
            </div>
          </div>

          {/* Active Table Details */}
          {schema[selectedTable] && (
            <div>
              <div className="flex items-center justify-between text-xs font-mono-num mb-3">
                <span className="font-bold text-slate-800">TABLE: {selectedTable}</span>
                <span className="text-slate-500">Total Rows: {schema[selectedTable].rowCount}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                      <th className="py-2 px-3">Column Name</th>
                      <th className="py-2 px-3">Data Type</th>
                      <th className="py-2 px-3">Nullable</th>
                      <th className="py-2 px-3">Default Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono-num">
                    {schema[selectedTable].columns.map((c) => (
                      <tr key={c.name} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-semibold text-slate-900">{c.name}</td>
                        <td className="py-2 px-3 text-blue-600 font-bold">{c.type}</td>
                        <td className="py-2 px-3 text-slate-500">{c.nullable ? 'YES' : 'NO'}</td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{c.default || 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {schema[selectedTable].foreignKeys.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                    Foreign Key Relational Links:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {schema[selectedTable].foreignKeys.map((fk, idx) => (
                      <span key={idx} className="font-mono-num text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {fk.column_name} ➔ {fk.foreign_table_name}({fk.foreign_column_name})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

    </div>
  );
}
