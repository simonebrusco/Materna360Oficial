export function monthsFromBirthdate(birthdate?: string | null): number | null {
  if (!birthdate) {
    return null
  }

  const parsed = new Date(birthdate)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const now = new Date()

  let months = (now.getFullYear() - parsed.getFullYear()) * 12
  months += now.getMonth() - parsed.getMonth()

  if (now.getDate() < parsed.getDate()) {
    months -= 1
  }

  return Math.max(0, months)
}
