// app/api/ai/rotina/route.ts

import { NextResponse } from 'next/server'
import {
  callMaternaAI,
  type MaternaProfile,
  type MaternaChildProfile,
  type RotinaComQuem,
  type RotinaTipoIdeia,
  type RotinaQuickSuggestion,
} from '@/app/lib/ai/maternaCore'
import { loadMaternaContextFromRequest } from '@/app/lib/ai/profileAdapter'
import { assertRateLimit, RateLimitError } from '@/app/lib/ai/rateLimit'

export const runtime = 'nodejs'

type RotinaRequestBody = {
  feature?: 'recipes' | 'quick-ideas'
  origin?: string

  // Receitas Inteligentes
  ingredientePrincipal?: string | null
  tipoRefeicao?: string | null
  tempoPreparoMinutos?: number | null

  // Ideias Rápidas
  tempoDisponivel?: number | null
  comQuem?: RotinaComQuem | null
  tipoIdeia?: RotinaTipoIdeia | null
}

// Headers padrão para IA (nunca cachear)
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

/**
 * =========================================================
 * Meu Filho — Bloco 1 (CANÔNICO)
 * Validação obrigatória no servidor
 *
 * Regras:
 * - EXATAMENTE 1 suggestion
 * - title = ""
 * - description: 1..280 chars
 * - até 3 frases
 * - linguagem proibida bloqueada
 * - se reprovar: retorna [] (fallback silencioso no client)
 * =========================================================
 */
function sanitizeMeuFilhoBloco1(
  raw: RotinaQuickSuggestion[] | null | undefined,
  tempoDisponivel: number | null | undefined,
): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const description = String(first.description ?? '').trim()

  // 1..280 caracteres
  if (description.length < 1 || description.length > 280) return []

  // até 3 frases (best effort)
  const sentences = description
    .split(/[.!?]+/g)
    .map((s) => s.trim())
    .filter(Boolean)

  if (sentences.length < 1 || sentences.length > 3) return []

  // linguagem proibida
  const forbidden = /\b(você pode|que tal|talvez|se quiser|uma ideia)\b/i
  if (forbidden.test(description)) return []

  const estimatedMinutes =
    typeof tempoDisponivel === 'number' && Number.isFinite(tempoDisponivel)
      ? Math.max(1, Math.round(tempoDisponivel))
      : first.estimatedMinutes

  const sanitized: RotinaQuickSuggestion = {
    ...first,
    title: '', // título é proibido no Bloco 1
    description,
    withChild: true,
    estimatedMinutes,
  }

  return [sanitized]
}

export async function POST(req: Request) {
  try {
    // Rate limit de IA
    assertRateLimit(req, 'ai-rotina', {
      limit: 20,
      windowMs: 5 * 60_000,
    })

    const body = (await req.json()) as RotinaRequestBody

    // Contexto Eu360 (fallback seguro)
    const { profile, child } = (await loadMaternaContextFromRequest(req)) as {
      profile: MaternaProfile | null
      child: MaternaChildProfile | null
    }

    /**
     * =====================================================
     * 1) IDEIAS RÁPIDAS
     * =====================================================
     */
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

      // 🔒 Guardrail canônico — Meu Filho Bloco 1
      if (body.tipoIdeia === 'meu-filho-bloco-1') {
        const sanitized = sanitizeMeuFilhoBloco1(
          result.suggestions,
          body.tempoDisponivel ?? null,
        )

        return NextResponse.json(
          { suggestions: sanitized },
          { status: 200, headers: NO_STORE_HEADERS },
        )
      }

      // Demais usos: contrato original
      return NextResponse.json(
        { suggestions: result.suggestions ?? [] },
        { status: 200, headers: NO_STORE_HEADERS },
      )
    }

    /**
     * =====================================================
     * 2) RECEITAS INTELIGENTES
     * =====================================================
     */
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
      { recipes: result.recipes ?? [] },
      { status: 200, headers: NO_STORE_HEADERS },
    )
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.warn('[API /api/ai/rotina] Rate limit atingido:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 429, headers: NO_STORE_HEADERS },
      )
    }

    console.error('[API /api/ai/rotina] Erro ao gerar sugestões:', error)

    return NextResponse.json(
      { error: 'Não consegui gerar sugestões agora, tente novamente em instantes.' },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
