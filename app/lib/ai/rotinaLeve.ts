// lib/ai/rotinaLeve.ts

export type RotinaLeveMood =
  | 'leve'
  | 'cansada'
  | 'sobrecarregada'
  | 'animada'
  | string

export type RotinaLeveEnergy = 'baixa' | 'média' | 'alta' | string

export type RotinaLeveTimeOfDay = 'manhã' | 'tarde' | 'noite' | string

export type RotinaLeveSuggestionCategory =
  | 'ideia-rapida'
  | 'receita-inteligente'
  | 'inspiracao-do-dia'

export interface RotinaLeveContext {
  mood?: RotinaLeveMood
  energy?: RotinaLeveEnergy
  timeOfDay?: RotinaLeveTimeOfDay
  hasKidsAround?: boolean
  availableMinutes?: number
}

export interface RotinaLeveRequest {
  context: RotinaLeveContext
  /**
   * Campo opcional para quando ligarmos a IA real:
   * texto livre vindo do mini-hub (ex: preferências, restrições, etc.).
   */
  prompt?: string
}

export interface RotinaLeveSuggestion {
  id: string
  category: RotinaLeveSuggestionCategory
  title: string
  description: string
  timeLabel?: string
  ageLabel?: string
}

/**
 * Helper para respeitar as feature flags oficiais da IA.
 * Hoje usamos a mesma flag do Coach/IA central.
 */
export function isRotinaLeveAIEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FF_COACH_V1 === '1'
}

/**
 * Serviço base de IA da Rotina Leve.
 *
 * Por enquanto, funciona 100% em modo mock, sem chamadas externas,
 * apenas gerando sugestões acolhedoras com base no contexto.
 *
 * No futuro, este será o ponto único para plugar o provedor de IA real.
 */
export async function generateRotinaLeveSuggestions(
  request: RotinaLeveRequest,
  options?: { mock?: boolean }
): Promise<RotinaLeveSuggestion[]> {
  const useMock = options?.mock ?? true

  if (useMock) {
    const mood = request.context.mood ?? 'com o dia cheio'
    const energy = request.context.energy ?? 'com a energia oscilando'
    const timeOfDay = request.context.timeOfDay ?? 'hoje'

    return [
      {
        id: 'mock-ideia-rapida-1',
        category: 'ideia-rapida',
        title: 'Micro pausa de respiro',
        description: `Separe 5 minutos ${timeOfDay} para respirar fundo, alongar os ombros e tomar um copo de água. Para uma mãe ${mood}, pequenos respiros já fazem diferença.`,
        timeLabel: '5 minutos',
      },
      {
        id: 'mock-receita-1',
        category: 'receita-inteligente',
        title: 'Lanche rápido de energia gentil',
        description:
          'Uma combinação simples de fruta picada + iogurte natural + aveia. Poucos passos, quase nenhuma louça e um lanche que ajuda a segurar a fome sem complicar.',
        timeLabel: '10–15 minutos',
        ageLabel: 'A partir de 2 anos (adaptando texturas)',
      },
      {
        id: 'mock-inspiracao-1',
        category: 'inspiracao-do-dia',
        title: 'Você não precisa dar conta de tudo',
        description:
          'Hoje, escolha uma coisa que pode ficar para depois. Cuidar de você também é cuidar da família. Um passo de cada vez já é muito.',
      },
    ]
  }

  // 🚫 Caminho protegido enquanto não houver integração real de IA
  throw new Error(
    'Rotina Leve AI service não implementado para modo não-mock.'
  )
}
