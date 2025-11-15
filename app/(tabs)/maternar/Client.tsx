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

  const pageTitle = 'Bem-vinda ao Materna360';

  // Build the hero section with dynamic greeting and daily message
  const hero = mounted && heroData ? (
    <section className="flex flex-col gap-1">
      {/* Small fixed subtitle */}
      <p className="text-sm font-medium text-support-2">
        Bem-vinda ao Materna360
      </p>

      {/* Main dynamic headline combining greeting, name, and daily message */}
      <h1 className="text-2xl md:text-3xl font-semibold text-support-1 leading-snug">
        {heroData.greeting}, {heroData.firstName}. {heroData.dailyMessage}
      </h1>
    </section>
  ) : null;

  return (
    <PageTemplate
      label="MATERNAR"
      title={pageTitle}
      hero={hero}
    >
        <CardHub />
    </PageTemplate>
  );
}
