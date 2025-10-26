import { fnv1a } from '@/app/lib/hash'
import type { SelfCare, SelfCareEnergy } from '@/app/types/selfCare'

const limitSize = 3

const sortSelfCare = (items: SelfCare[]): SelfCare[] => {
  return [...items].sort((a, b) => {
    const weightA = a.sortWeight ?? 0
    const weightB = b.sortWeight ?? 0
    if (weightA !== weightB) {
      return weightB - weightA
    }

    const dateA = a.createdAt ? Date.parse(a.createdAt) : 0
    const dateB = b.createdAt ? Date.parse(b.createdAt) : 0
    if (dateA !== dateB) {
      return dateB - dateA
    }

    return a.title.localeCompare(b.title, 'pt-BR')
  })
}

const nearestMinutes = (minutes: number): number[] => {
  switch (minutes) {
    case 2:
      return [5, 10]
    case 5:
      return [2, 10]
    case 10:
      return [5, 2]
    default:
      return [5, 10]
  }
}

const rotateByDate = <T>(items: T[], seed: string): T[] => {
  if (items.length === 0) {
    return items
  }
  const offset = fnv1a(seed) % items.length
  if (offset === 0) {
    return items
  }
  return [...items.slice(offset), ...items.slice(0, offset)]
}

export type SelfCareSelectionInput = {
  items: SelfCare[]
  energy: SelfCareEnergy
  minutes: 2 | 5 | 10
  dateKey: string
}

export type SelfCareSelectionResult = {
  items: SelfCare[]
  rotationKey: string
  source: 'primary' | 'fallback'
}

export const selectSelfCareItems = ({ items, energy, minutes, dateKey }: SelfCareSelectionInput): SelfCareSelectionResult => {
  const activeItems = items.filter((item) => item.active)

  const best = activeItems.filter((item) => item.minutes === minutes && item.energyFit.includes(energy))

  let pool = best

  if (pool.length < 2) {
    const sameMinutesAnyEnergy = activeItems.filter((item) => item.minutes === minutes)
    pool = sameMinutesAnyEnergy
  }

  if (pool.length < 2) {
    const nearest = nearestMinutes(minutes)
    for (const candidateMinutes of nearest) {
      const nearestMatch = activeItems.filter(
        (item) => item.minutes === candidateMinutes && item.energyFit.includes(energy)
      )
      if (nearestMatch.length > 0) {
        pool = nearestMatch
        break
      }
    }
  }

  if (pool.length < 2) {
    pool = activeItems
  }

  if (pool.length === 0) {
    return { items: [], rotationKey: `${dateKey}:${minutes}:${energy}`, source: 'fallback' }
  }

  const sorted = sortSelfCare(pool)
  const rotated = rotateByDate(sorted, `${dateKey}:${minutes}:${energy}`)

  return {
    items: rotated.slice(0, limitSize),
    rotationKey: `${dateKey}:${minutes}:${energy}`,
    source: sorted === pool ? 'primary' : 'fallback',
  }
}
