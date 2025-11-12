'use client';
import * as React from 'react';

export type TelemetryEvent = {
  id: string;
  ts: number;
  type: 'page_view'|'nav_click'|'card_click'|'coach'|'pdf_export_attempt'|'paywall_shown';
  route?: '/meu-dia'|'/eu360'|'/cuidar'|'/descobrir'|'/maternar'|'/planos'|'/admin/insights';
  meta?: Record<string, string | number | boolean | null>;
};

const KEY = 'm360.telemetry';

function read(): TelemetryEvent[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(arr: TelemetryEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(arr));
}

export type TelemetryState = {
  data: TelemetryEvent[];
  filtered: TelemetryEvent[];
  page: number;
  pageSize: number;
  total: number;
  clear: () => void;
  seed: (n?: number) => void;
  exportJSON: () => string;
  exportCSV: () => string;
  importJSON: (text: string) => { ok: boolean; added: number; total: number; error?: string };
  setPage: (p: number) => void;
};

export function useTelemetry(): TelemetryState {
  const [data, setData] = React.useState<TelemetryEvent[]>([]);
  const [page, setPage] = React.useState(1);
  const pageSize = 50;

  // initial read
  React.useEffect(() => { setData(read()); }, []);

  const filtered = React.useMemo(() => data, [data]);
  const total = filtered.length;

  function clear() {
    write([]); setData([]); setPage(1);
  }

  function seed(n = 500) {
    const types: TelemetryEvent['type'][] = ['page_view','nav_click','card_click','coach','pdf_export_attempt','paywall_shown'];
    const routes: NonNullable<TelemetryEvent['route']>[] = ['/meu-dia','/eu360','/cuidar','/descobrir','/maternar','/planos'];
    const now = Date.now();
    const arr: TelemetryEvent[] = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        id: crypto.randomUUID(),
        ts: Math.floor(now - Math.random() * 1000 * 60 * 60 * 24 * 21), // 21 days
        type: types[Math.floor(Math.random() * types.length)],
        route: routes[Math.floor(Math.random() * routes.length)],
      });
    }
    write(arr);
    setData(arr);
    setPage(1);
  }

  function exportJSON(): string {
    return JSON.stringify(filtered, null, 2);
  }

  function exportCSV(): string {
    const header = ['id','ts','iso','type','route','meta'];
    const lines = filtered.map(e => {
      const iso = new Date(e.ts).toISOString();
      const meta = e.meta ? JSON.stringify(e.meta).replace(/\n/g,' ') : '';
      return [e.id, String(e.ts), iso, e.type, e.route ?? '', meta]
        .map(v => `"${String(v).replace(/"/g,'""')}"`).join(',');
    });
    return [header.join(','), ...lines].join('\n');
  }

  function importJSON(text: string) {
    try {
      const parsed = JSON.parse(text) as TelemetryEvent[];
      if (!Array.isArray(parsed)) throw new Error('JSON is not an array');
      const map = new Map<string, TelemetryEvent>();
      [...data, ...parsed].forEach(e => { if (e && e.id) map.set(e.id, e); });
      const merged = Array.from(map.values()).sort((a,b)=>a.ts-b.ts);
      write(merged); setData(merged); setPage(1);
      return { ok: true, added: Math.max(merged.length - data.length, 0), total: merged.length };
    } catch (e: any) {
      return { ok: false, added: 0, total: data.length, error: e?.message || 'Invalid JSON' };
    }
  }

  return { data, filtered, page, pageSize, total, clear, seed, exportJSON, exportCSV, importJSON, setPage };
}
