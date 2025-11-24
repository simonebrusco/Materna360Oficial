'use client';

import React from 'react';
import AppIcon from '@/components/ui/AppIcon';

interface QuotaBadgeProps {
  usedToday: number;
  limit: number | 'unlimited';
}

export function QuotaBadge({ usedToday, limit }: QuotaBadgeProps) {
  const displayLimit = limit === 'unlimited' ? '∞' : limit;
  const displayText =
    limit === 'unlimited'
      ? `Ideias: ilimitadas`
      : `Ideias hoje: ${usedToday}/${limit}`;

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
      <AppIcon name="idea" size={16} decorative />
      <span>{displayText}</span>
    </div>
  );
}
