'use client';
import * as React from 'react';
import { useTelemetry } from './store/useTelemetry';
import { downloadText } from './utils/csv';
import { readFileAsText } from './utils/json';
import Kpis from './Kpis';
import Filters from './Filters';
import Chart from './Chart';

function flagEnabled() {
  if (process.env.NEXT_PUBLIC_FF_INTERNAL_INSIGHTS === '1') return true;
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('insights') === '1') return true;
    try { if (localStorage.getItem('m360.insights_override') === '1') return true; } catch {}
  }
  return false;
}

export default function InsightsPage() {
  const FLAG = flagEnabled();
  if (!FLAG) {
    return (
      <main className="max-w-screen-md mx-auto p-6">
        <h1 className="text-xl font-semibold">Insights (Restricted)</h1>
        <p className="text-sm text-neutral-600 mt-2">
          This page is gated by <code>FF_INTERNAL_INSIGHTS</code>. Enable the flag to continue.
        </p>
      </main>
    );
  }
  return <InsightsBody />;
}

function InsightsBody(){
  const fileRef = React.useRef<HTMLInputElement>(null);
  const {
    filtered, total, page, pageSize, setPage,
    seed, clear, exportCSV, exportJSON, importJSON,
    types, routes, range, toggleType, toggleRoute, setRange, clearFilters,
    kpiTotal, kpiTopType, kpiTopRoute, kpiLast7d, daily
  } = useTelemetry();

  const start = (page-1)*pageSize;
  const end = Math.min(start + pageSize, filtered.length);
  const pageItems = filtered.slice(start, end);

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if(!f) return;
    const text = await readFileAsText(f);
    const res = importJSON(text);
    alert(res.ok ? `Imported OK. Added: ${res.added}. Total: ${res.total}.` : `Import failed: ${res.error}`);
    e.target.value = '';
  }

  function handleExportJSON() { downloadText('telemetry.json', exportJSON()); }
  function handleExportCSV() { downloadText('telemetry.csv', exportCSV()); }

  return (
    <main className="max-w-screen-xl mx-auto p-6 pb-28">
      <h1 className="text-2xl font-semibold tracking-tight">Telemetry Panel</h1>
      <p className="text-sm text-neutral-600 mb-4">Local & read-only (no data leaves your browser).</p>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <button className="px-3 py-2 rounded-xl ring-1 ring-black/10 bg-white hover:bg-neutral-50" onClick={()=>seed(2000)}>Seed&nbsp;2,000</button>
        <button className="px-3 py-2 rounded-xl ring-1 ring-black/10 bg-white hover:bg-neutral-50" onClick={()=>seed(500)}>Seed&nbsp;500</button>
        <button className="px-3 py-2 rounded-xl ring-1 ring-red-500/20 bg-red-50 text-red-700 hover:bg-red-100" onClick={clear}>Clear</button>

        <span className="mx-3 h-6 w-px bg-neutral-200" />

        <button className="px-3 py-2 rounded-xl ring-1 ring-black/10 bg-white hover:bg-neutral-50" onClick={handleExportJSON}>Export JSON</button>
        <button className="px-3 py-2 rounded-xl ring-1 ring-black/10 bg-white hover:bg-neutral-50" onClick={handleExportCSV}>Export CSV</button>
        <button className="px-3 py-2 rounded-xl ring-1 ring-black/10 bg-white hover:bg-neutral-50" onClick={()=>fileRef.current?.click()}>Import JSON</button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />

        <span className="ml-auto text-sm text-neutral-600">Events: <strong>{total}</strong> • Showing {start+1}-{end}</span>
      </div>

      {/* KPIs */}
      <div className="mb-4">
        <Kpis total={kpiTotal} topType={kpiTopType} topRoute={kpiTopRoute} last7d={kpiLast7d}/>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <Filters
          allTypes={['page_view','nav_click','card_click','coach','pdf_export_attempt','paywall_shown']}
          allRoutes={['/meu-dia','/eu360','/cuidar','/descobrir','/maternar','/planos','/admin/insights']}
          activeTypes={types as any}
          activeRoutes={routes as any}
          range={range}
          onToggleType={toggleType}
          onToggleRoute={toggleRoute}
          onRange={setRange}
          onClear={clearFilters}
        />
      </div>

      {/* Chart */}
      <div className="mb-4">
        <Chart data={daily}/>
      </div>

      {/* Table */}
      <div className="p-3 overflow-x-auto rounded-2xl shadow-sm ring-1 ring-black/5 bg-white">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3 w-[180px]">Date</th>
              <th className="p-3 w-[160px]">Type</th>
              <th className="p-3 w-[160px]">Route</th>
              <th className="p-3">Meta</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(e=>(
              <tr key={e.id} className="border-b last:border-0 align-top">
                <td className="p-3 whitespace-nowrap">{new Date(e.ts).toLocaleString()}</td>
                <td className="p-3">{e.type}</td>
                <td className="p-3">{e.route ?? '—'}</td>
                <td className="p-3 text-neutral-600">{e.meta ? <code className="text-[11px]">{JSON.stringify(e.meta)}</code> : '—'}</td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td className="p-6 text-center text-neutral-500" colSpan={4}>
                  No events. Use &quot;Seed 500&quot; or &quot;Seed 2,000&quot; to generate test data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-neutral-600">
          Page {page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}
        </div>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=>setPage(1)} className="px-3 py-2 rounded-xl ring-1 ring-black/10 disabled:opacity-40">« First</button>
          <button disabled={page<=1} onClick={()=>setPage(page-1)} className="px-3 py-2 rounded-xl ring-1 ring-black/10 disabled:opacity-40">‹ Prev</button>
          <button disabled={page>=Math.max(1, Math.ceil(filtered.length / pageSize))} onClick={()=>setPage(page+1)} className="px-3 py-2 rounded-xl ring-1 ring-black/10 disabled:opacity-40">Next ›</button>
          <button disabled={page>=Math.max(1, Math.ceil(filtered.length / pageSize))} onClick={()=>setPage(Math.max(1, Math.ceil(filtered.length / pageSize)))} className="px-3 py-2 rounded-xl ring-1 ring-black/10 disabled:opacity-40">Last »</button>
        </div>
      </div>
    </main>
  );
}
