// app/api/ai/emocional/route.ts

import { NextResponse } from 'next/server'
import {
  callMaternaAI,
  type MaternaProfile,
  type MaternaChildProfile,
  type MaternaFocusOfDay,
} from '@/app/lib/ai/maternaCore'
import { adaptEu360ProfileToMaterna } from '@/app/lib/ai/eu360ProfileAdapter'

export const runtime = 'nodejs'

type EmocionalRequestBody = {
  feature?: 'daily_inspiration' | 'weekly_overview'
  origin?: string
  focus?: MaternaFocusOfDay | null
}

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

// Carrega perfil + criança principal a partir do Eu360, com fallback neutro
async function loadMaternaContext(
  req: Request
): Promise<{ profile: MaternaProfile | null; child: MaternaChildProfile | null }> {
  try {
    const url = new URL('/api/eu360/profile', req.url)

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        cookie: req.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return { profile: null, child: null }
    }

    const data = await res.json().catch(() => null)
    return adaptEu360ProfileToMaterna(data)
  } catch (error) {
    console.debug(
      '[API /api/ai/emocional] Falha ao carregar Eu360, usando contexto neutro:',
      error
    )
    return { profile: null, child: null }
  }
}

export async function POST(req: Request) {
  try {
    let body: EmocionalRequestBody | null = null

    try {
      body = (await req.json()) as EmocionalRequestBody
    } catch {
      body = null
    }

    const { profile, child } = await loadMaternaContext(req)

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
        error: 'Não consegui gerar uma inspiração agora, tente novamente em instantes.',
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      }
    )
  }
}
