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
   Helpers de normalização
========================= */

function normalizeAgeBandVariants(raw: string): string[] {
  const base = String(raw ?? '').trim()
  if (!base) return []
  const hyphen = base.replace(/–/g, '-')
  const endash = base.replace(/-/g, '–')
  return Array.from(new Set([base, hyphen, endash].filter(Boolean)))
}

function normalizeEnvVariants(raw: string): string[] {
  const v = String(raw ?? '').trim()
  if (!v) return []

  const low = v
    .toLowerCase()
    .replace(/[ãáâ]/g, 'a')
    .replace(/ç/g, 'c')
    .replace(/[íì]/g, 'i')
    .replace(/[õóô]/g, 'o')
    .replace(/–/g, '-')

  const norm =
    low.includes('manha') ? 'manha'
    : low.includes('trans') ? 'transicao'
    : low.includes('banh') ? 'banho'
    : low.includes('jant') ? 'jantar'
    : low.includes('sono') ? 'sono'
    : low || ''

  const humanMap: Record<string, string> = {
    manha: 'Manhã',
    transicao: 'Transição',
    banho: 'Banho',
    jantar: 'Jantar',
    sono: 'Sono',
  }

  const human = norm && humanMap[norm] ? humanMap[norm] : ''
  return Array.from(new Set([v, norm, human].filter(Boolean)))
}

