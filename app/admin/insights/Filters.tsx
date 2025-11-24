'use client';
import * as React from 'react';
import { TelemetryEvent } from './store/useTelemetry';

const TYPES: TelemetryEvent['type'][] = [
  'page_view',
  'nav_click',
  'card_click',
  'coach',
  'pdf_export_attempt',
  'paywall_shown',
];

const ROUTES: NonNullable<TelemetryEvent['route']>[] = [
  '/meu-dia',
  '/eu360',
  '/cuidar',
  '/descobrir',
  '/maternar',
  '/planos',
  '/admin/insights',
];

export default function Filters({ filters, setFilters }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
      <input
        aria-label="Search"
        placeholder="Search…"
        className="border border-gray-300 rounded px-3 py-2 text-sm col-span-2"
        value={filters.q}
        onChange={(e: any) => setFilters({ q: e.target.value })}
      />

      <select
        aria-label="Type"
        className="border border-gray-300 rounded px-3 py-2 text-sm"
        value={filters.type}
        onChange={(e: any) => setFilters({ type: e.target.value })}
      >
        <option value="all">All types</option>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        aria-label="Route"
        className="border border-gray-300 rounded px-3 py-2 text-sm"
        value={filters.route}
        onChange={(e: any) => setFilters({ route: e.target.value })}
      >
        <option value="all">All routes</option>
        {ROUTES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <input
          type="date"
          aria-label="From"
          className="border border-gray-300 rounded px-3 py-2 text-sm"
          value={filters.from}
          onChange={(e: any) => setFilters({ from: e.target.value })}
        />
        <input
          type="date"
          aria-label="To"
          className="border border-gray-300 rounded px-3 py-2 text-sm"
          value={filters.to}
          onChange={(e: any) => setFilters({ to: e.target.value })}
        />
      </div>
    </div>
  );
}
