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

/**
 * P26 — Receitas para criança (sem discurso nutricional)
 * Saída: receita curta, completa, com modo de fazer.
 * - Sem “modo corrida”, sem narrar estado, sem justificar.
 * - Sem cardápio ideal.
 * - Linguagem gentil e objetiva.
 */
function buildRecipeText(input: { slot: Slot; pantry: string }) {
  const pantry = input.pantry

  // Ajuste de densidade pelo tempo (não é “nutrição”, é execução)
  const steps =
    input.slot === '3'
      ? ['1) Separe 2 itens da sua lista.', '2) Monte do jeito mais simples.', '3) Sirva e pronto.']
      : input.slot === '10'
        ? [
            '1) Escolha 1 base da sua lista (ex.: arroz, pão, macarrão, iogurte).',
            '2) Acrescente 1 complemento (ex.: ovo, queijo, frango, fruta, legumes).',
            '3) Finalize rápido (azeite/limão/um temperinho que você já usa) e sirva.',
            '4) Se sobrar, guarda para mais tarde.',
          ]
        : [
            '1) Escolha 1 base da sua lista (ex.: pão, arroz, massa, iogurte).',
            '2) Acrescente 1 complemento (ex.: ovo, queijo, frango, fruta, legumes).',
            '3) Monte, aqueça OU misture — só uma coisa. Sirva.',
          ]

  // Receita “template” que usa o que a pessoa tem em casa (sem inventar cardápio)
  return [
    'Receita rápida para criança',
    '',
    `Você vai usar: ${pantry}.`,
    '',
    'Modo de fazer:',
    ...steps,
    '',
    'Se não der agora:',
    'Escolha uma das receitas rápidas abaixo e encerre por aqui.',
  ].join('\n')
}

export async function POST(req: Request) {
  const t0 = Date.now()

  try {
    const body = (await req.json()) as Body

    const slot = clampSlot(body?.slot)
    const mood = clampMood(body?.mood)
    const pantry = sanitizePantry(body?.pantry)

    try {
      track('ai.request', {
        feature: 'meu_dia_leve_receita',
        slot,
        mood,
        pantryLen: pantry.length,
        enabled: isAiEnabled(),
      })
    } catch {}

    if (!pantry) {
      return NextResponse.json({ ok: false, error: 'missing_pantry' }, { status: 200 })
    }

    const text = buildRecipeText({ slot, pantry })

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
    return NextResponse.json(
      {
        ok: true,
        text: [
          'Receita rápida para criança',
          '',
          'Você vai usar: o que estiver mais fácil agora.',
          '',
          'Modo de fazer:',
          '1) Escolha 1 base simples.',
          '2) Acrescente 1 complemento.',
          '3) Sirva e pronto.',
        ].join('\n'),
      },
      { status: 200 },
    )
  }
}
