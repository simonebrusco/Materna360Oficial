export function normalizeE164(raw: string, defaultCountry = '55') {
  if (!raw) return ''
  const digits = raw.replace(/\D+/g, '')
  if (!digits) return ''
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  if (digits.startsWith('+' )) return `+${digits.slice(1)}`
  if (digits.startsWith(defaultCountry)) return `+${digits}`
  return `+${defaultCountry}${digits}`
}

export function buildWaLink({
  phone,
  name,
  profession,
  selectedTopic,
  source = process.env.NEXT_PUBLIC_WA_SOURCE || 'materna360',
  medium = process.env.NEXT_PUBLIC_WA_MEDIUM || 'pros',
}: {
  phone: string
  name: string
  profession: string
  selectedTopic?: string
  source?: string
  medium?: string
}) {
  const normalized = normalizeE164(phone, process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || '55')
  if (!normalized) return ''
  const lines = [
    'Olá, vim do Materna360 e gostaria da primeira avaliação gratuita.',
    `Profissional: ${name} (${profession})`,
    selectedTopic ? `Tema/necessidade: ${selectedTopic}` : null,
    'Podemos conversar?',
  ].filter(Boolean) as string[]
  const msg = encodeURIComponent(lines.join('\n'))
  const url = `https://wa.me/${normalized}?text=${msg}`
  void source
  void medium
  return url
}
