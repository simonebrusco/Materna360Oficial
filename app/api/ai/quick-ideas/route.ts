import { NextResponse } from 'next/server'

import { consolidateMaterials, youngestBucket } from '@/app/lib/quickIdeasCatalog'
import { track } from '@/app/lib/telemetry'
import type {
  QuickIdea,
  QuickIdeasAgeBucket,
  QuickIdeasBadge,
  QuickIdeasLocation,
  QuickIdeasEnergy,
  QuickIdeasTimeWindow,
} from '@/app/types/quickIdeas'

export const runtime = 'edge'

/**
 * Payload legado (catálogo por criança / contexto).
 * Mantido integralmente para não quebrar consumidores existentes.
 */
type QuickIdeasRequestLegacy = {
  plan: 'free' | 'essencial' | 'premium'
  profile: {
    active_child_id: string | null
    mode: 'single' | 'all'
    children: Array<{ id: string; name?: string; age_bucket: QuickIdeasAgeBucket }>
  }
  context: {
    location: QuickIdeasLocation
    time_window_min: number
    energy: QuickIdeasEnergy
  }
  locale?: 'pt-BR'
}

/**
 * Memória contextual suave (modo leve):
 * - apenas para reduzir repetição e “tendenciar” de leve a escolha
 * - opcional e compatível com clientes que não enviam nada
 */
type QuickIdeasLightMemory = {
  /**
   * IDs mostrados recentemente (ex.: últimos 3–10).
   * O endpoint tenta não repetir.
   */
  recent_suggestion_ids?: string[]

  /**
   * Sinal leve do estado atual (se o app tiver essa info).
   * Ex.: vindo do Meu Dia / emocional, etc.
   * Opcional; se não vier, não interfere.
   */
  last_signal?: 'heavy' | 'tired' | 'overwhelmed' | 'neutral'

  /**
   * Contexto leve vindo do Eu360 (opcional)
   * Não é usado como perfil; apenas como tendência suave.
   */
  eu360_persona_id?: 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'
  eu360_q1?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia'
  eu360_q3?: 'tempo' | 'emocional' | 'organizacao' | 'conexao' | 'tudo'
}

/**
 * Payload leve (P33.4):
 * - Meu Dia: 1 sugestão curta
 * - Cuidar de Mim: 2 opções + livre arbítrio
 */
type QuickIdeasRequestLight = {
  intent: 'quick_idea'
  nonce?: number
  locale?: 'pt-BR'
  hub?: 'my_day' | 'cuidar_de_mim'
  memory?: QuickIdeasLightMemory
}

type Suggestion = { id: string; title: string; description?: string }

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 })
}

function isLegacyRequest(body: any): body is QuickIdeasRequestLegacy {
  return !!body && typeof body === 'object' && !!body.plan && !!body.profile && !!body.context
}

function isLightRequest(body: any): body is QuickIdeasRequestLight {
  return !!body && typeof body === 'object' && body.intent === 'quick_idea'
}

/** ---------- validações fortes (legado) ---------- */

const LOCATION_SET = new Set<QuickIdeasLocation>(['casa', 'parque', 'escola', 'area_externa'])
const ENERGY_SET = new Set<QuickIdeasEnergy>(['exausta', 'normal', 'animada'])
const MODE_SET = new Set<'single' | 'all'>(['single', 'all'])
const PLAN_SET = new Set<'free' | 'essencial' | 'premium'>(['free', 'essencial', 'premium'])

function isValidLocation(v: any): v is QuickIdeasLocation {
  return typeof v === 'string' && LOCATION_SET.has(v as QuickIdeasLocation)
}

function isValidEnergy(v: any): v is QuickIdeasEnergy {
  return typeof v === 'string' && ENERGY_SET.has(v as QuickIdeasEnergy)
}

function isValidMode(v: any): v is 'single' | 'all' {
  return typeof v === 'string' && MODE_SET.has(v as any)
}

function isValidPlan(v: any): v is 'free' | 'essencial' | 'premium' {
  return typeof v === 'string' && PLAN_SET.has(v as any)
}

function sanitizeTimeWindowMin(v: any): QuickIdeasTimeWindow {
  const n = Number(v)
  if (!Number.isFinite(n)) return 10
  if (n <= 5) return 5
  if (n <= 10) return 10
  return 20
}

