// app/api/ai/emocional/route.ts
import { NextRequest, NextResponse } from 'next/server'

type EmotionalFeature = 'daily_insight' | 'weekly_overview'

type EmotionalContext = {
  firstName?: string
  stats?: {
    daysWithPlanner?: number
    moodCheckins?: number
    unlockedAchievements?: number
  }
  // Campos extras para uso futuro (Como Estou Hoje etc.)
  mood?: string
  energy?: string
  mainChallenges?: string[]
  baseline?: string
  notesSample?: string[]
}

type EmotionalRequestBody = {
  feature?: EmotionalFeature
  origin?: string
  context?: EmotionalContext
}

/**
 * Payload esperado hoje pelo Eu360:
 * data.weeklyInsight.title
 * data.weeklyInsight.summary
 * data.weeklyInsight.suggestions
 */
type WeeklyInsightPayload = {
  title: string
  summary: string
  suggestions: string[]
}

/**
 * Payload opcional para uso em "Como Estou Hoje" no futuro.
 */
type DailyInsightPayload = {
  title: string
  message: string
  suggestions?: string[]
}

type EmotionalResponse = {
  weeklyInsight: WeeklyInsightPayload
  dailyInsight?: DailyInsightPayload
}

function getSafeFirstName(ctx?: EmotionalContext): string {
  const raw = ctx?.firstName?.trim()
  if (!raw) return 'você'
  return raw
}

function buildWeeklyInsight(origin: string, context?: EmotionalContext): WeeklyInsightPayload {
  const name = getSafeFirstName(context)
  const stats = context?.stats ?? {}

  const daysWithPlanner = stats.daysWithPlanner ?? 0
  const moodCheckins = stats.moodCheckins ?? 0
  const unlockedAchievements = stats.unlockedAchievements ?? 0

  const baseTitle =
    origin === 'eu360'
      ? 'Seu resumo emocional da semana'
      : 'Um olhar carinhoso sobre a sua semana'

  const baseSummary =
    daysWithPlanner > 0 || moodCheckins > 0
      ? `${capitalize(
          name,
        )}, olhando para os seus últimos dias dá para perceber que você não está no piloto automático. Mesmo na correria, você vem encontrando jeitos de se organizar e se observar.`
      : `${capitalize(
          name,
        )}, esta semana pode ter parecido só mais uma no meio da correria, mas o fato de você estar aqui já mostra que algo em você quer cuidar melhor de si mesma e da sua rotina.`

  const extraPieces: string[] = []

  if (daysWithPlanner > 0) {
    extraPieces.push(
      daysWithPlanner === 1
        ? 'Você usou o planner em pelo menos um dia — isso já é um começo importante.'
        : `Você usou o planner em cerca de ${daysWithPlanner} dia(s), o que mostra uma intenção real de colocar as coisas no papel.`,
    )
  }

  if (moodCheckins > 0) {
    extraPieces.push(
      moodCheckins === 1
        ? 'Você registrou seu humor pelo menos uma vez, e isso ajuda a enxergar como você vem se sentindo de verdade.'
        : `Você fez alguns check-ins de humor, sinal de que está tentando se ouvir mais no meio da rotina.`,
    )
  }

  if (unlockedAchievements > 0) {
    extraPieces.push(
      `Há pelo menos ${unlockedAchievements} conquista(s) registrada(s). Mesmo que pareçam pequenas, elas contam muito.`,
    )
  }

  const summary =
    extraPieces.length > 0
      ? `${baseSummary} ${extraPieces.join(' ')}`
      : `${baseSummary} Lembre-se: você não precisa dar conta de tudo, só do que é possível hoje.`

  const suggestions: string[] = []

  suggestions.push(
    'Separe um momento curto para olhar com carinho para o que você já deu conta, em vez de só olhar para o que “faltou”.',
  )
  suggestions.push(
    'Escolha apenas uma prioridade por dia nos próximos dias — algo pequeno, mas que faça diferença para você.',
  )

  if (moodCheckins === 0) {
    suggestions.push(
      'Se fizer sentido, experimente registrar seu humor ao menos uma vez por dia. Isso ajuda a perceber padrões com mais gentileza.',
    )
  }

  if (daysWithPlanner === 0) {
    suggestions.push(
      'Use o planner como um aliado, não como cobrança. Ele pode ser só um lugar para anotar três coisas importantes do dia.',
    )
  }

  return {
    title: baseTitle,
    summary,
    suggestions,
  }
}

function buildDailyInsight(origin: string, context?: EmotionalContext): DailyInsightPayload {
  const name = getSafeFirstName(context)

  const mood = context?.mood
  const energy = context?.energy

  let message =
    'Hoje vale tentar se tratar com a mesma delicadeza que você oferece para o seu filho quando ele está cansado.'

  if (mood === 'sobrecarregada' || mood === 'pesada') {
    message = `${capitalize(
      name,
    )}, está tudo bem se hoje as coisas parecerem mais pesadas. Você não precisa transformar o dia inteiro, só escolher um ponto para aliviar a pressão.`
  } else if (mood === 'leve' || mood === 'equilibrada') {
    message = `${capitalize(
      name,
    )}, se hoje está um pouco mais leve, tente proteger esse clima: diga não para uma cobrança desnecessária e sim para um momento simples com quem você ama.`
  }

  if (energy === 'baixa') {
    message +=
      ' Se a sua energia estiver baixa, não se culpe por fazer o básico. O básico já é muita coisa quando a mente e o corpo estão cansados.'
  } else if (energy === 'alta') {
    message +=
      ' Se a sua energia estiver um pouco mais alta, aproveite para organizar só o que realmente importa, sem abraçar o mundo.'
  }

  return {
    title:
      origin === 'como-estou-hoje'
        ? 'Um carinho para o seu dia'
        : 'Um olhar gentil para o hoje',
    message,
    suggestions: [
      'Respire fundo três vezes antes de entrar em um momento mais tenso do seu dia.',
      'Pergunte-se: “O que realmente importa para mim hoje?” e deixe o resto para depois.',
    ],
  }
}

function capitalize(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as EmotionalRequestBody | null

    const feature: EmotionalFeature = body?.feature ?? 'weekly_overview'
    const origin = body?.origin ?? 'unknown'
    const context = body?.context

    const weeklyInsight = buildWeeklyInsight(origin, context)
    const dailyInsight = buildDailyInsight(origin, context)

    const response: EmotionalResponse = {
      weeklyInsight,
      // Sempre devolvemos dailyInsight também, para uso futuro
      dailyInsight,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[IA emocional] Erro inesperado, usando fallback seguro:', error)

    const fallback: EmotionalResponse = {
      weeklyInsight: {
        title: 'Seu resumo emocional da semana',
        summary:
          'Mesmo nos dias mais puxados, sempre existe algo pequeno que deu certo. Tente perceber quais foram esses momentos na sua semana.',
        suggestions: [
          'Proteja ao menos um momento do dia que te faz bem, mesmo que sejam 10 minutos.',
          'Perceba quais situações estão drenando demais sua energia e veja o que pode ser simplificado.',
        ],
      },
      dailyInsight: {
        title: 'Um carinho para o seu dia',
        message:
          'Hoje, tente falar com você da mesma forma que você fala com uma amiga querida: com menos cobrança e mais gentileza.',
        suggestions: [
          'Escolha uma coisa que você pode facilitar hoje.',
          'Lembre-se de que pedir ajuda também é uma forma de cuidar.',
        ],
      },
    }

    // Mesmo em caso de erro, não quebramos a página
    return NextResponse.json(fallback, { status: 200 })
  }
}
