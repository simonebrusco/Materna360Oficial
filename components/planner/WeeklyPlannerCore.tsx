'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { load, save } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { updateXP } from '@/app/lib/xp'

/* ======================================================
   TIPOS
====================================================== */
export type TaskOrigin =
  | 'top3'
  | 'agenda'
  | 'selfcare'
  | 'family'
  | 'manual'

export type TaskItem = {
  id: string
  title: string
  done: boolean
  origin: TaskOrigin
}

export type Appointment = {
  id: string
  dateKey: string
  time: string
  title: string
}

export type PlannerData = {
  tasks: TaskItem[]
  appointments: Appointment[]
}

export type WeekDaySummary = {
  dayNumber: number
  dayName: string
  agendaCount: number
  top3Count: number
  careCount: number
  familyCount: number
}

/* ======================================================
   HOOK CORE
====================================================== */
export function useWeeklyPlannerCore() {
  const [hydrated, setHydrated] = useState(false)
  const [selectedDateKey, setSelectedDateKey] = useState('')
  const [plannerData, setPlannerData] = useState<PlannerData>({
    tasks: [],
    appointments: [],
  })

  /* ------------------------------
     INIT
  ------------------------------- */
  useEffect(() => {
    const today = getBrazilDateKey(new Date())
    setSelectedDateKey(today)
    setHydrated(true)

    try {
      track('planner.opened', { tab: 'meu-dia', dateKey: today })
    } catch {}
  }, [])

  /* ------------------------------
     LOAD
  ------------------------------- */
  useEffect(() => {
    if (!hydrated || !selectedDateKey) return

    const tasks =
      load<TaskItem[]>(`planner/tasks/${selectedDateKey}`, []) ?? []

    const appointments =
      load<Appointment[]>('planner/appointments/all', []) ?? []

    setPlannerData({ tasks, appointments })
  }, [hydrated, selectedDateKey])

  /* ------------------------------
     SAVE
  ------------------------------- */
  useEffect(() => {
    if (!hydrated) return
    save(`planner/tasks/${selectedDateKey}`, plannerData.tasks)
  }, [plannerData.tasks, hydrated, selectedDateKey])

  useEffect(() => {
    if (!hydrated) return
    save('planner/appointments/all', plannerData.appointments)
  }, [plannerData.appointments, hydrated])

  /* ------------------------------
     ACTIONS
  ------------------------------- */
  const selectDate = useCallback((date: Date) => {
    setSelectedDateKey(getBrazilDateKey(date))
  }, [])

  const addTask = useCallback((title: string, origin: TaskOrigin) => {
    setPlannerData(prev => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: crypto.randomUUID(),
          title,
          done: false,
          origin,
        },
      ],
    }))

    try {
      void updateXP(4)
    } catch {}
  }, [])

  const toggleTask = useCallback((id: string) => {
    setPlannerData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    }))
  }, [])

  const addAppointment = useCallback(
    (data: Omit<Appointment, 'id'>) => {
      setPlannerData(prev => ({
        ...prev,
        appointments: [
          ...prev.appointments,
          { id: crypto.randomUUID(), ...data },
        ],
      }))

      try {
        void updateXP(6)
      } catch {}
    },
    [],
  )

  /* ------------------------------
     DERIVED
  ------------------------------- */
  const selectedDate = useMemo(() => {
    if (!selectedDateKey) return new Date()
    const [y, m, d] = selectedDateKey.split('-').map(Number)
    return new Date(y, m - 1, d)
  }, [selectedDateKey])

  const weekData: WeekDaySummary[] = useMemo(() => {
    const monday = new Date(selectedDate)
    const day = monday.getDay()
    monday.setDate(selectedDate.getDate() - (day === 0 ? 6 : day - 1))

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const key = getBrazilDateKey(d)

      const tasks = plannerData.tasks.filter(t =>
        t.origin !== 'manual',
      )

      return {
        dayNumber: d.getDate(),
        dayName: d.toLocaleDateString('pt-BR', { weekday: 'long' }),
        agendaCount: plannerData.appointments.filter(
          a => a.dateKey === key,
        ).length,
        top3Count: tasks.filter(t => t.origin === 'top3').length,
        careCount: tasks.filter(t => t.origin === 'selfcare').length,
        familyCount: tasks.filter(t => t.origin === 'family').length,
      }
    })
  }, [plannerData, selectedDate])

  if (!hydrated) return null

  /* ------------------------------
     API DO CORE
  ------------------------------- */
  return {
    selectedDate,
    selectedDateKey,
    plannerData,

    selectDate,
    addTask,
    toggleTask,
    addAppointment,

    weekData,
  }
}
