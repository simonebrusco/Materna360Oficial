'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { updateXP } from '@/app/lib/xp'

import { Reveal } from '@/components/ui/Reveal'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

import WeekView from './WeekView'

// =======================================================
// TIPAGENS
// =======================================================
type Appointment = {
  id: string
  dateKey: string
  time: string
  title: string
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

type WeekDaySummary = {
  dayNumber: number
  dayName: string
  agendaCount: number
  top3Count: number
  careCount: number
  familyCount: number
}

type ModalAppointmentFormProps = {
  initialDateKey: string
  onSubmit: (data: { dateKey: string; title: string; time: string }) => void
  onCancel: () => void
}

type QuickListModalProps = {
  mode: 'top3' | 'selfcare' | 'family'
  items: TaskItem[]
  onAdd: (title: string) => void
  onToggle: (id: string) => void
  onClose: () => void
}

// =======================================================
// HELPERS
// =======================================================
function safeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}

function startOfWeekMonday(base: Date) {
  const d = new Date(base)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function buildWeekData(baseDate: Date, plannerData: PlannerData): WeekDaySummary[] {
  const monday = startOfWeekMonday(baseDate)

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const dayKeySet = new Set(weekDates.map(d => getBrazilDateKey(d)))

  const agendaCountByKey: Record<string, number> = {}
  for (const a of plannerData.appointments) {
    if (!dayKeySet.has(a.dateKey)) continue
    agendaCountByKey[a.dateKey] = (agendaCountByKey[a.dateKey] ?? 0) + 1
  }

  // Observação: tasks hoje são persistidos por selectedDateKey (dia atual).
  // No WeekView, mostramos os contadores do dia-base como “resumo leve”.
  let top3 = 0
  let selfcare = 0
  let family = 0
  for (const t of plannerData.tasks) {
    if (t.origin === 'top3') top3 += 1
    if (t.origin === 'selfcare') selfcare += 1
    if (t.origin === 'family') family += 1
  }

  const baseKey = getBrazilDateKey(baseDate)

  return weekDates.map(d => {
    const key = getBrazilDateKey(d)
    return {
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      agendaCount: agendaCountByKey[key] ?? 0,
      top3Count: key === baseKey ? top3 : 0,
      careCount: key === baseKey ? selfcare : 0,
      familyCount: key === baseKey ? family : 0,
    }
  })
}

function generateMonthMatrix(currentDate: Date): (Date | null)[] {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const matrix: (Date | null)[] = []
  const offset = (firstDay.getDay() + 6) % 7 // monday-first

  for (let i = 0; i < offset; i++) matrix.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    matrix.push(new Date(year, month, d))
  }

  return matrix
}

