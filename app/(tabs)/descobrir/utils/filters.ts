import type { FlashRoutineFiltersT, QuickIdeasFiltersT } from '@/app/lib/discoverSchemas'

export function toFlashFilters(filters: QuickIdeasFiltersT): FlashRoutineFiltersT {
  return {
    locale: filters.location,
    time_window_min: Number(filters.time_window_min),
    energy: filters.energy,
  }
}
