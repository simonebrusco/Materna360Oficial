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

import { sanitizeMeuFilhoBloco2Suggestions } from '@/app/lib/ai/validators/bloco2'
import { safeMeuFilhoBloco4Text } from '@/app/lib/ai/validators/bloco4'

export const runtime = 'nodejs'

type RotinaRequestBody = {
  feature?: 'recipes' | 'quick-ideas' | 'micro-ritmos' | 'fase-contexto'
  origin?: string

  // Campos pensados para Receitas Inteligentes
  ingredientePrincipal?: string | null
  tipoRefeicao?: string | null
  tempoPreparoMinutos?: number | null

  // Campos pensados para Ideias Rápidas (Blocos 1/2)
  tempoDisponivel?: number | null
  comQuem?: RotinaComQuem | null
  tipoIdeia?: RotinaTipoIdeia | null

  // Campos Bloco 3 (micro-ritmos)
  idade?: number | string | null
  faixa_etaria?: string | null
  momento_do_dia?: 'manhã' | 'tarde' | 'noite' | 'transição' | string | null
  tipo_experiencia?: 'rotina' | 'conexao' | string | null
  contexto?: string | null

  // Campos Bloco 4 (fase/contexto)
  momento_desenvolvimento?: 'exploracao' | 'afirmacao' | 'imitacao' | 'autonomia' | string | null
}

// Headers padrão para não cachear respostas de IA
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

/**
 * Bloco 1 (Meu Filho) — Validação canônica no servidor
 * Regras:
 * - Exatamente 1 suggestion
 * - title = ""
 * - description: 1..280 chars, até 3 frases, sem linguagem proibida
 * - se falhar: retorna [] para fallback do client
 */
function sanitizeMeuFilhoBloco1(
  raw: RotinaQuickSuggestion[] | null | undefined,
  tempoDisponivel: number | null | undefined,
): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const description = String(first.description ?? '').trim()

  // 1..280 chars
  if (description.length < 1 || description.length > 280) return []

  // até 3 frases (best-effort)
  const sentenceParts = description
    .split(/[.!?]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
  if (sentenceParts.length < 1 || sentenceParts.length > 3) return []

  // bloqueio de linguagem proibida (case-insensitive)
  const forbidden = /\b(você pode|voce pode|que tal|talvez|se quiser|uma ideia)\b/i
  if (forbidden.test(description)) return []

  const estimatedMinutes =
    typeof tempoDisponivel === 'number' && Number.isFinite(tempoDisponivel)
      ? Math.max(1, Math.round(tempoDisponivel))
      : typeof first.estimatedMinutes === 'number'
        ? first.estimatedMinutes
        : 1

  const sanitized: RotinaQuickSuggestion = {
    ...first,
    title: '',
    description,
    withChild: true,
    estimatedMinutes,
  }

  return [sanitized]
}

/**
 * Bloco 4 (Meu Filho) — Validação canônica no servidor
 * Regras:
 * - Exatamente 1 frase
 * - <= 140 caracteres
 * - Tom observacional, sem normatividade / sem teoria
 * - se falhar: retorna [] (fallback silencioso no client)
 */
function sanitizeMeuFilhoBloco4(
  raw: RotinaQuickSuggestion[] | null | undefined,
): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const candidate = String(first.description ?? '').trim()
  const cleaned = safeMeuFilhoBloco4Text(candidate)
  if (!cleaned) return []

  const sanitized: RotinaQuickSuggestion = {
    ...first,
    title: '',
    description: cleaned,
    withChild: true,
    estimatedMinutes:
      typeof first.estimatedMinutes === 'number' && Number.isFinite(first.estimatedMinutes)
        ? first.estimatedMinutes
        : 1,
  }

  return [sanitized]
}

