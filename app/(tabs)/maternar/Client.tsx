'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';
import AppIcon from '@/components/ui/AppIcon';
import { DAILY_MESSAGES } from '@/app/data/dailyMessages';
import { getDailyIndex } from '@/app/lib/dailyMessage';
import { getTimeGreeting } from '@/app/lib/greetings';
import { Reveal } from '@/components/ui/Reveal';
import { ClientOnly } from '@/components/common/ClientOnly';
import { MotivationalFooter } from '@/components/common/MotivationalFooter';
import CardHub from '@/components/maternar/CardHub';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MaternarClient() {
  const { name } = useProfile();
  const [greeting, setGreeting] = useState<string>('');

  // tracking
  useEffect(() => {
    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    });
  }, []);

  // saudação dinâmica
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : '';
    const updateGreeting = () => setGreeting(getTimeGreeting(firstName));

    updateGreeting();
    const interval = setInterval(updateGreeting, 60_000);
    return () => clearInterval(interval);
  }, [name]);

  // recarregar mensagem diária à meia-noite
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0);
    const timeoutId = window.setTimeout(() => window.location.reload(), delay);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const firstName = name ? name.split(' ')[0] : '';
  const isProfileIncomplete = !name || name.trim() === '';

  // mensagem do dia
  const dayIndex = getDailyIndex(new Date(), DAILY_MESSAGES.length);
  const dailyMessage = DAILY_MESSAGES[dayIndex];

  return (
    <main
      data-layout="page-template-v1"
      className="min-h-[100dvh] pb-32 bg-[#FFB3D3] bg-[radial-gradient(circle_at_top_left,#9B4D96_0,#FF1475_30%,#FF7BB1_60%,#FF4B9A_82%,#FFB3D3_100%)]"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        {/* HERO */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <span className="inline-flex items-center rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
                MATERNAR · HUB PRINCIPAL
              </span>

              <ClientOnly>
                <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                  {greeting || 'Bem-vinda ao Materna360'}
                </h1>
              </ClientOnly>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Aqui é o seu ponto de partida no Materna360: um lugar para cuidar
                de você, do seu filho e da sua jornada, com tudo o que você
                precisa em um só lugar.
              </p>
            </div>

            {/* Botão “Completar perfil” REMOVIDO para deixar o hero mais limpo */}
            {false && isProfileIncomplete && (
              <div className="flex-shrink-0">
                <Link
                  href="/eu360?focus=perfil"
                  onClick={() =>
                    track('maternar.profile_premium_button_click', {
                      timestamp: new Date().toISOString(),
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-white/60 bg-white/15 px-[12px] py-[7px] text-xs md:text-sm font-medium text-white shadow-[0_6px_18px_rgba(0,0,0,0.25)] backdrop-blur-lg transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_10px_26px_rgba(0,0,0,0.35)] active:translate-y-0"
                  aria-label="Completar perfil"
                >
                  <AppIcon
                    name="hand-heart"
                    className="h-[14px] w-[14px]"
                    decorative
                  />
                  <span>Completar perfil</span>
                </Link>
              </div>
            )}
          </div>
        </header>

        <div className="space-y-8 md:space-y-10">
          {/* CARD — UM CARINHO PRA VOCÊ HOJE */}
          <Reveal delay={80}>
            <div className="mt-0 mb-0">
              <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] shadow-[0_18px_45px_rgba(0,0,0,0.26)] px-4 py-4 md:px-6 md:py-5">
                {/* brilho suave */}
                <div className="pointer-events-none absolute inset-0 opacity-90">
                  <div className="absolute -top-10 -right-8 h-24 w-24 rounded-full bg-[rgba(255,255,255,0.8)] blur-3xl" />
                  <div className="absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col justify-between gap-2 md:gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base md:text-lg font-semibold text-white leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                        Um carinho pra você hoje
                      </h3>
                      <AppIcon
                        name="heart"
                        className="h-4 w-4 md:h-5 md:w-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                        aria-hidden="true"
                      />
                    </div>

                    <p className="text-xs md:text-sm text-white/95 leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                      &quot;{dailyMessage}&quot;
                    </p>

                    <p className="text-[11px] md:text-xs text-white/85 leading-snug pt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                      Uma mensagem especial para começar seu dia com mais leveza.
                    </p>
                  </div>

                  <div className="mt-2 md:mt-3">
                    <Link
                      href="/meu-dia"
                      onClick={() =>
                        track('maternar.daily_message_cta_click', {
                          timestamp: new Date().toISOString(),
                        })
                      }
                      className="inline-flex items-center gap-0.5 text-xs md:text-sm font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-all duration-150 hover:gap-1"
                    >
                      <span>Preciso disso hoje</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* GRID NOVO DE PASTAS (CARDS TRANSLÚCIDOS 2x2) */}
          <CardHub />

          <MotivationalFooter routeKey="maternar-minha-jornada" />
        </div>
      </div>
    </main>
  );
}
