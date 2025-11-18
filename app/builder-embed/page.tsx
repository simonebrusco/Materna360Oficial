'use client';

import * as React from 'react';
import { Suspense } from 'react';
import BuilderErrorBoundary from '@/components/dev/BuilderErrorBoundary';
import { PageHeader } from '@/components/common/PageHeader';
import BottomNav from '@/components/common/BottomNav';
import { MeuDiaClient } from '@/app/(tabs)/meu-dia/Client';

const fallbackProfile: any = {
  motherName: 'Mãe',
  children: [] as any,
};

// Hard-disable heavy features in Builder (charts/pdf/timers/observers) via global flag
if (typeof window !== 'undefined') {
  (window as any).__BUILDER_MODE__ = true;
}

function BuilderEmbedInner() {
  // Force readable text (avoid theme inversion in iframe)
  const forceStyle: React.CSSProperties = {
    color: '#111',
    background: 'transparent',
  };

  // Generate stable date strings with SSR-safe defaults
  const [dateKey, setDateKey] = React.useState<string>('2025-01-01');
  const [weekKey, setWeekKey] = React.useState<string>('2025-W01');

  React.useEffect(() => {
    const now = new Date();
    const iso = now.toISOString().slice(0, 10);
    const year = now.getFullYear();
    setDateKey(iso);
    setWeekKey(`${year}-W01`);
  }, []);

  return (
    <BuilderErrorBoundary>
      <main className="min-h-screen pb-24" style={forceStyle}>
        <PageHeader
          title="Meu Dia (Builder Preview)"
          subtitle="Safe embed mode for Builder editor"
        />

        <MeuDiaClient
          __builderPreview__={true}
          __fallbackProfile__={fallbackProfile}
          __fallbackGreeting__="Olá, Mãe!"
          __fallbackCurrentDateKey__={dateKey}
          __fallbackWeekStartKey__={weekKey}
          __disableHeavy__={true}
        />

        <BottomNav />
      </main>
    </BuilderErrorBoundary>
  );
}

export default function BuilderEmbedPage() {
  return (
    <Suspense fallback={null}>
      <BuilderEmbedInner />
    </Suspense>
  );
}
