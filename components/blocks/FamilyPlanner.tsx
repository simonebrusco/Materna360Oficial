'use client'


'use client'

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { resolveAgeRange, type Child, type Profile, type AgeRange } from '@/app/lib/ageRange'
import type { ChildRecommendation, RecommendationType } from '@/app/data/childContent'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DEFAULT_AGE_BAND, mapMonthsToAgeBand } from '@/lib/dailyActivity'
import {
  plannerApi,
  plannerStorage,
  recommendationStorage,
  type PlannerData,
  type PlannerItem,
  type PlannerRecommendation,
  type PlannerRecommendationSource,
  RECOMMENDATIONS_UPDATED_EVENT,
  USE_API_PLANNER,
} from '@/lib/plannerData'

const TYPE_OPTIONS = ['Brincadeira', 'Receita', 'Livro', 'Brinquedo', 'Recomendação'] as const
const AGE_BAND_OPTIONS = ['0-6m', '7-12m', '1-2a', '3-4a', '5-6a'] as const
const AGE_RANGE_OPTIONS: readonly AgeRange[] = ['0-1', '2-3', '4-5', '6-7', '8+']
const RECOMMENDATION_TYPES: RecommendationType[] = ['Brincadeira', 'Receita', 'Livro']
const RECOMMENDATION_ALL_CHILDREN_ID = '__all__'

type RecommendationSuggestion = ChildRecommendation & {
  source: 'suggested'
}

const AGE_BAND_TO_RANGE_MAP: Record<(typeof AGE_BAND_OPTIONS)[number], AgeRange> = {
  '0-6m': '0-1',
  '7-12m': '0-1',
  '1-2a': '2-3',
  '3-4a': '4-5',
  '5-6a': '6-7',
}

const AGE_RANGE_TO_BAND_MAP: Record<AgeRange, (typeof AGE_BAND_OPTIONS)[number]> = {
  '0-1': '0-6m',
  '2-3': '1-2a',
  '4-5': '3-4a',
  '6-7': '5-6a',
  '8+': '5-6a',
}

const mapAgeBandToAgeRangeValue = (ageBand: (typeof AGE_BAND_OPTIONS)[number]): AgeRange => {
  return AGE_BAND_TO_RANGE_MAP[ageBand] ?? '0-1'
}

const mapAgeRangeToAgeBandValue = (range?: AgeRange | null): (typeof AGE_BAND_OPTIONS)[number] | undefined => {
  if (!range) {
    return undefined
  }

  return AGE_RANGE_TO_BAND_MAP[range]
}

const deriveInitialAgeBand = (profile?: Profile): (typeof AGE_BAND_OPTIONS)[number] => {
  const children = sanitizeRecommendationChildren(profile)
  const [firstChild] = children
  const mapped = mapAgeRangeToAgeBandValue(firstChild?.ageRange ?? null)
  return mapped ?? DEFAULT_AGE_BAND
}

const pickRecommendationsForDay = (
  ageBand: (typeof AGE_BAND_OPTIONS)[number],
  seed: string,
  catalog: ChildRecommendation[],
  count = 3
): RecommendationSuggestion[] => {
  if (catalog.length === 0) {
    return []
  }

  const ageRange = mapAgeBandToAgeRangeValue(ageBand)
  const ageMatched = catalog.filter((item) => item.ageRange === ageRange)
  const pool = ageMatched.length > 0 ? ageMatched : catalog
  const total = Math.min(count, pool.length)

  if (total === 0) {
    return []
  }

  const startIndex = computeDeterministicIndex(seed, pool.length)
  const suggestions: RecommendationSuggestion[] = []

  for (let offset = 0; suggestions.length < total && offset < pool.length; offset += 1) {
    const candidate = pool[(startIndex + offset) % pool.length]
    if (suggestions.some((entry) => entry.id === candidate.id)) {
      continue
    }

    suggestions.push({
      ...candidate,
      source: 'suggested',
    })
  }

  return suggestions
}

const typeSupportsDuration = (type: (typeof TYPE_OPTIONS)[number]) => type === 'Brincadeira' || type === 'Receita'

type WeekLabel = {
  key: string
  shortLabel: string
  longLabel: string
  chipLabel: string
}

