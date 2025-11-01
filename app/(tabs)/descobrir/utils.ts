import type {
  QuickIdeasAgeBucket,
  QuickIdeasLocation,
  QuickIdeasEnergy,
  QuickIdea,
} from '@/app/types/quickIdeas'

/**
 * Convert age in years to the appropriate bucket.
 * Pure function with no side effects.
 */
export function ageToBucket(ageYears: number): QuickIdeasAgeBucket {
  const age = Math.max(0, Math.min(ageYears, 999))

  if (age < 2) return '0-1'
  if (age < 4) return '2-3'
  if (age < 6) return '4-5'
  if (age < 8) return '6-7'
  return '8+'
}

/**
 * Convert time preference string to minutes range.
 * Maps: 'short' ≤ 15, 'medium' 20–40, 'long' ≥ 45
 */
export function timeToMinutes(
  time?: 'short' | 'medium' | 'long'
): { min: number; max: number } {
  switch (time) {
    case 'short':
      return { min: 0, max: 15 }
    case 'medium':
      return { min: 20, max: 40 }
    case 'long':
      return { min: 45, max: 999 }
    default:
      return { min: 0, max: 999 }
  }
}

/**
 * Filter suggestions by location (if provided).
 */
export function filterByLocation(
  ideas: QuickIdea[],
  location?: QuickIdeasLocation
): QuickIdea[] {
  if (!location) return ideas
  return ideas.filter((idea) => idea.location === location)
}

/**
 * Filter suggestions by energy level (if provided).
 */
export function filterByEnergy(
  ideas: QuickIdea[],
  energy?: QuickIdeasEnergy
): QuickIdea[] {
  if (!energy) return ideas
  return ideas.filter((idea) => {
    const catalogEntry = idea as any
    const suitableEnergies = catalogEntry.suitableEnergies || []
    return suitableEnergies.includes(energy)
  })
}

/**
 * Filter suggestions by time window (if provided).
 */
export function filterByTime(
  ideas: QuickIdea[],
  timeRange?: { min: number; max: number }
): QuickIdea[] {
  if (!timeRange) return ideas
  return ideas.filter(
    (idea) =>
      idea.time_total_min >= timeRange.min &&
      idea.time_total_min <= timeRange.max
  )
}

/**
 * Prioritize suggestions that have age adaptations for the target bucket.
 */
export function prioritizeByAgeBucket(
  ideas: QuickIdea[],
  bucket: QuickIdeasAgeBucket
): QuickIdea[] {
  const withAdaptation = ideas.filter(
    (idea) => idea.age_adaptations && idea.age_adaptations[bucket]
  )
  const withoutAdaptation = ideas.filter(
    (idea) => !idea.age_adaptations || !idea.age_adaptations[bucket]
  )
  return [...withAdaptation, ...withoutAdaptation]
}

/**
 * Build a view model for a single suggestion.
 */
export type SuggestionView = {
  id: string
  title: string
  summary: string
  timeLabel: string
  location: QuickIdeasLocation
  energy: QuickIdeasEnergy
  ageNote?: string
  cover?: string
  materials: string[]
  steps: string[]
}

export function buildSuggestionView(
  idea: QuickIdea,
  ageBucket: QuickIdeasAgeBucket
): SuggestionView {
  const ageNote = idea.age_adaptations?.[ageBucket]

  return {
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    timeLabel: `${idea.time_total_min} min`,
    location: idea.location,
    energy: idea.location as any, // map to energy level if available
    ageNote,
    materials: idea.materials,
    steps: idea.steps,
  }
}

/**
 * Apply all filters and prioritization to a catalog.
 */
export function applyFilters(
  catalog: QuickIdea[],
  options: {
    location?: QuickIdeasLocation
    energy?: QuickIdeasEnergy
    timeRange?: { min: number; max: number }
    ageBucket: QuickIdeasAgeBucket
  }
): QuickIdea[] {
  let filtered = catalog

  filtered = filterByLocation(filtered, options.location)
  filtered = filterByEnergy(filtered, options.energy)
  filtered = filterByTime(filtered, options.timeRange)
  filtered = prioritizeByAgeBucket(filtered, options.ageBucket)

  return filtered
}
