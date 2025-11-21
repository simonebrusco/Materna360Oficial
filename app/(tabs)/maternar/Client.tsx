'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import CardHub from '@/components/maternar/CardHub';
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';
import AppIcon from '@/components/ui/AppIcon';
import { DAILY_MESSAGES } from '@/app/data/dailyMessages';
import { getDailyIndex } from '@/app/lib/dailyMessage';
import { getTimeGreeting } from '@/app/lib/greetings';
import { Reveal } from '@/components/ui/Reveal';
import { ClientOnly } from '@/components/common/ClientOnly';

export default function MaternarClient() {
  const { name } = useProfile();
  const [greeting, setGreeting] = useState<string>('');

  useEffect(() => {
    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Update greeting based on time
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : '';
    const timeGreeting = getTimeGreeting(firstName);
    setGreeting(timeGreeting);

    // Update greeting every minute to reflect time changes
    const interval = setInterval(() => {
      const updatedGreeting = getTimeGreeting(firstName);
      setGreeting(updatedGreeting);
    }, 60000);

    return () => clearInterval(interval);
  }, [name]);

  // Daily message reload at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0);
    const timeoutId = window.setTimeout(() => window.location.reload(), delay);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const firstName = name ? name.split(' ')[0] : '';
  const isProfileIncomplete = !name || name.trim() === '';

  // Get the current daily message
  const dayIndex = getDailyIndex(new Date(), DAILY_MESSAGES.length);
  const dailyMessage = DAILY_MESSAGES[dayIndex];

  return (
    <main data-layout="page-template-v1" className="bg-white min-h-[100dvh] pb-24">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
            {/* Premium Hero Header - matching redesigned hubs */}
            <header className="pt-8 md:pt-10 mb-8 md:mb-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Subtitle/Label - increased size for visual balance */}
                  <p className="text-sm md:text-base font-semibold uppercase tracking-[0.28em] text-[#FF1475] mb-3 font-poppins">
                    MATERNAR
                  </p>
                  {/* Main Title - wrapped in ClientOnly to avoid hydration mismatch */}
                  <ClientOnly>
                    <h1
                      className="text-3xl md:text-4xl font-bold text-[#3A3A3A] leading-tight font-poppins"
                    >
                      {greeting}
                    </h1>
                  </ClientOnly>
                </div>

                {/* Profile Button on Right */}
                {isProfileIncomplete && (
                  <div className="flex-shrink-0">
                    <Link
                      href="/eu360?focus=perfil"
                      onClick={() => {
                        track('maternar.profile_premium_button_click', {
                          timestamp: new Date().toISOString(),
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-[10px] py-[6px] rounded-2xl border-[0.5px] border-[#FF1475]/45 bg-[#FF1475]/4 text-[#FF1475]/85 text-sm font-normal tracking-tight shadow-[0_1px_2px_#FF1475/4] hover:scale-[1.01] hover:shadow-[0_1px_4px_#FF1475/6] active:scale-[0.99] transition-all duration-150"
                      aria-label="Completar perfil"
                    >
                      <AppIcon
                        name="hand-heart"
                        className="w-[14px] h-[14px]"
                        style={{ color: 'rgba(255, 20, 117, 0.6)' }}
                        decorative
                      />
                      <span>Completar perfil</span>
                    </Link>
                  </div>
                )}
              </div>
            </header>

            {/* Page Content */}
            <div className="space-y-8 md:space-y-10">
              {/* Daily Message Card */}
              <Reveal delay={100}>
                <div className="mt-0 mb-0 px-0 md:px-0 max-w-7xl mx-auto">
                  <div className="bg-white rounded-3xl border border-[#FFE8F2] shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] px-4 py-3 md:px-6 md:py-4 relative overflow-hidden transition-all duration-200">
                    {/* Very subtle accent - only in corner */}
                    <div className="pointer-events-none select-none absolute -top-8 -right-8 h-20 w-20 bg-gradient-to-br from-[#FF1475]/3 to-transparent rounded-full" />

                    {/* Content wrapper - flex with space-between to push CTA to bottom */}
                    <div className="flex h-full flex-col justify-between gap-2 relative z-10 min-h-[140px] max-h-[210px] md:max-h-[220px]">
                      {/* Top content */}
                      <div className="flex flex-col gap-1.5">
                        {/* New title - replacing the pill header */}
                        <div className="flex items-center gap-2">
                          <h3 className="text-base md:text-lg font-semibold text-[#3A3A3A] leading-snug font-poppins">
                            Um carinho pra você hoje
                          </h3>
                          <AppIcon
                            name="heart"
                            className="h-4 w-4 md:h-5 md:w-5 text-[#FF1475] flex-shrink-0"
                            aria-hidden="true"
                          />
                        </div>

                        {/* Message text */}
                        <p className="text-xs md:text-sm text-[#6A6A6A] leading-relaxed font-poppins">
                          &quot;{dailyMessage}&quot;
                        </p>

                        {/* Subtitle */}
                        <p className="text-xs text-[#6A6A6A]/70 leading-snug pt-0.5">
                          Uma mensagem especial para começar seu dia.
                        </p>
                      </div>

                      {/* Bottom CTA - micro link */}
                      <div className="mt-3">
                        <Link
                          href="/meu-dia"
                          onClick={() => {
                            track('maternar.daily_message_cta_click', {
                              timestamp: new Date().toISOString(),
                            });
                          }}
                          className="inline-flex items-center gap-0.5 text-xs md:text-sm font-medium text-[#FF1475] transition-all duration-150 hover:gap-1"
                        >
                          <span>Preciso disso hoje</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              <CardHub />

              {/* Emotional closing text */}
              <div className="mt-8 md:mt-10 text-center pb-12 md:pb-16">
                <p className="text-xs md:text-sm text-[#6A6A6A]/75 leading-relaxed">
                  Você não precisa abraçar tudo de uma vez. Escolha só um passo para hoje — o Materna360 caminha com você.
                </p>
              </div>
            </div>
      </div>
    </main>
  );
}
