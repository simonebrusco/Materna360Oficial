import { NextResponse } from 'next/server'
import { isAiEnabled } from '@/app/lib/ai/aiFlags'
import { track } from '@/app/lib/telemetry'

export const dynamic = 'force-dynamic'

type Slot = '3' | '5' | '10'
type Mood = 'no-limite' | 'corrida' | 'ok' | 'leve'

type Body = {
  slot?: Slot
  mood?: Mood
  pantry?: string
}

function sanitizePantry(input?: string) {
  return String(input ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 240)
}

function clampSlot(slot: unknown): Slot {
  return slot === '3' || slot === '5' || slot === '10' ? slot : '5'
}

function clampMood(mood: unknown): Mood {
  return mood === 'no-limite' || mood === 'corrida' || mood === 'ok' || mood === 'leve' ? mood : 'corrida'
}

function hasAny(text: string, words: string[]) {
  const t = text.toLowerCase()
  return words.some((w) => t.includes(w))
}

function normalizeList(raw: string) {
  // split leve por vírgula / ponto e vírgula / quebra de linha
  const parts = raw
    .split(/[,;\n]/g)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 12)

  // remove duplicados simples
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of parts) {
    const k = p.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(p)
  }
  return out
}

type Recipe = {
  title: string
  time: string
  yields: string
  ingredients: string[]
  steps: string[]
  note?: string
  variations?: string[]
}

function formatRecipe(r: Recipe) {
  const lines: string[] = []
  lines.push(r.title)
  lines.push(`Tempo: ${r.time} • Rende: ${r.yields}`)
  lines.push('')
  lines.push('Ingredientes:')
  for (const it of r.ingredients) lines.push(`• ${it}`)
  lines.push('')
  lines.push('Modo de preparo:')
  r.steps.forEach((s, idx) => lines.push(`${idx + 1}) ${s}`))

  if (r.variations && r.variations.length) {
    lines.push('')
    lines.push('Variações (se você tiver):')
    r.variations.forEach((v) => lines.push(`• ${v}`))
  }

  if (r.note) {
    lines.push('')
    lines.push(r.note)
  }

  return lines.join('\n')
}

/**
 * P26 — gerador determinístico (IA limitada por famílias de ação)
 * Objetivo: uma receita “de verdade”, simples e segura, sem discurso.
 * Importante: não prescrever saúde; só sugestão prática.
 */
