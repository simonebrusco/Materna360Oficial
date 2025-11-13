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
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 0,
    });
  } catch {
    return '—';
  }
}

function TelemetryViewer() {
  const { events, loading, clear } = useTelemetryEvents();
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
          <p className="text-sm text-neutral-600">Loading telemetry...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Telemetry Insights (v0.1)</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Local-only debug panel. Reads telemetry events from browser <code className="text-xs bg-neutral-100 px-2 py-1 rounded">localStorage</code>.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Total Events</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.totalEvents}</div>
        </div>
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Page Views</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.pageViewCount}</div>
        </div>
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Nav Clicks</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.navClickCount}</div>
        </div>
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Paywall Events</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.paywallCount}</div>
        </div>
      </div>

      {/* Filters & Clear Button */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 flex-1">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white"
            >
              <option value="">All events</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Route</label>
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white"
            >
              <option value="">All routes</option>
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

      {/* Events Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-600">
            {events.length === 0 ? 'No telemetry events recorded yet.' : 'No events match the current filters.'}
          </p>
        </div>
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
                      {event.payload?.route || event.payload?.path || event.payload?.page || '—'}
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
      <div className="mt-6 text-xs text-neutral-500">
        <p>Showing {filtered.length} of {events.length} events</p>
      </div>
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
