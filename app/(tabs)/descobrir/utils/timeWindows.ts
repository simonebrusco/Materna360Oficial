import type { QuickIdeasTimeWindow } from '@/app/types/quickIdeas'

export const QUICK_IDEAS_WINDOWS: readonly QuickIdeasTimeWindow[] = [5, 10, 20] as const

export function nearestQuickIdeasWindow(value: number): QuickIdeasTimeWindow {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return QUICK_IDEAS_WINDOWS[0]
  }

  let best = QUICK_IDEAS_WINDOWS[0]
  let bestDiff = Math.abs(numeric - best)

  for (const window of QUICK_IDEAS_WINDOWS) {
    const diff = Math.abs(numeric - window)
    if (diff < bestDiff) {
      best = window
      bestDiff = diff
    }
  }

  return best
}
