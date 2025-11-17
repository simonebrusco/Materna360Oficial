'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import CardHub from '@/components/maternar/CardHub';
import { PageTemplate } from '@/components/common/PageTemplate';
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';

export default function MaternarClient() {
  const { name } = useProfile();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    });
  }, []);

  const firstName = name ? name.split(' ')[0] : '';
  const pageTitle = firstName ? `Bom dia, ${firstName}` : 'Bem-vinda ao Maternar';
  const pageSubtitle = 'Juntas vamos fazer de hoje um dia leve.';

  return (
    <div className="relative">
      {/* Soft pink gradient background with hero glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF0F6] to-white pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-gradient-to-b from-[#FFE5EF] to-transparent opacity-70 blur-[40px] pointer-events-none" />

      <div className="relative z-10" suppressHydrationWarning={true}>
        <PageTemplate
          label="MATERNAR"
          title={pageTitle}
          subtitle={pageSubtitle}
        >
          {/* Profile Completion Banner */}
          <div className="mt-6 mb-8 px-4 md:px-6 max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_12px_32px_rgba(255,0,94,0.05)] transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015] p-6 md:p-8">
              {/* Accent Bubble - Top Right */}
              <div className="absolute -top-6 right-0 h-24 w-24 rounded-full bg-[#ff005e]/10 pointer-events-none" />

              {/* Content */}
              <div className="relative z-10">
                {/* Pill Label */}
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#ff005e]/10 text-[#ff005e] font-medium text-sm tracking-tight shadow-sm mb-4">
                  FIRST STEP
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-semibold text-[#2f3a56] tracking-tight mb-2">
                  Personalize your journey, mãe
                </h3>

                {/* Subtitle */}
                <p className="text-sm md:text-base text-[#545454]/75 leading-relaxed mb-6">
                  It only takes a minute and helps Materna360 tailor every suggestion just for you.
                </p>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    track('maternar.profile_banner_click', {
                      timestamp: new Date().toISOString(),
                    });
                    window.location.href = '/eu360?focus=perfil';
                  }}
                  className="mt-4 rounded-xl bg-[#ff005e] text-white px-5 py-2.5 font-medium text-sm hover:opacity-95 active:scale-[0.99] transition-all"
                  data-event="maternar.profile_banner_click"
                >
                  Complete my profile →
                </button>
              </div>
            </div>
          </div>

          <CardHub />

          {/* Emotional closing text */}
          <div className="mt-8 px-6 md:px-8 max-w-2xl mx-auto text-center">
            <p className="text-xs md:text-sm text-[#545454]/75 leading-relaxed">
              Você não precisa abraçar tudo de uma vez. Escolha só um passo para hoje — o Materna360 caminha com você.
            </p>
          </div>
        </PageTemplate>
      </div>
    </div>
  );
}
