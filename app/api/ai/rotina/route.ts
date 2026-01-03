// app/api/ai/rotina/route.ts

import { NextResponse } from 'next/server'
import {
  callMaternaAI,
  type MaternaProfile,
  type MaternaChildProfile,
  type RotinaComQuem,
  type RotinaTipoIdeia,
} from '@/app/lib/ai/maternaCore'
import { loadMaternaContextFromRequest } from '@/app/lib/ai/profileAdapter'
import { assertRateLimit, RateLimitError } from '@/app/lib/ai/rateLimit'

export const runtime = 'nodejs'

type RotinaRequestBody = {
  feature?: 'recipes' | 'quick-ideas'
  origin?: string

  // Campos pensados para Receitas Inteligentes
  ingredientePrincipal?: string | null
  tipoRefeicao?: string | null
  tempoPreparoMinutos?: number | null

  // Campos pensados para Ideias Rápidas
  tempoDisponivel?: number | null
  comQuem?: RotinaComQuem | null
  tipoIdeia?: RotinaTipoIdeia | null
}

// Headers padrão para não cachear respostas de IA
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

export async function POST(req: Request) {
  try {
    // Proteção de uso da IA — limite por cliente / janela
    // (best-effort, ajuda a proteger custos e abusos)
    assertRateLimit(req, 'ai-rotina', {
      limit: 20,
      windowMs: 5 * 60_000, // 20 chamadas a cada 5 minutos
    })

    const body = (await req.json()) as RotinaRequestBody

    // Agora tentamos personalizar com base no Eu360 (mas com fallback seguro)
    const { profile, child } = (await loadMaternaContextFromRequest(
      req,
    )) as { profile: MaternaProfile | null; child: MaternaChildProfile | null }

  // -----------------------------------------
// 1) IDEIAS RÁPIDAS (modo quick-ideas)
// -----------------------------------------
if (body.feature === 'quick-ideas') {
  const tipoIdeia = body.tipoIdeia ?? null
  const tempoDisponivel = body.tempoDisponivel ?? null
  const comQuem = body.comQuem ?? null

  // Bloco 1 do Meu Filho: input mínimo (não usa Eu360 completo)
  const isMeuFilhoBloco1 = tipoIdeia === 'meu-filho-bloco-1'

  const safeProfile: MaternaProfile | null = isMeuFilhoBloco1 ? null : profile

  const safeChild: MaternaChildProfile | null = isMeuFilhoBloco1
    ? child && typeof child.idadeMeses === 'number'
      ? { idadeMeses: child.idadeMeses }
      : null
    : child

  const result = await callMaternaAI({
    mode: 'quick-ideas',
    profile: safeProfile,
    child: safeChild,
    context: {
      tempoDisponivel,
      comQuem,
      tipoIdeia,
    },
  })

  return NextResponse.json(
    {
      suggestions: result.suggestions ?? [],
    },
    {
      status: 200,
      headers: NO_STORE_HEADERS,
    },
  )
}


    // -----------------------------------------
    // 2) RECEITAS INTELIGENTES (modo smart-recipes)
    //    (feature padrão se não vier nada)
    // -----------------------------------------
    const result = await callMaternaAI({
      mode: 'smart-recipes',
      profile,
      child,
      context: {
        ingredientePrincipal: body.ingredientePrincipal ?? null,
        tipoRefeicao: body.tipoRefeicao ?? null,
        tempoPreparo: body.tempoPreparoMinutos ?? null,
      },
    })

    return NextResponse.json(
      {
        recipes: result.recipes ?? [],
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      },
    )
  } catch (error) {
    // Tratamento específico de estouro de limite
    if (error instanceof RateLimitError) {
      console.warn('[API /api/ai/rotina] Rate limit atingido:', error.message)
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

    console.error('[API /api/ai/rotina] Erro ao gerar sugestões:', error)

    return NextResponse.json(
      {
        error: 'Não consegui gerar sugestões agora, tente novamente em instantes.',
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      },
    )
  }
}
