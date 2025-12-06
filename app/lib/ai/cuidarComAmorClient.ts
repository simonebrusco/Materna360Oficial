// app/lib/ai/cuidarComAmor.ts
// Serviço de IA do hub "Cuidar com Amor" (lado servidor)

import {
  CuidarComAmorFeature,
  CuidarComAmorRequest,
  CuidarComAmorSuggestion,
} from '@/app/lib/ai/cuidarComAmorClient'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const CUIDAR_COM_AMOR_MODEL = 'gpt-4.1-mini'

/**
 * Usa a mesma feature flag da IA central / Coach.
 */
export function isCuidarComAmorAIEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FF_COACH_V1 === '1'
}

/* =========================================================
 * MOCKS SEGUROS – mesma lógica de texto que você já usava
 * =======================================================*/

function buildAlimentacaoSuggestionMock(
  _req: CuidarComAmorRequest,
): CuidarComAmorSuggestion {
  return {
    headline: 'Alimentação com menos culpa e mais calma',
    description:
      'Aqui o foco não é dieta perfeita, e sim pequenas escolhas que deixam as refeições mais leves para vocês.',
    tips: [
      'Quando possível, ofereça uma refeição simples com pelo menos um alimento que seu filho costuma aceitar bem.',
      'Convide seu filho para participar de algo pequeno da preparação, como mexer a massa ou escolher a cor do prato.',
      'Evite transformar a refeição em campo de batalha: se hoje não fluiu como você queria, tudo bem recomeçar em outro dia.',
    ],
    disclaimer:
      'As sugestões de alimentação do Materna360 são gerais e não substituem a orientação de um pediatra ou nutricionista. Em dúvidas específicas sobre peso, alergias ou restrições, converse sempre com profissionais de confiança.',
  }
}

function buildSonoSuggestionMock(_req: CuidarComAmorRequest): CuidarComAmorSuggestion {
  return {
    headline: 'Uma noite um pouco mais tranquila',
    description:
      'O objetivo aqui não é resolver o sono de uma vez, e sim criar pequenos pontos de calma na rotina da noite.',
    tips: [
      'Tente repetir um mini-ritual simples nas noites possíveis, como sempre a mesma música suave ou a mesma frase de boa noite.',
      'Reduza estímulos intensos perto da hora de dormir, como telas muito brilhantes ou brincadeiras muito agitadas.',
      'Se os despertares estiverem muito frequentes ou preocupantes, vale sempre conversar com o pediatra para avaliar juntos.',
    ],
    disclaimer:
      'As orientações sobre sono são gerais e não substituem avaliação médica. Em casos de sono muito difícil, roncos intensos ou qualquer sinal que te preocupe, procure o pediatra de confiança.',
  }
}

function buildConexaoSuggestionMock(
  _req: CuidarComAmorRequest,
): CuidarComAmorSuggestion {
  return {
    headline: 'Conexão que cabe no seu dia real',
    description:
      'Você não precisa de grandes programas para fortalecer o vínculo. Momentos pequenos e verdadeiros contam muito.',
    tips: [
      'Escolha um micro-momento do dia para olhar nos olhos do seu filho e dizer algo simples como “eu gosto muito de você”.',
      'Transforme uma tarefa do dia (como guardar brinquedos ou preparar a mochila) em parceria rápida, mesmo que não fique perfeito.',
      'Ao fim do dia, se quiser, relembre em voz alta um momento gostoso que vocês viveram juntos, mesmo que tenha durado poucos minutos.',
    ],
    disclaimer:
      'As sugestões de conexão são afetivas e não substituem acompanhamento psicológico quando necessário. Se você sentir que precisa de mais apoio emocional, busque profissionais ou redes de apoio que façam sentido para você.',
  }
}

/**
 * Builder único de mock, usado tanto pela rota quanto pelo serviço
 */
export function buildMockCuidarComAmorSuggestion(
  request: CuidarComAmorRequest,
): CuidarComAmorSuggestion {
  const feature: CuidarComAmorFeature = request.feature ?? 'conexao'

  switch (feature) {
    case 'alimentacao':
      return buildAlimentacaoSuggestionMock(request)
    case 'sono':
      return buildSonoSuggestionMock(request)
    case 'conexao':
    default:
      return buildConexaoSuggestionMock(request)
  }
}

/* =========================================================
 * IA REAL (OpenAI) – sempre com fallback suave
 * =======================================================*/

