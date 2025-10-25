const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

export const BRAZIL_DATE_FORMAT_LOCALE = 'en-CA'

export function getBrazilDateKey(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat(BRAZIL_DATE_FORMAT_LOCALE, {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(date)
}
