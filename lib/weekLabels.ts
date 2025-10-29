const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function buildWeekLabels(startKey: string = ''): { labels: string[] } {
  const labels: string[] = []
  const base = new Date()
  const day = base.getDay()
  const mondayOffset = (day + 6) % 7
  const monday = new Date(base)
  monday.setDate(base.getDate() - mondayOffset)

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    labels.push(`${WEEKDAYS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}`)
  }
  return { labels }
}

export function getWeekStartKey(dateKey: string): string {
  return dateKey
}
