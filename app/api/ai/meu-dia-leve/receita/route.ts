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

type EnergyLevel = 'low' | 'medium' | 'high' | 'steady'
type VariationAxis = 'alivio' | 'clareza' | 'fechamento' | 'fluxo'

type Body = {
  slot?: Slot
  mood?: Mood
  pantry?: string
  childAgeMonths?: number
  // extras opcionais vindos do Client (compat: ignorados se não existirem)
  childAgeYears?: number
  childAgeLabel?: string

  // P34.11.1 — eixos opcionais (apenas telemetria / governança)
  energy_level?: EnergyLevel
  variation_axis?: VariationAxis
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
const STRONG_ONE_ITEM_NEEDLES = ['ovo', 'arroz', 'banana', 'iogurte', 'iogurt', 'pão', 'pao', 'feijão', 'feijao']

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
 * Estrutura fixa:
 * - Nome
 * - Tempo • Rende
 * - Ingredientes
 * - Modo de preparo
 * - Observação
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
 * Sem dicas extras. Sem futuro. Sem “melhor”, “ideal”, “recomendado”.
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

/**
 * Split preservando o "raw" (para ingredientes),
 * e criando um "norm" (para match).
 * ✅ CONTRATO: ingredientes devem ser apenas o que a mãe informou.
 */
type PantryItem = { raw: string; norm: string }

function splitItems(pantry: string): PantryItem[] {
  const parts = pantry
    .split(/[,;.\n]/g)
    .map((s) => s.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const out: PantryItem[] = []

  for (const p of parts) {
    const norm = p.toLowerCase()
    if (seen.has(norm)) continue
    seen.add(norm)
    out.push({ raw: p, norm })
  }

  return out.slice(0, 8)
}

function hasAny(items: PantryItem[], needles: string[]) {
  return needles.some((n) => items.some((it) => it.norm.includes(n)))
}

function pickFirstRaw(items: PantryItem[], needles: string[]) {
  for (const it of items) {
    if (needles.some((n) => it.norm.includes(n))) return it.raw
  }
  return null
}

function pickAllRaw(items: PantryItem[], needles: string[]) {
  return items.filter((it) => needles.some((n) => it.norm.includes(n))).map((it) => it.raw)
}

function hasFruitWord(items: PantryItem[]) {
  const fruits = ['banana', 'maçã', 'maca', 'mamão', 'mamao', 'pera', 'morango', 'uva', 'laranja', 'tangerina']
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
      fruitStep: 'Amasse com um garfo, como for mais fácil agora.',
      piecesStep: 'Se preferir, deixe mais amassado/macio, como for mais fácil agora.',
      serveSmall: 'Sirva em porção pequena.',
    }
  }
  return {
    fruitStep: 'Corte em pedacinhos, como for mais fácil agora.',
    piecesStep: 'Corte em pedacinhos, como for mais fácil agora.',
    serveSmall: 'Sirva em porção pequena.',
  }
}

/**
 * 1 ITEM forte — fallback responsável.
 * ✅ CONTRATO: ingredientes = somente o que a mãe informou (raw).
 * ✅ Título = somente da lista oficial.
 * ✅ Sem inventar azeite, água, “já pronto”, quantidades.
 */
