export function getBrazilDateKey(d: Date = new Date()): string {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000
  const br = new Date(utc - 3 * 3600000)
  const y = br.getFullYear()
  const m = String(br.getMonth() + 1).padStart(2, '0')
  const dd = String(br.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
