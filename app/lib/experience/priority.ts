'use client'

import { getExperienceTier } from './experienceTier'

/**
 * Applies priority strategy to a list of items.
 *
 * Free:
 * - Stable order
 * - Predictable experience
 *
 * Premium:
 * - Contextual order
 * - Better relevance
 * - Same items, better sequence
 */
export function prioritizeItems<T>(
  items: T[],
  strategy: 'stable' | 'contextual'
): T[] {
  if (getExperienceTier() === 'premium' && strategy === 'contextual') {
    return applyContextualPriority(items)
  }

  return items
}

/**
 * Contextual priority resolver.
 *
 * ⚠️ IMPORTANT:
 * - Must NEVER remove items
 * - Must NEVER create new items
 * - Must preserve referential integrity
 *
 * This function is intentionally conservative.
 * For now, it returns the same list.
 * Context-aware ordering will be refined at call sites.
 */
function applyContextualPriority<T>(items: T[]): T[] {
  return items
}
