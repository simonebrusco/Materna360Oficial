// app/api/ai/emocional/route.ts
import { NextResponse } from 'next/server'

const OPENAI_API_URL = 'https://api.openai.com/v1/responses'

// Você pode trocar depois. Mantive o seu por compatibilidade,
// mas no Responses API você pode usar modelos mais novos quando quiser.
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'

type WeeklyInsightContext = {
  firstName?: string
  persona?: string | null
  personaLabel?: string | null
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

function isNonEmptyStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string' && x.trim().length > 0)
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

    // Contexto “unificado” (prioriza body.context; mantém compat com campos antigos)
    const context: WeeklyInsightContext = {
      firstName: safeString(body?.context?.firstName) ?? undefined,
      persona: safeString(body?.context?.persona) ?? null,
      personaLabel: safeString(body?.context?.personaLabel) ?? null,
      stats: body?.context?.stats ?? undefined,
      mood: safeString(body?.context?.mood) ?? safeString(body?.mood) ?? null,
      energy: safeString(body?.context?.energy) ?? safeString(body?.energy) ?? null,
      focusToday: safeString(body?.context?.focusToday) ?? null,
      slot: safeString(body?.context?.slot) ?? null,
    }

    /**
     * SYSTEM BASE: tom Materna360 (geral)
     * Observação: Para o Maternar, aplicamos um addendum com regras canônicas.
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
     * Regra: Maternar sustenta, não ensina.
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

    const systemMessage = (isMaternar ? `${systemBase}\n\n${systemMaternarAddendum}` : systemBase).trim()

    // Contexto do usuário (a IA usa isso para calibrar tom e conteúdo)
    const userContext = {
      origem: origin,
      firstName: context.firstName ?? null,
      persona: context.persona ?? null,
      personaLabel: context.personaLabel ?? null,
      humorAtual: context.mood ?? null,
      energiaAtual: context.energy ?? null,
      focoHoje: context.focusToday ?? null,
      tempoSlot: context.slot ?? null,
      stats: context.stats ?? null,
      // Mantido para compatibilidade (mas ideal é enviar vazio ou resumo não sensível)
      resumoNotas: safeString(body?.notesPreview) ?? null,
    }

    const userMessageCommon = `
Dados de contexto (podem estar vazios):
${JSON.stringify(userContext, null, 2)}
`.trim()

    /**
     * Schemas (Structured Outputs strict)
     *
     * Mudança aprovada:
     * - weekly_overview passa a devolver "observations" (observações/reconhecimentos) no lugar de "suggestions" (passos).
     *
     * Compatibilidade:
     * - Mantemos "suggestions" como campo OPCIONAL (para não quebrar consumidores legados).
     * - No retorno, normalizamos para sempre devolver ambos (observations + suggestions) com o mesmo conteúdo.
     */
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

              // Novo (preferido): observações/reconhecimentos sem direção
              observations: {
                type: 'array',
                minItems: 2,
                maxItems: 5,
                items: { type: 'string', minLength: 1 },
              },

              // Legado (opcional): mantido por compatibilidade
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
            // Requeremos observations (novo). suggestions fica opcional.
            required: ['title', 'summary', 'observations', 'highlights'],
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

      // Aqui aplicamos a mudança para TODO weekly_overview (maternar e não-maternar):
      // observations = leitura + reconhecimento; sem passos, sem tarefas, sem micro-desafio.
      if (isMaternar) {
        inputText = `
Gere um insight emocional da semana para a mãe, a partir do contexto fornecido.
Requisitos:
- "title": curto e acolhedor.
- "summary": 3 a 5 linhas, sem julgar, sem orientar.
- "observations": 2 a 5 observações/reconhecimentos (DESCRITIVOS), sem passos, sem tarefas, sem técnicas.
  - Evite verbos no imperativo.
  - Prefira "parece", "tem aparecido", "há sinais de", "quando X acontece, Y pesa/ajuda".
- "highlights.bestDay": quando a semana flui melhor (sem culpa).
- "highlights.toughDays": quando pesa mais + lembrete de gentileza (sem direção).
${userMessageCommon}
`.trim()
      } else {
        inputText = `
Gere um insight emocional da semana da mãe a partir do contexto fornecido.
Requisitos:
- "title": curto e acolhedor.
- "summary": 3 a 5 linhas, sem julgar e sem frases motivacionais vazias.
- "observations": 2 a 5 observações/reconhecimentos (DESCRITIVOS), sem passos práticos, sem tarefa, sem técnica, sem micro-desafio.
  - Evite verbos no imperativo.
  - Prefira linguagem de leitura ("parece", "tem sido", "aparece", "há sinais de").
- "highlights.bestDay": quando a semana flui melhor (sem culpa).
- "highlights.toughDays": quando pesa mais + lembrete de gentileza (sem direção).

Se houver persona/personaLabel, use APENAS para calibrar o tom (mais suave/mais direto), sem criar sugestões ou tarefas.
${userMessageCommon}
`.trim()
      }
    } else if (feature === 'daily_inspiration') {
      schemaToUse = dailySchema

      if (isMaternar) {
        // Maternar: manter schema, mas “ritual” não pode virar técnica/exercício.
        inputText = `
Gere um apoio emocional para o dia da mãe, considerando humor, energia e foco.
Requisitos:
- "phrase": 1 linha acolhedora, sem imperativo.
- "care": 3 a 6 linhas, acolhimento concreto, sem instruções, sem métodos.
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

Ajuste o tom para a persona, se existir:
- Se personaLabel indicar "sobrevivência": mínimo de passos, muito acolhimento, zero cobrança.
- Se indicar "expansão": ainda gentil, mas com 1 micro-desafio possível.
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
        hasPersona: Boolean(context.persona || context.personaLabel),
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
        temperature: isMaternar ? 0.4 : 0.7,
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

    /**
     * Normalização de compatibilidade (weekly_overview):
     * - Sempre devolvemos observations + suggestions com o MESMO conteúdo,
     *   para não quebrar consumidores que ainda leem "suggestions".
     */
    if (feature === 'weekly_overview' && parsed?.weeklyInsight && typeof parsed.weeklyInsight === 'object') {
      const wi = parsed.weeklyInsight as any
      const obs = wi?.observations
      const sug = wi?.suggestions

      if (!isNonEmptyStringArray(obs) && isNonEmptyStringArray(sug)) {
        wi.observations = sug
      } else if (isNonEmptyStringArray(obs) && !isNonEmptyStringArray(sug)) {
        wi.suggestions = obs
      } else if (!isNonEmptyStringArray(obs) && !isNonEmptyStringArray(sug)) {
        // Segurança final: evita quebrar o client caso venha vazio por algum motivo
        wi.observations = [
          'Há sinais de que a sua semana teve momentos de cansaço e também pequenos respiros.',
          'Mesmo com oscilações, parece que você seguiu sustentando o essencial do seu jeito.',
        ]
        wi.suggestions = wi.observations
      }
    }

    return NextResponse.json(parsed, { status: 200 })
  } catch (error) {
    console.error('[IA Emocional] Erro geral na rota /api/ai/emocional:', error)
    return NextResponse.json({ error: 'Não foi possível gerar a análise emocional agora.' }, { status: 500 })
  }
}
