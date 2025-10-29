import type { QuickIdeasTimeWindow } from '@/types/quickIdeas'

const TIME_VALUES: QuickIdeasTimeWindow[] = [5, 10, 20]

export function nearestQuickIdeasWindow(value?: number | null): QuickIdeasTimeWindow {
  if (!value) return 10
  const numeric = Number(value)
  
  if (TIME_VALUES.includes(numeric as QuickIdeasTimeWindow)) {
    return numeric as QuickIdeasTimeWindow
  }
  
  if (numeric <= 5) return 5
  if (numeric <= 10) return 10
  return 20
}
