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

type Appointment = {
  id: string
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
}

type PlannerData = {
  appointments: Appointment[]
  tasks: TaskItem[]
  notes: string // compatibilidade
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

  // EDIÇÃO DE LEMBRETES RÁPIDOS
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskValue, setEditingTaskValue] = useState('')

  // ===========================
  // HYDRATION
  // ===========================
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
    setSelectedDateKey(getBrazilDateKey(date))
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
    },
    [],
  )

  const openModalForDate = (date: Date) => {
    setModalDate(date)
    setIsModalOpen(true)
  }

  // TAREFAS – helpers
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
  }

  const toggleTask = (id: string) => {
    setPlannerData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    }))
  }

  const deleteTask = (id: string) => {
    setPlannerData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id),
    }))
    if (editingTaskId === id) {
      setEditingTaskId(null)
      setEditingTaskValue('')
    }
  }

  const startEditingTask = (task: TaskItem) => {
    setEditingTaskId(task.id)
    setEditingTaskValue(task.title)
  }

  const saveEditingTask = () => {
    if (!editingTaskId) return
    setPlannerData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === editingTaskId
          ? {
              ...task,
              title: editingTaskValue.trim() || task.title,
            }
          : task,
      ),
    }))
    setEditingTaskId(null)
    setEditingTaskValue('')
  }

  const cancelEditingTask = () => {
    setEditingTaskId(null)
    setEditingTaskValue('')
  }

  // ===========================
  // FORMATAÇÕES
  // ===========================
  const selectedDate = useMemo(() => {
    if (!isHydrated || !selectedDateKey) return new Date()
    const [year, month, day] = selectedDateKey
      .split('-')
      .map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey, isHydrated])

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
          intentionLabel[
            dayIntention as keyof typeof intentionLabel
          ]
        }. Que tal começar definindo suas prioridades?`
      : 'Conte pra gente como você está e que tipo de dia você quer ter. Vamos organizar tudo a partir disso.'

  const tasksByOrigin = (origin: TaskOrigin) =>
    plannerData.tasks.filter(task => task.origin === origin)

  const hasItemsToday =
    plannerData.tasks.length > 0 || plannerData.appointments.length > 0

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
                  {/* removido "capitalize" para deixar "dezembro de 2025" */}
                  <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">
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

              <div className="flex gap-2 bg-[var(--color-soft-bg)]/80 p-1 rounded-full self-start md:self-auto">
                <button
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    viewMode === 'day'
                      ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                  }`}
                  onClick={() => setViewMode('day')}
                >
                  Dia
                </button>
                <button
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    viewMode === 'week'
                      ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                  }`}
                  onClick={() => setViewMode('week')}
                >
                  Semana
                </button>
              </div>
            </div>

            {/* Cabeçalho dos dias */}
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

              {/* Grade do mês */}
              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {generateMonthMatrix(selectedDate).map((day, i) => {
                  if (!day) {
                    return <div key={i} className="h-8 md:h-9" />
                  }

                  const dayKey = getBrazilDateKey(day)

                  // carrega do localStorage p/ mostrar pontinho também em outros dias
                  const dayAppointments: Appointment[] =
                    load(`planner/appointments/${dayKey}`, []) ?? []
                  const dayTasks: TaskItem[] =
                    load(`planner/tasks/${dayKey}`, []) ?? []

                  const hasStoredItems =
                    (Array.isArray(dayAppointments) &&
                      dayAppointments.length > 0) ||
                    (Array.isArray(dayTasks) && dayTasks.length > 0)

                  const isSelected = dayKey === selectedDateKey

                  const hasDot =
                    hasStoredItems ||
                    (isSelected && hasItemsToday)

                  return (
                    <button
                      key={i}
                      onClick={() => openModalForDate(day)}
                      className={`h-8 md:h-9 rounded-full text-xs md:text-sm flex items-center justify-center transition-all border ${
                        isSelected
                          ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_6px_18px_rgba(255,20,117,0.45)]'
                          : 'bg-white/80 text-[var(--color-text-main)] border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-strong)]/70'
                      }`}
                    >
                      <div className="relative flex flex-col items-center justify-center h-full">
                        <span>{day.getDate()}</span>
                        {hasDot && (
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </SoftCard>

          {/* VISÃO DIA */}
          {viewMode === 'day' && (
            <div className="mt-2 md:mt-4 space-y-8 md:space-y-10">
              <section className="grid grid-cols-2 max-[380px]:grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 md:items-stretch">
                {/* LEMBRETES RÁPIDOS – LISTA ÚNICA */}
                <div className="flex h-full">
                  <SoftCard className="flex-1 h-full rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_18px_40px_rgba(0,0,0,0.05)] p-4 md:p-5 flex flex-col">
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-1">
                      Lembretes Rápidos
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)] mb-3">
                      Tudo que você salvar nos atalhos aparece aqui como
                      uma lista simples para o seu dia.
                    </p>

                    {/* Lista de tarefas */}
                    <div className="flex-1 min-h-[120px] max-h-48 overflow-y-auto pr-1 space-y-2">
                      {plannerData.tasks.length === 0 && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Ainda não há lembretes para hoje. Use os atalhos
                          ao lado ou adicione algo rápido abaixo.
                        </p>
                      )}

                      {plannerData.tasks.map(task => {
                        const isEditing = editingTaskId === task.id
                        return (
                          <div
                            key={task.id}
                            className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${
                              task.done
                                ? 'bg-[#FFE8F2] border-[#FFB3D3] text-[var(--color-text-muted)]'
                                : 'bg-white border-[#F1E4EC] hover:border-[var(--color-brand)]/60'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleTask(task.id)}
                              className="flex flex-1 items-center gap-3 text-left"
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
                              {isEditing ? (
                                <input
                                  className="w-full rounded-md border px-2 py-1 text-xs"
                                  value={editingTaskValue}
                                  onChange={e =>
                                    setEditingTaskValue(e.target.value)
                                  }
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : (
                                <span
                                  className={
                                    task.done
                                      ? 'line-through text-[var(--color-text-muted)]'
                                      : ''
                                  }
                                >
                                  {task.title}
                                </span>
                              )}
                            </button>

                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={saveEditingTask}
                                    className="text-[11px] px-2 py-1 rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)]"
                                  >
                                    OK
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditingTask}
                                    className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 text-[var(--color-text-muted)] hover:bg-gray-200"
                                  >
                                    Canc.
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEditingTask(task)}
                                    className="text-[11px] px-2 py-1 rounded-lg bg-white text-[var(--color-text-muted)] border border-[#F1E4EC] hover:border-[var(--color-brand)]/60"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteTask(task.id)}
                                    className="text-[11px] px-2 py-1 rounded-lg bg-white text-[#C2285F] border border-[#F1E4EC] hover:border-[#ff005e]/70"
                                  >
                                    Excluir
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Campo rápido para novo lembrete */}
                    <QuickAddTaskInput
                      onAdd={title => addTask(title, 'manual')}
                    />
                  </SoftCard>
                </div>

                {/* ATALHOS DO DIA */}
                <div className="flex h-full">
                  <div className="flex-1 relative overflow-hidden rounded-3xl border border-[var(--color-soft-strong)] bg-white/10 shadow-[0_22px_55px_rgba(255,20,117,0.12)] px-3 py-3 md:px-4 md:py-4 backdrop-blur-2xl">
                    {/* Glows de fundo */}
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
                          Use esses atalhos para criar lembretes rápidos
                          de prioridades, compromissos e cuidados.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-auto">
                        {/* Prioridades do Dia */}
                        <button
                          type="button"
                          onClick={() => setQuickAction('top3')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duração-150 hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] active:translate-y-0 active:shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
                        >
                          <div className="flex flex-col items-center justify-center gap-1 text-center px-1">
                            <AppIcon
                              name="target"
                              className="w-5 h-5 md:w-6 md:h-6 text-[var(--color-brand-deep)] group-hover:scale-110 transition-transform duração-150"
                            />
                            <span className="text-[10px] md:text-[11px] font-medium leading-tight text-[var(--color-text-main)] group-hover:text-[var(--color-brand-deep)]">
                              Prioridades do Dia
                            </span>
                          </div>
                        </button>

                        {/* Agenda & Compromissos */}
                        <button
                          type="button"
                          onClick={() => {
                            openModalForDate(selectedDate)
                          }}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duração-150 hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] active:translate-y-0 active:shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
                        >
                          <div className="flex flex-col items-center justify-center gap-1 text-center px-1">
                            <AppIcon
                              name="calendar"
                              className="w-5 h-5 md:w-6 md:h-6 text-[var(--color-brand-deep)] group-hover:scale-110 transition-transform duração-150"
                            />
                            <span className="text-[10px] md:text-[11px] font-medium leading-tight text-[var(--color-text-main)] group-hover:text-[var(--color-brand-deep)]">
                              Agenda &amp; Compromissos
                            </span>
                          </div>
                        </button>

                        {/* Cuidar de Mim */}
                        <button
                          type="button"
                          onClick={() => setQuickAction('selfcare')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duração-150 hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] active:translate-y-0 active:shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
                        >
                          <div className="flex flex-col items-center justify-center gap-1 text-center px-1">
                            <AppIcon
                              name="heart"
                              className="w-5 h-5 md:w-6 md:h-6 text-[var(--color-brand-deep)] group-hover:scale-110 transition-transform duração-150"
                            />
                            <span className="text-[10px] md:text-[11px] font-medium leading-tight text-[var(--color-text-main)] group-hover:text-[var(--color-brand-deep)]">
                              Cuidar de Mim
                            </span>
                          </div>
                        </button>

                        {/* Cuidar do Meu Filho */}
                        <button
                          type="button"
                          onClick={() => setQuickAction('family')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border border-white/80 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duração-150 hover:-translate-y-[2px] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] active:translate-y-0 active:shadow-[0_8px_20px_rgba(0,0,0,0.16)]"
                        >
                          <div className="flex flex-col items-center justify-center gap-1 text-center px-1">
                            <AppIcon
                              name="smile"
                              className="w-5 h-5 md:w-6 md:h-6 text-[var(--color-brand-deep)] group-hover:scale-110 transition-transform duração-150"
                            />
                            <span className="text-[10px] md:text-[11px] font-medium leading-tight text-[var(--color-text-main)] group-hover:text-[var(--color-brand-deep)]">
                              Cuidar do Meu Filho
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* HOJE POR AQUI + SUGESTÕES INTELIGENTES */}
          <section className="space-y-4 md:space-y-5">
            <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] shadow-[0_16px_40px_rgba(0,0,0,0.08)] p-4 md:p-6 space-y-4">
              <div className="space-y-1.5">
                <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                  Hoje por aqui
                </p>
                <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                  Como você está hoje?
                </h2>
                <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                  Escolha como você se sente agora e o estilo de dia que
                  você gostaria de ter.
                </p>
              </div>

              <div className="space-y-3 md:space-y-4">
                {/* COMO VOCÊ ESTÁ */}
                <div className="space-y-1.5">
                  <p className="text-[11px] md:text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wide">
                    Como você está?
                  </p>
                  <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
                    Escolha como você se sente agora.
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
                        onClick={() =>
                          setMood(prev =>
                            prev === option.key ? null : option.key,
                          )
                        }
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

                {/* HOJE EU QUERO UM DIA... */}
                <div className="space-y-1.5">
                  <p className="text-[11px] md:text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wide">
                    Hoje eu quero um dia...
                  </p>
                  <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
                    Selecione o estilo do seu dia.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      'leve',
                      'focado',
                      'produtivo',
                      'slow',
                      'automático',
                    ].map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setDayIntention(prev =>
                            prev === option ? null : option,
                          )
                        }
                        className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all border ${
                          dayIntention === option
                            ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_6px_18px_rgba(255,20,117,0.4)]'
                            : 'bg-white border-[#FFE8F2] text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-2">
                {moodSummary}
              </p>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowSuggestions(prev => !prev)}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold bg-[var(--color-brand)] text-white shadow-[0_6px_18px_rgba(255,20,117,0.35)] hover:bg-[var(--color-brand-deep)] transition-all"
                >
                  {showSuggestions
                    ? 'Esconder sugestões para o seu dia'
                    : 'Ver sugestões para o seu dia'}
                  <AppIcon
                    name="lightbulb"
                    className="w-4 h-4"
                  />
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

          {/* KANBAN DE CONTEÚDOS SALVOS */}
          <section>
            <SavedContentsSection
              contents={[]}
              plannerContents={plannerHook.items}
              onItemClick={item => setSelectedSavedContent(item)}
              onItemDone={({ id, source }) => {
                if (source === 'planner') {
                  plannerHook.removeItem(id)
                }
              }}
            />
          </section>

          {/* VISÃO SEMANA */}
          {viewMode === 'week' && (
            <div className="mt-4 pb-10">
              <WeekView
                weekData={generateWeekData(
                  selectedDate,
                  selectedDateKey,
                  plannerData,
                )}
              />
            </div>
          )}
        </div>
      </Reveal>

      {/* MODAL NOVO COMPROMISSO */}
      {isModalOpen && modalDate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[var(--color-text-main)]">
                Novo compromisso –{' '}
                {modalDate.toLocaleDateString('pt-BR')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
              >
                ✕
              </button>
            </div>
            <ModalAppointmentForm
              onSubmit={data => {
                // salva no bloco de compromissos
                handleAddAppointment({
                  time: data.time,
                  title: data.title,
                  tag: undefined,
                })

                // também cria lembrete rápido na lista
                if (data.title?.trim()) {
                  const label = data.time
                    ? `${data.time} · ${data.title.trim()}`
                    : data.title.trim()
                  addTask(label, 'agenda')
                }

                setIsModalOpen(false)
              }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL DETALHE CONTEÚDO SALVO */}
      {selectedSavedContent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[998]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
                  <AppIcon
                    name="target"
                    className="w-4 h-4 text-[var(--color-brand)]"
                  />
                </span>
                <span className="inline-flex items-center rounded-full border border-[var(--color-soft-strong)] bg-[#FFE8F2]/60 px-2 py-0.5 text-[10px] font-medium text-[#C2285F]">
                  {plannerTypeLabels[selectedSavedContent.type] ??
                    'CONTEÚDO'}
                </span>
              </div>
              <button
                onClick={() => setSelectedSavedContent(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
              >
                ✕
              </button>
            </div>

            <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] mb-2">
              {selectedSavedContent.title}
            </h3>

            {(() => {
              const anyItem = selectedSavedContent as any
              const payload = anyItem.payload ?? {}
              const description =
                anyItem.description ??
                payload.preview ??
                payload.description ??
                payload.text ??
                payload.excerpt ??
                ''

              return description ? (
                <p className="text-sm text-[var(--color-text-muted)] mb-3 whitespace-pre-line">
                  {description}
                </p>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] mb-3">
                  Esse conteúdo foi salvo no planner. Em breve, você verá
                  mais detalhes aqui.
                </p>
              )
            })()}

            <p className="text-[11px] text-[var(--color-text-muted)]/80 mb-4">
              Salvo em: {selectedSavedContent.origin.replace('-', ' ')}
            </p>

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
                }}
                className="px-4 py-2 rounded-lg text-sm bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)]"
              >
                Marcar como feito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAIS DE AÇÕES RÁPIDAS (TOP3 / CUIDAR) */}
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
            if (quickAction === 'top3') addTask(title, 'top3')
            else if (quickAction === 'selfcare')
              addTask(title, 'selfcare')
            else addTask(title, 'family')
          }}
          onToggle={id => toggleTask(id)}
          onClose={() => setQuickAction(null)}
        />
      )}
    </>
  )
}

// GERADOR DO CALENDÁRIO
function generateMonthMatrix(currentDate: Date): (Date | null)[] {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const matrix: (Date | null)[] = []
  const offset = (firstDay.getDay() + 6) % 7

  for (let i = 0; i < offset; i++) matrix.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    matrix.push(new Date(year, month, d))
  }

  return matrix
}

function generateWeekData(
  base: Date,
  currentDateKey: string,
  currentPlanner: PlannerData,
) {
  const monday = new Date(base)
  const day = monday.getDay()
  monday.setDate(base.getDate() - (day === 0 ? 6 : day - 1))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)

    const dateKey = getBrazilDateKey(d)

    // dados base vindos do localStorage
    const appointments: Appointment[] =
      load(`planner/appointments/${dateKey}`, []) ?? []
    const tasks: TaskItem[] =
      load(`planner/tasks/${dateKey}`, []) ?? []

    let agendaCount = Array.isArray(appointments)
      ? appointments.length
      : 0

    let top3Count = Array.isArray(tasks)
      ? tasks.filter(t => t.origin === 'top3').length
      : 0

    let careCount = Array.isArray(tasks)
      ? tasks.filter(t => t.origin === 'selfcare').length
      : 0

    let familyCount = Array.isArray(tasks)
      ? tasks.filter(t => t.origin === 'family').length
      : 0

    // garante que o dia atual use os dados em memória (mais confiáveis)
    if (dateKey === currentDateKey) {
      agendaCount = currentPlanner.appointments.length
      top3Count = currentPlanner.tasks.filter(
        t => t.origin === 'top3',
      ).length
      careCount = currentPlanner.tasks.filter(
        t => t.origin === 'selfcare',
      ).length
      familyCount = currentPlanner.tasks.filter(
        t => t.origin === 'family',
      ).length
    }

    return {
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString('pt-BR', {
        weekday: 'long',
      }),
      agendaCount,
      top3Count,
      careCount,
      familyCount,
    }
  })
}

// FORM DO MODAL (COMPROMISSO)
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
        onSubmit({
          title,
          time,
        })
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-text-main)]">
          Título
        </label>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Ex: Consulta médica..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

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

      <div className="flex justify-end gap-3 pt-2">
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
          Salvar compromisso
        </button>
      </div>
    </form>
  )
}

// INPUT RÁPIDO DE TAREFA
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
      <label className="text-[11px] font-medium text-[var(--color-text-main)]">
        Adicionar lembrete rápido
      </label>
      <input
        className="w-full rounded-xl border px-3 py-2 text-sm bg-[var(--color-soft-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/40 focus:border-[var(--color-brand)]/60"
        placeholder="Ex: Levar exame no pediatra, separar uniforme..."
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </form>
  )
}

// MODAL LISTA RÁPIDA (TOP3 / CUIDAR)
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
      ? 'Escolha até três coisas que realmente importam para hoje. Elas também vão aparecer nos seus Lembretes rápidos.'
      : mode === 'selfcare'
      ? 'Liste pequenos gestos de autocuidado que cabem no seu dia. Tudo aparece nos Lembretes rápidos.'
      : 'Anote os cuidados ou momentos importantes com seu filho hoje. Eles também aparecem nos Lembretes rápidos.'

  const placeholder =
    mode === 'top3'
      ? 'Ex: Resolver algo importante do trabalho'
      : mode === 'selfcare'
      ? 'Ex: Tomar um café em silêncio por 5 minutos'
      : 'Ex: Ler uma história antes de dormir'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-[var(--color-text-main)]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          {helper}
        </p>

        <div className="space-y-2 max-h-56 overflow-y-auto mb-4 pr-1">
          {items.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Ainda não há nada aqui. Comece adicionando o primeiro item.
            </p>
          )}
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-sm text-left ${
                item.done
                  ? 'bg-[#FFE8F2] border-[#FFB3D3] line-through text-[var(--color-text-muted)]'
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
              <span>{item.title}</span>
            </button>
          ))}
        </div>

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
