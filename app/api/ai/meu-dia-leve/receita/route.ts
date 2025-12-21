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
  childAgeMonths?: number | null
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

function clampAgeMonths(n: unknown): number | null {
  if (n === null || n === undefined) return null
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return null
  // faixa segura; não queremos valores absurdos
  if (v < 0) return null
  if (v > 216) return 216
  return Math.floor(v)
}

function normalizeList(raw: string) {
  const parts = raw
    .split(/[,;\n]/g)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 12)

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
  tips?: string[]
}

function formatRecipe(r: Recipe) {
  const lines: string[] = []
  lines.push(r.title)
  lines.push(`Tempo: ${r.time} • Rende: ${r.yields}`)
  lines.push('')
  lines.push('Ingredientes:')
  r.ingredients.forEach((it) => lines.push(`• ${it}`))
  lines.push('')
  lines.push('Modo de preparo:')
  r.steps.forEach((s, idx) => lines.push(`${idx + 1}) ${s}`))

  if (r.tips && r.tips.length) {
    lines.push('')
    lines.push('Dicas (opcional):')
    r.tips.forEach((t) => lines.push(`• ${t}`))
  }

  if (r.note) {
    lines.push('')
    lines.push(r.note)
  }

  return lines.join('\n')
}

/**
 * P26 — guardrail por idade (responsabilidade)
 * - Sem idade: bloqueia
 * - < 6 meses: bloqueia + aleitamento
 * - 6–11 meses: bloqueia + orientar pediatra (introdução alimentar)
 * - >= 12 meses: libera receita simples e saudável
 */
function buildAgeGate(ageMonths: number | null) {
  if (ageMonths === null) {
    return {
      blocked: true as const,
      title: 'Antes de gerar receita',
      text:
        'Para eu sugerir uma receita com segurança, preciso da idade da criança no Eu360.\n\n' +
        'Assim eu só mostro o que faz sentido para a fase — sem risco e sem improviso.',
    }
  }

  if (ageMonths < 6) {
    return {
      blocked: true as const,
      title: 'Para bebês com menos de 6 meses',
      text:
        'Aqui o Materna não sugere receitas.\n\n' +
        'Nessa fase, a orientação costuma ser manter o leite (materno ou fórmula) como base.\n' +
        'Se você estiver em dúvida, vale alinhar com o pediatra.',
    }
  }

  if (ageMonths >= 6 && ageMonths < 12) {
    return {
      blocked: true as const,
      title: 'Para a fase de 6 a 11 meses',
      text:
        'Aqui o Materna não gera receitas prontas.\n\n' +
        'Essa é a fase de introdução alimentar, que costuma ser individual.\n' +
        'O mais seguro é alinhar com o pediatra (ou nutricionista infantil) sobre o que entra e como entra.',
    }
  }

  return { blocked: false as const }
}

/**
 * Geração determinística e “responsável”:
 * - sempre retorna uma receita concreta (não “template”),
 * - sem itens polêmicos (mel, pasta de amendoim, etc.),
 * - linguagem objetiva e cuidadosa.
 */
