'use client'

import { getExperienceTier } from './experienceTier'

export type DensityLevel = 'normal' | 'reduced'

/**
 * Resolves content density level based on experience tier.
 *
 * Free:
 * - Normal density
 * - Comfortable volume
 * - Never frustrating
 *
 * Premium:
 * - Reduced density
 * - Less visual and cognitive noise
 * - Same content, better pacing
 */
export function getDensityLevel(): DensityLevel {
  return getExperienceTier() === 'premium'
    ? 'reduced'
    : 'normal'
}
