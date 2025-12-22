// app/api/ai/meu-dia-leve/receita/route.ts
/**
 * CONTRATO DE RECEITAS — Materna360 (P26)
 * Regras oficiais em:
 * /docs/product/receitas-padrao-materna360.md
 *
 * Não alterar comportamento, tom ou estrutura
 * sem atualizar este documento.
 */

import { NextResponse } from 'next/server'
import { track } from '@/app/lib/telemetry'

export const dynamic = 'force-dynamic'

type Slot = '3' | '5' | '10'
type Mood = 'no-limite' | 'corrida' | 'ok' | 'leve'

type Body = {
  slot?: Slot
  mood?: Mood
  pantry?: string
  childAgeMonths?: number
  // extras opcionais vindos do Client (compat: ignorados se não existirem)
  childAgeYears?: number
  childAgeLabel?: string
}

type ApiResponse =
  | { ok: true; text: string }
  | { ok: false; error: string; hint?: string }

// Responsabilidade alimentar (alinhado ao Client)
const MIN_MONTHS_BLOCK = 6
const MIN_MONTHS_ALLOW_RECIPES = 12

/**
 * Ingredientes “fortes” (1 item já pode virar receita responsável).
 * Fonte única para Client/Server decidirem “libera com 1 item”.
 */
const STRONG_ONE_ITEM_NEEDLES = [
  'ovo',
  'arroz',
  'banana',
  'iogurte',
  'iogurt',
  'pão',
  'pao',
  'feijão',
  'feijao',
]

/**
 * Lista oficial de nomes (imutável) — fonte única para títulos.
 * Não criar nomes fora destes.
 */
const OFFICIAL_TITLES = {
  bananaSimples: 'Banana do jeito mais simples',
  frutaAmassada: 'Fruta amassada simples',
  frutaPedacos: 'Fruta em pedaços para agora',
  iogurteComFruta: 'Iogurte com fruta (montagem simples)',
  iogurteSimples: 'Iogurte simples do dia',

  ovoMacio: 'Ovo mexido macio',
  ovoBasico: 'Ovo mexido básico',
  ovoFrigideira: 'Ovo simples da frigideira',

  arrozAquecido: 'Arroz aquecido do dia',
  arrozComplemento: 'Arroz com complemento simples',
  arrozBasico: 'Arroz básico para agora',

  arrozFeijao: 'Arroz e feijão simples',
  arrozLegume: 'Arroz com legume do dia',
  refeicaoComOQueTem: 'Refeição simples com o que tem',

  panquequinhaBanana: 'Panquequinha de banana simples',
  preparinhoBanana: 'Preparinho de banana na frigideira',

  preparinhoAgora: 'Preparinho simples para agora',
  comidaSemComplicar: 'Comida do dia sem complicar',
} as const

/**
 * Tipo interno único para “receita do contrato”.
 * IMPORTANTÍSSIMO:
 * - title é string para evitar unions literais incompatíveis entre pickers.
 * - estrutura é fixa e corresponde ao formatRecipeText (não muda UI/contrato).
 */
type Recipe = {
  title: string
  time: string
  yield: string
  ingredients: string[]
  steps: string[]
}

/**
 * Observação (encerramento emocional) — frase aprovada.
 * - presente
 * - permissiva
 * - sem futuro
 * - sem “melhor”, “ideal”, “recomendado”
 */
function closeNote() {
  return 'Simples assim também conta.'
}

function clampSlot(v: unknown): Slot {
  const s = String(v ?? '')
  if (s === '3' || s === '5' || s === '10') return s
  return '5'
}

function clampMood(v: unknown): Mood {
  const m = String(v ?? '')
  if (m === 'no-limite' || m === 'corrida' || m === 'ok' || m === 'leve') return m
  return 'corrida'
}

function clampMonths(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  if (Number.isNaN(n)) return null
  const i = Math.floor(n)
  if (i < 0) return 0
  if (i > 240) return 240
  return i
}

function sanitizePantry(input: string): string {
  const raw = String(input ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N},;.\-\s]/gu, '')
    .trim()

  return raw.slice(0, 140)
}

function splitItems(pantry: string): string[] {
  const parts = pantry
    .split(/[,;.\n]/g)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const seen = new Set<string>()
  const out: string[] = []
  for (const p of parts) {
    if (seen.has(p)) continue
    seen.add(p)
    out.push(p)
  }
  return out.slice(0, 8)
}

function hasAny(items: string[], needles: string[]) {
  return needles.some((n) => items.some((it) => it.includes(n)))
}

function hasFruitWord(items: string[]) {
  const fruits = [
    'banana',
    'maçã',
    'maca',
    'mamão',
    'mamao',
    'pera',
    'morango',
    'uva',
    'laranja',
    'tangerina',
  ]
  return hasAny(items, fruits)
}

