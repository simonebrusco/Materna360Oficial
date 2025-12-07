// app/lib/ai/autocuidadoInteligente.ts
// Serviço de IA do hub "Autocuidado Inteligente" (lado servidor)

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const AUTOCUIDADO_MODEL = 'gpt-4.1-mini'

export interface AutocuidadoRequest {
  dateKey?: string
  ritmo?: string | null
  nota?: string | null
  hidratacao?: number | null
  sono?: string | null
  alimentacao?: 'leve' | 'ok' | 'pesada' | null
}

export interface AutocuidadoSuggestion {
  headline: string
  description: string
  tips: string[]
  reminder: string
}

/**
 * Usa a mesma feature flag global de IA (Coach V1).
 */
export function isAutocuidadoAIEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FF_COACH_V1 === '1'
}

/* =========================================================
 * MOCK SEGURO – caso IA esteja desligada ou sem API key
 * =======================================================*/

export function buildMockAutocuidadoSuggestion(
  _req: AutocuidadoRequest,
): AutocuidadoSuggestion {
  return {
    headline: 'Um carinho que cabe no seu hoje',
    description:
      'A ideia não é fazer tudo perfeito, e sim encontrar um gesto possível que te traga um pouco mais de respiro no meio da rotina.',
    tips: [
      'Separe 3 minutos para respirar fundo e alongar os ombros, mesmo que seja no corredor ou no banheiro.',
      'Beba um copo de água com calma, sentada, sem olhar o celular nesse momento.',
      'Se puder, mande uma mensagem para alguém de confiança dizendo como você está hoje — você não precisa dar conta de tudo sozinha.',
    ],
    reminder:
      'Cuidar de você não é egoísmo: é a base para conseguir seguir cuidando de quem você ama com mais presença.',
  }
}

/* =========================================================
 * IA REAL (OpenAI) – sempre com fallback suave
 * =======================================================*/

async function callAutocuidadoAI(
  request: AutocuidadoRequest,
): Promise<AutocuidadoSuggestion> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.error('[AutocuidadoAI] OPENAI_API_KEY ausente – usando mock.')
    return buildMockAutocuidadoSuggestion(request)
  }

  const systemMessage = `
Você é a IA do mini-hub "Autocuidado Inteligente" do Materna360.

Contexto:
- Você conversa com mães reais, cansadas, muitas vezes sobrecarregadas.
- O objetivo é sugerir pequenos gestos de autocuidado POSSÍVEIS hoje.
- Nada de lista perfeita, nada de rotina impossível.

TOM Materna360:
- Gentil, humano, acolhedor.
- Reconhece a exaustão sem romantizar.
- Sugere "um pouco possível agora", não grandes transformações.

NUNCA:
- Dê diagnósticos médicos ou psicológicos.
- Indique medicações, suplementos, dietas restritivas ou condutas clínicas.
- Prometa curas ou resultados garantidos.

FORMATO DE RESPOSTA (OBRIGATÓRIO):
Responda APENAS com JSON válido neste formato:

{
  "suggestion": {
    "headline": "título curto da ideia principal",
    "description": "explicação acolhedora e direta",
    "tips": ["dica 1", "dica 2", "dica 3"],
    "reminder": "frase curta lembrando que ela não precisa dar conta de tudo"
  }
}
`.trim()

  const userMessage = `
Gere IDEIAS DE AUTOCUIDADO para hoje, levando em conta o contexto.

Requisição (pode ter campos nulos):
${JSON.stringify(request, null, 2)}

Regras:
- Considere o ritmo (leve, cansada, animada, exausta, focada) e os dados de sono, hidratação e alimentação se existirem.
- Traga 2–4 dicas concretas, que caibam em poucos minutos ou em pequenas adaptações da rotina.
- Fale como se estivesse conversando com uma amiga mãe, sem julgamentos.
- As dicas podem envolver pausa, corpo, emoções, pedir ajuda, etc., sempre de forma leve.
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
        model: AUTOCUIDADO_MODEL,
        temperature: 0.9,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
      }),
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) {
      console.error('[AutocuidadoAI] Erro HTTP:', res.status, await res.text())
      return buildMockAutocuidadoSuggestion(request)
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
      return buildMockAutocuidadoSuggestion(request)
    }

    const headline =
      typeof sug.headline === 'string' && sug.headline.trim()
        ? sug.headline.trim()
        : 'Um carinho possível para hoje'

    const description =
      typeof sug.description === 'string' && sug.description.trim()
        ? sug.description.trim()
        : 'Escolha um gesto pequeno e possível que traga um pouco de respiro para o seu dia.'

    const tips: string[] = Array.isArray(sug.tips)
      ? sug.tips
          .map((t: unknown) => (typeof t === 'string' ? t.trim() : ''))
          .filter((t: string) => t.length > 0)
      : []

    const reminder =
      typeof sug.reminder === 'string' && sug.reminder.trim()
        ? sug.reminder.trim()
        : 'Você não precisa dar conta de tudo ao mesmo tempo. Um cuidado de cada vez já é muito.'

    const finalTips =
      tips.length > 0
        ? tips
        : [
            'Separe 3 minutos para respirar fundo e alongar o pescoço e os ombros.',
            'Beba um copo de água sentada, respirando com calma.',
          ]

    return {
      headline,
      description,
      tips: finalTips,
      reminder,
    }
  } catch (err) {
    console.error('[AutocuidadoAI] Erro geral na chamada de IA:', err)
    return buildMockAutocuidadoSuggestion(request)
  }
}

/* =========================================================
 * Serviço principal usado pela rota
 * =======================================================*/

export async function generateAutocuidadoSuggestion(
  request: AutocuidadoRequest,
  options?: { mock?: boolean },
): Promise<AutocuidadoSuggestion> {
  if (options?.mock === true) {
    return buildMockAutocuidadoSuggestion(request)
  }

  const aiEnabled = isAutocuidadoAIEnabled()
  const hasApiKey = !!process.env.OPENAI_API_KEY

  if (!aiEnabled || !hasApiKey) {
    return buildMockAutocuidadoSuggestion(request)
  }

  return callAutocuidadoAI(request)
}
