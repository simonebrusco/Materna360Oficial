// app/lib/ai/rotinaLeve.ts

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
  /**
   * Campo opcional pensado principalmente para receitas inteligentes.
   */
  preparation?: string
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

  if (!useMock) {
    // 🚫 Caminho protegido enquanto não houver integração real de IA
    throw new Error(
      'Rotina Leve AI service não implementado para modo não-mock.'
    )
  }

  const { mood, energy, timeOfDay, hasKidsAround, availableMinutes } =
    request.context

  const moodText = mood ?? 'com o dia cheio'
  const energyText = energy ?? 'com a energia oscilando'
  const timeOfDayText = timeOfDay ?? 'hoje'

  const whoIsAround = hasKidsAround
    ? 'com o seu filho por perto'
    : 'em um momento mais seu'
  const minutesText =
    typeof availableMinutes === 'number' && availableMinutes > 0
      ? `${availableMinutes} minutos`
      : 'alguns minutinhos'

  return [
    // Ideia rápida
    {
      id: 'mock-ideia-rapida-1',
      category: 'ideia-rapida',
      title: 'Micro pausa de conexão',
      description: `Separe ${minutesText} ${timeOfDayText} para uma pequena ação ${whoIsAround}. Pode ser uma mini brincadeira, um abraço demorado ou apenas respirar fundo juntas. Para uma mãe ${moodText} e ${energyText}, o importante não é o tamanho do momento, e sim a qualidade.`,
      timeLabel: minutesText,
    },

    // Receita inteligente
    {
      id: 'mock-receita-inteligente-1',
      category: 'receita-inteligente',
      title: 'Lanche rápido de energia gentil',
      description:
        'Uma combinação simples de fruta picada + iogurte natural + aveia. Poucos passos, quase nenhuma louça e um lanche que ajuda a segurar a fome sem complicar.',
      timeLabel: '10–15 minutos',
      ageLabel: 'A partir de 2 anos (adaptando texturas)',
      preparation:
        '1. Pique uma fruta que você já tenha em casa (banana, maçã, pera ou mamão).\n2. Coloque em um potinho com 2–3 colheres de iogurte natural integral.\n3. Finalize com 1 colher de sopa de aveia em flocos.\n4. Misture tudo com calma, envolvendo seu filho na preparação, se fizer sentido no seu momento.',
    },

    // Inspiração do dia
    {
      id: 'mock-inspiracao-1',
      category: 'inspiracao-do-dia',
      title: 'Você não precisa dar conta de tudo',
      description:
        'Hoje, escolha uma coisa que pode ficar para depois. Cuidar de você também é cuidar da família. Um passo de cada vez já é muito.',
      timeLabel: timeOfDayText,
    },
  ]
}
