// app/api/ai/rotina/route.ts

import { NextResponse } from 'next/server'
import {
  callMaternaAI,
  type MaternaProfile,
  type MaternaChildProfile,
  type RotinaComQuem,
  type RotinaTipoIdeia,
} from '@/app/lib/ai/maternaCore'
import { adaptEu360ProfileToMaterna } from '@/app/lib/ai/eu360ProfileAdapter'

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

// Carrega perfil + criança principal a partir do Eu360, com fallback neutro
async function loadMaternaContext(
  req: Request
): Promise<{ profile: MaternaProfile | null; child: MaternaChildProfile | null }> {
  try {
    const url = new URL('/api/eu360/profile', req.url)

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        // repassa cookies para manter o contexto da usuária
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
    console.debug('[API /api/ai/rotina] Falha ao carregar Eu360, usando contexto neutro:', error)
    return { profile: null, child: null }
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RotinaRequestBody

    // Agora tentamos personalizar com base no Eu360 (mas com fallback seguro)
    const { profile, child } = await loadMaternaContext(req)

    // -----------------------------------------
    // 1) IDEIAS RÁPIDAS (modo quick-ideas)
    // -----------------------------------------
    if (body.feature === 'quick-ideas') {
      const result = await callMaternaAI({
        mode: 'quick-ideas',
        profile,
        child,
        context: {
          tempoDisponivel: body.tempoDisponivel ?? null,
          comQuem: body.comQuem ?? null,
          tipoIdeia: body.tipoIdeia ?? null,
        },
      })

      return NextResponse.json(
        {
          suggestions: result.suggestions ?? [],
        },
        {
          status: 200,
          headers: NO_STORE_HEADERS,
        }
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
      }
    )
  } catch (error) {
    console.error('[API /api/ai/rotina] Erro ao gerar sugestões:', error)

    return NextResponse.json(
      {
        error: 'Não consegui gerar sugestões agora, tente novamente em instantes.',
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      }
    )
  }
}