type FamilyPlannerProps = {
  currentDateKey: string
  weekStartKey: string
  weekLabels: WeekLabel[]
  plannerTitle?: string
  profile: Profile
  dateKey: string
  recommendations: ChildRecommendation[]
}

const parseDateKeyToUTC = (key: string): Date | null => {
  const [year, month, day] = key.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }

  return new Date(Date.UTC(year, month - 1, day, 12))
}

const formatDateKeyFromUTC = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDaysToKey = (key: string, amount: number): string => {
  const parsed = parseDateKeyToUTC(key)
  if (!parsed) {
    return key
  }

  const result = new Date(parsed)
  result.setUTCDate(result.getUTCDate() + amount)
  return formatDateKeyFromUTC(result)
}

const buildRecommendationKey = (title: string, refId?: string | null) => {
  const safeRef = refId?.trim()
  if (safeRef) {
    return `ref:${safeRef}`
  }

  return `title:${title.trim().toLowerCase()}`
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 10)
}

const computeDeterministicIndex = (seed: string, length: number) => {
  if (length <= 0) {
    return 0
  }

  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0
  }

  return Math.abs(hash) % length
}

const formatAgeRangeLabel = (range?: AgeRange | null) => {
  if (!range) {
    return 'Todas as idades'
  }

  if (range === '8+') {
    return '8 anos ou mais'
  }

  return `${range} anos`
}

const sanitizeRecommendationChildren = (profile: Profile | undefined): Child[] => {
  if (!profile?.children || profile.children.length === 0) {
    return []
  }

  const seen = new Set<string>()
  const children: Child[] = []

  for (const rawChild of profile.children) {
    if (!rawChild || typeof rawChild.id !== 'string') {
      continue
    }

    const id = rawChild.id.trim()
    if (!id || seen.has(id)) {
      continue
    }

    seen.add(id)

    const name = rawChild.name?.trim()
    const gender = rawChild.gender === 'm' || rawChild.gender === 'f' ? rawChild.gender : undefined
    const birthdateISO = rawChild.birthdateISO ? rawChild.birthdateISO.trim() : undefined
    const computedRange = resolveAgeRange({
      id,
      name,
      gender,
      ageRange: rawChild.ageRange ?? null,
      birthdateISO: birthdateISO ?? null,
    })

    children.push({
      id,
      name: name && name.length > 0 ? name : undefined,
      gender,
      ageRange: computedRange,
      birthdateISO,
    })
  }

  return children
}


const sanitizePlannerItem = (item: PlannerItem): PlannerItem => ({
  ...item,
  title: item.title.trim(),
  durationMin:
    item.durationMin !== undefined && item.durationMin !== null
      ? Math.max(0, Math.round(item.durationMin))
      : undefined,
  notes: item.notes?.trim() ?? undefined,
})

const normalizeAgeBand = (ageBand?: string | null) => {
  if (!ageBand) {
    return ''
  }

  if (AGE_BAND_OPTIONS.includes(ageBand as (typeof AGE_BAND_OPTIONS)[number])) {
    return ageBand as (typeof AGE_BAND_OPTIONS)[number]
  }

  const mapped = mapMonthsToAgeBand(Number(ageBand) || 0)
  if (mapped && AGE_BAND_OPTIONS.includes(mapped as (typeof AGE_BAND_OPTIONS)[number])) {
    return mapped as (typeof AGE_BAND_OPTIONS)[number]
  }

  return ''
}

