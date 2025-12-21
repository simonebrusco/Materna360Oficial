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

function pickSpecificRecipe(items: string[], slot: Slot) {
  // sinal forte (1 item já pode virar receita real)
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

  // 3 min: montagem
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

  // 5 min: fogão rápido
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

  // 10 min: panquequinha (exige banana + aveia/ovo)
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

function hasFruitWord(items: string[]) {
  const fruits = ['banana', 'maçã', 'maca', 'mamão', 'mamao', 'pera', 'morango', 'uva', 'laranja', 'tangerina']
  return hasAny(items, fruits)
}

export async function POST(req: Request) {
  const t0 = Date.now()

  try {
    const body = (await req.json()) as Body

    const slot = clampSlot(body?.slot)
    const mood = clampMood(body?.mood)
    const pantry = sanitizePantry(body?.pantry ?? '')
    const items = splitItems(pantry)

    try {
      track('meu_dia_leve.recipe.request', {
        slot,
        mood,
        pantryLen: pantry.length,
        itemsCount: items.length,
        mode: 'deterministic_specific_only',
      })
    } catch {}

    // Regra 1: sem texto -> sem receita
    if (!pantry) {
      return NextResponse.json({ ok: false, error: 'empty_pantry' }, { status: 200 })
    }

    // Regra 2: com 1 item, só libera se for “item forte” (ovo/arroz/banana/pão+iogurte etc.)
    // Caso contrário, pede 2–3 itens.
    const strongOneItem =
      items.length === 1 &&
      (hasAny(items, ['ovo', 'arroz', 'banana', 'iogurte', 'pão', 'pao', 'feijão', 'feijao']))

    if (items.length < 2 && !strongOneItem) {
      return NextResponse.json(
        {
          ok: false,
          error: 'need_more_items',
          hint: 'Escreva 2 ou 3 itens (ex.: “ovo, arroz, cenoura”).',
        },
        { status: 200 },
      )
    }

    // Regra 3: só retorna receita se for específica
    const recipe = pickSpecificRecipe(items, slot)
    if (!recipe) {
      return NextResponse.json(
        {
          ok: false,
          error: 'not_specific_enough',
          hint: 'Me diga 2 ou 3 itens (ex.: “ovo, arroz, cenoura”) que eu monto uma receita bem direta.',
        },
        { status: 200 },
      )
    }

    const text = formatRecipeText(recipe)

    const latencyMs = Date.now() - t0
    try {
      track('meu_dia_leve.recipe.response', { ok: true, latencyMs, itemsCount: items.length })
    } catch {}

    return NextResponse.json({ ok: true, text }, { status: 200 })
  } catch {
    const latencyMs = Date.now() - t0
    try {
      track('meu_dia_leve.recipe.response', { ok: false, latencyMs })
    } catch {}

    return NextResponse.json({ ok: false, error: 'route_error' }, { status: 200 })
  }
}