export async function POST(req: Request) {
  try {
    // Proteção de uso da IA — limite por cliente / janela
    assertRateLimit(req, 'ai-rotina', {
      limit: 20,
      windowMs: 5 * 60_000, // 20 chamadas a cada 5 minutos
    })

    const body = (await req.json()) as RotinaRequestBody

    // Personalização Eu360 (fallback seguro)
    const { profile, child } = (await loadMaternaContextFromRequest(req)) as {
      profile: MaternaProfile | null
      child: MaternaChildProfile | null
    }

    // -----------------------------------------
    // 1) IDEIAS RÁPIDAS / MICRO-RITMOS / FASE-CONTEXTO
    // -----------------------------------------
    if (
      body.feature === 'quick-ideas' ||
      body.feature === 'micro-ritmos' ||
      body.feature === 'fase-contexto'
    ) {
      /**
       * IMPORTANTE:
       * callMaternaAI tipa context como RotinaQuickIdeasContext.
       * Bloco 3 e 4 precisam enviar chaves extras (idade/faixa_etaria/etc).
       * Para não mexer no maternaCore agora, usamos "any" aqui.
       */
      const context: any = {
        tempoDisponivel: body.tempoDisponivel ?? null,
        comQuem: body.comQuem ?? null,
        tipoIdeia: body.tipoIdeia ?? null,
        origin: body.origin ?? null,
        feature: body.feature ?? null,
      }

      // Bloco 3 — micro-ritmos (continuidade)
      if (body.feature === 'micro-ritmos' || body.tipoIdeia === 'meu-filho-bloco-3') {
        context.idade = body.idade ?? null
        context.faixa_etaria = body.faixa_etaria ?? null
        context.momento_do_dia = body.momento_do_dia ?? null
        context.tipo_experiencia = body.tipo_experiencia ?? null
        context.contexto = body.contexto ?? null
      }

      // Bloco 4 — fase/contexto (lente prática)
      if (body.feature === 'fase-contexto' || body.tipoIdeia === 'meu-filho-bloco-4') {
        context.idade = body.idade ?? null
        context.faixa_etaria = body.faixa_etaria ?? null
        context.momento_desenvolvimento = body.momento_desenvolvimento ?? null
        context.contexto = body.contexto ?? 'fase'
      }

      const result = await callMaternaAI({
        mode: 'quick-ideas',
        profile,
        child,
        context, // <- any
      } as any)

      // ✅ Guardrail canônico: Meu Filho — Bloco 1
      if (body.tipoIdeia === 'meu-filho-bloco-1') {
        const sanitized = sanitizeMeuFilhoBloco1(result.suggestions, body.tempoDisponivel ?? null)

        return NextResponse.json(
          { suggestions: sanitized }, // pode ser [] para cair no fallback silencioso do client
          { status: 200, headers: NO_STORE_HEADERS },
        )
      }

      // ✅ Guardrail canônico: Meu Filho — Bloco 2 (Cards de atividades)
      if (body.tipoIdeia === 'meu-filho-bloco-2') {
        const sanitized = sanitizeMeuFilhoBloco2Suggestions(
          result.suggestions ?? [],
          body.tempoDisponivel ?? null,
        )

        return NextResponse.json(
          { suggestions: sanitized }, // pode ser [] para fallback silencioso do client
          { status: 200, headers: NO_STORE_HEADERS },
        )
      }

      // ✅ Guardrail canônico: Meu Filho — Bloco 4 (Fases / Contexto)
      if (body.tipoIdeia === 'meu-filho-bloco-4') {
        const sanitized = sanitizeMeuFilhoBloco4(result.suggestions)

        return NextResponse.json(
          { suggestions: sanitized }, // pode ser [] para fallback silencioso do client
          { status: 200, headers: NO_STORE_HEADERS },
        )
      }

      // default: contrato original
      return NextResponse.json(
        { suggestions: result.suggestions ?? [] },
        { status: 200, headers: NO_STORE_HEADERS },
      )
    }

    // -----------------------------------------
    // 2) RECEITAS INTELIGENTES (modo smart-recipes)
    // -----------------------------------------
    const result = await callMaternaAI({
      mode: 'smart-recipes',
      profile,
      child,
      context: {
        ingredientePrincipal: body.ingredientePrincipal ?? null,
        tipoRefeicao: body.tipoRefeicao ?? null,
        tempoPreparo: body.tempoPreparoMinutos ?? null,
        origin: body.origin ?? null,
        feature: body.feature ?? null,
      } as any,
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