export function FamilyPlanner({
  currentDateKey,
  weekStartKey,
  weekLabels,
  plannerTitle,
  profile,
  dateKey,
  recommendations: recommendationCatalog,
}: FamilyPlannerProps) {
  const todayKey = currentDateKey
  const derivedInitialAgeBand = useMemo(() => deriveInitialAgeBand(profile), [profile])

  const [weekStartKeyState, setWeekStartKeyState] = useState<string>(weekStartKey)
  const [weekDays, setWeekDays] = useState<WeekLabel[]>(weekLabels)
  const [selectedDayKey, setSelectedDayKey] = useState(() => currentDateKey)
  const [plannerData, setPlannerData] = useState<PlannerData>({})
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [draftType, setDraftType] = useState<(typeof TYPE_OPTIONS)[number]>('Brincadeira')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDuration, setDraftDuration] = useState('')
  const [draftAgeBand, setDraftAgeBand] = useState<(typeof AGE_BAND_OPTIONS)[number] | ''>('')
  const [draftNotes, setDraftNotes] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editType, setEditType] = useState<(typeof TYPE_OPTIONS)[number]>('Brincadeira')
  const [editTitle, setEditTitle] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editAgeBand, setEditAgeBand] = useState<(typeof AGE_BAND_OPTIONS)[number] | ''>('')
  const [editNotes, setEditNotes] = useState('')
  const [preferredAgeBand, setPreferredAgeBand] = useState<(typeof AGE_BAND_OPTIONS)[number]>(derivedInitialAgeBand)
  const [savedRecommendations, setSavedRecommendations] = useState<PlannerRecommendation[]>([])
  const [suggestedRecommendations, setSuggestedRecommendations] = useState<RecommendationSuggestion[]>([])
  const hasSyncedWeekStart = useRef(false)
  const hasLoadedStoredWeek = useRef(false)

  const loadWeek = useCallback(
    async (targetWeekStart: string, options: { preserveSelection?: boolean } = {}) => {
      try {
        const response = await fetch(
          `/api/planner/week-labels?weekStart=${encodeURIComponent(targetWeekStart)}`,
          {
            cache: 'no-store',
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to load week labels (${response.status})`)
        }

        const data = (await response.json()) as { weekStartKey: string; weekLabels: WeekLabel[] }

        setWeekDays(data.weekLabels)
        setWeekStartKeyState(data.weekStartKey)
        setSelectedDayKey((previous) => {
          if (options.preserveSelection && data.weekLabels.some((day) => day.key === previous)) {
            return previous
          }

          const todayEntry = data.weekLabels.find((day) => day.key === todayKey)
          if (todayEntry) {
            return todayEntry.key
          }

          return data.weekLabels[0]?.key ?? previous
        })
      } catch (error) {
        console.error('Falha ao carregar rótulos da semana:', error)
      }
    },
    [todayKey]
  )

  useEffect(() => {
    setWeekStartKeyState(weekStartKey)
    setWeekDays(weekLabels)
  }, [weekStartKey, weekLabels])

  useEffect(() => {
    setPreferredAgeBand((previous) => (previous === derivedInitialAgeBand ? previous : derivedInitialAgeBand))
  }, [derivedInitialAgeBand])

  useEffect(() => {
    if (weekDays.length === 0) {
      return
    }

    setSelectedDayKey((previous) => {
      if (weekDays.some((day) => day.key === previous)) {
        return previous
      }

      const todayEntry = weekDays.find((day) => day.key === todayKey)
      if (todayEntry) {
        return todayEntry.key
      }

      return weekDays[0].key
    })
  }, [weekDays, todayKey])

  useEffect(() => {
    if (hasLoadedStoredWeek.current) {
      return
    }

    const stored = plannerStorage.getStoredWeekStart?.()
    if (stored && stored !== weekStartKeyState) {
      hasLoadedStoredWeek.current = true
      void loadWeek(stored, { preserveSelection: true })
      return
    }

    hasLoadedStoredWeek.current = true
  }, [loadWeek, weekStartKeyState])

  const selectedDayItems = useMemo(() => plannerData[selectedDayKey] ?? [], [plannerData, selectedDayKey])

  useEffect(() => {
    let active = true

    const loadPlannerData = async () => {
      setIsLoading(true)
      try {
        const data = await plannerApi.getPlannerData(weekStartKeyState)
        if (!active) {
          return
        }

        setPlannerData(data)
        setIsInitialized(true)
      } catch (error) {
        console.error('Falha ao carregar planner:', error)
        if (active) {
          setPlannerData(plannerStorage.getPlannerData())
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadPlannerData()

    return () => {
      active = false
    }
  }, [weekStartKeyState])

  useEffect(() => {
    if (!isInitialized) {
      return
    }

    plannerStorage.savePlannerData(plannerData)
  }, [plannerData, isInitialized])

  useEffect(() => {
    if (hasSyncedWeekStart.current) {
      plannerStorage.saveWeekStart?.(weekStartKeyState)
    } else {
      hasSyncedWeekStart.current = true
    }
  }, [weekStartKeyState])

  useEffect(() => {
    const list = recommendationStorage.getForDate(selectedDayKey)
    setSavedRecommendations(list)

    const seed = `${selectedDayKey}:${preferredAgeBand}:${dateKey}`
    setSuggestedRecommendations(pickRecommendationsForDay(preferredAgeBand, seed, recommendationCatalog))
  }, [selectedDayKey, preferredAgeBand, recommendationCatalog, dateKey])

  useEffect(() => {
    const handleRecommendationsUpdate = (event: Event) => {
      const custom = event as CustomEvent<{ dateKey?: string }>
      const targetDate = custom.detail?.dateKey

      if (!targetDate || targetDate === selectedDayKey) {
        const list = recommendationStorage.getForDate(selectedDayKey)
        setSavedRecommendations(list)
      }
    }

    window.addEventListener(RECOMMENDATIONS_UPDATED_EVENT, handleRecommendationsUpdate)

    return () => {
      window.removeEventListener(RECOMMENDATIONS_UPDATED_EVENT, handleRecommendationsUpdate)
    }
  }, [selectedDayKey])

  useEffect(() => {
    const handlePlannerExternalAdd = (event: Event) => {
      const custom = event as CustomEvent<{ dateKey?: string; item?: PlannerItem }>
      const dateKey = custom.detail?.dateKey
      const item = custom.detail?.item

      if (!dateKey || !item) {
        return
      }

      updatePlannerForDay(dateKey, (items) => {
        const existingIds = new Set(items.map((entry) => entry.id))
        if (existingIds.has(item.id)) {
          return items
        }
        return [sanitizePlannerItem(item), ...items]
      })
    }

    window.addEventListener('planner:item-added', handlePlannerExternalAdd)

    return () => {
      window.removeEventListener('planner:item-added', handlePlannerExternalAdd)
    }
  }, [])

  const updatePlannerForDay = (dateKey: string, updater: (items: PlannerItem[]) => PlannerItem[]) => {
    setPlannerData((previous) => {
      const currentItems = previous[dateKey] ?? []
      const nextItems = updater(currentItems.map(sanitizePlannerItem))
      return {
        ...previous,
        [dateKey]: nextItems,
      }
    })
  }

  const handleSelectDay = (dateKey: string) => {
    setSelectedDayKey(dateKey)
  }

  const handleChangeWeek = (direction: 'prev' | 'next') => {
    const offset = direction === 'prev' ? -7 : 7
    const targetStart = addDaysToKey(weekStartKeyState, offset)
    void loadWeek(targetStart, { preserveSelection: direction === 'next' })
  }

  const resetDraft = (type: (typeof TYPE_OPTIONS)[number] = 'Brincadeira') => {
    setDraftType(type)
    setDraftTitle('')
    setDraftDuration('')
    setDraftAgeBand('')
    setDraftNotes('')
  }

  const handleStartAdd = (type?: (typeof TYPE_OPTIONS)[number], title?: string) => {
    setIsAdding(true)
    resetDraft(type ?? 'Brincadeira')
    if (title) {
      setDraftTitle(title)
    }
  }

  const handleCancelAdd = () => {
    setIsAdding(false)
    resetDraft()
  }

  const handleSaveItem = async () => {
    if (!draftTitle.trim()) {
      return
    }

    const newItem: PlannerItem = sanitizePlannerItem({
      id: createId(),
      type: draftType,
      title: draftTitle,
      done: false,
      durationMin: draftDuration ? Number(draftDuration) : undefined,
      ageBand: draftAgeBand || undefined,
      notes: draftNotes || undefined,
    })

    updatePlannerForDay(selectedDayKey, (items) => [newItem, ...items])
    setIsAdding(false)
    resetDraft()

    if (USE_API_PLANNER) {
      await plannerApi.savePlannerItem(selectedDayKey, newItem)
    }
  }

  const handleRemoveItem = async (id: string) => {
    updatePlannerForDay(selectedDayKey, (items) => items.filter((item) => item.id !== id))

    if (USE_API_PLANNER) {
      await plannerApi.deletePlannerItem(id)
    }
  }

  const handleToggleDone = async (id: string) => {
    updatePlannerForDay(selectedDayKey, (items) =>
      items.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )

    if (USE_API_PLANNER) {
      const updated = plannerData[selectedDayKey]?.find((item) => item.id === id)
      if (updated) {
        await plannerApi.savePlannerItem(selectedDayKey, { ...updated, done: !updated.done })
      }
    }
  }

  const startEditingItem = (item: PlannerItem) => {
    setEditingItemId(item.id)
    setEditType(item.type)
    setEditTitle(item.title)
    setEditDuration(item.durationMin !== undefined ? String(item.durationMin) : '')
    setEditAgeBand(normalizeAgeBand(item.ageBand))
    setEditNotes(item.notes ?? '')
  }

  const handleEditCancel = () => {
    setEditingItemId(null)
  }

  const handleEditSave = async () => {
    if (!editingItemId || !editTitle.trim()) {
      return
    }

    const nextItem = sanitizePlannerItem({
      id: editingItemId,
      type: editType,
      title: editTitle,
      done: plannerData[selectedDayKey]?.find((item) => item.id === editingItemId)?.done ?? false,
      durationMin: editDuration ? Number(editDuration) : undefined,
      ageBand: editAgeBand || undefined,
      notes: editNotes || undefined,
    })

    updatePlannerForDay(selectedDayKey, (items) =>
      items.map((item) => (item.id === editingItemId ? nextItem : item))
    )

    setEditingItemId(null)

    if (USE_API_PLANNER) {
      await plannerApi.savePlannerItem(selectedDayKey, nextItem)
    }
  }

  const handleQuickAdd = (type: (typeof TYPE_OPTIONS)[number], title?: string) => {
    handleStartAdd(type, title)
  }

  const handlePreferredAgeBandChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as (typeof AGE_BAND_OPTIONS)[number]
    if (AGE_BAND_OPTIONS.includes(value)) {
      setPreferredAgeBand(value)
    }
  }

  const inputClasses =
    'w-full rounded-2xl bg-white/90 text-sm text-support-1 placeholder-support-3 border border-white/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-4 py-3 transition duration-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/25 focus:outline-none'

  const recommendationItems = useMemo<Array<PlannerRecommendation | RecommendationSuggestion>>(
    () => [...savedRecommendations, ...suggestedRecommendations],
    [savedRecommendations, suggestedRecommendations]
  )

  const resolvedPlannerTitle = plannerTitle ?? 'Planejador da Família'

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/85 p-7 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-[2px] md:p-8">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/60" />
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-2">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              Equilíbrio
            </span>
            <div className="space-y-1.5">
              <h2 data-testid="planner-title" className="text-xl font-semibold tracking-tight text-support-1 md:text-2xl">
                {resolvedPlannerTitle}
              </h2>
              <p className="text-sm text-support-2 md:text-base">
                Planeje momentos especiais e acompanhe o que importa para a família.
              </p>
            </div>
          </div>
        </div>

      {weekDays.length > 0 ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleChangeWeek('prev')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/70 text-lg text-support-1 shadow-soft transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <div
            className="flex flex-1 items-stretch gap-3 overflow-x-auto pb-1"
            aria-label="Seletor de dias do planner"
            data-testid="planner-day-strip"
          >
            {weekDays.map((day) => {
              const isSelected = selectedDayKey === day.key
              const isToday = todayKey === day.key

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => handleSelectDay(day.key)}
                  className={`flex h-20 min-w-[88px] flex-1 items-center justify-center rounded-2xl border px-4 py-4 text-sm font-semibold transition-all duration-300 ease-gentle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 md:h-24 ${
                    isSelected
                      ? 'border-transparent bg-gradient-to-b from-primary to-primary/80 text-white shadow-soft ring-2 ring-primary/30 scale-[1.02]'
                      : 'border-white/60 bg-white/70 text-support-1 shadow-soft hover:bg-white/90 hover:shadow-elevated'
                  } ${isToday && !isSelected ? 'border-primary/40 text-primary' : ''}`}
                  aria-current={isSelected ? 'date' : undefined}
                >
                  <span className="text-[15px] font-semibold md:text-base">{day.chipLabel}</span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => handleChangeWeek('next')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/70 text-lg text-support-1 shadow-soft transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
            aria-label="Próxima semana"
          >
            ›
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/60 bg-white/40 p-5 text-sm text-support-2">
          Carregando semana...
        </div>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-sm text-support-2">Carregando planner...</div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          <div className="flex flex-wrap gap-3">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleQuickAdd(option)}
                className="rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary/90 transition hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
              >
                + {option}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-support-1">Agenda do dia</h3>
          </div>

          {selectedDayItems.length > 0 ? (
            <div className="space-y-3">
              {selectedDayItems.map((item) => {
                const isEditing = editingItemId === item.id

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col gap-3 rounded-2xl border border-white/50 bg-white/80 p-4 shadow-soft transition ${
                      item.done ? 'opacity-60' : ''
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label htmlFor={`planner-edit-type-${item.id}`} className="text-xs font-semibold uppercase tracking-[0.12em] text-support-2/80">
                              Tipo
                            </label>
                            <select
                              id={`planner-edit-type-${item.id}`}
                              value={editType}
                              onChange={(event) => setEditType(event.target.value as (typeof TYPE_OPTIONS)[number])}
                              className={`${inputClasses} appearance-none`}
                            >
                              {TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label htmlFor={`planner-edit-title-${item.id}`} className="text-xs font-semibold uppercase tracking-[0.12em] text-support-2/80">
                              Título
                            </label>
                            <input
                              id={`planner-edit-title-${item.id}`}
                              value={editTitle}
                              onChange={(event) => setEditTitle(event.target.value)}
                              className={inputClasses}
                            />
                          </div>
                          {typeSupportsDuration(editType) && (
                            <div className="space-y-1">
                              <label htmlFor={`planner-edit-duration-${item.id}`} className="text-xs font-semibold uppercase tracking-[0.12em] text-support-2/80">
                                Duração (min)
                              </label>
                              <input
                                id={`planner-edit-duration-${item.id}`}
                                type="number"
                                min={0}
                                value={editDuration}
                                onChange={(event) => setEditDuration(event.target.value)}
                                className={inputClasses}
                              />
                              <p className="text-[11px] text-support-2">Ex.: 10–15 minutos.</p>
                            </div>
                          )}
                          <div className="space-y-1">
                            <label htmlFor={`planner-edit-age-${item.id}`} className="text-xs font-semibold uppercase tracking-[0.12em] text-support-2/80">
                              Faixa etária
                            </label>
                            <select
                              id={`planner-edit-age-${item.id}`}
                              value={editAgeBand}
                              onChange={(event) => setEditAgeBand(event.target.value as (typeof AGE_BAND_OPTIONS)[number] | '')}
                              className={`${inputClasses} appearance-none`}
                            >
                              <option value="">Selecione</option>
                              {AGE_BAND_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label htmlFor={`planner-edit-notes-${item.id}`} className="text-xs font-semibold uppercase tracking-[0.12em] text-support-2/80">
                              Notas
                            </label>
                            <textarea
                              id={`planner-edit-notes-${item.id}`}
                              value={editNotes}
                              onChange={(event) => setEditNotes(event.target.value)}
                              className={`${inputClasses} min-h-[90px] resize-vertical`}
                            />
                            <p className="text-[11px] text-support-2">Use para lembrar materiais ou ajustes.</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-primary">
                          <button
                            type="button"
                            onClick={handleEditSave}
                            className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary transition hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={handleEditCancel}
                            className="rounded-full border border-white/60 px-3 py-1 text-support-2 transition hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                            {item.type}
                          </span>
                          <span className="text-sm font-semibold text-support-1">{item.title}</span>
                        </div>
                        {(item.durationMin !== undefined || item.ageBand) && (
                          <div className="flex flex-wrap gap-3 text-xs text-support-2">
                            {item.durationMin !== undefined && <span>Duração: {item.durationMin} min</span>}
                            {item.ageBand && <span>Faixa etária: {item.ageBand}</span>}
                          </div>
                        )}
                        {item.notes && <p className="text-sm text-support-2">{item.notes}</p>}
                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-primary">
                          <button
                            type="button"
                            onClick={() => handleToggleDone(item.id)}
                            className="rounded-full border border-primary/40 px-3 py-1 transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                          >
                            {item.done ? 'Concluído' : 'Concluir'}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditingItem(item)}
                            className="rounded-full border border-primary/40 px-3 py-1 transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="rounded-full border border-white/60 px-3 py-1 text-support-2 transition hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                          >
                            Remover
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-support-3/40 bg-white/60 px-4 py-6 text-center">
              <p className="text-sm text-support-2">Nada por aqui ainda. Que tal planejar algo rápido?</p>
            </div>
          )}

          {isAdding ? (
            <div className="space-y-3 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-soft">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="planner-type" className="text-xs font-semibold uppercase tracking-[0.12em] text-support-2/80">
                    Tipo
                  </label>
                  <select
                    id="planner-type"
                    value={draftType}
                    onChange={(event) => setDraftType(event.target.value as (typeof TYPE_OPTIONS)[number])}
                    className={`${inputClasses} appearance-none`}
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label htmlFor="planner-title" className="text-xs font-semibold uppercase tracking-[0.12em] text-support-2/80">
                    Título
                  </label>
                  <input
                    id="planner-title"
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    className={inputClasses}
                    placeholder="Ex.: Pintura com dedos"
                  />
                </div>
                {typeSupportsDuration(draftType) && (
                  <div className="space-y-1">
                    <label htmlFor="planner-duration" className="text-xs font-semibold uppercase tracking-[0.12em] text-support-2/80">
                      Duração (min)
                    </label>
                    <input
                      id="planner-duration"
                      type="number"
                      min={0}
                      value={draftDuration}
                      onChange={(event) => setDraftDuration(event.target.value)}
                      className={inputClasses}
                      placeholder="Ex.: 15"
                    />
                    <p className="text-[11px] text-support-2">Ex.: 10–15 minutos.</p>
                  </div>
                )}
                <div className="space-y-1">
                  <label htmlFor="planner-age" className="text-xs font-semibold uppercase tracking-[0.12em] text-support-2/80">
                    Faixa etária
                  </label>
                  <select
                    id="planner-age"
                    value={draftAgeBand}
                    onChange={(event) => {
                      const value = event.target.value as (typeof AGE_BAND_OPTIONS)[number] | ''
                      setDraftAgeBand(value === '' ? '' : value)
                    }}
                    className={`${inputClasses} appearance-none`}
                  >
                    <option value="">Selecione</option>
                    {AGE_BAND_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label htmlFor="planner-notes" className="text-xs font-semibold uppercase tracking-[0.12em] text-support-2/80">
                    Notas
                  </label>
                  <textarea
                    id="planner-notes"
                    value={draftNotes}
                    onChange={(event) => setDraftNotes(event.target.value)}
                    className={`${inputClasses} min-h-[90px] resize-vertical`}
                    placeholder="Use para lembrar materiais ou ajustes."
                  />
                  <p className="text-[11px] text-support-2">Use para lembrar materiais ou ajustes.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="primary" size="sm" onClick={handleSaveItem}>
                  Salvar
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleCancelAdd}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleStartAdd()}
              className="rounded-full bg-primary px-5 py-2.5 font-semibold text-white shadow-[0_6px_18px_rgba(233,46,129,0.25)] transition hover:shadow-[0_8px_22px_rgba(233,46,129,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
            >
              Adicionar item
            </button>
          )}

          {recommendationItems.length > 0 ? (
            <>
              <div className="h-px w-full bg-support-3/20" />
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-support-1">Recomendações para hoje</h3>
                  <select
                    value={preferredAgeBand}
                    onChange={handlePreferredAgeBandChange}
                    className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-support-1 shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                  >
                    {AGE_BAND_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        Faixa {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
                  {recommendationItems.map((suggestion, index) => {
                    const key = buildRecommendationKey(suggestion.title, suggestion.refId ?? null)
                    const savedKey = `${key}-${index}`
                    const isSaved = 'createdAt' in suggestion && typeof suggestion.createdAt === 'string'

                    return (
                      <div
                        key={savedKey}
                        className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-soft transition hover:shadow-md"
                      >
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                            {suggestion.type}
                          </span>
                          {isSaved && (
                            <span className="inline-flex items-center rounded-full bg-secondary/60 px-2 py-0.5 text-[11px] font-semibold text-primary">
                              Salva hoje
                            </span>
                          )}
                        </div>
                        <p className="mb-4 text-sm font-semibold text-support-1">{suggestion.title}</p>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full rounded-full"
                          onClick={() => handleQuickAdd(suggestion.type, suggestion.title)}
                        >
                          Salvar no Planner
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
      </div>
    </Card>
  )
}
