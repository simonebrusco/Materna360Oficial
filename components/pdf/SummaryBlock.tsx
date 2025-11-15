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
      <h2 className="text-2xl font-bold text-[#2f3a56] mb-4">Sumário da Semana</h2>
      <div className="rounded-2xl border border-pink-100/60 bg-gradient-to-br from-white to-pink-50/30 p-6 md:p-8 shadow-[0_4px_16px_rgba(255,0,94,0.04)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100/40">
              <span className="text-sm font-medium text-[#545454]">Foco da semana:</span>
              <strong className="text-base text-[#ff005e]">{focus ?? '—'}</strong>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-pink-100/40">
              <span className="text-sm font-medium text-[#545454]">Humor médio:</span>
              <strong className="text-base text-[#ff005e]">{avgMood || '—'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#545454]">Energia média:</span>
              <strong className="text-base text-[#ff005e]">{avgEnergy || '—'}</strong>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100/40">
              <span className="text-sm font-medium text-[#545454]">Registros:</span>
              <strong className="text-base text-[#ff005e]">{totalEntries}</strong>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-pink-100/40">
              <span className="text-sm font-medium text-[#545454]">Itens no planner:</span>
              <strong className="text-base text-[#ff005e]">{plannerCount}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#545454]">Exportado em:</span>
              <span className="text-sm text-[#545454]">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
