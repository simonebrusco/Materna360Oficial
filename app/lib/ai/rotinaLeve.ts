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
 * ===== MOCK LOCAL (Sempre seguro, sem chamadas externas) =====
 */
function buildMockSuggestions(
  request: RotinaLeveRequest,
): RotinaLeveSuggestion[] {
  const { mood, energy, timeOfDay, hasKidsAround, availableMinutes } =
    request.context || {}

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

/**
 * ===== IA REAL (OpenAI) – sempre com fallback suave =====
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const ROTINA_LEVE_MODEL = 'gpt-4.1-mini'

async function callRotinaLeveAI(
  request: RotinaLeveRequest,
): Promise<RotinaLeveSuggestion[]> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.error(
      '[RotinaLeveAI] OPENAI_API_KEY não configurada – usando mock local.',
    )
    return buildMockSuggestions(request)
  }

  const { context, prompt } = request
  const { mood, energy, timeOfDay, hasKidsAround, availableMinutes } =
    context || {}

  const systemMessage = `
Você é a IA da Rotina Leve do Materna360, um app para mães que combina organização leve com apoio emocional.

Seu papel:
- Sugerir IDEIAS RÁPIDAS, RECEITAS INTELIGENTES e INSPIRAÇÕES DO DIA
- Sempre em TOM DE VOZ Materna360:
  - gentil, humano, realista, sem frases vazias
  - reconhece o cansaço da mãe SEM culpá-la
  - traz alívio, não mais cobrança
- As sugestões precisam caber em uma rotina corrida de mãe real.

NUNCA:
- Traga diagnósticos, remédios, recomendações médicas ou nutricionais específicas.
- Diga para a mãe "ser mais grata" ou "pensar positivo" como solução mágica.

FORMATO DE RESPOSTA (OBRIGATÓRIO):
Responda APENAS com JSON válido neste formato:

{
  "suggestions": [
    {
      "id": "string",
      "category": "ideia-rapida" | "receita-inteligente" | "inspiracao-do-dia",
      "title": "string",
      "description": "string",
      "timeLabel": "string opcional",
      "ageLabel": "string opcional",
      "preparation": "string opcional (passo a passo, principalmente para receitas)"
    },
    ...
  ]
}
`.trim()

  const userContext = {
    contexto: {
      humor: mood ?? null,
      energia: energy ?? null,
      periodoDoDia: timeOfDay ?? null,
      criancaPorPerto: hasKidsAround ?? null,
      minutosDisponiveis: availableMinutes ?? null,
    },
    preferenciasOuRestricoes: prompt ?? null,
  }

  const userMessage = `
Gere de 3 a 5 sugestões acolhedoras e práticas para a mãe, sempre pensando em rotina real e cansada, com foco em:

- Pelo menos 1 "ideia-rapida"
- Pelo menos 1 "receita-inteligente"
- Pelo menos 1 "inspiracao-do-dia"

Adapte tempo e tom usando os dados abaixo (podem ter campos nulos):

${JSON.stringify(userContext, null, 2)}

Lembre-se:
- Evite qualquer coisa muito complexa ou que exija muito tempo.
- Traga ideias que possam ser adaptadas para diferentes idades, usando "ageLabel" quando fizer sentido.
- Use "timeLabel" para indicar tempo aproximado (ex: "5 minutos", "10–15 minutos").
`.trim()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: ROTINA_LEVE_MODEL,
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
      }),
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) {
      console.error(
        '[RotinaLeveAI] Erro HTTP da OpenAI:',
        res.status,
        await res.text().catch(() => '(sem corpo)'),
      )
      return buildMockSuggestions(request)
    }

    const completion = await res.json()
    const rawContent: string =
      completion?.choices?.[0]?.message?.content?.trim() ?? '{}'

    let parsed: any
    try {
      parsed = JSON.parse(rawContent)
    } catch {
      const first = rawContent.indexOf('{')
      const last = rawContent.lastIndexOf('}')
      if (first >= 0 && last > first) {
        parsed = JSON.parse(rawContent.slice(first, last + 1))
      } else {
        throw new Error('Resposta da IA sem JSON válido')
      }
    }

    const suggestions = Array.isArray(parsed?.suggestions)
      ? (parsed.suggestions as any[])
      : []

    if (!suggestions.length) {
      console.warn(
        '[RotinaLeveAI] Nenhuma sugestão válida na resposta – usando mock.',
      )
      return buildMockSuggestions(request)
    }

    // Mapeia e saneia para o tipo RotinaLeveSuggestion
    const mapped: RotinaLeveSuggestion[] = suggestions
      .map((item, idx) => {
        const category = item.category as RotinaLeveSuggestionCategory
        if (
          category !== 'ideia-rapida' &&
          category !== 'receita-inteligente' &&
          category !== 'inspiracao-do-dia'
        ) {
          return null
        }

        const title =
          typeof item.title === 'string' && item.title.trim()
            ? item.title.trim()
            : 'Sugestão da Rotina Leve'

        const description =
          typeof item.description === 'string' && item.description.trim()
            ? item.description.trim()
            : 'Uma ideia simples para tornar seu dia um pouco mais leve.'

        const timeLabel =
          typeof item.timeLabel === 'string' && item.timeLabel.trim()
            ? item.timeLabel.trim()
            : undefined

        const ageLabel =
          typeof item.ageLabel === 'string' && item.ageLabel.trim()
            ? item.ageLabel.trim()
            : undefined

        const preparation =
          typeof item.preparation === 'string' && item.preparation.trim()
            ? item.preparation.trim()
            : undefined

        return {
          id:
            typeof item.id === 'string' && item.id.trim()
              ? item.id.trim()
              : `ai-${category}-${idx + 1}`,
          category,
          title,
          description,
          timeLabel,
          ageLabel,
          preparation,
        } satisfies RotinaLeveSuggestion
      })
      .filter(Boolean) as RotinaLeveSuggestion[]

    if (!mapped.length) {
      console.warn(
        '[RotinaLeveAI] Todas as sugestões foram descartadas por formato inválido – usando mock.',
      )
      return buildMockSuggestions(request)
    }

    return mapped
  } catch (err) {
    console.error('[RotinaLeveAI] Erro geral na chamada de IA:', err)
    return buildMockSuggestions(request)
  }
}

/**
 * Serviço base de IA da Rotina Leve.
 *
 * Agora:
 * - Usa IA real (OpenAI) quando:
 *   - options.mock === false
 *   - isRotinaLeveAIEnabled() === true
 *   - OPENAI_API_KEY está configurada
 * - Caso contrário, cai SEMPRE no mock local seguro.
 */
export async function generateRotinaLeveSuggestions(
  request: RotinaLeveRequest,
  options?: { mock?: boolean },
): Promise<RotinaLeveSuggestion[]> {
  const explicitMock = options?.mock

  // Se mock foi pedido explicitamente, respeitamos SEMPRE
  if (explicitMock === true) {
    return buildMockSuggestions(request)
  }

  const aiEnabled = isRotinaLeveAIEnabled()
  const hasApiKey = !!process.env.OPENAI_API_KEY

  // Se a flag não está ligada ou não há API key, sempre mock
  if (!aiEnabled || !hasApiKey || explicitMock === undefined) {
    return buildMockSuggestions(request)
  }

  // Aqui: explicitMock === false, flag ligada e API key presente
  return callRotinaLeveAI(request)
}
