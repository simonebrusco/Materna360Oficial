'use client';

import * as React from 'react';
import { track } from '@/app/lib/telemetry';
import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MeuDiaClient() {
  // tracking de navegação (igual fazemos nas outras abas)
  React.useEffect(() => {
    track('nav.click', {
      tab: 'meu-dia',
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <main
      data-layout="page-template-v1"
      className="min-h-[100dvh] pb-32 materna360-premium-bg"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        {/* HERO NO MESMO PADRÃO DO MATERNAR */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <div className="space-y-2 md:space-y-3">
            <span className="inline-flex items-center rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
              MEU DIA
            </span>

            <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              Seu Dia Organizado
            </h1>

            <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
              Um espaço para planejar com leveza.
            </p>
          </div>
        </header>

        {/* Aqui segue todo o planner (saudação + frase + calendário + cards) */}
        <WeeklyPlannerShell />
      </div>
    </main>
  );
}