function formatRecipeText(recipe: Recipe) {
  const lines: string[] = []
  lines.push(`${recipe.title}`)
  lines.push(`Tempo: ${recipe.time} • Rende: ${recipe.yield}`)
  lines.push('')
  lines.push('Ingredientes:')
  for (const it of recipe.ingredients) lines.push(`• ${it}`)
  lines.push('')
  lines.push('Modo de preparo:')
  recipe.steps.forEach((s, idx) => lines.push(`${idx + 1}) ${s}`))
  lines.push('')
  lines.push(`Observação: ${closeNote()}`)
  return lines.join('\n')
}

/**
 * Faixa interna (sem mudar layout/estrutura; só decisão).
 * - 12–23: prioridade em textura mais amassada/cremosa
 * - 24+: prioridade em “pedaços pequenos” e rotina mais “normal”
 */
type AgeTier = 'toddler_12_23' | 'kid_24_plus'
function getAgeTier(months: number): AgeTier {
  return months < 24 ? 'toddler_12_23' : 'kid_24_plus'
}

/**
 * Ajustes micro de preparo por idade — SEM prescrição, só “forma de servir”.
 * Mantém tom, mantém estrutura e mantém o encerramento fixo.
 */
function stepServeStyle(tier: AgeTier) {
  if (tier === 'toddler_12_23') {
    return {
      serveSmall: 'Sirva em porções pequenas, mais amassado/macio se precisar.',
    }
  }
  return {
    serveSmall: 'Sirva em porções pequenas.',
  }
}

/**
 * Fallback responsável para “1 ingrediente forte”.
 * - Sempre mantém estrutura padrão
 * - Título sempre oficial
 * - Observação sempre fixa (blindada)
 * - Sem “depois”, “melhor”, “por enquanto”
 */
function pickSingleItemRecipe(items: string[], slot: Slot, tier: AgeTier): Recipe | null {
  const hasBanana = hasAny(items, ['banana'])
  const hasEgg = hasAny(items, ['ovo'])
  const hasYogurt = hasAny(items, ['iogurte', 'iogurt'])
  const hasRice = hasAny(items, ['arroz'])
  const hasBeans = hasAny(items, ['feijão', 'feijao'])
  const hasBread = hasAny(items, ['pão', 'pao'])

  const time = slot === '3' ? '3 min' : slot === '5' ? '5 min' : '10 min'
  const style = stepServeStyle(tier)

  if (hasBanana) {
    return {
      title: OFFICIAL_TITLES.bananaSimples,
      time,
      yield: '1 porção',
      ingredients: ['1 banana madura'],
      steps: [
        'Descasque e amasse com um garfo (ou corte em pedacinhos).',
        tier === 'toddler_12_23'
          ? 'Amasse bem até ficar mais macio.'
          : 'Amasse até ficar do jeito que funciona aí.',
        style.serveSmall,
      ],
    }
  }

  if (hasYogurt) {
    return {
      title: OFFICIAL_TITLES.iogurteSimples,
      time,
      yield: '1 porção',
      ingredients: ['Iogurte natural (o que você tiver)'],
      steps: ['Coloque uma porção pequena no potinho.', 'Sirva simples.'],
    }
  }

  if (hasEgg) {
    return {
      title: OFFICIAL_TITLES.ovoMacio,
      time,
      yield: '1 porção',
      ingredients: ['1 ovo', '1 fio de azeite ou um pouquinho de manteiga (se você usa em casa)'],
      steps: [
        'Bata o ovo rapidamente com um garfo.',
        'Aqueça a frigideira em fogo baixo com um fio de azeite/manteiga.',
        'Coloque o ovo e mexa devagar até ficar cozido e macio.',
        'Sirva em seguida.',
      ],
    }
  }

  if (hasRice) {
    return {
      title: OFFICIAL_TITLES.arrozAquecido,
      time,
      yield: '1 porção',
      ingredients: ['2 a 3 colheres de arroz já pronto'],
      steps: ['Aqueça o arroz.', style.serveSmall],
    }
  }

  // Para feijão e pão, usar opção neutra oficial (sem inventar nome novo)
  if (hasBeans) {
    return {
      title: OFFICIAL_TITLES.comidaSemComplicar,
      time,
      yield: '1 porção',
      ingredients: ['Feijão pronto (o que você já usa em casa)'],
      steps: ['Aqueça se necessário.', style.serveSmall],
    }
  }

  if (hasBread) {
    return {
      title: OFFICIAL_TITLES.comidaSemComplicar,
      time,
      yield: '1 porção',
      ingredients: ['Pão (o que você tiver)'],
      steps: [
        tier === 'toddler_12_23'
          ? 'Rasgue em pedaços bem pequenos, como for mais fácil agora.'
          : 'Corte em pedaços pequenos e sirva.',
        'Sirva simples.',
      ],
    }
  }

  return null
}

