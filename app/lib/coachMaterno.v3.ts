'use client'

import { getCurrentDateKey } from './persist'

export type DayEntry = {
  date: string
  mood: number
  energy: number
  notes?: string
}

export type WeekDayData = {
  date: string
  mood: number
  energy: number
}

export type CoachContext = {
  todayEntry: DayEntry | null
  weekData: WeekDayData[]
  inactivity: {
    daysSinceLastEntry: number | null
  }
}

export type CoachMessage = {
  title: string
  body: string
  tone: 'calm' | 'encouraging' | 'celebrating'
  tags: string[]
  patternKey: string
}

type PatternKey = 'low_energy_week' | 'inactivity' | 'trend_up' | 'balanced' | 'no_data'

/**
 * Pure function to build a context-aware coach message
 * Uses only local heuristics and predefined text
 */
export function buildCoachMessage(ctx: CoachContext): CoachMessage {
  const weekData = ctx.weekData || []
  const hasEntries = weekData.length > 0
  const inactivityDays = ctx.inactivity?.daysSinceLastEntry ?? null

  // If no data at all and high inactivity, use no_data fallback
  if (!hasEntries && (inactivityDays === null || inactivityDays >= 3)) {
    return buildPatternNoData()
  }

  // If very few entries, still show data but note it
  if (hasEntries && weekData.length <= 2) {
    return buildPatternNoData()
  }

  // Calculate averages
  const avgMood = hasEntries ? weekData.reduce((s, d) => s + d.mood, 0) / weekData.length : 0
  const avgEnergy = hasEntries ? weekData.reduce((s, d) => s + d.energy, 0) / weekData.length : 0

  // Check for low energy/mood week
  if (avgMood < 2 && avgEnergy < 2) {
    return buildPatternLowEnergyWeek()
  }

  // Check for many blank days (inactivity)
  if (inactivityDays !== null && inactivityDays >= 3) {
    return buildPatternInactivity(inactivityDays)
  }

  // Check for upward trend (last 2-3 days > first 2-3 days)
  if (weekData.length >= 4) {
    const firstHalf = weekData.slice(0, Math.ceil(weekData.length / 2))
    const secondHalf = weekData.slice(Math.ceil(weekData.length / 2))

    const firstAvg = (firstHalf.reduce((s, d) => s + d.mood + d.energy, 0) / firstHalf.length) / 2
    const secondAvg = (secondHalf.reduce((s, d) => s + d.mood + d.energy, 0) / secondHalf.length) / 2

    if (secondAvg > firstAvg + 0.4) {
      return buildPatternTrendUp()
    }
  }

  // Default to balanced week
  return buildPatternBalanced(avgMood, avgEnergy)
}

function buildPatternLowEnergyWeek(): CoachMessage {
  return {
    title: 'Parece que sua semana foi bem puxada…',
    body: 'Energia e humor em baixa é um sinal de que você precisa de um descanso especial. Não é fraqueza, é você falando que merece acolhimento. Pequenos gestos de autocuidado — uma xícara de chá, um banho quentinho, cinco minutos respirando — fazem toda a diferença. Você não está sozinha nessa.',
    tone: 'calm',
    tags: ['semana puxada', 'autocuidado', 'acolhimento'],
    patternKey: 'low_energy_week',
  }
}

function buildPatternInactivity(daysSinceLastEntry: number): CoachMessage {
  const daysText = daysSinceLastEntry === 1 ? '1 dia' : `${daysSinceLastEntry} dias`
  return {
    title: 'Você não precisa registrar tudo…',
    body: `J�� faz ${daysText} que não registra, e está tudo bem. Não existe mãe perfeita que registra todos os dias. O que importa é que quando você consegue registrar, você se entende melhor. Sem culpa, tá? Que tal começar de novo hoje, justamente do jeito que você está agora?`,
    tone: 'encouraging',
    tags: ['sem culpa', 'recomeçar', 'pequenos passos'],
    patternKey: 'inactivity',
  }
}

