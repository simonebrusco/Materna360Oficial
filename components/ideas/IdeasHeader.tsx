'use client';

import React from 'react';
import { QuotaBadge } from './QuotaBadge';

interface IdeasHeaderProps {
  usedToday: number;
  limit: number | 'unlimited';
}

export function IdeasHeader({ usedToday, limit }: IdeasHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <QuotaBadge usedToday={usedToday} limit={limit} />
      <p className="text-sm text-support-2">
        Gere ideias personalizadas baseadas no desenvolvimento do seu filho. Seu limite diário depende do plano.
      </p>
    </div>
  );
}
