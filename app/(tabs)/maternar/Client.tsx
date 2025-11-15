'use client';

import * as React from 'react';
import { useEffect } from 'react';
import CardHub from '@/components/maternar/CardHub';
import { ContinueCard } from './components/ContinueCard';
import DestaquesDodia from '@/components/maternar/DestaquesDodia';
import { HighlightsSection } from './components/HighlightsSection';
import { PageTemplate } from '@/components/common/PageTemplate';
import { Reveal } from '@/components/ui/Reveal';
import { track } from '@/app/lib/telemetry';
import { getBrazilDateKey } from '@/app/lib/dateKey';
import { useProfile } from '@/app/hooks/useProfile';
import { isPremium } from '@/app/lib/plan';
import SoftCard from '@/components/ui/SoftCard';
import { Button } from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';
import { DiarioDaMae } from './components/DiarioDaMae';
import { MomentosComOsFilhos } from './components/MomentosComOsFilhos';
import { SuaEvolucao } from './components/SuaEvolucao';
import { RotinasDaMae } from './components/RotinasDaMae';
import { ClientOnly } from '@/components/common/ClientOnly';

export default function MaternarClient() {
  const [dateKey, setDateKey] = React.useState('2025-01-01');
  const { name } = useProfile();

  useEffect(() => {
    // Set today's date on client side only
    setDateKey(getBrazilDateKey(new Date()));

    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    });
  }, []);

  const firstName = name ? name.split(' ')[0] : '';
  const pageTitle = firstName ? `Bom dia, ${firstName}` : 'Bem-vinda ao Maternar';
  const pageSubtitle = 'Juntas vamos fazer de hoje um dia leve.';

  return (
    <PageTemplate
      label="MATERNAR"
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      <div className="max-w-[1160px] mx-auto px-4 md:px-6">
        {/* HIGHLIGHTS SECTION */}
        <Reveal delay={100}>
          <DestaquesDodia />
        </Reveal>

        <Reveal delay={200}>
          <HighlightsSection />
        </Reveal>

        <Reveal delay={240}>
          <ContinueCard dateKey={dateKey} />
        </Reveal>

        {/* SECTION 1: EMOTIONAL JOURNEY */}
        <div className="mb-16 mt-12">
          <h2 className="text-[22px] font-semibold text-gray-800 tracking-tight mb-2">Jornada Emocional</h2>
          <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
            Espaço para reflexões, memórias e conexões com seus filhos.
          </p>

          {/* Diário da Mãe */}
          <ClientOnly>
            <Reveal delay={260}>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
                Diário da Mãe
              </div>
              <SoftCard className="mb-8">
                <div className="flex flex-col gap-1 mb-6">
                  <h3 className="m360-subtitle">Um espaço só seu para reflexões e memórias</h3>
                  <p className="m360-label-sm text-gray-600">
                    Registre pensamentos, gratidão, memórias especiais e reflexões sobre sua jornada.
                  </p>
                </div>
                <DiarioDaMae />
              </SoftCard>
            </Reveal>
          </ClientOnly>

          {/* Momentos com os Filhos */}
          <ClientOnly>
            <Reveal delay={280}>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
                Momentos com os Filhos
              </div>
              <SoftCard className="mb-8">
                <div className="flex flex-col gap-1 mb-6">
                  <h3 className="m360-subtitle">Celebrate special moments</h3>
                  <p className="m360-label-sm text-gray-600">
                    Registre os momentos especiais, risos e conexões com seus filhos que você quer lembrar para sempre.
                  </p>
                </div>
                <MomentosComOsFilhos />
              </SoftCard>
            </Reveal>
          </ClientOnly>
        </div>

        {/* SECTION 2: EVOLUTION & ANALYTICS */}
        <div className="mb-16">
          <h2 className="text-[22px] font-semibold text-gray-800 tracking-tight mb-2">Sua Evolução</h2>
          <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
            Acompanhe seu progresso, humor e bem-estar ao longo do tempo.
          </p>

          {/* Expanded Weekly Summary */}
          <ClientOnly>
            <Reveal delay={300}>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
                Resumo Semanal
              </div>
              <SoftCard className="mb-8">
                <div className="flex flex-col gap-1 mb-6">
                  <h3 className="m360-subtitle">Your weekly evolution</h3>
                  <p className="m360-label-sm text-gray-600">
                    Visualize seus humores da semana, insights e tendências de bem-estar.
                  </p>
                </div>
                <SuaEvolucao />
              </SoftCard>
            </Reveal>
          </ClientOnly>
        </div>

        {/* SECTION 3: MATERNAL ROUTINES */}
        <div className="mb-16">
          <h2 className="text-[22px] font-semibold text-gray-800 tracking-tight mb-2">Rotinas da Mãe</h2>
          <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
            Suas rotinas diárias e hábitos que sustentam seu bem-estar.
          </p>

          <ClientOnly>
            <Reveal delay={320}>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
                Rotinas Persistentes
              </div>
              <SoftCard className="mb-8">
                <div className="flex flex-col gap-1 mb-6">
                  <h3 className="m360-subtitle">Defina e acompanhe suas rotinas importantes</h3>
                  <p className="m360-label-sm text-gray-600">
                    Crie hábitos saudáveis e acompanhe o progresso das suas rotinas diárias.
                  </p>
                </div>
                <RotinasDaMae />
              </SoftCard>
            </Reveal>
          </ClientOnly>
        </div>

        {/* Premium Banner */}
        {!isPremium() && (
          <Reveal delay={340}>
            <SoftCard className="mb-12 border-primary/30 bg-gradient-to-br from-primary/8 to-white">
              <div className="flex items-start gap-4 sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-2">
                    <AppIcon name="sparkles" size={12} decorative />
                    Premium
                  </div>
                  <h3 className="font-semibold text-support-1">Recursos premium disponíveis</h3>
                  <p className="text-xs text-support-2 mt-1">
                    Desbloqueie PDF avançado e insights detalhados.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    track('paywall_banner_click', { source: 'maternar', feature: 'premium_features' })
                    window.location.href = '/planos'
                  }}
                  className="flex-shrink-0 whitespace-nowrap"
                >
                  Ver planos
                </Button>
              </div>
            </SoftCard>
          </Reveal>
        )}

        {/* SECTION 4: ACCESS HUB */}
        <Reveal delay={360}>
          <div className="mb-8">
            <h2 className="text-[22px] font-semibold text-gray-800 tracking-tight mb-2">Acesso Rápido</h2>
            <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
              Navigate easily to all features and resources.
            </p>
          </div>
          <CardHub />
        </Reveal>
      </div>
    </PageTemplate>
  );
}