function buildPatternTrendUp(): CoachMessage {
  return {
    title: 'Olha só como você está encontrando caminhos que funcionam…',
    body: 'Nos últimos dias você melhorou seu humor e sua energia. Isso não é coincidência: você está fazendo algo certo. Pode ser uma pausa maior, uma atividade legal, ou simplesmente ter respirado fundo. Que tal reconhecer o que te ajudou e tentar repetir? Pequenas rotinas que funcionam são ouro puro.',
    tone: 'celebrating',
    tags: ['progresso', 'pequenas vitórias', 'você consegue'],
    patternKey: 'trend_up',
  }
}

function buildPatternBalanced(avgMood: number, avgEnergy: number): CoachMessage {
  const moodLabel =
    avgMood >= 2.5 ? 'seu humor está bom' : 'seu humor está na média'
  const energyLabel =
    avgEnergy >= 2.5 ? 'sua energia equilibrada' : 'sua energia está presente'

  return {
    title: 'Sua semana parece ter sido mais equilibrada.',
    body: `Com ${moodLabel} e ${energyLabel}, você está construindo um ritmo mais consistente. Semanas assim são oportunidade: não é o auge, nem o vale, mas é o espaço seguro para pequenos passos. Aproveite para notar o que está funcionando e celebre essa estabilidade que você conquistou.`,
    tone: 'calm',
    tags: ['equilíbrio', 'consistência', 'você está no caminho'],
    patternKey: 'balanced',
  }
}

function buildPatternNoData(): CoachMessage {
  return {
    title: 'Ainda não temos muitos registros, e está tudo bem.',
    body: 'Cada entrada que você faz nos ajuda a entender melhor como você está. Não é sobre registrar tudo, é sobre registrar quando conseguir. Com os próximos registros, o Coach conseguirá trazer orientações muito mais personalizadas só para você. E a melhor parte? Você começa exatamente de onde está agora, sem cobrança, sem pressa.',
    tone: 'encouraging',
    tags: ['comece de onde está', 'sem cobrança', 'cada dia conta'],
    patternKey: 'no_data',
  }
}

/**
 * Get coach context from browser storage
 * Loads today's entry and last 7 days of mood data
 */
export function getCoachContextFromStorage(): CoachContext {
  try {
    if (typeof window === 'undefined') {
      return {
        todayEntry: null,
        weekData: [],
        inactivity: { daysSinceLastEntry: null },
      }
    }

    // Try to get today's entry from meu-dia:mood storage
    const moodRaw = typeof window !== 'undefined' ? window.localStorage.getItem('m360_mood_checkins') : null
    let moodEntries: DayEntry[] = []
    let todayEntry: DayEntry | null = null
    let lastEntryDate: string | null = null
    let daysSinceLastEntry: number | null = null

    if (moodRaw) {
      try {
        const parsed = JSON.parse(moodRaw)
        if (Array.isArray(parsed)) {
          moodEntries = parsed
          // Find today's entry
          const todayKey = getCurrentDateKey()
          const today = moodEntries.find((e) => e.date === todayKey)
          if (today) {
            todayEntry = today
          }

          // Calculate inactivity
          if (moodEntries.length > 0) {
            const sorted = [...moodEntries].sort((a, b) => (a.date < b.date ? 1 : -1))
            lastEntryDate = sorted[0].date
            const lastDate = new Date(lastEntryDate)
            const today = new Date(todayKey)
            const timeDiff = today.getTime() - lastDate.getTime()
            daysSinceLastEntry = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    // Get last 7 days
    const weekData = moodEntries.slice(-7).map((e) => ({
      date: e.date,
      mood: e.mood,
      energy: e.energy,
    }))

    return {
      todayEntry,
      weekData,
      inactivity: { daysSinceLastEntry },
    }
  } catch {
    return {
      todayEntry: null,
      weekData: [],
      inactivity: { daysSinceLastEntry: null },
    }
  }
}
