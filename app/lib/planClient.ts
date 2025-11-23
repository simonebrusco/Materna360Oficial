'use client'

import { PLANS, type PlanId, type FeatureKey } from './plans'

const STORAGE_KEY = 'm360:plan:id'

export function getCurrentPlanId(): PlanId {
  if (typeof window === 'undefined') return 'free'
  const raw = localStorage.getItem(STORAGE_KEY) as PlanId | null
  return raw && (raw === 'free' || raw === 'plus' || raw === 'premium') ? raw : 'free'
}

export function setCurrentPlanId(id: PlanId) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {}
}

export function isEnabled(feature: FeatureKey): boolean {
  const plan = PLANS[getCurrentPlanId()]
  const v = plan.limits[feature]
  if (typeof v === 'boolean') return v
  return Boolean(v) // number → enabled
}

export function limitOf(feature: FeatureKey): number | boolean | undefined {
  const plan = PLANS[getCurrentPlanId()]
  return plan.limits[feature]
}
