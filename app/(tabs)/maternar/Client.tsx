'use client';

import * as React from 'react';
import { useEffect } from 'react';
import CardHub from '@/components/maternar/CardHub';
import { PageTemplate } from '@/components/common/PageTemplate';
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';
import { getTimeGreeting } from '@/app/lib/greetings';

export default function MaternarClient() {
  const { name } = useProfile();

  useEffect(() => {
    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    });
  }, []);

  const greeting = getTimeGreeting(name);
  const pageTitle = 'Bem-vinda ao Materna360';
  const pageSubtitle = 'Juntas vamos fazer de hoje um dia leve.';

  const hero = (
    <p className="text-sm text-support-2">
      {greeting}
    </p>
  );

  return (
    <PageTemplate
      label="MATERNAR"
      title={pageTitle}
      subtitle={pageSubtitle}
      hero={hero}
    >
        <CardHub />
    </PageTemplate>
  );
}
