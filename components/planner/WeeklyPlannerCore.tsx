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

// =======================================================
// TIPAGENS
// =======================================================
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

type WeekDaySummary = {
  dayNumber: number
  dayName: string
  agendaCount: number
  top3Count: number
  careCount: number
  familyCount: number
}

type MonthCell = {
  date: Date
  dateKey: string
  inMonth: boolean
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

  const weekKeys = new Set(weekDates.map((d) => getBrazilDateKey(d)))

  const agendaCountByKey: Record<string, number> = {}
  for (const a of plannerData.appointments) {
    if (!weekKeys.has(a.dateKey)) continue
    agendaCountByKey[a.dateKey] = (agendaCountByKey[a.dateKey] ?? 0) + 1
  }

  // Mantido como antes: counts do dia selecionado (tasks carregam por dia)
  const selectedKey = getBrazilDateKey(baseDate)
  const counts = { top3: 0, selfcare: 0, family: 0 }
  for (const t of plannerData.tasks) {
    if (t.origin === 'top3') counts.top3 += 1
    if (t.origin === 'selfcare') counts.selfcare += 1
    if (t.origin === 'family') counts.family += 1
  }

  return weekDates.map((d) => {
    const key = getBrazilDateKey(d)
    return {
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      agendaCount: agendaCountByKey[key] ?? 0,
      top3Count: key === selectedKey ? counts.top3 : 0,
      careCount: key === selectedKey ? counts.selfcare : 0,
      familyCount: key === selectedKey ? counts.family : 0,
    }
  })
}

function sortAppointments(list: Appointment[]) {
  const copy = [...list]
  copy.sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey)

    const at = a.time || ''
    const bt = b.time || ''
    if (!at && !bt) return 0
    if (!at) return 1
    if (!bt) return -1

    const [ah, am] = at.split(':').map(Number)
    const [bh, bm] = bt.split(':').map(Number)
    return ah !== bh ? ah - bh : am - bm
  })
  return copy
}

function dateLabel(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return dateKey
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR')
}

function toFirstOfMonth(d: Date) {
  const x = new Date(d)
  x.setDate(1)
  x.setHours(0, 0, 0, 0)
  return x
}

