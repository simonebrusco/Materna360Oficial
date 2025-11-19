'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
// Minimal imports to test compilation
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';

export function MaternarClient() {
  const { name } = useProfile();

  useEffect(() => {
    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <div className="p-4 text-center">
      <h1>Maternar Hub</h1>
      <p>Hello, {name || 'Guest'}!</p>
    </div>
  );
}
