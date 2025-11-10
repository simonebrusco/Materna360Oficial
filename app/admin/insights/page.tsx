'use client';

import * as React from 'react';
import { isEnabled } from '@/app/lib/flags.client';
import { readLocalEvents, clearLocalEvents } from '@/app/lib/telemetry';
import ExportButton from '@/components/pdf/ExportButton';
import MiniBar from '@/components/charts/MiniBar';

type Ev = { event: string; payload?: Record<string, unknown>; ts: number };

function byDay(ts: number) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default function InsightsPage() {
  const allowed = isEnabled('FF_INTERNAL_INSIGHTS');
  const [rows, setRows] = React.useState<Ev[]>([]);
  const [query, setQuery] = React.useState('');
  const [range, setRange] = React.useState<'7d' | '28d'>('7d');
  const [bucket, setBucket] = React.useState<Record<number, number>>({});

  React.useEffect(() => {
    if (!allowed) return;
    const data = readLocalEvents().sort((a: Ev, b: Ev) => a.ts - b.ts);
    setRows(data);
  }, [allowed]);

  React.useEffect(() => {
    const days = range === '28d' ? 28 : 7;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const filtered = rows.filter((r) => r.ts >= cutoff && (!query || r.event.includes(query)));
    const grouped: Record<number, number> = {};
    filtered.forEach((r) => {
      const k = byDay(r.ts);
      grouped[k] = (grouped[k] || 0) + 1;
    });
    setBucket(grouped);
  }, [rows, query, range]);

  if (!allowed) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-ink-1">Insights (Restricted)</h1>
        <p className="text-support-1 mt-2">
          This page is gated by <code className="bg-support-3/20 px-1.5 py-0.5 rounded text-xs">FF_INTERNAL_INSIGHTS</code>.
        </p>
      </div>
    );
  }

  // build series ordered by day asc
  const days = range === '28d' ? 28 : 7;
  const series: number[] = Array.from({ length: days }).map((_, i) => {
    const k = byDay(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    return bucket[k] || 0;
  });

  const total = rows.length;
  const last24 = rows.filter((r) => r.ts >= Date.now() - 24 * 60 * 60 * 1000).length;

  const handleExportCSV = () => {
    const data = rows.filter((r) => !query || r.event.includes(query));
    const header = 'ts,event,payload\n';
    const body = data
      .map((r) => {
        const p = r.payload ? JSON.stringify(r.payload).replaceAll('"', '""') : '';
        return `${new Date(r.ts).toISOString()},${r.event},"${p}"`;
      })
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'materna360-insights.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (!confirm('Clear all local telemetry events? This cannot be undone.')) return;
    clearLocalEvents();
    setRows([]);
  };

  return (
    <div className="mx-auto max-w-[960px] p-4 md:p-8 bg-white min-h-screen">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-ink-1">Insights</h1>
        <p className="text-support-1 mt-2">
          Local telemetry (preview-only) for product decisions. Events are stored in localStorage and cleared on app data reset.
        </p>
      </header>

      {/* Controls */}
      <div className="rounded-2xl border border-white/60 bg-white/90 p-4 mb-6 flex flex-wrap gap-3 items-center shadow-soft">
        <input
          className="rounded-xl border border-white/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 flex-1 min-w-[200px]"
          placeholder="Filter by event name (e.g., coach., paywall., planner.)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="rounded-xl border border-white/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={range}
          onChange={(e) => setRange(e.target.value as any)}
        >
          <option value="7d">Last 7 days</option>
          <option value="28d">Last 28 days</option>
        </select>
        <button
          className="rounded-xl px-4 py-2 bg-primary text-white font-medium hover:opacity-95 active:scale-[0.99] transition-all"
          onClick={handleExportCSV}
        >
          Export CSV
        </button>
        <ExportButton variant="insights" className="rounded-xl px-4 py-2" />
        <button
          className="rounded-xl px-4 py-2 border border-white/60 bg-white/90 font-medium text-support-1 hover:bg-white/95 active:scale-[0.99] transition-all"
          onClick={handleClearData}
        >
          Clear data
        </button>
        <span className="ml-auto text-xs text-support-2 font-medium">
          Total: <strong>{total}</strong> · Last 24h: <strong>{last24}</strong>
        </span>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-white/60 bg-white/90 p-4 mb-6 shadow-soft overflow-x-auto">
        <MiniBar values={series} width={Math.min(600, 50 * days)} height={160} />
        <p className="text-xs text-support-2 mt-2">Events per day (range: {range}).</p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/60 bg-white/90 shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/60 bg-white/60">
              <th className="text-left p-3 font-semibold text-support-1">Time</th>
              <th className="text-left p-3 font-semibold text-support-1">Event</th>
              <th className="text-left p-3 font-semibold text-support-1">Payload</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r) => !query || r.event.includes(query))
              .slice(-400) // clamp to 400 for performance
              .reverse()
              .map((r, idx) => (
                <tr
                  key={idx}
                  className="border-b border-white/60 last:border-b-0 align-top hover:bg-white/40 transition-colors"
                >
                  <td className="p-3 text-xs text-support-2 whitespace-nowrap">
                    {new Date(r.ts).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3 text-support-1 font-medium">{r.event}</td>
                  <td className="p-3 text-xs text-support-2 whitespace-pre-wrap font-mono opacity-80">
                    {r.payload ? JSON.stringify(r.payload, null, 2) : '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-6 text-center text-support-2">
            <p className="text-sm">No telemetry events yet. Start interacting with the app to see events here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
