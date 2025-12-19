'use client'

import { getExperienceTier } from './experienceTier'

export function prioritizeItems<T>(
  items: T[],
  strategy: 'stable' | 'contextual'
): T[] {
  if (getExperienceTier() === 'premium' && strategy === 'contextual') {
    return applyContextualPriority(items)
  }
  return items
}

function applyContextualPriority<T>(items: T[]): T[] {
  const highPending: T[] = []
  const pending: T[] = []
  const done: T[] = []

  for (const it of items) {
    const anyIt: any = it as any
    const isDone = Boolean(anyIt?.done ?? anyIt?.completed) || anyIt?.status === 'done'
    const isHigh = (anyIt?.priority ?? '').toString().toLowerCase() === 'alta'

    if (isDone) {
      done.push(it)
    } else if (isHigh) {
      highPending.push(it)
    } else {
      pending.push(it)
    }
  }

  return highPending.concat(pending, done)
}
