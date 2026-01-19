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
import {
  tryConsumeDailyAI,
  releaseDailyAI,
  DAILY_LIMIT_MESSAGE,
  DAILY_LIMIT_ANON_COOKIE,
  DAILY_LIMIT,
} from '@/app/lib/ai/dailyLimit.server'

export const runtime = 'nodejs'

/* =========================
   Tipos locais
========================= */

type MomentoDoDia = 'manhã' | 'tarde' | 'noite' | 'transição'
type Bloco3Tipo = 'rotina' | 'conexao'
type MomentoDesenvolvimento = 'exploracao' | 'afirmacao' | 'imitacao' | 'autonomia'

type RotinaRequestBody = {
  feature?: 'recipes' | 'quick-ideas' | 'micro-ritmos' | 'fase' | 'fase-contexto'
  origin?: string

  // Receitas
  ingredientePrincipal?: string | null
  tipoRefeicao?: string | null
  tempoPreparoMinutos?: number | null

  // Quick ideas
  tempoDisponivel?: number | null
  comQuem?: RotinaComQuem | null
  tipoIdeia?: RotinaTipoIdeia | null

  // Blocos Meu Filho
  ageBand?: string | null
  contexto?: string | null
  local?: string | null
  habilidades?: string[] | null

  // Anti-repetição
  avoid_titles?: string[] | null
  avoid_themes?: string[] | null

  // Bloco 3
  idade?: number | string | null
  faixa_etaria?: string | null
  momento_do_dia?: MomentoDoDia | null
  tipo_experiencia?: Bloco3Tipo | null
  tema?: string | null

  // Bloco 4
  momento_desenvolvimento?: MomentoDesenvolvimento | null
  foco?: string | null
}

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

/* =========================
   Helpers de texto
========================= */

function stripEmojiAndBullets(s: string) {
  const noBullets = s.replace(/[•●▪▫◦–—-]\s*/g, '').replace(/\s+/g, ' ').trim()
  return noBullets
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function clampText(raw: unknown, max: number) {
  const t = stripEmojiAndBullets(String(raw ?? '').trim())
  if (!t) return ''
  if (t.length <= max) return t
  return t.slice(0, max - 1).trimEnd() + '…'
}

function countSentences(t: string) {
  return t
    .split(/[.!?]+/g)
    .map((s) => s.trim())
    .filter(Boolean).length
}

function normalizeBloco2SuggestionShape(raw: any): any[] {
  if (!Array.isArray(raw)) return []
  return raw.map((it) => {
    // Se vier como string, tratamos como description
    if (typeof it === 'string') {
      const desc = String(it).trim()
      return { title: '', description: desc }
    }

    const obj = it && typeof it === 'object' ? it : {}
    const title = String(
      (obj as any).title ??
        (obj as any).label ??
        (obj as any).name ??
        (obj as any).activity ??
        '',
    ).trim()
    const description = String(
      (obj as any).description ??
        (obj as any).text ??
        (obj as any).how ??
        (obj as any).output ??
        (obj as any).passos ??
        (obj as any).steps ??
        (obj as any).body ??
        '',
    ).trim()

    return { ...obj, title, description }
  })
}

/** Garante shape mínimo para RotinaQuickSuggestion (id + category) */
function ensureSuggestionBase(first: any, fallbackCategory: string): RotinaQuickSuggestion {
  const obj = first && typeof first === 'object' ? first : {}
  const id =
    typeof (obj as any).id === 'string' && (obj as any).id.trim()
      ? (obj as any).id
      : `mf-${fallbackCategory}-${Date.now()}`
  const category =
    typeof (obj as any).category === 'string' && (obj as any).category.trim()
      ? (obj as any).category
      : fallbackCategory

  return { ...obj, id, category } as RotinaQuickSuggestion
}

/* =========================
   Bloco 1 — Guardrail
========================= */

function sanitizeMeuFilhoBloco1(
  raw: RotinaQuickSuggestion[] | null | undefined,
  tempoDisponivel: number | null | undefined,
): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const description = String((first as any).description ?? '').trim()

  if (description.length < 1 || description.length > 280) return []
  if (countSentences(description) < 1 || countSentences(description) > 3) return []

  const forbidden = /\b(você pode|voce pode|que tal|talvez|se quiser|uma ideia)\b/i
  if (forbidden.test(description)) return []

  const estimatedMinutes =
    typeof tempoDisponivel === 'number' && Number.isFinite(tempoDisponivel)
      ? Math.max(1, Math.round(tempoDisponivel))
      : (first as any).estimatedMinutes

  const base = ensureSuggestionBase(first, 'meu-filho-bloco-1')

  return [
    {
      ...base,
      title: '',
      description,
      withChild: true,
      estimatedMinutes,
    },
  ]
}

