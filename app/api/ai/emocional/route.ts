// app/api/ai/emocional/route.ts
import { NextResponse } from 'next/server'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4.1-mini' // pode trocar depois, se quiser

type EmotionalRequestBody = {
  feature: 'weekly_overview' | 'daily_inspiration'
  origin?: string
  // Campos extras possíveis para contexto futuro (sem obrigação de enviar agora)
  mood?: string | null
  energy?: string | null
  notesPreview?: string | null
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error('[IA Emocional] OPENAI_API_KEY não configurada')
      return NextResponse.json(
        { error: 'Configuração de IA indisponível no momento.' },
        { status: 500 },
      )
    }

    const body = (await request.json()) as EmotionalRequestBody
    const { feature, origin, mood, energy, notesPreview } = body

    if (!feature) {
      return NextResponse.json(
        { error: 'Parâmetro "feature" é obrigatório.' },
        { status: 400 },
      )
    }

    // Prompt base alinhado ao tom do Materna360
    const systemMessage = `
Você é a IA emocional do Materna360, um app para mães que combina organização leve com apoio emocional.
Sua missão é oferecer reflexões curtas, acolhedoras e sem julgamentos, sempre em TOM DE VOZ Materna360:
- gentil, humano, realista, sem frases motivacionais vazias
- reconhece o cansaço da mãe SEM culpá-la
- traz alívio e não mais cobrança
- frases em português do Brasil, curtas e diretas
Nunca fale de diagnóstico, remédio ou temas médicos.
Nunca mande a mãe "ser mais grata" ou "pensar positivo" – seja mais concreta e empática.
Respeite SEMPRE o formato JSON pedido.
    `.trim()

    const userContext = {
      origem: origin ?? 'como-estou-hoje',
      humorAtual: mood ?? null,
      energiaAtual: energy ?? null,
      resumoNotas: notesPreview ?? null,
    }

    const userMessageCommon = `
Dados de contexto (podem estar vazios):
${JSON.stringify(userContext, null, 2)}
    `.trim()

    let userMessage = ''
    let expectedShapeDescription = ''

    if (feature === 'weekly_overview') {
      expectedShapeDescription = `
Responda APENAS com JSON válido neste formato:

{
  "weeklyInsight": {
    "title": "string",
    "summary": "string",
    "highlights": {
      "bestDay": "string",
      "toughDays": "string"
    }
  }
}

- "title": título curto, acolhedor.
- "summary": visão geral da semana, em 3 a 5 linhas.
- "bestDay": quando os dias fluem melhor (sem culpar a mãe).
- "toughDays": quando o dia pesa mais, com lembrete de gentileza consigo mesma.
      `.trim()

      userMessage = `
Gere um insight emocional da semana da mãe a partir dos registros dela.

${userMessageCommon}

${expectedShapeDescription}
      `.trim()
    } else if (feature === 'daily_inspiration') {
      expectedShapeDescription = `
Responda APENAS com JSON válido neste formato:

{
  "inspiration": {
    "phrase": "string",
    "care": "string",
    "ritual": "string"
  }
}

- "phrase": frase curtinha de título (1 linha).
- "care": texto principal, 3 a 6 linhas, acolhendo o dia da mãe.
- "ritual": sugestão prática e simples de autocuidado ou conexão, que caiba num dia corrido.
      `.trim()

      userMessage = `
Gere uma inspiração emocional para o dia da mãe, considerando humor, energia e notas.

${userMessageCommon}

${expectedShapeDescription}
      `.trim()
    } else {
      return NextResponse.json(
        { error: 'Feature inválida para IA emocional.' },
        { status: 400 },
      )
    }

    // Chamada para a OpenAI com timeout seguro
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    const openAiRes = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
      }),
    }).finally(() => clearTimeout(timeout))

    if (!openAiRes.ok) {
      console.error(
        '[IA Emocional] Erro HTTP da OpenAI:',
        openAiRes.status,
        await openAiRes.text().catch(() => '(sem corpo)'),
      )
      return NextResponse.json(
        { error: 'Não consegui gerar a análise emocional agora.' },
        { status: 502 },
      )
    }

    const completion = await openAiRes.json()

    const content: string =
      completion?.choices?.[0]?.message?.content?.trim() ?? '{}'

    // Tenta fazer o parse do JSON, mesmo que venha com texto ao redor
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch {
      const first = content.indexOf('{')
      const last = content.lastIndexOf('}')
      if (first >= 0 && last > first) {
        parsed = JSON.parse(content.slice(first, last + 1))
      } else {
        throw new Error('Resposta da IA sem JSON válido')
      }
    }

    return NextResponse.json(parsed, { status: 200 })
  } catch (error) {
    console.error('[IA Emocional] Erro geral na rota /api/ai/emocional:', error)

    // Resposta genérica, mas acolhedora (o front já tem fallback extra)
    return NextResponse.json(
      {
        error: 'Não foi possível gerar a análise emocional agora.',
      },
      { status: 500 },
    )
  }
}
