// app/lib/dailySnapshot.ts
import { getBrazilDateKey } from './dateKey'
import { save, load } from './persist'

// -------------------------------------------------------
// TYPES
// -------------------------------------------------------

export type DailyEmotionalInsight = {
  title: string
  body: string
  gentleReminder: string
  generatedAt: string
}

export type WeeklyEmotionalInsight = {
  summary: string
  bestDay: string
  toughDays: string
  generatedAt: string
}

export type DailySnapshot = {
  dateKey: string
  mood?: string | null
  energy?: string | null
  notes?: string | null

  xpToday?: number
  totalXp?: number

  /**
   * P26: streak não é conceito de produto (anti-culpa).
   * Mantido como campo opcional por compatibilidade de dados antigos,
   * mas a aplicação não deve persistir/usar isso.
   */
  streak?: number

  // Insights armazenados no snapshot
  insightDaily?: DailyEmotionalInsight
  insightWeekly?: WeeklyEmotionalInsight

  updatedAt: string
}

export type SnapshotUpdate = Partial<DailySnapshot>

// -------------------------------------------------------
// CONSTANTS
// -------------------------------------------------------

const SNAPSHOT_PREFIX = 'daily-snapshot:'

// -------------------------------------------------------
// CORE FUNCTIONS
// -------------------------------------------------------

export function getDailySnapshot(dateKey: string = getBrazilDateKey()): DailySnapshot {
  const snapshot =
    load<DailySnapshot>(`${SNAPSHOT_PREFIX}${dateKey}`) ??
    ({
      dateKey,
      updatedAt: new Date().toISOString(),
    } as DailySnapshot)

  return snapshot
}

export function updateDailySnapshot(
  update: SnapshotUpdate,
  dateKey: string = getBrazilDateKey(),
): DailySnapshot {
  const previous = getDailySnapshot(dateKey)

  const merged: DailySnapshot = {
    ...previous,
    ...update,
    dateKey,
    updatedAt: new Date().toISOString(),
  }

  save(`${SNAPSHOT_PREFIX}${dateKey}`, merged)
  return merged
}

// -------------------------------------------------------
// HIGH-LEVEL HELPERS (para o app usar diretamente)
// -------------------------------------------------------

export function saveMood(mood: string | null, dateKey = getBrazilDateKey()) {
  return updateDailySnapshot({ mood }, dateKey)
}

export function saveEnergy(energy: string | null, dateKey = getBrazilDateKey()) {
  return updateDailySnapshot({ energy }, dateKey)
}

export function saveNotes(notes: string, dateKey = getBrazilDateKey()) {
  return updateDailySnapshot({ notes }, dateKey)
}

/**
 * P26 — PRINCÍPIO ANTI-CULPA
 * A aplicação pode salvar estado de XP (hoje/total), mas NÃO deve persistir streak.
 * Mantemos a assinatura por compatibilidade temporária com chamadas existentes.
 */
export function saveXpState(
  xpToday: number,
  totalXp: number,
  _streak: number,
  dateKey = getBrazilDateKey(),
) {
  return updateDailySnapshot({ xpToday, totalXp, streak: 0 }, dateKey)
}

export function saveDailyInsight(
  insight: Omit<DailyEmotionalInsight, 'generatedAt'>,
  dateKey = getBrazilDateKey(),
) {
  return updateDailySnapshot(
    {
      insightDaily: {
        ...insight,
        generatedAt: new Date().toISOString(),
      },
    },
    dateKey,
  )
}

export function saveWeeklyInsight(
  insight: Omit<WeeklyEmotionalInsight, 'generatedAt'>,
  dateKey = getBrazilDateKey(),
) {
  return updateDailySnapshot(
    {
      insightWeekly: {
        ...insight,
        generatedAt: new Date().toISOString(),
      },
    },
    dateKey,
  )
}

export function resetDailySnapshot(dateKey = getBrazilDateKey()) {
  save(`${SNAPSHOT_PREFIX}${dateKey}`, {
    dateKey,
    updatedAt: new Date().toISOString(),
  } satisfies DailySnapshot)
}

// -------------------------------------------------------
// HISTORY HELPERS
// -------------------------------------------------------

export function getSnapshotsForMonth(year: number, month: number): DailySnapshot[] {
  const snapshots: DailySnapshot[] = []

  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const snap = load<DailySnapshot>(`${SNAPSHOT_PREFIX}${key}`)
    if (snap) snapshots.push(snap)
  }

  return snapshots
}
