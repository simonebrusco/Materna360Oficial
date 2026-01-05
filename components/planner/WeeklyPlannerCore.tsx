'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { updateXP } from '@/app/lib/xp'

// usar o shape evolutivo do Meu Dia (compatível com Planner)
import type { MyDayTaskItem, TaskOrigin, TaskStatus } from '@/app/lib/myDayTasks.client'
import { MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

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
  tasks: MyDayTaskItem[]
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

  // Contagens do dia selecionado
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

function normalizeText(s: string) {
  return (s ?? '').trim().replace(/\s+/g, ' ')
}

// normaliza tasks antigas (que podem vir apenas com `done`)
function normalizeLoadedTasks(raw: any[]): MyDayTaskItem[] {
  const nowISO = new Date().toISOString()

  return (Array.isArray(raw) ? raw : [])
    .map((t: any) => {
      const title = typeof t?.title === 'string' ? t.title : ''
      if (!title) return null

      const origin: TaskOrigin =
        t?.origin === 'today' ||
        t?.origin === 'top3' ||
        t?.origin === 'agenda' ||
        t?.origin === 'family' ||
        t?.origin === 'selfcare' ||
        t?.origin === 'home' ||
        t?.origin === 'other' ||
        t?.origin === 'custom'
          ? t.origin
          : 'other'

      const id = typeof t?.id === 'string' && t.id ? t.id : safeId()

      const done = typeof t?.done === 'boolean' ? t.done : false
      const status: TaskStatus =
        t?.status === 'active' || t?.status === 'done' || t?.status === 'snoozed'
          ? t.status
          : done
            ? 'done'
            : 'active'

      const createdAt = typeof t?.createdAt === 'string' && t.createdAt ? t.createdAt : nowISO
      const source = typeof t?.source === 'string' && t.source ? t.source : MY_DAY_SOURCES.PLANNER

      return {
        id,
        title: normalizeText(title),
        origin,
        done: status === 'done',
        status,
        createdAt,
        source,
        snoozeUntil: typeof t?.snoozeUntil === 'string' ? t.snoozeUntil : undefined,
      } as MyDayTaskItem
    })
    .filter(Boolean) as MyDayTaskItem[]
}

/* ======================================================
   ONBOARDING — trilha contextual (desktop: mini-card; mobile: bottom sheet)
====================================================== */
type CoachStep = 'planner' | 'reminders' | 'appointments'
const COACH_KEY = 'm360_meudia_coach_v1'

function getIsMobileNow() {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia('(max-width: 768px)').matches
  } catch {
    return false
  }
}

function InfoDot({
  onClick,
  hidden,
  label = 'Ajuda',
}: {
  onClick: () => void
  hidden?: boolean
  label?: string
}) {
  if (hidden) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-soft-strong)] bg-white/85 hover:bg-[var(--color-soft-bg)] transition-colors"
      aria-label={label}
      title={label}
    >
      <span className="text-[12px] font-semibold text-[var(--color-brand)]">ⓘ</span>
    </button>
  )
}

