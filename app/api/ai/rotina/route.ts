import { getAdmEditorialTextPublished } from '@/app/lib/adm/adm.server'
// app/api/ai/rotina/route.ts

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
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

  // Quick ideas (geral)
  tempoDisponivel?: number | null
  comQuem?: RotinaComQuem | null
  tipoIdeia?: RotinaTipoIdeia | null

  // Campos extras (Meu Filho Blocos 2–4)
  ageBand?: string | null
  contexto?: string | null

  // Bloco 3 (Rotinas / Conexão)
  idade?: number | string | null
  faixa_etaria?: string | null
  momento_do_dia?: MomentoDoDia | null
  tipo_experiencia?: Bloco3Tipo | null

  // Bloco 4 (Fases / Contexto)
  momento_desenvolvimento?: MomentoDesenvolvimento | null
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
  const parts = t
    .split(/[.!?]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length
}

/* =========================
   Bloco 1 — Guardrail servidor
========================= */

function sanitizeMeuFilhoBloco1(
  raw: RotinaQuickSuggestion[] | null | undefined,
  tempoDisponivel: number | null | undefined,
): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const description = String(first.description ?? '').trim()

  // 1..280 chars
  if (description.length < 1 || description.length > 280) return []

  // até 3 frases
  const n = countSentences(description)
  if (n < 1 || n > 3) return []

  // linguagem proibida (bem conservador)
  const forbidden = /\b(você pode|voce pode|que tal|talvez|se quiser|uma ideia)\b/i
  if (forbidden.test(description)) return []

  const estimatedMinutes =
    typeof tempoDisponivel === 'number' && Number.isFinite(tempoDisponivel)
      ? Math.max(1, Math.round(tempoDisponivel))
      : first.estimatedMinutes

  const sanitized: RotinaQuickSuggestion = {
    ...first,
    title: '',
    description,
    withChild: true,
    estimatedMinutes,
  }

  return [sanitized]
}

/* =========================
   Bloco 3 — Rotinas / Conexão
   - até 3 frases
   - até 240 chars
   - sem lista / sem cobrança / sem frequência
========================= */

function sanitizeMeuFilhoBloco3(raw: any): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const candidate = first.description ?? first.text ?? first.output ?? ''
  const text = clampText(candidate, 240)
  if (!text) return []

  const low = text.toLowerCase()

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
  if (banned.some((b) => low.includes(b))) return []

  // sem lista
  if (text.includes('\n') || text.includes('•') || text.includes('- ')) return []

  // até 3 frases
  if (countSentences(text) > 3) return []

  const sanitized: RotinaQuickSuggestion = {
    ...first,
    title: '',
    description: text,
    withChild: true,
    estimatedMinutes: 0,
  }

  return [sanitized]
}

/* =========================
   Bloco 4 — Fases / Contexto
   - 1 frase
   - até 140 chars
   - neutro / observacional / sem norma
========================= */

function sanitizeMeuFilhoBloco4(raw: any): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const candidate = first.description ?? first.text ?? first.output ?? ''
  const text = clampText(candidate, 140)
  if (!text) return []

  const low = text.toLowerCase()

  // 1 frase (bem conservador)
  if (countSentences(text) !== 1) return []

  // sem lista/quebra
  if (text.includes('\n') || text.includes('•') || text.includes('- ')) return []

  // frases proibidas (normativas / comparativas / ansiosas)
  const bannedPhrases = [
    'é esperado que',
    'esperado que',
    'normalmente já deveria',
    'já deveria',
    'o ideal é',
    'crianças dessa idade precisam',
    'precisam de',
    'deve',
    'deveria',
    'atraso',
    'adiantado',
    'comparado',
    'comparar',
    'diagnóstico',
    'tdah',
    'autismo',
  ]
  if (bannedPhrases.some((b) => low.includes(b))) return []

  const sanitized: RotinaQuickSuggestion = {
    ...first,
    title: '',
    description: text,
    withChild: true,
    estimatedMinutes: 0,
  }

  return [sanitized]
}