function pickSpecificRecipe(items: string[], slot: Slot, tier: AgeTier): Recipe | null {
  const hasEgg = hasAny(items, ['ovo'])
  const hasBanana = hasAny(items, ['banana'])
  const hasRice = hasAny(items, ['arroz'])
  const hasYogurt = hasAny(items, ['iogurte', 'iogurt'])
  const hasOats = hasAny(items, ['aveia'])
  const hasBread = hasAny(items, ['pão', 'pao'])
  const hasCheese = hasAny(items, ['queijo'])
  const hasBeans = hasAny(items, ['feijão', 'feijao'])
  const hasChicken = hasAny(items, ['frango'])
  const hasVeg = hasAny(items, [
    'legume',
    'cenoura',
    'abobrinha',
    'batata',
    'brócolis',
    'brocolis',
    'ervilha',
  ])

  const style = stepServeStyle(tier)

  // 3 min
  if (slot === '3') {
    if (hasBanana && (hasOats || hasYogurt)) {
      return {
        title: OFFICIAL_TITLES.frutaAmassada,
        time: '3 min',
        yield: '1 porção',
        ingredients: [
          '1 banana madura',
          hasYogurt ? '2 a 3 colheres de iogurte natural (se você tiver)' : null,
          hasOats ? '1 colher de aveia (se você tiver)' : null,
        ].filter(Boolean) as string[],
        steps: [
          'Amasse a banana com um garfo até ficar cremosa.',
          hasYogurt
            ? 'Misture o iogurte rapidamente, sem se preocupar com textura perfeita.'
            : 'Misture com 1 a 2 colheres de água, só até ficar bom para servir.',
          hasOats ? 'Coloque a aveia por cima (se você tiver).' : style.serveSmall,
        ],
      }
    }

    if (hasYogurt && hasFruitWord(items)) {
      return {
        title: OFFICIAL_TITLES.iogurteComFruta,
        time: '3 min',
        yield: '1 porção',
        ingredients: ['Iogurte natural', 'Fruta (a que você escreveu)'],
        steps: [
          'Coloque o iogurte no potinho.',
          tier === 'toddler_12_23'
            ? 'Amasse a fruta e coloque por cima, como for mais fácil agora.'
            : 'Pique a fruta e coloque por cima.',
          style.serveSmall,
        ],
      }
    }
  }

  // 5 min
  if (slot === '5') {
    if (hasEgg) {
      return {
        title: OFFICIAL_TITLES.ovoMacio,
        time: '5 min',
        yield: '1 porção',
        ingredients: [
          '1 ovo',
          hasCheese ? 'Opcional: 1 colher de queijo (se você tiver)' : null,
          hasVeg ? 'Opcional: 1 colher de legume já cozido/picado (se você tiver)' : null,
          '1 fio de azeite ou um pouquinho de manteiga (se você usa em casa)',
        ].filter(Boolean) as string[],
        steps: [
          'Bata o ovo rapidamente com um garfo.',
          'Aqueça a frigideira em fogo baixo com um fio de azeite/manteiga.',
          'Coloque o ovo e mexa devagar até ficar cozido e macio.',
          hasVeg ? 'Se tiver legume pronto, misture por 30 segundos no final.' : 'Sirva em seguida.',
          hasCheese ? 'Se tiver queijo, coloque no final e misture rapidamente.' : '',
          tier === 'toddler_12_23' ? 'Se quiser, amasse um pouco no prato para ficar mais macio.' : '',
        ].filter(Boolean),
      }
    }

    if (hasRice && (hasBeans || hasChicken || hasVeg)) {
      return {
        title: OFFICIAL_TITLES.arrozComplemento,
        time: '5 min',
        yield: '1 porção',
        ingredients: [
          '2 a 3 colheres de arroz já pronto',
          hasBeans ? 'Feijão (se você tiver)' : null,
          hasChicken ? 'Frango desfiado/pronto (se você tiver)' : null,
          hasVeg ? 'Legume cozido picado (se você tiver)' : null,
        ].filter(Boolean) as string[],
        steps: [
          'Aqueça o arroz (e o complemento, se for quente).',
          'Monte: arroz + 1 complemento.',
          hasVeg
            ? tier === 'toddler_12_23'
              ? 'Finalize com legume bem picado/amassado, como for mais fácil agora.'
              : 'Finalize com legume em pedacinhos pequenos.'
            : style.serveSmall,
        ],
      }
    }

    if (hasBread && hasCheese) {
      return {
        title: OFFICIAL_TITLES.refeicaoComOQueTem,
        time: '5 min',
        yield: '1 porção',
        ingredients: ['Pão', 'Queijo (o que você tiver)'],
        steps: [
          'Monte com o que você tem.',
          'Se quiser, aqueça rapidamente, só até ficar bom para servir.',
          tier === 'toddler_12_23' ? 'Rasgue em pedaços pequenos e sirva.' : 'Corte em pedaços pequenos e sirva.',
        ],
      }
    }
  }

  // 10 min
  if (slot === '10') {
    if (hasBanana && (hasOats || hasEgg)) {
      return {
        title: OFFICIAL_TITLES.panquequinhaBanana,
        time: '10 min',
        yield: '1 porção',
        ingredients: [
          '1 banana madura',
          hasEgg ? '1 ovo (se você tiver)' : null,
          hasOats ? '2 colheres de aveia (se você tiver)' : null,
        ].filter(Boolean) as string[],
        steps: [
          'Amasse a banana até virar um creme.',
          hasEgg ? 'Misture o ovo rapidamente.' : 'Se não tiver ovo, use uma opção pronta do dia.',
          hasOats ? 'Misture a aveia até virar massa grossinha.' : 'Se não tiver aveia, use uma opção pronta do dia.',
          'Em fogo baixo, faça discos pequenos e doure dos dois lados.',
          tier === 'toddler_12_23' ? 'Rasgue em pedacinhos e sirva.' : 'Corte em pedaços pequenos e sirva.',
        ],
      }
    }
  }

  return null
}

