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

export type DateRange = { from: number; to: number } | null;

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
  types: Set<string>;
  routes: Set<string>;
  range: DateRange;
  toggleType: (t: string) => void;
  toggleRoute: (r: string) => void;
  setRange: (r: DateRange) => void;
  clearFilters: () => void;
  kpiTotal: number;
  kpiTopType: { type: string; count: number } | null;
  kpiTopRoute: { route: string; count: number } | null;
  kpiLast7d: number;
  daily: Array<{ date: string; count: number }>;
};

export function useTelemetry(): TelemetryState {
  const [data, setData] = React.useState<TelemetryEvent[]>([]);
  const [page, setPage] = React.useState(1);
  const [types, setTypes] = React.useState<Set<string>>(new Set());
  const [routes, setRoutes] = React.useState<Set<string>>(new Set());
  const [range, setRange] = React.useState<DateRange>(null);
  const pageSize = 50;

  // initial read
  React.useEffect(() => { setData(read()); }, []);

  // Filter logic
  const filtered = React.useMemo(() => {
    let result = data;

    // Type filter
    if (types.size > 0) {
      result = result.filter(e => types.has(e.type));
    }

    // Route filter
    if (routes.size > 0) {
      result = result.filter(e => e.route && routes.has(e.route));
    }

    // Date range filter
    if (range) {
      result = result.filter(e => e.ts >= range.from && e.ts <= range.to);
    }

    return result.sort((a, b) => b.ts - a.ts);
  }, [data, types, routes, range]);

  // KPIs
  const kpiTotal = data.length;
  const kpiTopType = React.useMemo(() => {
    if (filtered.length === 0) return null;
    const counts = new Map<string, number>();
    filtered.forEach(e => {
      counts.set(e.type, (counts.get(e.type) || 0) + 1);
    });
    let max: { type: string; count: number } | null = null;
    counts.forEach((count, type) => {
      if (!max || count > max.count) max = { type, count };
    });
    return max;
  }, [filtered]);

  const kpiTopRoute = React.useMemo(() => {
    if (filtered.length === 0) return null;
    const counts = new Map<string, number>();
    filtered.forEach(e => {
      if (e.route) counts.set(e.route, (counts.get(e.route) || 0) + 1);
    });
    let max: { route: string; count: number } | null = null;
    counts.forEach((count, route) => {
      if (!max || count > max.count) max = { route, count };
    });
    return max;
  }, [filtered]);

  const kpiLast7d = React.useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 1000 * 60 * 60 * 24 * 7;
    return data.filter(e => e.ts >= sevenDaysAgo).length;
  }, [data]);

  // Daily aggregation
  const daily = React.useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(e => {
      const date = new Date(e.ts).toISOString().split('T')[0];
      map.set(date, (map.get(date) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

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
        ts: Math.floor(now - Math.random() * 1000 * 60 * 60 * 24 * 21),
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

  function toggleType(t: string) {
    const newTypes = new Set(types);
    if (newTypes.has(t)) newTypes.delete(t);
    else newTypes.add(t);
    setTypes(newTypes);
    setPage(1);
  }

  function toggleRoute(r: string) {
    const newRoutes = new Set(routes);
    if (newRoutes.has(r)) newRoutes.delete(r);
    else newRoutes.add(r);
    setRoutes(newRoutes);
    setPage(1);
  }

  function clearFilters() {
    setTypes(new Set());
    setRoutes(new Set());
    setRange(null);
    setPage(1);
  }

  return {
    data, filtered, page, pageSize, total: filtered.length,
    clear, seed, exportJSON, exportCSV, importJSON, setPage,
    types, routes, range, toggleType, toggleRoute, setRange, clearFilters,
    kpiTotal, kpiTopType, kpiTopRoute, kpiLast7d, daily
  };
}
