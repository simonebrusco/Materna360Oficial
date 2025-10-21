import type { AgeBand } from './dailyActivity'

const STORAGE_KEY = 'planner_v1'
const WEEK_STORAGE_KEY = 'planner_last_week_start'
const RECOMMENDATION_STORAGE_KEY = 'planner_reco_v1'
export const RECOMMENDATIONS_UPDATED_EVENT = 'planner:recommendations-updated'
export const USE_API_PLANNER = process.env.NEXT_PUBLIC_USE_API_PLANNER === '1'

export type PlannerItemType = 'Brincadeira' | 'Receita' | 'Livro' | 'Brinquedo' | 'Recomendação'

export type PlannerItem = {
  id: string
  type: PlannerItemType
  title: string
  done: boolean
  durationMin?: number
  ageBand?: AgeBand
  notes?: string
  refId?: string
  status?: 'pending' | 'done'
  createdAt?: string
  updatedAt?: string
}

export type PlannerData = Record<string, PlannerItem[]>

export type PlannerRecommendationSource = 'daily-activity' | 'suggested'

export type PlannerRecommendation = {
  id: string
  type: 'Recomendação'
  title: string
  durationMin?: number | null
  ageBand?: AgeBand | null
  refId?: string | null
  link?: string | null
  source?: PlannerRecommendationSource
  createdAt: string
}

export type PlannerRecommendationMap = Record<string, PlannerRecommendation[]>

export const plannerStorage = {
  getPlannerData(): PlannerData {
    if (!USE_API_PLANNER && typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (stored) {
          return JSON.parse(stored) as PlannerData
        }
      } catch (error) {
        console.error('Failed to read planner data from storage:', error)
      }
    }

    return {}
  },

  savePlannerData(data: PlannerData) {
    if (!USE_API_PLANNER && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to persist planner data to storage:', error)
      }
    }
  },

  getStoredWeekStart(): string | null {
    if (!USE_API_PLANNER && typeof window !== 'undefined') {
      try {
        return window.localStorage.getItem(WEEK_STORAGE_KEY)
      } catch (error) {
        console.error('Failed to read planner week start:', error)
      }
    }

    return null
  },

  saveWeekStart(weekStartKey: string) {
    if (!USE_API_PLANNER && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(WEEK_STORAGE_KEY, weekStartKey)
      } catch (error) {
        console.error('Failed to persist planner week start:', error)
      }
    }
  },
}

type PlannerApiItem = PlannerItem & { date: string }

const fetchPlannerData = async (weekStart: string): Promise<PlannerData> => {
  const url = `/api/planner?weekStart=${encodeURIComponent(weekStart)}`
  const response = await fetch(url, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch planner data (${response.status})`)
  }

  const payload: { items: PlannerApiItem[] } = await response.json()
  return payload.items.reduce<PlannerData>((acc, item) => {
    const { date, ...rest } = item
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(rest)
    return acc
  }, {})
}

const readRecommendationMap = (): PlannerRecommendationMap => {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(RECOMMENDATION_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as PlannerRecommendationMap
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch (error) {
    console.error('Failed to read planner recommendations:', error)
  }

  return {}
}

const writeRecommendationMap = (data: PlannerRecommendationMap) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(RECOMMENDATION_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to persist planner recommendations:', error)
  }
}

const recommendationKey = (recommendation: PlannerRecommendation) => {
  const refId = recommendation.refId?.trim()
  if (refId) {
    return `ref:${refId}`
  }
  return `title:${recommendation.title.trim().toLowerCase()}`
}

const sanitizeRecommendation = (recommendation: PlannerRecommendation): PlannerRecommendation => {
  return {
    id: recommendation.id,
    type: 'Recomendação',
    title: recommendation.title.trim(),
    durationMin:
      recommendation.durationMin !== undefined && recommendation.durationMin !== null
        ? Math.max(0, Math.round(recommendation.durationMin))
        : null,
    ageBand: recommendation.ageBand ?? null,
    refId: recommendation.refId?.trim() ?? null,
    link: recommendation.link?.trim() ?? null,
    source: recommendation.source ?? 'daily-activity',
    createdAt: recommendation.createdAt,
  }
}

export const recommendationStorage = {
  getAll(): PlannerRecommendationMap {
    return readRecommendationMap()
  },

  saveAll(data: PlannerRecommendationMap) {
    writeRecommendationMap(data)
  },

  getForDate(dateKey: string): PlannerRecommendation[] {
    const map = readRecommendationMap()
    const list = map[dateKey]
    if (!Array.isArray(list)) {
      return []
    }
    return list
  },

  upsert(dateKey: string, recommendation: PlannerRecommendation): PlannerRecommendation[] {
    const map = readRecommendationMap()
    const sanitized = sanitizeRecommendation(recommendation)
    const existing = Array.isArray(map[dateKey]) ? map[dateKey] : []
    const newKey = recommendationKey(sanitized)

    const filtered = existing.filter((item) => recommendationKey(item) !== newKey)
    const next = [sanitized, ...filtered].slice(0, 3)
    map[dateKey] = next
    writeRecommendationMap(map)
    return next
  },
}

export const plannerApi = {
  async getPlannerData(weekStart: string): Promise<PlannerData> {
    if (!USE_API_PLANNER) {
      return plannerStorage.getPlannerData()
    }

    try {
      return await fetchPlannerData(weekStart)
    } catch (error) {
      console.error('Planner API get failed, falling back to local data:', error)
      return plannerStorage.getPlannerData()
    }
  },

  async savePlannerItem(dateKey: string, item: PlannerItem) {
    if (!USE_API_PLANNER) {
      return
    }

    const payload: PlannerApiItem = {
      ...item,
      date: dateKey,
    }

    try {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to save planner item')
      }
    } catch (error) {
      console.error('Planner API save failed:', error)
    }
  },

  async deletePlannerItem(id: string) {
    if (!USE_API_PLANNER) {
      return
    }

    try {
      const response = await fetch(`/api/planner/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete planner item')
      }
    } catch (error) {
      console.error('Planner API delete failed:', error)
    }
  },
}
