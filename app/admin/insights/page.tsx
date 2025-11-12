'use client';
import * as React from 'react';
import { useTelemetry, UseTelemetryState } from './store/useTelemetry';
import { downloadCsv } from './utils/csv';
import { downloadJson } from './utils/json';
import Filters from './Filters';
import Kpis from './Kpis';
import Chart from './Chart';
import Table from './Table';
import { Button } from '@/components/ui/Button';

const FLAG = process.env.NEXT_PUBLIC_FF_INTERNAL_INSIGHTS === '1';

// Context to share store across child components
const TelemetryCtx = React.createContext<UseTelemetryState | null>(null);
export const useTelemetryContext = () => {
  const ctx = React.useContext(TelemetryCtx);
  if (!ctx) throw new Error('useTelemetryContext must be used inside TelemetryCtx.Provider');
  return ctx;
};

export default function InsightsPage() {
  if (!FLAG) {
    return (
      <main className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 pb-24 mt-6">
        <h1 className="text-2xl font-bold text-gray-900">Telemetry Panel</h1>
        <p className="text-gray-600 mt-2">
          This panel is disabled. Set <code className="bg-gray-100 px-2 py-1 rounded">
            NEXT_PUBLIC_FF_INTERNAL_INSIGHTS=1
          </code> to enable.
        </p>
      </main>
    );
  }

  const store = useTelemetry();
  const {
    exportCsv,
    exportJson,
    importJson,
    clearLocal,
    seedLocal,
    filtered,
  } = store;

  const onExportCsv = () => {
    downloadCsv('telemetry.csv', exportCsv());
  };

  const onExportJson = () => {
    downloadJson('telemetry.json', exportJson());
  };

  const onImportJson = async () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json';
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      const text = await f.text();
      const res = importJson(text);
      alert(
        res.ok
          ? `Imported ${res.count} events.`
          : `Import failed: ${res.error}`
      );
    };
    inp.click();
  };

  const onClearLocal = () => {
    if (confirm('Clear all local telemetry events?')) {
      clearLocal();
      alert('Cleared.');
    }
  };

  const onSeed = () => {
    const n = seedLocal(2000);
    alert(`Seeded ${n} events.`);
  };

  return (
    <TelemetryCtx.Provider value={store}>
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 mt-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Telemetry Panel</h1>
          <p className="text-sm text-gray-600 mt-1">
            Local &amp; read-only (no data leaves your browser).
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button size="sm" variant="primary" onClick={onExportCsv}>
            Export CSV
          </Button>
          <Button size="sm" variant="primary" onClick={onExportJson}>
            Export JSON
          </Button>
          <Button size="sm" variant="primary" onClick={onImportJson}>
            Import JSON
          </Button>
          <Button size="sm" variant="destructive" onClick={onClearLocal}>
            Clear Local
          </Button>
          <Button size="sm" variant="primary" onClick={onSeed}>
            Seed ×2000
          </Button>
          <span className="text-xs text-gray-600 ml-2 flex items-center">
            Filtered: <strong className="ml-1">{filtered.length}</strong>
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <Filters filters={store.filters} setFilters={store.setFilters} />
          </div>

          <div>
            <Kpis kpis={store.kpis} />
          </div>

          <div>
            <Chart series={store.series} />
          </div>

          <div>
            <Table
              filtered={store.filtered}
              page={store.page}
              pageSize={store.pageSize}
              totalPages={store.totalPages}
              setPage={store.setPage}
            />
          </div>
        </div>
      </main>
    </TelemetryCtx.Provider>
  );
}
