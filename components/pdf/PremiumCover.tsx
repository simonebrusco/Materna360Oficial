'use client';

import * as React from 'react';
import AppMark from '@/components/brand/AppMark';

export function PremiumCover({
  title,
  period,
  kpis,
  subtitle = 'Resumo do seu bem-estar emocional e das pequenas ações que fizeram a diferença.',
}: {
  title: string;
  period: string;
  subtitle?: string;
  kpis: Array<{ label: string; value: string | number }>;
}) {
  return (
    <section className="mb-8 print-avoid-break-inside">
      <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-[#FFE5EF] to-white p-6 md:p-8 shadow-[0_8px_28px_rgba(47,58,86,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink-1">{title}</h1>
            <p className="text-sm text-support-2 mt-2">{period}</p>
          </div>
          <AppMark size={48} />
        </div>
        <div className="mt-4">
          <p className="text-sm text-support-1">{subtitle}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-white/60 bg-white/90 p-3 shadow-soft">
              <div className="text-xs text-support-2">{k.label}</div>
              <div className="text-xl font-bold text-primary mt-2">{k.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
