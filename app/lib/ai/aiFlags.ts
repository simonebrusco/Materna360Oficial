export function isAiEnabled() {
  if (typeof process !== 'undefined') {
    const raw = process.env.NEXT_PUBLIC_AI_ENABLED
    return raw === '1' || raw === 'true'
  }
  return false
}
