function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeParseInt(v: string | null, fallback = 0) {
  const n = Number.parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

export const LS = {
  pointsTotal: 'mj_points_total',
  dayPrefix: 'mj_day_',
  // P26: streak removido (anti-culpa). Mantemos o app funcional sem mecânica de sequência.
}

export function todayKey() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function addDaysKey(date: Date, delta: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + delta)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function getWeekKeys(anchor = new Date()) {
  const keys: string[] = []
  for (let i = -6; i <= 0; i++) keys.push(addDaysKey(anchor, i))
  return keys
}

export function getMonthKeys(anchor = new Date()) {
  const keys: string[] = []
  for (let i = -27; i <= 0; i++) keys.push(addDaysKey(anchor, i))
  return keys
}

export function readDayPoints(key: string) {
  return safeParseInt(safeGetLS(LS.dayPrefix + key), 0)
}

export function readTotalPoints() {
  return safeParseInt(safeGetLS(LS.pointsTotal), 0)
}
