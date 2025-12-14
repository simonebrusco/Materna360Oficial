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

function safeId() {
  // crypto.randomUUID pode falhar em alguns ambientes; fallback seguro
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

function buildWeekData(
  baseDate: Date,
  plannerData: PlannerData,
): WeekDaySummary[] {
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

  const taskCountByKey = {
    top3: 0,
    selfcare: 0,
    family: 0,
  }

  // tasks são do selectedDateKey (persistência atual)
  for (const t of plannerData.tasks) {
    if (t.origin === 'top3') taskCountByKey.top3 += 1
    if (t.origin === 'selfcare') taskCountByKey.selfcare += 1
    if (t.origin === 'family') taskCountByKey.family += 1
  }

  const baseKey = getBrazilDateKey(baseDate)

  return weekDates.map(d => {
    const key = getBrazilDateKey(d)
    return {
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      agendaCount: agendaCountByKey[key] ?? 0,
      top3Count: key === baseKey ? taskCountByKey.top3 : 0,
      careCount: key === baseKey ? taskCountByKey.selfcare : 0,
      familyCount: key === baseKey ? taskCountByKey.family : 0,
    }
  })
}

// =======================================================
// COMPONENTE PRINCIPAL (DEFAULT EXPORT)
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

  const addAppointment = useCallback(
    (data: { dateKey: string; title: string; time: string }) => {
      const a: Appointment = {
        id: safeId(),
        dateKey: data.dateKey,
        title: data.title,
        time: data.time,
      }

      setPlannerData(prev => ({
        ...prev,
        appointments: [...prev.appointments, a],
      }))

      try {
        track('planner.appointment_added', {
          tab: 'meu-dia',
          dateKey: data.dateKey,
        })
      } catch {}

      try {
        void updateXP(6)
      } catch {}
    },
    [],
  )

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

  if (!isHydrated) return null

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <Reveal>
      <div className="space-y-6 md:space-y-8">
        {/* Top bar */}
        <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
                <AppIcon
                  name="calendar"
                  className="h-4 w-4 text-[var(--color-brand)]"
                />
              </span>
              <div>
                <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                  Planner
                </p>
                <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">
                  {selectedDate.toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h2>
              </div>
            </div>

            <div className="flex gap-2 bg-[var(--color-soft-bg)]/80 p-1 rounded-full">
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
        </SoftCard>

        {/* WEEK VIEW */}
        {viewMode === 'week' && <WeekView weekData={weekData} />}

        {/* DAY VIEW */}
        {viewMode === 'day' && (
          <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] p-4 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                  Hoje
                </p>
                <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">
                  Lembretes do dia
                </h3>
                <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                  Ações práticas do seu dia — organizadas a partir da sua rotina
                  real.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  addAppointment({
                    dateKey: selectedDateKey,
                    title: 'Novo compromisso',
                    time: '',
                  })
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070] transition-all"
                aria-label="Adicionar compromisso"
              >
                +
              </button>
            </div>

            <div className="space-y-2">
              {plannerData.tasks.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Ainda não há lembretes para hoje. Use os atalhos abaixo ou
                  registre algo que faça sentido para a sua rotina.
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

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => addTask('O que realmente importa hoje', 'top3')}
                className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
              >
                O que realmente importa hoje
              </button>

              <button
                type="button"
                onClick={() =>
                  addAppointment({
                    dateKey: selectedDateKey,
                    title: 'Compromisso e combinado',
                    time: '',
                  })
                }
                className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
              >
                Compromissos e combinados
              </button>

              <button
                type="button"
                onClick={() => addTask('Pequeno gesto de autocuidado', 'selfcare')}
                className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
              >
                Pequenos gestos de autocuidado
              </button>

              <button
                type="button"
                onClick={() =>
                  addTask('Momento ou cuidado importante', 'family')
                }
                className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
              >
                Momentos e cuidados importantes
              </button>
            </div>

            <p className="text-[11px] md:text-xs text-[var(--color-text-muted)] pt-1">
              Esses lembretes podem vir das trilhas do Maternar ou ser criados
              por você.
            </p>
          </SoftCard>
        )}

        {/* Navegação rápida de data */}
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
      </div>
    </Reveal>
  )
}
