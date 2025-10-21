'use client'

'use client'

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  plannerApi,
  plannerStorage,
  type PlannerData,
  type PlannerItem,
  USE_API_PLANNER,
} from '@/lib/plannerData'

const TYPE_OPTIONS = ['Brincadeira', 'Receita', 'Livro', 'Brinquedo', 'Recomendação'] as const
const AGE_BAND_OPTIONS = ['0-6m', '7-12m', '1-2a', '3-4a', '5-6a'] as const

const typeSupportsDuration = (type: (typeof TYPE_OPTIONS)[number]) => type === 'Brincadeira' || type === 'Receita'

const DEFAULT_AGE_BAND: (typeof AGE_BAND_OPTIONS)[number] = '1-2a'

type RecommendationSuggestion = {
  type: (typeof TYPE_OPTIONS)[number]
  title: string
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
    { type: 'Brincadeira', title: 'Jogo de memória feito à mão' },
    { type: 'Receita', title: 'Smoothie energético com frutas' },
    { type: 'Livro', title: 'Leitura guiada de conto curtinho' },
    { type: 'Brinquedo', title: 'Construção criativa com LEGO' },
    { type: 'Recomendação', title: 'Momentinho de respiração guiada' },
  ],
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateKey = (key: string): Date | null => {
  const [year, month, day] = key.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }

  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setFullYear(year, month - 1, day)
  return date
}

const getWeekStart = (date: Date) => {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const diff = (day + 6) % 7
  start.setDate(start.getDate() - diff)
  return start
}

const addDays = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

const formatDayLabel = (date: Date) => {
  const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
  const dayFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit' })
  const rawWeekday = weekdayFormatter.format(date).replace('.', '')
  const capitalized = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1, 3)
  return `${capitalized} ${dayFormatter.format(date)}`
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 10)
}

const mapMonthsToAgeBand = (months: number): (typeof AGE_BAND_OPTIONS)[number] => {
  if (months <= 6) {
    return '0-6m'
  }
  if (months <= 12) {
    return '7-12m'
  }
  if (months <= 24) {
    return '1-2a'
  }
  if (months <= 48) {
    return '3-4a'
  }
  return '5-6a'
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

  return [pool[firstIndex], pool[secondIndex], pool[thirdIndex]]
}

