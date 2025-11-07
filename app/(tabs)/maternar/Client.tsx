'use client';

import { useEffect } from 'react';
import HubHeader from '@/components/maternar/HubHeader';
import CardHub from '@/components/maternar/CardHub';
import { trackTelemetry } from '@/app/lib/telemetry';

export default function MaternarClient() {
  useEffect(() => {
    trackTelemetry('maternar.page_view', {
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)]">
      <div className="mx-auto max-w-6xl px-0">
        <HubHeader
          greeting="Bem-vinda ao Maternar"
          subtitle="Como você quer se cuidar hoje?"
        />
        <CardHub />
      </div>
    </main>
  );
}
