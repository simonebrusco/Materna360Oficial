'use client';

import * as React from 'react';
import { useEffect } from 'react';
import CardHub from '@/components/maternar/CardHub';
import { PageTemplate } from '@/components/common/PageTemplate';
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';

export default function MaternarClient() {
  const { name } = useProfile();

  useEffect(() => {
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

      <div className="relative z-10">
        <PageTemplate
          label="MATERNAR"
          title={pageTitle}
          subtitle={pageSubtitle}
        >
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
