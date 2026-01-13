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

type MomentoDoDia = 'manhã' | 'tarde' | 'noite' | 'transição'
type Bloco3Tipo = 'rotina' | 'conexao'
type MomentoDesenvolvimento = 'exploracao' | 'afirmacao' | 'imitacao' | 'autonomia'

type RotinaRequestBody = {
  feature?: 'recipes' | 'quick-ideas' | 'micro-ritmos' | 'fase'
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
  // Remove bullets e marcadores comuns sem destruir hífens dentro de frases.
  // - Remove marcadores no início de linha (listas) e bullets “soltos”.
  const noBullets = s
    .replace(/^\s*([•●▪▫◦]|[-–—])\s+/gm, '') // bullet / traço como lista (início de linha)
    .replace(/[•●▪▫◦]\s*/g, '') // bullets soltos
    .replace(/\s+/g, ' ')
    .trim()

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

function removeSoftOpeners(t: string) {
  // Remove “muletas” comuns de abertura sem invalidar o conteúdo.
  // Mantém o texto mais direto e alinhado à voz do produto.
  let s = t.trim()

  // Remove variações no começo da frase, de forma conservadora.
  const patterns: RegExp[] = [
    /^(\s*)(você pode|voce pode)\s*[:,\-–—]?\s*/i,
    /^(\s*)(que tal)\s*[:,\-–—]?\s*/i,
    /^(\s*)(talvez)\s*[:,\-–—]?\s*/i,
    /^(\s*)(se quiser)\s*[:,\-–—]?\s*/i,
    /^(\s*)(uma ideia)\s*[:,\-–—]?\s*/i,
  ]

  for (const p of patterns) s = s.replace(p, '')

  // Ajuste fino: se sobrou frase começando com vírgula, remove.
  s = s.replace(/^,\s*/, '')
  return s.trim()
}

function safeMinutes(n: unknown) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  return Math.max(1, Math.round(n))
}

function shortCtxLabel(ctx: any) {
  const parts: string[] = []
  const m = ctx?.momento_do_dia ? String(ctx.momento_do_dia) : ''
  const te = ctx?.tipo_experiencia ? String(ctx.tipo_experiencia) : ''
  const c = ctx?.contexto ? String(ctx.contexto) : ''
  const fe = ctx?.faixa_etaria ? String(ctx.faixa_etaria) : ''
  const ab = ctx?.ageBand ? String(ctx.ageBand) : ''

  if (m) parts.push(m)
  if (te) parts.push(te)
  if (fe) parts.push(fe)
  if (ab && !fe) parts.push(ab)
  if (c) parts.push(c)

  // Mantém curto e discreto
  const label = parts
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ')

  return label ? `(${label})` : ''
}

function makeFallbackBloco1(ctx: any, tempoDisponivel: number | null | undefined): RotinaQuickSuggestion[] {
  const minutes = safeMinutes(tempoDisponivel) ?? safeMinutes(ctx?.tempoDisponivel) ?? 5
  const hint = shortCtxLabel(ctx)

  // 1–2 frases, neutro, direto, sem cobrança, sem “todo dia”.
  const text = clampText(
    removeSoftOpeners(
      `Em ${minutes} min ${hint} faça uma pausa curta: sente perto, descreva em voz baixa o que vocês estão fazendo e convide seu filho a escolher uma coisa para mostrar.`,
    ),
    280,
  )

  if (!text) return []

  return [
    {
      title: '',
      description: text,
      withChild: true,
      estimatedMinutes: minutes,
    } as RotinaQuickSuggestion,
  ]
}

function makeFallbackBloco3(ctx: any): RotinaQuickSuggestion[] {
  const hint = shortCtxLabel(ctx)

  const text = clampText(
    removeSoftOpeners(
      `${hint} Escolha um micro-ritmo simples: antes de trocar de atividade, pare por 20 segundos, faça contato visual e combine “primeiro isto, depois aquilo” em uma frase.`,
    ),
    240,
  )

  if (!text) return []

  return [
    {
      title: '',
      description: text,
      withChild: true,
      estimatedMinutes: 0,
    } as RotinaQuickSuggestion,
  ]
}

function makeFallbackBloco4(ctx: any): RotinaQuickSuggestion[] {
  const hint = shortCtxLabel(ctx)

  // 1 frase, observacional, sem norma/diagnóstico.
  const text = clampText(
    removeSoftOpeners(
      `${hint} Se hoje estiver mais sensível, pequenas escolhas guiadas (“você prefere A ou B?”) costumam ajudar a reduzir atrito sem aumentar a exigência.`,
    ),
    140,
  )

  if (!text) return []

  // Força 1 frase: se virar 2 por pontuação, simplifica.
  const one = text.split(/[.!?]+/g).map((s) => s.trim()).filter(Boolean)[0] ?? ''
  const final = clampText(one ? `${one}.` : '', 140)
  if (!final) return []

  return [
    {
      title: '',
      description: final.replace(/\.\.+$/, '.'),
      withChild: true,
      estimatedMinutes: 0,
    } as RotinaQuickSuggestion,
  ]
}

