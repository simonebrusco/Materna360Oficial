import { NextResponse } from 'next/server'

const OPENAI_API_URL = 'https://api.openai.com/v1/responses'

// Você pode trocar depois. Mantive o seu por compatibilidade,
// mas no Responses API você pode usar modelos mais novos quando quiser.
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'

type WeeklyInsightContext = {
  firstName?: string

  // Compat (legado)
  persona?: string | null
  personaLabel?: string | null

  // Novo (preferências neutras — pode vir vazio por enquanto)
  prefs?: {
    tone?: 'soft' | 'neutral' | 'firm' | null
    intensity?: 'low' | 'medium' | null
    focus?: 'care' | 'organization' | 'pause' | null
  }

  stats?: {
    daysWithPlanner?: number
    moodCheckins?: number
    unlockedAchievements?: number
    todayMissionsDone?: number
  }

  // Contexto leve do “agora” (sem conteúdo sensível)
  mood?: string | null
  energy?: string | null
  focusToday?: string | null
  slot?: string | null
}

type EmotionalRequestBody = {
  feature: 'weekly_overview' | 'daily_inspiration'
  origin?: string

  // Compat: campos antigos (podem continuar vindo, mas agora preferimos "context")
  mood?: string | null
  energy?: string | null
  notesPreview?: string | null

  // Novo: contexto rico vindo do client (Eu360, Meu Dia, etc.)
  context?: WeeklyInsightContext
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function safeString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length ? s : null
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('[IA Emocional] OPENAI_API_KEY não configurada')
      return jsonError('Configuração de IA indisponível no momento.', 500)
    }

    const body = (await request.json()) as EmotionalRequestBody
    const feature = body?.feature
    if (!feature) return jsonError('Parâmetro "feature" é obrigatório.', 400)

    const origin = safeString(body?.origin) ?? 'como-estou-hoje'
    const isMaternar = origin === 'maternar-hub'
    const isEu360 = origin === 'eu360'

    // Contexto “unificado” (prioriza body.context; mantém compat com campos antigos)
    const context: WeeklyInsightContext = {
      firstName: safeString(body?.context?.firstName) ?? undefined,

      // legado
      persona: safeString(body?.context?.persona) ?? null,
      personaLabel: safeString(body?.context?.personaLabel) ?? null,

      // novo (pode vir vazio)
      prefs: body?.context?.prefs ?? undefined,

      stats: body?.context?.stats ?? undefined,
      mood: safeString(body?.context?.mood) ?? safeString(body?.mood) ?? null,
      energy: safeString(body?.context?.energy) ?? safeString(body?.energy) ?? null,
      focusToday: safeString(body?.context?.focusToday) ?? null,
      slot: safeString(body?.context?.slot) ?? null,
    }

    /**
     * SYSTEM BASE: tom Materna360 (geral)
     */
    const systemBase = `
Você é a IA emocional do Materna360, um app para mães que combina organização leve com apoio emocional.
Sua missão é oferecer textos curtos, acolhedores e sem julgamentos, sempre no TOM DE VOZ Materna360:
- gentil, humano, realista, sem frases motivacionais vazias
- reconhece o cansaço SEM culpabilizar
- traz alívio e não mais cobrança
- português do Brasil, frases curtas e diretas

Regras:
- Nunca fale de diagnóstico, remédio ou temas médicos.
- Nunca diga "seja grata" ou "pense positivo". Seja concreta e empática.
- Nunca exponha dados sensíveis. Use apenas o contexto fornecido.
- Respeite SEMPRE o formato JSON pedido (sem texto fora do JSON).
`.trim()

    /**
     * ADDENDUM CANÔNICO — MATERNAR (P33.4)
     */
    const systemMaternarAddendum = `
Você está respondendo DENTRO DA ABA "MATERNAR".
Aqui a IA atua como presença acolhedora e estável: escuta organizada e tradução de sentimentos.
PROIBIDO em Maternar:
- dar conselhos diretos
- sugerir técnicas, métodos ou exercícios
- usar linguagem de melhoria ("tente", "faça", "o ideal", "você precisa")
- transformar emoção em tarefa
- induzir ação futura, CTA, desafio, plano, lista de passos
- empurrar para outro hub explicitamente

PROIBIDO também:
- mencionar datas comemorativas (Dia das Mães, Natal, Ano Novo, feriados etc.)
- inventar contexto temporal ("nesta época do ano", "hoje é um dia especial", "em janeiro...")
- mencionar mês, dia da semana, estação ou evento sazonal
A não ser que isso esteja EXPLICITAMENTE presente no contexto fornecido.

Estrutura que deve aparecer naturalmente no texto (sem enumerar):
- reconhecimento emocional claro
- nomeação/organização do sentimento
- normalização da experiência
- fechamento acolhedor sem tarefa

Importante:
- Evite verbos no imperativo.
- Se precisar “oferecer algo”, ofereça PERMISSÃO e linguagem de cuidado (não instrução).
`.trim()

    /**
     * ADDENDUM CANÔNICO — EU360 (P34.2)
     * Eu360 é leitura + calibração. Não devolve ação.
     */
    const systemEu360Addendum = `
Você está respondendo DENTRO DO HUB "EU360".
Aqui a IA entrega LEITURA NARRATIVA e RECONHECIMENTO — nunca direção.

PROIBIDO em Eu360:
- conselhos, sugestões, técnicas, métodos, exercícios
- linguagem de melhoria ("tente", "faça", "você precisa", "o ideal")
- lista de passos, planos, metas, desafios, CTAs
- comparação temporal ("mais", "menos", "melhor", "pior", "evoluiu", "regrediu")
- termos clínicos/diagnósticos

Regras de linguagem:
- tom adulto, respeitoso, não performático
- frases curtas
- sem imperativo
- a leitura deve parecer óbvia em retrospecto (sem "surpresa")

Se houver um campo chamado "suggestions" no schema:
- trate como "observações de cuidado / reconhecimentos"
- devem ser frases que aliviam, não orientam
`.trim()

    const systemMessage = (
      isMaternar ? `${systemBase}\n\n${systemMaternarAddendum}` : isEu360 ? `${systemBase}\n\n${systemEu360Addendum}` : systemBase
    ).trim()

    // Contexto do usuário (a IA usa isso para calibrar tom e conteúdo)
    const userContext = {
      origem: origin,
      firstName: context.firstName ?? null,

      // legado (pode ir sumindo com o tempo)
      persona: context.persona ?? null,
      personaLabel: context.personaLabel ?? null,

      // novo (preferências neutras)
      prefs: context.prefs ?? null,

      humorAtual: context.mood ?? null,
      energiaAtual: context.energy ?? null,
      focoHoje: context.focusToday ?? null,
      tempoSlot: context.slot ?? null,
      stats: context.stats ?? null,

      // Mantido para compatibilidade (ideal é enviar vazio ou resumo não sensível)
      resumoNotas: safeString(body?.notesPreview) ?? null,
    }

    const userMessageCommon = `
Dados de contexto (podem estar vazios):
${JSON.stringify(userContext, null, 2)}
`.trim()

    // Schemas (Structured Outputs strict)
    const weeklySchema = {
      name: 'weekly_insight',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          weeklyInsight: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string', minLength: 1 },
              summary: { type: 'string', minLength: 1 },
              suggestions: {
                type: 'array',
                minItems: 2,
                maxItems: 5,
                items: { type: 'string', minLength: 1 },
              },
              highlights: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  bestDay: { type: 'string', minLength: 1 },
                  toughDays: { type: 'string', minLength: 1 },
                },
                required: ['bestDay', 'toughDays'],
              },
            },
            required: ['title', 'summary', 'suggestions', 'highlights'],
          },
        },
        required: ['weeklyInsight'],
      },
    } as const

    const dailySchema = {
      name: 'daily_inspiration',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          inspiration: {
            type: 'object',
            additionalProperties: false,
            properties: {
              phrase: { type: 'string', minLength: 1 },
              care: { type: 'string', minLength: 1 },
              ritual: { type: 'string', minLength: 1 },
            },
            required: ['phrase', 'care', 'ritual'],
          },
        },
        required: ['inspiration'],
      },
    } as const

    let inputText = ''
    let schemaToUse: typeof weeklySchema | typeof dailySchema

    if (feature === 'weekly_overview') {
      schemaToUse = weeklySchema

      if (isMaternar) {
        inputText = `
Gere um insight emocional da semana para a mãe, a partir do contexto fornecido.
Requisitos:
- "title": curto e acolhedor.
- "summary": 3 a 5 linhas, sem julgar, sem orientar.
- "suggestions": 2 a 5 frases de permissão/acolhimento (NÃO passos, NÃO tarefas, NÃO técnicas).
- "highlights.bestDay": quando a semana flui melhor (sem culpa).
- "highlights.toughDays": quando pesa mais + lembrete de gentileza.
${userMessageCommon}
`.trim()
      } else if (isEu360) {
        // EU360 (P34.2): leitura + reconhecimento (sem direção)
        inputText = `
Gere um relatório emocional em formato de leitura narrativa da semana, a partir do contexto fornecido.
Requisitos:
- "title": curto, adulto, respeitoso.
- "summary": 2 a 4 parágrafos curtos (ou 3 a 5 linhas), leitura sem julgamento, sem orientar.
- "suggestions": 2 a 5 "observações de cuidado" (reconhecimentos, permissões, validações). NÃO são passos, NÃO são tarefas.
- "highlights.bestDay": descreva quando a semana flui melhor (sem mérito, sem comparação).
- "highlights.toughDays": descreva quando pesa mais + lembrete de gentileza (sem indicar o que fazer).
${userMessageCommon}
`.trim()
      } else {
        // fora de Maternar/Eu360 mantém comportamento atual
        inputText = `
Gere um insight emocional da semana da mãe a partir do contexto fornecido.
Requisitos:
- "title": curto e acolhedor.
- "summary": 3 a 5 linhas, sem julgar.
- "suggestions": 2 a 5 passos pequenos, práticos e realistas.

Ajuste o tom se existir "prefs" (sem mencionar que existem preferências).
Se não houver prefs, use o contexto disponível.
${userMessageCommon}
`.trim()
      }
    } else if (feature === 'daily_inspiration') {
      schemaToUse = dailySchema

      if (isMaternar) {
        inputText = `
Gere um apoio emocional para o dia da mãe, considerando humor, energia e foco.
Requisitos:
- "phrase": 1 linha acolhedora, sem imperativo.
- "care": 3 a 6 linhas, acolhimento concreto, sem instruções, sem métodos.
- "ritual": 1 linha de permissão/ancoragem emocional (não é exercício; evite verbos no imperativo).
${userMessageCommon}
`.trim()
      } else if (isEu360) {
        // Eu360 raramente chamará daily, mas se chamar, mantém leitura sem direção.
        inputText = `
Gere uma leitura breve para o dia da mãe, considerando humor, energia e foco.
Requisitos:
- "phrase": 1 linha adulta e acolhedora, sem imperativo.
- "care": 3 a 6 linhas com reconhecimento e organização do que ela vive (sem instruções).
- "ritual": 1 linha de permissão/ancoragem emocional (não é exercício; evite verbos no imperativo).
${userMessageCommon}
`.trim()
      } else {
        inputText = `
Gere uma inspiração emocional para o dia da mãe, considerando humor, energia e foco.
Requisitos:
- "phrase": 1 linha.
- "care": 3 a 6 linhas, acolhedor e concreto.
- "ritual": 1 sugestão prática (cabe num dia corrido).

Ajuste o tom se existir "prefs" (sem mencionar que existem preferências).
${userMessageCommon}
`.trim()
      }
    } else {
      return jsonError('Feature inválida para IA emocional.', 400)
    }

    // Telemetria básica (sem dados sensíveis)
    try {
      console.log('[IA Emocional] request', {
        feature,
        origin,
        isMaternar,
        isEu360,
        hasPrefs: Boolean(context.prefs),
        hasPersonaLegacy: Boolean(context.persona || context.personaLabel),
      })
    } catch {}

    // Chamada para OpenAI (Responses API) + timeout
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
        input: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: inputText },
        ],
        temperature: isMaternar || isEu360 ? 0.4 : 0.7,
        text: {
          format: {
            type: 'json_schema',
            ...schemaToUse,
          },
        },
      }),
    }).finally(() => clearTimeout(timeout))

    if (!openAiRes.ok) {
      console.error(
        '[IA Emocional] Erro HTTP da OpenAI:',
        openAiRes.status,
        await openAiRes.text().catch(() => '(sem corpo)'),
      )
      return jsonError('Não consegui gerar a análise emocional agora.', 502)
    }

    const response = await openAiRes.json()

    // Robustez: extrai texto e faz parse JSON
    const rawText: string =
      response?.output_text?.trim?.() ||
      (() => {
        const parts: string[] = []
        const output = Array.isArray(response?.output) ? response.output : []
        for (const item of output) {
          const content = Array.isArray(item?.content) ? item.content : []
          for (const c of content) {
            if (typeof c?.text === 'string') parts.push(c.text)
          }
        }
        return parts.join('\n').trim()
      })() ||
      '{}'

    let parsed: any
    try {
      parsed = JSON.parse(rawText)
    } catch {
      const first = rawText.indexOf('{')
      const last = rawText.lastIndexOf('}')
      if (first >= 0 && last > first) parsed = JSON.parse(rawText.slice(first, last + 1))
      else throw new Error('Resposta da IA sem JSON válido')
    }

    return NextResponse.json(parsed, { status: 200 })
  } catch (error) {
    console.error('[IA Emocional] Erro geral na rota /api/ai/emocional:', error)
    return NextResponse.json({ error: 'Não foi possível gerar a análise emocional agora.' }, { status: 500 })
  }
}
