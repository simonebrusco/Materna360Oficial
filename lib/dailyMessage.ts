export function getDayIndex(dateKey: string, total: number): number {
  if (total === 0) return 0
  const [, m, d] = dateKey.split('-')
  const day = parseInt(d, 10)
  return (day - 1) % total
}
