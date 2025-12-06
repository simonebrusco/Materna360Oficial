// app/api/ai/cuidar-com-amor/route.ts
// Rota de IA para o hub "Cuidar com Amor"

import { NextRequest, NextResponse } from 'next/server'
import {
  CuidarComAmorFeature,
  CuidarComAmorRequest,
  CuidarComAmorResponse,
} from '@/app/lib/ai/cuidarComAmorClient'
import {
  generateCuidarComAmorSuggestion,
  buildMockCuidarComAmorSuggestion,
} from '@/app/lib/ai/cuidarComAmor'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CuidarComAmorResponse>> {
  try {
    const body = (await request.json()) as CuidarComAmorRequest | undefined

    const feature: CuidarComAmorFeature = body?.feature ?? 'conexao'

    const safeRequest: CuidarComAmorRequest = {
      feature,
      origin: body?.origin ?? 'cuidar-com-amor',
      ageRange: body?.ageRange,
      mainConcern: body?.mainConcern,
    }

    const suggestion = await generateCuidarComAmorSuggestion(safeRequest)

    const response: CuidarComAmorResponse = {
      ok: true,
      feature,
      data: suggestion,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[api/ai/cuidar-com-amor] Erro:', error)

    const fallbackReq: CuidarComAmorRequest = {
      feature: 'conexao',
      origin: 'cuidar-com-amor',
    }

    const fallbackSuggestion = buildMockCuidarComAmorSuggestion(fallbackReq)

    const fallback: CuidarComAmorResponse = {
      ok: false,
      feature: 'conexao',
      data: fallbackSuggestion,
    }

    return NextResponse.json(fallback, { status: 500 })
  }
}
