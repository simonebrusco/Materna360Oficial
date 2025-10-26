import type {
  QuickIdeasEnergy,
  QuickIdeasLocation,
  QuickIdeasTimeWindow,
} from '@/app/types/quickIdeas'
import type { FlashRoutineProps } from '@/app/types/flashRoutine'

export type QuickIdeasFilters = {
  location: QuickIdeasLocation
  time_window_min: QuickIdeasTimeWindow | number
  energy: QuickIdeasEnergy
}

export type FlashRoutineFilters = FlashRoutineProps['filters']

export function toFlashFilters(filters: QuickIdeasFilters): FlashRoutineFilters {
  return {
    locale: filters.location,
    time_window_min: Number(filters.time_window_min),
    energy: filters.energy,
  }
}