export function FamilyPlanner() {
  const today = useMemo(() => {
    const current = new Date()
    current.setHours(0, 0, 0, 0)
    return current
  }, [])

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [selectedDayKey, setSelectedDayKey] = useState(() => formatDateKey(new Date()))
  const [plannerData, setPlannerData] = useState<PlannerData>({})
  const [isInitialized, setIsInitialized] = useState(false)
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
  const hasSyncedWeekStart = useRef(false)

  const resetAddDraft = (type: (typeof TYPE_OPTIONS)[number] = 'Brincadeira') => {
    setDraftType(type)
    setDraftTitle('')
    setDraftDuration('')
    setDraftAgeBand('')
    setDraftNotes('')
  }

  const resetEditState = () => {
    setEditingItemId(null)
    setEditType('Brincadeira')
    setEditTitle('')
    setEditDuration('')
    setEditAgeBand('')
    setEditNotes('')
  }

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart])
  const todayKey = formatDateKey(today)
  const selectedDay = parseDateKey(selectedDayKey) ?? today
  const selectedDayItems = plannerData[selectedDayKey] ?? []
  const recommendations = useMemo(() => {
    const dayIndex = (selectedDay.getDay() + 6) % 7
    return pickRecommendationsForDay(preferredAgeBand, dayIndex)
  }, [preferredAgeBand, selectedDay])

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to load profile')
        }

        const data = await response.json()

        if (!active) {
          return
        }

        const children = Array.isArray(data?.filhos) ? data.filhos : []
        const firstChildWithAge = children.find((child: any) => Number.isFinite(Number(child?.idadeMeses)))
        if (firstChildWithAge) {
          const ageBand = mapMonthsToAgeBand(Number(firstChildWithAge.idadeMeses))
          setPreferredAgeBand(ageBand)
        }
      } catch (error) {
        console.error('Failed to determine age band from profile:', error)
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const initializePlanner = async () => {
      let initialWeekStart = getWeekStart(new Date())

      const storedWeekStartKey = plannerStorage.getStoredWeekStart()
      if (storedWeekStartKey) {
        const parsedDate = parseDateKey(storedWeekStartKey)
        if (parsedDate) {
          initialWeekStart = getWeekStart(parsedDate)
          if (active) {
            setWeekStart(initialWeekStart)
            if (!hasSyncedWeekStart.current) {
              setSelectedDayKey(formatDateKey(parsedDate))
              hasSyncedWeekStart.current = true
            }
          }
        }
      }

      try {
        const data = await plannerApi.getPlannerData(formatDateKey(initialWeekStart))
        if (active) {
          setPlannerData(data)
        }
      } catch (error) {
        console.error('Failed to initialize planner data:', error)
      } finally {
        if (active) {
          setIsInitialized(true)
        }
      }
    }

    void initializePlanner()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isInitialized || USE_API_PLANNER) {
      return
    }

    plannerStorage.savePlannerData(plannerData)
  }, [plannerData, isInitialized])

  useEffect(() => {
    if (!isInitialized || USE_API_PLANNER) {
      return
    }

    plannerStorage.saveWeekStart(formatDateKey(weekStart))
  }, [weekStart, isInitialized])

  useEffect(() => {
    if (!isInitialized || !USE_API_PLANNER) {
      return
    }

    let active = true

    const fetchWeek = async () => {
      try {
        const data = await plannerApi.getPlannerData(formatDateKey(weekStart))
        if (active) {
          setPlannerData(data)
        }
      } catch (error) {
        console.error('Failed to load planner data for week:', error)
      }
    }

    void fetchWeek()

    return () => {
      active = false
    }
  }, [weekStart, isInitialized])

  useEffect(() => {
    const isDayWithinWeek = weekDays.some((day) => formatDateKey(day) === selectedDayKey)
    if (!isDayWithinWeek) {
      setSelectedDayKey(formatDateKey(weekDays[0]))
    }
  }, [weekDays, selectedDayKey])

  const handleSelectDay = (dayKey: string) => {
    setSelectedDayKey(dayKey)
    resetEditState()
  }

  const handleChangeWeek = (direction: 'prev' | 'next') => {
    resetEditState()
    setWeekStart((current) => addDays(current, direction === 'prev' ? -7 : 7))
  }

  const handleStartAdd = (type?: (typeof TYPE_OPTIONS)[number]) => {
    resetEditState()
    resetAddDraft(type ?? 'Brincadeira')
    setIsAdding(true)
  }

  const handleQuickAdd = (type: (typeof TYPE_OPTIONS)[number], title?: string) => {
    resetEditState()
    resetAddDraft(type)
    if (title) {
      setDraftTitle(title)
    }
    setIsAdding(true)
  }

  const handleCancelAdd = () => {
    setIsAdding(false)
    resetAddDraft(draftType)
  }

  const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as (typeof TYPE_OPTIONS)[number]
    if (TYPE_OPTIONS.includes(value)) {
      setDraftType(value)
      if (!typeSupportsDuration(value)) {
        setDraftDuration('')
      }
    }
  }

  const handleSaveItem = () => {
    const trimmedTitle = draftTitle.trim()
    if (!trimmedTitle) {
      return
    }

    let durationValue: number | undefined
    if (typeSupportsDuration(draftType) && draftDuration.trim()) {
      const numeric = Number(draftDuration)
      if (Number.isFinite(numeric)) {
        durationValue = Math.max(0, Math.round(numeric))
      }
    }

    const trimmedNotes = draftNotes.trim()

    const newItem: PlannerItem = {
      id: createId(),
      type: draftType,
      title: trimmedTitle,
      done: false,
      durationMin: durationValue,
      ageBand: draftAgeBand || undefined,
      notes: trimmedNotes ? trimmedNotes : undefined,
    }

    setPlannerData((previous) => {
      const currentItems = previous[selectedDayKey] ?? []
      return {
        ...previous,
        [selectedDayKey]: [...currentItems, newItem],
      }
    })

    if (USE_API_PLANNER) {
      void plannerApi.savePlannerItem(selectedDayKey, newItem)
    }

    setIsAdding(false)
    resetAddDraft(draftType)
  }

  const handleToggleDone = (itemId: string) => {
    let nextItem: PlannerItem | null = null

    setPlannerData((previous) => {
      const currentItems = previous[selectedDayKey]
      if (!currentItems) {
        return previous
      }

      const updatedItems = currentItems.map((item) => {
        if (item.id !== itemId) {
          return item
        }
        const toggled = { ...item, done: !item.done }
        nextItem = toggled
        return toggled
      })

      return {
        ...previous,
        [selectedDayKey]: updatedItems,
      }
    })

    if (USE_API_PLANNER && nextItem) {
      void plannerApi.savePlannerItem(selectedDayKey, nextItem)
    }
  }

  const handleRemoveItem = (itemId: string) => {
    if (editingItemId === itemId) {
      resetEditState()
    }

    setPlannerData((previous) => {
      const currentItems = previous[selectedDayKey]
      if (!currentItems) {
        return previous
      }

      const nextItems = currentItems.filter((item) => item.id !== itemId)
      const nextState = { ...previous }

      if (nextItems.length === 0) {
        delete nextState[selectedDayKey]
      } else {
        nextState[selectedDayKey] = nextItems
      }

      return nextState
    })

    if (USE_API_PLANNER) {
      void plannerApi.deletePlannerItem(itemId)
    }
  }

  const startEditingItem = (item: PlannerItem) => {
    setIsAdding(false)
    setEditingItemId(item.id)
    setEditType(item.type)
    setEditTitle(item.title)
    setEditDuration(
      item.durationMin !== undefined && item.durationMin !== null ? String(item.durationMin) : ''
    )
    setEditAgeBand(item.ageBand ?? '')
    setEditNotes(item.notes ?? '')
  }

  const handleEditTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as (typeof TYPE_OPTIONS)[number]
    if (TYPE_OPTIONS.includes(value)) {
      setEditType(value)
      if (!typeSupportsDuration(value)) {
        setEditDuration('')
      }
    }
  }

  const handleEditSave = () => {
    if (!editingItemId) {
      return
    }

    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle) {
      return
    }

    let durationValue: number | undefined
    if (typeSupportsDuration(editType) && editDuration.trim()) {
      const numeric = Number(editDuration)
      if (Number.isFinite(numeric)) {
        durationValue = Math.max(0, Math.round(numeric))
      }
    }

    const trimmedNotes = editNotes.trim()
    const itemId = editingItemId

    let updatedItem: PlannerItem | null = null

    setPlannerData((previous) => {
      const currentItems = previous[selectedDayKey]
      if (!currentItems) {
        return previous
      }

      const mapped = currentItems.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        const nextItem: PlannerItem = {
          ...item,
          type: editType,
          title: trimmedTitle,
          durationMin: durationValue,
          ageBand: editAgeBand || undefined,
          notes: trimmedNotes ? trimmedNotes : undefined,
        }

        updatedItem = nextItem
        return nextItem
      })

      return {
        ...previous,
        [selectedDayKey]: mapped,
      }
    })

    if (USE_API_PLANNER && updatedItem) {
      void plannerApi.savePlannerItem(selectedDayKey, updatedItem)
    }

    resetEditState()
  }

  const handleEditCancel = () => {
    resetEditState()
  }

  const inputClasses =
    'w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft transition-all duration-300 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <Card className="p-7">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">🗓️ Planner</h2>
        <span className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
          Equilíbrio
        </span>
      </div>

      <div className="mb-6 flex items-center gap-3">
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
            const dayKey = formatDateKey(day)
            const isSelected = selectedDayKey === dayKey
            const isToday = todayKey === dayKey

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => handleSelectDay(dayKey)}
                className={`flex min-w-[72px] flex-1 flex-col items-center justify-center rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-300 ease-gentle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
                  isSelected
                    ? 'border-transparent bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] text-white shadow-glow'
                    : 'border-white/60 bg-white/80 text-support-1 shadow-soft hover:-translate-y-0.5 hover:shadow-elevated'
                } ${isToday && !isSelected ? 'border-primary/60 text-primary' : ''}`}
              >
                <span>{formatDayLabel(day)}</span>
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
            {new Intl.DateTimeFormat('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            }).format(selectedDay)}
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
                            onChange={handleEditTypeChange}
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
                            onChange={(event) => {
                              const value = event.target.value as (typeof AGE_BAND_OPTIONS)[number] | ''
                              setEditAgeBand(value === '' ? '' : value)
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
                    </>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-primary">
                    <button
                      type="button"
                      onClick={() => handleToggleDone(item.id)}
                      className="rounded-full border border-primary/40 px-3 py-1 transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                    >
                      {item.done ? 'Concluído' : 'Concluir'}
                    </button>
                    {isEditing ? (
                      <>
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
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingItem(item)}
                        className="rounded-full border border-primary/40 px-3 py-1 transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="rounded-full border border-white/60 px-3 py-1 text-support-2 transition hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                    >
                      Remover
                    </button>
                  </div>
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
                  onChange={handleTypeChange}
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

        {recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-support-1">Recomendações para hoje</h3>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">
                Faixa {preferredAgeBand}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {recommendations.map((suggestion, index) => (
                <div
                  key={`${preferredAgeBand}-${index}-${suggestion.title}`}
                  className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-soft"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                      {suggestion.type}
                    </span>
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
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