function buildRecipeText(input: { slot: Slot; pantryRaw: string }) {
  const pantryRaw = input.pantryRaw
  const pantryList = normalizeList(pantryRaw)
  const t = pantryRaw.toLowerCase()
  const slot = input.slot

  const hasBanana = t.includes('banana')
  const hasEgg = t.includes('ovo') || t.includes('ovos')
  const hasOats = t.includes('aveia')
  const hasYogurt = t.includes('iogurte') || t.includes('yogurt')
  const hasMilk = t.includes('leite')
  const hasFlour = t.includes('farinha')
  const hasCheese = t.includes('queijo')
  const hasBread = t.includes('pão') || t.includes('pao')
  const hasApple = t.includes('maç') || t.includes('mac')
  const hasCinnamon = t.includes('canela')
  const hasCocoa = t.includes('cacau')

  // 1) CASO: APENAS OVO (ou ovo é o principal) → sempre entregar algo real
  if (hasEgg && pantryList.length <= 2) {
    const r: Recipe = {
      title: 'Ovo mexido cremoso (para criança)',
      time: slot === '10' ? '10 min' : slot === '3' ? '5 min' : '5 min',
      yields: '1 porção',
      ingredients: [
        '1 ovo',
        hasMilk ? '1 colher de leite (opcional)' : '1 colher de água (opcional)',
        '1 pitadinha de sal (opcional)',
        '1 fio de azeite ou um pouquinho de manteiga para untar',
      ],
      steps: [
        'Quebre o ovo em um potinho e bata com um garfo.',
        hasMilk ? 'Se quiser mais macio, misture 1 colher de leite.' : 'Se quiser mais macio, misture 1 colher de água.',
        'Aqueça uma frigideira antiaderente em fogo baixo e unte bem de leve.',
        'Coloque o ovo e mexa devagar até ficar cozido e cremoso. Sirva.',
      ],
      tips: [
        'Se você tiver legumes cozidos já prontos, pode misturar um pouquinho no final.',
        'Se a criança preferir, dá para fazer em formato de omeletinho pequeno.',
      ],
    }
    return formatRecipe(r)
  }

  // 2) CASO: BANANA → receita concreta e segura (sem pasta de amendoim / sem mel)
  if (hasBanana) {
    if (slot === '3') {
      const r: Recipe = {
        title: 'Creme de banana bem simples (para criança)',
        time: '3 min',
        yields: '1 porção',
        ingredients: [
          '1 banana madura',
          hasYogurt ? '2 a 4 colheres de iogurte natural (opcional)' : hasMilk ? '1 a 2 colheres de leite (opcional)' : '1 a 2 colheres de água (opcional)',
          hasOats ? '1 colher de aveia (opcional)' : '—',
        ].filter((x) => x !== '—'),
        steps: [
          'Amasse a banana com um garfo até virar um creme.',
          hasYogurt
            ? 'Misture o iogurte e sirva.'
            : hasMilk
              ? 'Se quiser mais cremoso, pingue um pouco de leite e misture. Sirva.'
              : 'Se quiser mais cremoso, pingue um pouco de água e misture. Sirva.',
          hasOats ? 'Se tiver aveia, finalize com uma colher por cima.' : 'Pronto.',
        ],
        tips: [
          hasApple ? 'Se tiver maçã bem picadinha, dá para misturar um pouco.' : 'Se você tiver outra fruta macia, pode combinar.',
          hasCinnamon ? 'Uma pitadinha de canela pode entrar, se você já usa em casa.' : '—',
        ].filter((x) => x !== '—'),
      }
      return formatRecipe(r)
    }

    // 5 min: bowl com iogurte ou banana + aveia
    if (slot === '5') {
      if (hasYogurt) {
        const r: Recipe = {
          title: 'Bowl de banana com iogurte (para criança)',
          time: '5 min',
          yields: '1 porção',
          ingredients: ['1 banana madura', '3 a 5 colheres de iogurte natural', hasOats ? '1 colher de aveia (opcional)' : '—'].filter(
            (x) => x !== '—',
          ),
          steps: [
            'Amasse a banana (ou pique em rodelas).',
            'Misture com o iogurte.',
            hasOats ? 'Finalize com aveia e sirva.' : 'Sirva.',
          ],
          tips: [
            hasApple ? 'Maçã bem picadinha funciona muito bem aqui.' : 'Se tiver fruta, pode colocar por cima.',
            hasCinnamon ? 'Canela (bem pouquinho), se você já usa.' : '—',
          ].filter((x) => x !== '—'),
        }
        return formatRecipe(r)
      }

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
          hasOats ? 'Misture a aveia até ficar homogêneo.' : 'Misture até ficar uniforme.',
          'Se quiser mais macio, adicione um pouquinho de líquido e misture. Sirva.',
        ],
        tips: [
          hasCocoa ? 'Se você já usa cacau em casa, 1 toque pequeno pode entrar.' : '—',
          hasCinnamon ? 'Uma pitadinha de canela (se você já usa).' : '—',
        ].filter((x) => x !== '—'),
      }
      return formatRecipe(r)
    }

    // 10 min: panqueca de banana (se tiver ovo)
    if (slot === '10' && hasEgg) {
      const base = hasOats ? '2 colheres de aveia' : hasFlour ? '2 colheres de farinha' : '2 colheres de aveia ou farinha (se tiver)'
      const r: Recipe = {
        title: 'Panquequinha de banana (para criança)',
        time: '10 min',
        yields: '1 a 2 porções',
        ingredients: ['1 banana madura amassada', '1 ovo', base, '1 fio de óleo/azeite para untar a frigideira'],
        steps: [
          'Misture a banana amassada com o ovo.',
          'Adicione a aveia/farinha e mexa até virar uma massa grossinha.',
          'Aqueça uma frigideira antiaderente e unte bem de leve.',
          'Faça panquequinhas pequenas, doure dos dois lados e sirva.',
        ],
        tips: [
          hasYogurt ? 'Se tiver iogurte, dá para servir com uma colher por cima.' : 'Sirva do jeito mais simples mesmo.',
        ],
      }
      return formatRecipe(r)
    }

    // fallback banana estruturado
    const r: Recipe = {
      title: 'Banana bem simples (para criança)',
      time: slot === '10' ? '10 min' : '5 min',
      yields: '1 porção',
      ingredients: ['1 banana madura'],
      steps: ['Amasse a banana.', 'Sirva.'],
      note: 'Se você escrever mais 1 ou 2 itens além de “banana”, eu monto uma receita mais completa com o que você tem.',
    }
    return formatRecipe(r)
  }

  // 3) CASO: pão + queijo → tostex simples
  if (hasBread && hasCheese) {
    const r: Recipe = {
      title: 'Pão com queijo na frigideira (para criança)',
      time: slot === '10' ? '10 min' : '5 min',
      yields: '1 porção',
      ingredients: ['1 a 2 fatias de pão', '1 fatia fina de queijo', '1 fio de azeite ou um pouquinho de manteiga para dourar'],
      steps: ['Monte o pão com queijo.', 'Aqueça na frigideira em fogo baixo até dourar por fora e aquecer por dentro.', 'Sirva.'],
      tips: ['Se tiver tomate bem picadinho ou fruta do lado, pode acompanhar.'],
    }
    return formatRecipe(r)
  }

  // 4) fallback: ainda concreto, mas pede mais itens se vier muito pouco
  const fewItems = pantryList.length <= 1
  const r: Recipe = {
    title: 'Receita simples com o que você tem (para criança)',
    time: slot === '3' ? '3 min' : slot === '10' ? '10 min' : '5 min',
    yields: '1 porção',
    ingredients: pantryList.length ? pantryList : ['O que estiver mais fácil agora'],
    steps: [
      'Escolha 1 item da sua lista como base.',
      'Se tiver mais 1 item, use como complemento.',
      'Monte, aqueça OU misture (uma coisa só). Sirva.',
    ],
    note: fewItems
      ? 'Se você escrever 2 ou 3 itens (ex.: “ovo, arroz, legumes”), eu monto uma receita bem mais específica.'
      : undefined,
  }
  return formatRecipe(r)
}

