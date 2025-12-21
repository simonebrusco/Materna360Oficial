import { NextResponse } from 'next/server'
import { track } from '@/app/lib/telemetry'

export const dynamic = 'force-dynamic'

type Slot = '3' | '5' | '10'
type Mood = 'no-limite' | 'corrida' | 'ok' | 'leve'

type Body = {
  slot?: Slot
  mood?: Mood
  pantry?: string
  // opcional: o client pode enviar, mas a rota não depende disso
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
  // garante string, remove excesso, limita tamanho, remove caracteres estranhos
  const raw = String(input ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N},;.\-\s]/gu, '')
    .trim()

  // hard limit (evita payload gigante)
  return raw.slice(0, 140)
}

function splitItems(pantry: string): string[] {
  const parts = pantry
    .split(/[,;.\n]/g)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  // remove duplicados simples
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

function pickRecipe(items: string[], slot: Slot) {
  // Observação de segurança:
  // - não sugerir mel (risco < 1 ano)
  // - não sugerir pasta de amendoim / oleaginosas / castanhas como “variação” se não estiverem no pantry
  // - não sugerir açúcar/refrigerante/biscoito
  // - evitar “sal” como instrução; pode citar “tempero natural” de forma neutra
  //
  // A receita é para criança (>= 12 meses) e precisa ser simples, real e estruturada.

  const hasBanana = hasAny(items, ['banana'])
  const hasEgg = hasAny(items, ['ovo'])
  const hasYogurt = hasAny(items, ['iogurte', 'iogurt'])
  const hasOats = hasAny(items, ['aveia'])
  const hasRice = hasAny(items, ['arroz'])
  const hasBread = hasAny(items, ['pão', 'pao'])
  const hasCheese = hasAny(items, ['queijo'])
  const hasChicken = hasAny(items, ['frango'])
  const hasBeans = hasAny(items, ['feijão', 'feijao'])
  const hasVeg = hasAny(items, ['legume', 'cenoura', 'abobrinha', 'batata', 'brócolis', 'brocolis', 'ervilha'])
  const hasFruitOther = hasAny(items, ['maçã', 'maca', 'mamão', 'mamao', 'pera', 'morango'])

  // 3 min: montagem/sem fogão
  if (slot === '3') {
    if (hasBanana && (hasOats || hasYogurt)) {
      return {
        title: 'Creme rápido de banana',
        time: '3 min',
        yield: '1 porção',
        ingredients: [
          hasBanana ? '1 banana madura' : null,
          hasYogurt ? '2 a 3 colheres de iogurte natural (se você tiver)' : null,
          hasOats ? '1 colher de aveia (se você tiver)' : null,
          'Opcional: um pouquinho de canela (se a criança já consome e você usa em casa)',
        ].filter(Boolean) as string[],
        steps: [
          'Amasse a banana com um garfo até ficar bem cremosa.',
          hasYogurt ? 'Misture o iogurte para deixar mais macio.' : 'Se quiser mais macio, adicione 1 a 2 colheres de água e misture.',
          hasOats ? 'Finalize com a aveia por cima para dar textura.' : 'Sirva assim mesmo: simples e suficiente.',
        ],
        note: 'Dica: se a banana estiver bem madura, ela já dá o “docinho” natural — não precisa adoçar.',
      }
    }

    if (hasFruitOther) {
      return {
        title: 'Fruta amassada com toque de textura',
        time: '3 min',
        yield: '1 porção',
        ingredients: [
          '1 fruta madura (a que você tiver)',
          'Opcional: 1 colher de aveia (se tiver) ou iogurte natural (se tiver)',
        ],
        steps: [
          'Amasse a fruta até virar um purê.',
          'Se tiver, misture um pouco de iogurte para deixar cremoso ou finalize com aveia por cima.',
          'Sirva em colheradas pequenas, sem pressa.',
        ],
        note: 'Se a criança estiver cansada, porções menores funcionam melhor do que insistir em “comer tudo”.',
      }
    }
  }

  // 5 min: fogão rápido
  if (slot === '5') {
    if (hasEgg) {
      return {
        title: 'Ovo mexido cremoso (bem simples)',
        time: '5 min',
        yield: '1 porção',
        ingredients: [
          '1 ovo',
          hasCheese ? 'Opcional: 1 colher de queijo ralado/picado (se você tiver)' : null,
          hasVeg ? 'Opcional: 1 colher de legume já cozido/picado (se você tiver)' : null,
          '1 fio de azeite ou um pouquinho de manteiga (se você usa em casa)',
        ].filter(Boolean) as string[],
        steps: [
          'Bata o ovo com um garfo (só para misturar gema e clara).',
          'Aqueça a frigideira em fogo baixo com um fio de azeite/manteiga.',
          'Coloque o ovo e mexa devagar até ficar cozido e macio.',
          hasVeg ? 'Se tiver legume pronto, misture no final por 30 segundos.' : 'Finalize e sirva.',
          hasCheese ? 'Se tiver queijo, coloque no final e misture rapidamente.' : '',
        ].filter(Boolean),
        note: 'Para criança, fogo baixo ajuda a manter macio e fácil de comer.',
      }
    }

    if (hasRice && (hasChicken || hasBeans || hasVeg)) {
      return {
        title: 'Pratinho rápido: arroz + complemento',
        time: '5 min',
        yield: '1 porção',
        ingredients: [
          '2 a 3 colheres de arroz já pronto',
          hasChicken ? 'Frango desfiado/pronto (o que você tiver)' : null,
          hasBeans ? 'Feijão (amassadinho ou caldo, se você tiver)' : null,
          hasVeg ? 'Legume cozido picado (se você tiver)' : null,
        ].filter(Boolean) as string[],
        steps: [
          'Aqueça o arroz (e o que for quente) por 1 a 2 minutos.',
          'Monte o pratinho: arroz + 1 complemento.',
          'Se tiver legume, adicione em pedacinhos pequenos.',
        ],
        note: 'O segredo aqui é “um pratinho honesto” — simples, mas completo.',
      }
    }

    if (hasBread && (hasCheese || hasEgg)) {
      return {
        title: 'Sanduíche rápido e macio',
        time: '5 min',
        yield: '1 porção',
        ingredients: [
          '1 pão (ou fatia de pão)',
          hasCheese ? 'Queijo (se você tiver)' : null,
          hasEgg ? 'Opcional: ovo mexido (se você tiver)' : null,
          'Opcional: uma fruta ao lado (se tiver)',
        ].filter(Boolean) as string[],
        steps: [
          'Monte o pão com o que você tiver de recheio.',
          'Se quiser, aqueça por 1 minuto para ficar mais macio.',
          'Sirva com uma fruta ao lado, se tiver.',
        ],
        note: 'Se a criança estiver seletiva, cortar em tirinhas costuma ajudar.',
      }
    }
  }

  // 10 min: “um pouco mais” mas ainda curto
  if (slot === '10') {
    if (hasBanana && (hasOats || hasEgg)) {
      return {
        title: 'Panquequinha de banana (sem açúcar)',
        time: '10 min',
        yield: '1 porção',
        ingredients: [
          '1 banana madura',
          hasEgg ? '1 ovo (se você tiver)' : '2 colheres de água (para dar liga)',
          hasOats ? '2 colheres de aveia (se você tiver)' : '2 colheres de farinha que você use em casa',
          'Opcional: canela (se a criança já consome)',
        ],
        steps: [
          'Amasse a banana até virar um creme.',
          hasEgg ? 'Misture o ovo e mexa bem.' : 'Misture a água aos poucos só para dar liga.',
          'Misture a aveia/farinha até virar uma massa grossinha.',
          'Em frigideira antiaderente, fogo baixo: faça discos pequenos e doure dos dois lados.',
        ],
        note: 'Faça discos pequenos: vira “comidinha que dá certo” sem virar projeto.',
      }
    }
  }

  // fallback responsável (quando pantry vem muito genérico)
  return {
    title: 'Lanchinho simples e seguro',
    time: `${slot} min`,
    yield: '1 porção',
    ingredients: [
      'Escolha 1 item principal do que você escreveu',
      'Complete com 1 item que você já costuma usar em casa (ex.: fruta, iogurte natural, arroz pronto, legume cozido)',
      'Água para acompanhar',
    ],
    steps: [
      'Monte o prato com porções pequenas.',
      'Evite misturar muita coisa: simples costuma funcionar melhor.',
      'Se a criança não quiser, tudo bem: guarde e tente de novo depois.',
    ],
    note: 'Se você escrever 2 ou 3 itens (ex.: “ovo, arroz, cenoura”), eu monto uma receita mais específica.',
  }
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

export async function POST(req: Request) {
  const t0 = Date.now()

  try {
    const body = (await req.json()) as Body

    const slot = clampSlot(body?.slot)
    const mood = clampMood(body?.mood)

    // FIX do build: nunca passar undefined
    const pantry = sanitizePantry(body?.pantry ?? '')

    try {
      track('meu_dia_leve.recipe.request', {
        slot,
        mood,
        pantryLen: pantry.length,
        mode: 'deterministic',
      })
    } catch {}

    if (!pantry) {
      return NextResponse.json({ ok: false, error: 'empty_pantry' }, { status: 200 })
    }

    const items = splitItems(pantry)
    const recipe = pickRecipe(items, slot)
    const text = formatRecipeText(recipe)

    const latencyMs = Date.now() - t0
    try {
      track('meu_dia_leve.recipe.response', { ok: true, latencyMs })
    } catch {}

    return NextResponse.json({ ok: true, text }, { status: 200 })
  } catch (e) {
    const latencyMs = Date.now() - t0
    try {
      track('meu_dia_leve.recipe.response', { ok: false, latencyMs })
    } catch {}

    return NextResponse.json({ ok: false, error: 'route_error' }, { status: 200 })
  }
}
