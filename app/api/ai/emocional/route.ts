// app/api/ai/emocional/route.ts

import { NextResponse } from 'next/server'
import {
  callMaternaAI,
  type MaternaProfile,
  type MaternaChildProfile,
  type MaternaFocusOfDay,
} from '@/app/lib/ai/maternaCore'
import { loadMaternaContextFromRequest } from '@/app/lib/ai/profileAdapter'

export const runtime = 'nodejs'

type EmocionalRequestBody = {
  feature?: 'daily_inspiration' | 'weekly_overview'
  origin?: string
  focus?: MaternaFocusOfDay | null
}

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

export async function POST(req: Request) {
  try {
    let body: EmocionalRequestBody | null = null

    try {
      body = (await req.json()) as EmocionalRequestBody
    } catch {
      body = null
    }

    // Personalização com base no Eu360 (com fallback neutro)
    const { profile, child } = (await loadMaternaContextFromRequest(
      req
    )) as { profile: MaternaProfile | null; child: MaternaChildProfile | null }

    // Chamamos sempre o modo "daily-inspiration" e só mudamos
    // o formato da resposta quando a feature pedir visão semanal.
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
            // Reaproveitamos os campos da inspiração:
            title: inspiration.phrase,
            summary: inspiration.care,
            suggestions: [inspiration.ritual],
          },
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        }
      )
    }

    // Caso padrão: Inspirações do Dia
    return NextResponse.json(
      {
        inspiration,
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    )
  } catch (error) {
    console.error('[API /api/ai/emocional] Erro ao gerar inspiração:', error)

    return NextResponse.json(
      {
        error:
          'Não consegui gerar uma inspiração agora, tente novamente em instantes.',
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      }
    )
  }
}
