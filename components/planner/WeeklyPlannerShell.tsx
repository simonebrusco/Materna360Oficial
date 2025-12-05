'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'

import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

// ======================================================
// TIPAGENS
// ======================================================
type Appointment = {
  id: string
  dateKey: string
  title: string
  time: string
}

type TaskItem = {
  id: string
  title: string
  done: boolean
  origin: 'agenda' | 'manual'
}

type PlannerData = {
  appointments: Appointment[]
  tasks: TaskItem[]
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================
export default function WeeklyPlannerShell() {
  const [selectedDateKey, setSelectedDateKey] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  const [plannerData, setPlannerData] = useState<PlannerData>({
    appointments: [],
    tasks: [],
  })

  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null)

  // ======================================================
  // HIDRATAÇÃO INICIAL — sempre roda primeiro
  // ======================================================
  useEffect(() => {
    const todayKey = getBrazilDateKey(new Date())
    setSelectedDateKey(todayKey)

    const loadedAppointments = load('planner/appointments/all', []) ?? []
    const loadedTasks = load(`planner/tasks/${todayKey}`, []) ?? []

    setPlannerData({
      appointments: loadedAppointments,
      tasks: loadedTasks,
    })

    setIsHydrated(true)
  }, [])

  // ======================================================
  // PERSISTIR COMPROMISSOS
  // ======================================================
  useEffect(() => {
    if (!isHydrated) return
    save('planner/appointments/all', plannerData.appointments)
  }, [plannerData.appointments, isHydrated])

  // ======================================================
  // PERSISTIR TAREFAS DO DIA
  // ======================================================
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return
    save(`planner/tasks/${selectedDateKey}`, plannerData.tasks)
  }, [plannerData.tasks, selectedDateKey, isHydrated])

  // ======================================================
  // DERIVADOS — sempre declarados ANTES do return
  // ======================================================
  const selectedDate = useMemo(() => {
    if (!selectedDateKey) return new Date()
    const [y, m, d] = selectedDateKey.split('-').map(Number)
    return new Date(y, m - 1, d)
  }, [selectedDateKey])

  const todaysAppointments = useMemo(() => {
    return plannerData.appointments
      .filter(a => a.dateKey === selectedDateKey)
      .sort((a, b) => {
        if (!a.time) return 1
        if (!b.time) return -1
        return a.time.localeCompare(b.time)
      })
  }, [plannerData.appointments, selectedDateKey])
  // ======================================================
  // HANDLERS PRINCIPAIS
  // ======================================================
  const handleDateSelect = (day: Date) => {
    const key = getBrazilDateKey(day)
    setSelectedDateKey(key)

    const loadedTasks = load(`planner/tasks/${key}`, []) ?? []

    setPlannerData(prev => ({
      ...prev,
      tasks: loadedTasks,
    }))
  }

  const openModalForDate = (day: Date) => {
    setModalDate(day)
    setIsModalOpen(true)
  }

  const handleAddAppointment = (data: {
    dateKey: string
    title: string
    time: string
  }) => {
    const newItem: Appointment = {
      id: Math.random().toString(36).slice(2, 9),
      dateKey: data.dateKey,
      title: data.title.trim(),
      time: data.time,
    }

    setPlannerData(prev => ({
      ...prev,
      appointments: [...prev.appointments, newItem],
    }))

    const todayKey = getBrazilDateKey(new Date())

    if (data.dateKey === todayKey) {
      setPlannerData(prev => ({
        ...prev,
        tasks: [
          ...prev.tasks,
          {
            id: Math.random().toString(36).slice(2, 9),
            origin: 'agenda',
            done: false,
            title: `${data.time ? data.time + ' · ' : ''}${data.title}`,
          },
        ],
      }))
    }

    setIsModalOpen(false)
  }

  const handleUpdateAppointment = (updated: Appointment) => {
    setPlannerData(prev => ({
      ...prev,
      appointments: prev.appointments.map(a =>
        a.id === updated.id ? updated : a,
      ),
    }))

    setEditingAppointment(null)
  }

  const handleDeleteAppointment = (id: string) => {
    setPlannerData(prev => ({
      ...prev,
      appointments: prev.appointments.filter(a => a.id !== id),
    }))

    setEditingAppointment(null)
  }

  // ======================================================
  // BLOCO DE RENDERIZAÇÃO
  // ======================================================
  if (!isHydrated) return null

  return (
    <>
      <Reveal delay={120}>
        <div className="space-y-6 mt-4">

          {/* ================================================= */}
          {/* CALENDÁRIO */}
          {/* ================================================= */}
          <SoftCard className="p-4 rounded-3xl border bg-white shadow">
            <h2 className="font-semibold text-[var(--color-text-main)] mb-3">
              Calendário
            </h2>

            <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {generateMonthMatrix(selectedDate).map((day, idx) =>
                day ? (
                  <button
                    key={idx}
                    onClick={() => openModalForDate(day)}
                    className={`p-2 rounded-full border ${
                      getBrazilDateKey(day) === selectedDateKey
                        ? 'bg-[var(--color-brand)] text-white'
                        : 'bg-white hover:bg-[var(--color-soft-strong)]'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                ) : (
                  <div key={idx} />
                ),
              )}
            </div>
          </SoftCard>

          {/* ================================================= */}
          {/* AGENDA DO DIA */}
          {/* ================================================= */}
          <SoftCard className="p-4 rounded-3xl border bg-white shadow">
            <h2 className="font-semibold text-[var(--color-text-main)] mb-3">
              Compromissos do dia
            </h2>

            {todaysAppointments.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">
                Você não tem compromissos para este dia.
              </p>
            )}

            <div className="space-y-2">
              {todaysAppointments.map(app => (
                <button
                  key={app.id}
                  onClick={() => setEditingAppointment(app)}
                  className="w-full text-left p-2 border rounded-xl bg-white hover:bg-[var(--color-soft-strong)]"
                >
                  <p className="font-medium">{app.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {app.time || 'Sem horário definido'}
                  </p>
                </button>
              ))}
            </div>
          </SoftCard>

          {/* ================================================= */}
          {/* LEMBRETES RÁPIDOS */}
          {/* ================================================= */}
          <SoftCard className="p-4 rounded-3xl border bg-white shadow">
            <h2 className="font-semibold text-[var(--color-text-main)] mb-3">
              Lembretes rápidos
            </h2>

            <div className="space-y-2">
              {plannerData.tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() =>
                    setPlannerData(prev => ({
                      ...prev,
                      tasks: prev.tasks.map(t =>
                        t.id === task.id
                          ? { ...t, done: !t.done }
                          : t,
                      ),
                    }))
                  }
                  className={`w-full flex items-center gap-3 p-2 border rounded-xl ${
                    task.done
                      ? 'bg-[var(--color-soft-strong)] line-through text-[var(--color-text-muted)]'
                      : 'bg-white hover:bg-[var(--color-soft-strong)]'
                  }`}
                >
                  <span className="h-4 w-4 border rounded-full flex items-center justify-center">
                    {task.done ? '✓' : ''}
                  </span>
                  {task.title}
                </button>
              ))}
            </div>

            <QuickAddTaskInput
              onAdd={title =>
                setPlannerData(prev => ({
                  ...prev,
                  tasks: [
                    ...prev.tasks,
                    {
                      id: Math.random().toString(36).slice(2, 9),
                      done: false,
                      origin: 'manual',
                      title,
                    },
                  ],
                }))
              }
            />
          </SoftCard>
        </div>
      </Reveal>
      {/* ================================================= */}
      {/* MODAL — CRIAR */}
      {/* ================================================= */}
      {isModalOpen && modalDate && (
        <ModalAppointmentForm
          mode="create"
          initialDate={modalDate}
          onSave={handleAddAppointment}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      {/* ================================================= */}
      {/* MODAL — EDITAR */}
      {/* ================================================= */}
      {editingAppointment && (
        <ModalAppointmentForm
          mode="edit"
          initialDate={new Date(editingAppointment.dateKey)}
          initialData={editingAppointment}
          onSave={data =>
            handleUpdateAppointment({
              ...editingAppointment,
              dateKey: data.dateKey,
              title: data.title,
              time: data.time,
            })
          }
          onDelete={() => handleDeleteAppointment(editingAppointment.id)}
          onCancel={() => setEditingAppointment(null)}
        />
      )}
    </>
  )
}

// ======================================================
// COMPONENTE — INPUT DE NOVA TAREFA
// ======================================================
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
      <label className="text-xs font-medium">Adicionar lembrete</label>
      <input
        className="w-full border p-2 rounded-xl bg-white"
        placeholder="Ex: Levar material da escola"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </form>
  )
}

// ======================================================
// COMPONENTE — MODAL DE COMPROMISSO
// ======================================================
function ModalAppointmentForm({
  mode,
  initialDate,
  initialData,
  onSave,
  onDelete,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initialDate: Date
  initialData?: Appointment
  onSave: (data: { dateKey: string; title: string; time: string }) => void
  onDelete?: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [time, setTime] = useState(initialData?.time ?? '')
  const [dateKey, setDateKey] = useState(getBrazilDateKey(initialDate))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[900]">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-xl">
        <h3 className="text-lg font-semibold">
          {mode === 'create' ? 'Novo compromisso' : 'Editar compromisso'}
        </h3>

        <input
          type="date"
          value={dateKey}
          onChange={e => setDateKey(e.target.value)}
          className="w-full border p-2 rounded-xl"
        />

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border p-2 rounded-xl"
          placeholder="Título"
        />

        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="w-full border p-2 rounded-xl"
        />

        <div className="flex justify-between">
          {mode === 'edit' && onDelete && (
            <button className="text-red-500" onClick={onDelete}>
              Excluir
            </button>
          )}

          <div className="ml-auto flex gap-2">
            <button
              className="px-4 py-2 rounded-xl bg-gray-200"
              onClick={onCancel}
            >
              Cancelar
            </button>

            <button
              className="px-4 py-2 rounded-xl bg-[var(--color-brand)] text-white"
              onClick={() =>
                onSave({
                  dateKey,
                  title,
                  time,
                })
              }
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ======================================================
// FUNÇÃO — GERAR MATRIZ DO MÊS
// ======================================================
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