async function callCuidarComAmorAI(
  request: CuidarComAmorRequest,
): Promise<CuidarComAmorSuggestion> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.error('[CuidarComAmorAI] OPENAI_API_KEY ausente – usando mock.')
    return buildMockCuidarComAmorSuggestion(request)
  }

  const systemMessage = `
Você é a IA do mini-hub "Cuidar com Amor" do Materna360.

Contexto:
- Mães reais, cansadas, com rotina puxada.
- O foco é ajudar a cuidar do filho com gestos possíveis, sem culpa e sem perfeição.
- Focos possíveis (feature):
  - "alimentacao"  → refeições mais leves, sem campo de batalha.
  - "sono"         → rotina de noite um pouco mais calma.
  - "conexao"      → vínculo afetivo no dia real, em pequenos gestos.

TOM Materna360:
- Gentil, humano, concreto.
- Reconhece a sobrecarga sem romantizar exaustão.
- Propõe “um pouco possível hoje”, não revoluções.

NUNCA:
- Dê diagnósticos médicos, psicológicos ou nutricionais.
- Indique medicações, suplementos, dietas restritivas ou condutas clínicas.
- Prometa curas ou resultados garantidos.

FORMATO DE RESPOSTA (OBRIGATÓRIO):
Responda APENAS com JSON válido neste formato:

{
  "suggestion": {
    "headline": "título curto da ideia principal",
    "description": "explicação curta e acolhedora",
    "tips": ["dica 1", "dica 2", "dica 3"],
    "disclaimer": "aviso curto reforçando que não substitui pediatra/terapia"
  }
}
`.trim()

  const userMessage = `
Gere IDEIAS SUAVES DE CUIDADO para hoje.

Requisição (pode ter campos nulos):
${JSON.stringify(request, null, 2)}

Regras:
- Adapte o tom ao foco (alimentacao, sono ou conexao).
- Traga 2–4 dicas simples, possíveis, que caibam em poucos minutos ou em pequenos ajustes da rotina.
- Fale como se estivesse conversando com uma mãe amiga, sem julgamentos e sem promessas mágicas.
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
        model: CUIDAR_COM_AMOR_MODEL,
        temperature: 0.9,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
      }),
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) {
      console.error('[CuidarComAmorAI] Erro HTTP:', res.status, await res.text())
      return buildMockCuidarComAmorSuggestion(request)
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
      console.warn('[CuidarComAmorAI] Sugestão vazia – usando mock.')
      return buildMockCuidarComAmorSuggestion(request)
    }

    const headline =
      typeof sug.headline === 'string' && sug.headline.trim()
        ? sug.headline.trim()
        : 'Ideias de cuidado para hoje'

    const description =
      typeof sug.description === 'string' && sug.description.trim()
        ? sug.description.trim()
        : 'Escolha um pequeno gesto possível hoje e leve, sem pressão para dar conta de tudo.'

    const tips: string[] = Array.isArray(sug.tips)
      ? sug.tips
          .map((t: unknown) => (typeof t === 'string' ? t.trim() : ''))
          .filter((t: string) => t.length > 0)
      : []

    const disclaimer =
      typeof sug.disclaimer === 'string' && sug.disclaimer.trim()
        ? sug.disclaimer.trim()
        : 'As sugestões do Materna360 não substituem acompanhamento médico, nutricional ou psicológico. Em caso de dúvidas específicas, procure profissionais de confiança.'

    // se por algum motivo vier sem dicas, garantimos 1–2
    const finalTips =
      tips.length > 0
        ? tips
        : [
            'Escolha um pequeno gesto que caiba na sua energia de hoje e tudo bem se for pouco.',
            'Observe um momento de calma com seu filho e tente repetir algo parecido amanhã.',
          ]

    return {
      headline,
      description,
      tips: finalTips,
      disclaimer,
    }
  } catch (err) {
    console.error('[CuidarComAmorAI] Erro geral na chamada de IA:', err)
    return buildMockCuidarComAmorSuggestion(request)
  }
}

/* =========================================================
 * Serviço principal usado pela rota
 * =======================================================*/

export async function generateCuidarComAmorSuggestion(
  request: CuidarComAmorRequest,
  options?: { mock?: boolean },
): Promise<CuidarComAmorSuggestion> {
  const explicitMock = options?.mock

  if (explicitMock === true) {
    return buildMockCuidarComAmorSuggestion(request)
  }

  const aiEnabled = isCuidarComAmorAIEnabled()
  const hasApiKey = !!process.env.OPENAI_API_KEY

  if (!aiEnabled || !hasApiKey) {
    return buildMockCuidarComAmorSuggestion(request)
  }

  return callCuidarComAmorAI(request)
}
