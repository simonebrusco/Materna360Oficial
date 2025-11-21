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
    <section className="mb-10 print-avoid-break-inside">
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-4">Sumário da Semana</h2>
      <div className="rounded-2xl border border-[var(--color-soft-strong)]/60 bg-gradient-to-br from-white to-[var(--color-soft-strong)]/30 p-6 md:p-8 shadow-[0_4px_16px_rgba(253,37,151,0.04)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100/40">
              <span className="text-sm font-medium text-[var(--color-text-muted)]">Foco da semana:</span>
              <strong className="text-base text-[var(--color-brand)]">{focus ?? '—'}</strong>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-pink-100/40">
              <span className="text-sm font-medium text-[var(--color-text-muted)]">Humor médio:</span>
              <strong className="text-base text-[var(--color-brand)]">{avgMood || '—'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text-muted)]">Energia média:</span>
              <strong className="text-base text-[var(--color-brand)]">{avgEnergy || '—'}</strong>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100/40">
              <span className="text-sm font-medium text-[var(--color-text-muted)]">Registros:</span>
              <strong className="text-base text-[var(--color-brand)]">{totalEntries}</strong>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-pink-100/40">
              <span className="text-sm font-medium text-[var(--color-text-muted)]">Itens no planner:</span>
              <strong className="text-base text-[var(--color-brand)]">{plannerCount}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text-muted)]">Exportado em:</span>
              <span className="text-sm text-[var(--color-text-muted)]">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