/** ---------- helpers (modo leve) ---------- */

function chooseOne(seed: number, items: Suggestion[]) {
  const safeSeed = Number.isFinite(seed) ? seed : Date.now()
  const idx = Math.abs(safeSeed) % items.length
  return items[idx]!
}

function rotateIndex(seed: number, mod: number) {
  const s = Number.isFinite(seed) ? seed : Date.now()
  return Math.abs(s) % Math.max(1, mod)
}

function sanitizeRecentIds(v: any): string[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((x) => typeof x === 'string' && x.trim())
    .map((x) => x.trim())
    .slice(0, 10)
}

function isValidSignal(v: any): v is QuickIdeasLightMemory['last_signal'] {
  return v === 'heavy' || v === 'tired' || v === 'overwhelmed' || v === 'neutral'
}

function sanitizePersonaId(v: any): QuickIdeasLightMemory['eu360_persona_id'] | undefined {
  if (v === 'sobrevivencia' || v === 'organizacao' || v === 'conexao' || v === 'equilibrio' || v === 'expansao') return v
  return undefined
}

function chooseWithSoftMemory(opts: {
  seed: number
  suggestions: Suggestion[]
  memory?: QuickIdeasLightMemory
}): { one: Suggestion; excludedCount: number; memoryUsed: boolean; signal?: QuickIdeasLightMemory['last_signal'] } {
  const recent = sanitizeRecentIds(opts.memory?.recent_suggestion_ids)
  const signal = isValidSignal(opts.memory?.last_signal) ? opts.memory?.last_signal : undefined

  const hasMemory = recent.length > 0 || !!signal
  const excludedSet = new Set(recent)

  // Filtra repetição recente
  let pool = opts.suggestions.filter((s) => !excludedSet.has(s.id))
  const excludedCount = opts.suggestions.length - pool.length

  if (!pool.length) pool = opts.suggestions

  // Tendência suave por sinal (se existir)
  if (signal) {
    const preferredIds =
      signal === 'heavy'
        ? new Set(['md-5', 'md-2'])
        : signal === 'tired'
          ? new Set(['md-1', 'md-4'])
          : signal === 'overwhelmed'
            ? new Set(['md-2', 'md-3'])
            : new Set<string>()

    if (preferredIds.size) {
      const preferred = pool.filter((s) => preferredIds.has(s.id))
      const others = pool.filter((s) => !preferredIds.has(s.id))
      if (preferred.length) pool = [...preferred, ...preferred, ...others]
    }
  }

  const one = chooseOne(opts.seed, pool)
  return { one, excludedCount, memoryUsed: hasMemory, signal }
}

/** ---------- catálogos (modo leve) ---------- */

function myDaySuggestions(): Suggestion[] {
  return [
    { id: 'md-1', title: 'Respire por 1 minuto', description: 'Só para o corpo entender que você chegou.' },
    { id: 'md-2', title: 'Escolha só uma coisa para agora', description: 'O resto pode esperar um pouco.' },
    { id: 'md-3', title: 'Faça um passo pequeno', description: 'Algo simples já organiza por dentro.' },
    { id: 'md-4', title: 'Beba um copo de água', description: 'Uma âncora rápida no presente.' },
    { id: 'md-5', title: 'Escreva uma frase do que está pesado', description: 'Só para tirar da cabeça e pôr no chão.' },
  ]
}

type CareTheme = 'aterrissar' | 'baixar-volume' | 'clarear' | 'autocompaixao' | 'apoio-leve'

function careThemes(): Array<{ id: CareTheme; label: string }> {
  return [
    { id: 'aterrissar', label: 'Aterrissar' },
    { id: 'baixar-volume', label: 'Baixar o volume' },
    { id: 'clarear', label: 'Clarear o próximo passo' },
    { id: 'autocompaixao', label: 'Autocompaixão prática' },
    { id: 'apoio-leve', label: 'Apoio leve' },
  ]
}

