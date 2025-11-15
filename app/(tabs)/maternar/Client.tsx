'use client';

import * as React from 'react';
import { useEffect } from 'react';
import HubHeader from '@/components/maternar/HubHeader';
import CardHub from '@/components/maternar/CardHub';
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
        <DestaquesDodia />
        <Reveal delay={200}>
          <HighlightsSection />
        </Reveal>
        <Reveal delay={240}>
          <ContinueCard dateKey={dateKey} />
        </Reveal>
        {!isPremium() && (
          <Reveal delay={260}>
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
          </Reveal>
        )}
        <CardHub />
    </PageTemplate>
  );
}
