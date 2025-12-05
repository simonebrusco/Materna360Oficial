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

/* ------------------------------
   TIPOS PRINCIPAIS
--------------------------------*/
type Appointment = {
  id: string
  dateKey: string
  time: string
  title: string
  tag?: string
}

type TaskOrigin = 'top3' | 'agenda' | 'selfcare' | 'family' | 'manual'

type TaskItem = {
  id: string
  title: string
  done: boolean
  origin: TaskOrigin
  dateKey: string          // ✅ Tarefa pertence ao dia específico
}

type PlannerData = {
  appointments: Appointment[]
  tasks: TaskItem[]
  notes: string
}

/* ------------------------------
   COMPONENTE PRINCIPAL
--------------------------------*/
export default function WeeklyPlannerShell() {
  /* ===========================
     ESTADOS PRINCIPAIS
     =========================== */
  const [selectedDateKey, setSelectedDateKey] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    tasks: [],
    notes: '',
  })

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // Planner (sincronização com mini-hubs)
  const plannerHook = usePlannerSavedContents()

  // Estado do Como Estou Hoje
  const [mood, setMood] = useState<string | null>(null)
  const [dayIntention, setDayIntention] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Modais
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null)

  const [selectedSavedContent, setSelectedSavedContent] =
    useState<PlannerSavedContent | null>(null)

  const [quickAction, setQuickAction] = useState<
    'top3' | 'selfcare' | 'family' | null
  >(null)

  /* ===========================
     HYDRATION
     =========================== */
  useEffect(() => {
    const todayKey = getBrazilDateKey(new Date())

    setSelectedDateKey(todayKey)
    plannerHook.setDateKey(todayKey)
    setIsHydrated(true)

    try {
      track('planner.opened', {
        tab: 'meu-dia',
        dateKey: todayKey,
      })
    } catch {}
  }, [plannerHook])

  // Quando selectedDateKey muda → mini-hubs recebem info
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    plannerHook.setDateKey(selectedDateKey)

    try {
      track('planner.date_changed', {
        tab: 'meu-dia',
        dateKey: selectedDateKey,
      })
    } catch {}
  }, [selectedDateKey, isHydrated, plannerHook])

  /* ===========================
     LOAD DATA (localStorage)
     =========================== */
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    const loadedAppointments: Appointment[] =
      load('planner/appointments/all', []) ?? []

    const loadedTasks: TaskItem[] =
      load(`planner/tasks/${selectedDateKey}`, []) ?? []

    const loadedNotes: string =
      load(`planner/notes/${selectedDateKey}`, '') ?? ''

    setPlannerData({
      appointments: loadedAppointments,
      tasks: loadedTasks.filter(t => t.dateKey === selectedDateKey), // ✔ só tarefas do dia
      notes: loadedNotes,
    })
  }, [selectedDateKey, isHydrated])

  /* ===========================
     SAVE DATA
     =========================== */
  // Salvar compromissos (global)
  useEffect(() => {
    if (!isHydrated) return
    save('planner/appointments/all', plannerData.appointments)
  }, [plannerData.appointments, isHydrated])

  // Salvar tarefas (por dia)
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    save(
      `planner/tasks/${selectedDateKey}`,
      plannerData.tasks.filter(t => t.dateKey === selectedDateKey),
    )
  }, [plannerData.tasks, selectedDateKey, isHydrated])

  // Salvar notas (por dia)
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/notes/${selectedDateKey}`, plannerData.notes)
  }, [plannerData.notes, selectedDateKey, isHydrated])

/* ===========================
   ACTIONS
   =========================== */

// Selecionar data no calendário
const handleDateSelect = useCallback((date: Date) => {
  const newKey = getBrazilDateKey(date)
  setSelectedDateKey(newKey)

  try {
    track('planner.date_clicked', {
      tab: 'meu-dia',
      dateKey: newKey,
    })
  } catch {}
}, [])

/* ----------------------------------------
   ADICIONAR COMPROMISSO (SEM VIRAR TAREFA)
----------------------------------------*/
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
        dateKey: appointment.dateKey,
        time: appointment.time ?? null,
      })
    } catch {}

    try {
      void updateXP(6)
    } catch {}
  },
  [],
)

/* ----------------------------------------
   EDITAR COMPROMISSO
----------------------------------------*/
const handleUpdateAppointment = useCallback(
  (updated: Appointment) => {
    setPlannerData(prev => ({
      ...prev,
      appointments: prev.appointments.map(a =>
        a.id === updated.id ? updated : a,
      ),
    }))

    try {
      track('planner.appointment_updated', {
        tab: 'meu-dia',
        id: updated.id,
        dateKey: updated.dateKey,
      })
    } catch {}
  },
  [],
)

/* ----------------------------------------
   EXCLUIR COMPROMISSO
----------------------------------------*/
const handleDeleteAppointment = useCallback((id: string) => {
  setPlannerData(prev => ({
    ...prev,
    appointments: prev.appointments.filter(a => a.id !== id),
  }))

  try {
    track('planner.appointment_deleted', {
      tab: 'meu-dia',
      id,
    })
  } catch {}
}, [])

/* ----------------------------------------
   ABRIR MODAL DE CRIAÇÃO (DATA)
----------------------------------------*/
const openModalForDate = (day: Date) => {
  const key = getBrazilDateKey(day)
  setSelectedDateKey(key)
  setModalDate(day)
  setIsModalOpen(true)

  try {
    track('planner.appointment_modal_opened', {
      tab: 'meu-dia',
      dateKey: key,
    })
  } catch {}
}

/* ----------------------------------------
   ABRIR MODAL DE EDIÇÃO
----------------------------------------*/
const openEditModalForAppointment = (appointment: Appointment) => {
  setEditingAppointment(appointment)

  try {
    track('planner.appointment_edit_opened', {
      tab: 'meu-dia',
      id: appointment.id,
    })
  } catch {}
}

/* ===========================
   TAREFAS — AGORA COM DATEKEY
   =========================== */

const addTask = (title: string, origin: TaskOrigin) => {
  const newTask: TaskItem = {
    id: Math.random().toString(36).slice(2, 9),
    title,
    done: false,
    origin,
    dateKey: selectedDateKey, // ✔ tarefa pertence ao dia certo
  }

  setPlannerData(prev => ({
    ...prev,
    tasks: [...prev.tasks, newTask],
  }))

  try {
    track('planner.task_added', {
      tab: 'meu-dia',
      origin,
      dateKey: selectedDateKey,
    })
  } catch {}

  try {
    const base = origin === 'top3' || origin === 'selfcare' ? 8 : 5
    void updateXP(base)
  } catch {}
}

const toggleTask = (id: string) => {
  setPlannerData(prev => {
    const updatedTasks = prev.tasks.map(t =>
      t.id === id ? { ...t, done: !t.done } : t,
    )

    const toggled = prev.tasks.find(t => t.id === id)

    if (toggled) {
      try {
        track('planner.task_toggled', {
          tab: 'meu-dia',
          id,
          origin: toggled.origin,
          done: !toggled.done,
        })
      } catch {}

      if (!toggled.done) {
        try {
          void updateXP(4)
        } catch {}
      }
    }

    return { ...prev, tasks: updatedTasks }
  })
}

/* ===========================
   MUDAR VISÃO DIA/SEMANA
   =========================== */
const handleViewModeChange = (mode: 'day' | 'week') => {
  setViewMode(mode)

  try {
    track('planner.view_mode_changed', {
      tab: 'meu-dia',
      mode,
    })
  } catch {}
}

/* ===========================
   HUMOR / INTENÇÃO
   =========================== */
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

/* ===========================
   SUGESTÕES INTELIGENTES
   =========================== */
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

/* ===========================
   AÇÕES RÁPIDAS
   =========================== */
const handleOpenQuickAction = (
  mode: 'top3' | 'selfcare' | 'family',
) => {
  setQuickAction(mode)

  try {
    track('planner.quick_action.opened', {
      tab: 'meu-dia',
      mode,
    })
  } catch {}
}

/* ===========================
   FORMATAÇÕES / MEMO
   =========================== */

const selectedDate = useMemo(() => {
  if (!isHydrated || !selectedDateKey) return new Date()
  const [y, m, d] = selectedDateKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}, [selectedDateKey, isHydrated])

const formattedSelectedDate = useMemo(
  () =>
    selectedDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
  [selectedDate],
)

/* ----------------------------------------
   COMPROMISSOS DO DIA
----------------------------------------*/
const todaysAppointments = useMemo(() => {
  return plannerData.appointments
    .filter(app => app.dateKey === selectedDateKey)
    .sort((a, b) => {
      if (!a.time && !b.time) return 0
      if (!a.time) return 1
      if (!b.time) return -1

      const [ah, am] = a.time.split(':').map(Number)
      const [bh, bm] = b.time.split(':').map(Number)
      return ah !== bh ? ah - bh : am - bm
    })
}, [plannerData.appointments, selectedDateKey])

/* ----------------------------------------
   TAREFAS DO DIA
----------------------------------------*/
const tasksForSelectedDay = useMemo(
  () => plannerData.tasks.filter(t => t.dateKey === selectedDateKey),
  [plannerData.tasks, selectedDateKey],
)

/* ===========================
   RENDER
   =========================== */

if (!isHydrated) return null

return (
  <>
    <Reveal delay={150}>
      <div className="space-y-6 md:space-y-8 mt-4 md:mt-6">

        {/* ----------------------------------------
            CALENDÁRIO PREMIUM
        ----------------------------------------*/}
        <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_22px_55px_rgba(255,20,117,0.12)] p-4 md:p-6 space-y-4 md:space-y-6 bg-white/80 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
                <AppIcon name="calendar" className="w-4 h-4 text-[var(--color-brand)]" />
              </span>

              {/* NAV MÊS */}
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

            {/* BOTÕES DIA/SEMANA */}
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

          {/* Cabeçalho dias da semana */}
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

            {/* GRID DO MÊS */}
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
                )
              )}
            </div>
          </div>
        </SoftCard>

        {/* ----------------------------------------
            VISÃO DIA
        ----------------------------------------*/}
        {viewMode === 'day' && (
          <div className="mt-2 md:mt-4 space-y-8 md:space-y-10">

            {/* ----------------------------------------
                LEMBRETES RÁPIDOS + ATALHOS
            ----------------------------------------*/}
            <section className="grid grid-cols-2 max-[380px]:grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 md:items-stretch">

              {/* LEMBRETES RÁPIDOS */}
              <div className="flex h-full">
                <SoftCard className="flex-1 h-full rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_18px_40px_rgba(0,0,0,0.05)] p-4 md:p-5 flex flex-col">
                  <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-1">
                    Lembretes rápidos
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)] mb-3">
                    Tudo que você salvar nos atalhos aparece aqui como uma lista simples do seu dia.
                  </p>

                  {/* LISTA DE TAREFAS DO DIA */}
                  <div className="flex-1 min-h-[120px] max-h-48 overflow-y-auto pr-1 space-y-2">
                    {tasksForSelectedDay.length === 0 && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Ainda não há lembretes para este dia. Use os atalhos ao lado para adicionar.
                      </p>
                    )}

                    {tasksForSelectedDay.map(task => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-sm text-left transition-all ${
                          task.done
                            ? 'bg-[#FFE8F2] border-[#FFB3D3] text-[var(--color-text-muted)] line-through'
                            : 'bg-white border-[#F1E4EC] hover:border-[var(--color-brand)]/60'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                            task.done
                              ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                              : 'border-[#FFB3D3] text-[var(--color-brand)]'
                          }`}
                        >
                          {task.done ? '✓' : ''}
                        </span>
                        <span>{task.title}</span>
                      </button>
                    ))}
                  </div>

                  {/* INPUT rápida para lembrete */}
                  <QuickAddTaskInput
                    onAdd={title => addTask(title, 'manual')}
                  />
                </SoftCard>
              </div>

              {/* ----------------------------------------
                  ATALHOS DO DIA
              ----------------------------------------*/}
              <div className="flex h-full">
                <div className="flex-1 relative overflow-hidden rounded-3xl border border-[var(--color-soft-strong)] bg-white/10 shadow-[0_22px_55px_rgba(255,20,117,0.12)] px-3 py-3 md:px-4 md:py-4 backdrop-blur-2xl">
                  {/* GLOWS */}
                  <div className="pointer-events-none absolute inset-0 opacity-80">
                    <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                    <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.2)] blur-3xl" />
                  </div>

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="mb-3">
                      <h2 className="text-lg md:text-xl font-semibold text-white">
                        Comece pelo que faz mais sentido hoje
                      </h2>
                      <p className="mt-1 text-sm text-white/85">
                        Use esses atalhos para criar lembretes rápidos.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-auto">

                      {/* Prioridades do dia */}
                      <button
                        type="button"
                        onClick={() => handleOpenQuickAction('top3')}
                        className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)]"
                      >
                        <div className="flex flex-col items-center gap-1 text-center px-1">
                          <AppIcon name="target" className="w-5 h-5 md:w-6 md:h-6 text-[#E6005F]" />
                          <span className="text-[10px] md:text-[11px] font-medium leading-tight text-[#CF285F]">
                            Prioridades
                          </span>
                        </div>
                      </button>

                      {/* Agenda & compromissos */}
                      <button
                        type="button"
                        onClick={() => openModalForDate(selectedDate)}
                        className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)]"
                      >
                        <div className="flex flex-col items-center gap-1 text-center px-1">
                          <AppIcon name="calendar" className="w-5 h-5 md:w-6 md:h-6 text-[#E6005F]" />
                          <span className="text-[10px] md:text-[11px] font-medium text-[#CF285F]">
                            Compromissos
                          </span>
                        </div>
                      </button>

                      {/* Cuidar de mim */}
                      <button
                        type="button"
                        onClick={() => handleOpenQuickAction('selfcare')}
                        className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)]"
                      >
                        <div className="flex flex-col items-center gap-1 text-center px-1">
                          <AppIcon name="heart" className="w-5 h-5 md:w-6 md:h-6 text-[#E6005F]" />
                          <span className="text-[10px] md:text-[11px] font-medium text-[#CF285F]">
                            Cuidar de mim
                          </span>
                        </div>
                      </button>

                      {/* Cuidar do filho */}
                      <button
                        type="button"
                        onClick={() => handleOpenQuickAction('family')}
                        className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)]"
                      >
                        <div className="flex flex-col items-center gap-1 text-center px-1">
                          <AppIcon name="smile" className="w-5 h-5 md:w-6 md:h-6 text-[#E6005F]" />
                          <span className="text-[10px] md:text-[11px] font-medium text-[#CF285F]">
                            Meu filho
                          </span>
                        </div>
                      </button>

                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ----------------------------------------
                COMPROMISSOS DO DIA / AGENDA
            ----------------------------------------*/}
            <section>
              <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_16px_38px_rgba(0,0,0,0.06)] p-4 md:p-5">

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                      Agenda
                    </p>

                    <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">
                      Compromissos do dia
                    </h2>

                    <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                      Veja o que você marcou para{' '}
                      <span className="font-semibold text-[var(--color-text-main)]">
                        {formattedSelectedDate}
                      </span>
                      .
                    </p>
                  </div>

                  {/* Botão + */}
                  <button
                    type="button"
                    onClick={() => openModalForDate(selectedDate)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(255,20,117,0.35)] hover:bg-[var(--color-brand-deep)] transition-all"
                  >
                    +
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {todaysAppointments.length === 0 && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Você ainda não marcou compromissos para este dia.
                    </p>
                  )}

                  {todaysAppointments.map(app => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => openEditModalForAppointment(app)}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#F1E4EC] bg-white px-3 py-2 text-xs md:text-sm text-[var(--color-text-main)] text-left hover:border-[var(--color-brand)]/60 hover:bg-[#FFF3F8]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FFE8F2] text-[11px] font-semibold text-[var(--color-brand)]">
                          {app.time || '--:--'}
                        </span>

                        <div className="flex flex-col">
                          <span className="font-medium">
                            {app.title}
                          </span>

                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            {app.time || 'Sem horário definido'} ·{' '}
                            {selectedDate.toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </SoftCard>
            </section>
          </div>
        )}

        {/* ----------------------------------------
            HOJE POR AQUI + SUGESTÕES
        ----------------------------------------*/}
        <section className="space-y-4 md:space-y-5">
          <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] shadow-[0_16px_40px_rgba(0,0,0,0.08)] p-4 md:p-6 space-y-4">

            {/* TÍTULO */}
            <div className="space-y-1.5">
              <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                Hoje por aqui
              </p>

              <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                Como você está hoje?
              </h2>

              <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                Escolha como você se sente agora e o estilo de dia que deseja.
              </p>
            </div>

            {/* SELETORES DE HUMOR E INTENÇÃO */}
            <div className="space-y-3 md:space-y-4">

              {/* HUMOR */}
              <div className="space-y-1.5">
                <p className="text-[11px] md:text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wide">
                  Como você está?
                </p>

                <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
                  Escolha como se sente agora.
                </p>

                <div className="flex flex-wrap gap-2 mt-1">
                  {[
                    { key: 'happy', label: 'Feliz' },
                    { key: 'normal', label: 'Normal' },
                    { key: 'stressed', label: 'Estressada' },
                  ].map(option => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleMoodSelect(option.key)}
                      className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all border ${
                        mood === option.key
                          ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_6px_18px_rgba(255,20,117,0.4)]'
                          : 'bg-white border-[#FFE8F2] text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* INTENÇÃO DO DIA */}
              <div className="space-y-1.5">
                <p className="text-[11px] md:text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wide">
                  Hoje eu quero um dia...
                </p>

                <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
                  Escolha o estilo do seu dia.
                </p>

                <div className="flex flex-wrap gap-2 mt-1">
                  {['leve', 'focado', 'produtivo', 'slow', 'automático'].map(
                    option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleDayIntentionSelect(option)}
                        className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all border ${
                          dayIntention === option
                            ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_6px_18px_rgba(255,20,117,0.4)]'
                            : 'bg-white border-[#FFE8F2] text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* FRASE FINAL */}
            <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-2">
              {mood && dayIntention
                ? `Hoje você está ${{
                    happy: 'feliz',
                    normal: 'normal',
                    stressed: 'estressada',
                  }[mood]} e deseja um dia ${
                    {
                      leve: 'leve',
                      focado: 'focado',
                      produtivo: 'produtivo',
                      slow: 'slow',
                      automático: 'automático',
                    }[dayIntention]
                  }.`
                : 'Conte para nós como você está e como deseja que seja seu dia.'}
            </p>

            {/* BOTÃO SUGESTÕES */}
            <div className="mt-3">
              <button
                type="button"
                onClick={handleToggleSuggestions}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold bg-[var(--color-brand)] text-white shadow-[0_6px_18px_rgba(255,20,117,0.35)] hover:bg-[var(--color-brand-deep)] transition-all"
              >
                {showSuggestions
                  ? 'Esconder sugestões'
                  : 'Ver sugestões'}
                <AppIcon name="lightbulb" className="w-4 h-4" />
              </button>
            </div>
          </SoftCard>

          {/* SUGESTÕES EXPANDIDAS */}
          {showSuggestions && (
            <IntelligentSuggestionsSection
              mood={mood}
              intention={dayIntention}
            />
          )}
        </section>

        {/* ----------------------------------------
            KANBAN DE CONTEÚDOS SALVOS
        ----------------------------------------*/}
        <section>
          <SavedContentsSection
            contents={[]}
            plannerContents={plannerHook.items}
            onItemClick={item => {
              setSelectedSavedContent(item)

              try {
                track('planner.saved_content.opened', {
                  tab: 'meu-dia',
                  origin: item.origin,
                  type: item.type,
                })
              } catch {}
            }}
            onItemDone={({ id, source }) => {
              if (source === 'planner') {
                plannerHook.removeItem(id)
                try {
                  track('planner.saved_content.completed', {
                    tab: 'meu-dia',
                    source,
                  })
                } catch {}

                try {
                  void updateXP(6)
                } catch {}
              }
            }}
          />
        </section>

        {/* ----------------------------------------
            VISÃO SEMANA
        ----------------------------------------*/}
        {viewMode === 'week' && (
          <div className="mt-4 pb-10">
            <WeekView weekData={generateWeekData(selectedDate)} />
          </div>
        )}
      </div>
    </Reveal>
    {/* ----------------------------------------
        MODAL: NOVO COMPROMISSO
    ----------------------------------------*/}
    {isModalOpen && modalDate && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">

          {/* Cabeçalho */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[var(--color-text-main)]">
              Novo compromisso – {modalDate.toLocaleDateString('pt-BR')}
            </h3>

            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                try {
                  track('planner.appointment_modal_closed', { tab: 'meu-dia' })
                } catch {}
              }}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
            >
              ✕
            </button>
          </div>

          {/* Formulário */}
          <ModalAppointmentForm
            mode="create"
            initialDateKey={getBrazilDateKey(modalDate)}
            onSubmit={data => {
              const appointmentDateKey = data.dateKey
              const todayKey = getBrazilDateKey(new Date())

              // 1) Salvar compromisso na agenda
              handleAddAppointment({
                dateKey: appointmentDateKey,
                time: data.time,
                title: data.title,
              })

              // 2) SOMENTE SE FOR HOJE → vira lembrete
              if (appointmentDateKey === todayKey && data.title.trim()) {
                const label = data.time
                  ? `${data.time} · ${data.title.trim()}`
                  : data.title.trim()

                addTask(label, 'agenda', todayKey)
              }

              setIsModalOpen(false)

              try {
                track('planner.appointment_modal_saved', { tab: 'meu-dia' })
              } catch {}
            }}
            onCancel={() => {
              setIsModalOpen(false)
              try {
                track('planner.appointment_modal_cancelled', { tab: 'meu-dia' })
              } catch {}
            }}
          />
        </div>
      </div>
    )}

    {/* ----------------------------------------
        MODAL: EDITAR COMPROMISSO
    ----------------------------------------*/}
    {editingAppointment && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">

          {/* Cabeçalho */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[var(--color-text-main)]">
              Editar compromisso
            </h3>

            <button
              type="button"
              onClick={() => setEditingAppointment(null)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <ModalAppointmentForm
            mode="edit"
            initialDateKey={editingAppointment.dateKey}
            initialTitle={editingAppointment.title}
            initialTime={editingAppointment.time}
            onSubmit={data => {
              const updated: Appointment = {
                ...editingAppointment,
                dateKey: data.dateKey,
                time: data.time,
                title: data.title,
              }

              handleUpdateAppointment(updated)

              setSelectedDateKey(updated.dateKey)
              setEditingAppointment(null)
            }}
            onCancel={() => setEditingAppointment(null)}
            onDelete={() => {
              const confirmed = window.confirm(
                'Tem certeza que deseja excluir este compromisso?',
              )
              if (!confirmed) return

              handleDeleteAppointment(editingAppointment.id)
              setEditingAppointment(null)
            }}
          />
        </div>
      </div>
    )}

    {/* ----------------------------------------
        MODAL: DETALHE DE CONTEÚDO SALVO (KANBAN)
    ----------------------------------------*/}
    {selectedSavedContent && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[998]">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
                <AppIcon name="target" className="w-4 h-4 text-[var(--color-brand)]" />
              </span>

              <span className="inline-flex items-center rounded-full border border-[var(--color-soft-strong)] bg-[#FFE8F2]/60 px-2 py-0.5 text-[10px] font-medium text-[#C2285F]">
                {plannerTypeLabels[selectedSavedContent.type] || 'CONTEÚDO'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSavedContent(null)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
            >
              ✕
            </button>
          </div>

          {/* Título */}
          <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] mb-2">
            {selectedSavedContent.title}
          </h3>

          {/* Descrição */}
          <p className="text-sm text-[var(--color-text-muted)] mb-3 whitespace-pre-line">
            {selectedSavedContent.description ||
              selectedSavedContent.payload?.preview ||
              selectedSavedContent.payload?.text ||
              'Conteúdo salvo no planner.'}
          </p>

          <p className="text-[11px] text-[var(--color-text-muted)]/80 mb-4">
            Salvo em: {selectedSavedContent.origin.replace('-', ' ')}
          </p>

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedSavedContent(null)}
              className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={() => {
                plannerHook.removeItem(selectedSavedContent.id)
                setSelectedSavedContent(null)

                try {
                  track('planner.saved_content.completed', { tab: 'meu-dia' })
                } catch {}

                try {
                  void updateXP(6)
                } catch {}
              }}
              className="px-4 py-2 rounded-lg text-sm bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)]"
            >
              Marcar como feito
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ----------------------------------------
        MODAL: AÇÕES RÁPIDAS (TOP3 / CUIDAR)
    ----------------------------------------*/}
    {quickAction && (
      <QuickListModal
        mode={quickAction}
        items={
          quickAction === 'top3'
            ? tasksForSelectedDay.filter(t => t.origin === 'top3')
            : quickAction === 'selfcare'
            ? tasksForSelectedDay.filter(t => t.origin === 'selfcare')
            : tasksForSelectedDay.filter(t => t.origin === 'family')
        }
        onAdd={title => {
          addTask(title, quickAction, selectedDateKey)
        }}
        onToggle={id => toggleTask(id)}
        onClose={() => {
          setQuickAction(null)
          try {
            track('planner.quick_action.closed', { tab: 'meu-dia' })
          } catch {}
        }}
      />
    )}
  </>
)
/* ============================================================
   GERADOR DO CALENDÁRIO MENSAL
   ============================================================ */
