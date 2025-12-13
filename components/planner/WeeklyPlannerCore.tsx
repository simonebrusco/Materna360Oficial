'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'

import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'
import WeekView from './WeekView'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import { updateXP } from '@/app/lib/xp'

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

  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null)

  const [quickAction, setQuickAction] = useState<
    'top3' | 'selfcare' | 'family' | null
  >(null)

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

    setPlannerData({
      appointments: loadedAppointments,
      tasks: loadedTasks,
      notes: '',
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

  // ======================================================
  // ACTIONS
  // ======================================================
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDateKey(getBrazilDateKey(date))
  }, [])

  const openModalForDate = (date: Date) => {
    setModalDate(date)
    setIsModalOpen(true)
  }

  const handleAddAppointment = (data: {
    dateKey: string
    title: string
    time: string
  }) => {
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      ...data,
    }

    setPlannerData(prev => ({
      ...prev,
      appointments: [...prev.appointments, newAppointment],
    }))

    try {
      void updateXP(6)
    } catch {}
  }

  const addTask = (title: string, origin: TaskOrigin) => {
    const newTask: TaskItem = {
      id: crypto.randomUUID(),
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
      tasks: prev.tasks.map(t =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    }))
  }

  // ======================================================
  // DERIVED
  // ======================================================
  const selectedDate = useMemo(() => {
    if (!selectedDateKey) return new Date()
    const [y, m, d] = selectedDateKey.split('-').map(Number)
    return new Date(y, m - 1, d)
  }, [selectedDateKey])

  const tasksByOrigin = (origin: TaskOrigin) =>
    plannerData.tasks.filter(t => t.origin === origin)

  if (!isHydrated) return null

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <Reveal>
      <div className="space-y-8">

        {/* CALENDÁRIO */}
        <SoftCard className="rounded-3xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">
              {selectedDate.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>

            <div className="flex gap-2">
              <button
                className={viewMode === 'day' ? 'font-bold' : ''}
                onClick={() => setViewMode('day')}
              >
                Dia
              </button>
              <button
                className={viewMode === 'week' ? 'font-bold' : ''}
                onClick={() => setViewMode('week')}
              >
                Semana
              </button>
            </div>
          </div>

          <WeekView
            baseDate={selectedDate}
            onSelectDay={handleDateSelect}
            appointments={plannerData.appointments}
          />
        </SoftCard>

        {/* VISÃO DIA */}
        {viewMode === 'day' && (
          <SoftCard className="rounded-3xl p-4 md:p-6 space-y-4">
            <h3 className="font-semibold text-base">
              Lembretes do dia
            </h3>

            {plannerData.tasks.map(task => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full text-left flex items-center gap-3"
              >
                <span>{task.done ? '✓' : '○'}</span>
                <span className={task.done ? 'line-through' : ''}>
                  {task.title}
                </span>
              </button>
            ))}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button onClick={() => setQuickAction('top3')}>
                Prioridades
              </button>
              <button onClick={() => openModalForDate(selectedDate)}>
                Agenda
              </button>
              <button onClick={() => setQuickAction('selfcare')}>
                Cuidar de mim
              </button>
              <button onClick={() => setQuickAction('family')}>
                Cuidar do meu filho
              </button>
            </div>
          </SoftCard>
        )}

        {/* VISÃO SEMANA */}
        {viewMode === 'week' && (
          <WeekView baseDate={selectedDate} />
        )}

      </div>
    </Reveal>
  )
}