function buildRecipeText(input: { slot: Slot; pantryRaw: string }) {
  const pantryRaw = input.pantryRaw
  const pantryList = normalizeList(pantryRaw)
  const pantryLower = pantryRaw.toLowerCase()

  const hasBanana = pantryLower.includes('banana')
  const hasEgg = hasAny(pantryLower, ['ovo', 'ovos'])
  const hasOats = hasAny(pantryLower, ['aveia'])
  const hasYogurt = hasAny(pantryLower, ['iogurte', 'yogurt'])
  const hasMilk = hasAny(pantryLower, ['leite'])
  const hasFlour = hasAny(pantryLower, ['farinha'])
  const hasCheese = hasAny(pantryLower, ['queijo'])
  const hasBread = hasAny(pantryLower, ['pão', 'pao'])
  const hasApple = pantryLower.includes('maç') || pantryLower.includes('mac')
  const hasCinnamon = hasAny(pantryLower, ['canela'])
  const hasCocoa = hasAny(pantryLower, ['cacau', 'chocolate', 'achocolatado'])

  // Preferência de densidade conforme tempo:
  // 3 min = montar / amassar
  // 5 min = misturar e ir
  // 10 min = panela/frigideira rápido
  const slot = input.slot

  // Caso especial: banana — precisa virar receita com banana, não “template”
  if (hasBanana) {
    // 3 min: creme de banana (amassado) / bowl com iogurte se tiver
    if (slot === '3') {
      const r: Recipe = {
        title: 'Creme rápido de banana (para criança)',
        time: '3 min',
        yields: '1 porção',
        ingredients: [
          '1 banana madura',
          hasYogurt ? '2 a 4 colheres de iogurte natural (opcional)' : '1 colher de água ou leite (opcional, só para ajustar)',
          hasOats ? '1 colher de aveia (opcional)' : '1 colher de fruta picada (opcional)',
        ],
        steps: [
          'Amasse a banana com um garfo até virar um creme.',
          hasYogurt ? 'Misture o iogurte até ficar bem lisinho.' : 'Se quiser mais cremoso, pingue um pouco de água/leite e misture.',
          hasOats ? 'Finalize com aveia por cima e sirva.' : 'Sirva na hora. Pronto.',
        ],
        variations: [
          hasCinnamon ? '1 pitadinha de canela por cima.' : 'Um pedacinho de maçã picada, se você tiver.',
          hasCocoa ? '1 colherzinha de cacau (se for algo que você já usa em casa).' : 'Um fiozinho de mel apenas se a criança já consome (opcional).',
        ].filter(Boolean),
        note: 'Se não der agora, você pode guardar a banana amassada por pouco tempo na geladeira e finalizar depois.',
      }
      return formatRecipe(r)
    }

    // 5 min: bowl + complemento OU “banana amassada com aveia” mais estruturado
    if (slot === '5') {
      // Se tiver iogurte: bowl completo
      if (hasYogurt) {
        const r: Recipe = {
          title: 'Bowl de banana com iogurte (para criança)',
          time: '5 min',
          yields: '1 porção',
          ingredients: [
            '1 banana madura',
            '1 potinho (ou 3 a 5 colheres) de iogurte natural',
            hasOats ? '1 a 2 colheres de aveia' : '1 colher de um crocante que você já usa (opcional)',
          ],
          steps: [
            'Amasse a banana (ou pique em rodelas).',
            'Coloque o iogurte em um potinho e misture a banana.',
            hasOats ? 'Finalize com aveia e sirva.' : 'Finalize do jeito mais simples e sirva.',
          ],
          variations: [
            hasApple ? 'Misture maçã bem picadinha.' : 'Use outra fruta que você já tenha.',
            hasCinnamon ? '1 pitadinha de canela por cima.' : 'Um toque de limão (bem pouquinho), se você costuma usar.',
          ].filter(Boolean),
        }
        return formatRecipe(r)
      }

      // Sem iogurte: banana + aveia (tipo “mingau frio” simples)
      const r: Recipe = {
        title: 'Banana amassada com aveia (para criança)',
        time: '5 min',
        yields: '1 porção',
        ingredients: [
          '1 banana madura',
          hasOats ? '2 colheres de aveia' : '1 colher de algo simples para dar textura (opcional)',
          hasMilk ? '1 a 3 colheres de leite (opcional, só para ajustar)' : '1 a 2 colheres de água (opcional, só para ajustar)',
        ],
        steps: [
          'Amasse a banana com um garfo.',
          hasOats ? 'Misture a aveia até ficar homogêneo.' : 'Misture até ficar bem lisinho.',
          'Se quiser mais macio, adicione um pouquinho de líquido e misture. Sirva.',
        ],
        variations: [
          hasCinnamon ? '1 pitadinha de canela.' : 'Uma fruta picada por cima, se tiver.',
          hasCocoa ? '1 colherzinha de cacau (se você já usa).' : 'Um pouco de pasta de amendoim (se a criança já consome e você tiver).',
        ].filter(Boolean),
      }
      return formatRecipe(r)
    }

    // 10 min: panqueca de banana (se tiver ovo/aveia/farinha)
    // Se não tiver ovo, cai para “bolinho de frigideira” com farinha+leite (ainda simples)
    if (hasEgg) {
      const r: Recipe = {
        title: 'Panqueca de banana (para criança)',
        time: '10 min',
        yields: '1 a 2 porções',
        ingredients: [
          '1 banana madura amassada',
          '1 ovo',
          hasOats ? '2 colheres de aveia' : hasFlour ? '2 colheres de farinha' : '2 colheres de aveia ou farinha (se tiver)',
          '1 fio de óleo/azeite para untar a frigideira',
        ],
        steps: [
          'Amasse a banana e misture com o ovo.',
          'Adicione aveia/farinha e misture até virar uma massa grossinha.',
          'Aqueça uma frigideira antiaderente, unte bem de leve.',
          'Coloque porções pequenas, doure dos dois lados e sirva.',
        ],
        variations: [
          hasCinnamon ? '1 pitadinha de canela na massa.' : 'Finalize com fruta por cima.',
          hasYogurt ? 'Sirva com uma colher de iogurte por cima.' : 'Sirva do jeito simples mesmo: já resolve.',
        ].filter(Boolean),
      }
      return formatRecipe(r)
    }

    // 10 min sem ovo: “tostex” de banana (se tiver pão) ou banana assada rápida (micro)
    if (hasBread) {
      const r: Recipe = {
        title: 'Torradinha de banana (para criança)',
        time: '10 min',
        yields: '1 porção',
        ingredients: [
          '1 banana madura',
          '1 a 2 fatias de pão',
          hasCheese ? '1 fatia fina de queijo (opcional)' : '1 colher de iogurte (opcional)',
          '1 fio de óleo/azeite para aquecer a frigideira (bem pouco)',
        ],
        steps: [
          'Amasse a banana e espalhe sobre o pão.',
          hasCheese ? 'Se quiser, coloque uma fatia fina de queijo por cima.' : 'Se quiser, finalize com uma colher de iogurte depois.',
          'Aqueça na frigideira (ou sanduicheira) até ficar morninho e firme. Sirva.',
        ],
        variations: [
          hasCinnamon ? 'Canela por cima (bem pouquinho).' : 'Finalize com fruta picadinha.',
        ].filter(Boolean),
      }
      return formatRecipe(r)
    }

    // fallback banana (ainda bem estruturado)
    const r: Recipe = {
      title: 'Banana amassada “pronta para servir” (para criança)',
      time: slot === '10' ? '10 min' : '5 min',
      yields: '1 porção',
      ingredients: ['1 banana madura', '1 colher de algo que você tiver para complementar (opcional)'],
      steps: ['Amasse a banana.', 'Se tiver algo simples para complementar, misture ou coloque por cima.', 'Sirva.'],
      note: 'Se quiser, escreva mais 1 ingrediente além de “banana” para eu montar uma receita ainda mais específica.',
    }
    return formatRecipe(r)
  }

  // Sem banana: mantém receita estruturada genérica (mas real), sem improviso narrado
  // Usa a lista do que a pessoa digitou como “base” e organiza um plano simples
  const base: Recipe = {
    title: 'Receita simples com o que você tem (para criança)',
    time: slot === '3' ? '3 min' : slot === '10' ? '10 min' : '5 min',
    yields: '1 porção',
    ingredients: pantryList.length ? pantryList.map((x) => x) : ['O que estiver mais fácil agora'],
    steps:
      slot === '3'
        ? ['Separe 2 itens da sua lista.', 'Monte do jeito mais simples.', 'Sirva e pronto.']
        : slot === '10'
          ? [
              'Escolha 1 base da sua lista.',
              'Acrescente 1 complemento.',
              'Aqueça ou misture (uma coisa só), finalize e sirva.',
              'Se sobrar, guarde para mais tarde.',
            ]
          : ['Escolha 1 base da sua lista.', 'Acrescente 1 complemento.', 'Monte, aqueça OU misture (uma coisa só). Sirva.'],
    note: 'Se quiser uma receita mais específica, escreva 2 ou 3 itens (ex.: “ovo, arroz, legumes”).',
  }

  return formatRecipe(base)
}