function generateMonthMatrix(currentDate: Date): (Date | null)[] {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const matrix: (Date | null)[] = []

  // Offset (segunda = 0)
  const offset = (firstDay.getDay() + 6) % 7

  for (let i = 0; i < offset; i++) matrix.push(null)

  for (let d = 1; d <= lastDay.getDate(); d++) {
    matrix.push(new Date(year, month, d))
  }

  return matrix
}

/* ============================================================
   GERADOR DA SEMANA (SOMENTE VISUAL)
   ============================================================ */
function generateWeekData(base: Date) {
  const monday = new Date(base)
  const day = monday.getDay()

  monday.setDate(base.getDate() - (day === 0 ? 6 : day - 1))

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

/* ============================================================
   FORM DO MODAL DE COMPROMISSO (CRIAR / EDITAR)
   ============================================================ */

type ModalAppointmentFormProps = {
  mode: 'create' | 'edit'
  initialDateKey: string
  initialTitle?: string
  initialTime?: string
  onSubmit: (data: { dateKey: string; title: string; time: string }) => void
  onCancel: () => void
  onDelete?: () => void
}

function ModalAppointmentForm({
  mode,
  initialDateKey,
  initialTitle,
  initialTime,
  onSubmit,
  onCancel,
  onDelete,
}: ModalAppointmentFormProps) {
  const [dateKey, setDateKey] = useState(initialDateKey)
  const [title, setTitle] = useState(initialTitle ?? '')
  const [time, setTime] = useState(initialTime ?? '')

  const formattedLabelDate = useMemo(() => {
    const [y, m, d] = dateKey.split('-').map(Number)
    if (!y || !m || !d) return ''
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR')
  }, [dateKey])

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        if (!title.trim()) return

        onSubmit({
          dateKey,
          title: title.trim(),
          time,
        })
      }}
      className="space-y-4"
    >
      {/* Data */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-text-main)]">
          Data do compromisso
        </label>

        <input
          type="date"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={dateKey}
          onChange={e => setDateKey(e.target.value)}
        />

        {formattedLabelDate && (
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {formattedLabelDate}
          </p>
        )}
      </div>

      {/* Título */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-text-main)]">
          Título
        </label>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Ex: Consulta médica"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* Horário */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-text-main)]">
          Horário
        </label>
        <input
          type="time"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
      </div>

      {/* Botões */}
      <div className="flex justify-between items-center pt-2 gap-3">
        {mode === 'edit' && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-[var(--color-text-muted)] hover:text-red-500 underline"
          >
            Excluir compromisso
          </button>
        )}

        <div className="flex justify-end gap-3 flex-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)]"
          >
            {mode === 'create' ? 'Salvar compromisso' : 'Atualizar compromisso'}
          </button>
        </div>
      </div>
    </form>
  )
}

