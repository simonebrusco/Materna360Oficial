export const BRAZIL_TIMEZONE = 'America/Sao_Paulo'
export const BRAZIL_DATE_FORMAT_LOCALE = 'pt-BR'

type DateParts = Record<string, string>

export function getBrazilDateKey(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat(BRAZIL_DATE_FORMAT_LOCALE, {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date).reduce<DateParts>((acc, part) => {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
      acc[part.type] = part.value
    }
    return acc
  }, {})

  const year = parts.year
  const month = parts.month
  const day = parts.day

  if (!year || !month || !day) {
    throw new Error('Unable to compute Brazil date key')
  }

  return `${year}-${month}-${day}`
}
