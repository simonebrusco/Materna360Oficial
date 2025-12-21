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
  if (recipe.note) {
    lines.push('')
    lines.push(`Observação: ${recipe.note}`)
  }
  return lines.join('\n')
}

/**
 * Fallback responsável para “1 ingrediente forte”.
 * Isso resolve o seu caso: "banana" no slot 5 não ficava específico -> agora fica.
 */
function pickSingleItemRecipe(items: string[], slot: Slot) {
  const hasBanana = hasAny(items, ['banana'])
  const hasEgg = hasAny(items, ['ovo'])
  const hasYogurt = hasAny(items, ['iogurte', 'iogurt'])
  const hasRice = hasAny(items, ['arroz'])
  const hasBeans = hasAny(items, ['feijão', 'feijao'])
  const hasBread = hasAny(items, ['pão', 'pao'])

  // Regra: título e passos simples, sem promessas nutricionais.
  // Tempo segue o slot, mas o preparo é sempre “possível”.
  const time = slot === '3' ? '3 min' : slot === '5' ? '5 min' : '10 min'

  if (hasBanana) {
    return {
      title: 'Banana do jeito mais simples',
      time,
      yield: '1 porção',
      ingredients: ['1 banana madura'],
      steps: [
        'Descasque e amasse com um garfo (ou corte em pedacinhos).',
        'Se quiser mais cremoso, amasse bem até virar “papinha”.',
        'Sirva em porções pequenas.',
      ],
      note: 'Quando a casa está corrida, o simples também é cuidado.',
    }
  }

  if (hasYogurt) {
    return {
      title: 'Iogurte puro (porção pequena)',
      time,
      yield: '1 porção',
      ingredients: ['Iogurte natural (o que você tiver)'],
      steps: ['Coloque uma porção pequena no potinho.', 'Sirva simples.'],
      note: 'Se você tiver fruta, dá para complementar depois.',
    }
  }

  if (hasEgg) {
    return {
      title: 'Ovo mexido básico',
      time,
      yield: '1 porção',
      ingredients: ['1 ovo', '1 fio de azeite ou um pouquinho de manteiga (se você usa em casa)'],
      steps: [
        'Bata o ovo rapidamente com um garfo.',
        'Aqueça a frigideira em fogo baixo com um fio de azeite/manteiga.',
        'Coloque o ovo e mexa devagar até ficar cozido e macio.',
      ],
      note: 'Fogo baixo deixa mais macio e fácil para a criança comer.',
    }
  }

  if (hasRice) {
    return {
      title: 'Arroz aquecido (porção pequena)',
      time,
      yield: '1 porção',
      ingredients: ['2 a 3 colheres de arroz já pronto'],
      steps: ['Aqueça o arroz.', 'Sirva em porções pequenas.'],
      note: 'Se você tiver feijão/legume, dá para complementar depois.',
    }
  }

  if (hasBeans) {
    return {
      title: 'Feijão amassadinho (ou caldo)',
      time,
      yield: '1 porção',
      ingredients: ['Feijão (amassadinho ou caldo, se você tiver pronto)'],
      steps: ['Aqueça se necessário.', 'Amasse alguns grãos ou use o caldo.', 'Sirva em porção pequena.'],
      note: 'Se tiver arroz, combina muito bem e vira refeição completa.',
    }
  }

  if (hasBread) {
    return {
      title: 'Pão em pedaços (sem complicar)',
      time,
      yield: '1 porção',
      ingredients: ['Pão (o que você tiver)'],
      steps: ['Corte em pedaços pequenos.', 'Sirva simples.'],
      note: 'Se tiver queijo ou fruta, você pode complementar.',
    }
  }

  return null
}

function pickSpecificRecipe(items: string[], slot: Slot) {
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
        note: 'Se a banana estiver bem madura, ela já adoça naturalmente.',
      }
    }

    if (hasYogurt && hasFruitWord(items)) {
      return {
        title: 'Iogurte com fruta (montagem)',
        time: '3 min',
        yield: '1 porção',
        ingredients: ['Iogurte natural', 'Fruta picada/amassada (a que você escreveu)'],
        steps: ['Coloque o iogurte no potinho.', 'Some a fruta por cima.', 'Sirva em porções pequenas.'],
        note: 'Quando o dia está corrido, montagem é o melhor tipo de receita.',
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
        ].filter(Boolean),
        note: 'Fogo baixo deixa mais macio e fácil para a criança comer.',
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
          hasVeg ? 'Finalize com legume em pedacinhos pequenos.' : 'Sirva em porções pequenas.',
        ],
        note: 'O foco aqui é “resolver” sem virar projeto.',
      }
    }

    if (hasBread && hasCheese) {
      return {
        title: 'Sanduíche rápido e macio',
        time: '5 min',
        yield: '1 porção',
        ingredients: ['Pão', 'Queijo (o que você tiver)'],
        steps: ['Monte o sanduíche.', 'Se quiser, aqueça rapidamente para ficar mais macio.', 'Corte em tirinhas e sirva.'],
        note: 'Cortar em tirinhas costuma ajudar quando a criança está seletiva.',
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
          hasEgg ? 'Misture o ovo.' : 'Se não tiver ovo, prefira usar outra opção pronta do dia.',
          hasOats ? 'Misture a aveia até virar massa grossinha.' : 'Se não tiver aveia, prefira usar outra opção pronta do dia.',
          'Em fogo baixo, faça discos pequenos e doure dos dois lados.',
        ],
        note: 'Discos pequenos: mais fácil, mais rápido, menos bagunça.',
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
        mode: 'deterministic_specific_only',
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

    // 1 item: libera se for “forte”
    const strongOneItem =
      items.length === 1 &&
      hasAny(items, ['ovo', 'arroz', 'banana', 'iogurte', 'pão', 'pao', 'feijão', 'feijao'])

    if (items.length < 2 && !strongOneItem) {
      const out: ApiResponse = {
        ok: false,
        error: 'need_more_items',
        hint: 'Escreva 2 ou 3 itens (ex.: “ovo, arroz, cenoura”).',
      }
      return NextResponse.json(out, { status: 200 })
    }

    // Primeiro tenta receita específica do slot.
    let recipe = pickSpecificRecipe(items, slot)

    // Se for 1 item forte e não achou receita específica do slot, aplica fallback responsável
    if (!recipe && strongOneItem) {
      recipe = pickSingleItemRecipe(items, slot)
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
