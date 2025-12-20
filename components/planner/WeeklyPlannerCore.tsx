'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { updateXP } from '@/app/lib/xp'
import type { TaskItem, TaskOrigin } from '@/app/lib/myDayTasks.client'
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
  tasks: TaskItem[]
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

function toDate(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/* ======================================================
   COMPONENTE
====================================================== */
export default function WeeklyPlannerCore() {
  const todayKey = useMemo(() => getBrazilDateKey(new Date()), [])

  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey)
  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    tasks: [],
    notes: '',
  })

  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())
  const [showAllReminders, setShowAllReminders] = useState(false)
  const [showAllAppointments, setShowAllAppointments] = useState(false)

  /* -------- Onboarding (1ª vez no Meu Dia) -------- */
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('onboarding.meu-dia.v1')
    setShowOnboarding(!seen)
  }, [])

  const dismissOnboarding = () => {
    localStorage.setItem('onboarding.meu-dia.v1', '1')
    setShowOnboarding(false)
  }

  /* ======================================================
     LOAD / SAVE
  ====================================================== */
  useEffect(() => {
    const tasks = load<TaskItem[]>(`planner/tasks/${selectedDateKey}`, []) ?? []
    const appointments = load<Appointment[]>('planner/appointments/all', []) ?? []

    setPlannerData((p) => ({
      ...p,
      tasks,
      appointments,
    }))
  }, [selectedDateKey])

  useEffect(() => {
    save(`planner/tasks/${selectedDateKey}`, plannerData.tasks)
  }, [plannerData.tasks, selectedDateKey])

  useEffect(() => {
    save('planner/appointments/all', plannerData.appointments)
  }, [plannerData.appointments])

  /* ======================================================
     TASK ACTIONS
  ====================================================== */
  const addTask = useCallback((title: string, origin: TaskOrigin) => {
    const t: TaskItem = {
      id: safeId(),
      title: title.trim(),
      origin,
      done: false,
    }

    if (!t.title) return

    setPlannerData((p) => ({ ...p, tasks: [...p.tasks, t] }))
    track('planner.task.added', { origin })
    updateXP(5)
  }, [])

  const toggleTask = (id: string) => {
    setPlannerData((p) => ({
      ...p,
      tasks: p.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }))
  }

  const editTask = (id: string, title: string) => {
    const next = title.trim()
    if (!next) return

    setPlannerData((p) => ({
      ...p,
      tasks: p.tasks.map((t) => (t.id === id ? { ...t, title: next } : t)),
    }))
  }

  const removeTask = (id: string) => {
    setPlannerData((p) => ({
      ...p,
      tasks: p.tasks.filter((t) => t.id !== id),
    }))
  }

  const promptReminder = (origin: TaskOrigin, title: string) => {
    const text = window.prompt(title)
    if (!text) return
    addTask(text, origin)
  }

  /* ======================================================
     DERIVED
  ====================================================== */
  const limit = Math.max(3, Number(euSignal.listLimit) || 5)
  const visibleTasks = showAllReminders ? plannerData.tasks : plannerData.tasks.slice(0, limit)

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <Reveal>
      <div className="space-y-6">

        {/* ---------------- LEMBRETES ---------------- */}
        <SoftCard className="rounded-3xl p-5 bg-white/95">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold tracking-widest text-[var(--color-brand)]">HOJE</p>
              <h3 className="text-lg font-semibold">Lembretes do dia</h3>
              <p className="text-sm text-muted-foreground">
                Um espaço leve para registrar o que importa — no seu ritmo.
              </p>
            </div>

            <button
              onClick={() => promptReminder('other', 'O que você quer lembrar hoje?')}
              className="h-10 w-10 rounded-full bg-[var(--color-brand)] text-white"
            >
              +
            </button>
          </div>

          {showOnboarding && (
            <div className="mt-4 rounded-xl border p-3 text-xs text-muted-foreground bg-white/80">
              <p className="font-semibold mb-1">Como usar:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Clique no + para criar um lembrete.</li>
                <li>Toque no lembrete para marcar como feito.</li>
                <li>Use ⋮ para editar ou excluir.</li>
              </ul>
              <div className="mt-3 text-right">
                <button
                  onClick={dismissOnboarding}
                  className="text-xs font-semibold text-[var(--color-brand)]"
                >
                  Entendi
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {visibleTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-xl border px-3 py-2"
              >
                <button onClick={() => toggleTask(task.id)}>
                  {task.done ? '✓' : '○'}
                </button>

                <span className={`flex-1 ${task.done ? 'line-through opacity-60' : ''}`}>
                  {task.title}
                </span>

                <button
                  onClick={() => {
                    const action = window.prompt('1 = Editar | 2 = Excluir')
                    if (action === '2') removeTask(task.id)
                    if (action === '1') {
                      const t = window.prompt('Editar lembrete:', task.title)
                      if (t) editTask(task.id, t)
                    }
                  }}
                >
                  ⋮
                </button>
              </div>
            ))}
          </div>

          {plannerData.tasks.length > limit && (
            <button
              onClick={() => setShowAllReminders((v) => !v)}
              className="mt-3 text-xs text-muted-foreground"
            >
              {showAllReminders ? 'Voltar para versão leve' : 'Mostrar todos'}
            </button>
          )}
        </SoftCard>

        {/* ---------------- CARD FINAL ---------------- */}
        <SoftCard
          className="rounded-3xl p-5 bg-white/95 cursor-pointer hover:bg-white"
          onClick={() => setSelectedDateKey(todayKey)}
        >
          <p className="text-center text-sm font-semibold">
            Se fizer sentido, você pode revisar um dia anterior ou se organizar para o próximo.
          </p>
        </SoftCard>
      </div>
    </Reveal>
  )
}
