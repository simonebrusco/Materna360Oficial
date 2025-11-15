'use client';

import * as React from 'react';
import { useEffect } from 'react';
import CardHub from '@/components/maternar/CardHub';
import { PageTemplate } from '@/components/common/PageTemplate';
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';

export default function MaternarClient() {
  const { name } = useProfile();

  useEffect(() => {
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
        <CardHub />
    </PageTemplate>
  );
}