// Sugestões sempre curtas, sem “melhorar a mãe”, sem terapia, sem meta.
// Cada tema retorna um conjunto; o endpoint escolhe 2 opções.
function careSuggestionsByTheme(theme: CareTheme): Suggestion[] {
  switch (theme) {
    case 'aterrissar':
      return [
        { id: 'cdm-a-1', title: 'Mão no peito + 4 respirações', description: 'Só para o corpo voltar para o agora.' },
        { id: 'cdm-a-2', title: 'Olhar 10 segundos para um ponto fixo', description: 'Uma âncora simples, sem esforço.' },
        { id: 'cdm-a-3', title: 'Soltar os ombros 3 vezes', description: 'Pequeno ajuste que muda o “volume” do corpo.' },
        { id: 'cdm-a-4', title: 'Beber água em 3 goles', description: 'Uma pausa concreta, sem pensar.' },
      ]
    case 'baixar-volume':
      return [
        { id: 'cdm-b-1', title: 'Diminuir 1 expectativa do dia', description: 'Hoje, “bom o bastante” conta.' },
        { id: 'cdm-b-2', title: 'Trocar pressa por “só o próximo passo”', description: 'Uma coisa por vez, sem lista.' },
        { id: 'cdm-b-3', title: 'Pausar 60s sem “resolver” nada', description: 'Só pausa. Sem conclusão.' },
        { id: 'cdm-b-4', title: 'Fazer 1 coisa mais simples', description: 'Simplificar também é cuidado.' },
      ]
    case 'clarear':
      return [
        { id: 'cdm-c-1', title: 'Escolher 1 próxima ação pequena', description: 'Uma só. O resto pode ficar em espera.' },
        { id: 'cdm-c-2', title: 'Escrever 1 frase: “agora eu só…”', description: 'Um recorte para diminuir ruído.' },
        { id: 'cdm-c-3', title: 'Separar “urgente” de “importante” em 10s', description: 'Só na cabeça, sem planilha.' },
        { id: 'cdm-c-4', title: 'Arrumar 1 item (apenas um)', description: 'Micro-ordem para o cérebro respirar.' },
      ]
    case 'autocompaixao':
      return [
        { id: 'cdm-d-1', title: 'Falar consigo como falaria com uma amiga', description: 'Uma frase gentil já muda o tom.' },
        { id: 'cdm-d-2', title: 'Permitir 70% hoje', description: 'Seu dia não precisa ser perfeito para valer.' },
        { id: 'cdm-d-3', title: 'Trocar “eu devia” por “se der”', description: 'Só ajustar a linguagem interna.' },
        { id: 'cdm-d-4', title: 'Reconhecer 1 coisa que você já fez', description: 'Sem lista, só um fato.' },
      ]
    case 'apoio-leve':
      return [
        { id: 'cdm-e-1', title: 'Pedir ajuda com 1 frase curta', description: '“Você segura 10 min?” já resolve muito.' },
        { id: 'cdm-e-2', title: 'Delegar 1 parte do que pesa', description: 'Uma parte, não o mundo.' },
        { id: 'cdm-e-3', title: 'Avisar seu limite sem justificar', description: '“Hoje eu não consigo isso.” pronto.' },
        { id: 'cdm-e-4', title: 'Escolher silêncio por 60s', description: 'Sem conversa, sem áudio, só respiro.' },
      ]
  }
}

function deriveThemeFromMemory(seed: number, memory?: QuickIdeasLightMemory): CareTheme {
  const persona = sanitizePersonaId(memory?.eu360_persona_id)
  const q1 = memory?.eu360_q1
  const q3 = memory?.eu360_q3
  const signal = isValidSignal(memory?.last_signal) ? memory?.last_signal : 'neutral'

  // Tendências leves (não determinísticas)
  if (signal === 'overwhelmed' || q3 === 'tudo') return 'baixar-volume'
  if (signal === 'tired' || q1 === 'exausta' || q1 === 'cansada') return 'aterrissar'
  if (signal === 'heavy' || persona === 'sobrevivencia') return 'autocompaixao'
  if (q3 === 'organizacao') return 'clarear'
  if (q3 === 'emocional') return 'autocompaixao'

  // Rotação por dia/seed (jornada)
  const themes = careThemes()
  return themes[rotateIndex(seed, themes.length)]!.id
}