/* =========================
   Bloco 3 — Rotinas / Conexão
========================= */

function sanitizeMeuFilhoBloco3(raw: any): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const candidate =
    (first as any).description ??
    (first as any).text ??
    (first as any).output ??
    ''

  const text = clampText(candidate, 240)
  if (!text) return []

  if (countSentences(text) > 3) return []
  if (text.includes('\n') || text.includes('•') || text.includes('- ')) return []

  const banned = [
    'todo dia',
    'todos os dias',
    'sempre',
    'nunca',
    'crie o hábito',
    'hábito',
    'habito',
    'disciplina',
    'rotina ideal',
    'o mais importante é',
  ]
  if (banned.some((b) => text.toLowerCase().includes(b))) return []

  const base = ensureSuggestionBase(first, 'meu-filho-bloco-3')

  return [
    {
      ...base,
      title: '',
      description: text,
      withChild: true,
      estimatedMinutes: 0,
    },
  ]
}

/* =========================
   Bloco 4 — Fases / Contexto
========================= */

function sanitizeMeuFilhoBloco4(raw: any): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const candidate =
    (first as any).description ??
    (first as any).text ??
    (first as any).output ??
    ''

  const text = clampText(candidate, 140)
  if (!text) return []
  if (countSentences(text) !== 1) return []
  if (text.includes('\n') || text.includes('•') || text.includes('- ')) return []

  const banned = [
    'é esperado que',
    'já deveria',
    'o ideal é',
    'precisa',
    'deve',
    'diagnóstico',
    'tdah',
    'autismo',
  ]
  if (banned.some((b) => text.toLowerCase().includes(b))) return []

  const base = ensureSuggestionBase(first, 'meu-filho-bloco-4')

  return [
    {
      ...base,
      title: '',
      description: text,
      withChild: true,
      estimatedMinutes: 0,
    },
  ]
}

/* =========================
   POST
========================= */