function pickSingleItemRecipe(items: PantryItem[], slot: Slot, tier: AgeTier): Recipe | null {
  const time = slot === '3' ? '3 min' : slot === '5' ? '5 min' : '10 min'
  const style = stepServeStyle(tier)

  const hasBanana = hasAny(items, ['banana'])
  const hasYogurt = hasAny(items, ['iogurte', 'iogurt'])
  const hasEgg = hasAny(items, ['ovo'])
  const hasRice = hasAny(items, ['arroz'])
  const hasBeans = hasAny(items, ['feijão', 'feijao'])
  const hasBread = hasAny(items, ['pão', 'pao'])

  if (hasBanana) {
    const bananaRaw = pickFirstRaw(items, ['banana']) ?? items[0]?.raw
    if (!bananaRaw) return null
    return {
      title: OFFICIAL_TITLES.bananaSimples,
      time,
      yield: '1 porção',
      ingredients: [bananaRaw],
      steps: [style.fruitStep, style.serveSmall],
    }
  }

  if (hasYogurt) {
    const yogurtRaw = pickFirstRaw(items, ['iogurte', 'iogurt']) ?? items[0]?.raw
    if (!yogurtRaw) return null
    return {
      title: OFFICIAL_TITLES.iogurteSimples,
      time,
      yield: '1 porção',
      ingredients: [yogurtRaw],
      steps: ['Coloque no potinho, como for mais fácil agora.', style.serveSmall],
    }
  }

  if (hasEgg) {
    const eggRaw = pickFirstRaw(items, ['ovo']) ?? items[0]?.raw
    if (!eggRaw) return null
    return {
      title: OFFICIAL_TITLES.ovoMacio,
      time,
      yield: '1 porção',
      ingredients: [eggRaw],
      steps: [
        'Bata rapidamente com um garfo, sem se preocupar com ponto perfeito.',
        'Aqueça em fogo baixo, só até ficar bom para servir.',
        'Mexa até ficar pronto, sem se preocupar com textura perfeita.',
      ],
    }
  }

  if (hasRice) {
    const riceRaw = pickFirstRaw(items, ['arroz']) ?? items[0]?.raw
    if (!riceRaw) return null
    return {
      title: OFFICIAL_TITLES.arrozAquecido,
      time,
      yield: '1 porção',
      ingredients: [riceRaw],
      steps: ['Aqueça, só até ficar bom para servir.', style.serveSmall],
    }
  }

  // Para feijão e pão: opção neutra oficial (sem inventar ingrediente).
  if (hasBeans) {
    const beansRaw = pickFirstRaw(items, ['feijão', 'feijao']) ?? items[0]?.raw
    if (!beansRaw) return null
    return {
      title: OFFICIAL_TITLES.comidaSemComplicar,
      time,
      yield: '1 porção',
      ingredients: [beansRaw],
      steps: [
        'Aqueça se precisar, só até ficar bom para servir.',
        'Amasse com um garfo ou sirva como estiver, como for mais fácil agora.',
      ],
    }
  }

  if (hasBread) {
    const breadRaw = pickFirstRaw(items, ['pão', 'pao']) ?? items[0]?.raw
    if (!breadRaw) return null
    return {
      title: OFFICIAL_TITLES.comidaSemComplicar,
      time,
      yield: '1 porção',
      ingredients: [breadRaw],
      steps: [style.piecesStep, style.serveSmall],
    }
  }

  return null
}

/**
 * 2+ itens — tenta encaixar em receitas oficiais sem inventar ingrediente.
 * ✅ CONTRATO: ingredientes = raws informados.
 * ✅ Sem água, azeite, manteiga, quantidades, “já pronto”.
 */
