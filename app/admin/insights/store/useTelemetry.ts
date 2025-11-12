'use client';
import * as React from 'react';

export type TelemetryEvent = {
  id: string;
  ts: number;
  type: 'page_view' | 'nav_click' | 'card_click' | 'coach' | 'pdf_export_attempt' | 'paywall_shown';
  route?: '/meu-dia' | '/eu360' | '/cuidar' | '/descobrir' | '/maternar' | '/planos' | '/admin/insights';
  meta?: Record<string, string | number | boolean | null>;
};

const LS_KEY = 'm360.telemetry';

export type Filters = {
  q: string;
  type: TelemetryEvent['type'] | 'all';
  route: NonNullable<TelemetryEvent['route']> | 'all';
  from: string;
  to: string;
};

export type UseTelemetryState = {
  all: TelemetryEvent[];
  filtered: TelemetryEvent[];
  filters: Filters;
  page: number;
  pageSize: 50;
  totalPages: number;
  kpis: { total: number; topType: string; topRoute: string };
  series: { date: string; count: number }[];
  load: () => void;
  setFilters: (p: Partial<Filters>) => void;
  setPage: (n: number) => void;
  clearLocal: () => void;
  importJson: (json: string) => { ok: boolean; count: number; error?: string };
  exportJson: () => string;
  exportCsv: () => string;
  seedLocal: (n?: number) => number;
};

function readAll(): TelemetryEvent[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(Boolean);
  } catch {
    return [];
  }
}

function writeAll(arr: TelemetryEvent[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch {}
}

function toDateKey(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useTelemetry(): UseTelemetryState {
  const [all, setAll] = React.useState<TelemetryEvent[]>([]);
  const [filters, setFiltersState] = React.useState<Filters>({
    q: '',
    type: 'all',
    route: 'all',
    from: '',
    to: '',
  });
  const [page, setPage] = React.useState(1);
  const pageSize = 50;

  const load = React.useCallback(() => {
    setAll(readAll());
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const setFilters = (patch: Partial<Filters>) => {
    setPage(1);
    setFiltersState((prev) => ({ ...prev, ...patch }));
  };

  const filtered = React.useMemo(() => {
    if (!all.length) return [];
    const { q, type, route, from, to } = filters;
    const ql = q.trim().toLowerCase();
    const fromTs = from ? Date.parse(from) : -Infinity;
    const toTs = to ? Date.parse(to) + 24 * 3600 * 1000 - 1 : Infinity;

    return all.filter((e) => {
      if (type !== 'all' && e.type !== type) return false;
      if (route !== 'all' && e.route !== route) return false;
      if (e.ts < fromTs || e.ts > toTs) return false;
      if (ql) {
        const hay = JSON.stringify(e).toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [all, filters]);

  const kpis = React.useMemo(() => {
    const total = filtered.length;
    const typeCount: Record<string, number> = {};
    const routeCount: Record<string, number> = {};

    for (const e of filtered) {
      typeCount[e.type] = (typeCount[e.type] || 0) + 1;
      if (e.route) routeCount[e.route] = (routeCount[e.route] || 0) + 1;
    }

    const topType =
      Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    const topRoute =
      Object.entries(routeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return { total, topType, topRoute };
  }, [filtered]);

  const series = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filtered) {
      const k = toDateKey(e.ts);
      map.set(k, (map.get(k) || 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const setPageSafe = (n: number) =>
    setPage(Math.min(Math.max(1, n), totalPages));

  const clearLocal = () => {
    writeAll([]);
    load();
  };

  const importJson = (json: string): { ok: boolean; count: number; error?: string } => {
    try {
      const arr = JSON.parse(json);
      if (!Array.isArray(arr))
        return { ok: false, count: 0, error: 'JSON must be an array' };

      const cast = arr
        .filter(Boolean)
        .map(
          (e: any): TelemetryEvent => ({
            id: String(e.id ?? crypto.randomUUID()),
            ts: Number(e.ts ?? Date.now()),
            type: e.type,
            route: e.route,
            meta:
              e.meta && typeof e.meta === 'object' ? e.meta : undefined,
          })
        )
        .filter((e) => !!e.type);

      const merged = [...readAll(), ...cast].sort((a, b) => a.ts - b.ts);
      writeAll(merged);
      load();
      return { ok: true, count: cast.length };
    } catch (err: any) {
      return { ok: false, count: 0, error: String(err?.message || err) };
    }
  };

  const exportJson = () => JSON.stringify(filtered, null, 2);

  const exportCsv = () => {
    const head = ['id', 'ts', 'date', 'type', 'route', 'meta'];
    const rows = filtered.map((e) => [
      e.id,
      e.ts,
      toDateKey(e.ts),
      e.type,
      e.route ?? '',
      JSON.stringify(e.meta ?? {}),
    ]);
    const body = rows
      .map((r) =>
        r
          .map((v) => {
            const s = String(v ?? '');
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(',')
      )
      .join('\n');
    return [head.join(','), body].join('\n');
  };

  const seedLocal = (n = 2000) => {
    const types: TelemetryEvent['type'][] = [
      'page_view',
      'nav_click',
      'card_click',
      'coach',
      'pdf_export_attempt',
      'paywall_shown',
    ];
    const routes: NonNullable<TelemetryEvent['route']>[] = [
      '/meu-dia',
      '/eu360',
      '/cuidar',
      '/descobrir',
      '/maternar',
      '/planos',
      '/admin/insights',
    ];
    const now = Date.now();
    const arr: TelemetryEvent[] = [];

    for (let i = 0; i < n; i++) {
      const ts = now - Math.floor(Math.random() * 1000 * 3600 * 24 * 14);
      arr.push({
        id: crypto.randomUUID(),
        ts,
        type: types[Math.floor(Math.random() * types.length)],
        route: routes[Math.floor(Math.random() * routes.length)],
        meta: { rnd: Math.floor(Math.random() * 100) },
      });
    }

    writeAll([...readAll(), ...arr]);
    load();
    return n;
  };

  return {
    all,
    filtered,
    filters,
    page,
    pageSize,
    totalPages,
    kpis,
    series,
    load,
    setFilters,
    setPage: setPageSafe,
    clearLocal,
    importJson,
    exportJson,
    exportCsv,
    seedLocal,
  };
}
