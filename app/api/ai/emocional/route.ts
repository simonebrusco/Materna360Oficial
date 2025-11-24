// app/api/ai/emocional/route.ts

import { NextResponse } from 'next/server'
import {
  callMaternaAI,
  type MaternaProfile,
  type MaternaChildProfile,
  type MaternaFocusOfDay,
} from '@/app/lib/ai/maternaCore'
import { loadMaternaContextFromRequest } from '@/app/lib/ai/profileAdapter'
import { assertRateLimit, RateLimitError } from '@/app/lib/ai/rateLimit'

export const runtime = 'nodejs'

type EmocionalRequestBody = {
  feature?: 'daily_inspiration' | 'weekly_overview' | 'daily_insight'
  origin?: string
  focus?: MaternaFocusOfDay | null
}

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

export async function POST(req: Request) {
  try {
    // Proteção de uso da IA para o eixo emocional
    assertRateLimit(req, 'ai-emocional', {
      limit: 30,
      windowMs: 5 * 60_000, // 30 chamadas a cada 5 minutos
    })

    let body: EmocionalRequestBody | null = null

    try {
      body = (await req.json()) as EmocionalRequestBody
    } catch {
      body = null
    }

    // Carrega perfil + criança principal via Eu360 (com fallback neutro)
    const { profile, child } = (await loadMaternaContextFromRequest(
      req,
    )) as { profile: MaternaProfile | null; child: MaternaChildProfile | null }

    // Chamamos sempre o modo "daily-inspiration" e adaptamos conforme a feature
    const result = await callMaternaAI({
      mode: 'daily-inspiration',
      profile,
      child,
      context: {
        focusOfDay: body?.focus ?? null,
      },
    })

    const inspiration = result.inspiration

    // Caso especial: /eu360 pede "weekly_overview" e espera weeklyInsight
    if (body?.feature === 'weekly_overview') {
      return NextResponse.json(
        {
          weeklyInsight: {
            title:
              inspiration?.phrase ??
              'Como sua semana tem se desenhado',
            summary:
              inspiration?.care ??
              'Pelos seus registros recentes, sua semana parece misturar momentos de cansaço com alguns respiros de leveza.',
            highlights: {
              bestDay:
                inspiration?.ritual ??
                'Seus melhores dias costumam ser aqueles em que você respeita seus limites e não tenta abraçar o mundo de uma vez.',
              toughDays:
                'Os dias mais pesados tendem a aparecer quando você tenta dar conta de tudo sozinha. Pedir ajuda ou reduzir expectativas também é um gesto de amor.',
            },
          },
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        },
      )
    }

    // Novo caso: Insight diário emocional (usado em "Como estou hoje")
    if (body?.feature === 'daily_insight') {
      return NextResponse.json(
        {
          dailyInsight: {
            title:
              inspiration?.phrase ??
              'Um olhar gentil para o seu dia',
            body:
              inspiration?.care ??
              'Pelos sinais que você tem dado, parece que o dia de hoje veio com uma mistura de cansaço e responsabilidade.',
            gentleReminder:
              inspiration?.ritual ??
              'Você não precisa fazer tudo hoje. Escolha uma coisa importante e permita que o resto seja “suficientemente bom”.',
          },
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        },
      )
    }

    // Caso padrão: Inspirações do Dia
    return NextResponse.json(
      {
        inspiration: {
          phrase:
            inspiration?.phrase ??
            'Você não precisa dar conta de tudo hoje.',
          care:
            inspiration?.care ??
            '1 minuto de respiração consciente antes de retomar a próxima tarefa.',
          ritual:
            inspiration?.ritual ??
            'Envie uma mensagem carinhosa para alguém que te apoia.',
        },
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      },
    )
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.warn('[API /api/ai/emocional] Rate limit atingido:', error.message)
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

    console.error('[API /api/ai/emocional] Erro ao gerar inspiração:', error)

    return NextResponse.json(
      {
        error:
          'Não consegui gerar uma inspiração agora, tente novamente em instantes.',
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      },
    )
  }
}
