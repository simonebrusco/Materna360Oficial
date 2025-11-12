'use client';
import * as React from 'react';

const FLAG = process.env.NEXT_PUBLIC_FF_INTERNAL_INSIGHTS === '1';

export default function InsightsPage(){
  if(!FLAG){
    return (
      <main className="max-w-screen-md mx-auto p-6">
        <h1 className="text-xl font-semibold">/admin/insights</h1>
        <p className="text-sm text-neutral-600 mt-2">
          This panel is disabled. Set <code>NEXT_PUBLIC_FF_INTERNAL_INSIGHTS=1</code> (Preview) to enable.
        </p>
      </main>
    );
  }
  return (
    <main className="max-w-screen-lg mx-auto p-6">
      <h1 className="text-xl font-semibold mb-3">Telemetry Panel</h1>
      <p className="text-sm text-neutral-600 mb-4">Local & read-only (no data leaves your browser).</p>
      <div className="p-3 overflow-x-auto rounded-2xl shadow-sm ring-1 ring-black/5 bg-white">
        <table className="min-w-[600px] w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Data</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Rota</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-3">—</td><td className="p-3">—</td><td className="p-3">—</td></tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