function chooseTwoWithFreeWill(opts: {
  seed: number
  memory?: QuickIdeasLightMemory
}): { theme: CareTheme; items: Suggestion[]; excludedCount: number; memoryUsed: boolean; signal: string } {
  const theme = deriveThemeFromMemory(opts.seed, opts.memory)
  const base = careSuggestionsByTheme(theme)

  const recent = sanitizeRecentIds(opts.memory?.recent_suggestion_ids)
  const excludedSet = new Set(recent)

  let pool = base.filter((s) => !excludedSet.has(s.id))
  const excludedCount = base.length - pool.length
  if (pool.length < 2) pool = base // nunca bloqueia a experiência

  // Uma segunda tendência leve: se a mãe prefere “diretas”, aumentamos chance de opções mais concretas
  // (Aqui mantemos simples e determinístico)
  const items = [
    pool[rotateIndex(opts.seed + 7, pool.length)]!,
    pool[rotateIndex(opts.seed + 29, pool.length)]!,
  ].filter(Boolean)

  // Dedup caso coincidam
  const unique: Suggestion[] = []
  for (const it of items) {
    if (!unique.some((u) => u.id === it.id)) unique.push(it)
  }
  while (unique.length < 2 && pool.length) {
    const cand = pool[rotateIndex(opts.seed + 97 + unique.length * 11, pool.length)]!
    if (!unique.some((u) => u.id === cand.id)) unique.push(cand)
    else break
  }

  const memoryUsed =
    (sanitizeRecentIds(opts.memory?.recent_suggestion_ids).length > 0) ||
    Boolean(opts.memory?.last_signal) ||
    Boolean(opts.memory?.eu360_persona_id) ||
    Boolean(opts.memory?.eu360_q1) ||
    Boolean(opts.memory?.eu360_q3)

  const signal = isValidSignal(opts.memory?.last_signal) ? opts.memory?.last_signal : 'none'
  return { theme, items: unique.slice(0, 2), excludedCount, memoryUsed, signal }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuickIdeasRequestLegacy | QuickIdeasRequestLight | null

    /**
     * MODO LEVE (Meu Dia / Cuidar de Mim)
     */
    if (isLightRequest(body)) {
      const seed = typeof body.nonce === 'number' ? body.nonce : Date.now()
      const hub = body.hub ?? 'my_day'

      // Meu Dia (compat total com QuickIdeaAI atual)
      if (hub === 'my_day') {
        const base = myDaySuggestions()
        const { one, excludedCount, memoryUsed, signal } = chooseWithSoftMemory({
          seed,
          suggestions: base,
          memory: body.memory,
        })

        try {
          track('ai.quick_ideas.light', {
            hub,
            intent: body.intent,
            locale: body.locale ?? 'pt-BR',
            memory_used: memoryUsed,
            excluded_count: excludedCount,
            signal: signal ?? 'none',
          })
        } catch {}

        return NextResponse.json({
          suggestions: [one],
          meta: { mode: 'my_day_light' as const },
        })
      }

      // Cuidar de Mim (2 opções + livre arbítrio)
      const { theme, items, excludedCount, memoryUsed, signal } = chooseTwoWithFreeWill({
        seed,
        memory: body.memory,
      })

      try {
        track('ai.quick_ideas.light', {
          hub,
          intent: body.intent,
          locale: body.locale ?? 'pt-BR',
          memory_used: memoryUsed,
          excluded_count: excludedCount,
          signal,
          theme,
        })
      } catch {}

      return NextResponse.json({
        suggestions: items,
        meta: { mode: 'cuidar_de_mim_light' as const, theme },
      })
    }

    /**
     * MODO LEGADO (Catálogo completo)
     * Mantido, mas com validação forte para evitar payload inválido.
     */
    if (!isLegacyRequest(body)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'missing_fields' })
      } catch {}
      return badRequest('Missing required fields: plan, profile, context')
    }

    if (!isValidPlan(body.plan)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_plan', plan: String(body.plan) })
      } catch {}
      return badRequest('Invalid plan')
    }

    if (!body.profile || typeof body.profile !== 'object') {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_profile' })
      } catch {}
      return badRequest('Invalid profile')
    }

    if (!isValidMode((body.profile as any).mode)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_mode', mode: String((body.profile as any).mode) })
      } catch {}
      return badRequest('Invalid profile.mode')
    }

    if (!Array.isArray(body.profile.children)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'children_not_array' })
      } catch {}
      return badRequest('Invalid profile.children')
    }

    if (!body.context || typeof body.context !== 'object') {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_context' })
      } catch {}
      return badRequest('Invalid context')
    }

    if (!isValidLocation((body.context as any).location)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_location', location: String((body.context as any).location) })
      } catch {}
      return badRequest('Invalid context.location')
    }

    if (!isValidEnergy((body.context as any).energy)) {
      try {
        track('ai.quick_ideas.bad_request', { reason: 'invalid_energy', energy: String((body.context as any).energy) })
      } catch {}
      return badRequest('Invalid context.energy')
    }

    const safeTimeWindow = sanitizeTimeWindowMin((body.context as any).time_window_min)

    if (body.plan === 'free') {
      const res = {
        access: {
          denied: true,
          limited_to_one: false,
          message: 'Disponível nos planos Essencial e Premium.',
        },
        query_echo: {
          plan: body.plan,
          location: body.context.location,
          time_window_min: safeTimeWindow,
          energy: body.context.energy,
          age_buckets: body.profile.children.map((child) => child.age_bucket),
        },
        ideas: [] as unknown[],
        aggregates: { materials_consolidated: [] as string[] },
      }

      try {
        track('ai.quick_ideas.legacy', { plan: body.plan })
      } catch {}

      return NextResponse.json(res)
    }

    const resolvedBucket: QuickIdeasAgeBucket | undefined =
      body.profile.mode === 'all'
        ? youngestBucket(body.profile.children)
        : body.profile.children.find((child) => child.id === body.profile.active_child_id)?.age_bucket ??
          body.profile.children[0]?.age_bucket

    const bucket: QuickIdeasAgeBucket = resolvedBucket ?? '2-3'

    const badges: QuickIdeasBadge[] = ['curta', 'linguagem']
    const ageAdaptations: Partial<Record<QuickIdeasAgeBucket, string>> = {
      [bucket]: 'Adapte o tempo e as falas à idade.',
    }

    const baseIdea: QuickIdea = {
      id: 'cabana-lencois-10min',
      title: 'Cabana de Lençóis Aconchegante',
      summary: 'Montem uma cabaninha e contem uma história curta.',
      time_total_min: Math.min(10, safeTimeWindow),
      location: body.context.location,
      materials: ['lençóis', 'cadeiras', 'lanterna'],
      steps: [
        'Estenda os lençóis entre as cadeiras para formar a cabana.',
        'Entrem com a lanterna e contem uma história curtinha.',
      ],
      age_adaptations: ageAdaptations,
      safety_notes: ['Supervisão constante; evite prender lençol em locais altos.', 'Lanterna sem peças pequenas soltas.'],
      badges,
      planner_payload: { type: 'idea', duration_min: 10, materials: ['lençóis', 'cadeiras', 'lanterna'] },
      rationale: 'Poucos materiais, cabe no tempo disponível e na energia atual.',
    }

    const ideas: QuickIdea[] =
      body.plan === 'essencial'
        ? [baseIdea]
        : [
            baseIdea,
            { ...baseIdea, id: 'pintura-com-agua', title: 'Pintura com Água no Quintal' },
            { ...baseIdea, id: 'caixa-tesouros', title: 'Caixa de Tesouros Sensorial' },
          ]

    const response = {
      access: {
        denied: false,
        limited_to_one: body.plan === 'essencial',
        message: body.plan === 'essencial' ? 'Plano Essencial: 1 ideia por vez.' : '',
      },
      query_echo: {
        plan: body.plan,
        location: body.context.location,
        time_window_min: safeTimeWindow,
        energy: body.context.energy,
        age_buckets: body.profile.children.map((child) => child.age_bucket),
      },
      ideas,
      aggregates: { materials_consolidated: consolidateMaterials(ideas) },
    }

    try {
      track('ai.quick_ideas.legacy', {
        plan: body.plan,
        location: body.context.location,
        energy: body.context.energy,
      })
    } catch {}

    return NextResponse.json(response)
  } catch (err) {
    try {
      track('ai.quick_ideas.error', { error: String(err) })
    } catch {}
    return badRequest('Invalid JSON payload', String(err))
  }
}
