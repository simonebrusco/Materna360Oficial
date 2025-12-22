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
const STRONG_ONE_ITEM_NEEDLES = ['ovo', 'arroz', 'banana', 'iogurte', 'iogurt', 'pão', 'pao', 'feijão', 'feijao']

/**
 * Encerramento padrão (blindagem de tom).
 * - Sem promessas
 * - Sem discurso nutricional
 * - Sem prescrição
 * - Sempre “suficiente por agora”
 */
function closeNote(input?: string) {
  const base = String(input ?? '').trim()
  // Se vier vazio, aplica o padrão do produto
  if (!base) return 'Se hoje der só isso, já está bom por agora.'
  // Evita notas longas / dramáticas
  const clipped = base.length > 110 ? `${base.slice(0, 107)}…` : base
  // Garante fechamento padrão no final
  const suffix = ' Se hoje der só isso, já está bom por agora.'
  return clipped.endsWith('por agora.') ? clipped : `${clipped}${suffix}`
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
  const fruits = ['banana', 'maçã', 'maca', 'mamão', 'mamao', 'pera', 'morango', 'uva', 'laranja', 'tangerina']
  return hasAny(items, fruits)
}

function formatRecipeText(recipe: {
  title: string
  time: string
  yield: string
  ingredients: string[]
  steps: string[]
  note?: string
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
  lines.push(`Observação: ${closeNote(recipe.note)}`)
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
 * Mantém tom, mantém estrutura e mantém o “suficiente por agora”.
 */
function stepServeStyle(tier: AgeTier) {
  if (tier === 'toddler_12_23') {
    return {
      serveSmall: 'Sirva em porções pequenas, mais amassado/macio se precisar.',
      serveMash: 'Amasse bem para ficar mais macio.',
      servePieces: 'Se preferir, sirva mais amassado/macio.',
    }
  }
  return {
    serveSmall: 'Sirva em porções pequenas.',
    serveMash: 'Amasse só o suficiente para ficar confortável.',
    servePieces: 'Corte em pedaços pequenos e sirva.',
  }
}

/**
 * Fallback responsável para “1 ingrediente forte”.
 * - Sempre mantém estrutura padrão
 * - Sempre fecha com note padrão (blindada)
 * - Nunca “orienta”, “recomenda”, “idealiza”
 */
function pickSingleItemRecipe(items: string[], slot: Slot, tier: AgeTier) {
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
      title: 'Banana do jeito mais simples',
      time,
      yield: '1 porção',
      ingredients: ['1 banana madura'],
      steps: [
        'Descasque e amasse com um garfo (ou corte em pedacinhos).',
        tier === 'toddler_12_23' ? 'Amasse bem até ficar mais macio.' : 'Amasse até ficar do jeito que funciona aí.',
        style.serveSmall,
      ],
      note: 'Sem complicar: resolve a fome e segue.',
    }
  }

  if (hasYogurt) {
    return {
      title: 'Iogurte simples (porção pequena)',
      time,
      yield: '1 porção',
      ingredients: ['Iogurte natural (o que você tiver)'],
      steps: ['Coloque uma porção pequena no potinho.', tier === 'toddler_12_23' ? 'Sirva mais simples e macio.' : 'Sirva simples.'],
      note: 'Se tiver fruta, dá para complementar depois.',
    }
  }

  if (hasEgg) {
    return {
      title: 'Ovo mexido básico e macio',
      time,
      yield: '1 porção',
      ingredients: ['1 ovo', '1 fio de azeite ou um pouquinho de manteiga (se você usa em casa)'],
      steps: [
        'Bata o ovo rapidamente com um garfo.',
        'Aqueça a frigideira em fogo baixo com um fio de azeite/manteiga.',
        'Coloque o ovo e mexa devagar até ficar cozido e macio.',
        tier === 'toddler_12_23' ? 'Se quiser, amasse um pouco no prato para ficar mais macio.' : 'Sirva em seguida.',
      ],
      note: 'Fogo baixo costuma deixar mais macio.',
    }
  }

  if (hasRice) {
    return {
      title: 'Arroz aquecido (porção pequena)',
      time,
      yield: '1 porção',
      ingredients: ['2 a 3 colheres de arroz já pronto'],
      steps: ['Aqueça o arroz.', tier === 'toddler_12_23' ? 'Sirva em porções pequenas, mais macio se precisar.' : 'Sirva em porções pequenas.'],
      note: 'Se tiver feijão/legume, você pode complementar depois.',
    }
  }

  if (hasBeans) {
    return {
      title: 'Feijão amassadinho (ou caldo)',
      time,
      yield: '1 porção',
      ingredients: ['Feijão pronto (amassadinho ou caldo, como você já usa em casa)'],
      steps: ['Aqueça se necessário.', 'Amasse alguns grãos ou use o caldo.', style.serveSmall],
      note: 'Se tiver arroz, combina fácil e sem esforço.',
    }
  }

  if (hasBread) {
    return {
      title: 'Pão em pedaços (sem complicar)',
      time,
      yield: '1 porção',
      ingredients: ['Pão (o que você tiver)'],
      steps: [
        tier === 'toddler_12_23' ? 'Rasgue em pedaços bem pequenos e deixe mais macio se quiser.' : 'Corte em pedaços pequenos.',
        'Sirva simples.',
      ],
      note: 'Se tiver queijo ou fruta, dá para completar sem virar tarefa.',
    }
  }

  return null
}

