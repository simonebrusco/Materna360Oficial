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
   * Opcional; se não vier, não interfere.
   */
  last_signal?: 'heavy' | 'tired' | 'overwhelmed' | 'neutral'
}

/**
 * Payload leve para hubs (P33.4):
 * - Meu Dia: memória suave opcional
 * - Cuidar de Mim: sem memória, com tema do dia
 */
type QuickIdeasRequestLight = {
  intent: 'quick_idea'
  hub?: 'my_day' | 'cuidar_de_mim'
  nonce?: number
  locale?: 'pt-BR'
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

function hashStringToInt(str: string) {
  // hash simples determinístico (bom o suficiente para rotação de tema)
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function getDateKeySaoPaulo(): string {
  // Edge runtime suporta Intl; usamos América/São_Paulo para consistência
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())

    const y = parts.find((p) => p.type === 'year')?.value ?? '1970'
    const m = parts.find((p) => p.type === 'month')?.value ?? '01'
    const d = parts.find((p) => p.type === 'day')?.value ?? '01'
    return `${y}-${m}-${d}`
  } catch {
    // fallback
    const now = new Date()
    const y = now.getUTCFullYear()
    const m = String(now.getUTCMonth() + 1).padStart(2, '0')
    const d = String(now.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
}

/** ---------- modo leve (Meu Dia) ---------- */

function myDaySuggestions(): Suggestion[] {
  return [
    { id: 'md-1', title: 'Respire por 1 minuto', description: 'Só para o corpo entender que você chegou.' },
    { id: 'md-2', title: 'Escolha só uma coisa para agora', description: 'O resto pode esperar um pouco.' },
    { id: 'md-3', title: 'Faça um passo pequeno', description: 'Algo simples já organiza por dentro.' },
    { id: 'md-4', title: 'Beba um copo de água', description: 'Uma âncora rápida no presente.' },
    { id: 'md-5', title: 'Escreva uma frase do que está pesado', description: 'Só para tirar da cabeça e pôr no chão.' },
  ]
}

/**
 * Memória contextual suave (Meu Dia):
 * 1) remove itens vistos recentemente (recent_suggestion_ids)
 * 2) aplica uma “tendência” leve por sinal (se existir)
 * 3) se tudo for excluído, volta ao catálogo completo
 */
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

  // Se excluiu tudo, volta ao catálogo completo (sem bloqueio)
  if (!pool.length) pool = opts.suggestions

  // Tendência bem suave por sinal (se existir)
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
      if (preferred.length) {
        pool = [...preferred, ...preferred, ...others]
      }
    }
  }

  const one = chooseOne(opts.seed, pool)
  return { one, excludedCount, memoryUsed: hasMemory, signal }
}

/** ---------- modo leve (Cuidar de Mim) ---------- */

type CuidarTheme =
  | 'aterrissar'
  | 'baixar_volume_corpo'
  | 'dar_nome_sem_pesar'
  | 'criar_espaco'
  | 'autocompaixao_pratica'
  | 'apoio_leve'
  | 'fechamento_suficiente'

const CUIDAR_THEMES: Array<{ id: CuidarTheme; label: string }> = [
  { id: 'aterrissar', label: 'Aterrissar' },
  { id: 'baixar_volume_corpo', label: 'Baixar o volume do corpo' },
  { id: 'dar_nome_sem_pesar', label: 'Dar nome ao que pesa' },
  { id: 'criar_espaco', label: 'Criar espaço' },
  { id: 'autocompaixao_pratica', label: 'Autocompaixão prática' },
  { id: 'apoio_leve', label: 'Apoio leve' },
  { id: 'fechamento_suficiente', label: 'Suficiente por hoje' },
]

