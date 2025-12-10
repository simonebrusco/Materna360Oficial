// app/lib/ai/autocuidado.ts

export type AutocuidadoAlimentacao = 'leve' | 'ok' | 'pesada' | null

export interface AutocuidadoContext {
  ritmo?: string | null
  hidratacao?: number | null // 0 = preciso beber mais, 1 = estou me cuidando bem
  sono?: string | null
  alimentacao?: AutocuidadoAlimentacao
  dateKey?: string
}

export interface AutocuidadoRequest {
  context: AutocuidadoContext
  /**
   * Campo opcional para quando quisermos enviar
   * algum texto livre (ex.: observações da mãe).
   */
  prompt?: string
}

export interface AutocuidadoSuggestion {
  id: string
  phrase: string
  explanation?: string
  ritual?: string
}

/**
 * Usa a mesma feature flag do Coach / IA central.
 */
export function isAutocuidadoAIEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FF_COACH_V1 === '1'
}

/**
 * ========= MOCK LOCAL (sempre seguro) =========
 */

function buildMockSuggestion(request: AutocuidadoRequest): AutocuidadoSuggestion {
  const { ritmo, hidratacao, sono, alimentacao } = request.context || {}

  const ritmoText = ritmo ? ritmo.toLowerCase() : 'com o dia cheio'
  const hidratacaoText =
    hidratacao === 0
      ? 'parece que a água ficou um pouco esquecida'
      : hidratacao === 1
        ? 'você está conseguindo se cuidar direitinho'
        : 'talvez a água tenha passado batido no automático'
  const sonoText = sono ?? 'o sono não foi exatamente dos sonhos'
  let alimentacaoText = 'sua alimentação variou ao longo do dia'

  if (alimentacao === 'leve') alimentacaoText = 'sua alimentação hoje foi mais leve'
  if (alimentacao === 'ok') alimentacaoText = 'você conseguiu manter uma alimentação equilibrada'
  if (alimentacao === 'pesada') alimentacaoText = 'a alimentação pesou um pouco mais'

  return {
    id: 'mock-autocuidado-1',
    phrase:
      'Hoje, escolha um único gesto de autocuidado que caiba na sua realidade: pode ser beber um copo de água com calma, alongar o corpo por dois minutos ou simplesmente respirar fundo na beira da cama antes de dormir.',
    explanation: `Pelos sinais que você trouxe, você está ${ritmoText}. Sobre o corpo: ${hidratacaoText}, ${sonoText} e ${alimentacaoText}. Não precisa virar tudo de cabeça para baixo de uma vez — um cuidado pequeno, mas feito de verdade, já é muito.`,
    ritual:
      'Se puder, tire 3 minutos para colocar a mão no peito, fechar os olhos e reconhecer em voz baixa: “Eu estou fazendo o melhor que consigo hoje”. Depois disso, faça um gesto simples de cuidado com o corpo (água, alongamento ou um descanso rápido).',
  }
}

/**
 * ========= IA REAL (OpenAI) – com fallback suave =========
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const AUTO_CUIDADO_MODEL = 'gpt-4.1-mini'

async function callAutocuidadoAI(
  request: AutocuidadoRequest,
): Promise<AutocuidadoSuggestion> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.error('[AutocuidadoAI] OPENAI_API_KEY ausente – usando mock.')
    return buildMockSuggestion(request)
  }

  const { context, prompt } = request
  const systemMessage = `
Você é a IA de Autocuidado Inteligente do Materna360, um app para mães reais, com rotina corrida e muita responsabilidade.

Seu papel:
- Gerar UM gesto de autocuidado simples, possível e acolhedor para a mãe.
- Sempre usar o TOM Materna360:
  - gentil, humano, sem frases prontas
  - reconhece o cansaço e a sobrecarga sem culpar
  - ajuda a mãe a fazer "um pouquinho possível", não uma revolução.

NUNCA:
- Dê diagnósticos médicos, nutricionais ou psicológicos.
- Indique medicações, suplementos ou qualquer conduta clínica.
- Sugira mudanças radicais, dietas restritivas ou treinos pesados.

FORMATO DE RESPOSTA (OBRIGATÓRIO):
Responda APENAS com JSON válido neste formato:

{
  "suggestion": {
    "id": "string",
    "phrase": "frase principal do gesto de autocuidado, em 1–2 frases curtas",
    "explanation": "explicação curta e acolhedora conectando com a rotina da mãe",
    "ritual": "um pequeno ritual prático (2–5 minutos) que ela pode fazer hoje"
  }
}
`.trim()

  const userContext = {
    contextoDeHoje: {
      ritmo: context.ritmo ?? null,
      hidratacao: context.hidratacao ?? null,
      sono: context.sono ?? null,
      alimentacao: context.alimentacao ?? null,
      dateKey: context.dateKey ?? null,
    },
    observacoesExtras: prompt ?? null,
  }

  const userMessage = `
Gere UMA sugestão de autocuidado possível para hoje, considerando os dados (podem ter campos nulos):

${JSON.stringify(userContext, null, 2)}

Regras:
- A sugestão precisa caber em poucos minutos e na rotina de uma mãe cansada.
- Pode envolver corpo, respiração, pausa ou carinho consigo mesma.
- Use linguagem simples, próxima e sem romantizar a exaustão.
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
        model: AUTO_CUIDADO_MODEL,
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
      }),
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) {
      console.error('[AutocuidadoAI] Erro HTTP:', res.status, await res.text())
      return buildMockSuggestion(request)
    }

    const json = await res.json()
    const rawContent: string =
      json?.choices?.[0]?.message?.content?.trim() ?? '{}'

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

    const sug = parsed?.suggestion
    if (!sug || typeof sug !== 'object') {
      console.warn('[AutocuidadoAI] Sugestão vazia – usando mock.')
      return buildMockSuggestion(request)
    }

    const phrase =
      typeof sug.phrase === 'string' && sug.phrase.trim()
        ? sug.phrase.trim()
        : 'Escolha um pequeno gesto de autocuidado que caiba no seu dia e faça dele um compromisso com você mesma.'

    const explanation =
      typeof sug.explanation === 'string' && sug.explanation.trim()
        ? sug.explanation.trim()
        : undefined

    const ritual =
      typeof sug.ritual === 'string' && sug.ritual.trim()
        ? sug.ritual.trim()
        : undefined

    const id =
      typeof sug.id === 'string' && sug.id.trim()
        ? sug.id.trim()
        : 'ai-autocuidado-1'

    return {
      id,
      phrase,
      explanation,
      ritual,
    }
  } catch (err) {
    console.error('[AutocuidadoAI] Erro geral na chamada de IA:', err)
    return buildMockSuggestion(request)
  }
}

/**
 * Serviço principal de geração de sugestão de autocuidado.
 */
export async function generateAutocuidadoSuggestion(
  request: AutocuidadoRequest,
  options?: { mock?: boolean },
): Promise<AutocuidadoSuggestion> {
  const explicitMock = options?.mock
  if (explicitMock === true) {
    return buildMockSuggestion(request)
  }

  const aiEnabled = isAutocuidadoAIEnabled()
  const hasApiKey = !!process.env.OPENAI_API_KEY

  if (!aiEnabled || !hasApiKey) {
    return buildMockSuggestion(request)
  }

  // Aqui: flag ligada, API key presente e mock !== true
  return callAutocuidadoAI(request)
}
