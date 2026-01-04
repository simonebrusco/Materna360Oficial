'use client'

const LS = {
  pointsTotal: 'mj_points_total',
  dayPrefix: 'mj_day_',
}

function safeGet(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  } catch {}
}

function toInt(v: string | null, fallback = 0) {
  const n = Number.parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

export function readMJTotalPoints(): number {
  return toInt(safeGet(LS.pointsTotal), 0)
}

export function readMJDayPoints(dateKey: string): number {
  return toInt(safeGet(LS.dayPrefix + dateKey), 0)
}

/**
 * Soma pontos no total + no dia (mj_day_YYYY-MM-DD).
 * Não expõe regra para UX — é infra.
 */
export function addMJPoints(delta: number, dateKey: string) {
  if (!Number.isFinite(delta) || delta === 0) return null

  const total = readMJTotalPoints()
  const day = readMJDayPoints(dateKey)

  const nextTotal = Math.max(0, total + delta)
  const nextDay = Math.max(0, day + delta)

  safeSet(LS.pointsTotal, String(nextTotal))
  safeSet(LS.dayPrefix + dateKey, String(nextDay))

  return { dateKey, delta, nextTotal, nextDay }
}

/**
 * QA only: zera total e o dia informado.
 */
export function resetMJPoints(dateKey: string) {
  safeSet(LS.pointsTotal, '0')
  safeSet(LS.dayPrefix + dateKey, '0')
}