const CUIDAR_DECK: Record<CuidarTheme, Suggestion[]> = {
  aterrissar: [
    { id: 'cdm-a-1', title: 'Pés no chão por 10 segundos', description: 'Só notar o apoio. Se quiser, uma respiração mais lenta.' },
    { id: 'cdm-a-2', title: 'Olhar para um ponto fixo', description: 'Sem “meditar”. Só escolher um ponto e ficar nele por 20s.' },
    { id: 'cdm-a-3', title: 'Mão no peito, sem fazer nada', description: 'Só um contato. Se não ajudar, você larga e segue.' },
    { id: 'cdm-a-4', title: 'Nomeie o agora em 3 palavras', description: 'Ex.: “corrido, barulhento, possível”. Não precisa explicar.' },
    { id: 'cdm-a-5', title: 'Uma frase de aterrissagem', description: '“Eu estou aqui. Um passo por vez.” Só isso.' },
    { id: 'cdm-a-6', title: 'Solte a testa', description: 'Perceba se está franzida. Solte 1 mm. Já conta.' },
    { id: 'cdm-a-7', title: 'Um gole de água consciente', description: 'Um gole só. Como se fosse um “voltar” para você.' },
    { id: 'cdm-a-8', title: 'Cheque de volume (0–10)', description: 'Quanto está o barulho por dentro? Só notar já reduz um pouco.' },
  ],
  baixar_volume_corpo: [
    { id: 'cdm-b-1', title: 'Ombros para baixo (3x)', description: 'Levanta um pouco e solta devagar. Sem alongar “direito”.' },
    { id: 'cdm-b-2', title: 'Mandíbula: descruze os dentes', description: 'Só separar levemente. O corpo entende o recado.' },
    { id: 'cdm-b-3', title: 'Respiração 4–2–6 (2 voltas)', description: 'Pequeno reset. Se não der, faça só 1 volta.' },
    { id: 'cdm-b-4', title: 'Pescoço: micro-giro', description: 'Um giro bem pequeno. A ideia é aliviar, não “alongar”.' },
    { id: 'cdm-b-5', title: 'Mãos: apertar e soltar', description: 'Aperta 2s, solta 4s. Repete 3x.' },
    { id: 'cdm-b-6', title: 'Destravar o corpo sentado', description: 'Empurre os pés no chão por 5s e solte. Pronto.' },
    { id: 'cdm-b-7', title: 'Olhar longe por 15s', description: 'Descansa os olhos. Isso também baixa o volume.' },
    { id: 'cdm-b-8', title: 'Suspirar de verdade', description: 'Um suspiro longo. Sem técnica. Só “soltar ar”.' },
  ],
  dar_nome_sem_pesar: [
    { id: 'cdm-c-1', title: 'O que está pedindo atenção?', description: 'Uma palavra. Sem história. Sem culpa.' },
    { id: 'cdm-c-2', title: 'O que você está segurando sozinha?', description: 'Se não vier nada, tudo bem. Segue.' },
    { id: 'cdm-c-3', title: 'Uma frase do peso', description: 'Escreva: “Hoje o peso é…”. E pare por aí.' },
    { id: 'cdm-c-4', title: 'Separar fato de pensamento', description: 'Fato: “tá corrido”. Pensamento: “não dou conta”. Só notar.' },
    { id: 'cdm-c-5', title: 'Nome curto, sem drama', description: '“cansaço”, “pressa”, “barulho”, “culpa”. Só isso.' },
    { id: 'cdm-c-6', title: 'O que pode esperar 1 hora?', description: 'Escolha uma coisa que não precisa ser agora.' },
    { id: 'cdm-c-7', title: 'O que seria “bom o bastante” hoje?', description: 'Uma linha. Sem perfeição.' },
    { id: 'cdm-c-8', title: 'Permissão mínima', description: '“Eu não preciso resolver tudo agora.” Só repetir mentalmente.' },
  ],
  criar_espaco: [
    { id: 'cdm-d-1', title: 'Abra a janela (ou a cortina)', description: '30 segundos de ar/luz já mudam a sensação.' },
    { id: 'cdm-d-2', title: 'Uma superfície pequena', description: 'Só tirar 2 coisas do lugar. Sem “arrumar a casa”.' },
    { id: 'cdm-d-3', title: 'Trocar de cômodo por 20s', description: 'Se der. Um passo físico cria espaço mental.' },
    { id: 'cdm-d-4', title: 'Escolha um som mais baixo', description: 'Diminuir o som/ruído por 1 minuto já ajuda.' },
    { id: 'cdm-d-5', title: 'Luz mais suave', description: 'Se possível, baixa a luz. Se não, ignora.' },
    { id: 'cdm-d-6', title: 'Micro-âncora visual', description: 'Escolha “um cantinho” para olhar. Uma mini ilha de calma.' },
    { id: 'cdm-d-7', title: 'Três objetos: notar cores', description: 'Só olhar 3 coisas e notar a cor. É simples e funciona.' },
    { id: 'cdm-d-8', title: 'Mensagem para você mesma', description: 'Escreva: “agora eu só preciso do próximo passo”. E pare.' },
  ],
  autocompaixao_pratica: [
    { id: 'cdm-e-1', title: 'Troque “eu devia” por “eu posso”', description: 'Uma frase só. Sem policiar. Só experimentar.' },
    { id: 'cdm-e-2', title: 'O suficiente de hoje', description: 'Escolha: “o suficiente” é X. Pequeno. Possível.' },
    { id: 'cdm-e-3', title: 'Como você falaria com uma amiga?', description: 'Pegue 1 frase gentil e use com você.' },
    { id: 'cdm-e-4', title: 'Permissão de imperfeição', description: '“Hoje pode ser 70%.” Não precisa justificar.' },
    { id: 'cdm-e-5', title: 'Tirar o peso do peito', description: 'Mão no peito e uma frase: “eu estou fazendo o que dá”.' },
    { id: 'cdm-e-6', title: 'Culpa: só pausar por 10s', description: 'Não é eliminar. É só não alimentar por 10s.' },
    { id: 'cdm-e-7', title: 'Uma vitória invisível', description: 'Qual foi a menor coisa que você fez e conta? Nomeie.' },
    { id: 'cdm-e-8', title: 'Você não precisa ser forte agora', description: 'Só precisa ser humana. Se não servir, deixa passar.' },
  ],
  apoio_leve: [
    { id: 'cdm-f-1', title: 'Pedir ajuda com 7 palavras', description: 'Ex.: “Você consegue assumir isso por 10 min?”' },
    { id: 'cdm-f-2', title: 'Frase de limite curto', description: '“Agora eu não consigo. Posso mais tarde.”' },
    { id: 'cdm-f-3', title: 'Delegar uma micro-coisa', description: 'Escolha 1 tarefa mínima para sair da sua cabeça.' },
    { id: 'cdm-f-4', title: 'Mensagem “só para avisar”', description: '“Hoje estou no limite. Se eu sumir, é isso.”' },
    { id: 'cdm-f-5', title: 'Combinar o próximo passo', description: '“Você faz A, eu faço B, e paramos por aí.”' },
    { id: 'cdm-f-6', title: 'Pedir silêncio por 2 minutos', description: '“Só 2 min de silêncio. Já volto.”' },
    { id: 'cdm-f-7', title: 'Soltar a explicação', description: 'Você pode pedir sem justificar. Um pedido simples já basta.' },
    { id: 'cdm-f-8', title: 'Uma nota para você mesma', description: '“Eu não preciso carregar sozinha.” Se não ajudar, ignora.' },
  ],
  fechamento_suficiente: [
    { id: 'cdm-g-1', title: 'Encerrar um ciclo pequeno', description: 'Feche 1 aba mental: “isso fica para amanhã”.' },
    { id: 'cdm-g-2', title: 'O que já foi feito hoje?', description: 'Liste 2 coisas. Só 2. E pare.' },
    { id: 'cdm-g-3', title: 'Soltar o “devia” da noite', description: '“Hoje foi o que deu.” Uma frase só.' },
    { id: 'cdm-g-4', title: 'Preparar um amanhã mais leve', description: 'Escolha 1 coisa para facilitar amanhã. Se não der, tudo bem.' },
    { id: 'cdm-g-5', title: 'Fechar por aqui', description: 'Respira e diz: “pronto por hoje”. Sem negociação.' },
    { id: 'cdm-g-6', title: 'Tirar do corpo', description: 'Solte os ombros e a mandíbula. Um “ok” para encerrar.' },
    { id: 'cdm-g-7', title: 'Última frase do dia', description: '“Eu fiz o melhor que pude com o que tinha.”' },
    { id: 'cdm-g-8', title: 'Suficiente já é cuidado', description: 'Não precisa “melhorar”. Só precisa terminar o dia.' },
  ],
}

