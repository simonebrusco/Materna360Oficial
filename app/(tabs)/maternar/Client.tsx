'use client';

import * as React from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import CardHub from '@/components/maternar/CardHub';
import { PageTemplate } from '@/components/common/PageTemplate';
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';
import AppIcon from '@/components/ui/AppIcon';
import { DAILY_MESSAGES } from '@/app/data/dailyMessages';
import { getDailyIndex } from '@/app/lib/dailyMessage';
import { Reveal } from '@/components/ui/Reveal';

export default function MaternarClient() {
  const { name } = useProfile();

  useEffect(() => {
    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Daily message reload at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0);
    const timeoutId = window.setTimeout(() => window.location.reload(), delay);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const firstName = name ? name.split(' ')[0] : '';
  const pageTitle = 'Bem-vinda ao Maternar';
  const pageSubtitle = 'Juntas vamos fazer de hoje um dia leve.';
  const isProfileIncomplete = !name || name.trim() === '';

  // Get the current daily message
  const dayIndex = getDailyIndex(new Date(), DAILY_MESSAGES.length);
  const dailyMessage = DAILY_MESSAGES[dayIndex];

  return (
    <div className="relative">
      {/* Soft pink gradient background with hero glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF0F6] to-white pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-gradient-to-b from-[#FFE5EF] to-transparent opacity-70 blur-[40px] pointer-events-none" />

      <div className="relative z-10">
        <PageTemplate
          label="MATERNAR"
          title={pageTitle}
          subtitle={pageSubtitle}
        >
          {/* Profile Completion Premium Button */}
          {isProfileIncomplete && (
            <div className="mt-6 mb-6 px-4 md:px-6 max-w-7xl mx-auto flex justify-end">
              <Link
                href="/eu360?focus=perfil"
                onClick={() => {
                  track('maternar.profile_premium_button_click', {
                    timestamp: new Date().toISOString(),
                  });
                }}
                className="inline-flex items-center gap-1.5 px-[10px] py-[6px] rounded-2xl border-[0.5px] border-[rgba(255,0,94,0.45)] bg-[rgba(255,0,94,0.04)] text-[rgba(255,0,94,0.85)] text-sm font-normal tracking-tight shadow-[0_1px_2px_rgba(255,0,94,0.04)] hover:scale-[1.01] hover:shadow-[0_1px_4px_rgba(255,0,94,0.06)] active:scale-[0.99] transition-all duration-150"
                aria-label="Completar perfil"
              >
                <AppIcon
                  name="hand-heart"
                  className="w-[14px] h-[14px]"
                  style={{ color: 'rgba(255, 0, 94, 0.6)' }}
                  decorative
                />
                <span>Completar perfil</span>
              </Link>
            </div>
          )}

          {/* Daily Message Card */}
          <Reveal delay={100}>
            <div className="mt-2 mb-8 px-4 md:px-6 max-w-7xl mx-auto">
              <div className="bg-gradient-to-br from-[#ffe3f0] via-white to-[#ffe9f5] rounded-[20px] border border-white/60 shadow-[0_10px_40px_rgba(255,0,94,0.08)] backdrop-blur-sm px-6 py-8 md:px-8 md:py-8 relative overflow-hidden transition-all duration-200">
                {/* Subtle gradient accent blob - top-right corner */}
                <div className="pointer-events-none select-none absolute -top-8 right-0 h-32 w-32 bg-gradient-to-br from-primary/15 to-transparent rounded-full" />

                {/* Content wrapper */}
                <div className="flex flex-col gap-3 relative z-10">
                  {/* Pill header */}
                  <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#ffe3f0] text-[#ff005e] font-medium text-sm tracking-tight shadow-sm w-fit">
                    Mensagem de Hoje
                  </div>

                  {/* Message title */}
                  <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] tracking-tight">
                    "{dailyMessage}"
                  </h3>

                  {/* Subtitle */}
                  <p className="text-sm md:text-base text-[#545454]/85 leading-relaxed">
                    Uma mensagem especial para começar seu dia com leveza.
                  </p>

                  {/* Helper text */}
                  <p className="text-xs text-[#545454]/60">
                    Atualizada automaticamente a cada novo dia.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <CardHub />

          {/* Emotional closing text */}
          <div className="mt-8 px-6 md:px-8 max-w-2xl mx-auto text-center">
            <p className="text-xs md:text-sm text-[#545454]/75 leading-relaxed">
              Você n����o precisa abraçar tudo de uma vez. Escolha só um passo para hoje — o Materna360 caminha com você.
            </p>
          </div>
        </PageTemplate>
      </div>
    </div>
  );
}