function pickSpecificRecipe(items: string[], slot: Slot, tier: AgeTier) {
  const hasEgg = hasAny(items, ['ovo'])
  const hasBanana = hasAny(items, ['banana'])
  const hasRice = hasAny(items, ['arroz'])
  const hasYogurt = hasAny(items, ['iogurte', 'iogurt'])
  const hasOats = hasAny(items, ['aveia'])
  const hasBread = hasAny(items, ['pão', 'pao'])
  const hasCheese = hasAny(items, ['queijo'])
  const hasBeans = hasAny(items, ['feijão', 'feijao'])
  const hasChicken = hasAny(items, ['frango'])
  const hasVeg = hasAny(items, ['legume', 'cenoura', 'abobrinha', 'batata', 'brócolis', 'brocolis', 'ervilha'])

  const style = stepServeStyle(tier)

  // 3 min
  if (slot === '3') {
    if (hasBanana && (hasOats || hasYogurt)) {
      return {
        title: 'Creme rápido de banana',
        time: '3 min',
        yield: '1 porção',
        ingredients: [
          '1 banana madura',
          hasYogurt ? '2 a 3 colheres de iogurte natural (se você tiver)' : null,
          hasOats ? '1 colher de aveia (se você tiver)' : null,
        ].filter(Boolean) as string[],
        steps: [
          'Amasse a banana com um garfo até ficar cremosa.',
          hasYogurt ? 'Misture o iogurte para deixar mais macio.' : 'Se quiser mais macio, adicione 1 a 2 colheres de água e misture.',
          hasOats ? 'Finalize com a aveia por cima.' : 'Sirva assim mesmo: simples e suficiente.',
        ],
        note: 'É uma montagem pequena que ajuda a atravessar o agora.',
      }
    }

    if (hasYogurt && hasFruitWord(items)) {
      return {
        title: 'Iogurte com fruta (montagem)',
        time: '3 min',
        yield: '1 porção',
        ingredients: ['Iogurte natural', 'Fruta picada/amassada (a que você escreveu)'],
        steps: [
          'Coloque o iogurte no potinho.',
          tier === 'toddler_12_23' ? 'Amasse a fruta e misture por cima.' : 'Some a fruta por cima.',
          style.serveSmall,
        ],
        note: 'Montagem é o melhor tipo de receita quando o dia está curto.',
      }
    }
  }

  // 5 min
  if (slot === '5') {
    if (hasEgg) {
      return {
        title: 'Ovo mexido macio',
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
          tier === 'toddler_12_23' ? 'Se quiser, deixe mais macio no prato (amassando de leve).' : '',
        ].filter(Boolean),
        note: 'Curto, direto e sem virar projeto.',
      }
    }

    if (hasRice && (hasBeans || hasChicken || hasVeg)) {
      return {
        title: 'Arroz rápido com complemento',
        time: '5 min',
        yield: '1 porção',
        ingredients: [
          '2 a 3 colheres de arroz já pronto',
          hasBeans ? 'Feijão (amassadinho ou caldo, se você tiver)' : null,
          hasChicken ? 'Frango desfiado/pronto (se você tiver)' : null,
          hasVeg ? 'Legume cozido picado (se você tiver)' : null,
        ].filter(Boolean) as string[],
        steps: [
          'Aqueça o arroz (e o complemento, se for quente).',
          'Monte: arroz + 1 complemento.',
          hasVeg ? (tier === 'toddler_12_23' ? 'Finalize com legume bem picado/amassado.' : 'Finalize com legume em pedacinhos pequenos.') : style.serveSmall,
        ],
        note: 'Resolve sem esticar o dia.',
      }
    }

    if (hasBread && hasCheese) {
      return {
        title: 'Sanduíche rápido e macio',
        time: '5 min',
        yield: '1 porção',
        ingredients: ['Pão', 'Queijo (o que você tiver)'],
        steps: [
          'Monte o sanduíche.',
          'Se quiser, aqueça rapidamente para ficar mais macio.',
          tier === 'toddler_12_23' ? 'Rasgue em pedaços pequenos e sirva.' : 'Corte em tirinhas e sirva.',
        ],
        note: 'Quando estiver tudo corrido, macio e simples ajuda.',
      }
    }
  }

  // 10 min
  if (slot === '10') {
    if (hasBanana && (hasOats || hasEgg)) {
      return {
        title: 'Panquequinha de banana (sem açúcar)',
        time: '10 min',
        yield: '1 porção',
        ingredients: [
          '1 banana madura',
          hasEgg ? '1 ovo (se você tiver)' : null,
          hasOats ? '2 colheres de aveia (se você tiver)' : null,
        ].filter(Boolean) as string[],
        steps: [
          'Amasse a banana até virar um creme.',
          hasEgg ? 'Misture o ovo.' : 'Se não tiver ovo, use uma opção pronta do dia.',
          hasOats ? 'Misture a aveia até virar massa grossinha.' : 'Se não tiver aveia, use uma opção pronta do dia.',
          'Em fogo baixo, faça discos pequenos e doure dos dois lados.',
          tier === 'toddler_12_23' ? 'Depois, rasgue em pedacinhos e deixe mais macio se quiser.' : 'Depois, corte em pedaços pequenos e sirva.',
        ],
        note: 'Discos pequenos deixam tudo mais rápido e com menos bagunça.',
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
      // hint levemente mais “contextual” por idade, sem mudar comportamento
      const tier = getAgeTier(childAgeMonths)
      const out: ApiResponse =
        tier === 'toddler_12_23'
          ? { ok: false, error: 'empty_pantry', hint: 'Escreva 1 a 3 itens (ex.: “banana” ou “ovo, arroz”).' }
          : { ok: false, error: 'empty_pantry', hint: 'Escreva 1 a 3 itens (ex.: “banana” ou “ovo, arroz”).' }
      return NextResponse.json(out, { status: 200 })
    }

    const tier = getAgeTier(childAgeMonths)

    // 1 item: libera se for “forte”
    const strongOneItem = items.length === 1 && hasAny(items, STRONG_ONE_ITEM_NEEDLES)

    if (items.length < 2 && !strongOneItem) {
      const out: ApiResponse = {
        ok: false,
        error: 'need_more_items',
        // sem mudar a regra: só o texto do hint pode ser um pouco mais “prático”
        hint: tier === 'toddler_12_23' ? 'Escreva 2 ou 3 itens (ex.: “ovo, arroz, cenoura”).' : 'Escreva 2 ou 3 itens (ex.: “ovo, arroz, cenoura”).',
      }
      return NextResponse.json(out, { status: 200 })
    }

    // Primeiro tenta receita específica do slot (com variação interna por idade).
    let recipe = pickSpecificRecipe(items, slot, tier)

    // Se for 1 item forte e não achou receita específica do slot, aplica fallback responsável (com variação interna por idade).
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
