const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

const parseDateKeyToUTC = (key: string): Date | null => {
  const [year, month, day] = key.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }

  return new Date(Date.UTC(year, month - 1, day, 12))
}

const formatShortLabel = (date: Date) => {
  const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    timeZone: BRAZIL_TIMEZONE,
  })
  const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    timeZone: BRAZIL_TIMEZONE,
  })

  const rawWeekday = weekdayFormatter.format(date).replace('.', '')
  const capitalized = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1)
  return `${capitalized} ${dayFormatter.format(date)}`
}

const formatLongLabel = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: BRAZIL_TIMEZONE,
  }).format(date)

const addDays = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + amount)
  return next
}

export const shiftDateKey = (key: string, amount: number): string => {
  const parsed = parseDateKeyToUTC(key)
  if (!parsed) {
    return key
  }

  const shifted = addDays(parsed, amount)
  return formatDateKey(shifted)
}

export const formatDateKey = (date: Date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getWeekStartKey = (dateKey: string): string => {
  const parsed = parseDateKeyToUTC(dateKey)
  if (!parsed) {
    return dateKey
  }

  const day = parsed.getUTCDay()
  const diff = (day + 6) % 7
  if (diff === 0) {
    return formatDateKey(parsed)
  }

  const start = addDays(parsed, -diff)
  return formatDateKey(start)
}

export type WeekLabel = {
  key: string
  shortLabel: string
  longLabel: string
}

export const buildWeekLabels = (weekStartKey: string): { weekStartKey: string; labels: WeekLabel[] } => {
  const startDate = parseDateKeyToUTC(weekStartKey)
  if (!startDate) {
    return { weekStartKey, labels: [] }
  }

  const labels: WeekLabel[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startDate, index)
    const key = formatDateKey(date)
    return {
      key,
      shortLabel: formatShortLabel(date),
      longLabel: formatLongLabel(date),
    }
  })

  return { weekStartKey: formatDateKey(startDate), labels }
}
