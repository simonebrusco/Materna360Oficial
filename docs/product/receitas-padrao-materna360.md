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
 * Observação (encerramento emocional) — SOMENTE frases aprovadas.
 * Sem dicas extras. Sem futuro. Sem "para variar". Sem "da próxima vez".
 */
const APPROVED_CLOSES = [
  'Resolver com o que tem já é cuidado suficiente.',
  'Quando o dia está cheio, isso já cumpre o papel.',
  'Não precisa melhorar agora. Isso basta.',
  'Simples assim também conta.',
] as const

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

/**
 * Observação determinística (sem "texto dinâmico"):
 * escolhe uma frase aprovada com base em slot+mood+qtd de itens.
 */
function pickClose(slot: Slot, mood: Mood, itemsCount: number) {
  const slotN = slot === '3' ? 3 : slot === '5' ? 5 : 10
  const moodN = mood === 'no-limite' ? 1 : mood === 'corrida' ? 2 : mood === 'ok' ? 3 : 4
  const idx = (slotN + moodN + itemsCount) % APPROVED_CLOSES.length
  return APPROVED_CLOSES[idx]
}

function formatRecipeText(recipe: {
  title: string
  time: string
  yield: string
  ingredients: string[]
  steps: string[]
  close: string
}) {
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
  lines.push(`Observação: ${recipe.close}`)
  return lines.join('\n')
}

/**
 * Faixa interna (sem mudar estrutura):
 * - 12–23: tende a "amassar / mais macio"
 * - 24+: tende a "pedaços pequenos"
 */
type AgeTier = 'toddler_12_23' | 'kid_24_plus'
function getAgeTier(months: number): AgeTier {
  return months < 24 ? 'toddler_12_23' : 'kid_24_plus'
}

function serveStyle(tier: AgeTier) {
  return tier === 'toddler_12_23'
    ? {
        fruitStep: 'Amasse com um garfo, como for mais fácil agora.',
        breadStep: 'Rasgue em pedacinhos, como for mais fácil agora.',
        finishStep: 'Misture rapidamente, sem se preocupar com textura perfeita.',
      }
    : {
        fruitStep: 'Corte em pedacinhos, como for mais fácil agora.',
        breadStep: 'Corte em pedacinhos, como for mais fácil agora.',
        finishStep: 'Misture rapidamente, sem se preocupar com textura perfeita.',
      }
}

/**
 * ============================
 * RECEITAS — SOMENTE NOMES DA LISTA OFICIAL (imutável)
 * ============================
 *
 * Lista usada aqui:
 * 1) Banana do jeito mais simples
 * 4) Iogurte com fruta (montagem simples)
 * 5) Iogurte simples do dia
 * 6) Ovo mexido macio
 * 9) Arroz aquecido do dia
 * 10) Arroz com complemento simples
 * 12) Arroz e feijão simples
 * 13) Arroz com legume do dia
 * 15) Panquequinha de banana simples
 * 18) Comida do dia sem complicar
 */

/**
 * 1 ITEM forte — fallback responsável, sem inventar ingrediente.
 * Mantém estrutura e usa só o item informado.
 */
