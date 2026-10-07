import React, { useState, useEffect } from 'react';
import { formatINR } from '../components/Modals';

export default function InspectorView() {
  const [schema, setSchema] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [selectedTable, setSelectedTable] = useState('loan_accounts');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner */}
      <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-geist-mono text-[11px] font-medium text-[#8f8f8f] uppercase tracking-wider block mb-1">
            Database Schema Console
          </span>
          <h2 className="text-xl font-semibold text-[#171717] tracking-tight">PostgreSQL Relational Schema Inspector</h2>
          <p className="text-xs text-[#4d4d4d] mt-1">
            Direct physical inspection of database tables, column types, primary keys, nullability, and foreign key relations.
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

      {/* LIVE RELATIONAL SCHEMA INSPECTOR */}
      {schema && (
        <section className="bg-white rounded-[12px] p-6 border border-[#ebebeb] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f2f2f2] mb-4 gap-3">
            <div>
              <h3 className="font-semibold text-sm text-[#171717]">Relational Schema Inspector</h3>
              <p className="font-geist-mono text-[11px] text-[#8f8f8f] mt-0.5">
                PHYSICAL TABLES, CONSTRAINTS &amp; FOREIGN KEY RELATIONS
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

              {schema[selectedTable].foreignKeys && schema[selectedTable].foreignKeys.length > 0 && (
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
