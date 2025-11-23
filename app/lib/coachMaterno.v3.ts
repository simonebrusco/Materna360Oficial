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
    body: 'Pelos seus registros, dá para sentir que o cansaço esteve bem presente nos últimos dias. E está tudo bem se você não deu conta de tudo. Isso não significa falta de amor nem de dedicação, só mostra que você é humana.\n\nSe puder, escolha hoje um pequeno gesto de autocuidado: alguns minutos em silêncio, um banho mais demorado, pedir ajuda em uma tarefa. Pequenas pausas não são egoísmo, são recarga. Você merece esse descanso.',
    tone: 'calm',
    tags: ['semana puxada', 'autocuidado', 'acolhimento'],
    patternKey: 'low_energy_week',
  }
}

function buildPatternInactivity(daysSinceLastEntry: number): CoachMessage {
  return {
    title: 'Você não precisa registrar tudo, só não precisa fazer isso sozinha.',
    body: 'Notei que seus registros diminuíram nos últimos dias, e isso é mais comum do que parece. A rotina é corrida, a mente fica cheia e a gente simplesmente esquece de cuidar da gente.\n\nEm vez de se cobrar, que tal encarar hoje como um recomeço leve? Um único registro já é suficiente para retomar o hábito. Comece pequeno, sem perfeição, do jeitinho que dá hoje.',
    tone: 'encouraging',
    tags: ['sem culpa', 'recomeçar', 'pequenos passos'],
    patternKey: 'inactivity',
  }
}

function buildPatternTrendUp(): CoachMessage {
  return {
    title: 'Olha só como você está encontrando caminhos que funcionam.',
    body: 'Os seus últimos registros mostram uma melhora, mesmo que discreta, no seu humor e na sua energia. Isso é sinal de que você está testando, ajustando e encontrando jeitos de tornar a rotina mais leve.\n\nCelebre essas pequenas vitórias. Às vezes, uma conversa diferente, um limite que você colocou ou um momento só seu já fazem toda a diferença. Continue prestando atenção no que tem funcionado para você e para sua família.',
    tone: 'celebrating',
    tags: ['progresso', 'pequenas vitórias', 'funcionou para você'],
    patternKey: 'trend_up',
  }
}

function buildPatternBalanced(avgMood: number, avgEnergy: number): CoachMessage {
  return {
    title: 'Sua semana parece ter sido mais equilibrada.',
    body: 'Pelos seus registros, essa semana teve altos e baixos dentro de um ritmo mais estável. Isso não quer dizer que foi perfeita, mas mostra que você está conseguindo encontrar algum equilíbrio entre as demandas e o cuidado consigo mesma.\n\nSempre que puder, mantenha aquilo que trouxe essa sensação de equilíbrio: uma rotina que funcione para a sua casa, pausas intencionais e conversas sinceras. Você não precisa acertar sempre, só continuar presente.',
    tone: 'calm',
    tags: ['equilíbrio', 'consistência', 'presença'],
    patternKey: 'balanced',
  }
}

function buildPatternNoData(): CoachMessage {
  return {
    title: 'Ainda não temos muitos registros, e está tudo bem.',
    body: 'Quase não temos dados desta semana, e isso não é um problema. A vida real é cheia de imprevistos, e nem sempre dá para parar e anotar tudo.\n\nQuando você se sentir pronta, comece com um único registro: como foi seu dia hoje? A partir daí, o Materna360 vai conseguir te ajudar com insights mais personalizados, sempre com acolhimento e sem julgamentos.',
    tone: 'encouraging',
    tags: ['comece de onde está', 'sem cobranças', 'vida real'],
    patternKey: 'no_data',
  }
}

/**
 * Get coach context from browser storage
 * Loads today's entry and last 7 days of mood data
 * FUSION-SAFE: Fully guarded for SSR and iframe contexts
 */
export function getCoachContextFromStorage(): CoachContext {
  try {
    // Strict window guard - return empty context if not in browser
    if (typeof window === 'undefined') {
      return {
        todayEntry: null,
        weekData: [],
        inactivity: { daysSinceLastEntry: null },
      }
    }

    // Strict localStorage guard with fallback
    let moodRaw: string | null = null
    try {
      if (typeof window.localStorage !== 'undefined') {
        moodRaw = window.localStorage.getItem('m360_mood_checkins')
      }
    } catch (e) {
      // localStorage might be blocked in some contexts (e.g., private browsing, sandboxed iframes)
      moodRaw = null
    }

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
      } catch (e) {
        // JSON parse error or other issues - silently return empty data
        moodEntries = []
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
  } catch (e) {
    // Catch-all for any unexpected errors
    return {
      todayEntry: null,
      weekData: [],
      inactivity: { daysSinceLastEntry: null },
    }
  }
}
