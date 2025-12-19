'use client'

import { getExperienceTier } from './experienceTier'

export type ContinuityTone = 'gentil' | 'direto'

/**
 * Resolves the appropriate continuity tone based on experience tier.
 *
 * Free:
 * - Always gentle
 * - Emotionally safe
 * - Never confrontational
 *
 * Premium:
 * - Respects the requested tone
 * - Can be more direct when appropriate
 */
export function getContinuityTone(
  base: ContinuityTone
): ContinuityTone {
  if (getExperienceTier() === 'premium') {
    return base
  }

  return 'gentil'
}
