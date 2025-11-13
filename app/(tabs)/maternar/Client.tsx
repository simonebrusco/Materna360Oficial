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

  const greeting = name ? getTimeGreeting(name) : 'Bem-vinda ao Maternar';
  const subtitle = 'Juntas vamos fazer de hoje um dia leve.';

  return (
    <main data-layout="page-template-v1" className="min-h-screen bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)]">
      <PageTemplate
        hero={<HubHeader greeting={greeting} subtitle={subtitle} />}
      >
        <DestaquesDodia />
        <Reveal delay={200}>
          <HighlightsSection />
        </Reveal>
        <Reveal delay={240}>
          <ContinueCard dateKey={dateKey} />
        </Reveal>
        <CardHub />
      </PageTemplate>
    </main>
  );
}