function pickSingleItemRecipe(items: PantryItem[], slot: Slot, tier: AgeTier, mood: Mood) {
  const time = slot === '3' ? '3 min' : slot === '5' ? '5 min' : '10 min'
  const close = pickClose(slot, mood, items.length)
  const style = serveStyle(tier)

  const hasBanana = hasAny(items, ['banana'])
  const hasYogurt = hasAny(items, ['iogurte', 'iogurt'])
  const hasEgg = hasAny(items, ['ovo'])
  const hasRice = hasAny(items, ['arroz'])
  const hasBeans = hasAny(items, ['feijão', 'feijao'])
  const hasBread = hasAny(items, ['pão', 'pao'])

  if (hasBanana) {
    const bananaRaw = pickFirstRaw(items, ['banana']) ?? 'banana'
    return {
      title: 'Banana do jeito mais simples',
      time,
      yield: '1 porção',
      ingredients: [bananaRaw],
      steps: [
        style.fruitStep,
        'Sirva em porção pequena.',
      ],
      close,
    }
  }

  if (hasYogurt) {
    const yogurtRaw = pickFirstRaw(items, ['iogurte', 'iogurt']) ?? 'iogurte'
    return {
      title: 'Iogurte simples do dia',
      time,
      yield: '1 porção',
      ingredients: [yogurtRaw],
      steps: [
        'Coloque no potinho, como for mais fácil agora.',
        'Sirva em porção pequena.',
      ],
      close,
    }
  }

  if (hasEgg) {
    const eggRaw = pickFirstRaw(items, ['ovo']) ?? 'ovo'
    return {
      title: 'Ovo mexido macio',
      time,
      yield: '1 porção',
      ingredients: [eggRaw],
      steps: [
        'Bata rapidamente com um garfo, sem se preocupar com ponto perfeito.',
        'Aqueça em fogo baixo, só até ficar bom para servir.',
        'Mexa até ficar pronto, sem se preocupar com textura perfeita.',
      ],
      close,
    }
  }

  if (hasRice) {
    const riceRaw = pickFirstRaw(items, ['arroz']) ?? 'arroz'
    return {
      title: 'Arroz aquecido do dia',
      time,
      yield: '1 porção',
      ingredients: [riceRaw],
      steps: [
        'Aqueça, só até ficar bom para servir.',
        'Sirva em porção pequena.',
      ],
      close,
    }
  }

  if (hasBeans) {
    const beansRaw = pickFirstRaw(items, ['feijão', 'feijao']) ?? 'feijão'
    return {
      title: 'Comida do dia sem complicar',
      time,
      yield: '1 porção',
      ingredients: [beansRaw],
      steps: [
        'Aqueça, só até ficar bom para servir.',
        'Amasse com um garfo ou sirva como estiver, como for mais fácil agora.',
      ],
      close,
    }
  }

  if (hasBread) {
    const breadRaw = pickFirstRaw(items, ['pão', 'pao']) ?? 'pão'
    return {
      title: 'Comida do dia sem complicar',
      time,
      yield: '1 porção',
      ingredients: [breadRaw],
      steps: [
        style.breadStep,
        'Sirva em porção pequena.',
      ],
      close,
    }
  }

  return null
}

/**
 * 2+ itens — tenta encaixar em receitas oficiais sem inventar ingrediente.
 */
