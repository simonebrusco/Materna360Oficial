'use client';

import { useEffect } from 'react';
import HubHeader from '@/components/maternar/HubHeader';
import CardHub from '@/components/maternar/CardHub';
import { ContinueCard } from './components/ContinueCard';
import DestaquesDodia from '@/components/maternar/DestaquesDodia';
import { HighlightsSection } from './components/HighlightsSection';
import { PageTemplate } from '@/components/common/PageTemplate';
import { Reveal } from '@/components/ui/Reveal';
import { trackTelemetry } from '@/app/lib/telemetry';
import { getCurrentDateKey } from '@/app/lib/persist';

export default function MaternarClient() {
  const dateKey = getCurrentDateKey();

  useEffect(() => {
    trackTelemetry('maternar.page_view', {
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <main data-layout="page-template-v1" className="min-h-screen bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)]">
      <PageTemplate
        title="Bem-vinda ao Maternar."
        subtitle="Aqui começa o seu centro de equilíbrio. Explore suas rotinas, cuide de você e acompanhe o crescimento do seu filho com leveza — tudo em um só lugar."
        hero={<HubHeader greeting="Bem-vinda ao Maternar." subtitle="Aqui começa o seu centro de equilíbrio. Explore suas rotinas, cuide de você e acompanhe o crescimento do seu filho com leveza — tudo em um só lugar." />}
      >
        <DestaquesDodia />
        <Reveal delay={180}>
          <HighlightsSection />
        </Reveal>
        <ContinueCard dateKey={dateKey} />
        <CardHub />
      </PageTemplate>
    </main>
  );
}
