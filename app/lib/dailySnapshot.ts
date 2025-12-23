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

/**
 * P26 — Anti-culpa
 * - streak/sequência NÃO é conceito de produto.
 * - Mantemos "streak" apenas por compatibilidade com código legado,
 *   mas o valor deve ser sempre 0.
 */
export type DailySnapshot = {
  dateKey: string
  mood?: string | null
  energy?: string | null
  notes?: string | null
  xpToday?: number
  totalXp?: number
  streak?: number // compat: sempre 0

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

  // P26: neutraliza streak caso algo antigo tenha persistido
  if (typeof snapshot.streak === 'number' && snapshot.streak !== 0) {
    snapshot.streak = 0
  }

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

  // P26: garante anti-culpa mesmo que algum caller mande streak
  merged.streak = 0

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

export function saveXpState(
  xpToday: number,
  totalXp: number,
  _streak: number, // compat: ignorado em P26
  dateKey = getBrazilDateKey(),
) {
  // P26: streak sempre 0
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
    // P26: mantém explicitamente 0 para evitar resquícios em UI/consumidores
    streak: 0,
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
    if (snap) {
      // P26: neutraliza streak no retorno, caso existam registros antigos
      if (typeof snap.streak === 'number' && snap.streak !== 0) snap.streak = 0
      snapshots.push(snap)
    }
  }

  return snapshots
}
