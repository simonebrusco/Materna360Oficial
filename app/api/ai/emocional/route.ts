// app/api/ai/emocional/route.ts

import { NextResponse } from 'next/server'
import {
  callMaternaAI,
  type MaternaProfile,
  type MaternaChildProfile,
} from '@/app/lib/ai/maternaCore'

export const runtime = 'nodejs'

type EmotionalFeature = 'daily_inspiration' | 'weekly_overview'

type EmotionalRequestBody = {
  feature?: EmotionalFeature
  origin?: string | null
  focus?: string | null
}

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

export async function POST(req: Request) {
  let body: EmotionalRequestBody | null = null

  try {
    body = (await req.json()) as EmotionalRequestBody
  } catch {
    body = null
  }

  const feature: EmotionalFeature = body?.feature ?? 'daily_inspiration'

  // Por enquanto não buscamos perfil real aqui.
  // Mantemos pronto para futura integração com EU360/Supabase.
  const profile: MaternaProfile | null = null
  const child: MaternaChildProfile | null = null

  try {
    // -----------------------------------------
    // 1) VISÃO SEMANAL (Eu360: weekly_overview)
    // -----------------------------------------
    if (feature === 'weekly_overview') {
      const result = await callMaternaAI({
        mode: 'daily-inspiration', // <- modo permitido pelo maternaCore
        profile,
        child,
        context: {
          origin: body?.origin ?? null,
          variant: 'weekly', // dica pro core gerar visão semanal
        },
      })

      return NextResponse.json(
        {
          weeklyInsight: result.weeklyInsight ?? null,
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        }
      )
    }

    // -----------------------------------------
    // 2) INSPIRAÇÃO DO DIA (Rotina Leve: daily_inspiration)
    // -----------------------------------------
    const result = await callMaternaAI({
      mode: 'daily-inspiration',
      profile,
      child,
      context: {
        origin: body?.origin ?? null,
        focus: body?.focus ?? null,
        variant: 'daily',
      },
    })

    return NextResponse.json(
      {
        inspiration: result.inspiration ?? null,
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    )
  } catch (error) {
    console.error('[API /api/ai/emocional] Erro ao gerar resposta emocional:', error)

    // Fallbacks carinhosos, no formato que o front já espera

    if (feature === 'weekly_overview') {
      return NextResponse.json(
        {
          weeklyInsight: {
            title: 'Seu resumo emocional da semana',
            summary:
              'Pelos seus últimos dias, é provável que você esteja equilibrando muitos pratos ao mesmo tempo. Lembre-se de que se cuidar também faz parte do cuidado com a família.',
            suggestions: [
              'Separe um momento curto só para você revisitar o que deu certo.',
              'Escolha apenas uma prioridade por dia para aliviar a sensação de cobrança.',
            ],
          },
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        }
      )
    }

    return NextResponse.json(
      {
        inspiration: {
          phrase: 'Você não precisa dar conta de tudo hoje.',
          care: 'Tire 1 minuto para respirar fundo e soltar o ar bem devagar.',
          ritual: 'Envie uma mensagem carinhosa para alguém que te apoia.',
        },
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    )
  }
}
