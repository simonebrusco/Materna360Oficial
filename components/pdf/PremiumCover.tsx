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
    <section className="mb-10 print-avoid-break-inside">
      <div className="rounded-3xl border border-pink-200/50 bg-gradient-to-br from-pink-50 via-white to-white p-8 md:p-12 shadow-[0_12px_40px_rgba(255,0,94,0.06)]">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2f3a56] leading-tight">{title}</h1>
            <p className="text-base text-[#545454] mt-3 font-medium">{period}</p>
          </div>
          <div className="flex-shrink-0">
            <AppMark size={56} />
          </div>
        </div>

        <div className="mb-8 border-b border-pink-100/50 pb-6">
          <p className="text-base text-[#545454] leading-relaxed max-w-2xl">{subtitle}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-pink-100/60 bg-gradient-to-br from-white to-pink-50/40 p-4 shadow-[0_4px_12px_rgba(255,0,94,0.04)]">
              <div className="text-xs font-semibold text-[#545454] uppercase tracking-wide">{k.label}</div>
              <div className="text-2xl font-bold text-[#ff005e] mt-3">{k.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
