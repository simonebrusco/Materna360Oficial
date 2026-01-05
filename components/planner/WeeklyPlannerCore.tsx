'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { updateXP } from '@/app/lib/xp'

import type { MyDayTaskItem, TaskOrigin, TaskStatus } from '@/app/lib/myDayTasks.client'
import { MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

import { getEu360Signal, type Eu360Signal } from '@/app/lib/eu360Signals.client'
import { getMyDayContinuityLine } from '@/app/lib/continuity.client'

import { Reveal } from '@/components/ui/Reveal'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

import WeekView from './WeekView'
import AppointmentModal from './AppointmentModal'

/* ======================================================
   TIPOS
====================================================== */

type Appointment = {
  id: string
  dateKey: string
  time: string
  title: string
}

type PlannerData = {
  appointments: Appointment[]
  tasks: MyDayTaskItem[]
  notes: string
}

/* ======================================================
   HELPERS
====================================================== */

function safeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}

function normalizeText(s: string) {
  return (s ?? '').trim().replace(/\s+/g, ' ')
}

/* ======================================================
   COMPONENTE
====================================================== */

export default function WeeklyPlannerCore() {
  const [selectedDateKey, setSelectedDateKey] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    tasks: [],
    notes: '',
  })

  /* ---------------------------
     Eu360 SIGNAL
  --------------------------- */
  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())

  /**
   * 🔹 LIMITADOR CANÔNICO DO PLANNER
   * Baseado no Eu360, com clamp emocional.
   * Planner é naturalmente mais estruturado.
   */
  const plannerLimit = useMemo(() => {
    const raw = Number(euSignal.listLimit)
    const base = Number.isFinite(raw) ? raw : 5
    return Math.max(3, Math.min(8, base))
  }, [euSignal.listLimit])

  const isGentleTone = euSignal.tone === 'gentil'
  const lessLine = 'Hoje pode ser menos — e ainda assim conta.'

  /* ======================================================
     HYDRATION
  ====================================================== */
  useEffect(() => {
    const todayKey = getBrazilDateKey(new Date())
    setSelectedDateKey(todayKey)
    setIsHydrated(true)

    try {
      setEuSignal(getEu360Signal())
    } catch {}

    try {
      track('planner.opened', { tab: 'meu-dia', dateKey: todayKey })
    } catch {}
  }, [])

  /* ======================================================
     EU360 SYNC
  ====================================================== */
  useEffect(() => {
    const refresh = () => {
      try {
        setEuSignal(getEu360Signal())
      } catch {}
    }

    window.addEventListener('storage', refresh)
    window.addEventListener('eu360:persona-updated', refresh as EventListener)
    window.addEventListener('eu360:prefs-updated', refresh as EventListener)

    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('eu360:persona-updated', refresh as EventListener)
      window.removeEventListener('eu360:prefs-updated', refresh as EventListener)
    }
  }, [])

  /* ======================================================
     LOAD
  ====================================================== */
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    const tasks = load<MyDayTaskItem[]>(`planner/tasks/${selectedDateKey}`, []) ?? []
    const appointments = load<Appointment[]>('planner/appointments/all', []) ?? []
    const notes = load<string>(`planner/notes/${selectedDateKey}`, '') ?? ''

    setPlannerData({
      tasks,
      appointments,
      notes,
    })
  }, [selectedDateKey, isHydrated])

  /* ======================================================
     SAVE
  ====================================================== */
  useEffect(() => {
    if (!isHydrated) return
    save('planner/appointments/all', plannerData.appointments)
  }, [plannerData.appointments, isHydrated])

  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/tasks/${selectedDateKey}`, plannerData.tasks)
  }, [plannerData.tasks, selectedDateKey, isHydrated])

  /* ======================================================
     CONTINUIDADE (HOJE)
  ====================================================== */
  const todayKey = useMemo(() => getBrazilDateKey(new Date()), [])

  const continuityLine = useMemo(() => {
    if (selectedDateKey !== todayKey) return ''
    try {
      const res = getMyDayContinuityLine({
        dateKey: todayKey,
        tone: euSignal.tone ?? 'gentil',
      })
      return res?.text ?? ''
    } catch {
      return ''
    }
  }, [selectedDateKey, todayKey, euSignal.tone])

  /* ======================================================
     ACTIONS
  ====================================================== */
  const addTask = useCallback(
    (title: string, origin: TaskOrigin) => {
      const text = normalizeText(title)
      if (!text) return

      const nowISO = new Date().toISOString()

      const t: MyDayTaskItem = {
        id: safeId(),
        title: text,
        origin,
        done: false,
        status: 'active',
        createdAt: nowISO,
        source: MY_DAY_SOURCES.PLANNER,
      }

      setPlannerData((prev) => ({ ...prev, tasks: [...prev.tasks, t] }))

      try {
        track('planner.task_added', { tab: 'meu-dia', origin })
        void updateXP(5)
      } catch {}
    },
    [],
  )

  /* ======================================================
     RENDER
  ====================================================== */
  if (!isHydrated) return null

  return (
    <Reveal>
      <div className="space-y-6">
        {/* LEMBRETES */}
        <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] p-4 space-y-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
              Hoje
            </p>
            <h3 className="text-lg font-semibold text-[var(--color-text-main)]">Lembretes do dia</h3>

            {euSignal.showLessLine && (
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{lessLine}</p>
            )}

            {!!continuityLine && (
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{continuityLine}</p>
            )}
          </div>

          {plannerData.tasks.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              Ainda não há lembretes para hoje.
            </p>
          ) : (
            (() => {
              const all = plannerData.tasks
              const visible = all.slice(0, plannerLimit)
              const hasMore = all.length > visible.length

              return (
                <>
                  {visible.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-[var(--color-soft-strong)] px-3 py-2 text-sm"
                    >
                      {task.title}
                    </div>
                  ))}

                  {hasMore && (
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Existem outros lembretes, mas não precisam aparecer agora.
                    </p>
                  )}
                </>
              )
            })()
          )}
        </SoftCard>
      </div>
    </Reveal>
  )
}