export async function POST(req: Request) {
  let gate: { actorId: string; dateKey: string } | null = null

  try {
    assertRateLimit(req, 'ai-rotina', {
      limit: 20,
      windowMs: 5 * 60_000,
    })

    // Limite diário global (ética) — backend como fonte de verdade
    const g = await tryConsumeDailyAI(DAILY_LIMIT)
    gate = { actorId: g.actorId, dateKey: g.dateKey }

    if (!g.allowed) {
      const res = NextResponse.json(
        {
          blocked: true,
          message: DAILY_LIMIT_MESSAGE,
          // Mantém shapes compatíveis com os dois caminhos principais deste endpoint
          suggestions: [],
          recipes: [],
        },
        { status: 200, headers: NO_STORE_HEADERS },
      )

      if (g.anonToSet) {
        res.cookies.set(DAILY_LIMIT_ANON_COOKIE, g.anonToSet, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      }

      console.info('[AI_LIMIT] blocked', {
        route: '/api/ai/rotina',
        actorId: g.actorId,
        dateKey: g.dateKey,
      })

      return res
    }

    const body = (await req.json()) as RotinaRequestBody


      const rawFeature = String((body as any)?.feature ?? '')
      const feature = rawFeature === 'fase-contexto' ? 'fase' : rawFeature
    const { profile, child } = (await loadMaternaContextFromRequest(req)) as {
      profile: MaternaProfile | null
      child: MaternaChildProfile | null
    }

    // Tratamos micro-ritmos e fase como variações de quick-ideas (sem estourar tipos do core)
    const isQuick =
      body.feature === 'quick-ideas' || body.feature === 'micro-ritmos' || body.feature === 'fase'

    if (isQuick) {
      // IMPORTANTÍSSIMO:
      // RotinaQuickIdeasContext (do core) não conhece campos como "idade".
      // Então montamos como "any" aqui para não quebrar o build, mantendo o contrato do core intacto.
      const ctx: any = {
        tempoDisponivel: body.tempoDisponivel ?? null,
        comQuem: body.comQuem ?? null,
        tipoIdeia: body.tipoIdeia ?? null,

        // extras (podem ser usados pelo prompt do core, sem tipagem rígida aqui)
        ageBand: body.ageBand ?? null,
        contexto: body.contexto ?? null,

        // bloco 3
        idade: body.idade ?? null,
        faixa_etaria: body.faixa_etaria ?? null,
        momento_do_dia: body.momento_do_dia ?? null,
        tipo_experiencia: body.tipo_experiencia ?? null,

        // bloco 4
        momento_desenvolvimento: body.momento_desenvolvimento ?? null,
      }


      // ADM (Base Curada) — Plano editorial do Bloco 1 (Meu Filho)
      if (body.tipoIdeia === 'meu-filho-bloco-1') {
        const plan = await getAdmEditorialTextPublished({ hub: 'meu-filho', key: 'bloco-1-plan' }).catch(() => null)
        if (plan?.body) {
          ctx.admPlanBody = plan.body
          ctx.__adm = { hub: 'meu-filho', key: 'bloco-1-plan', updated_at: plan.updated_at ?? null }
        }
      }

      const result = await callMaternaAI({
        mode: 'quick-ideas',
        profile,
        child,
        context: ctx,
      })

      // ✅ Meu Filho — Bloco 1
      if (body.tipoIdeia === 'meu-filho-bloco-1') {
        const sanitized = sanitizeMeuFilhoBloco1(result.suggestions, body.tempoDisponivel ?? null)
        return NextResponse.json({ suggestions: sanitized, ...(((result as any)?.meta) ? { meta: (result as any).meta } : {}) }, { status: 200, headers: NO_STORE_HEADERS })
      }

      // ✅ Meu Filho — Bloco 2
      if (body.tipoIdeia === 'meu-filho-bloco-2') {
        const sanitized = sanitizeMeuFilhoBloco2Suggestions(
          result.suggestions ?? [],
          body.tempoDisponivel ?? null,
        )
        return NextResponse.json({ suggestions: sanitized, ...(((result as any)?.meta) ? { meta: (result as any).meta } : {}) }, { status: 200, headers: NO_STORE_HEADERS })
      }

      // ✅ Meu Filho — Bloco 3 (Rotinas / Conexão)
      if (body.tipoIdeia === 'meu-filho-bloco-3') {
        const sanitized = sanitizeMeuFilhoBloco3(result.suggestions ?? [])
        return NextResponse.json({ suggestions: sanitized, ...(((result as any)?.meta) ? { meta: (result as any).meta } : {}) }, { status: 200, headers: NO_STORE_HEADERS })
      }

      // ✅ Meu Filho — Bloco 4 (Fases / Contexto)
      if (body.tipoIdeia === 'meu-filho-bloco-4') {
        // ADM-first (Base Curada) — Bloco 4 (Fases / Contexto)
        // Key determinístico: bloco-4|<faixa>|<foco>
        const admHub = 'meu-filho'
        const faixa = String(body.faixa_etaria ?? body.idade ?? '').trim()
        const foco = String((body as any).foco ?? '').trim()
        const admKey = `bloco-4|${faixa || 'geral'}|${foco || 'geral'}`
        const metaBase = { admHub: 'meu-filho', admKey }

        const meta = { source: 'adm', admHub: 'meu-filho', admKey }


          // ADM-first — Bloco 4 (Fases / Contexto) com VARIANTS
          const { data: variants, error } = await supabaseAdmin().rpc(
          'adm_get_editorial_variants_published',
          {
          p_hub: admHub,
          p_key: admKey,
          p_limit: 3,
          }
          )
          if (!error && variants?.length) {
          const suggestions: RotinaQuickSuggestion[] = variants.map((v: any, idx: number) => ({
          id: `mf_b4_${faixa || 'geral'}_${foco || 'geral'}_${String((v?.variant_index ?? idx) as any)}`.replace(/[^a-zA-Z0-9_]/g, '_'),
          category: 'ideia-rapida',
          title: '',
          description: String(v?.body ?? ''),
          estimatedMinutes: 0,
          withChild: true,
          moodImpact: 'aproxima',
          }))
          return NextResponse.json(
          {
          suggestions,
          meta: { source: 'adm', admHub, admKey, variantCount: variants.length },
          },
          { status: 200, headers: NO_STORE_HEADERS },
          )
          }
          // Fallback: segue fluxo normal (IA / heurística) do endpoint
          // ✅ MVP: ainda assim devolvemos meta para rastrear se veio do ADM ou fallback
          return NextResponse.json(
            {
              suggestions: result.suggestions ?? [],
              meta: { source: 'fallback', ...metaBase },
            },
            { status: 200, headers: NO_STORE_HEADERS },
          )

      }


      // default: contrato original
      return NextResponse.json(
        { suggestions: result.suggestions ?? [] },
        { status: 200, headers: NO_STORE_HEADERS },
      )
    }

    // Receitas
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
    // Se já consumimos cota e falhou antes de entregar resposta "final", liberamos o consumo
    if (gate) {
      await releaseDailyAI(gate.actorId, gate.dateKey)
    }

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