export async function POST(req: Request) {
  let gate: { actorId: string; dateKey: string } | null = null

  try {
    assertRateLimit(req, 'ai-rotina', { limit: 20, windowMs: 5 * 60_000 })

    const g = await tryConsumeDailyAI(DAILY_LIMIT)
    gate = { actorId: g.actorId, dateKey: g.dateKey }

    if (!g.allowed) {
      return NextResponse.json(
        {
          blocked: true,
          message: DAILY_LIMIT_MESSAGE,
          suggestions: [],
          recipes: [],
        },
        {
          status: 200,
          headers: {
            ...NO_STORE_HEADERS,
            'Set-Cookie': `${DAILY_LIMIT_ANON_COOKIE}=1; Path=/; Max-Age=86400`,
          },
        },
      )
    }

    const body = (await req.json()) as RotinaRequestBody

    const ctx = await loadMaternaContextFromRequest(req)
    const profile: MaternaProfile | null = ctx.profile ?? null
    const child: MaternaChildProfile | null = ctx.child ?? null

    const aiResponse = await callMaternaAI({
      mode: body.feature === 'recipes' ? 'smart-recipes' : 'quick-ideas',

      profile,
      child,
      context: {
        tempoDisponivel: body.tempoDisponivel ?? null,
        comQuem: body.comQuem ?? null,
        tipoIdeia: body.tipoIdeia ?? null,
      },
      personalization: body,
    })

    const hasSuggestionsField =
      (aiResponse as any) &&
      typeof (aiResponse as any) === 'object' &&
      'suggestions' in (aiResponse as any)

    let suggestions = (hasSuggestionsField
      ? (((aiResponse as any).suggestions ?? []) as any[])
      : []) as any[]

    const rawCount = Array.isArray(suggestions) ? suggestions.length : 0
    const rawSuggestions = Array.isArray(suggestions) ? suggestions.slice(0, 3) : []
    const rawFirst = Array.isArray(suggestions) ? suggestions[0] : null
    const rawFirstType =
      rawFirst === null ? 'null' : Array.isArray(rawFirst) ? 'array' : typeof rawFirst
    const rawFirstKeys =
      rawFirst && typeof rawFirst === 'object' && !Array.isArray(rawFirst)
        ? Object.keys(rawFirst as any).slice(0, 12)
        : []

    // Normalização defensiva do shape do Bloco 2 (sem mudar layout/fluxo)
    if (body.tipoIdeia === 'meu-filho-bloco-2') {
      suggestions = normalizeBloco2SuggestionShape(suggestions)
    }

    if (body.tipoIdeia === 'meu-filho-bloco-1') {
      suggestions = sanitizeMeuFilhoBloco1(suggestions, body.tempoDisponivel)
    }

    if (body.tipoIdeia === 'meu-filho-bloco-2') {
      suggestions = sanitizeMeuFilhoBloco2Suggestions(suggestions, body.tempoDisponivel)
    }

    if (body.tipoIdeia === 'meu-filho-bloco-3') {
      suggestions = sanitizeMeuFilhoBloco3(suggestions)
    }

    if (body.tipoIdeia === 'meu-filho-bloco-4') {
      suggestions = sanitizeMeuFilhoBloco4(suggestions)
    }

    const sanitizedCount = Array.isArray(suggestions) ? suggestions.length : 0
    const isProd = process.env.VERCEL_ENV === 'production'

    const meta =
      !isProd && body.tipoIdeia === 'meu-filho-bloco-2'
        ? {
            hasSuggestionsField,
            rawCount,
            sanitizedCount,
            rawFirstType,
            rawFirstKeys,
            rawPreview:
              Array.isArray(rawSuggestions) && rawSuggestions.length
                ? rawSuggestions.map((x) => {
                    if (typeof x === 'string') return x.slice(0, 160)
                    try {
                      return JSON.stringify(x).slice(0, 220)
                    } catch {
                      return String(x).slice(0, 220)
                    }
                  })
                : null,
            feature: body.feature ?? null,
            tipoIdeia: body.tipoIdeia ?? null,
            mode: body.feature === 'recipes' ? 'smart-recipes' : 'quick-ideas',
            firstKeys:
              Array.isArray(suggestions) && suggestions[0] && typeof suggestions[0] === 'object'
                ? Object.keys(suggestions[0] as any).slice(0, 12)
                : [],
          }
        : undefined

    return NextResponse.json(meta ? { suggestions, meta } : { suggestions }, {
      status: 200,
      headers: NO_STORE_HEADERS,
    })
  } catch (err) {
    if (gate) {
      await releaseDailyAI(gate.actorId, gate.dateKey)
    }

    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Muitas requisições, tente novamente em instantes.' },
        { status: 429, headers: NO_STORE_HEADERS },
      )
    }

    console.error('[API /api/ai/rotina] Erro:', err)

    return NextResponse.json(
      {
        error: 'Não consegui gerar sugestões agora, tente novamente em instantes.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
