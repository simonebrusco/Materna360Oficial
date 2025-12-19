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
 * Conservative default: stable partition
 * - pending/active first
 * - completed/done last
 * preserving original order within each group
 */
function applyContextualPriority<T>(items: T[]): T[] {
  const pending: T[] = []
  const done: T[] = []

  for (const it of items) {
    const anyIt: any = it as any
    const isDone = Boolean(anyIt?.done ?? anyIt?.completed) || anyIt?.status === 'done'
    if (isDone) done.push(it)
    else pending.push(it)
  }

  return pending.concat(done)
}
