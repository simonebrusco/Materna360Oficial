'use client';

import * as React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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

function TabEngagementChart({ events }: { events: TelemetryEvent[] }) {
  const tabCounts: Record<string, number> = {};

  events.forEach((e) => {
    const tab = (e.payload?.tab as string) || 'unknown';
    tabCounts[tab] = (tabCounts[tab] || 0) + 1;
  });

  const data = Object.entries(tabCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const COLORS = ['#ff005e', '#ffd8e6', '#2f3a56', '#545454', '#9CA3AF', '#E5E7EB'];

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Engajamento por Aba</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#ff005e"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function DailyActivityChart({ events }: { events: TelemetryEvent[] }) {
  const dailyStats = React.useMemo(() => computeDailyStats(events), [events]);

  if (dailyStats.length === 0) {
    return null;
  }

  const data = dailyStats.map((d) => ({
    date: d.dateKey.slice(-5), // MM-DD format
    total: d.totalEvents,
    pageViews: d.pageViews,
  }));

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Atividade por Dia</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#ff005e"
            strokeWidth={2}
            dot={{ fill: '#ff005e', r: 4 }}
            activeDot={{ r: 6 }}
            name="Total de Eventos"
          />
          <Line
            type="monotone"
            dataKey="pageViews"
            stroke="#ffd8e6"
            strokeWidth={2}
            dot={{ fill: '#ffd8e6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Visualizações de Página"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopEventsChart({ events }: { events: TelemetryEvent[] }) {
  const eventCounts: Record<string, number> = {};

  events.forEach((e) => {
    eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
  });

  const data = Object.entries(eventCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Top 10 Eventos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={190} />
          <Tooltip />
          <Bar dataKey="value" fill="#ff005e" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
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
                title={`${stats.dateKey}: ${stats.totalEvents} eventos`}
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
          <p>Total: {dailyStats.reduce((sum, d) => sum + d.totalEvents, 0)} eventos em {dailyStats.length} dias</p>
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
          {hasAnyEvents ? 'Nenhum evento corresponde aos filtros' : 'Nenhum evento de telemetria ainda'}
        </h3>
        <p className="mt-2 text-sm text-neutral-600 max-w-sm mx-auto leading-relaxed">
          {hasAnyEvents
            ? 'Tente limpar filtros ou ajustar sua busca para ver mais eventos.'
            : 'Navegue pelo aplicativo (alterne abas, abra paywall, tente exportar PDF) para gerar eventos de telemetria e depois atualize esta página.'}
        </p>
      </div>
      <div className="mt-6 flex gap-3 justify-center flex-wrap">
        <a
          href="/meu-dia"
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition-colors"
        >
          Voltar ao app
        </a>
        <button
          onClick={onReload}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-neutral-900 border border-neutral-300 rounded-md bg-white hover:bg-neutral-50 transition-colors"
        >
          Recarregar telemetria
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
    if (window.confirm('Isso excluirá todos os eventos de telemetria armazenados localmente para este navegador. Continuar?')) {
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
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Insights de Telemetria (v0.3)</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Painel de debug local com visualizações de dados. Lê eventos de telemetria do navegador <code className="text-xs bg-neutral-100 px-2 py-1 rounded">localStorage</code>.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Total de Eventos</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.totalEvents}</div>
        </div>
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Visualizações de Página</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.pageViewCount}</div>
        </div>
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Cliques de Navegação</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.navClickCount}</div>
        </div>
        <div className="rounded-lg bg-white/60 border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Eventos Paywall</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{kpis.paywallCount}</div>
        </div>
      </div>

      {/* Charts */}
      {events.length > 0 && (
        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          <TabEngagementChart events={events} />
          <DailyActivityChart events={events} />
        </div>
      )}

      {/* Activity Chart */}
      {events.length > 0 && <ActivityChart events={events} />}

      {/* Top Events Chart */}
      {events.length > 0 && (
        <div className="mb-8">
          <TopEventsChart events={events} />
        </div>
      )}

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
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Pesquisar Payload</label>
            <input
              type="text"
              placeholder="Pesquisar em payload..."
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
          Limpar Telemetria
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
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700 whitespace-nowrap">Evento</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700 whitespace-nowrap">Rota</th>
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
          <p>Mostrando {filtered.length} de {events.length} eventos</p>
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
        <h1 className="text-2xl font-semibold tracking-tight">Insights (restrito)</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Esta página está disponível apenas quando o sinalizador de recurso de insights interno está ativado.
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          Peça à equipe para ativar <code>NEXT_PUBLIC_FF_INTERNAL_INSIGHTS</code> para Preview se precisar usar este painel interno.
        </p>
      </main>
    );
  }

  return <TelemetryViewer />;
}