export async function POST(req: Request) {
  const t0 = Date.now()

  try {
    const body = (await req.json()) as Body

    const slot = clampSlot(body?.slot)
    const mood = clampMood(body?.mood)
    const pantryRaw = sanitizePantry(body?.pantry)

    try {
      track('ai.request', {
        feature: 'meu_dia_leve_receita',
        slot,
        mood,
        pantryLen: pantryRaw.length,
        enabled: isAiEnabled(),
      })
    } catch {}

    if (!pantryRaw) {
      return NextResponse.json({ ok: false, error: 'missing_pantry' }, { status: 200 })
    }

    const text = buildRecipeText({ slot, pantryRaw })

    try {
      track('ai.response', {
        feature: 'meu_dia_leve_receita',
        ok: true,
        latencyMs: Date.now() - t0,
        mode: isAiEnabled() ? 'progressive' : 'fallback',
      })
    } catch {}

    return NextResponse.json({ ok: true, text }, { status: 200 })
  } catch {
    // fallback de emergência: ainda estruturado
    return NextResponse.json(
      {
        ok: true,
        text: [
          'Receita simples (para criança)',
          'Tempo: 5 min • Rende: 1 porção',
          '',
          'Ingredientes:',
          '• o que estiver mais fácil agora',
          '',
          'Modo de preparo:',
          '1) Escolha 1 base simples.',
          '2) Acrescente 1 complemento.',
          '3) Sirva e pronto.',
        ].join('\n'),
      },
      { status: 200 },
    )
  }
}
