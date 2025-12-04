'use client'

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react'

import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import {
  usePlannerSavedContents,
  type PlannerSavedContent,
} from '@/app/hooks/usePlannerSavedContents'

import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'
import WeekView from './WeekView'
import { Reveal } from '@/components/ui/Reveal'
import { IntelligentSuggestionsSection } from '@/components/blocks/IntelligentSuggestionsSection'
import SavedContentsSection from '@/components/blocks/SavedContentsSection'
import { track } from '@/app/lib/telemetry'
import { updateXP } from '@/app/lib/xp'

type Appointment = {
  id: string
  time: string
  title: string
  dateKey: string   // ← NOVO: garante data real sempre disponível
  tag?: string
}

type TaskOrigin = 'top3' | 'agenda' | 'selfcare' | 'family' | 'manual'

type TaskItem = {
  id: string
  title: string
  done: boolean
  origin: TaskOrigin
}

type PlannerData = {
  appointments: Appointment[]
  tasks: TaskItem[]
  notes: string
}

export default function WeeklyPlannerShell() {
  // ===========================
  // ESTADO PRINCIPAL
  // ===========================
  const [selectedDateKey, setSelectedDateKey] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    tasks: [],
    notes: '',
  })

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // Planner (sincronizar data com mini-hubs)
  const plannerHook = usePlannerSavedContents()

  // Estado local para IA (humor + intenção do dia)
  const [mood, setMood] = useState<string | null>(null)
  const [dayIntention, setDayIntention] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Modal de compromisso (calendário)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Modal de conteúdo salvo (kanban)
  const [selectedSavedContent, setSelectedSavedContent] =
    useState<PlannerSavedContent | null>(null)

  // Modal de ações rápidas (top3 / cuidar de mim / filho)
  const [quickAction, setQuickAction] = useState<
    'top3' | 'selfcare' | 'family' | null
  >(null)

  // ===========================
  // HYDRATION
  // ===========================
  useEffect(() => {
    const dateKey = getBrazilDateKey(new Date())
    setSelectedDateKey(dateKey)
    plannerHook.setDateKey(dateKey)
    setIsHydrated(true)

    // Telemetria: planner aberto
    try {
      track('planner.opened', {
        tab: 'meu-dia',
        dateKey,
      })
    } catch {}
  }, [plannerHook])

  useEffect(() => {
    if (isHydrated && selectedDateKey) {
      plannerHook.setDateKey(selectedDateKey)

      try {
        track('planner.date_changed', {
          tab: 'meu-dia',
          dateKey: selectedDateKey,
        })
      } catch {}
    }
  }, [selectedDateKey, isHydrated, plannerHook])

  // ===========================
  // LOAD DATA (localStorage)
  // ===========================
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    const loadedData: PlannerData = {
      appointments:
        load(`planner/appointments/${selectedDateKey}`, []) ?? [],
      tasks: load(`planner/tasks/${selectedDateKey}`, []) ?? [],
      notes: load(`planner/notes/${selectedDateKey}`, '') ?? '',
    }

    setPlannerData(loadedData)
  }, [selectedDateKey, isHydrated])

  // ===========================
  // SAVE DATA
  // ===========================
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(
      `planner/appointments/${selectedDateKey}`,
      plannerData.appointments,
    )
  }, [plannerData.appointments, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/tasks/${selectedDateKey}`, plannerData.tasks)
  }, [plannerData.tasks, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/notes/${selectedDateKey}`, plannerData.notes)
  }, [plannerData.notes, selectedDateKey, isHydrated])

  // ===========================
  // ACTIONS
  // ===========================
  const handleDateSelect = useCallback((date: Date) => {
    const dateKey = getBrazilDateKey(date)
    setSelectedDateKey(dateKey)

    try {
      track('planner.date_clicked', {
        tab: 'meu-dia',
        dateKey,
      })
    } catch {}
  }, [])

  const handleAddAppointment = useCallback(
    (appointment: Omit<Appointment, 'id'>) => {
      const newAppointment: Appointment = {
        ...appointment,
        id: Math.random().toString(36).slice(2, 9),
      }

      setPlannerData(prev => ({
        ...prev,
        appointments: [...prev.appointments, newAppointment],
      }))

      try {
        track('planner.appointment_added', {
          tab: 'meu-dia',
          time: appointment.time ?? null,
          dateKey: appointment.dateKey,
        })
      } catch {}

      try {
        void updateXP(6)
      } catch {}
    },
    [],
  )

  const openModalForDate = (date: Date) => {
    handleDateSelect(date)
    setModalDate(date)
    setIsModalOpen(true)

    try {
      track('planner.appointment_modal_opened', {
        tab: 'meu-dia',
        dateKey: getBrazilDateKey(date),
      })
    } catch {}
  }

  // Tarefas
  const addTask = (title: string, origin: TaskOrigin) => {
    const newTask: TaskItem = {
      id: Math.random().toString(36).slice(2, 9),
      title,
      done: false,
      origin,
    }

    setPlannerData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }))

    try {
      track('planner.task_added', { tab: 'meu-dia', origin })
    } catch {}

    try {
      const base = origin === 'top3' || origin === 'selfcare' ? 8 : 5
      void updateXP(base)
    } catch {}
  }

  const toggleTask = (id: string) => {
    setPlannerData(prev => {
      const task = prev.tasks.find(t => t.id === id)
      const willBeDone = task ? !task.done : false

      const updatedTasks = prev.tasks.map(t =>
        t.id === id ? { ...t, done: !t.done } : t,
      )

      if (task) {
        try {
          track('planner.task_toggled', {
            tab: 'meu-dia',
            id: task.id,
            origin: task.origin,
            done: willBeDone,
          })
        } catch {}

        if (willBeDone) {
          try {
            void updateXP(4)
          } catch {}
        }
      }

      return {
        ...prev,
        tasks: updatedTasks,
      }
    })
  }
  const handleViewModeChange = (mode: 'day' | 'week') => {
    setViewMode(mode)
    try {
      track('planner.view_mode_changed', {
        tab: 'meu-dia',
        mode,
      })
    } catch {}
  }

  const handleMoodSelect = (key: string) => {
    setMood(prev => {
      const next = prev === key ? null : key

      try {
        track('planner.mood.selected', {
          tab: 'meu-dia',
          mood: next,
        })
      } catch {}

      if (next) {
        try {
          void updateXP(3)
        } catch {}
      }

      return next
    })
  }

  const handleDayIntentionSelect = (value: string) => {
    setDayIntention(prev => {
      const next = prev === value ? null : value

      try {
        track('planner.day_intention.selected', {
          tab: 'meu-dia',
          intention: next,
        })
      } catch {}

      if (next) {
        try {
          void updateXP(3)
        } catch {}
      }

      return next
    })
  }

  const handleToggleSuggestions = () => {
    setShowSuggestions(prev => {
      const next = !prev

      try {
        track('planner.suggestions.toggle', {
          tab: 'meu-dia',
          enabled: next,
        })
      } catch {}

      if (next) {
        try {
          void updateXP(5)
        } catch {}
      }

      return next
    })
  }

  const handleOpenQuickAction = (mode: 'top3' | 'selfcare' | 'family') => {
    setQuickAction(mode)
    try {
      track('planner.quick_action.opened', {
        tab: 'meu-dia',
        mode,
      })
    } catch {}
  }

  // ===========================
  // FORMATAÇÕES
  // ===========================
  const selectedDate = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return new Date()
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey, isHydrated])

  const formattedSelectedDate = useMemo(
    () =>
      selectedDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
    [selectedDate],
  )

  // Agora, filtrar compromissos pelo dateKey real deles
  const todaysAppointments = useMemo(() => {
    if (!plannerData.appointments || plannerData.appointments.length === 0) {
      return []
    }

    const filtered = plannerData.appointments.filter(
      ap => ap.dateKey === selectedDateKey,
    )

    const clone = [...filtered]

    clone.sort((a, b) => {
      if (!a.time && !b.time) return 0
      if (!a.time) return 1
      if (!b.time) return -1

      const [ah, am] = a.time.split(':').map(Number)
      const [bh, bm] = b.time.split(':').map(Number)

      if (Number.isNaN(ah) || Number.isNaN(am)) return 1
      if (Number.isNaN(bh) || Number.isNaN(bm)) return -1

      if (ah !== bh) return ah - bh
      return am - bm
    })

    return clone
  }, [plannerData.appointments, selectedDateKey])

  if (!isHydrated) return null

  const moodLabel: Record<string, string> = {
    happy: 'Feliz',
    normal: 'Normal',
    stressed: 'Estressada',
  }

  const intentionLabel: Record<string, string> = {
    leve: 'leve',
    focado: 'focado',
    produtivo: 'produtivo',
    slow: 'slow',
    automático: 'automático',
  }

  const plannerTypeLabels: Record<string, string> = {
    recipe: 'RECEITA',
    checklist: 'CHECKLIST',
    insight: 'INSPIRAÇÃO',
    note: 'NOTA',
    task: 'TAREFA',
    goal: 'META',
    event: 'EVENTO',
  }

  const moodSummary =
    (mood ? moodLabel[mood] : null) &&
    (dayIntention ? intentionLabel[dayIntention] : null)
      ? `Hoje você está ${
          moodLabel[mood as keyof typeof moodLabel]
        } e escolheu um dia ${
          intentionLabel[dayIntention as keyof typeof intentionLabel]
        }. Que tal começar definindo suas prioridades?`
      : 'Conte pra gente como você está e que tipo de dia você quer ter. Vamos organizar tudo a partir disso.'

  const tasksByOrigin = (origin: TaskOrigin) =>
    plannerData.tasks.filter(task => task.origin === origin)

  // ===========================
  // RENDER
  // ===========================
  return (
    <>
      <Reveal delay={150}>
        <div className="space-y-6 md:space-y-8 mt-4 md:mt-6">

          {/* CALENDÁRIO PREMIUM */}
          <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_22px_55px_rgba(255,20,117,0.12)] p-4 md:p-6 space-y-4 md:space-y-6 bg-white/80 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
                  <AppIcon
                    name="calendar"
                    className="w-4 h-4 text-[var(--color-brand)]"
                  />
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)]/70 text-sm"
                    onClick={() => {
                      const d = new Date(selectedDate)
                      d.setMonth(d.getMonth() - 1)
                      handleDateSelect(d)
                    }}
                  >
                    ‹
                  </button>

                  <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] capitalize">
                    {selectedDate.toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h2>

                  <button
                    type="button"
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)]/70 text-sm"
                    onClick={() => {
                      const d = new Date(selectedDate)
                      d.setMonth(d.getMonth() + 1)
                      handleDateSelect(d)
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Dias/semana selector */}
              <div className="flex gap-2 bg-[var(--color-soft-bg)]/80 p-1 rounded-full self-start md:self-auto">
                <button
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    viewMode === 'day'
                      ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                  }`}
                  onClick={() => handleViewModeChange('day')}
                >
                  Dia
                </button>

                <button
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    viewMode === 'week'
                      ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                  }`}
                  onClick={() => handleViewModeChange('week')}
                >
                  Semana
                </button>
              </div>
            </div>

            {/* Cabeçalho dos dias da semana */}
            <div className="space-y-2 md:space-y-3">
              <div className="grid grid-cols-7 text-[10px] md:text-xs font-semibold text-[var(--color-text-muted)] text-center uppercase tracking-wide">
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
                <span>Dom</span>
              </div>

              {/* Grade do calendário */}
              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {generateMonthMatrix(selectedDate).map((day, i) =>
                  day ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => openModalForDate(day)}
                      className={`h-8 md:h-9 rounded-full text-xs md:text-sm flex items-center justify-center transition-all border ${
                        getBrazilDateKey(day) === selectedDateKey
                          ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_6px_18px_rgba(255,20,117,0.45)]'
                          : 'bg-white/80 text-[var(--color-text-main)] border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-strong)]/70'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  ) : (
                    <div key={i} className="h-8 md:h-9" />
                  ),
                )}
              </div>
            </div>
          </SoftCard>

          {/* VISÃO DIA */}
          {viewMode === 'day' && (
            <div className="mt-2 md:mt-4 space-y-8 md:space-y-10">
              {/* LEMBRETES + ATALHOS */}
              <section className="grid grid-cols-2 max-[380px]:grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 md:items-stretch">

                {/* LEMBRETES RÁPIDOS */}
                <div className="flex h-full">
                  <SoftCard className="flex-1 h-full rounded-3xl bg-white border border-[var(--color-soft-strong)]
                    shadow-[0_18px_40px_rgba(0,0,0,0.05)] p-4 md:p-5 flex flex-col">
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-1">
                      Lembretes rápidos
                    </h2>

                    <p className="text-sm text-[var(--color-text-muted)] mb-3">
                      Tudo que você salvar nos atalhos aparece aqui como lista do seu dia.
                    </p>

                    {/* LISTA DE TAREFAS */}
                    <div className="flex-1 min-h-[120px] max-h-48 overflow-y-auto pr-1 space-y-2">
                      {plannerData.tasks.length === 0 && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Ainda não há lembretes. Use os atalhos ou adicione abaixo.
                        </p>
                      )}

                      {plannerData.tasks.map(task => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-sm text-left transition-all ${
                            task.done
                              ? 'bg-[#FFE8F2] border-[#FFB3D3] line-through text-[var(--color-text-muted)]'
                              : 'bg-white border-[#F1E4EC] hover:border-[var(--color-brand)]/60'
                          }`}
                        >
                          <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                            task.done
                              ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                              : 'border-[#FFB3D3] text-[var(--color-brand)]'
                          }`}>
                            {task.done ? '✓' : ''}
                          </span>

                          <span>{task.title}</span>
                        </button>
                      ))}
                    </div>

                    {/* INPUT RÁPIDO */}
                    <QuickAddTaskInput onAdd={title => addTask(title, 'manual')} />
                  </SoftCard>
                </div>

                {/* ATALHOS DO DIA */}
                <div className="flex h-full">
                  <div className="flex-1 relative overflow-hidden rounded-3xl border border-[var(--color-soft-strong)]
                    bg-white/10 shadow-[0_22px_55px_rgba(255,20,117,0.12)] px-3 py-3 md:px-4 md:py-4 backdrop-blur-2xl">

                    {/* GLOWS */}
                    <div className="pointer-events-none absolute inset-0 opacity-80">
                      <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full
                        bg-[rgba(255,20,117,0.22)] blur-3xl" />
                      <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full
                        bg-[rgba(155,77,150,0.2)] blur-3xl" />
                    </div>

                    <div className="relative z-10 h-full flex flex-col">
                      <h2 className="text-lg md:text-xl font-semibold text-white">Comece pelo que faz mais sentido hoje</h2>
                      <p className="mt-1 text-sm text-white/85">
                        Use esses atalhos para criar lembretes rápidos.
                      </p>

                      <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-auto">

                        {/* TOP3 */}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickAction('top3')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80
                            border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] hover:-translate-y-[2px]
                            hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] transition-all">
                          <div className="flex flex-col items-center gap-1 text-center">
                            <AppIcon name="target" className="w-6 h-6 text-[#E6005F] group-hover:scale-110" />
                            <span className="text-[11px] font-medium text-[#CF285F] group-hover:text-[#E6005F]">
                              Prioridades do dia
                            </span>
                          </div>
                        </button>

                        {/* AGENDA */}
                        <button
                          type="button"
                          onClick={() => openModalForDate(selectedDate)}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80
                            border border-white/80 shadow transition-all hover:-translate-y-[2px]">
                          <div className="flex flex-col items-center gap-1">
                            <AppIcon name="calendar" className="w-6 h-6 text-[#E6005F] group-hover:scale-110" />
                            <span className="text-[11px] font-medium text-[#CF285F]">Agenda & compromissos</span>
                          </div>
                        </button>

                        {/* SELFCARE */}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickAction('selfcare')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border shadow transition-all">
                          <div className="flex flex-col items-center gap-1">
                            <AppIcon name="heart" className="w-6 h-6 text-[#E6005F]" />
                            <span className="text-[11px] font-medium">Cuidar de mim</span>
                          </div>
                        </button>

                        {/* FAMILY */}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickAction('family')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border shadow transition-all">
                          <div className="flex flex-col items-center gap-1">
                            <AppIcon name="smile" className="w-6 h-6 text-[#E6005F]" />
                            <span className="text-[11px] font-medium">Cuidar do meu filho</span>
                          </div>
                        </button>

                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ===================================== */}
              {/* COMPROMISSOS DO DIA (A2 COMPLETA)     */}
              {/* ===================================== */}

              <section>
                <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)]
                  shadow-[0_16px_38px_rgba(0,0,0,0.06)] p-4 md:p-5">

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase
                        text-[var(--color-brand)]">
                        Agenda
                      </p>

                      {/* SE HOJE → "Sua agenda de hoje"
                          SE OUTRO DIA → "Agenda de dd/mm/aaaa" */}
                      <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">
                        {selectedDateKey === getBrazilDateKey(new Date())
                          ? 'Sua agenda de hoje'
                          : `Agenda de ${formattedSelectedDate}`}
                      </h2>

                      <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                        Veja rapidamente tudo que você marcou.
                      </p>
                    </div>

                    {/* BOTÃO +NOVO */}
                    <button
                      type="button"
                      onClick={() => openModalForDate(selectedDate)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)]
                        text-white shadow-[0_10px_26px_rgba(255,20,117,0.35)] hover:bg-[var(--color-brand-deep)]
                        transition-all"
                      aria-label="Adicionar novo compromisso"
                    >
                      <span className="text-lg leading-none">+</span>
                    </button>
                  </div>

                  {/* LISTA DE COMPROMISSOS */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {todaysAppointments.length === 0 && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Você ainda não marcou compromissos para este dia.
                      </p>
                    )}

                    {todaysAppointments.map(ap => (
                      <div
                        key={ap.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#F1E4EC]
                        bg-white px-3 py-2 text-xs md:text-sm text-[var(--color-text-main)]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full
                            bg-[#FFE8F2] text-[11px] font-semibold text-[var(--color-brand)]">
                            {ap.time || '--:--'}
                          </span>

                          <div className="flex flex-col">
                            <span className="font-medium">{ap.title}</span>

                            {/* Mostra a data real do compromisso */}
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              {ap.time || 'Sem horário'} ·{' '}
                              {ap.dateKey
                                ? ap.dateKey.split('-').reverse().join('/')
                                : formattedSelectedDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SoftCard>
              </section>
            </div>
          )}

          {/* HOJE POR AQUI + SUGESTÕES */}
          <section className="space-y-4 md:space-y-5">
            <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)]
              shadow-[0_16px_40px_rgba(0,0,0,0.08)] p-4 md:p-6 space-y-4">

              <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.18em]
                text-[var(--color-brand)]">
                Hoje por aqui
              </p>

              <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                Como você está hoje?
              </h2>

              <div className="space-y-4">
                {/* HUMOR */}
                <div>
                  <p className="text-[11px] md:text-xs font-semibold uppercase text-[var(--color-text-main)]">
                    Como você está?
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { key: 'happy', label: 'Feliz' },
                      { key: 'normal', label: 'Normal' },
                      { key: 'stressed', label: 'Estressada' },
                    ].map(option => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleMoodSelect(option.key)}
                        className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold border ${
                          mood === option.key
                            ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                            : 'bg-white border-[#FFE8F2] text-[var(--color-text-main)]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* INTENÇÃO DO DIA */}
                <div>
                  <p className="text-[11px] md:text-xs font-semibold uppercase text-[var(--color-text-main)]">
                    Hoje eu quero um dia...
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {['leve', 'focado', 'produtivo', 'slow', 'automático'].map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleDayIntentionSelect(key)}
                        className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold border ${
                          dayIntention === key
                            ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                            : 'bg-white border-[#FFE8F2] text-[var(--color-text-main)]'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                {moodSummary}
              </p>

              <button
                type="button"
                onClick={handleToggleSuggestions}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold
                bg-[var(--color-brand)] text-white shadow hover:bg-[var(--color-brand-deep)] transition-all">
                {showSuggestions ? 'Esconder sugestões' : 'Ver sugestões'}
                <AppIcon name="lightbulb" className="w-4 h-4" />
              </button>
            </SoftCard>

            {showSuggestions && (
              <IntelligentSuggestionsSection mood={mood} intention={dayIntention} />
            )}
          </section>

          {/* KANBAN */}
          <SavedContentsSection
            contents={[]}
            plannerContents={plannerHook.items}
            onItemClick={item => {
              setSelectedSavedContent(item)
              track('planner.saved_content.opened', {
                tab: 'meu-dia', origin: item.origin, type: item.type,
              })
            }}
            onItemDone={({ id, source }) => {
              if (source === 'planner') {
                plannerHook.removeItem(id)
                updateXP(6)
              }
            }}
          />

          {/* VISÃO SEMANA */}
          {viewMode === 'week' && (
            <div className="mt-4 pb-10">
              <WeekView weekData={generateWeekData(selectedDate)} />
            </div>
          )}
        </div>
      </Reveal>

      {/* MODAL NOVO COMPROMISSO */}
     <ModalAppointmentForm
 onSubmit={data => {
  // Descobre para qual dia esse compromisso está sendo criado
  const appointmentDateKey = modalDate
    ? getBrazilDateKey(modalDate)
    : selectedDateKey
  const todayKey = getBrazilDateKey(new Date())

  // 1) Salva compromisso na agenda (sempre)
  handleAddAppointment({
    dateKey: appointmentDateKey, // <-- obrigatório agora
    time: data.time,
    title: data.title,
    tag: undefined,
  })

  // 2) Só cria lembrete rápido SE for compromisso de hoje
  if (appointmentDateKey === todayKey && data.title?.trim()) {
    const label = data.time
      ? `${data.time} · ${data.title.trim()}`
      : data.title.trim()
    addTask(label, 'agenda')
  }

  setIsModalOpen(false)
  try {
    track('planner.appointment_modal_saved', { tab: 'meu-dia' })
  } catch {}
}}

      {/* MODAL DETALHE CONTEÚDO */}
      {selectedSavedContent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[998]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

            <div className="flex justify-between items-center mb-3">
              <AppIcon name="target" className="w-6 h-6 text-[var(--color-brand)]" />

              <button
                onClick={() => setSelectedSavedContent(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
              >
                ✕
              </button>
            </div>

            <h3 className="text-base md:text-lg font-semibold mb-2">
              {selectedSavedContent.title}
            </h3>

           {/* DESCRIÇÃO DO CONTEÚDO SALVO */}
{(() => {
  const anyItem = selectedSavedContent as any;
  const payload = anyItem?.payload ?? {};

  const description =
    anyItem?.description ??
    payload.preview ??
    payload.description ??
    payload.text ??
    payload.excerpt ??
    '';

  return (
    <p className="text-sm text-[var(--color-text-muted)] mb-3 whitespace-pre-line">
      {description || 'Conteúdo salvo no planner.'}
    </p>
  );
})()}

            <button
              type="button"
              onClick={() => {
                plannerHook.removeItem(selectedSavedContent.id)
                setSelectedSavedContent(null)
                updateXP(6)
              }}
              className="px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)]"
            >
              Marcar como feito
            </button>
          </div>
        </div>
      )}

      {/* MODAL LISTA RÁPIDA */}
      {quickAction && (
        <QuickListModal
          mode={quickAction}
          items={
            quickAction === 'top3'
              ? tasksByOrigin('top3')
              : quickAction === 'selfcare'
              ? tasksByOrigin('selfcare')
              : tasksByOrigin('family')
          }
          onAdd={title => {
            addTask(title, quickAction)
          }}
          onToggle={toggleTask}
          onClose={() => setQuickAction(null)}
        />
      )}
    </>
  )
}

/* ======================================================
   UTIL: GERAÇÃO DO MÊS
   ====================================================== */

function generateMonthMatrix(currentDate: Date): (Date | null)[] {
  const y = currentDate.getFullYear()
  const m = currentDate.getMonth()

  const first = new Date(y, m, 1)
  const last = new Date(y, m + 1, 0)

  const offset = (first.getDay() + 6) % 7
  const matrix: (Date | null)[] = []

  for (let i = 0; i < offset; i++) matrix.push(null)
  for (let d = 1; d <= last.getDate(); d++) matrix.push(new Date(y, m, d))

  return matrix
}

function generateWeekData(base: Date) {
  const monday = new Date(base)
  const wd = monday.getDay()
  monday.setDate(base.getDate() - (wd === 0 ? 6 : wd - 1))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString('pt-BR', { weekday: 'long' }),
      agendaCount: 0,
      top3Count: 0,
      careCount: 0,
      familyCount: 0,
    }
  })
}

/* ======================================================
   FORM COMPROMISSO
   ====================================================== */

function ModalAppointmentForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { title: string; time: string }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        if (!title.trim()) return
        onSubmit({ title, time })
      }}
      className="space-y-4"
    >
      <div>
        <label className="text-sm font-medium">Título</label>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Ex: Consulta médica"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Horário</label>
        <input
          type="time"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-100">
          Cancelar
        </button>
        <button type="submit" className="px-4 py-2 rounded bg-[var(--color-brand)] text-white">
          Salvar
        </button>
      </div>
    </form>
  )
}

/* ======================================================
   INPUT RÁPIDO
   ====================================================== */

function QuickAddTaskInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('')

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        if (!value.trim()) return
        onAdd(value.trim())
        setValue('')
      }}
      className="mt-3 space-y-1"
    >
      <label className="text-[11px] font-medium">Adicionar lembrete rápido</label>

      <input
        className="w-full rounded-xl border px-3 py-2 text-sm"
        placeholder="Ex: Levar exame no pediatra..."
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </form>
  )
}

/* ======================================================
   MODAL LISTA RÁPIDA
   ====================================================== */

type QuickListModalProps = {
  mode: 'top3' | 'selfcare' | 'family'
  items: { id: string; title: string; done: boolean }[]
  onAdd: (title: string) => void
  onToggle: (id: string) => void
  onClose: () => void
}

function QuickListModal({ mode, items, onAdd, onToggle, onClose }: QuickListModalProps) {
  const [input, setInput] = useState('')

  const title =
    mode === 'top3'
      ? 'Prioridades do dia'
      : mode === 'selfcare'
      ? 'Cuidar de mim'
      : 'Cuidar do meu filho'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-[var(--color-brand)]">✕</button>
        </div>

        {/* LISTA */}
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {items.length === 0 && (
            <p className="text-sm text-gray-500">Ainda não há itens.</p>
          )}

          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                item.done
                  ? 'bg-[#FFE8F2] border-[#FFB3D3] line-through text-gray-500'
                  : 'bg-white border-gray-200 hover:border-[var(--color-brand)]'
              }`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                item.done
                  ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                  : 'border-[#FFB3D3] text-[var(--color-brand)]'
              }`}>
                {item.done ? '✓' : ''}
              </span>

              {item.title}
            </button>
          ))}
        </div>

        {/* INPUT */}
        <form
          onSubmit={e => {
            e.preventDefault()
            if (!input.trim()) return
            onAdd(input.trim())
            setInput('')
          }}
          className="space-y-3"
        >
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Adicionar novo item"
            value={input}
            onChange={e => setInput(e.target.value)}
          />

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100">
              Fechar
            </button>
            <button type="submit" className="px-4 py-2 rounded bg-[var(--color-brand)] text-white">
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
