'use client';

import * as React from 'react';
import { useEffect } from 'react';
import HubHeader from '@/components/maternar/HubHeader';
import CardHub from '@/components/maternar/CardHub';
import MaternarScrollHub from '@/components/maternar/MaternarScrollHub';
import { ContinueCard } from './components/ContinueCard';
import DestaquesDodia from '@/components/maternar/DestaquesDodia';
import { HighlightsSection } from './components/HighlightsSection';
import { PageTemplate } from '@/components/common/PageTemplate';
import { Reveal } from '@/components/ui/Reveal';
import { track } from '@/app/lib/telemetry';
import { getBrazilDateKey } from '@/app/lib/dateKey';
import { useProfile } from '@/app/hooks/useProfile';
import { getTimeGreeting } from '@/app/lib/greetings';
import { isPremium } from '@/app/lib/plan';
import SoftCard from '@/components/ui/SoftCard';
import { Button } from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';

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
        <MaternarScrollHub />

        <div id="maternar-resumo-semana" className="px-4 py-6 sm:px-6 md:py-8">
          <SoftCard>
            <div className="flex flex-col gap-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <AppIcon name="calendar" variant="brand" decorative className="h-7 w-7" />
                <div>
                  <p className="text-base font-semibold text-support-1 leading-snug">
                    Resumo da sua semana
                  </p>
                  <p className="text-sm text-support-2 leading-snug">
                    Um olhar carinhoso sobre como você tem se sentido nos últimos dias.
                  </p>
                </div>
              </div>
            </div>
          </SoftCard>
        </div>

        <div id="maternar-habitos-maternos" className="px-4 py-6 sm:px-6 md:py-8">
          <SoftCard>
            <div className="flex flex-col gap-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <AppIcon name="heart" variant="brand" decorative className="h-7 w-7" />
                <div>
                  <p className="text-base font-semibold text-support-1 leading-snug">
                    Hábitos maternos
                  </p>
                  <p className="text-sm text-support-2 leading-snug">
                    Pequenas práticas que sustentam uma rotina mais leve e conectada com seus filhos.
                  </p>
                </div>
              </div>
            </div>
          </SoftCard>
        </div>

        <div id="maternar-momentos-filho" className="px-4 py-6 sm:px-6 md:py-8">
          <h2 className="text-xl font-semibold text-support-1 mb-4">Momentos com seu filho</h2>
          <SoftCard>
            <div className="space-y-3">
              <p className="text-sm text-support-2">
                Pequenas memórias que contam a grande história da sua maternidade.
              </p>
              <p className="text-xs text-gray-500">
                Capture gestos especiais, conversas marcantes e abraços que merecem ser lembrados.
              </p>
            </div>
          </SoftCard>
        </div>

        <div id="maternar-evolucao-emocional" className="px-4 py-6 sm:px-6 md:py-8">
          <h2 className="text-xl font-semibold text-support-1 mb-4">Sua evolução emocional</h2>
          <SoftCard>
            <div className="space-y-3">
              <p className="text-sm text-support-2">
                Acompanhe padrões, mudanças e conquistas ao longo dos dias.
              </p>
              <p className="text-xs text-gray-500">
                Visualize seu crescimento emocional através de gráficos e insights personalizados.
              </p>
            </div>
          </SoftCard>
        </div>

        <div id="maternar-diario-mae" className="px-4 py-6 sm:px-6 md:py-8">
          <h2 className="text-xl font-semibold text-support-1 mb-4">Diário da mãe</h2>
          <SoftCard>
            <div className="space-y-3">
              <p className="text-sm text-support-2">
                Um espaço seguro para colocar em palavras aquilo que você sente.
              </p>
              <p className="text-xs text-gray-500">
                Expresse-se livremente e guarde seus pensamentos em um diário privado e seguro.
              </p>
            </div>
          </SoftCard>
        </div>

        <div id="maternar-trilhas-premium" className="px-4 py-6 sm:px-6 md:py-8">
          <h2 className="text-xl font-semibold text-support-1 mb-4">Trilhas premium</h2>
          <SoftCard>
            <div className="space-y-3">
              <p className="text-sm text-support-2">
                Caminhos guiados para semanas mais leves, conscientes e transformadoras.
              </p>
              <p className="text-xs text-gray-500">
                Acesse conteúdos exclusivos, meditações e jornadas personalizadas.
              </p>
            </div>
          </SoftCard>
        </div>

        <div className="px-4 py-6 sm:px-6 md:py-8">
          <DestaquesDodia />
        </div>

        <Reveal delay={200}>
          <div className="px-4 sm:px-6">
            <HighlightsSection />
          </div>
        </Reveal>

        <Reveal delay={240}>
          <div className="px-4 sm:px-6">
            <ContinueCard dateKey={dateKey} />
          </div>
        </Reveal>

        {!isPremium() && (
          <Reveal delay={260}>
            <div className="px-4 sm:px-6">
              <SoftCard className="mb-4 border-primary/30 bg-gradient-to-br from-primary/8 to-white">
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
            </div>
          </Reveal>
        )}

        <CardHub />
    </PageTemplate>
  );
}