function addMonths(base: Date, delta: number) {
  const d = new Date(base)
  d.setMonth(d.getMonth() + delta)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function generateMonthMatrix(monthBase: Date): MonthCell[][] {
  const first = toFirstOfMonth(monthBase)
  const month = first.getMonth()
  const year = first.getFullYear()

  const start = startOfWeekMonday(first)

  const rows: MonthCell[][] = []
  for (let r = 0; r < 6; r++) {
    const row: MonthCell[] = []
    for (let c = 0; c < 7; c++) {
      const d = new Date(start)
      d.setDate(start.getDate() + r * 7 + c)
      const inMonth = d.getMonth() === month && d.getFullYear() === year
      row.push({
        date: d,
        dateKey: getBrazilDateKey(d),
        inMonth,
      })
    }
    rows.push(row)
  }
  return rows
}

// =======================================================
// ONBOARDING (cards fora dos cards) — 1º acesso
// =======================================================
const ONBOARDING_KEY = 'onboarding.meu-dia.v1'

function OnboardingOverlay({
  onClose,
}: {
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Como usar o Meu Dia">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fechar"
      />

      <div className="absolute left-1/2 top-[10%] w-[92%] max-w-md -translate-x-1/2 space-y-3">
        <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] p-4 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">Guia rápido</p>
          <h3 className="mt-1 text-base font-semibold text-[var(--color-text-main)]">Você não precisa “fazer tudo”.</h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
            Aqui é um espaço para organizar o que importa hoje — com leveza.
          </p>
        </SoftCard>

        <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
          <h4 className="text-sm font-semibold text-[var(--color-text-main)]">Lembretes do dia</h4>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--color-text-muted)]">
            <li>• Clique no <strong>+</strong> para criar um lembrete.</li>
            <li>• Toque no lembrete para marcar como feito.</li>
            <li>• Use <strong>⋮</strong> para editar ou excluir.</li>
          </ul>
        </SoftCard>

        <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
          <h4 className="text-sm font-semibold text-[var(--color-text-main)]">Compromissos (Agenda)</h4>
          <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
            Use o <strong>+</strong> da Agenda para registrar compromissos. Se preferir, toque no card final para abrir o calendário do mês.
          </p>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[var(--color-brand)] text-white px-4 py-2 text-xs font-semibold shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070]"
            >
              Entendi
            </button>
          </div>
        </SoftCard>
      </div>
    </div>
  )
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

  // P12 — Inteligência de Ritmo (reativa)
  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())

  const [showAllReminders, setShowAllReminders] = useState(false)
  const [showAllAppointments, setShowAllAppointments] = useState(false)

  // P13 — Continuidade (1x/dia, só hoje, sem cobrança)
  const [continuityLine, setContinuityLine] = useState<string>('')

  // Menu ⋮
  const [openTaskMenuId, setOpenTaskMenuId] = useState<string | null>(null)

  // Onboarding overlay (1ª vez)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const isGentleTone = euSignal.tone === 'gentil'

  const shortcutLabelTop3 = isGentleTone ? 'O que importa por agora' : 'O que realmente importa hoje'
  const shortcutLabelAgenda = isGentleTone ? 'Só registrar um combinado' : 'Compromissos e combinados'
  const shortcutLabelSelfcare = isGentleTone ? 'Um respiro pequeno' : 'Pequenos gestos de autocuidado'
  const shortcutLabelFamily = isGentleTone ? 'Um cuidado importante' : 'Momentos e cuidados importantes'

  const lessLine = 'Hoje pode ser menos — e ainda assim conta.'

  // Atualiza signal quando persona mudar (mesma aba via event custom; outra aba via storage)
  useEffect(() => {
    const refresh = () => {
      try {
        setEuSignal(getEu360Signal())
      } catch {}
    }

    const onStorage = (_e: StorageEvent) => refresh()
    const onCustom = () => refresh()

    try {
      window.addEventListener('storage', onStorage)
      window.addEventListener('eu360:persona-updated', onCustom as EventListener)
    } catch {}

    return () => {
      try {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener('eu360:persona-updated', onCustom as EventListener)
      } catch {}
    }
  }, [])

  // Reset do "mostrar tudo" quando troca o dia
  useEffect(() => {
    setShowAllReminders(false)
    setShowAllAppointments(false)
    setOpenTaskMenuId(null)
  }, [selectedDateKey])

  // Modal premium (create/edit)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [appointmentModalMode, setAppointmentModalMode] = useState<'create' | 'edit'>('create')
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  // Sheet premium: calendário mensal
  const [monthSheetOpen, setMonthSheetOpen] = useState(false)
  const [monthCursor, setMonthCursor] = useState<Date>(toFirstOfMonth(new Date()))

  // ======================================================
  // HYDRATION
  // ======================================================
  useEffect(() => {
    const dateKey = getBrazilDateKey(new Date())
    setSelectedDateKey(dateKey)
    setMonthCursor(toFirstOfMonth(new Date()))
    setIsHydrated(true)

    try {
      setEuSignal(getEu360Signal())
    } catch {}

    try {
      track('planner.opened', { tab: 'meu-dia', dateKey })
    } catch {}

    // Onboarding (1ª vez)
    try {
      const seen = window.localStorage.getItem(ONBOARDING_KEY)
      setShowOnboarding(!seen)
    } catch {
      setShowOnboarding(false)
    }
  }, [])

  const dismissOnboarding = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, '1')
    } catch {}
    setShowOnboarding(false)
  }, [])

  // ======================================================
  // LOAD DATA
  // ======================================================
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    const loadedAppointments = load<Appointment[]>('planner/appointments/all', []) ?? []
    const loadedTasks = load<TaskItem[]>(`planner/tasks/${selectedDateKey}`, []) ?? []
    const loadedNotes = load<string>(`planner/notes/${selectedDateKey}`, '') ?? ''

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
  // P13 — Continuidade (só para HOJE)
  // ======================================================
  const todayKey = useMemo(() => getBrazilDateKey(new Date()), [])

  useEffect(() => {
    if (!isHydrated) return

    if (!selectedDateKey || selectedDateKey !== todayKey) {
      setContinuityLine('')
      return
    }

    try {
      const res = getMyDayContinuityLine({
        dateKey: todayKey,
        tone: euSignal.tone ?? 'gentil',
      })
      setContinuityLine(res?.text ?? '')
    } catch {
      setContinuityLine('')
    }
  }, [isHydrated, selectedDateKey, todayKey, euSignal.tone])

  // ======================================================
  // ACTIONS
  // ======================================================
  const handleDateSelect = useCallback((date: Date) => {
    const key = getBrazilDateKey(date)
    setSelectedDateKey(key)
    setMonthCursor(toFirstOfMonth(date))

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

    setPlannerData((prev) => ({ ...prev, appointments: [...prev.appointments, a] }))

    try {
      track('planner.appointment_added', { tab: 'meu-dia', dateKey: data.dateKey })
    } catch {}

    try {
      void updateXP(6)
    } catch {}
  }, [])

  const updateAppointment = useCallback((updated: Appointment) => {
    setPlannerData((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) => (a.id === updated.id ? updated : a)),
    }))

    try {
      track('planner.appointment_updated', { tab: 'meu-dia', id: updated.id })
    } catch {}
  }, [])

  const deleteAppointment = useCallback((id: string) => {
    setPlannerData((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((a) => a.id !== id),
    }))

    try {
      track('planner.appointment_deleted', { tab: 'meu-dia', id })
    } catch {}
  }, [])

  const addTask = useCallback((title: string, origin: TaskOrigin) => {
    const normalizedTitle = (title ?? '').trim()
    if (!normalizedTitle) return

    const t: TaskItem = { id: safeId(), title: normalizedTitle, done: false, origin }
    setPlannerData((prev) => ({ ...prev, tasks: [...prev.tasks, t] }))

    try {
      track('planner.task_added', { tab: 'meu-dia', origin })
    } catch {}

    try {
      const base = origin === 'top3' || origin === 'selfcare' ? 8 : 5
      void updateXP(base)
    } catch {}
  }, [])

  const toggleTask = useCallback((id: string) => {
    setPlannerData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }))
  }, [])

  const editTask = useCallback((id: string, currentTitle: string) => {
    const next = window.prompt('Editar lembrete:', currentTitle)
    const normalized = (next ?? '').trim()
    if (!normalized) return

    setPlannerData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, title: normalized } : t)),
    }))

    try {
      track('planner.task_edited', { tab: 'meu-dia' })
    } catch {}
  }, [])

  const removeTask = useCallback((id: string) => {
    const ok = window.confirm('Excluir este lembrete?')
    if (!ok) return

    setPlannerData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }))

    try {
      track('planner.task_removed', { tab: 'meu-dia' })
    } catch {}
  }, [])

  // ======================================================
  // LEMBRETES (livre arbítrio)
  // ======================================================
  const promptReminder = useCallback(
    (opts?: { title?: string; placeholder?: string; origin?: TaskOrigin }) => {
      const message = opts?.title ?? 'O que você quer lembrar hoje?'
      const placeholder = opts?.placeholder ?? ''
      const origin = (opts?.origin ?? 'other') as TaskOrigin // ✅ nunca usar 'custom'/'outros'

      const text = window.prompt(message, placeholder)
      const normalized = (text ?? '').trim()
      if (!normalized) return

      addTask(normalized, origin)
    },
    [addTask],
  )

  // ======================================================
  // MODAL OPENERS
  // ======================================================
  const openCreateAppointmentModal = useCallback((dateKey?: string) => {
    setAppointmentModalMode('create')
    setEditingAppointment(null)
    if (dateKey) setSelectedDateKey(dateKey)
    setAppointmentModalOpen(true)

    try {
      track('planner.appointment_modal_opened', { tab: 'meu-dia', mode: 'create' })
    } catch {}
  }, [])

  const openEditAppointmentModal = useCallback((appt: Appointment) => {
    setAppointmentModalMode('edit')
    setEditingAppointment(appt)
    setSelectedDateKey(appt.dateKey)
    setMonthCursor(toFirstOfMonth(new Date(appt.dateKey + 'T00:00:00')))

    setAppointmentModalOpen(true)

    try {
      track('planner.appointment_modal_opened', { tab: 'meu-dia', mode: 'edit' })
    } catch {}
  }, [])

  const openMonthSheet = useCallback(() => {
    const base =
      selectedDateKey && /^\d{4}-\d{2}-\d{2}$/.test(selectedDateKey)
        ? new Date(selectedDateKey + 'T00:00:00')
        : new Date()

    setMonthCursor(toFirstOfMonth(base))
    setMonthSheetOpen(true)

    try {
      track('planner.month_sheet_opened', { tab: 'meu-dia' })
    } catch {}
  }, [selectedDateKey])

  // ======================================================
  // DERIVED
  // ======================================================
  const selectedDate = useMemo(() => {
    if (!selectedDateKey) return new Date()
    const [y, m, d] = selectedDateKey.split('-').map(Number)
    return new Date(y, m - 1, d)
  }, [selectedDateKey])

  const weekData = useMemo(() => buildWeekData(selectedDate, plannerData), [selectedDate, plannerData])

  const sortedAppointments = useMemo(() => sortAppointments(plannerData.appointments), [plannerData.appointments])

  const appointmentsByDateKey = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of plannerData.appointments) {
      map.set(a.dateKey, (map.get(a.dateKey) ?? 0) + 1)
    }
    return map
  }, [plannerData.appointments])

  const monthMatrix = useMemo(() => generateMonthMatrix(monthCursor), [monthCursor])

  if (!isHydrated) return null

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <>
      {showOnboarding && <OnboardingOverlay onClose={dismissOnboarding} />}

      <Reveal>
        <div className="space-y-6 md:space-y-8">
          <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] p-4 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={openMonthSheet}
                className="flex items-center gap-2 text-left group"
                aria-label="Abrir calendário do mês"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-soft-strong)]">
                  <AppIcon name="calendar" className="h-4 w-4 text-[var(--color-brand)]" />
                </span>
                <div>
                  <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                    Planner
                  </p>
                  <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] capitalize group-hover:text-[var(--color-brand)] transition-colors">
                    {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>
              </button>

              <div className="flex gap-2 bg-[var(--color-soft-bg)]/80 p-1 rounded-full">
                <button
                  type="button"
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all outline-none focus:outline-none focus-visible:outline-none ${
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
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all outline-none focus:outline-none focus-visible:outline-none ${
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

          {viewMode === 'week' && <WeekView weekData={weekData} />}

          {viewMode === 'day' && (
            <div className="space-y-6">
              {/* LEMBRETES */}
              <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] p-4 md:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                      Hoje
                    </p>
                    <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)]">Lembretes do dia</h3>
                    <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                      Um espaço leve para registrar o que importa — no seu ritmo.
                    </p>

                    {euSignal.showLessLine && (
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-2">{lessLine}</p>
                    )}

                    {!!continuityLine && (
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-2">{continuityLine}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      promptReminder({
                        title: 'O que você quer lembrar hoje?',
                        placeholder: '',
                        origin: 'other',
                      })
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070] transition-all"
                    aria-label="Adicionar lembrete"
                  >
                    +
                  </button>
                </div>

                <div className="space-y-2">
                  {plannerData.tasks.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Ainda não há lembretes para hoje. Se fizer sentido, registre uma coisinha só.
                    </p>
                  ) : (
                    (() => {
                      const limit = Math.max(1, Number(euSignal.listLimit) || 5)
                      const all = plannerData.tasks
                      const visible = showAllReminders ? all : all.slice(0, limit)
                      const hasMore = all.length > visible.length

                      return (
                        <>
                          {visible.map((task) => {
                            const menuOpen = openTaskMenuId === task.id

                            return (
                              <div
                                key={task.id}
                                className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-sm text-left transition-all relative ${
                                  task.done
                                    ? 'bg-[#FFE8F2] border-[#FFB3D3] text-[var(--color-text-muted)]'
                                    : 'bg-white border-[#F1E4EC] hover:border-[var(--color-brand)]/60 hover:bg-[#FFF3F8]'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleTask(task.id)}
                                  className="flex h-6 w-6 items-center justify-center"
                                  aria-label="Marcar como feito"
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
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleTask(task.id)}
                                  className={`flex-1 text-left ${task.done ? 'line-through opacity-70' : ''}`}
                                  aria-label="Alternar conclusão"
                                >
                                  {task.title}
                                </button>

                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenTaskMenuId((cur) => (cur === task.id ? null : task.id))}
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-black/5"
                                    aria-label="Abrir menu do lembrete"
                                  >
                                    ⋮
                                  </button>

                                  {menuOpen && (
                                    <div className="absolute right-0 top-9 z-10 w-36 rounded-2xl border border-[var(--color-soft-strong)] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] overflow-hidden">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenTaskMenuId(null)
                                          editTask(task.id, task.title)
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-main)] hover:bg-[var(--color-soft-bg)]"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenTaskMenuId(null)
                                          removeTask(task.id)
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-[#B42318] hover:bg-[#FFF1F1]"
                                      >
                                        Excluir
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}

                          {hasMore && !showAllReminders && (
                            <button
                              type="button"
                              onClick={() => setShowAllReminders(true)}
                              className="w-full rounded-2xl border border-[var(--color-soft-strong)] bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)]/50"
                            >
                              Mostrar o restante quando fizer sentido
                            </button>
                          )}

                          {showAllReminders && all.length > limit && (
                            <button
                              type="button"
                              onClick={() => setShowAllReminders(false)}
                              className="w-full rounded-2xl border border-[var(--color-soft-strong)] bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)]/50"
                            >
                              Voltar para a versão leve
                            </button>
                          )}
                        </>
                      )
                    })()
                  )}
                </div>

                {/* Atalhos */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      promptReminder({
                        title: 'O que realmente importa agora?',
                        placeholder: isGentleTone ? 'Ex.: separar 10 min para respirar' : 'Ex.: resolver uma coisa essencial',
                        origin: 'top3',
                      })
                    }
                    className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
                  >
                    {shortcutLabelTop3}
                  </button>

                  <button
                    type="button"
                    onClick={() => openCreateAppointmentModal(selectedDateKey)}
                    className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
                  >
                    {shortcutLabelAgenda}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      promptReminder({
                        title: 'Qual respiro pequeno cabe hoje?',
                        placeholder: 'Ex.: água, banho com calma, alongar 2 min…',
                        origin: 'selfcare',
                      })
                    }
                    className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
                  >
                    {shortcutLabelSelfcare}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      promptReminder({
                        title: 'Que cuidado importante você quer registrar?',
                        placeholder: 'Ex.: recado da escola, remédio, conversa…',
                        origin: 'family',
                      })
                    }
                    className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
                  >
                    {shortcutLabelFamily}
                  </button>
                </div>

                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Esses lembretes podem vir das trilhas do Maternar ou ser criados por você.
                </p>
              </SoftCard>

              {/* AGENDA & COMPROMISSOS */}
              <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] p-4 md:p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                      Agenda
                    </p>
                    <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">Compromissos</h3>
                    <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
                      Compromissos salvos no Materna360 (todos os dias).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCreateAppointmentModal(selectedDateKey)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070] transition-all"
                    aria-label="Adicionar compromisso"
                  >
                    +
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sortedAppointments.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-muted)]">Você ainda não marcou nenhum compromisso.</p>
                  ) : (
                    (() => {
                      const limit = Math.max(1, Number(euSignal.listLimit) || 5)
                      const all = sortedAppointments
                      const visible = showAllAppointments ? all : all.slice(0, limit)
                      const hasMore = all.length > visible.length

                      return (
                        <>
                          {visible.map((appt) => (
                            <button
                              key={appt.id}
                              type="button"
                              onClick={() => openEditAppointmentModal(appt)}
                              className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#F1E4EC] bg-white px-3 py-2 text-left hover:border-[var(--color-brand)]/60 hover:bg-[#FFF3F8]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-7 min-w-[44px] items-center justify-center rounded-full bg-[#FFE8F2] text-[11px] font-semibold text-[var(--color-brand)] px-2">
                                  {appt.time || '--:--'}
                                </span>

                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-[var(--color-text-main)]">
                                    {appt.title || 'Compromisso'}
                                  </span>
                                  <span className="text-[11px] text-[var(--color-text-muted)]">
                                    {appt.time ? `Horário: ${appt.time}` : 'Sem horário definido'} · {dateLabel(appt.dateKey)}
                                  </span>
                                </div>
                              </div>

                              <span className="text-[11px] text-[var(--color-text-muted)]">Editar</span>
                            </button>
                          ))}

                          {hasMore && !showAllAppointments && (
                            <button
                              type="button"
                              onClick={() => setShowAllAppointments(true)}
                              className="w-full rounded-2xl border border-[var(--color-soft-strong)] bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)]/50"
                            >
                              Mostrar o restante quando fizer sentido
                            </button>
                          )}

                          {showAllAppointments && all.length > limit && (
                            <button
                              type="button"
                              onClick={() => setShowAllAppointments(false)}
                              className="w-full rounded-2xl border border-[var(--color-soft-strong)] bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)]/50"
                            >
                              Voltar para a versão leve
                            </button>
                          )}
                        </>
                      )
                    })()
                  )}
                </div>
              </SoftCard>
            </div>
          )}

          {/* Card final: abre calendário do mês */}
          <SoftCard
            className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] p-4 md:p-6 cursor-pointer hover:bg-white"
            onClick={openMonthSheet}
          >
            <p className="text-center text-sm font-semibold text-[var(--color-text-main)]">
              Se fizer sentido, você pode revisar um dia anterior ou se organizar para o próximo.
            </p>
            <p className="mt-1 text-center text-[11px] text-[var(--color-text-muted)]">
              Toque aqui para abrir o calendário do planner.
            </p>
          </SoftCard>

          {/* Navegação dia anterior / próximo (mantida) */}
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

            <p className="mt-2 text-center text-[11px] text-[var(--color-text-muted)]">
              Se fizer sentido, você pode revisar um dia anterior ou se organizar para o próximo.
            </p>
          </SoftCard>
        </div>
      </Reveal>

      {/* Calendário do mês */}
      {monthSheetOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Calendário do mês">
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            onClick={() => setMonthSheetOpen(false)}
            aria-label="Fechar"
          />

          <div className="absolute left-1/2 top-[10%] w-[92%] max-w-md -translate-x-1/2">
            <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] p-4 md:p-5 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">Calendário</p>
                  <h3 className="text-base font-semibold text-[var(--color-text-main)] capitalize">
                    {monthCursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Toque em um dia para selecionar e já criar um compromisso.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-9 w-9 rounded-full border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)]"
                    onClick={() => setMonthCursor((prev) => addMonths(prev, -1))}
                    aria-label="Mês anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-full border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)]"
                    onClick={() => setMonthCursor((prev) => addMonths(prev, 1))}
                    aria-label="Próximo mês"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-[10px] font-semibold text-[var(--color-text-muted)] mb-2">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
                  <div key={d} className="text-center">
                    {d}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {monthMatrix.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-7 gap-2">
                    {row.map((cell) => {
                      const isSelected = cell.dateKey === selectedDateKey
                      const isToday = cell.dateKey === todayKey
                      const hasAppt = (appointmentsByDateKey.get(cell.dateKey) ?? 0) > 0

                      return (
                        <button
                          key={cell.dateKey}
                          type="button"
                          onClick={() => {
                            setSelectedDateKey(cell.dateKey)
                            setMonthCursor(toFirstOfMonth(cell.date))
                            setMonthSheetOpen(false)
                            openCreateAppointmentModal(cell.dateKey)
                          }}
                          className={`relative h-10 rounded-2xl border text-sm font-semibold transition-all ${
                            isSelected
                              ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-[0_10px_26px_rgba(253,37,151,0.35)]'
                              : cell.inMonth
                                ? 'bg-white text-[var(--color-text-main)] border-[var(--color-soft-strong)] hover:border-[var(--color-brand)]/60 hover:bg-[#FFF3F8]'
                                : 'bg-white/60 text-[var(--color-text-muted)] border-[var(--color-soft-strong)]'
                          }`}
                          aria-label={`Selecionar dia ${cell.date.toLocaleDateString('pt-BR')}`}
                        >
                          <span className="inline-flex items-center justify-center w-full">{cell.date.getDate()}</span>

                          {isToday && !isSelected && (
                            <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
                          )}

                          {hasAppt && (
                            <span
                              className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full ${
                                isSelected ? 'bg-white' : 'bg-[var(--color-brand)]'
                              }`}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date()
                    setSelectedDateKey(getBrazilDateKey(d))
                    setMonthCursor(toFirstOfMonth(d))
                    setMonthSheetOpen(false)
                  }}
                  className="rounded-full px-4 py-2 text-xs font-semibold border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)] text-[var(--color-text-main)]"
                >
                  Ir para hoje
                </button>

                <button
                  type="button"
                  onClick={() => setMonthSheetOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070]"
                >
                  Fechar
                </button>
              </div>
            </SoftCard>
          </div>
        </div>
      )}

      {/* Modal de compromissos */}
      <AppointmentModal
        open={appointmentModalOpen}
        mode={appointmentModalMode}
        initialDateKey={editingAppointment?.dateKey ?? selectedDateKey}
        initialTitle={editingAppointment?.title ?? ''}
        initialTime={editingAppointment?.time ?? ''}
        onClose={() => {
          setAppointmentModalOpen(false)
          setEditingAppointment(null)
        }}
        onSubmit={(data) => {
          if (appointmentModalMode === 'create') {
            addAppointment({
              dateKey: data.dateKey,
              title: data.title,
              time: data.time,
            })
          } else if (editingAppointment) {
            const updated: Appointment = {
              ...editingAppointment,
              dateKey: data.dateKey,
              title: data.title,
              time: data.time,
            }
            updateAppointment(updated)
          }

          setSelectedDateKey(data.dateKey)
          setMonthCursor(toFirstOfMonth(new Date(data.dateKey + 'T00:00:00')))

          try {
            track('planner.appointment_modal_saved', { tab: 'meu-dia', mode: appointmentModalMode })
          } catch {}

          setAppointmentModalOpen(false)
          setEditingAppointment(null)
        }}
        onDelete={
          appointmentModalMode === 'edit' && editingAppointment
            ? () => {
                const ok = window.confirm('Tem certeza que deseja excluir este compromisso? Essa ação não pode ser desfeita.')
                if (!ok) return

                deleteAppointment(editingAppointment.id)

                try {
                  track('planner.appointment_modal_deleted', { tab: 'meu-dia' })
                } catch {}

                setAppointmentModalOpen(false)
                setEditingAppointment(null)
              }
            : undefined
        }
      />
    </>
  )
}