/* ============================================================
   MODAL LISTA RÁPIDA (TOP3 / CUIDAR)
   ============================================================ */

type QuickListModalProps = {
  mode: 'top3' | 'selfcare' | 'family'
  items: TaskItem[]
  onAdd: (title: string) => void
  onToggle: (id: string) => void
  onClose: () => void
}

function QuickListModal({
  mode,
  items,
  onAdd,
  onToggle,
  onClose,
}: QuickListModalProps) {
  const [input, setInput] = useState('')

  const title =
    mode === 'top3'
      ? 'Prioridades do dia'
      : mode === 'selfcare'
      ? 'Cuidar de mim'
      : 'Cuidar do meu filho'

  const helper =
    mode === 'top3'
      ? 'Escolha até três coisas essenciais para seu dia.'
      : mode === 'selfcare'
      ? 'Liste pequenos gestos de autocuidado.'
      : 'Anote os cuidados importantes com seu filho.'

  const placeholder =
    mode === 'top3'
      ? 'Ex: Resolver algo importante'
      : mode === 'selfcare'
      ? 'Ex: Tomar café em silêncio'
      : 'Ex: Ler uma história juntos'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-[var(--color-text-main)]">{title}</h3>

          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] mb-4">{helper}</p>

        {/* Lista */}
        <div className="space-y-2 max-h-56 overflow-y-auto mb-4 pr-1">
          {items.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Ainda não há nada aqui. Adicione o primeiro item.
            </p>
          )}

          {items.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-sm text-left ${
                item.done
                  ? 'bg-[#FFE8F2] border-[#FFB3D3] text-[var(--color-text-muted)] line-through'
                  : 'bg-white border-[#F1E4EC] hover:border-[var(--color-brand)]/60'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                  item.done
                    ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                    : 'border-[#FFB3D3] text-[var(--color-brand)]'
                }`}
              >
                {item.done ? '✓' : ''}
              </span>
              {item.title}
            </button>
          ))}
        </div>

        {/* Adicionar novo item */}
        <form
          onSubmit={e => {
            e.preventDefault()
            if (!input.trim()) return
            onAdd(input.trim())
            setInput('')
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-main)]">
              Adicionar novo item
            </label>

            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder={placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
            >
              Fechar
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)]"
            >
              Adicionar
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
  return (
    <>
      {/* ===========================
          WRAPPER PRINCIPAL COM REVEAL
      =========================== */}
      <Reveal delay={150}>
        <div className="space-y-6 md:space-y-8 mt-4 md:mt-6">

          {/* ===========================
              1) CALENDÁRIO PREMIUM
          =========================== */}
          <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_22px_55px_rgba(255,20,117,0.12)] p-4 md:p-6 space-y-4 md:space-y-6 bg-white/80 backdrop-blur-xl">
            
            {/* Cabeçalho do calendário */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
                  <AppIcon
                    name="calendar"
                    className="w-4 h-4 text-[var(--color-brand)]"
                  />
                </span>

                {/* Título – mês + ano */}
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

              {/* Botão Dia/Semana */}
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

          {/* ===========================
              2) VISÃO DIA — TAREFAS & AGENDA
          =========================== */}
          {viewMode === 'day' && (
            <div className="mt-2 md:mt-4 space-y-8 md:space-y-10">

              {/* LEMBRETES RÁPIDOS + ATALHOS */}
              <section className="grid grid-cols-2 max-[380px]:grid-cols-1 gap-4 md:gap-8">

                {/* --------------------------
                    LEMBRETES (tarefas do dia)
                --------------------------- */}
                <div className="flex h-full">
                  <SoftCard className="flex-1 h-full rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_18px_40px_rgba(0,0,0,0.05)] p-4 md:p-5 flex flex-col">

                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-1">
                      Lembretes rápidos
                    </h2>

                    <p className="text-sm text-[var(--color-text-muted)] mb-3">
                      Essas tarefas pertencem ao dia selecionado.
                    </p>

                    {/* Lista de tarefas */}
                    <div className="flex-1 min-h-[120px] max-h-48 overflow-y-auto pr-1 space-y-2">
                      {tasksForSelectedDay.length === 0 && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Nenhum lembrete para este dia.
                        </p>
                      )}

                      {tasksForSelectedDay.map(task => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-sm text-left transition-all ${
                            task.done
                              ? 'bg-[#FFE8F2] border-[#FFB3D3] text-[var(--color-text-muted)] line-through'
                              : 'bg-white border-[#F1E4EC] hover:border-[var(--color-brand)]/60'
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                              task.done
                                ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                                : 'border-[#FFB3D3] text-[var(--color-brand)]'
                            }`}
                          >
                            {task.done ? '✓' : ''}
                          </span>
                          <span>{task.title}</span>
                        </button>
                      ))}
                    </div>

                    {/* Campo para adicionar lembrete */}
                    <QuickAddTaskInput onAdd={title => addTask(title, 'manual')} />
                  </SoftCard>
                </div>

                {/* --------------------------
                    ATALHOS PREMIUM
                --------------------------- */}
                <div className="flex h-full">
                  {/* Card com glow premium */}
                  <div className="flex-1 relative overflow-hidden rounded-3xl border border-[var(--color-soft-strong)] bg-white/10 shadow-[0_22px_55px_rgba(255,20,117,0.12)] px-3 py-3 md:px-4 md:py-4 backdrop-blur-2xl">

                    {/* GLOWS */}
                    <div className="pointer-events-none absolute inset-0 opacity-80">
                      <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                      <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.2)] blur-3xl" />
                    </div>

                    {/* Conteúdo */}
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="mb-3">
                        <h2 className="text-lg md:text-xl font-semibold text-white">
                          Comece pelo que faz mais sentido hoje
                        </h2>
                        <p className="mt-1 text-sm text-white/85">
                          Crie lembretes rápidos para organizar seu dia.
                        </p>
                      </div>

                      {/* Grid de atalhos */}
                      <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-auto">

                        {/* PRIORIDADES */}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickAction('top3')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-lg"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <AppIcon name="target" className="w-6 h-6 text-[#E6005F]" />
                            <span className="text-[11px] font-medium text-[#CF285F]">
                              Prioridades
                            </span>
                          </div>
                        </button>

                        {/* AGENDA & COMPROMISSOS */}
                        <button
                          type="button"
                          onClick={() => openModalForDate(selectedDate)}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-lg"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <AppIcon name="calendar" className="w-6 h-6 text-[#E6005F]" />
                            <span className="text-[11px] font-medium text-[#CF285F]">
                              Agenda
                            </span>
                          </div>
                        </button>

                        {/* CUIDAR DE MIM */}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickAction('selfcare')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-lg"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <AppIcon name="heart" className="w-6 h-6 text-[#E6005F]" />
                            <span className="text-[11px] font-medium text-[#CF285F]">
                              Cuidar de mim
                            </span>
                          </div>
                        </button>

                        {/* CUIDAR DO MEU FILHO */}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickAction('family')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-lg"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <AppIcon name="smile" className="w-6 h-6 text-[#E6005F]" />
                            <span className="text-[11px] font-medium text-[#CF285F]">
                              Meu filho
                            </span>
                          </div>
                        </button>

                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* --------------------------
                  COMPROMISSOS DO DIA
              --------------------------- */}
              <section>
                <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-lg p-4 md:p-5">
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-[var(--color-brand)] font-semibold tracking-[0.18em]">
                        Agenda
                      </p>

                      <h2 className="text-lg font-semibold text-[var(--color-text-main)]">
                        Compromissos do dia
                      </h2>

                      <p className="text-xs text-[var(--color-text-muted)]">
                        Compromissos de{' '}
                        <span className="font-semibold text-[var(--color-text-main)]">
                          {formattedSelectedDate}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openModalForDate(selectedDate)}
                      className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-md hover:bg-[var(--color-brand-deep)]"
                    >
                      +
                    </button>
                  </div>

                  {/* Lista de compromissos */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {todaysAppointments.length === 0 && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Nenhum compromisso para este dia.
                      </p>
                    )}

                    {todaysAppointments.map(app => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => openEditModalForAppointment(app)}
                        className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#F1E4EC] bg-white px-3 py-2 text-sm hover:border-[var(--color-brand)]/60 hover:bg-[#FFF3F8]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FFE8F2] text-[11px] font-semibold text-[var(--color-brand)]">
                            {app.time || '--:--'}
                          </span>

                          <div className="flex flex-col">
                            <span className="font-medium">
                              {app.title || 'Compromisso'}
                            </span>

                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              {app.time || 'Sem horário definido'} ·{' '}
                              {selectedDate.toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                </SoftCard>
              </section>
            </div>
          )}

          {/* ===========================
              3) HOJE POR AQUI + SUGESTÕES
          =========================== */}
          <section className="space-y-4 md:space-y-5">
            <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] shadow-lg p-4 md:p-6 space-y-4">

              <div className="space-y-1.5">
                <p className="text-[10px] uppercase text-[var(--color-brand)] tracking-[0.18em] font-semibold">
                  Hoje por aqui
                </p>

                <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                  Como você está hoje?
                </h2>

                <p className="text-xs text-[var(--color-text-muted)]">
                  Escolha como você se sente e defina o estilo do seu dia.
                </p>
              </div>

              {/* HUMOR */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-[var(--color-text-main)]">
                  Como você está?
                </p>

                <div className="flex flex-wrap gap-2 mt-1">
                  {[
                    { key: 'happy', label: 'Feliz' },
                    { key: 'normal', label: 'Normal' },
                    { key: 'stressed', label: 'Estressada' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleMoodSelect(opt.key)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        mood === opt.key
                          ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                          : 'bg-white border-[#FFE8F2] hover:border-[var(--color-brand)]/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* INTENÇÃO DO DIA */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-[var(--color-text-main)]">
                  Hoje eu quero um dia...
                </p>

                <div className="flex flex-wrap gap-2 mt-1">
                  {['leve', 'focado', 'produtivo', 'slow', 'automático'].map(int => (
                    <button
                      key={int}
                      type="button"
                      onClick={() => handleDayIntentionSelect(int)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        dayIntention === int
                          ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                          : 'bg-white border-[#FFE8F2] hover:border-[var(--color-brand)]/60'
                      }`}
                    >
                      {int}
                    </button>
                  ))}
                </div>
              </div>

              {/* FRASE DO DIA */}
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                {mood && dayIntention
                  ? `Hoje você está ${moodLabel[mood]} e escolheu um dia ${intentionLabel[dayIntention]}.`
                  : 'Conte pra gente como você está e como deseja que seja seu dia.'}
              </p>

              {/* BOTÃO DE SUGESTÕES */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleToggleSuggestions}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)] shadow-md"
                >
                  {showSuggestions
                    ? 'Esconder sugestões'
                    : 'Ver sugestões para o seu dia'}
                  <AppIcon name="lightbulb" className="w-4 h-4" />
                </button>
              </div>

            </SoftCard>

            {showSuggestions && (
              <IntelligentSuggestionsSection
                mood={mood}
                intention={dayIntention}
              />
            )}
          </section>

          {/* ===========================
              4) KANBAN – CONTEÚDOS SALVOS
          =========================== */}
          <section>
            <SavedContentsSection
              contents={[]}
              plannerContents={plannerHook.items}
              onItemClick={item => {
                setSelectedSavedContent(item)

                try {
                  track('planner.saved_content.opened', {
                    tab: 'meu-dia',
                    origin: item.origin,
                    type: item.type,
                  })
                } catch {}
              }}
              onItemDone={({ id, source }) => {
                if (source === 'planner') {
                  plannerHook.removeItem(id)

                  try {
                    track('planner.saved_content.completed', {
                      tab: 'meu-dia',
                      source,
                    })
                  } catch {}

                  try {
                    void updateXP(6)
                  } catch {}
                }
              }}
            />
          </section>

          {/* ===========================
              5) VISÃO SEMANA
          =========================== */}
          {viewMode === 'week' && (
            <div className="mt-4 pb-10">
              <WeekView weekData={generateWeekData(selectedDate)} />
            </div>
          )}

        </div>
      </Reveal>

      {/* Os modais já foram declarados no bloco 4 */}
    </>
  )
}