// =======================================================
// COMPONENTE PRINCIPAL
// =======================================================
export default function WeeklyPlannerCore() {
  const [selectedDateKey, setSelectedDateKey] = useState<string>('')
  const [isHydrated, setIsHydrated] = useState(false)

  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    tasks: [],
    notes: '',
  })

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // Modais
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [quickAction, setQuickAction] = useState<'top3' | 'selfcare' | 'family' | null>(null)

  // ======================================================
  // HYDRATION
  // ======================================================
  useEffect(() => {
    const dateKey = getBrazilDateKey(new Date())
    setSelectedDateKey(dateKey)
    setIsHydrated(true)

    try {
      track('planner.opened', { tab: 'meu-dia', dateKey })
    } catch {}
  }, [])

  // ======================================================
  // LOAD DATA
  // ======================================================
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    const loadedAppointments =
      load<Appointment[]>('planner/appointments/all', []) ?? []
    const loadedTasks =
      load<TaskItem[]>(`planner/tasks/${selectedDateKey}`, []) ?? []
    const loadedNotes =
      load<string>(`planner/notes/${selectedDateKey}`, '') ?? ''

    setPlannerData({
      appointments: loadedAppointments,
      tasks: loadedTasks,
      notes: loadedNotes,
    })
  }, [selectedDateKey, isHydrated])

  // ======================================================
  // SAVE DATA
  // ======================================================
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

  // ======================================================
  // ACTIONS
  // ======================================================
  const handleDateSelect = useCallback((date: Date) => {
    const key = getBrazilDateKey(date)
    setSelectedDateKey(key)

    try {
      track('planner.date_clicked', { tab: 'meu-dia', dateKey: key })
    } catch {}
  }, [])

  const addAppointment = useCallback((data: { dateKey: string; title: string; time: string }) => {
    const a: Appointment = {
      id: safeId(),
      dateKey: data.dateKey,
      title: data.title,
      time: data.time,
    }

    setPlannerData(prev => ({ ...prev, appointments: [...prev.appointments, a] }))

    try {
      track('planner.appointment_added', { tab: 'meu-dia', dateKey: data.dateKey })
    } catch {}

    try {
      void updateXP(6)
    } catch {}
  }, [])

  const addTask = useCallback((title: string, origin: TaskOrigin) => {
    const t: TaskItem = {
      id: safeId(),
      title,
      done: false,
      origin,
    }

    setPlannerData(prev => ({ ...prev, tasks: [...prev.tasks, t] }))

    try {
      track('planner.task_added', { tab: 'meu-dia', origin })
    } catch {}

    try {
      const base = origin === 'top3' || origin === 'selfcare' ? 8 : 5
      void updateXP(base)
    } catch {}
  }, [])

  const toggleTask = useCallback((id: string) => {
    setPlannerData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)),
    }))
  }, [])

  // ======================================================
  // DERIVED
  // ======================================================
  const selectedDate = useMemo(() => {
    if (!selectedDateKey) return new Date()
    const [y, m, d] = selectedDateKey.split('-').map(Number)
    return new Date(y, m - 1, d)
  }, [selectedDateKey])

  const weekData = useMemo(
    () => buildWeekData(selectedDate, plannerData),
    [selectedDate, plannerData],
  )

  const tasksByOrigin = useCallback(
    (origin: TaskOrigin) => plannerData.tasks.filter(t => t.origin === origin),
    [plannerData.tasks],
  )

  if (!isHydrated) return null

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <Reveal>
      <div className="space-y-6 md:space-y-8">
        {/* CALENDÁRIO PREMIUM (GRADE DO MÊS) */}
        <SoftCard
          className="
            rounded-3xl
            bg-white
            border border-[var(--color-soft-strong)]
            shadow-[0_22px_55px_rgba(253,37,151,0.12)]
            p-4 md:p-6
            space-y-4 md:space-y-6
            bg-white/80
            backdrop-blur-xl
          "
        >
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
                  aria-label="Mês anterior"
                >
                  ‹
                </button>

                <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] capitalize">
                  {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h2>

                <button
                  type="button"
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-soft-strong)]/70 text-sm"
                  onClick={() => {
                    const d = new Date(selectedDate)
                    d.setMonth(d.getMonth() + 1)
                    handleDateSelect(d)
                  }}
                  aria-label="Próximo mês"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="flex gap-2 bg-[var(--color-soft-bg)]/80 p-1 rounded-full self-start md:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  viewMode === 'day'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                }`}
              >
                Dia
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-[var(--color-brand)] shadow-[0_2px_8px_rgba(253,37,151,0.2)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-brand)]'
                }`}
              >
                Semana
              </button>
            </div>
          </div>

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

            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
              {generateMonthMatrix(selectedDate).map((day, i) => {
                if (!day) return <div key={i} className="h-8 md:h-9" />

                const dayKey = getBrazilDateKey(day)
                const isSelected = dayKey === selectedDateKey
                const hasAppointments = plannerData.appointments.some(app => app.dateKey === dayKey)

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`
                      h-8 md:h-9 rounded-full
                      text-xs md:text-sm
                      flex flex-col items-center justify-center
                      transition-all border
                      ${
                        isSelected
                          ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_6px_18px_rgba(253,37,151,0.45)]'
                          : 'bg-white/80 text-[var(--color-text-main)] border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-strong)]/70'
                      }
                    `}
                  >
                    <span>{day.getDate()}</span>
                    {hasAppointments && (
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </SoftCard>

        {/* WEEK VIEW */}
        {viewMode === 'week' && <WeekView weekData={weekData} />}

        {/* DAY VIEW */}
        {viewMode === 'day' && (
          <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] shadow-[0_16px_38px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                  Hoje
                </p>
                <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                  Lembretes do dia
                </h3>
                <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                  Registro simples para manter o dia possível.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAppointmentModalOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070] transition-all"
                aria-label="Adicionar compromisso"
              >
                +
              </button>
            </div>

            <div className="space-y-2">
              {plannerData.tasks.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Ainda não há lembretes para hoje. Use os atalhos abaixo ou adicione algo rápido.
                </p>
              ) : (
                plannerData.tasks.map(task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-sm text-left transition-all ${
                      task.done
                        ? 'bg-[#FFE8F2] border-[#FFB3D3] text-[var(--color-text-muted)] line-through'
                        : 'bg-white border-[#F1E4EC] hover:border-[var(--color-brand)]/60 hover:bg-[#FFF3F8]'
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

                    <span className="flex-1">{task.title}</span>

                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {task.origin}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* INPUT RÁPIDO */}
            <QuickAddTaskInput onAdd={title => addTask(title, 'manual')} />

            {/* ATALHOS (ABREM MODAIS) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuickAction('top3')}
                className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
              >
                Prioridades
              </button>

              <button
                type="button"
                onClick={() => setIsAppointmentModalOpen(true)}
                className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
              >
                Agenda
              </button>

              <button
                type="button"
                onClick={() => setQuickAction('selfcare')}
                className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
              >
                Cuidar de mim
              </button>

              <button
                type="button"
                onClick={() => setQuickAction('family')}
                className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
              >
                Cuidar do meu filho
              </button>
            </div>

            {/* AGENDA COMPLETA (LISTA) */}
            <div className="pt-2">
              <div className="flex items-end justify-between gap-3 mb-2">
                <div>
                  <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                    Agenda
                  </p>
                  <h4 className="text-base font-semibold text-[var(--color-text-main)]">
                    Compromissos
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Compromissos salvos no Materna360 (todos os dias).
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {plannerData.appointments.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Você ainda não marcou nenhum compromisso.
                  </p>
                ) : (
                  [...plannerData.appointments]
                    .sort((a, b) => {
                      if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey)
                      const at = a.time || '99:99'
                      const bt = b.time || '99:99'
                      return at.localeCompare(bt)
                    })
                    .map(a => (
                      <div
                        key={a.id}
                        className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#F1E4EC] bg-white px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-14 items-center justify-center rounded-full bg-[#FFE8F2] text-[11px] font-semibold text-[var(--color-brand)]">
                            {a.time || '--:--'}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[var(--color-text-main)]">
                              {a.title || 'Compromisso'}
                            </span>
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              {a.dateKey}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </SoftCard>
        )}

        {/* NAV DE DIA (MINIMAL) */}
        <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] p-4 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)]"
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() - 1)
                handleDateSelect(d)
              }}
              aria-label="Dia anterior"
            >
              ‹
            </button>

            <div className="text-sm font-semibold text-[var(--color-text-main)]">
              {selectedDate.toLocaleDateString('pt-BR')}
            </div>

            <button
              type="button"
              className="h-9 w-9 rounded-full border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)]"
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() + 1)
                handleDateSelect(d)
              }}
              aria-label="Próximo dia"
            >
              ›
            </button>
          </div>
        </SoftCard>

        {/* ======================================================= */}
        {/* MODAL — NOVO COMPROMISSO */}
        {/* ======================================================= */}
        {isAppointmentModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[var(--color-text-main)]">
                  Novo compromisso
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAppointmentModalOpen(false)
                    try {
                      track('planner.appointment_modal_closed', { tab: 'meu-dia' })
                    } catch {}
                  }}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <ModalAppointmentForm
                initialDateKey={selectedDateKey}
                onSubmit={data => {
                  // salva compromisso
                  addAppointment({
                    dateKey: data.dateKey,
                    title: data.title,
                    time: data.time,
                  })

                  // cria lembrete correspondente
                  const label = data.time ? `${data.time} · ${data.title}` : data.title
                  addTask(label, 'agenda')

                  // muda o dia selecionado para a data do compromisso
                  setSelectedDateKey(data.dateKey)

                  setIsAppointmentModalOpen(false)

                  try {
                    track('planner.appointment_modal_saved', { tab: 'meu-dia' })
                  } catch {}
                }}
                onCancel={() => {
                  setIsAppointmentModalOpen(false)
                  try {
                    track('planner.appointment_modal_cancelled', { tab: 'meu-dia' })
                  } catch {}
                }}
              />
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* MODAL — AÇÕES RÁPIDAS */}
        {/* ======================================================= */}
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
              else if (quickAction === 'selfcare') addTask(title, 'selfcare')
              else addTask(title, 'family')
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
      </div>
    </Reveal>
  )
}

// =======================================================
// FORM — NOVO COMPROMISSO
// =======================================================
function ModalAppointmentForm({ initialDateKey, onSubmit, onCancel }: ModalAppointmentFormProps) {
  const [dateKey, setDateKey] = useState(initialDateKey)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')

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
        onSubmit({ dateKey, title: title.trim(), time })
      }}
      className="space-y-4"
    >
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
          <p className="text-[11px] text-[var(--color-text-muted)]">{formattedLabelDate}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-text-main)]">Título</label>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Ex: Consulta médica..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--color-text-main)]">Horário</label>
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
          className="px-4 py-2 rounded-lg text-sm bg-[var(--color-brand)] text-white hover:bg-[#e00070]"
        >
          Salvar compromisso
        </button>
      </div>
    </form>
  )
}

// =======================================================
// INPUT RÁPIDO — TAREFA MANUAL
// =======================================================
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
      className="mt-2 space-y-1"
    >
      <label className="text-[11px] font-medium text-[var(--color-text-main)]">
        Adicionar lembrete rápido
      </label>
      <input
        className="
          w-full rounded-xl border
          px-3 py-2
          text-sm
          bg-[var(--color-soft-bg)]
          focus:outline-none
          focus:ring-2
          focus:ring-[var(--color-brand)]/40
          focus:border-[var(--color-brand)]/60
        "
        placeholder="Ex: separar uniforme, responder mensagem..."
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </form>
  )
}

// =======================================================
// MODAL — LISTA (TOP3 / SELCARE / FAMILY)
// =======================================================
function QuickListModal({ mode, items, onAdd, onToggle, onClose }: QuickListModalProps) {
  const [input, setInput] = useState('')

  const title =
    mode === 'top3' ? 'Prioridades do dia' : mode === 'selfcare' ? 'Cuidar de mim' : 'Cuidar do meu filho'

  const helper =
    mode === 'top3'
      ? 'Escolha até três coisas que realmente importam para hoje.'
      : mode === 'selfcare'
      ? 'Liste pequenos gestos de autocuidado que cabem no seu dia.'
      : 'Anote cuidados ou momentos importantes com seu filho hoje.'

  const placeholder =
    mode === 'top3'
      ? 'Ex: resolver algo importante do trabalho'
      : mode === 'selfcare'
      ? 'Ex: respirar por 3 minutos'
      : 'Ex: ler uma história antes de dormir'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-[var(--color-text-main)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] mb-4">{helper}</p>

        <div className="space-y-2 max-h-56 overflow-y-auto mb-4 pr-1">
          {items.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              Ainda não há nada aqui. Comece adicionando o primeiro item.
            </p>
          ) : (
            items.map(item => (
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
            ))
          )}
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
              className="px-4 py-2 rounded-lg text-sm bg-[var(--color-brand)] text-white hover:bg-[#e00070)]"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