function pickSpecificRecipe(items: PantryItem[], slot: Slot, tier: AgeTier, mood: Mood) {
  const time = slot === '3' ? '3 min' : slot === '5' ? '5 min' : '10 min'
  const close = pickClose(slot, mood, items.length)
  const style = serveStyle(tier)

  const hasBanana = hasAny(items, ['banana'])
  const hasFruit = hasFruitWord(items)
  const hasYogurt = hasAny(items, ['iogurte', 'iogurt'])
  const hasEgg = hasAny(items, ['ovo'])
  const hasRice = hasAny(items, ['arroz'])
  const hasBeans = hasAny(items, ['feijão', 'feijao'])

  // frutas / montagens — 3 ou 5 min (mas não vamos “forçar”; só respeitar slot de tempo)
  if ((slot === '3' || slot === '5') && hasYogurt && hasFruit) {
    const yogurtRaw = pickFirstRaw(items, ['iogurte', 'iogurt'])!
    const fruitRaws = pickAllRaw(items, ['banana', 'maçã', 'maca', 'mamão', 'mamao', 'pera', 'morango', 'uva', 'laranja', 'tangerina'])
    const fruitLabel = fruitRaws.length ? fruitRaws.join(', ') : 'fruta'

    return {
      title: 'Iogurte com fruta (montagem simples)',
      time,
      yield: '1 porção',
      ingredients: [yogurtRaw, fruitLabel],
      steps: [
        'Coloque o iogurte no potinho, como for mais fácil agora.',
        style.finishStep,
        'Sirva em porção pequena.',
      ],
      close,
    }
  }

  if ((slot === '3' || slot === '5') && hasYogurt) {
    const yogurtRaw = pickFirstRaw(items, ['iogurte', 'iogurt'])!
    return {
      title: 'Iogurte simples do dia',
      time,
      yield: '1 porção',
      ingredients: [yogurtRaw],
      steps: [
        'Coloque no potinho, como for mais fácil agora.',
        'Sirva em porção pequena.',
      ],
      close,
    }
  }

  // Ovo — 5 min prioritariamente, mas pode cair em 3/10 sem quebrar contrato (tempo é só label)
  if (hasEgg) {
    const eggRaw = pickFirstRaw(items, ['ovo'])!
    return {
      title: 'Ovo mexido macio',
      time,
      yield: '1 porção',
      ingredients: [eggRaw],
      steps: [
        'Bata rapidamente com um garfo, sem se preocupar com ponto perfeito.',
        'Aqueça em fogo baixo, só até ficar bom para servir.',
        'Mexa até ficar pronto, sem se preocupar com textura perfeita.',
      ],
      close,
    }
  }

  // Arroz + feijão
  if (hasRice && hasBeans) {
    const riceRaw = pickFirstRaw(items, ['arroz'])!
    const beansRaw = pickFirstRaw(items, ['feijão', 'feijao'])!
    return {
      title: 'Arroz e feijão simples',
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
      close,
    }
  }

  // Arroz + "complemento" (qualquer outro item que a mãe colocou junto do arroz)
  if (hasRice) {
    const riceRaw = pickFirstRaw(items, ['arroz'])!
    // complemento = qualquer item diferente de arroz (sem inventar categoria)
    const complement = items.find((it) => !it.norm.includes('arroz'))?.raw

    if (complement) {
      // se o complemento for feijão, preferimos o nome oficial de arroz e feijão (acima). Aqui fica para os demais.
      const isLegumeWord = /legume|cenoura|abobrinha|batata|brócolis|brocolis|ervilha/i.test(complement)

      return {
        title: isLegumeWord ? 'Arroz com legume do dia' : 'Arroz com complemento simples',
        time,
        yield: '1 porção',
        ingredients: [riceRaw, complement],
        steps: [
          'Aqueça, só até ficar bom para servir.',
          'Monte: arroz + o que você tem, como for mais fácil agora.',
          'Sirva em porção pequena.',
        ],
        close,
      }
    }

    // arroz sozinho com 2+ itens não deve acontecer (porque aqui só entra se hasRice, mas pode cair se todos itens forem variações de "arroz")
    return {
      title: 'Arroz aquecido do dia',
      time,
      yield: '1 porção',
      ingredients: [riceRaw],
      steps: [
        'Aqueça, só até ficar bom para servir.',
        'Sirva em porção pequena.',
      ],
      close,
    }
  }

  // Banana (com algo mais) — sem inventar “creme”, sem incluir “água”, sem “aveia” se não veio.
  if (hasBanana) {
    const bananaRaw = pickFirstRaw(items, ['banana'])!
    // se existe mais alguma fruta, vira “Fruta em pedaços para agora” ou “Fruta amassada simples”,
    // mas esses nomes estão na lista; como não implementamos esses dois hoje, mantemos a banana oficial.
    return {
      title: 'Banana do jeito mais simples',
      time,
      yield: '1 porção',
      ingredients: [bananaRaw],
      steps: [
        style.fruitStep,
        'Sirva em porção pequena.',
      ],
      close,
    }
  }

  // fallback oficial neutro
  const anyRaw = items.map((i) => i.raw)
  return {
    title: 'Comida do dia sem complicar',
    time,
    yield: '1 porção',
    ingredients: anyRaw,
    steps: [
      'Junte do jeito mais simples, como for mais fácil agora.',
      'Aqueça se precisar, só até ficar bom para servir.',
      'Sirva em porção pequena.',
    ],
    close,
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
        hint: 'Para essa fase, o melhor é seguir a orientação que você já usa com sua rede de saúde.',
      }
      return NextResponse.json(out, { status: 200 })
    }

    if (childAgeMonths < MIN_MONTHS_ALLOW_RECIPES) {
      const out: ApiResponse = {
        ok: false,
        error: 'intro_6_11',
        hint: 'Entre 6 e 11 meses, as orientações variam. Aqui, por enquanto, a gente não sugere receitas.',
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

    // Primeiro tenta receita específica (somente nomes oficiais).
    let recipe = pickSpecificRecipe(items, slot, tier, mood)

    // Se for 1 item forte e não achou específica, aplica fallback responsável
    if (!recipe && strongOneItem) {
      recipe = pickSingleItemRecipe(items, slot, tier, mood)
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
