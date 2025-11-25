'use client'

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { useSavedInspirations } from '@/app/hooks/useSavedInspirations'
import {
  usePlannerSavedContents,
  type PlannerSavedContent,
} from '@/app/hooks/usePlannerSavedContents'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'
import SavedContentDrawer from '@/components/ui/SavedContentDrawer'
import Top3Section from './Top3Section'
import CareSection from './CareSection'
import AgendaSection from './AgendaSection'
import NotesSection from './NotesSection'
import SavedContentsSection from './SavedContentsSection'
import WeekView from './WeekView'
import { Reveal } from '@/components/ui/Reveal'

type Appointment = {
  id: string
  time: string
  title: string
  tag?: string
  notes?: string
}

type Top3Item = {
  id: string
  title: string
  done: boolean
}

type CareItem = {
  id: string
  title: string
  done: boolean
  source?: 'manual' | 'from_hub'
  origin?: string
}

type PlannerData = {
  appointments: Appointment[]
  top3: Top3Item[]
  careItems: CareItem[]
  familyItems: CareItem[]
  notes: string
}

const MOOD_OPTIONS = ['Feliz', 'Normal', 'Estressada'] as const
const DAY_STYLE_OPTIONS = ['Leve', 'Focado', 'Produtivo', 'Slow', 'Automático'] as const

const APPOINTMENT_TYPES = [
  'Consulta médica',
  'Trabalho',
  'Escola',
  'Vacina',
  'Mercado',
  'Família',
  'Outro',
] as const