function CoachMiniCard({
  title,
  lines,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  title: string
  lines: string[]
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: () => void
  onSecondary?: () => void
}) {
  return (
    <div className="absolute left-4 right-4 top-[68px] z-[55]">
      <div className="rounded-3xl border border-[var(--color-soft-strong)] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.18)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
              Primeiros passos
            </p>
            <h4 className="text-sm font-semibold text-[var(--color-text-main)] mt-1">{title}</h4>
          </div>

          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-soft-bg)] border border-[var(--color-soft-strong)]">
            <span className="text-[12px] font-semibold text-[var(--color-brand)]"></span>
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {lines.map((t, idx) => (
            <p key={idx} className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
              {t}
            </p>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {secondaryLabel && onSecondary ? (
            <button
              type="button"
              onClick={onSecondary}
              className="rounded-full px-4 py-2 text-xs font-semibold border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)] text-[var(--color-text-main)]"
            >
              {secondaryLabel}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onPrimary}
            className="rounded-full px-4 py-2 text-xs font-semibold bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070]"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function CoachBottomSheet({
  open,
  title,
  lines,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
}: {
  open: boolean
  title: string
  lines: string[]
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: () => void
  onSecondary?: () => void
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Ajuda do Meu Dia">
      <button
        type="button"
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fechar"
      />

      <div className="absolute left-1/2 bottom-4 w-[92%] max-w-md -translate-x-1/2">
        <div className="rounded-3xl border border-[var(--color-soft-strong)] bg-white shadow-[0_18px_70px_rgba(0,0,0,0.22)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                Primeiros passos
              </p>
              <h4 className="text-sm font-semibold text-[var(--color-text-main)] mt-1">{title}</h4>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-full border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)]"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {lines.map((t, idx) => (
              <p key={idx} className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
                {t}
              </p>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            {secondaryLabel && onSecondary ? (
              <button
                type="button"
                onClick={onSecondary}
                className="rounded-full px-4 py-2 text-xs font-semibold border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)] text-[var(--color-text-main)]"
              >
                {secondaryLabel}
              </button>
            ) : null}

            <button
              type="button"
              onClick={onPrimary}
              className="rounded-full px-4 py-2 text-xs font-semibold bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070]"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
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

  // P12 — Eu360 signal (reativo)
  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())

  /**
   * ✅ FIX CANÔNICO:
   * plannerLimit é o limitador único usado no Planner para:
   * - lembretes
   * - compromissos
   * (evita variáveis soltas e elimina "plannerLimit is not defined")
   */
  const plannerLimit = useMemo(() => {
    const raw = Number((euSignal as any)?.listLimit)
    const resolved = Number.isFinite(raw) ? raw : 5
    // clamp para manter experiência leve e estável
    return Math.max(3, Math.min(8, resolved))
  }, [euSignal])

  const [showAllReminders, setShowAllReminders] = useState(false)
  const [showAllAppointments, setShowAllAppointments] = useState(false)

  // P13 — Continuidade
  const [continuityLine, setContinuityLine] = useState<string>('')

  const isGentleTone = euSignal.tone === 'gentil'

  // (opcional) densidade: ajusta padding/typography de itens (linhas)
  const density = euSignal.density ?? 'normal'
  const rowPadClass = density === 'compact' ? 'py-1.5' : 'py-2'
  const rowTextClass = density === 'compact' ? 'text-[13px]' : 'text-sm'
  const subTextClass = density === 'compact' ? 'text-[10px]' : 'text-[11px]'

  const shortcutLabelTop3 = isGentleTone ? 'O que importa por agora' : 'O que realmente importa hoje'
  const shortcutLabelAgenda = isGentleTone ? 'Só registrar um combinado' : 'Compromissos e combinados'
  const shortcutLabelSelfcare = 'Como estou agora'
  const shortcutLabelFamily = isGentleTone ? 'Um cuidado importante' : 'Momentos e cuidados importantes'

  const lessLine = 'Hoje pode ser menos — e ainda assim conta.'

  // Atualiza signal quando persona/prefs mudar
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
      window.addEventListener('eu360:prefs-updated', onCustom as EventListener)
    } catch {}

    return () => {
      try {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener('eu360:persona-updated', onCustom as EventListener)
        window.removeEventListener('eu360:prefs-updated', onCustom as EventListener)
      } catch {}
    }
  }, [])

  useEffect(() => {
    setShowAllReminders(false)
    setShowAllAppointments(false)
  }, [selectedDateKey])

  // Modal premium (create/edit)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [appointmentModalMode, setAppointmentModalMode] = useState<'create' | 'edit'>('create')
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  // Sheet premium: calendário mensal
  const [monthSheetOpen, setMonthSheetOpen] = useState(false)
  const [monthCursor, setMonthCursor] = useState<Date>(toFirstOfMonth(new Date()))

  // ---------- Modal reutilizado (lembrete OU check-in silencioso) ----------
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [reminderDraft, setReminderDraft] = useState('')
  const [reminderOrigin, setReminderOrigin] = useState<TaskOrigin>('other')
  const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState('')
  const [isCheckinMode, setIsCheckinMode] = useState(false)

  // ---------- Onboarding contextual ----------
  const [coachStep, setCoachStep] = useState<CoachStep | null>(null)
  const [coachEnabled, setCoachEnabled] = useState(false)
  const [isMobileCoach, setIsMobileCoach] = useState(false)

  const markCoachDone = useCallback(() => {
    try {
      localStorage.setItem(COACH_KEY, '1')
    } catch {}
    setCoachEnabled(false)
    setCoachStep(null)
  }, [])

  const openCoach = useCallback((step: CoachStep) => {
    setCoachStep(step)
    setCoachEnabled(true)
  }, [])

  const nextCoach = useCallback(() => {
    setCoachStep((prev) => {
      if (prev === 'planner') return 'reminders'
      if (prev === 'reminders') return 'appointments'
      if (prev === 'appointments') return null
      return 'planner'
    })
  }, [])

  const closeCoach = useCallback(() => {
    setCoachEnabled(false)
    setCoachStep(null)
  }, [])

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

    // onboarding: apenas 1ª vez
    try {
      const seen = localStorage.getItem(COACH_KEY)
      if (!seen) {
        setCoachEnabled(true)
        setCoachStep('planner')
      }
    } catch {}
  }, [])

  useEffect(() => {
    setIsMobileCoach(getIsMobileNow())
    if (typeof window === 'undefined') return

    const onResize = () => setIsMobileCoach(getIsMobileNow())
    try {
      window.addEventListener('resize', onResize)
    } catch {}

    return () => {
      try {
        window.removeEventListener('resize', onResize)
      } catch {}
    }
  }, [])

  // ======================================================
  // LOAD DATA
  // ======================================================
  useEffect(() => {
    if (!isHydrated || !selectedDateKey) return

    const loadedAppointments = load<Appointment[]>('planner/appointments/all', []) ?? []
    const rawTasks = load<any[]>(`planner/tasks/${selectedDateKey}`, []) ?? []
    const loadedNotes = load<string>(`planner/notes/${selectedDateKey}`, '') ?? ''

    const loadedTasks = normalizeLoadedTasks(rawTasks)

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
  // P13 — Continuidade (só HOJE)
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

  const addTask = useCallback(
    (title: string, origin: TaskOrigin) => {
      const normalizedTitle = normalizeText(title)
      if (!normalizedTitle) return

      // evita duplicado igual (título + origin)
      const exists = plannerData.tasks.some(
        (t) => normalizeText(t.title).toLowerCase() === normalizedTitle.toLowerCase() && t.origin === origin,
      )
      if (exists) return

      const nowISO = new Date().toISOString()

      const t: MyDayTaskItem = {
        id: safeId(),
        title: normalizedTitle,
        origin,
        done: false,
        status: 'active',
        createdAt: nowISO,
        source: MY_DAY_SOURCES.PLANNER,
      }

      setPlannerData((prev) => ({ ...prev, tasks: [...prev.tasks, t] }))

      try {
        track('planner.task_added', { tab: 'meu-dia', origin, source: MY_DAY_SOURCES.PLANNER })
      } catch {}

      try {
        const base = origin === 'top3' || origin === 'selfcare' ? 8 : 5
        void updateXP(base)
      } catch {}
    },
    [plannerData.tasks],
  )

  const toggleTask = useCallback((id: string) => {
    setPlannerData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t
        const nextDone = !(t.done === true)
        const nextStatus: TaskStatus = nextDone ? 'done' : 'active'
        return { ...t, done: nextDone, status: nextStatus }
      }),
    }))
  }, [])

  const removeTask = useCallback((id: string) => {
    setPlannerData((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }))
  }, [])

  const beginEditTask = useCallback((task: MyDayTaskItem) => {
    setEditingTaskId(task.id)
    setEditingDraft(task.title ?? '')
    setOpenMenuTaskId(null)
  }, [])

  const commitEditTask = useCallback(() => {
    const next = normalizeText(editingDraft)
    const id = editingTaskId
    if (!id) return
    if (!next) return

    setPlannerData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, title: next } : t)),
    }))

    setEditingTaskId(null)
    setEditingDraft('')
  }, [editingDraft, editingTaskId])

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

  // ======================================================
  // REMINDER/CHECK-IN MODAL ACTIONS
  // ======================================================
  const closeReminderModal = useCallback(() => {
    setReminderModalOpen(false)
    setReminderDraft('')
    setIsCheckinMode(false)
  }, [])

  const openReminderModal = useCallback((origin: TaskOrigin, seed?: string) => {
    setIsCheckinMode(false)
    setReminderOrigin(origin)
    setReminderDraft(seed ?? '')
    setReminderModalOpen(true)

    try {
      track('planner.reminder_modal_opened', { tab: 'meu-dia', origin })
    } catch {}
  }, [])

  const openCheckinModal = useCallback(() => {
    setIsCheckinMode(true)
    setReminderOrigin('selfcare') // não cria origin novo (evita erro de tipos)
    setReminderDraft('')
    setReminderModalOpen(true)

    try {
      track('planner.checkin_opened', { tab: 'meu-dia' })
    } catch {}
  }, [])

  const submitReminder = useCallback(() => {
    const text = normalizeText(reminderDraft)
    if (!text) return
    addTask(text, reminderOrigin)
    setReminderDraft('')
    setReminderModalOpen(false)

    try {
      track('planner.reminder_created', { tab: 'meu-dia', origin: reminderOrigin })
    } catch {}
  }, [addTask, reminderDraft, reminderOrigin])

  type CheckinSignal = 'heavy' | 'tired' | 'overwhelmed' | 'neutral'

  const commitCheckin = useCallback(
    (selectedSignal: CheckinSignal) => {
      try {
        localStorage.setItem('m360.my_day.last_signal.v1', selectedSignal)
      } catch {}

      try {
        track('planner.checkin_selected', { tab: 'meu-dia', value: selectedSignal })
      } catch {}

      closeReminderModal()
    },
    [closeReminderModal],
  )

  // ======================================================
  // COACH CONTENT
  // ======================================================
  const coachContent = useMemo(() => {
    const common = {
      planner: {
        title: 'Calendário do Planner',
        lines: [
          'Aqui você escolhe um dia e já cria um compromisso — sem precisar “planejar tudo”.',
          'Se quiser, comece só registrando um combinado. Isso já organiza seu dia.',
        ],
      },
      reminders: {
        title: 'Lembretes do dia',
        lines: [
          'Registre pequenas coisas que importam hoje. Uma frase curta já é suficiente.',
          'Você pode marcar como feito e usar o menu “⋮” para editar ou excluir.',
        ],
      },
      appointments: {
        title: 'Compromissos',
        lines: [
          'Aqui ficam seus combinados e horários do Materna360.',
          'Toque em um compromisso para editar, ajustar horário ou excluir.',
        ],
      },
    }

    if (!coachStep) return null
    if (coachStep === 'planner') return common.planner
    if (coachStep === 'reminders') return common.reminders
    return common.appointments
  }, [coachStep])

  const coachPrimaryLabel = useMemo(() => {
    if (!coachStep) return 'Entendi'
    if (coachStep === 'appointments') return 'Entendi'
    return 'Próximo'
  }, [coachStep])

  const coachSecondaryLabel = useMemo(() => {
    if (!coachStep) return undefined
    return 'Fechar'
  }, [coachStep])

  const onCoachPrimary = useCallback(() => {
    if (!coachStep) return
    if (coachStep === 'appointments') {
      markCoachDone()
      return
    }
    nextCoach()
  }, [coachStep, markCoachDone, nextCoach])

  const onCoachSecondary = useCallback(() => {
    closeCoach()
  }, [closeCoach])

  const shouldRenderCoach = coachEnabled && !!coachStep && !!coachContent

  // ======================================================
  // RENDER
  // ======================================================
  if (!isHydrated) return null

  return (
    <>
      <Reveal>
        <div className="space-y-6 md:space-y-8">
          {/* HEADER / CONTROLES */}
          <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] p-4 md:p-6 relative">
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

              <div className="flex items-center gap-2">
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

                <InfoDot
                  hidden={!shouldRenderCoach || coachStep !== 'planner' ? true : false}
                  onClick={() => openCoach('planner')}
                  label="Como usar o calendário"
                />
              </div>
            </div>

            {shouldRenderCoach && coachStep === 'planner' && !isMobileCoach && coachContent ? (
              <CoachMiniCard
                title={coachContent.title}
                lines={coachContent.lines}
                primaryLabel={coachPrimaryLabel}
                secondaryLabel={coachSecondaryLabel}
                onPrimary={onCoachPrimary}
                onSecondary={onCoachSecondary}
              />
            ) : null}
          </SoftCard>

          {viewMode === 'week' && <WeekView weekData={weekData} />}

          {viewMode === 'day' && (
            <div className="space-y-6">
              {/* LEMBRETES */}
              <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] p-4 md:p-6 space-y-4 relative">
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

                  <div className="flex items-center gap-2">
                    {shouldRenderCoach && <InfoDot onClick={() => openCoach('reminders')} label="Como usar lembretes" />}

                    <button
                      type="button"
                      onClick={() => openReminderModal('other')}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070] transition-all"
                      aria-label="Adicionar lembrete"
                    >
                      +
                    </button>
                  </div>
                </div>

                {shouldRenderCoach && coachStep === 'reminders' && !isMobileCoach && coachContent ? (
                  <CoachMiniCard
                    title={coachContent.title}
                    lines={coachContent.lines}
                    primaryLabel={coachPrimaryLabel}
                    secondaryLabel={coachSecondaryLabel}
                    onPrimary={onCoachPrimary}
                    onSecondary={onCoachSecondary}
                  />
                ) : null}

                <div className="space-y-2">
                  {plannerData.tasks.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Ainda não há lembretes para hoje. Se fizer sentido, registre uma coisinha só.
                    </p>
                  ) : (
                    (() => {
                      const limit = plannerLimit
                      const all = plannerData.tasks
                      const visible = showAllReminders ? all : all.slice(0, limit)
                      const hasMore = all.length > visible.length

                      return (
                        <>
                          {visible.map((task) => {
                            const isEditing = editingTaskId === task.id
                            const isMenuOpen = openMenuTaskId === task.id

                            return (
                              <div
                                key={task.id}
                                className={`w-full flex items-center gap-3 rounded-xl border px-3 ${rowPadClass} ${rowTextClass} text-left transition-all ${
                                  task.done
                                    ? 'bg-[#FFE8F2] border-[#FFB3D3] text-[var(--color-text-muted)]'
                                    : 'bg-white border-[#F1E4EC] hover:border-[var(--color-brand)]/60 hover:bg-[#FFF3F8]'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleTask(task.id)}
                                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                                    task.done
                                      ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                                      : 'border-[#FFB3D3] text-[var(--color-brand)]'
                                  }`}
                                  aria-label={task.done ? 'Marcar como não feito' : 'Marcar como feito'}
                                >
                                  {task.done ? '✓' : ''}
                                </button>

                                <div className="flex-1 min-w-0">
                                  {isEditing ? (
                                    <input
                                      value={editingDraft}
                                      onChange={(e) => setEditingDraft(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') commitEditTask()
                                        if (e.key === 'Escape') {
                                          setEditingTaskId(null)
                                          setEditingDraft('')
                                        }
                                      }}
                                      className="w-full rounded-lg border border-[var(--color-soft-strong)] px-2 py-1 text-sm outline-none focus:border-[var(--color-brand)]"
                                      autoFocus
                                      aria-label="Editar lembrete"
                                    />
                                  ) : (
                                    <span className={`block truncate ${task.done ? 'line-through opacity-70' : ''}`}>
                                      {task.title}
                                    </span>
                                  )}
                                </div>

                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={commitEditTask}
                                      className="rounded-full px-3 py-1 text-xs font-semibold bg-[var(--color-brand)] text-white hover:bg-[#e00070]"
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTaskId(null)
                                        setEditingDraft('')
                                      }}
                                      className="rounded-full px-3 py-1 text-xs font-semibold border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)]"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setOpenMenuTaskId((v) => (v === task.id ? null : task.id))}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-soft-strong)] bg-white/80 hover:bg-[var(--color-soft-bg)]"
                                      aria-label="Opções do lembrete"
                                    >
                                      ⋮
                                    </button>

                                    {isMenuOpen && (
                                      <>
                                        <button
                                          type="button"
                                          className="fixed inset-0 z-[70] cursor-default"
                                          onClick={() => setOpenMenuTaskId(null)}
                                          aria-label="Fechar menu"
                                        />
                                        <div className="absolute right-0 top-9 z-[80] w-44 overflow-hidden rounded-2xl border border-[var(--color-soft-strong)] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                                          <button
                                            type="button"
                                            onClick={() => beginEditTask(task)}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-main)] hover:bg-[var(--color-soft-bg)]"
                                          >
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenMenuTaskId(null)
                                              removeTask(task.id)
                                              try {
                                                track('planner.task_removed', { tab: 'meu-dia' })
                                              } catch {}
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs font-semibold text-[#B42318] hover:bg-[#FFF5F5]"
                                          >
                                            Excluir
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
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
                      openReminderModal(
                        'top3',
                        isGentleTone ? 'Ex.: separar 10 min para respirar' : 'Ex.: resolver uma coisa essencial',
                      )
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
                    onClick={openCheckinModal}
                    className="rounded-2xl bg-white/80 border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
                  >
                    {shortcutLabelSelfcare}
                  </button>

                  <button
                    type="button"
                    onClick={() => openReminderModal('family', 'Ex.: recado da escola, remédio, conversa…')}
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
              <SoftCard className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] p-4 md:p-6 relative">
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

                  <div className="flex items-center gap-2">
                    {shouldRenderCoach && (
                      <InfoDot onClick={() => openCoach('appointments')} label="Como usar compromissos" />
                    )}

                    <button
                      type="button"
                      onClick={() => openCreateAppointmentModal(selectedDateKey)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070] transition-all"
                      aria-label="Adicionar compromisso"
                    >
                      +
                    </button>
                  </div>
                </div>

                {shouldRenderCoach && coachStep === 'appointments' && !isMobileCoach && coachContent ? (
                  <CoachMiniCard
                    title={coachContent.title}
                    lines={coachContent.lines}
                    primaryLabel={coachPrimaryLabel}
                    secondaryLabel={coachSecondaryLabel}
                    onPrimary={onCoachPrimary}
                    onSecondary={onCoachSecondary}
                  />
                ) : null}

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sortedAppointments.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Nenhum compromisso por aqui hoje. Se fizer sentido, você pode registrar algo — ou só deixar assim.
                    </p>
                  ) : (
                    (() => {
                      const limit = plannerLimit
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
                              className={`w-full flex items-center justify-between gap-3 rounded-xl border border-[#F1E4EC] bg-white px-3 ${rowPadClass} text-left hover:border-[var(--color-brand)]/60 hover:bg-[#FFF3F8]`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-7 min-w-[44px] items-center justify-center rounded-full bg-[#FFE8F2] text-[11px] font-semibold text-[var(--color-brand)] px-2">
                                  {appt.time || '--:--'}
                                </span>

                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-[var(--color-text-main)]">
                                    {appt.title || 'Compromisso'}
                                  </span>
                                  <span className={`${subTextClass} text-[var(--color-text-muted)]`}>
                                    {appt.time ? `Horário: ${appt.time}` : 'Sem horário definido'} ·{' '}
                                    {dateLabel(appt.dateKey)}
                                  </span>
                                </div>
                              </div>

                              <span className={`${subTextClass} text-[var(--color-text-muted)]`}>Editar</span>
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

          {/* Card de navegação dia anterior/próximo */}
          <SoftCard
            className="rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] p-4 md:p-6 cursor-pointer hover:bg-white/100 transition-colors"
            onClick={openMonthSheet}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="h-9 w-9 rounded-full border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)]"
                onClick={(e) => {
                  e.stopPropagation()
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
                onClick={(e) => {
                  e.stopPropagation()
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
              Toque no centro para abrir o calendário do planner.
            </p>
          </SoftCard>
        </div>
      </Reveal>

      {/* COACH — mobile bottom sheet */}
      {shouldRenderCoach && isMobileCoach && coachContent ? (
        <CoachBottomSheet
          open={true}
          title={coachContent.title}
          lines={coachContent.lines}
          primaryLabel={coachPrimaryLabel}
          secondaryLabel={coachSecondaryLabel}
          onPrimary={onCoachPrimary}
          onSecondary={onCoachSecondary}
          onClose={closeCoach}
        />
      ) : null}

      {/* MODAL: adicionar lembrete OU check-in silencioso */}
      {reminderModalOpen && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Modal">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            onClick={closeReminderModal}
            aria-label="Fechar"
          />

          <div className="absolute left-1/2 top-[16%] w-[92%] max-w-md -translate-x-1/2">
            <SoftCard className="rounded-3xl bg-white border border-[var(--color-soft-strong)] p-4 md:p-5 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
              {isCheckinMode ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                        Check-in
                      </p>
                      <h3 className="text-base font-semibold text-[var(--color-text-main)]">
                        Como você está agora?
                      </h3>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        Só um toque para se reconhecer. Nada além disso.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeReminderModal}
                      className="h-9 w-9 rounded-full border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)]"
                      aria-label="Fechar"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => commitCheckin('heavy')}
                      className="rounded-2xl bg-white border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
                    >
                      Pesado
                    </button>

                    <button
                      type="button"
                      onClick={() => commitCheckin('tired')}
                      className="rounded-2xl bg-white border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
                    >
                      Cansada
                    </button>

                    <button
                      type="button"
                      onClick={() => commitCheckin('overwhelmed')}
                      className="rounded-2xl bg-white border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
                    >
                      Sobrecarregada
                    </button>

                    <button
                      type="button"
                      onClick={() => commitCheckin('neutral')}
                      className="rounded-2xl bg-white border border-[var(--color-soft-strong)] px-3 py-3 text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-brand)]/60"
                    >
                      Neutro
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={closeReminderModal}
                      className="rounded-full px-4 py-2 text-xs font-semibold border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)] text-[var(--color-text-main)]"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                        Lembrete
                      </p>
                      <h3 className="text-base font-semibold text-[var(--color-text-main)]">
                        O que você quer registrar?
                      </h3>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        Uma frase curta já ajuda. Sem perfeição.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeReminderModal}
                      className="h-9 w-9 rounded-full border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)]"
                      aria-label="Fechar"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    <input
                      value={reminderDraft}
                      onChange={(e) => setReminderDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitReminder()
                        if (e.key === 'Escape') closeReminderModal()
                      }}
                      placeholder="Ex.: separar 10 min para respirar"
                      className="w-full rounded-2xl border border-[var(--color-soft-strong)] px-3 py-3 text-sm outline-none focus:border-[var(--color-brand)]"
                      autoFocus
                    />

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={closeReminderModal}
                        className="rounded-full px-4 py-2 text-xs font-semibold border border-[var(--color-soft-strong)] hover:bg-[var(--color-soft-bg)] text-[var(--color-text-main)]"
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={submitReminder}
                        className="rounded-full px-4 py-2 text-xs font-semibold bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.35)] hover:bg-[#e00070]"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </SoftCard>
          </div>
        </div>
      )}

      {/* SHEET: calendário do mês */}
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
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                    Calendário
                  </p>
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
