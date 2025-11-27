'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell';
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';
import { DAILY_MESSAGES } from '@/app/data/dailyMessages';
import { getDailyIndex } from '@/app/lib/dailyMessage';
import { getTimeGreeting } from '@/app/lib/greetings';
import { ClientOnly } from '@/components/common/ClientOnly';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MeuDiaClient() {
  const { name } = useProfile();
  const [greeting, setGreeting] = useState<string>('');

  // tracking de navegação
  useEffect(() => {
    track('nav.click', {
      tab: 'meu-dia',
      timestamp: new Date().toISOString(),
    });
  }, []);

  // saudação dinâmica (Bom dia / Boa tarde / Boa noite + nome)
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : '';
    const updateGreeting = () => setGreeting(getTimeGreeting(firstName));

    updateGreeting();
    const interval = window.setInterval(updateGreeting, 60_000);
    return () => window.clearInterval(interval);
  }, [name]);

  // mensagem do dia
  const dayIndex = getDailyIndex(new Date(), DAILY_MESSAGES.length);
  const dailyMessage = DAILY_MESSAGES[dayIndex];

  // recarregar mensagem diária à meia-noite (mantendo o mesmo comportamento do Maternar)
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0);
    const timeoutId = window.setTimeout(
      () => window.location.reload(),
      delay,
    );
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <main
      data-layout="page-template-v1"
      className="min-h-[100dvh] pb-32 materna360-premium-bg"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        {/* HERO – mesmo padrão de Maternar/Eu360 */}
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

            {/* Saudação + frase motivacional (sem card) */}
            <div className="pt-3 space-y-1">
              <ClientOnly>
                <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                  {greeting || 'Bom dia'}
                </h2>
              </ClientOnly>

              <p className="text-sm md:text-base text-white/95 leading-relaxed max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                &quot;{dailyMessage}&quot;
              </p>
            </div>
          </div>
        </header>

        {/* Planner completo logo abaixo do hero */}
        <WeeklyPlannerShell />
      </div>
    </main>
  );
}