/* =========================
   Bloco 1 — Guardrail servidor
========================= */

function sanitizeMeuFilhoBloco1(
  raw: RotinaQuickSuggestion[] | null | undefined,
  tempoDisponivel: number | null | undefined,
  ctx?: any,
): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return makeFallbackBloco1(ctx, tempoDisponivel)

  let description = String(first.description ?? '').trim()
  description = removeSoftOpeners(description)

  // 1..280 chars
  if (description.length < 1 || description.length > 280) {
    return makeFallbackBloco1(ctx, tempoDisponivel)
  }

  // até 3 frases
  const n = countSentences(description)
  if (n < 1 || n > 3) {
    return makeFallbackBloco1(ctx, tempoDisponivel)
  }

  // evita “listas” e quebras (inteligência percebida cai)
  if (description.includes('\n') || description.includes('•') || description.includes('- ')) {
    return makeFallbackBloco1(ctx, tempoDisponivel)
  }

  const estimatedMinutes =
    typeof tempoDisponivel === 'number' && Number.isFinite(tempoDisponivel)
      ? Math.max(1, Math.round(tempoDisponivel))
      : first.estimatedMinutes

  const sanitized: RotinaQuickSuggestion = {
    ...first,
    title: '',
    description,
    withChild: true,
    estimatedMinutes: estimatedMinutes ?? 0,
  }

  return [sanitized]
}

/* =========================
   Bloco 3 — Rotinas / Conexão
   - até 3 frases
   - até 240 chars
   - sem lista / sem cobrança / sem frequência
========================= */

function sanitizeMeuFilhoBloco3(raw: any, ctx?: any): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return makeFallbackBloco3(ctx)

  const candidate = first.description ?? first.text ?? first.output ?? ''
  let text = clampText(candidate, 240)
  text = removeSoftOpeners(text)
  if (!text) return makeFallbackBloco3(ctx)

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
  if (banned.some((b) => low.includes(b))) return makeFallbackBloco3(ctx)

  // sem lista
  if (text.includes('\n') || text.includes('•') || text.includes('- ')) return makeFallbackBloco3(ctx)

  // até 3 frases
  if (countSentences(text) > 3) return makeFallbackBloco3(ctx)

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

function sanitizeMeuFilhoBloco4(raw: any, ctx?: any): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return makeFallbackBloco4(ctx)

  const candidate = first.description ?? first.text ?? first.output ?? ''
  let text = clampText(candidate, 140)
  text = removeSoftOpeners(text)
  if (!text) return makeFallbackBloco4(ctx)

  const low = text.toLowerCase()

  // 1 frase (bem conservador)
  if (countSentences(text) !== 1) return makeFallbackBloco4(ctx)

  // sem lista/quebra
  if (text.includes('\n') || text.includes('•') || text.includes('- ')) return makeFallbackBloco4(ctx)

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
  if (bannedPhrases.some((b) => low.includes(b))) return makeFallbackBloco4(ctx)

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

      const result = await callMaternaAI({
        mode: 'quick-ideas',
        profile,
        child,
        context: ctx,
      })

      // ✅ Meu Filho — Bloco 1
      if (body.tipoIdeia === 'meu-filho-bloco-1') {
        const sanitized = sanitizeMeuFilhoBloco1(
          result.suggestions,
          body.tempoDisponivel ?? null,
          ctx,
        )
        return NextResponse.json({ suggestions: sanitized }, { status: 200, headers: NO_STORE_HEADERS })
      }

      // ✅ Meu Filho — Bloco 2
      if (body.tipoIdeia === 'meu-filho-bloco-2') {
        const sanitized = sanitizeMeuFilhoBloco2Suggestions(
          result.suggestions ?? [],
          body.tempoDisponivel ?? null,
        )
        return NextResponse.json({ suggestions: sanitized }, { status: 200, headers: NO_STORE_HEADERS })
      }

      // ✅ Meu Filho — Bloco 3 (Rotinas / Conexão)
      if (body.tipoIdeia === 'meu-filho-bloco-3') {
        const sanitized = sanitizeMeuFilhoBloco3(result.suggestions ?? [], ctx)
        return NextResponse.json({ suggestions: sanitized }, { status: 200, headers: NO_STORE_HEADERS })
      }

      // ✅ Meu Filho — Bloco 4 (Fases / Contexto)
      if (body.tipoIdeia === 'meu-filho-bloco-4') {
        const sanitized = sanitizeMeuFilhoBloco4(result.suggestions ?? [], ctx)
        return NextResponse.json({ suggestions: sanitized }, { status: 200, headers: NO_STORE_HEADERS })
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
