'use client';

import { useState, useCallback } from 'react';

export type PlanTier = 'Free' | 'Plus' | 'Premium';

export interface QuotaState {
  tier: PlanTier;
  usedToday: number;
  limit: number | 'unlimited';
}

const PLAN_LIMITS: Record<PlanTier, number | 'unlimited'> = {
  Free: 3,
  Plus: 10,
  Premium: 'unlimited',
};

export function useIdeasQuota(initialTier: PlanTier = 'Free') {
  const [tier, setTier] = useState<PlanTier>(initialTier);
  const [usedToday, setUsedToday] = useState(0);

  const limit = PLAN_LIMITS[tier];
  const isLimitReached = limit !== 'unlimited' && usedToday >= limit;
  const canGenerate = !isLimitReached;

  const generateIdea = useCallback(() => {
    if (canGenerate) {
      setUsedToday((prev) => prev + 1);
      return true;
    }
    return false;
  }, [canGenerate]);

  const resetQuota = useCallback(() => {
    setUsedToday(0);
  }, []);

  return {
    tier,
    setTier,
    usedToday,
    limit,
    isLimitReached,
    canGenerate,
    generateIdea,
    resetQuota,
  };
}
