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
}

type PlannerData = {
  appointments: Appointment[]
  tasks: TaskItem[]
  notes: string
}

export default function WeeklyPlannerShell() {
  const [selectedDateKey, setSelectedDateKey] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    tasks: [],
    notes: '',
  })

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  const plannerHook = usePlannerSavedContents()

  const [mood, setMood] = useState<string | null>(null)
  const [dayIntention, setDayIntention] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null)

  const [selectedSavedContent, setSelectedSavedContent] =
    useState<PlannerSavedContent | null>(null)

  const [quickAction, setQuickAction] = useState<
    'top3' | 'selfcare' | 'family' | null
  >(null)
  useEffect(() => {
    const dateKey = getBrazilDateKey(new Date())
    setSelectedDateKey(dateKey)
    plannerHook.setDateKey(dateKey)
    setIsHydrated(true)

    try {
      track('planner.opened', { tab: 'meu-dia', dateKey })
    } catch {}
  }, [plannerHook])

  useEffect(() => {
    if (isHydrated && selectedDateKey) {
      plannerHook.setDateKey(selectedDateKey)
      try {
        track('planner.date_changed', { tab: 'meu-dia', dateKey: selectedDateKey })
      } catch {}
    }
  }, [selectedDateKey, isHydrated, plannerHook])

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
      tasks: loadedTasks,
      notes: loadedNotes,
    })
  }, [selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    save('planner/appointments/all', plannerData.appointments)
  }, [plannerData.appointments, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/tasks/${selectedDateKey}`, plannerData.tasks)
  }, [plannerData.tasks, selectedDateKey, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/notes/${selectedDateKey}`, plannerData.notes)
  }, [plannerData.notes, selectedDateKey, isHydrated])

  const handleDateSelect = useCallback((date: Date) => {
    const dateKey = getBrazilDateKey(date)
    setSelectedDateKey(dateKey)
    try {
      track('planner.date_clicked', { tab: 'meu-dia', dateKey })
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

  const handleUpdateAppointment = useCallback((updated: Appointment) => {
    setPlannerData(prev => ({
      ...prev,
      appointments: prev.appointments.map(app =>
        app.id === updated.id ? updated : app,
      ),
    }))

    try {
      track('planner.appointment_updated', {
        tab: 'meu-dia',
        id: updated.id,
        dateKey: updated.dateKey,
      })
    } catch {}
  }, [])

  const handleDeleteAppointment = useCallback((id: string) => {
    setPlannerData(prev => ({
      ...prev,
      appointments: prev.appointments.filter(app => app.id !== id),
    }))

    try {
      track('planner.appointment_deleted', { tab: 'meu-dia', id })
    } catch {}
  }, [])

  const openModalForDate = (day: Date) => {
    const key = getBrazilDateKey(day)
    setSelectedDateKey(key)
    setModalDate(day)
    setIsModalOpen(true)
  }

  const openEditModalForAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
  }
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
    setPlannerData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    }))
  }

  const handleViewModeChange = (mode: 'day' | 'week') => {
    setViewMode(mode)
  }

  const handleMoodSelect = (key: string) => {
    setMood(prev => (prev === key ? null : key))
  }

  const handleDayIntentionSelect = (value: string) => {
    setDayIntention(prev => (prev === value ? null : value))
  }

  const handleToggleSuggestions = () => {
    setShowSuggestions(prev => !prev)
  }

  const handleOpenQuickAction = (mode: 'top3' | 'selfcare' | 'family') => {
    setQuickAction(mode)
  }

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

  const tasksByOrigin = (origin: TaskOrigin) =>
    plannerData.tasks.filter(task => task.origin === origin)

  if (!isHydrated) return null
  return (
    <>
      <Reveal delay={150}>
        <div className="space-y-6 md:space-y-8 mt-4 md:mt-6">
          
          {/* CALENDÁRIO PREMIUM */}
          <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow-[0_22px_55px_rgba(255,20,117,0.12)] p-4 md:p-6 space-y-4 md:space-y-6 bg-white/80 backdrop-blur-xl">
            
            {/* Cabeçalho do calendário */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
                  <AppIcon name="calendar" className="w-4 h-4 text-[var(--color-brand)]" />
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

              <div className="flex gap-2 bg-[var(--color-soft-bg)]/80 p-1 rounded-full">
                <button
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold ${
                    viewMode === 'day'
                      ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                  onClick={() => setViewMode('day')}
                >
                  Dia
                </button>

                <button
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold ${
                    viewMode === 'week'
                      ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
                      : 'text-[var(--color-text-muted)]'
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
                <span>Seg</span><span>Ter</span><span>Qua</span>
                <span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
              </div>

              {/* Grade de dias */}
              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {generateMonthMatrix(selectedDate).map(
                  (day, i) =>
                    day ? (
                      <button
                        key={i}
                        onClick={() => openModalForDate(day)}
                        className={`h-8 md:h-9 rounded-full text-xs md:text-sm flex items-center justify-center border ${
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
          {viewMode === 'day' && (
            <div className="mt-2 md:mt-4 space-y-8 md:space-y-10">
              
              {/* LEMBRETES RÁPIDOS */}
              <section className="grid grid-cols-2 max-[380px]:grid-cols-1 gap-4 md:gap-8">
                <div className="flex h-full">
                  <SoftCard className="flex-1 rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow p-4 md:p-5 flex flex-col">
                    
                    <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                      Lembretes rápidos
                    </h2>

                    <p className="text-sm text-[var(--color-text-muted)] mb-3">
                      Tudo que você salvar nos atalhos aparece aqui.
                    </p>

                    <div className="flex-1 min-h-[120px] max-h-48 overflow-y-auto space-y-2 pr-1">
                      {plannerData.tasks.length === 0 && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Você ainda não adicionou lembretes.
                        </p>
                      )}

                      {plannerData.tasks.map(task => (
                        <button
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
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
                            {task.done && '✓'}
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
                  <div className="flex-1 relative overflow-hidden rounded-3xl border border-[var(--color-soft-strong)] bg-white/10 shadow px-3 py-3 md:px-4 md:py-4 backdrop-blur-2xl">
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <h2 className="text-lg md:text-xl font-semibold text-white">
                        Comece pelo que faz mais sentido hoje
                      </h2>
                      <p className="text-sm text-white/85 mb-3">
                        Crie lembretes rápidos para organizar o dia.
                      </p>

                      <div className="grid grid-cols-2 gap-2.5 mt-auto">
                        <button type="button" onClick={() => handleOpenQuickAction('top3')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border shadow backdrop-blur-xl hover:-translate-y-[2px] transition">
                          <div className="flex flex-col items-center gap-1 px-1 text-center">
                            <AppIcon name="target" className="w-6 h-6 text-[#E6005F]" />
                            <span className="text-[11px] font-medium text-[#CF285F]">
                              Prioridades
                            </span>
                          </div>
                        </button>

                        <button type="button" onClick={() => openModalForDate(selectedDate)}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border shadow backdrop-blur-xl">
                          <div className="flex flex-col items-center gap-1 px-1 text-center">
                            <AppIcon name="calendar" className="w-6 h-6 text-[#E6005F]" />
                            <span className="text-[11px] font-medium text-[#CF285F]">
                              Agenda
                            </span>
                          </div>
                        </button>

                        <button type="button" onClick={() => handleOpenQuickAction('selfcare')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border shadow backdrop-blur-xl">
                          <div className="flex flex-col items-center gap-1 px-1 text-center">
                            <AppIcon name="heart" className="w-6 h-6 text-[#E6005F]" />
                            <span className="text-[11px] font-medium text-[#CF285F]">
                              Cuidar de mim
                            </span>
                          </div>
                        </button>

                        <button type="button" onClick={() => handleOpenQuickAction('family')}
                          className="group flex aspect-square items-center justify-center rounded-2xl bg-white/80 border shadow backdrop-blur-xl">
                          <div className="flex flex-col items-center gap-1 px-1 text-center">
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

              {/* AGENDA DO DIA */}
              <section>
                <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] shadow p-4 md:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-semibold tracking-wide uppercase text-[var(--color-brand)]">
                        Agenda
                      </p>
                      <h2 className="text-lg font-semibold text-[var(--color-text-main)]">
                        Compromissos do dia
                      </h2>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        O que você marcou para{' '}
                        <span className="font-semibold text-[var(--color-text-main)]">
                          {formattedSelectedDate}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => openModalForDate(selectedDate)}
                      className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow hover:bg-[var(--color-brand-deep)]"
                    >
                      +
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {todaysAppointments.length === 0 && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Nenhum compromisso marcado.
                      </p>
                    )}

                    {todaysAppointments.map(appt => (
                      <button
                        key={appt.id}
                        onClick={() => openEditModalForAppointment(appt)}
                        className="w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-sm hover:border-[var(--color-brand)]/60 hover:bg-[#FFF3F8]"
                      >
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FFE8F2] font-semibold text-[var(--color-brand)]">
                          {appt.time || '--:--'}
                        </span>
                        <div>
                          <p className="font-medium">{appt.title}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            {appt.time || 'Sem horário'} ·{' '}
                            {selectedDate.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </SoftCard>
              </section>
            </div>
          )}
          {/* HOJE POR AQUI */}
          <section className="space-y-4 md:space-y-5">
            <SoftCard className="rounded-3xl bg-white border p-4 md:p-6 space-y-4 shadow">
              
              <p className="text-[10px] font-semibold tracking-wide uppercase text-[var(--color-brand)]">
                Hoje por aqui
              </p>

              <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                Como você está hoje?
              </h2>

              {/* Humor */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase">Como você está?</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: 'happy', label: 'Feliz' },
                    { key: 'normal', label: 'Normal' },
                    { key: 'stressed', label: 'Estressada' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => handleMoodSelect(opt.key)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                        mood === opt.key
                          ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                          : 'bg-white border-[#FFE8F2]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intenção do dia */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase">
                  Hoje eu quero um dia…
                </p>
                <div className="flex gap-2 flex-wrap">
                  {['leve','focado','produtivo','slow','automático'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleDayIntentionSelect(opt)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                        dayIntention === opt
                          ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                          : 'bg-white border-[#FFE8F2]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumo */}
              <p className="text-xs text-[var(--color-text-muted)]">
                {mood && dayIntention
                  ? `Hoje você está ${
                      {happy:'Feliz',normal:'Normal',stressed:'Estressada'}[mood]
                    } e escolheu um dia ${
                      {leve:'leve',focado:'focado',produtivo:'produtivo',slow:'slow','automático':'automático'}[dayIntention]
                    }.`
                  : 'Conte para nós como você está e como quer que seu dia seja.'}
              </p>

              <button
                onClick={handleToggleSuggestions}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold bg-[var(--color-brand)] text-white shadow hover:bg-[var(--color-brand-deep)]"
              >
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
            onItemClick={item => setSelectedSavedContent(item)}
            onItemDone={({ id, source }) => {
              if (source === 'planner') plannerHook.removeItem(id)
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
{isModalOpen && modalDate && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[var(--color-text-main)]">
          Novo compromisso – {modalDate.toLocaleDateString('pt-BR')}
        </h3>

        <button
          type="button"
          onClick={() => setIsModalOpen(false)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
        >
          ✕
        </button>
      </div>

      <ModalAppointmentForm
        mode="create"
        initialDateKey={getBrazilDateKey(modalDate)}
        onSubmit={data => {
          handleAddAppointment({
            dateKey: data.dateKey,
            time: data.time,
            title: data.title,
          })
          setIsModalOpen(false)
        }}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  </div>
)}

     {/* MODAL EDIÇÃO COMPROMISSO */}
{editingAppointment && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
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

      <ModalAppointmentForm
        mode="edit"
        initialDateKey={editingAppointment.dateKey}
        initialTitle={editingAppointment.title}
        initialTime={editingAppointment.time}
        onSubmit={data => {
          const updated = {
            ...editingAppointment,
            dateKey: data.dateKey,
            time: data.time,
            title: data.title,
          }

          handleUpdateAppointment(updated)
          setEditingAppointment(null)
        }}
        onCancel={() => setEditingAppointment(null)}
        onDelete={() => {
          const ok = window.confirm('Tem certeza que deseja excluir?')
          if (!ok) return
          handleDeleteAppointment(editingAppointment.id)
          setEditingAppointment(null)
        }}
      />
    </div>
  </div>
)}

      {/* MODAL CONTEÚDO SALVO */}
      {selectedSavedContent && (
        <SavedContentModal
          item={selectedSavedContent}
          onClose={() => setSelectedSavedContent(null)}
          onDone={id => plannerHook.removeItem(id)}
        />
      )}

      {/* MODAIS RÁPIDOS */}
      {quickAction && (
        <QuickListModal
          mode={quickAction}
          items={tasksByOrigin(quickAction)}
          onAdd={title => addTask(title, quickAction)}
          onToggle={toggleTask}
          onClose={() => setQuickAction(null)}
        />
      )}
    </>
  )
}
// GERAR MATRIZ DO CALENDÁRIO
function generateMonthMatrix(currentDate: Date): (Date | null)[] {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)

  const matrix: (Date | null)[] = []
  const offset = (first.getDay() + 6) % 7

  for (let i = 0; i < offset; i++) matrix.push(null)
  for (let d = 1; d <= last.getDate(); d++) matrix.push(new Date(year, month, d))

  return matrix
}

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

/* ============================
   MODAL RAPIDO (TOP3 / CUIDAR)
   ============================ */
function QuickListModal({
  mode,
  items,
  onAdd,
  onToggle,
  onClose,
}: {
  mode: 'top3' | 'selfcare' | 'family'
  items: TaskItem[]
  onAdd: (title: string) => void
  onToggle: (id: string) => void
  onClose: () => void
}) {
  const [input, setInput] = useState('')

  const title =
    mode === 'top3'
      ? 'Prioridades do dia'
      : mode === 'selfcare'
      ? 'Cuidar de mim'
      : 'Cuidar do meu filho'

  const helper =
    mode === 'top3'
      ? 'Escolha até três coisas que importam hoje.'
      : mode === 'selfcare'
      ? 'Liste pequenos gestos de autocuidado.'
      : 'Escreva cuidados importantes com seu filho.'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999] backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] mb-4">{helper}</p>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-4">
          {items.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Ainda não há itens aqui.
            </p>
          )}

          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                item.done
                  ? 'bg-[#FFE8F2] border-[#FFB3D3] line-through'
                  : 'bg-white border-[#F1E4EC] hover:border-[var(--color-brand)]/60'
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
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

        <form
          className="space-y-3"
          onSubmit={e => {
            e.preventDefault()
            if (!input.trim()) return
            onAdd(input.trim())
            setInput('')
          }}
        >
          <div className="space-y-1">
            <label className="text-xs font-medium">Adicionar novo item</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Escreva aqui…"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm bg-gray-100"
            >
              Fechar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm bg-[var(--color-brand)] text-white"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
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
          placeholder="Ex: Consulta médica..."
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

      <div className="flex justify-between items-center pt-2 gap-3">
        {/* Botão excluir */}
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
            {mode === 'create'
              ? 'Salvar compromisso'
              : 'Atualizar compromisso'}
          </button>
        </div>
      </div>
    </form>
  )
}

/* ============================
   INPUT RÁPIDO (LEMBRETES)
   ============================ */
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
      <label className="text-[11px] font-medium">
        Adicionar lembrete rápido
      </label>

      <input
        className="w-full rounded-xl border px-3 py-2 text-sm bg-[var(--color-soft-bg)]
                   focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/40
                   focus:border-[var(--color-brand)]/60"
        placeholder="Ex: Levar exame no pediatra…"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </form>
  )
}
