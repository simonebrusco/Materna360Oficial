'use client';

import * as React from 'react';
import { readLocalEvents, clearLocalEvents } from '@/app/lib/telemetry';

function isInsightsEnabled() {
  if (process.env.NEXT_PUBLIC_FF_INTERNAL_INSIGHTS === '1') {
    return true;
  }
  if (typeof window !== 'undefined') {
    try {
      const search = new URLSearchParams(window.location.search);
      if (search.get('insights') === '1') return true;
      if (localStorage.getItem('m360.insights_override') === '1') return true;
    } catch {
      // ignore
    }
  }
  return false;
}

type TelemetryEvent = {
  event: string;
  payload?: Record<string, unknown>;
  ts: number;
};

type DailyStats = {
  dateKey: string;
  totalEvents: number;
  pageViews: number;
};

function useTelemetryEvents() {
  const [events, setEvents] = React.useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(() => {
    try {
      const data = readLocalEvents();
      setEvents(data);
    } catch {
      setEvents([]);
    }
  }, []);

  const clear = React.useCallback(() => {
    try {
      clearLocalEvents();
      setEvents([]);
    } catch {
      setEvents([]);
    }
  }, []);

  React.useEffect(() => {
    setLoading(true);
    try {
      const data = readLocalEvents();
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { events, loading, reload, clear };
}

function formatTimestamp(ts: number): string {
  try {
    const d = new Date(ts);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return '—';
  }
}

function computeDailyStats(events: TelemetryEvent[]): DailyStats[] {
  const map = new Map<string, DailyStats>();

  events.forEach((e) => {
    const d = new Date(e.ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    if (!map.has(dateKey)) {
      map.set(dateKey, { dateKey, totalEvents: 0, pageViews: 0 });
    }

    const stats = map.get(dateKey)!;
    stats.totalEvents += 1;
    if (e.event === 'page_view') {
      stats.pageViews += 1;
    }
  });

  return Array.from(map.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

function ActivityChart({ events }: { events: TelemetryEvent[] }) {
  const dailyStats = React.useMemo(() => computeDailyStats(events), [events]);

  if (dailyStats.length === 0) {
    return null;
  }

  const maxEvents = Math.max(...dailyStats.map((d) => d.totalEvents), 1);

  const formatDateLabel = (dateKey: string): string => {
    try {
      const [year, month, day] = dateKey.split('-');
      return `${day}/${month}`;
    } catch {
      return dateKey;
    }
  };

  return (
    <div className="mb-8">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-neutral-900">Atividade ao longo do tempo</h2>
        <p className="text-xs text-neutral-600">Baseado em eventos de telemetria locais armazenados neste navegador.</p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-end justify-start gap-2 h-48 overflow-x-auto pb-2">
          {dailyStats.map((stats) => {
            const heightPercent = (stats.totalEvents / maxEvents) * 100;
            return (
              <div
                key={stats.dateKey}
                className="flex flex-col items-center gap-2 flex-shrink-0"
                title={`${stats.dateKey}: ${stats.totalEvents} events`}
              >
                <div
                  className="bg-pink-600 rounded-t-md w-10 hover:bg-pink-700 transition-colors cursor-pointer"
                  style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                />
                <div className="text-xs text-neutral-600 whitespace-nowrap font-medium">
                  {formatDateLabel(stats.dateKey)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-neutral-500">
          <p>Total: {dailyStats.reduce((sum, d) => sum + d.totalEvents, 0)} events across {dailyStats.length} days</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasAnyEvents, onReload }: { hasAnyEvents: boolean; onReload: () => void }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50/50 p-8 text-center">
      <div className="mb-4">
        <div className="text-5xl mb-3">📊</div>
        <h3 className="text-lg font-semibold text-neutral-900">
          {hasAnyEvents ? 'No events match filters' : 'No telemetry events yet'}
        </h3>
        <p className="mt-2 text-sm text-neutral-600 max-w-sm mx-auto leading-relaxed">
          {hasAnyEvents
            ? 'Try clearing filters or adjusting your search to see more events.'
            : 'Navigate through the app (switch tabs, open paywall, try PDF export) to generate telemetry events, then refresh this page.'}
        </p>
      </div>
      <div className="mt-6 flex gap-3 justify-center flex-wrap">
        <a
          href="/meu-dia"
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors"
        >
          Back to app
        </a>
        <button
          onClick={onReload}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-neutral-900 border border-neutral-300 rounded-md bg-white hover:bg-neutral-50 transition-colors"
        >
          Reload telemetry
        </button>
      </div>
    </div>
  );
}

function TelemetryViewer() {
  const { events, loading, clear, reload } = useTelemetryEvents();
  const [eventTypeFilter, setEventTypeFilter] = React.useState('');
  const [routeFilter, setRouteFilter] = React.useState('');
  const [textSearch, setTextSearch] = React.useState('');

  // Compute distinct event types and routes
  const eventTypes = React.useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.event) set.add(e.event);
    });
    return Array.from(set).sort();
  }, [events]);

  const routes = React.useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.payload?.route) set.add(String(e.payload.route));
      if (e.payload?.path) set.add(String(e.payload.path));
      if (e.payload?.page) set.add(String(e.payload.page));
    });
    return Array.from(set).sort();
  }, [events]);

  // Apply filters
  const filtered = React.useMemo(() => {
    return events.filter((e) => {
      if (eventTypeFilter && e.event !== eventTypeFilter) return false;
      if (routeFilter) {
        const route = e.payload?.route || e.payload?.path || e.payload?.page;
        if (route !== routeFilter) return false;
      }
      if (textSearch) {
        const text = JSON.stringify(e.payload || '').toLowerCase();
        const route = String(e.payload?.route || e.payload?.path || e.payload?.page || '').toLowerCase();
        if (!text.includes(textSearch.toLowerCase()) && !route.includes(textSearch.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [events, eventTypeFilter, routeFilter, textSearch]);

  // Compute KPIs
  const kpis = React.useMemo(() => {
    const totalEvents = events.length;
    const pageViewCount = events.filter((e) => e.event === 'page_view').length;
    const navClickCount = events.filter((e) => e.event === 'nav_click').length;
    const paywallCount = events.filter((e) => e.event?.startsWith('paywall_') || e.event?.includes('plan_')).length;

    return { totalEvents, pageViewCount, navClickCount, paywallCount };
  }, [events]);

  const handleClear = () => {
    if (window.confirm('This will delete all telemetry events stored locally for this browser. Continue?')) {
      clear();
    }
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-sm text-neutral-600">Carregando telemetria...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Insights de Telemetria (v0.2)</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Painel de debug local. Lê eventos de telemetria do navegador <code className="text-xs bg-neutral-100 px-2 py-1 rounded">localStorage</code>.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Total de Eventos</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.totalEvents}</div>
        </div>
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Visualizações</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.pageViewCount}</div>
        </div>
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Cliques Nav</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.navClickCount}</div>
        </div>
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Eventos Paywall</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.paywallCount}</div>
        </div>
      </div>

      {/* Activity Chart */}
      {events.length > 0 && <ActivityChart events={events} />}

      {/* Filters & Clear Button */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 flex-1">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Tipo de Evento</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white"
            >
              <option value="">Todos os eventos</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Rota</label>
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white"
            >
              <option value="">Todas as rotas</option>
              {routes.map((route) => (
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Search Payload</label>
            <input
              type="text"
              placeholder="Search in payload..."
              value={textSearch}
              onChange={(e) => setTextSearch(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors"
        >
          Clear Telemetry
        </button>
      </div>

      {/* Events Table or Empty State */}
      {filtered.length === 0 ? (
        <EmptyState hasAnyEvents={events.length > 0} onReload={reload} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700 whitespace-nowrap">Timestamp</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700 whitespace-nowrap">Event</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700 whitespace-nowrap">Route</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filtered.map((event, index) => (
                  <tr key={`${event.ts}-${index}`} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap text-xs">
                      {formatTimestamp(event.ts)}
                    </td>
                    <td className="px-4 py-3 text-neutral-900 font-medium whitespace-nowrap">
                      {event.event || '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap text-xs">
                      {String(event.payload?.route || event.payload?.path || event.payload?.page || '—')}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 max-w-xs truncate text-xs font-mono">
                      {event.payload ? JSON.stringify(event.payload) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer info */}
      {filtered.length > 0 && (
        <div className="mt-6 text-xs text-neutral-500">
          <p>Showing {filtered.length} of {events.length} events</p>
        </div>
      )}
    </main>
  );
}

export default function AdminInsightsPage() {
  const enabled = isInsightsEnabled();

  if (!enabled) {
    return (
      <main className="max-w-screen-md mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Insights (restricted)</h1>
        <p className="mt-3 text-sm text-neutral-600">
          This page is only available when the internal insights feature flag is enabled.
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          Ask the team to enable <code>NEXT_PUBLIC_FF_INTERNAL_INSIGHTS</code> for Preview if you need to use this
          internal panel.
        </p>
      </main>
    );
  }

  return <TelemetryViewer />;
}