export default function WeeklyPlannerShell() {
  const [selectedDateKey, setSelectedDateKey] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  // Contexto rápido do dia
  const [mood, setMood] = useState<string | null>(null)
  const [dayStyle, setDayStyle] = useState<string | null>(null)

  // Modal de compromisso via calendário
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] =
    useState(false)
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null)
  const [appointmentType, setAppointmentType] = useState<string>('')
  const [appointmentTime, setAppointmentTime] = useState<string>('')
  const [appointmentTitle, setAppointmentTitle] = useState<string>('')
  const [appointmentNotes, setAppointmentNotes] = useState<string>('')

  const [selectedSavedItem, setSelectedSavedItem] =
    useState<PlannerSavedContent | null>(null)
  const [isSavedItemOpen, setIsSavedItemOpen] = useState(false)

  const { savedItems: savedContents } = useSavedInspirations()
  const plannerHook = usePlannerSavedContents()

  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    top3: [],
    careItems: [],
    familyItems: [],
    notes: '',
  })

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // Dia atual (para destaque no calendário)
  const todayKey = useMemo(
    () => getBrazilDateKey(new Date()),
    [],
  )

  // --- Inicialização do dia atual ---
  useEffect(() => {
    const dateKey = getBrazilDateKey(new Date())
    setSelectedDateKey(dateKey)
    plannerHook.setDateKey(dateKey)
    setIsHydrated(true)
  }, [plannerHook])

  useEffect(() => {
    if (isHydrated && selectedDateKey) {
      plannerHook.setDateKey(selectedDateKey)
    }
  }, [selectedDateKey, isHydrated, plannerHook])

  // --- Carregar dados + contexto do dia ---
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    const loadedAppointments =
      load<Appointment[]>(`planner/appointments/${selectedDateKey}`, []) ??
      []
    const loadedTop3 =
      load<Top3Item[]>(`planner/top3/${selectedDateKey}`, []) ?? []
    const loadedCareItems =
      load<CareItem[]>(`planner/careItems/${selectedDateKey}`, []) ??
      []
    const loadedFamilyItems =
      load<CareItem[]>(`planner/familyItems/${selectedDateKey}`, []) ??
      []
    const loadedNotes =
      load<string>(`planner/notes/${selectedDateKey}`, '') ?? ''

    const loadedMood =
      load<string | null>(`planner/mood/${selectedDateKey}`, null) ?? null
    const loadedDayStyle =
      load<string | null>(`planner/dayStyle/${selectedDateKey}`, null) ??
      null

    setPlannerData({
      appointments: loadedAppointments,
      top3: loadedTop3,
      careItems: loadedCareItems,
      familyItems: loadedFamilyItems,
      notes: loadedNotes,
    })

    setMood(loadedMood)
    setDayStyle(loadedDayStyle)
  }, [selectedDateKey, isHydrated])

  // --- Persistência planner ---
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(
      `planner/appointments/${selectedDateKey}`,
      plannerData.appointments,
    )
  }, [plannerData.appointments, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/top3/${selectedDateKey}`, plannerData.top3)
  }, [plannerData.top3, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/careItems/${selectedDateKey}`, plannerData.careItems)
  }, [plannerData.careItems, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(
      `planner/familyItems/${selectedDateKey}`,
      plannerData.familyItems,
    )
  }, [plannerData.familyItems, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/notes/${selectedDateKey}`, plannerData.notes)
  }, [plannerData.notes, selectedDateKey, isHydrated])

  // --- Persistência contexto do dia ---
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/mood/${selectedDateKey}`, mood)
  }, [mood, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/dayStyle/${selectedDateKey}`, dayStyle)
  }, [dayStyle, selectedDateKey, isHydrated])

  // --- Handlers principais ---
  const handleAddAppointment = useCallback(
    (appointment: Omit<Appointment, 'id'>) => {
      const newAppointment: Appointment = {
        ...appointment,
        id: Math.random().toString(36).slice(2, 9),
      }
      setPlannerData((prev) => ({
        ...prev,
        appointments: [...prev.appointments, newAppointment],
      }))
    },
    [],
  )

  const handleToggleTop3 = useCallback((id: string) => {
    setPlannerData((prev) => ({
      ...prev,
      top3: prev.top3.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    }))
  }, [])

  const handleAddTop3 = useCallback((title: string) => {
    setPlannerData((prev) => {
      if (prev.top3.length < 3) {
        const newItem: Top3Item = {
          id: Math.random().toString(36).slice(2, 9),
          title,
          done: false,
        }
        return { ...prev, top3: [...prev.top3, newItem] }
      }
      return prev
    })
  }, [])

  const handleToggleCareItem = useCallback(
    (id: string, type: 'care' | 'family') => {
      setPlannerData((prev) => {
        const field = type === 'care' ? 'careItems' : 'familyItems'
        return {
          ...prev,
          [field]: prev[field].map((item) =>
            item.id === id ? { ...item, done: !item.done } : item,
          ),
        }
      })
    },
    [],
  )

  const handleAddCareItem = useCallback(
    (title: string, type: 'care' | 'family') => {
      setPlannerData((prev) => {
        const field = type === 'care' ? 'careItems' : 'familyItems'
        const newItem: CareItem = {
          id: Math.random().toString(36).slice(2, 9),
          title,
          done: false,
          source: 'manual',
        }
        return {
          ...prev,
          [field]: [...prev[field], newItem],
        }
      })
    },
    [],
  )

  const handleOpenSavedItem = useCallback(
    (item: PlannerSavedContent) => {
      setSelectedSavedItem(item)
      setIsSavedItemOpen(true)
    },
    [],
  )

  const handleCloseSavedItem = useCallback(() => {
    setIsSavedItemOpen(false)
    setSelectedSavedItem(null)
  }, [])

  const handleNotesChange = useCallback((content: string) => {
    setPlannerData((prev) => ({ ...prev, notes: content }))
  }, [])

  const handleMoodSelect = useCallback((value: string) => {
    setMood((prev) => (prev === value ? null : value))
  }, [])

  const handleDayStyleSelect = useCallback((value: string) => {
    setDayStyle((prev) => (prev === value ? null : value))
  }, [])

  const handleDateSelect = useCallback((date: Date) => {
    const newDateKey = getBrazilDateKey(date)
    setSelectedDateKey(newDateKey)
  }, [])

  const handleDayClickOpenModal = useCallback((date: Date) => {
    const newKey = getBrazilDateKey(date)
    setSelectedDateKey(newKey)
    setAppointmentDate(date)
    setAppointmentType('')
    setAppointmentTime('')
    setAppointmentTitle('')
    setAppointmentNotes('')
    setIsAppointmentModalOpen(true)
  }, [])

  const handleSaveAppointmentFromModal = useCallback(() => {
    if (!selectedDateKey) return

    const finalTitle =
      appointmentTitle ||
      appointmentType ||
      'Compromisso importante'

    handleAddAppointment({
      time: appointmentTime || '',
      title: finalTitle,
      tag: appointmentType || undefined,
      notes: appointmentNotes || '',
    })

    setIsAppointmentModalOpen(false)
    setAppointmentDate(null)
    setAppointmentType('')
    setAppointmentTime('')
    setAppointmentTitle('')
    setAppointmentNotes('')
  }, [
    selectedDateKey,
    appointmentTitle,
    appointmentTime,
    appointmentType,
    appointmentNotes,
    handleAddAppointment,
  ])

  const selectedDate = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return new Date()
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey, isHydrated])

  // --- Datas formatadas ---
  const monthYear = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return ''
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
  }, [selectedDateKey, isHydrated])

  const capitalizedDateFormatted = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return ''
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const selectedDateFormatted = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return (
      selectedDateFormatted.charAt(0).toUpperCase() +
      selectedDateFormatted.slice(1)
    )
  }, [selectedDateKey, isHydrated])

  // --- Grade de mês ---
  const monthCells = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return []

    const [year, month] = selectedDateKey.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const firstWeekday = (firstDay.getDay() + 6) % 7 // 0 = segunda

    const daysInMonth = new Date(year, month, 0).getDate()

    const cells: (Date | null)[] = []

    for (let i = 0; i < firstWeekday; i++) {
      cells.push(null)
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month - 1, d))
    }

    while (cells.length % 7 !== 0) {
      cells.push(null)
    }

    return cells
  }, [selectedDateKey, isHydrated])

  const getMonday = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const monday = getMonday(selectedDate)
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    const dayName = d.toLocaleDateString('pt-BR', { weekday: 'long' })
    const dayNumber = d.getDate()

    return {
      dayNumber,
      dayName:
        dayName.charAt(0).toUpperCase() + dayName.slice(1),
      agendaCount: Math.floor(Math.random() * 3),
      top3Count: Math.floor(Math.random() * 2),
      careCount: Math.floor(Math.random() * 2),
      familyCount: Math.floor(Math.random() * 2),
    }
  })

  if (!isHydrated) return null

  const hasContextForSuggestions = !!mood || !!dayStyle

  return (
    <Reveal delay={200}>
      <div className="space-y-6 md:space-y-8">
        {/* BLOCO 0 — HOJE POR AQUI (compacto, já existente) */}
        <SoftCard className="p-4 md:p-6 space-y-4 md:space-y-5">
          <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
            Hoje por aqui
          </span>

          <div className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
              Como está o seu dia?
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] font-poppins max-w-xl">
              Conte rapidinho como você está e que tipo de dia você quer ter. O planner cuida do resto lá embaixo.
            </p>
          </div>

          <div className="space-y-3 md:space-y-4">
            {/* Humor */}
            <div className="space-y-2">
              <p className="text-xs md:text-sm font-semibold text-[var(--color-text-main)] font-poppins">
                Como você está?
              </p>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((option) => {
                  const selected = mood === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleMoodSelect(option)}
                      className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold border transition-all ${
                        selected
                          ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_4px_12px_rgba(253,37,151,0.25)]'
                          : 'bg-white text-[var(--color-text-main)] border-[var(--color-border-muted)] hover:border-[var(--color-brand)]/70 hover:text-[var(--color-brand)]'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tipo de dia */}
            <div className="space-y-2">
              <p className="text-xs md:text-sm font-semibold text-[var(--color-text-main)] font-poppins">
                Hoje eu quero um dia…
              </p>
              <div className="flex flex-wrap gap-2">
                {DAY_STYLE_OPTIONS.map((option) => {
                  const selected = dayStyle === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleDayStyleSelect(option)}
                      className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold border transition-all ${
                        selected
                          ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_4px_12px_rgba(253,37,151,0.25)]'
                          : 'bg-white text-[var(--color-text-main)] border-[var(--color-border-muted)] hover:border-[var(--color-brand)]/70 hover:text-[var(--color-brand)]'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </SoftCard>

        {/* PLANNER — CALENDÁRIO MENSAL + TOGGLE */}
        <SoftCard className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppIcon
                name="calendar"
                className="w-5 h-5 text-[var(--color-brand)]"
              />
              <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-main)] capitalize">
                {monthYear}
              </h2>
            </div>
            <div className="flex gap-2 bg-[var(--color-soft-bg)] p-1 rounded-full">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  viewMode === 'day'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.1)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.1)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                }`}
              >
                Semana
              </button>
            </div>
          </div>

          {/* Cabeçalho dias da semana */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] md:text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mt-1">
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* Grade do mês */}
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {monthCells.map((date, idx) => {
              if (!date) {
                return <div key={idx} className="h-9 md:h-10" />
              }

              const cellKey = getBrazilDateKey(date)
              const isSelected = cellKey === selectedDateKey
              const isToday = cellKey === todayKey

              return (
                <button
                  key={cellKey}
                  type="button"
                  onClick={() => handleDayClickOpenModal(date)}
                  className={`h-9 md:h-10 rounded-full text-xs md:text-sm font-semibold flex items-center justify-center transition-all border ${
                    isSelected
                      ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_4px_12px_rgba(253,37,151,0.35)]'
                      : isToday
                      ? 'bg-white text-[var(--color-brand)] border-[var(--color-brand)]/50'
                      : 'bg-white text-[var(--color-text-main)] border-transparent hover:border-[var(--color-brand)]/40 hover:text-[var(--color-brand)]'
                  }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="space-y-1">
            <p className="text-sm text-[var(--color-text-muted)] text-center">
              Tudo aqui vale para:{' '}
              <span className="font-semibold">
                {capitalizedDateFormatted}
              </span>
            </p>
            <p className="text-xs text-[var(--color-text-muted)]/60 text-center">
              Toque em um dia para adicionar compromissos e organizar sua rotina.
            </p>
          </div>
        </SoftCard>

        {/* GRID DE CARDS DOS COMPROMISSOS DO DIA */}
        {plannerData.appointments.length > 0 && (
          <SoftCard className="p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                  Compromissos do dia
                </h2>
                <p className="text-xs md:text-sm text-[var(--color-text-muted)] font-poppins">
                  Tudo que você marcou no calendário para este dia aparece aqui em forma de cards.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {plannerData.appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="rounded-2xl bg-white border border-[var(--color-border-muted)] p-4 flex flex-col gap-2 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AppIcon
                        name="calendar"
                        className="w-5 h-5 text-[var(--color-brand)]"
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        {appt.tag || 'Compromisso'}
                      </span>
                    </div>
                    {appt.time && (
                      <span className="text-xs font-semibold text-[var(--color-text-main)]">
                        {appt.time}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-text-main)]">
                    {appt.title}
                  </p>
                  {appt.notes && (
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                      {appt.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SoftCard>
        )}

        {/* VISÃO MÊS (detalhes do dia) */}
        {viewMode === 'day' && (
          <div className="mt-6 md:mt-10 space-y-6 md:space-y-8 pb-12">
            {/* PAR 1 — Prioridades + Casa & rotina */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-stretch">
              <div className="flex h-full">
                <div className="space-y-3 w-full flex flex-col">
                  <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                    Você
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                      Prioridades do dia
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                      Escolha até três coisas que realmente importam hoje.
                    </p>
                  </div>
                  <Top3Section
                    items={plannerData.top3}
                    onToggle={handleToggleTop3}
                    onAdd={handleAddTop3}
                    hideTitle
                  />
                </div>
              </div>

              <div className="flex h-full">
                <div className="space-y-3 w-full flex flex-col">
                  <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                    Rotina
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                      Casa &amp; rotina
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                      Compromissos com horário, para enxergar seu dia com clareza.
                    </p>
                  </div>
                  <AgendaSection
                    items={plannerData.appointments}
                    onAddAppointment={handleAddAppointment}
                    hideTitle
                  />
                </div>
              </div>
            </section>

            {/* PAR 2 — Cuidar de mim + Cuidar do meu filho */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-stretch">
              <div className="flex h-full">
                <div className="space-y-3 w-full flex flex-col">
                  <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                    Você
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                      Cuidar de mim
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                      Pequenos gestos que cuidam da sua energia.
                    </p>
                  </div>
                  <CareSection
                    title="Cuidar de mim"
                    subtitle="Atividades de autocuidado."
                    icon="heart"
                    items={plannerData.careItems}
                    onToggle={(id) => handleToggleCareItem(id, 'care')}
                    onAdd={(title) => handleAddCareItem(title, 'care')}
                    placeholder="Novo gesto de autocuidado…"
                    hideTitle
                  />
                </div>
              </div>

              <div className="flex h-full">
                <div className="space-y-3 w-full flex flex-col">
                  <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                    Seu filho
                  </span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                      Cuidar do meu filho
                    </h2>
                    <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                      Um momento de conexão faz diferença no dia.
                    </p>
                  </div>
                  <CareSection
                    title="Cuidar da família"
                    subtitle="Tarefas com os filhos."
                    icon="smile"
                    items={plannerData.familyItems}
                    onToggle={(id) =>
                      handleToggleCareItem(id, 'family')
                    }
                    onAdd={(title) =>
                      handleAddCareItem(title, 'family')
                    }
                    placeholder="Novo momento com a família…"
                    hideTitle
                  />
                </div>
              </div>
            </section>

            {/* INSPIRAÇÕES */}
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                Inspirações
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                  Inspirações &amp; conteúdos salvos
                </h2>
                <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                  Receitas, ideias, brincadeiras e conteúdos que você salvou nos mini-hubs para acessar quando precisar.
                </p>
              </div>

              {plannerHook.items.length > 0 ||
              savedContents.length > 0 ? (
                <>
                  <SavedContentsSection
                    contents={savedContents}
                    plannerContents={plannerHook.items}
                    onItemClick={handleOpenSavedItem}
                    hideTitle
                  />
                  <SavedContentDrawer
                    open={isSavedItemOpen}
                    onClose={handleCloseSavedItem}
                    item={selectedSavedItem}
                  />
                </>
              ) : (
                <SoftCard className="p-5 md:p-6 text-center py-6">
                  <AppIcon
                    name="bookmark"
                    className="w-8 h-8 text-[var(--color-border-muted)] mx-auto mb-3"
                  />
                  <p className="text-sm text-[var(--color-text-muted)]/70 mb-3">
                    Quando você salvar receitas, brincadeiras ou conteúdos nos mini-hubs, eles aparecem aqui.
                  </p>
                  <a
                    href="/biblioteca-materna"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
                  >
                    Ver tudo na Biblioteca Materna
                    <AppIcon name="arrow-right" className="w-4 h-4" />
                  </a>
                </SoftCard>
              )}
            </div>

            {/* LEMBRETES */}
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                Lembretes
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                  Lembretes rápidos
                </h2>
                <p className="mt-1 mb-4 text-sm text-[var(--color-text-muted)] font-poppins">
                  Anotações soltas para não esquecer — como um post-it digital.
                </p>
              </div>
              <NotesSection
                content={plannerData.notes}
                onChange={handleNotesChange}
                hideTitle
              />
            </div>

            {/* SUGESTÕES INTELIGENTES (já pronto pra IA) */}
            <SoftCard className="p-5 md:p-6 space-y-4 mt-2">
              <span className="inline-flex items-center rounded-full bg-[var(--color-soft-strong)] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[var(--color-brand)] uppercase font-poppins">
                Sugestões inteligentes
              </span>
              <div className="space-y-2">
                <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] font-poppins">
                  Ideias rápidas para o seu momento
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] font-poppins max-w-2xl">
                  {hasContextForSuggestions
                    ? 'Com base em como você disse que está e no tipo de dia que escolheu, em breve vou te sugerir ideias rápidas para deixar sua rotina mais leve.'
                    : 'Comece contando como você está e que tipo de dia você quer ter. Assim eu consigo, em breve, sugerir algo que faça sentido pra você.'}
                </p>
              </div>

              <SoftCard className="p-4 md:p-5 bg-white/60 border-dashed border-[var(--color-soft-strong)]">
                <p className="text-xs md:text-sm text-[var(--color-text-muted)] font-poppins leading-relaxed">
                  {hasContextForSuggestions ? (
                    <>
                      Hoje você se sente{' '}
                      <strong>{mood ?? '—'}</strong> e quer um dia{' '}
                      <strong>{dayStyle ?? '—'}</strong>. Vamos usar isso
                      como ponto de partida para montar, com IA, sugestões
                      que respeitam o seu momento — sem cobrança e sem
                      perfeccionismo.
                    </>
                  ) : (
                    <>
                      Toque em uma opção de <strong>humor</strong> e um{' '}
                      <strong>tipo de dia</strong> lá em cima, em “Hoje por aqui”.
                      Esse será o primeiro passo para eu montar sugestões
                      inteligentes feitas só para você.
                    </>
                  )}
                </p>
              </SoftCard>
            </SoftCard>
          </div>
        )}

        {/* VISÃO SEMANA */}
        {viewMode === 'week' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-sm text-[var(--color-text-muted)]/70">
                Visão geral da sua semana. Toque em um dia para ver em detalhes.
              </p>
            </div>
            <WeekView weekData={weekData} />
          </div>
        )}

        {/* MODAL DE COMPROMISSO DO CALENDÁRIO */}
        {isAppointmentModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-5 md:p-6 space-y-4 shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
                    Novo compromisso
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                    Adicionar ao seu dia
                  </h2>
                  {appointmentDate && (
                    <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                      {appointmentDate.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] text-sm font-semibold"
                >
                  Fechar
                </button>
              </div>

              {/* Tipo de compromisso */}
              <div className="space-y-2">
                <p className="text-xs md:text-sm font-semibold text-[var(--color-text-main)]">
                  Tipo de compromisso
                </p>
                <div className="flex flex-wrap gap-2">
                  {APPOINTMENT_TYPES.map((type) => {
                    const selected = appointmentType === type
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setAppointmentType(
                            selected ? '' : type,
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold border transition-all ${
                          selected
                            ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                            : 'bg-white text-[var(--color-text-main)] border-[var(--color-border-muted)] hover:border-[var(--color-brand)]/60 hover:text-[var(--color-brand)]'
                        }`}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Horário + título */}
              <div className="grid grid-cols-[0.9fr_2fr] gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-semibold text-[var(--color-text-main)]">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) =>
                      setAppointmentTime(e.target.value)
                    }
                    className="w-full rounded-2xl border border-[var(--color-border-muted)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] bg-[var(--color-soft-bg)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-semibold text-[var(--color-text-main)]">
                    Nome do compromisso
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Pediatra do Arthur"
                    value={appointmentTitle}
                    onChange={(e) =>
                      setAppointmentTitle(e.target.value)
                    }
                    className="w-full rounded-2xl border border-[var(--color-border-muted)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] bg-[var(--color-soft-bg)]"
                  />
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-semibold text-[var(--color-text-main)]">
                  Anotações importantes
                </label>
                <textarea
                  rows={3}
                  placeholder="Endereço, documentos para levar, observações…"
                  value={appointmentNotes}
                  onChange={(e) =>
                    setAppointmentNotes(e.target.value)
                  }
                  className="w-full rounded-2xl border border-[var(--color-border-muted)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] bg-[var(--color-soft-bg)] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAppointmentFromModal}
                  className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[var(--color-brand)] hover:bg-[var(--color-brand-deep)] shadow-[0_8px_20px_rgba(253,37,151,0.35)] transition-all"
                >
                  Salvar compromisso
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  )
}
