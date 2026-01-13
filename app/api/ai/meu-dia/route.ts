// app/api/ai/meu-dia/route.ts

import { NextResponse } from 'next/server'
import {
  callMaternaAI,
  type MaternaProfile,
  type MaternaChildProfile,
  type MaternaFocusOfDay,
} from '@/app/lib/ai/maternaCore'
import { loadMaternaContextFromRequest } from '@/app/lib/ai/profileAdapter'
import { assertRateLimit, RateLimitError } from '@/app/lib/ai/rateLimit'
import {
  tryConsumeDailyAI,
  releaseDailyAI,
  DAILY_LIMIT_MESSAGE,
  DAILY_LIMIT_ANON_COOKIE,
  DAILY_LIMIT,
} from '@/app/lib/ai/dailyLimit.server'

export const runtime = 'nodejs'

type MeuDiaFeature =
  | 'intelligent_suggestions' // sugestões rápidas com base em humor + intenção
  | 'planner_summary' // resumo do dia/semana para o planner
  | 'daily_focus' // foco emocional do dia (opcional)

type MeuDiaRequestBody = {
  feature?: MeuDiaFeature
  origin?: string

  // Estado do Meu Dia
  mood?: string | null
  dayIntention?: string | null

  // Foco emocional do dia – vem como string solta do front
  focusOfDay?: string | null
}

// Headers padrão para não cachear respostas de IA
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

// Converte string solta → enum seguro MaternaFocusOfDay
function normalizeFocus(value: string | null | undefined): MaternaFocusOfDay | null {
  if (!value) return null

  // Mapa flexível: aceita com/sem acento e devolve o valor "oficial"
  const map: Record<string, string> = {
    cansaco: 'Cansaço',
    Cansaço: 'Cansaço',
    culpa: 'Culpa',
    Culpa: 'Culpa',
    organizacao: 'Organização',
    Organização: 'Organização',
    conexao_com_filho: 'Conexão com o filho',
    'Conexão com o filho': 'Conexão com o filho',
  }

  const mapped = map[value] ?? null
  return mapped as MaternaFocusOfDay | null
}

export async function POST(req: Request) {
  let gate: { actorId: string; dateKey: string } | null = null

  try {
    // Proteção de uso da IA para o eixo "Meu Dia"
    assertRateLimit(req, 'ai-meu-dia', {
      limit: 30,
      windowMs: 5 * 60_000, // 30 chamadas a cada 5 minutos
    })

    // Limite diário global (ética) — backend como fonte de verdade
    const g = await tryConsumeDailyAI(DAILY_LIMIT)
    gate = { actorId: g.actorId, dateKey: g.dateKey }

    if (!g.allowed) {
      const res = NextResponse.json(
        {
          blocked: true,
          message: DAILY_LIMIT_MESSAGE,
          // Mantém shape compatível com os diferentes "feature" consumirem sem quebrar:
          suggestions: [],
          summary: null,
          focus: null,
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        },
      )

      if (g.anonToSet) {
        res.cookies.set(DAILY_LIMIT_ANON_COOKIE, g.anonToSet, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      }

      console.info('[AI_LIMIT] blocked', {
        route: '/api/ai/meu-dia',
        actorId: g.actorId,
        dateKey: g.dateKey,
      })

      return res
    }

    let body: MeuDiaRequestBody | null = null

    try {
      body = (await req.json()) as MeuDiaRequestBody
    } catch {
      body = null
    }

    const feature = body?.feature ?? 'intelligent_suggestions'
    const mood = body?.mood ?? null
    const dayIntention = body?.dayIntention ?? null
    const focusOfDayRaw = body?.focusOfDay ?? null

    // Carrega perfil + criança principal via Eu360 (com fallback neutro)
    const { profile, child } = (await loadMaternaContextFromRequest(
      req,
    )) as { profile: MaternaProfile | null; child: MaternaChildProfile | null }

    // Montamos o payload como `any` para não prender o tipo aqui.
    const aiPayload: any = {
      mode: 'meu-dia',
      profile,
      child,
      context: {
        mood, // string simples do front (feliz / normal / estressada, etc.)
        dayIntention, // leve / focado / produtivo / slow / automático
        focusOfDay: normalizeFocus(focusOfDayRaw),
      },
    }

    const result: any = await callMaternaAI(aiPayload)

    // -----------------------------
    // 1) Sugestões inteligentes
    // -----------------------------
    if (feature === 'intelligent_suggestions') {
      return NextResponse.json(
        {
          suggestions: result?.suggestions ?? [],
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        },
      )
    }

    // -----------------------------
    // 2) Resumo para o planner
    // -----------------------------
    if (feature === 'planner_summary') {
      return NextResponse.json(
        {
          summary: result?.summary ?? null,
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        },
      )
    }

    // -----------------------------
    // 3) Foco diário (opcional)
    // -----------------------------
    if (feature === 'daily_focus') {
      return NextResponse.json(
        {
          focus: result?.focus ?? null,
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        },
      )
    }

    // -----------------------------
    // Caso padrão (fallback)
    // -----------------------------
    return NextResponse.json(
      {
        suggestions: result?.suggestions ?? [],
        summary: result?.summary ?? null,
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      },
    )
  } catch (error) {
    // Se já consumimos cota e falhou antes de entregar resposta "final", liberamos o consumo
    if (gate) {
      await releaseDailyAI(gate.actorId, gate.dateKey)
    }

    if (error instanceof RateLimitError) {
      console.warn('[API /api/ai/meu-dia] Rate limit atingido:', error.message)
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: error.status ?? 429,
          headers: NO_STORE_HEADERS,
        },
      )
    }

    console.error('[API /api/ai/meu-dia] Erro ao gerar resposta:', error)

    return NextResponse.json(
      {
        error: 'Não consegui ajudar com o seu dia agora. Tente novamente em instantes.',
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      },
    )
  }
}