export async function POST(req: Request) {
  const t0 = Date.now()

  try {
    const body = (await req.json()) as Body

    const slot = clampSlot(body?.slot)
    const mood = clampMood(body?.mood)
    const pantryRaw = sanitizePantry(body?.pantry)
    const ageMonths = clampAgeMonths(body?.childAgeMonths)

    try {
      track('ai.request', {
        feature: 'meu_dia_leve_receita',
        slot,
        mood,
        pantryLen: pantryRaw.length,
        ageMonths: ageMonths ?? 'unknown',
        enabled: isAiEnabled(),
      })
    } catch {}

    // Guardrail de idade (P26)
    const gate = buildAgeGate(ageMonths)
    if (gate.blocked) {
      return NextResponse.json(
        {
          ok: false,
          blocked: true,
          reason: ageMonths === null ? 'missing_age' : ageMonths < 6 ? 'lt_6m' : '6_to_11m',
          title: gate.title,
          text: gate.text,
        },
        { status: 200 },
      )
    }

    if (!pantryRaw) {
      return NextResponse.json({ ok: false, blocked: false, error: 'missing_pantry' }, { status: 200 })
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

    return NextResponse.json({ ok: true, blocked: false, text }, { status: 200 })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        blocked: true,
        reason: 'fallback',
        title: 'Não deu certo agora',
        text: 'Se quiser, tente de novo em alguns instantes.',
      },
      { status: 200 },
    )
  }
}
