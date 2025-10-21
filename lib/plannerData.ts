const STORAGE_KEY = 'planner_v1'
const WEEK_STORAGE_KEY = 'planner_last_week_start'
export const USE_API_PLANNER = process.env.NEXT_PUBLIC_USE_API_PLANNER === '1'

export type PlannerItemType = 'Brincadeira' | 'Receita' | 'Livro' | 'Brinquedo' | 'Recomendação'

export type PlannerItem = {
  id: string
  type: PlannerItemType
  title: string
  done: boolean
  durationMin?: number
  ageBand?: '0-6m' | '7-12m' | '1-2a' | '3-4a' | '5-6a'
  notes?: string
}

export type PlannerData = Record<string, PlannerItem[]>

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
    if (!acc[item.date]) {
      acc[item.date] = []
    }
    const { date, ...rest } = item
    acc[item.date].push(rest)
    return acc
  }, {})
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
