export function getDailyIndex(date: Date, total: number) {
  const startOfYear = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - startOfYear.getTime()
  const day = Math.floor(diff / 86_400_000)
  return total > 0 ? day % total : 0
}