function normalizeTagToken(raw: string): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[ãáâ]/g, 'a')
    .replace(/ç/g, 'c')
    .replace(/[íì]/g, 'i')
    .replace(/[õóô]/g, 'o')
    .replace(/–/g, '-')
}
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
    const body = (await req.json()) as RotinaRequestBody

    // ✅ EARLY RETURN — ROTINA (ADM-FIRST) — Meu Filho
    // (não depende de feature; evita cair em IA/fallback)
    const tipo = String((body as any)?.tipoIdeia ?? '')
    if (String((body as any)?.tipoIdeia ?? '') === 'meu-filho-rotina') {
      const rawEnv = String((body as any)?.environment ?? (body as any)?.tema ?? '')
      const rawAge = String((body as any)?.ageBand ?? (body as any)?.faixa_etaria ?? (body as any)?.idade ?? '')
      const tempo = Number((body as any)?.tempoDisponivel ?? (body as any)?.duration_minutes ?? 0)
      const avoidIds = (((body as any)?.avoidIds ?? []) as string[]).map((x) => String(x))

      const envLow = rawEnv
        .trim()
        .toLowerCase()
        .replace(/[ãáâ]/g, 'a')
        .replace(/ç/g, 'c')
        .replace(/[íì]/g, 'i')
        .replace(/[õóô]/g, 'o')

      const envNorm =
        envLow.includes('manha') ? 'manha'
        : envLow.includes('trans') ? 'transicao'
        : envLow.includes('banh') ? 'banho'
        : envLow.includes('jant') ? 'jantar'
        : envLow.includes('sono') ? 'sono'
        : envLow || 'any'

      const ageNorm = rawAge.trim().replace(/–/g, '-')

      const seed = String((body as any)?.nonce ?? (body as any)?.requestId ?? '')
      const hash = (str: string) => {
        let h = 2166136261
        for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
        return h >>> 0
      }

      const sb = supabaseAdmin()
      let base = sb
        .from('adm_ideas')
        .select('id, title, short_description, steps, duration_minutes, age_band, environment, status, hub, tags')
        .eq('hub', 'meu-filho')
        .eq('status', 'published')
        .or(`environment.ilike.%${envNorm}%,environment.ilike.%any%`)
        .eq('age_band', ageNorm)
        .eq('duration_minutes', tempo)

      // IMPORTANTE: não filtrar avoidIds no SQL.
      // Precisamos do universo (allIdeas) para reiniciar ciclo quando avoidIds esgotar tudo.
      const { data: allIdeas, error } = await base.limit(24)
      const ideas = allIdeas

      if (!error && ideas?.length) {
        const sorted = [...ideas].sort((a, b) => {
          const ha = hash(seed + '|' + String(a.id))
          const hb = hash(seed + '|' + String(b.id))
          return ha - hb
        })

        // 1) remove avoidIds localmente (segurança extra; query já tentou filtrar)
        const remaining = avoidIds?.length ? sorted.filter((x) => !avoidIds.includes(String(x.id))) : sorted

        // Se avoidIds cobriu todo o pool, não reinicia automaticamente.
        // O client decide quando "resetar o ciclo".
        if (avoidIds.length > 0 && remaining.length === 0) {
          return Response.json({
            suggestions: [],
            meta: {
              source: 'adm',
              admHub: 'meu-filho',
              tipoIdeia: 'meu-filho-rotina',
              env: envNorm,
              age: ageNorm,
              tempo,
              avoidCount: avoidIds.length,
              exhausted: true,
              returnedCount: 0,
              poolSize: sorted.length,
            },
          })
        }

        // Seleção: pega até 3 do remaining, com ordem determinística por seed.
        const pool = remaining
        const startIdx = pool.length ? (hash(seed) % pool.length) : 0
        const picks: any[] = []
        const pickedIds = new Set<string>()
        for (let i = 0; i < 3 && pool.length; i++) {
          const it = pool[(startIdx + i) % pool.length]
          const id = String(it?.id ?? '')
          if (!id || pickedIds.has(id)) continue
          pickedIds.add(id)
          picks.push(it)
        }

        const exhaustedFlag = remaining.length === 0 && avoidIds.length > 0

        return Response.json({
          suggestions: picks.map((pick: any) => ({
            id: pick.id,
            category: 'rotina',
            title: pick.title,
            description: pick.short_description,
            estimatedMinutes: pick.duration_minutes,
            withChild: true,
            steps: pick.steps,
          })),
          meta: {
            source: 'adm',
            admHub: 'meu-filho',
            tipoIdeia: 'meu-filho-rotina',
            env: envNorm,
            age: ageNorm,
            tempo,
            avoidCount: avoidIds.length,
            exhausted: exhaustedFlag,
            returnedCount: picks.length,
            poolSize: pool.length,
          },
        })
      }

      // Se não achou nada no ADM para este recorte, não cai na IA.
      return Response.json({
        suggestions: [],
        meta: {
          source: 'adm',
          admHub: 'meu-filho',
          tipoIdeia: 'meu-filho-rotina',
          env: envNorm,
          age: ageNorm,
          tempo,
          avoidCount: avoidIds.length,
          exhausted: false,
          returnedCount: 0,
          poolSize: 0,
          reason: 'no_rows_for_filter',
        },
      })
    }

    // ✅ EARLY RETURN — CONEXÃO (ADM-FIRST) — Meu Filho
    // Cria um bloco próprio para Conexão, sem misturar com Bloco 3.
    // Fonte: adm_ideas (status=published) filtrando por:
    // hub + env + faixa + tempo + tags contendo "conexao" + tema (ex: check-in, carinho, conversa, calmaria)
    if (String((body as any)?.tipoIdeia ?? '') === 'meu-filho-conexao') {
      const rawEnv = String((body as any)?.momento_do_dia ?? (body as any)?.environment ?? (body as any)?.momento ?? '')
      const rawTema = String((body as any)?.tema ?? '').trim()
      const rawAge = String((body as any)?.faixa_etaria ?? (body as any)?.ageBand ?? (body as any)?.idade ?? '').trim()

      const ageVariants = normalizeAgeBandVariants(rawAge)

      // ENV (momento_do_dia) — Conexão: usar ambiente real + fallback 'any'
      const envVariants = normalizeEnvVariants(String(rawEnv ?? ''))
      const envCandidates = envVariants.length
        ? Array.from(new Set([...envVariants, 'any']))
        : ['any']
      const tempo = Number((body as any)?.tempoDisponivel ?? (body as any)?.duration_minutes ?? (body as any)?.durationMinutes ?? 0)
      const avoidIds = (((body as any)?.avoidIds ?? []) as string[]).map((x) => String(x))

      const normLow = (v: string) =>
        String(v ?? '')
          .trim()
          .toLowerCase()
          .replace(/[ãáâ]/g, 'a')
          .replace(/ç/g, 'c')
          .replace(/[íì]/g, 'i')
          .replace(/[õóô]/g, 'o')
          .replace(/–/g, '-')

      const envLow = normLow(rawEnv)

      const envNorm =
        envLow.includes('manha') ? 'manha'
        : envLow.includes('trans') ? 'transicao'
        : envLow.includes('banh') ? 'banho'
        : envLow.includes('jant') ? 'jantar'
        : envLow.includes('sono') ? 'sono'
        : envLow || 'any'

      const temaNorm = normLow(rawTema) // ex: check-in | carinho | conversa | calmaria
      const ageNorm = normLow(rawAge)
      // ✅ Compat com CSV/Supabase (valores humanos)
      const envDb =
        envNorm === 'manha'
          ? 'Manhã'
          : envNorm === 'transicao'
            ? 'Transição'
            : envNorm === 'banho'
              ? 'Banho'
              : envNorm === 'jantar'
                ? 'Jantar'
                : envNorm === 'sono'
                  ? 'Sono'
                  : envNorm

      const ageDb =
        ageNorm === '0-2'
          ? '0–2'
          : ageNorm === '3-4'
            ? '3–4'
            : ageNorm === '5-6'
              ? '5–6'
              : ageNorm

      const seed = String((body as any)?.nonce ?? (body as any)?.requestId ?? '')
      const hash = (str: string) => {
        let h = 2166136261
        for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
        return h >>> 0
      }

      const sb = supabaseAdmin()

      // ✅ Query robusta (sem .or): evita sobrescrever filtros OR no supabase-js
      // Estratégia:
      // 1) filtra por hub/status + env (envDb ou 'any') + age (múltiplas formas) + tempo (tempo ou 0)
      // 2) filtra tags/tema localmente (funciona para tags string OU array/json)
      let base: any = sb
        .from('adm_ideas')
        .select('id, title, short_description, steps, duration_minutes, age_band, environment, status, hub, tags')
        .eq('hub', 'meu-filho')
        .eq('status', 'published')
        .or(`environment.ilike.%${envDb}%,environment.ilike.%any%`)
        .in('age_band', (ageVariants.length ? ageVariants : [ageDb, ageNorm, ageNorm.replace('-', '–')]))
        .in('environment', envCandidates)


      if (Number.isFinite(tempo) && tempo > 0) {
        base = base.in('duration_minutes', [tempo, 0])
      }

      const { data: allIdeas, error } = await base.limit(50)


      // 2) filtra tags/tema localmente (funciona para tags string OU array/json)
      const temaNorm = normalizeTagToken(rawTema || '')
      const filteredIdeas = (allIdeas ?? []).filter((row: any) => {
        const tagsRaw = (row as any)?.tags
        const tagsStr = Array.isArray(tagsRaw)
          ? tagsRaw.map((x: any) => String(x ?? '')).join(' ')
          : String(tagsRaw ?? '')

        const low = normalizeTagToken(tagsStr)

        // precisa conter "conexao"
        if (!low.includes('conexao')) return false

        // se veio tema, precisa bater também
        if (temaNorm && !low.includes(temaNorm)) return false

        return true
      })
      const ideas = Array.isArray(allIdeas)
        ? (allIdeas as any[]).filter((row: any) => {
            const tagsRaw = (row as any)?.tags
            const tagsStr = Array.isArray(tagsRaw)
              ? tagsRaw.map((x: any) => String(x ?? '')).join(' ')
              : String(tagsRaw ?? '')
            const low = tagsStr.toLowerCase()

            // precisa conter "conexao"
            if (!low.includes('conexao')) return false

            // se tema existe, precisa conter tema ou variação (check-in/checkin/check in)
            if (temaNorm) {
              const temaAlt = temaNorm.replace(/[- ]/g, '')
              if (!(low.includes(temaNorm) || low.includes(temaAlt))) return false
            }

            return true
          })
        : null

      if (!error && ideas?.length) {
        const sorted = [...ideas].sort((a, b) => {
          const ha = hash(seed + '|' + String(a.id))
          const hb = hash(seed + '|' + String(b.id))
          return ha - hb
        })

        const remaining = avoidIds?.length ? sorted.filter((x) => !avoidIds.includes(String(x.id))) : sorted

        if (avoidIds.length > 0 && remaining.length === 0) {
          return Response.json({
            suggestions: [],
            meta: {
              source: 'adm',
              admHub: 'meu-filho',
              tipoIdeia: 'meu-filho-conexao',
              env: envNorm,
              tema: temaNorm || null,
              age: ageNorm,
              tempo,
              avoidCount: avoidIds.length,
              exhausted: true,
              returnedCount: 0,
              poolSize: sorted.length,
            },
          })
        }

        const pool = remaining
        const startIdx = pool.length ? (hash(seed) % pool.length) : 0
        const picks: any[] = []
        const pickedIds = new Set<string>()
        for (let i = 0; i < 3 && pool.length; i++) {
          const it = pool[(startIdx + i) % pool.length]
          const id = String(it?.id ?? '')
          if (!id || pickedIds.has(id)) continue
          pickedIds.add(id)
          picks.push(it)
        }

        const exhaustedFlag = remaining.length === 0 && avoidIds.length > 0

        return Response.json({
          suggestions: picks.map((pick: any) => ({
            id: pick.id,
            category: 'conexao',
            title: pick.title,
            description: pick.short_description,
            estimatedMinutes: pick.duration_minutes,
            withChild: true,
            steps: pick.steps,
          })),
          meta: {
            source: 'adm',
            admHub: 'meu-filho',
            tipoIdeia: 'meu-filho-conexao',
            env: envNorm,
            tema: temaNorm || null,
            age: ageNorm,
            tempo,
            avoidCount: avoidIds.length,
            exhausted: exhaustedFlag,
            returnedCount: picks.length,
            poolSize: pool.length,
          },
        })
      }

      return Response.json({
        suggestions: [],
        meta: {
          source: 'adm',
          admHub: 'meu-filho',
          tipoIdeia: 'meu-filho-conexao',
          env: envNorm,
          tema: temaNorm || null,
          age: ageNorm,
          tempo,
          avoidCount: avoidIds.length,
          exhausted: false,
          returnedCount: 0,
          poolSize: 0,
          reason: 'no_rows_for_filter',
        },
      })
    }

    // =========================
    // ADM-first fast path (não consome rate/daily)
    // =========================
    const tipoIdeia = String((body as any)?.tipoIdeia ?? '')
    const isMeuFilhoBloco4 = tipoIdeia === 'meu-filho-bloco-4'
    const isMeuFilhoBloco3 = tipoIdeia === 'meu-filho-bloco-3'

    if (isMeuFilhoBloco4 || isMeuFilhoBloco3) {
      const admHub = 'meu-filho'

      // ✅ Bloco 4 — key: bloco-4|<faixa>|<foco>
      if (isMeuFilhoBloco4) {
        const faixa = String((body as any)?.faixa_etaria ?? '').trim()
        const foco = String((body as any)?.foco ?? '').trim()
        const admKey = `bloco-4|${faixa || 'geral'}|${foco || 'geral'}`

        const { data: variants, error } = await supabaseAdmin().rpc('adm_get_editorial_variants_published', {
          p_hub: admHub,
          p_key: admKey,
          p_limit: 3,
        })

        if (!error && variants?.length) {
          const suggestions: RotinaQuickSuggestion[] = (variants as any[]).map((v: any, idx: number) => ({
            id: `mf_b4_${faixa || 'geral'}_${foco || 'geral'}_${String(v?.variant_index ?? idx)}`.replace(/[^a-zA-Z0-9_]/g, '_'),
            category: 'ideia-rapida',
            title: '',
            description: String(v?.body ?? ''),
            estimatedMinutes: 0,
            withChild: true,
            moodImpact: 'aproxima',
          }))

          return NextResponse.json(
            { suggestions, meta: { source: 'adm', admHub, admKey, variantCount: variants.length } },
            { status: 200, headers: NO_STORE_HEADERS },
          )
        }
      }

      // ✅ Bloco 3 — key: bloco-3|<tipo>|<tema>|<momento>|<faixa>
      if (isMeuFilhoBloco3) {
        const tipo = String((body as any)?.tipo_experiencia ?? '').trim()
        const tema = String((body as any)?.tema ?? '').trim()
        const momento = String((body as any)?.momento_do_dia ?? '').trim()
        const faixa = String((body as any)?.faixa_etaria ?? '').trim()

        const admKey = `bloco-3|${tipo || 'geral'}|${tema || 'geral'}|${momento || 'geral'}|${faixa || 'geral'}`

        const { data: variants, error } = await supabaseAdmin().rpc('adm_get_editorial_variants_published', {
          p_hub: admHub,
          p_key: admKey,
          p_limit: 3,
        })

        if (!error && variants?.length) {
          const suggestions: RotinaQuickSuggestion[] = (variants as any[]).map((v: any, idx: number) => ({
            id: `mf_b3_${tipo || 'geral'}_${tema || 'geral'}_${momento || 'geral'}_${faixa || 'geral'}_${String(v?.variant_index ?? idx)}`.replace(/[^a-zA-Z0-9_]/g, '_'),
            category: 'ideia-rapida',
            title: '',
            description: String(v?.body ?? ''),
            estimatedMinutes: 0,
            withChild: true,
            moodImpact: 'aproxima',
          }))

          return NextResponse.json(
            { suggestions, meta: { source: 'adm', admHub, admKey, variantCount: variants.length } },
            { status: 200, headers: NO_STORE_HEADERS },
          )
        }
      }

      // se não achou no ADM, cai para o fluxo normal abaixo
    }

    const isBloco4 = typeof (body as any)?.tipoIdeia === 'string' && String((body as any).tipoIdeia).includes('bloco-4')

    if (!isBloco4) {
      assertRateLimit(req, 'ai-rotina', {
        limit: 20,
        windowMs: 5 * 60_000,
      })
    }

    // Limite diário global (ética) — backend como fonte de verdade
    const g = isBloco4 ? (({ allowed: true } as any)) : await tryConsumeDailyAI(DAILY_LIMIT)
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

    const rawFeature = String((body as any)?.feature ?? '')
    const feature = rawFeature === 'fase-contexto' ? 'fase' : rawFeature

    const { profile, child } = (await loadMaternaContextFromRequest(req)) as {
      profile: MaternaProfile | null
      child: MaternaChildProfile | null
    }

    // Tratamos micro-ritmos e fase como variações de quick-ideas (sem estourar tipos do core)
    const isQuick = body.feature === 'quick-ideas' || body.feature === 'micro-ritmos' || body.feature === 'fase'

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
        idade: (body as any).idade ?? null,
        faixa_etaria: (body as any).faixa_etaria ?? null,
        momento_do_dia: (body as any).momento_do_dia ?? null,
        tipo_experiencia: (body as any).tipo_experiencia ?? null,

        // bloco 4
        momento_desenvolvimento: (body as any).momento_desenvolvimento ?? null,
      }

      // ADM (Base Curada) — Plano editorial do Bloco 1 (Meu Filho)
      if ((body as any).tipoIdeia === 'meu-filho-bloco-1') {
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
      if ((body as any).tipoIdeia === 'meu-filho-bloco-1') {
        const sanitized = sanitizeMeuFilhoBloco1(result.suggestions, body.tempoDisponivel ?? null)
        return NextResponse.json(
          { suggestions: sanitized, ...(((result as any)?.meta) ? { meta: (result as any).meta } : {}) },
          { status: 200, headers: NO_STORE_HEADERS },
        )
      }

      // ✅ Meu Filho — Bloco 2
      if ((body as any).tipoIdeia === 'meu-filho-bloco-2') {
        const sanitized = sanitizeMeuFilhoBloco2Suggestions(result.suggestions ?? [], body.tempoDisponivel ?? null)
        return NextResponse.json(
          { suggestions: sanitized, ...(((result as any)?.meta) ? { meta: (result as any).meta } : {}) },
          { status: 200, headers: NO_STORE_HEADERS },
        )
      }

      // ✅ Meu Filho — Bloco 3 (Rotinas / Conexão)
      if ((body as any).tipoIdeia === 'meu-filho-bloco-3') {
        const sanitized = sanitizeMeuFilhoBloco3(result.suggestions ?? [])
        return NextResponse.json(
          { suggestions: sanitized, ...(((result as any)?.meta) ? { meta: (result as any).meta } : {}) },
          { status: 200, headers: NO_STORE_HEADERS },
        )
      }

      // ✅ Meu Filho — Bloco 4 (Fases / Contexto)
      if ((body as any).tipoIdeia === 'meu-filho-bloco-4') {
        // ADM-first (Base Curada) — Bloco 4 (Fases / Contexto)
        // Key determinístico: bloco-4|<faixa>|<foco>
        const admHub = 'meu-filho'
        const faixa = String((body as any).faixa_etaria ?? (body as any).idade ?? '').trim()
        const foco = String((body as any).foco ?? '').trim()
        const admKey = `bloco-4|${faixa || 'geral'}|${foco || 'geral'}`
        const metaBase = { admHub: 'meu-filho', admKey }

        // ADM-first — Bloco 4 (Fases / Contexto) com VARIANTS
        const { data: variants, error } = await supabaseAdmin().rpc('adm_get_editorial_variants_published', {
          p_hub: admHub,
          p_key: admKey,
          p_limit: 3,
        })

        if (!error && variants?.length) {
          const suggestions: RotinaQuickSuggestion[] = (variants as any[]).map((v: any, idx: number) => ({
            id: `mf_b4_${faixa || 'geral'}_${foco || 'geral'}_${String(v?.variant_index ?? idx)}`.replace(/[^a-zA-Z0-9_]/g, '_'),
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
      return NextResponse.json({ suggestions: result.suggestions ?? [] }, { status: 200, headers: NO_STORE_HEADERS })
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

    return NextResponse.json({ recipes: result.recipes ?? [] }, { status: 200, headers: NO_STORE_HEADERS })
  } catch (error) {
    // Se já consumimos cota e falhou antes de entregar resposta "final", liberamos o consumo
    if (gate) {
      await releaseDailyAI(gate.actorId, gate.dateKey)
    }

    if (error instanceof RateLimitError) {
      console.warn('[API /api/ai/rotina] Rate limit atingido:', error.message)
      return NextResponse.json({ error: error.message }, { status: error.status ?? 429, headers: NO_STORE_HEADERS })
    }

    console.error('[API /api/ai/rotina] Erro ao gerar sugestões:', error)

    return NextResponse.json(
      { error: 'Não consegui gerar sugestões agora, tente novamente em instantes.' },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
