'use client'

import { isPremium } from '../plan'

export type ExperienceTier = 'free' | 'premium'

/**
 * Central experience tier resolver.
 *
 * This function is the single source of truth for
 * experience-level decisions (density, priority, tone).
 *
 * ⚠️ After P23:
 * - Components must NOT call isPremium() directly
 * - All experience logic must go through this layer
 */
export function getExperienceTier(): ExperienceTier {
  return isPremium() ? 'premium' : 'free'
}
