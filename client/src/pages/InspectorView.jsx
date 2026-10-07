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
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-geist-mono text-[11px] font-medium text-[#8f8f8f] uppercase tracking-wider block mb-1">
            Database Architecture Console
          </span>
          <h2 className="text-xl font-semibold text-[#171717] tracking-tight">PostgreSQL Schema &amp; Integrity Console</h2>
          <p className="text-xs text-[#4d4d4d] mt-1">
            Real-time inspection of 3NF relational tables, column data types, foreign key graphs, and transaction locking.
          </p>
        </div>

        <button
          onClick={loadInspectorData}
          className="btn-app-ghost self-start md:self-auto text-xs"
        >
          <span className="material-symbols-outlined text-xs">refresh</span>
          <span>Refresh Metadata</span>
        </button>
      </section>

      {/* 1. INTERACTIVE CONCURRENCY & TRIGGER DEFENSE TESTS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Test A: Concurrency & Double-Spending Simulation */}
        <div className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-3">
              <h3 className="font-semibold text-sm text-[#171717]">Concurrency &amp; Race Condition Test</h3>
              <span className="font-geist-mono text-[10px] uppercase px-1.5 py-0.2 rounded-[4px] border border-[#ebebeb] bg-[#fafafa] text-[#171717]">
                SELECT ... FOR UPDATE
              </span>
            </div>

            <p className="text-xs text-[#4d4d4d] mb-4">
              Dispatches <strong>Thread A</strong> and <strong>Thread B</strong> simultaneously in parallel via <code>Promise.all</code>, both requesting to withdraw <strong>₹ 400.00</strong> from a wallet holding only <strong>₹ 500.00</strong>.
            </p>

            {simResult && (
              <div className="p-3.5 bg-[#fafafa] border border-[#ebebeb] rounded-[8px] space-y-2.5 font-geist-mono text-xs mb-4">
                <div className="flex justify-between font-medium">
                  <span>Initial Balance: {formatINR(simResult.initialBalance)}</span>
                  <span className={simResult.doubleSpendingPrevented ? 'text-[#10b981]' : 'text-[#ee0000]'}>
                    Final: {formatINR(simResult.finalBalance)}
                  </span>
                </div>

                <div className="p-2 bg-[#f7faf7] border border-[#d1ebd1] rounded-[6px] text-[#171717] text-[11px] font-sans">
                  {simResult.conclusion}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 bg-white rounded-[6px] border border-[#ebebeb]">
                    <span className="text-[#8f8f8f] block mb-0.5">Thread A (Lock Holder)</span>
                    <span className="text-[#10b981] font-semibold">{simResult.threadA.status}</span>
                    <p className="text-[#8f8f8f] mt-0.5">{simResult.threadA.durationMs}ms duration</p>
                  </div>
                  <div className="p-2 bg-white rounded-[6px] border border-[#ebebeb]">
                    <span className="text-[#8f8f8f] block mb-0.5">Thread B (Concurrent)</span>
                    <span className="text-[#ee0000] font-semibold">{simResult.threadB.status}</span>
                    <p className="text-[#8f8f8f] mt-0.5">Blocked by row lock &amp; rejected</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSimulateConcurrency}
            disabled={simulating}
            className="btn-marketing-primary w-full text-xs py-2.5"
          >
            <span>{simulating ? 'Executing Concurrent Threads...' : 'Run Concurrency Stress-Test'}</span>
          </button>
        </div>

        {/* Test B: Trigger Ledger Protection Test */}
        <div className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-3">
              <h3 className="font-semibold text-sm text-[#171717]">Immutable Ledger Trigger Validator</h3>
              <span className="font-geist-mono text-[10px] uppercase px-1.5 py-0.2 rounded-[4px] border border-[#ebebeb] bg-[#fafafa] text-[#171717]">
                BEFORE UPDATE / DELETE
              </span>
            </div>

            <p className="text-xs text-[#4d4d4d] mb-4">
              Attempts an illegal direct SQL mutation (<code>UPDATE transaction_ledger SET amount = 999999</code>) to test whether database trigger <code>trg_protect_transaction_ledger</code> halts execution.
            </p>

            {triggerResult && (
              <div className="p-3.5 bg-[#fafafa] border border-[#ebebeb] rounded-[8px] space-y-2 font-geist-mono text-xs mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#8f8f8f]">Trigger Enforced:</span>
                  <span className="text-[#10b981] font-semibold">
                    {triggerResult.triggerEnforced ? 'YES (100% PROTECTED)' : 'NO'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#fffbf2] border border-[#ffeed0] rounded-[6px] text-[#ab570a] text-[11px] font-sans">
                  <span className="font-semibold block mb-0.5">PostgreSQL Engine Error Raised:</span>
                  <span className="font-geist-mono text-[10px] text-[#171717]">{triggerResult.databaseResponse}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleTestTrigger}
            disabled={testingTrigger}
            className="btn-marketing-secondary w-full text-xs py-2.5"
          >
            <span>{testingTrigger ? 'Testing Trigger Execution...' : 'Test Tamper-Proof Trigger'}</span>
          </button>
        </div>

      </section>

      {/* 2. LIVE RELATIONAL SCHEMA INSPECTOR (3NF) */}
      {schema && (
        <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f2f2f2] mb-4 gap-3">
            <div>
              <h3 className="font-semibold text-sm text-[#171717]">Relational Schema Inspector (3NF)</h3>
              <p className="font-geist-mono text-[11px] text-[#8f8f8f] mt-0.5">
                INSPECT PHYSICAL TABLES, CONSTRAINTS &amp; FOREIGN KEY RELATIONS
              </p>
            </div>

            {/* Table Selection Pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {Object.keys(schema).map((tableName) => (
                <button
                  key={tableName}
                  onClick={() => setSelectedTable(tableName)}
                  className={`px-2.5 py-1 rounded-[6px] text-xs font-geist-mono transition-colors border ${
                    selectedTable === tableName
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-[#4d4d4d] border-[#ebebeb] hover:border-[#a1a1a1]'
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
              <div className="flex items-center justify-between text-xs font-geist-mono mb-2.5 text-[#8f8f8f]">
                <span>RELATION: {selectedTable.toUpperCase()}</span>
                <span>TOTAL ROWS: {schema[selectedTable].rowCount}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#ebebeb] text-[#8f8f8f] font-geist-mono text-[10px] uppercase">
                      <th className="py-2 px-3 font-medium">Column Name</th>
                      <th className="py-2 px-3 font-medium">Data Type</th>
                      <th className="py-2 px-3 font-medium">Nullable</th>
                      <th className="py-2 px-3 font-medium">Default</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2f2f2] font-mono-num">
                    {schema[selectedTable].columns.map((c) => (
                      <tr key={c.name} className="hover:bg-[#fafafa]">
                        <td className="py-2 px-3 font-medium text-[#171717]">{c.name}</td>
                        <td className="py-2 px-3 font-geist-mono text-[#0070f3]">{c.type}</td>
                        <td className="py-2 px-3 text-[#4d4d4d]">{c.nullable ? 'YES' : 'NO'}</td>
                        <td className="py-2 px-3 text-[#8f8f8f] font-geist-mono text-[11px]">{c.default || 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {schema[selectedTable].foreignKeys.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#f2f2f2]">
                  <span className="font-geist-mono text-[10px] uppercase text-[#8f8f8f] block mb-1.5">
                    Foreign Key Relational Links:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {schema[selectedTable].foreignKeys.map((fk, idx) => (
                      <span key={idx} className="font-geist-mono text-[11px] px-2 py-0.5 rounded-[4px] bg-[#fafafa] text-[#171717] border border-[#ebebeb]">
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
