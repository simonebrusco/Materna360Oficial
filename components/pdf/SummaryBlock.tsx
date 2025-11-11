'use client';

import * as React from 'react';

export function SummaryBlock({
  focus,
  avgMood,
  avgEnergy,
  totalEntries,
  plannerCount,
}: {
  focus?: string | null;
  avgMood: number | string;
  avgEnergy: number | string;
  totalEntries: number;
  plannerCount: number;
}) {
  return (
    <section className="mb-8 print-avoid-break-inside">
      <h2 className="text-lg font-semibold text-ink-1 mb-3">Sumário</h2>
      <div className="rounded-xl border border-white/60 bg-white/90 p-4 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ul className="list-disc pl-5 text-sm text-support-1">
            <li>
              Foco da semana: <strong>{focus ?? '—'}</strong>
            </li>
            <li>
              Humor médio: <strong>{avgMood || '—'}</strong>
            </li>
            <li>
              Energia média: <strong>{avgEnergy || '—'}</strong>
            </li>
          </ul>
          <ul className="list-disc pl-5 text-sm text-support-1">
            <li>
              Registros no período: <strong>{totalEntries}</strong>
            </li>
            <li>
              Itens no planner: <strong>{plannerCount}</strong>
            </li>
            <li>
              Exportado em: <span className="opacity-80">{new Date().toLocaleDateString('pt-BR')}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
