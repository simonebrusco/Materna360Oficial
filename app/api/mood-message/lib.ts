export type Mood = 'feliz' | 'leve' | 'neutra' | 'triste' | 'sobrecarregada'

export const QUOTES: Record<Mood, string[]> = {
  feliz: [
    'segure esse brilho e compartilhe quando puder.',
    'sua energia boa inspira quem está por perto.',
    'celebre as pequenas vitórias de hoje.',
    'que essa alegria te leve leve pelo dia.',
    'sua presença ilumina o ambiente.',
    'espalhe gentileza — ela volta.',
  ],
  leve: [
    'passos pequenos também contam.',
    'você já fez o mais difícil: começou.',
    'respeite seu ritmo — ele é seu.',
    'tudo bem fazer menos e sentir mais.',
    'uma pausa curta pode renovar sua energia.',
    'siga leve: o essencial está aqui.',
  ],
  neutra: [
    'dias neutros também fazem parte do caminho.',
    'nem todo dia precisa ser extraordinário.',
    'respire: está tudo bem não sentir tudo.',
    'o simples de hoje sustenta o amanhã.',
    'acolha o que couber; solte o resto.',
    'você está fazendo o suficiente.',
  ],
  triste: [
    'seja gentil consigo hoje.',
    'você não está só — peça colo quando precisar.',
    'tudo passa; cuide de você no agora.',
    'permita-se sentir sem se cobrar.',
    'uma conversa pode aliviar o peso.',
    'descanse: seu coração também precisa.',
  ],
  sobrecarregada: [
    'uma micro-pausa agora pode mudar o dia.',
    'delegar também é cuidar de si.',
    'priorize o essencial e respire.',
    'você não precisa dar conta de tudo hoje.',
    'dizer “não” também é dizer “sim” para você.',
    'divida o peso: peça ajuda onde couber.',
  ],
}

export const SUPPORTED_MOODS: Mood[] = ['feliz', 'leve', 'neutra', 'triste', 'sobrecarregada']

export function todayBR(sourceDate?: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(sourceDate ?? new Date())
}

export function firstNameOf(value?: string): string {
  if (!value) {
    return 'Mãe'
  }

  const first = value.trim().split(/\s+/)[0]
  if (!first) {
    return 'Mãe'
  }

  return first.charAt(0).toUpperCase() + first.slice(1)
}

export function hash(input: string): number {
  let result = 5381
  for (let index = 0; index < input.length; index += 1) {
    result = ((result << 5) + result) + input.charCodeAt(index)
  }

  return Math.abs(result)
}

export function selectQuote(mood: Mood, date: string, anonSeed: string): string {
  const pool = QUOTES[mood]
  const index = hash(`${date}|${mood}|${anonSeed}`) % pool.length
  return pool[index]
}

export function buildMoodQuote(options: { mood: Mood; date: string; anonSeed: string; motherName?: string }) {
  const { mood, date, anonSeed, motherName } = options
  const firstName = firstNameOf(motherName)
  const baseQuote = selectQuote(mood, date, anonSeed)
  return `${firstName}, ${baseQuote}`
}
