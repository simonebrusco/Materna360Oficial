const MS_PER_DAY = 86_400_000

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateKey = (dateKey: string): { year: number; month: number; day: number } | null => {
  if (typeof dateKey !== 'string' || dateKey.length === 0) {
    return null
  }

  const parts = dateKey.split('-')
  if (parts.length !== 3) {
    return null
  }

  const [yearRaw, monthRaw, dayRaw] = parts
  const year = Number.parseInt(yearRaw, 10)
  const month = Number.parseInt(monthRaw, 10)
  const day = Number.parseInt(dayRaw, 10)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  return { year, month, day }
}

const normalizeIndex = (value: number, total: number): number => {
  if (!Number.isFinite(value) || total <= 0) {
    return 0
  }

  const remainder = value % total
  return remainder < 0 ? (remainder + total) % total : remainder
}

export function getDayIndex(dateKey: string, total: number): number {
  if (total <= 0) {
    return 0
  }

  const parsed = parseDateKey(dateKey)
  if (!parsed) {
    return 0
  }

  const { year, month, day } = parsed
  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / MS_PER_DAY)

  return normalizeIndex(dayOfYear, total)
}

export function getDailyIndex(date: Date, total: number): number {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return 0
  }

  return getDayIndex(formatDateKey(date), total)
}
