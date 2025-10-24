export function getFirstName(fullName?: string | null): string {
  if (!fullName) {
    return ''
  }

  const trimmed = fullName.trim().replace(/\s+/g, ' ')
  if (!trimmed) {
    return ''
  }

  const [first] = trimmed.split(' ')
  return first ?? ''
}
