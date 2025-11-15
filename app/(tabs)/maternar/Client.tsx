'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import CardHub from '@/components/maternar/CardHub';
import { PageTemplate } from '@/components/common/PageTemplate';
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';
import { getHeroGreetingForProfile, type HeroGreeting } from '@/app/lib/heroGreeting';

export default function MaternarClient() {
  const profile = useProfile();
  const [heroData, setHeroData] = useState<HeroGreeting | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Compute hero greeting after mount to avoid hydration mismatch
    // This is client-only to ensure timezone-aware greeting and daily message
    const data = getHeroGreetingForProfile(profile as any);
    setHeroData(data);
    setMounted(true);

    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    });
  }, [profile]);

  const pageSubtitle = 'Bem-vinda ao Materna360';

  // Dynamic main headline: "{greeting}, {firstName}. {dailyMessage}"
  const pageTitle = mounted && heroData
    ? `${heroData.greeting}, ${heroData.firstName}. ${heroData.dailyMessage}`
    : 'Bem-vinda ao Materna360';

  return (
    <PageTemplate
      label="MATERNAR"
      title={pageTitle}
      subtitle={pageSubtitle}
    >
        <CardHub />
    </PageTemplate>
  );
}
