'use client';

import * as React from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import CardHub from '@/components/maternar/CardHub';
import { PageTemplate } from '@/components/common/PageTemplate';
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';
import AppIcon from '@/components/ui/AppIcon';

export default function MaternarClient() {
  const { name } = useProfile();

  useEffect(() => {
    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    });
  }, []);

  const firstName = name ? name.split(' ')[0] : '';
  const pageTitle = 'Bem-vinda ao Maternar';
  const pageSubtitle = 'Juntas vamos fazer de hoje um dia leve.';
  const isProfileIncomplete = !name || name.trim() === '';

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
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#ff005e] text-[#ff005e] bg-white font-medium text-sm tracking-tight shadow-sm hover:bg-[#ffd8e6]/20 active:scale-[0.98] transition-all duration-150"
                aria-label="Completar perfil"
              >
                <AppIcon
                  name="user"
                  className="h-4 w-4"
                  decorative
                />
                <span>Completar perfil</span>
              </Link>
            </div>
          )}

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
