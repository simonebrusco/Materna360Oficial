'use client';

import { useEffect } from 'react';
import HubHeader from '@/components/maternar/HubHeader';
import CardHub from '@/components/maternar/CardHub';
import { PageTemplate } from '@/components/common/PageTemplate';
import { trackTelemetry } from '@/app/lib/telemetry';

export default function MaternarClient() {
  useEffect(() => {
    trackTelemetry('maternar.page_view', {
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <main data-layout="page-template-v1" className="min-h-screen bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)]">
      <PageTemplate
        title="Bem-vinda ao Maternar"
        subtitle="Como você quer se cuidar hoje?"
        hero={<HubHeader greeting="Bem-vinda ao Maternar" subtitle="Como você quer se cuidar hoje?" />}
      >
        <CardHub />
      </PageTemplate>
    </main>
  );
}