function pickSpecificRecipe(items: PantryItem[], slot: Slot, tier: AgeTier): Recipe | null {
  const time = slot === '3' ? '3 min' : slot === '5' ? '5 min' : '10 min'
  const style = stepServeStyle(tier)

  const hasYogurt = hasAny(items, ['iogurte', 'iogurt'])
  const hasFruit = hasFruitWord(items)

  const hasEgg = hasAny(items, ['ovo'])
  const hasRice = hasAny(items, ['arroz'])
  const hasBeans = hasAny(items, ['feijão', 'feijao'])
  const hasBanana = hasAny(items, ['banana'])

  // Iogurte + fruta (3/5 min)
  if ((slot === '3' || slot === '5') && hasYogurt && hasFruit) {
    const yogurtRaw = pickFirstRaw(items, ['iogurte', 'iogurt'])
    if (!yogurtRaw) return null

    const fruitRaws = pickAllRaw(items, [
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
    ])
    const fruitLabel = fruitRaws.length ? fruitRaws.join(', ') : 'Fruta'

    return {
      title: OFFICIAL_TITLES.iogurteComFruta,
      time,
      yield: '1 porção',
      ingredients: [yogurtRaw, fruitLabel],
      steps: [
        'Coloque o iogurte no potinho, como for mais fácil agora.',
        tier === 'toddler_12_23'
          ? 'Amasse a fruta e coloque por cima, como for mais fácil agora.'
          : 'Pique a fruta e coloque por cima, como for mais fácil agora.',
        style.serveSmall,
      ],
    }
  }

  // Iogurte simples (3/5 min)
  if ((slot === '3' || slot === '5') && hasYogurt) {
    const yogurtRaw = pickFirstRaw(items, ['iogurte', 'iogurt'])
    if (!yogurtRaw) return null
    return {
      title: OFFICIAL_TITLES.iogurteSimples,
      time,
      yield: '1 porção',
      ingredients: [yogurtRaw],
      steps: ['Coloque no potinho, como for mais fácil agora.', style.serveSmall],
    }
  }

  // Ovo mexido (prioriza 5 min, mas pode cair em qualquer slot sem quebrar contrato)
  if (hasEgg) {
    const eggRaw = pickFirstRaw(items, ['ovo'])
    if (!eggRaw) return null
    return {
      title: OFFICIAL_TITLES.ovoMacio,
      time,
      yield: '1 porção',
      ingredients: [eggRaw],
      steps: [
        'Bata rapidamente com um garfo, sem se preocupar com ponto perfeito.',
        'Aqueça em fogo baixo, só até ficar bom para servir.',
        'Mexa até ficar pronto, sem se preocupar com textura perfeita.',
      ],
    }
  }

  // Arroz e feijão
  if (hasRice && hasBeans) {
    const riceRaw = pickFirstRaw(items, ['arroz'])
    const beansRaw = pickFirstRaw(items, ['feijão', 'feijao'])
    if (!riceRaw || !beansRaw) return null

    return {
      title: OFFICIAL_TITLES.arrozFeijao,
      time,
      yield: '1 porção',
      ingredients: [riceRaw, beansRaw],
      steps: [
        'Aqueça o que precisar, só até ficar bom para servir.',
        'Junte no prato, como for mais fácil agora.',
        tier === 'toddler_12_23'
          ? 'Se quiser, amasse com um garfo, como for mais fácil agora.'
          : 'Misture de leve, sem se preocupar com textura perfeita.',
      ],
    }
  }

  // Arroz + complemento (qualquer outro item informado)
  if (hasRice) {
    const riceRaw = pickFirstRaw(items, ['arroz'])
    if (!riceRaw) return null

    const complement = items.find((it) => !it.norm.includes('arroz'))?.raw ?? null

    if (complement) {
      const isLegumeWord = /legume|cenoura|abobrinha|batata|brócolis|brocolis|ervilha/i.test(complement)
      return {
        title: isLegumeWord ? OFFICIAL_TITLES.arrozLegume : OFFICIAL_TITLES.arrozComplemento,
        time,
        yield: '1 porção',
        ingredients: [riceRaw, complement],
        steps: [
          'Aqueça, só até ficar bom para servir.',
          'Monte: arroz + o que você tem, como for mais fácil agora.',
          style.serveSmall,
        ],
      }
    }

    // Se cair aqui, é arroz “sozinho” (ou itens redundantes de arroz). Mantém oficial.
    return {
      title: OFFICIAL_TITLES.arrozAquecido,
      time,
      yield: '1 porção',
      ingredients: [riceRaw],
      steps: ['Aqueça, só até ficar bom para servir.', style.serveSmall],
    }
  }

  // Banana (com algo junto) — mantém oficial e não inventa complemento
  if (hasBanana) {
    const bananaRaw = pickFirstRaw(items, ['banana'])
    if (!bananaRaw) return null
    return {
      title: OFFICIAL_TITLES.bananaSimples,
      time,
      yield: '1 porção',
      ingredients: [bananaRaw],
      steps: [style.fruitStep, style.serveSmall],
    }
  }

  // fallback oficial neutro (usa todos os itens informados, sem inventar)
  return {
    title: OFFICIAL_TITLES.comidaSemComplicar,
    time,
    yield: '1 porção',
    ingredients: items.map((i) => i.raw),
    steps: [
      'Junte do jeito mais simples, como for mais fácil agora.',
      'Aqueça se precisar, só até ficar bom para servir.',
      style.serveSmall,
    ],
  }
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
        energy_level: body?.energy_level ?? null,
        variation_axis: body?.variation_axis ?? null,
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
      const out: ApiResponse = {
        ok: false,
        error: 'empty_pantry',
        hint: 'Escreva 1 a 3 itens (ex.: “banana” ou “ovo, arroz”).',
      }
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

    const out: ApiResponse = {
      ok: false,
      error: 'route_error',
      hint: 'Não consegui gerar agora. Se quiser, use uma opção pronta abaixo.',
    }
    return NextResponse.json(out, { status: 200 })
  }
}
