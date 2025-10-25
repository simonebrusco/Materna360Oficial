'use client'


import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { mapMonthsToAgeBand } from '@/lib/dailyActivity'
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

const typeSupportsDuration = (type: (typeof TYPE_OPTIONS)[number]) => type === 'Brincadeira' || type === 'Receita'

const DEFAULT_AGE_BAND: (typeof AGE_BAND_OPTIONS)[number] = '1-2a'

type RecommendationSuggestion = {
  type: (typeof TYPE_OPTIONS)[number]
  title: string
  refId?: string | null
  durationMin?: number | null
  ageBand?: (typeof AGE_BAND_OPTIONS)[number] | null
  link?: string | null
  source?: PlannerRecommendationSource
  createdAt?: string
}

type WeekLabel = {
  key: string
  shortLabel: string
  longLabel: string
}

type FamilyPlannerProps = {
  currentDateKey: string
  weekStartKey: string
  weekLabels: WeekLabel[]
  plannerTitle?: string
}

const RECOMMENDATION_POOL: Record<(typeof AGE_BAND_OPTIONS)[number], RecommendationSuggestion[]> = {
  '0-6m': [
    { type: 'Recomendação', title: 'Momento de colo e canções de ninar' },
    { type: 'Brincadeira', title: 'Tempo de contato pele a pele' },
    { type: 'Livro', title: 'Ler um livrinho de contrastes' },
    { type: 'Brinquedo', title: 'Explorar um móbile colorido' },
    { type: 'Receita', title: 'Chá relaxante para a mamãe' },
  ],
  '7-12m': [
    { type: 'Brincadeira', title: 'Brincar de esconde-esconde com objetos' },
    { type: 'Brinquedo', title: 'Caixa sensorial com texturas' },
    { type: 'Recomendação', title: 'Cantar músicas com gestos' },
    { type: 'Receita', title: 'Papinha nutritiva colorida' },
    { type: 'Livro', title: 'História curta com rimas' },
  ],
  '1-2a': [
    { type: 'Brincadeira', title: 'Caça ao tesouro com objetos simples' },
    { type: 'Receita', title: 'Lanche de frutas com formatos divertidos' },
    { type: 'Livro', title: 'Livro ilustrado sobre animais' },
    { type: 'Brinquedo', title: 'Blocos de montar coloridos' },
    { type: 'Recomendação', title: 'Pequena dança em família' },
  ],
  '3-4a': [
    { type: 'Brincadeira', title: 'Teatro de fantoches improvisado' },
    { type: 'Receita', title: 'Mini sanduíches montados juntos' },
    { type: 'Livro', title: 'História sobre amizade e emoções' },
    { type: 'Brinquedo', title: 'Quebra-cabeça simples em família' },
    { type: 'Recomendação', title: 'Pausa para alongamento divertido' },
  ],
  '5-6a': [
    { type: 'Brincadeira', title: 'Jogo de memória feito à m��o' },
    { type: 'Receita', title: 'Smoothie energético com frutas' },
    { type: 'Livro', title: 'Leitura guiada de conto curtinho' },
    { type: 'Brinquedo', title: 'Construção criativa com LEGO' },
    { type: 'Recomendação', title: 'Momentinho de respiração guiada' },
  ],
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

const pickRecommendationsForDay = (
  ageBand: (typeof AGE_BAND_OPTIONS)[number],
  dayIndex: number
): RecommendationSuggestion[] => {
  const pool = RECOMMENDATION_POOL[ageBand] ?? RECOMMENDATION_POOL[DEFAULT_AGE_BAND]
  if (!pool || pool.length === 0) {
    return []
  }

  const firstIndex = Math.abs(dayIndex) % pool.length
  const secondIndex = (firstIndex + 1) % pool.length
  const thirdIndex = (firstIndex + 2) % pool.length

  return [pool[firstIndex], pool[secondIndex], pool[thirdIndex]].map((item) => ({
    ...item,
    source: 'suggested' as PlannerRecommendationSource,
  }))
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

export function FamilyPlanner({ currentDateKey, weekStartKey, weekLabels, plannerTitle }: FamilyPlannerProps) {
  const todayKey = currentDateKey

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
  const [preferredAgeBand, setPreferredAgeBand] = useState<(typeof AGE_BAND_OPTIONS)[number]>(DEFAULT_AGE_BAND)
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

    const dayIndex = weekDays.findIndex((day) => day.key === selectedDayKey)
    setSuggestedRecommendations(pickRecommendationsForDay(preferredAgeBand, dayIndex === -1 ? 0 : dayIndex))
  }, [selectedDayKey, preferredAgeBand, weekDays])

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
    'w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft transition-all duration-300 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30'

  const selectedDayLabel = useMemo(() => {
    const label = weekDays.find((day) => day.key === selectedDayKey)?.longLabel
    return label ?? ''
  }, [weekDays, selectedDayKey])

  const recommendations = useMemo(
    () => [...savedRecommendations, ...suggestedRecommendations],
    [savedRecommendations, suggestedRecommendations]
  )

  return (
    <Card className="space-y-6 p-7">
      <div className="space-y-3">
        <span className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
          Equilíbrio
        </span>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-support-1 md:text-xl">📋 Planejador da Família</h2>
            <p className="text-sm text-support-2 md:text-base">
              Planeje momentos especiais e acompanhe o que importa para a família.
            </p>
          </div>
          <p className="text-xs text-support-2/80 md:text-sm">{selectedDayLabel}</p>
        </div>
      </div>

      {weekDays.length > 0 ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleChangeWeek('prev')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-lg text-support-1 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <div className="flex flex-1 gap-2 overflow-x-auto">
            {weekDays.map((day) => {
              const isSelected = selectedDayKey === day.key
              const isToday = todayKey === day.key

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => handleSelectDay(day.key)}
                  className={`flex min-w-[72px] flex-1 flex-col items-center justify-center rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-300 ease-gentle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
                    isSelected
                      ? 'border-transparent bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] text-white shadow-glow'
                      : 'border-white/60 bg-white/80 text-support-1 shadow-soft hover:-translate-y-0.5 hover:shadow-elevated'
                  } ${isToday && !isSelected ? 'border-primary/60 text-primary' : ''}`}
                  aria-current={isSelected ? 'date' : undefined}
                >
                  <span>{day.shortLabel}</span>
                  <span className="text-[11px] text-support-2/80">
                    {day.longLabel.split(',')[0]}
                  </span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => handleChangeWeek('next')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-lg text-support-1 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
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
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((option) => (
              <Button key={option} type="button" variant="outline" size="sm" onClick={() => handleQuickAdd(option)}>
                + {option}
              </Button>
            ))}
          </div>

          <div>
            <h3 className="text-base font-semibold text-support-1">Agenda do dia</h3>
            <p className="text-xs text-support-2/90">
              {weekDays.find((day) => day.key === selectedDayKey)?.longLabel ?? ''}
            </p>
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
                              className={`${inputClasses} min-h-[90px]`}
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
            <Card className="border border-dashed border-primary/30 bg-white/70 p-5 text-center shadow-none">
              <p className="text-sm text-support-2">Nada por aqui ainda. Que tal planejar algo rápido?</p>
            </Card>
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
                    className={`${inputClasses} min-h-[90px]`}
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
            <Button type="button" variant="outline" size="sm" onClick={() => handleStartAdd()}>
              Adicionar item
            </Button>
          )}

          {recommendations.length > 0 ? (
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
              <div className="grid gap-3 sm:grid-cols-3">
                {recommendations.map((suggestion, index) => {
                  const key = buildRecommendationKey(suggestion.title, suggestion.refId ?? null)
                  const savedKey = `${key}-${index}`
                  const isSaved = 'createdAt' in suggestion && typeof suggestion.createdAt === 'string'

                  return (
                    <div key={savedKey} className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-soft">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                          {suggestion.type}
                        </span>
                        {isSaved && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            Salva hoje
                          </span>
                        )}
                      </div>
                      <p className="mb-3 text-sm font-semibold text-support-1">{suggestion.title}</p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => handleQuickAdd(suggestion.type, suggestion.title)}
                      >
                        Salvar no Planner
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  )
}
