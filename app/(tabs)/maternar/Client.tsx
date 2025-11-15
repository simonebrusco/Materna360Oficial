'use client';

import * as React from 'react';
import CardHub from '@/components/maternar/CardHub';
import { PageTemplate } from '@/components/common/PageTemplate';
import { track } from '@/app/lib/telemetry';

export default function MaternarClient() {
  React.useEffect(() => {
    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <PageTemplate
      label="MATERNAR"
      title="Bem-vinda ao Materna360"
      subtitle="Juntas vamos fazer de hoje um dia leve."
    >
        <CardHub />
    </PageTemplate>
  );
}