function getThemeOfDay(dateKey: string) {
  const idx = hashStringToInt(`cuidar:${dateKey}`) % CUIDAR_THEMES.length
  return { index: idx, ...CUIDAR_THEMES[idx]! }
}

function chooseCuidarSuggestion(opts: { nonce?: number }) {
  const dateKey = getDateKeySaoPaulo()
  const theme = getThemeOfDay(dateKey)
  const deck = CUIDAR_DECK[theme.id] ?? CUIDAR_DECK.aterrissar

  // Seed: se tiver nonce, muda com "Outra proposta"; se não, fixo por dia
  const daySeed = hashStringToInt(`cuidar-seed:${dateKey}:${theme.id}`)
  const seed = typeof opts.nonce === 'number' ? opts.nonce : daySeed

  const one = chooseOne(seed, deck)

  return {
    one,
    meta: {
      mode: 'cuidar_de_mim_light' as const,
      date_key: dateKey,
      day_theme: theme.id,
      day_theme_label: theme.label,
      day_theme_index: theme.index,
    },
  }
}

/** ---------- handler ---------- */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuickIdeasRequestLegacy | QuickIdeasRequestLight | null

    /**
     * MODO LEVE (Meu Dia / Cuidar de Mim)
     */
    if (isLightRequest(body)) {
      const hub = body.hub === 'cuidar_de_mim' ? 'cuidar_de_mim' : 'my_day'
      const seed = typeof body.nonce === 'number' ? body.nonce : Date.now()

      if (hub === 'cuidar_de_mim') {
        const { one, meta } = chooseCuidarSuggestion({ nonce: body.nonce })

        try {
          track('ai.quick_ideas.light', {
            hub,
            intent: body.intent,
            locale: body.locale ?? 'pt-BR',
            day_theme: meta.day_theme,
            day_theme_index: meta.day_theme_index,
          })
        } catch {}

        return NextResponse.json({
          suggestions: [one],
          meta,
        })
      }

      // my_day (com memória)
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
