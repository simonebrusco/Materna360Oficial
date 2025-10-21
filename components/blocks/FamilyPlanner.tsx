'use client'

'use client'

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const STORAGE_KEY = 'planner_v1'
const WEEK_STORAGE_KEY = 'planner_last_week_start'

const TYPE_OPTIONS = ['Brincadeira', 'Receita', 'Livro', 'Brinquedo', 'Recomendação'] as const
const AGE_BAND_OPTIONS = ['0-6m', '7-12m', '1-2a', '3-4a', '5-6a'] as const

const typeSupportsDuration = (type: (typeof TYPE_OPTIONS)[number]) => type === 'Brincadeira' || type === 'Receita'

type PlannerItem = {
  id: string
  type: (typeof TYPE_OPTIONS)[number]
  title: string
  done: boolean
  durationMin?: number
  ageBand?: (typeof AGE_BAND_OPTIONS)[number]
  notes?: string
}

type PlannerData = Record<string, PlannerItem[]>

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storedPlanner = window.localStorage.getItem(STORAGE_KEY)
      if (storedPlanner) {
        const parsed = JSON.parse(storedPlanner) as PlannerData
        setPlannerData(parsed)
      }
    } catch (error) {
      console.error('Failed to load planner data:', error)
    }

    try {
      const storedWeekStart = window.localStorage.getItem(WEEK_STORAGE_KEY)
      if (storedWeekStart) {
        const parsedDate = parseDateKey(storedWeekStart)
        if (parsedDate) {
          setWeekStart(getWeekStart(parsedDate))
          if (!hasSyncedWeekStart.current) {
            setSelectedDayKey(formatDateKey(parsedDate))
            hasSyncedWeekStart.current = true
          }
        }
      }
    } catch (error) {
      console.error('Failed to load planner week:', error)
    }

    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plannerData))
    } catch (error) {
      console.error('Failed to persist planner data:', error)
    }
  }, [plannerData, isInitialized])

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(WEEK_STORAGE_KEY, formatDateKey(weekStart))
    } catch (error) {
      console.error('Failed to persist planner week:', error)
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
    resetAddDraft(type ?? 'Brincadeira')
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

    setIsAdding(false)
    resetAddDraft(draftType)
  }

  const handleToggleDone = (itemId: string) => {
    setPlannerData((previous) => {
      const currentItems = previous[selectedDayKey]
      if (!currentItems) {
        return previous
      }

      return {
        ...previous,
        [selectedDayKey]: currentItems.map((item) =>
          item.id === itemId ? { ...item, done: !item.done } : item
        ),
      }
    })
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
        return nextState
      }

      nextState[selectedDayKey] = nextItems
      return nextState
    })
  }

  const startEditingItem = (item: PlannerItem) => {
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
    if (editDuration.trim()) {
      const numeric = Number(editDuration)
      if (Number.isFinite(numeric)) {
        durationValue = Math.max(0, Math.round(numeric))
      }
    }

    const trimmedNotes = editNotes.trim()
    const itemId = editingItemId

    setPlannerData((previous) => {
      const currentItems = previous[selectedDayKey]
      if (!currentItems) {
        return previous
      }

      return {
        ...previous,
        [selectedDayKey]: currentItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                type: editType,
                title: trimmedTitle,
                durationMin: durationValue,
                ageBand: editAgeBand || undefined,
                notes: trimmedNotes ? trimmedNotes : undefined,
              }
            : item
        ),
      }
    })

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
            {selectedDayItems.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col gap-3 rounded-2xl border border-white/50 bg-white/80 p-4 shadow-soft transition ${
                  item.done ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                    {item.type}
                  </span>
                  <span className="text-sm font-semibold text-support-1">{item.title}</span>
                </div>
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
                    onClick={() => handleRemoveItem(item.id)}
                    className="rounded-full border border-white/60 px-3 py-1 text-support-2 transition hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
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
      </div>
    </Card>
  )
}