export async function POST(req: Request) {
  const t0 = Date.now()

  try {
    const body = (await req.json()) as Body

    const slot = clampSlot(body?.slot)
    const mood = clampMood(body?.mood)
    const pantry = sanitizePantry(body?.pantry ?? '')
    const items = splitItems(pantry)
    const childAgeMonths = clampMonths(body?.childAgeMonths)

    try {
      track('meu_dia_leve.recipe.request', {
        slot,
        mood,
        pantryLen: pantry.length,
        itemsCount: items.length,
        childAgeMonths,
        mode: 'deterministic_contract_guarded',
      })
    } catch {}

    // Gate de idade também no servidor (consistência e segurança)
    if (childAgeMonths === null) {
      const out: ApiResponse = { ok: false, error: 'age_missing', hint: 'Complete a idade no Eu360 para liberar.' }
      return NextResponse.json(out, { status: 200 })
    }

    if (childAgeMonths < MIN_MONTHS_BLOCK) {
      const out: ApiResponse = {
        ok: false,
        error: 'under_6',
        hint: 'Para essa fase, siga a orientação que você já usa com sua rede de saúde.',
      }
      return NextResponse.json(out, { status: 200 })
    }

    if (childAgeMonths < MIN_MONTHS_ALLOW_RECIPES) {
      const out: ApiResponse = {
        ok: false,
        error: 'intro_6_11',
        hint: 'Entre 6 e 11 meses, as orientações variam. Aqui a gente não sugere receitas.',
      }
      return NextResponse.json(out, { status: 200 })
    }

    if (!pantry) {
      const out: ApiResponse = { ok: false, error: 'empty_pantry', hint: 'Escreva 1 a 3 itens (ex.: “banana” ou “ovo, arroz”).' }
      return NextResponse.json(out, { status: 200 })
    }

    const tier = getAgeTier(childAgeMonths)

    // 1 item: libera se for “forte”
    const strongOneItem = items.length === 1 && hasAny(items, STRONG_ONE_ITEM_NEEDLES)

    if (items.length < 2 && !strongOneItem) {
      const out: ApiResponse = {
        ok: false,
        error: 'need_more_items',
        hint: 'Escreva 2 ou 3 itens (ex.: “ovo, arroz, cenoura”).',
      }
      return NextResponse.json(out, { status: 200 })
    }

    // FIX TS: tipo explícito único
    let recipe: Recipe | null = pickSpecificRecipe(items, slot, tier)

    if (!recipe && strongOneItem) {
      recipe = pickSingleItemRecipe(items, slot, tier)
    }

    if (!recipe) {
      const out: ApiResponse = {
        ok: false,
        error: 'not_specific_enough',
        hint: 'Me diga 2 ou 3 itens (ex.: “ovo, arroz, cenoura”) para eu montar uma receita bem direta.',
      }
      return NextResponse.json(out, { status: 200 })
    }

    const text = formatRecipeText(recipe)

    const latencyMs = Date.now() - t0
    try {
      track('meu_dia_leve.recipe.response', { ok: true, latencyMs, itemsCount: items.length })
    } catch {}

    const out: ApiResponse = { ok: true, text }
    return NextResponse.json(out, { status: 200 })
  } catch {
    const latencyMs = Date.now() - t0
    try {
      track('meu_dia_leve.recipe.response', { ok: false, latencyMs })
    } catch {}

    const out: ApiResponse = { ok: false, error: 'route_error', hint: 'Falhou agora. Se quiser, use uma opção pronta abaixo.' }
    return NextResponse.json(out, { status: 200 })
  }
}
