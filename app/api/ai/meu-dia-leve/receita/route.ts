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

function sanitizePantry(input: string) {
  return String(input ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 160)
}

function clampSlot(slot: unknown): Slot {
  return slot === '3' || slot === '5' || slot === '10' ? slot : '5'
}

function clampMood(mood: unknown): Mood {
  return mood === 'no-limite' || mood === 'corrida' || mood === 'ok' || mood === 'leve'
    ? mood
    : 'corrida'
}

/**
 * P26 — Linguagem silenciosa
 * - Sem explicar
 * - Sem ensinar
 * - Sem narrar decisão
 * - Só ação possível
 */
function buildSilentRecipeText(input: { slot: Slot; pantry: string }) {
  const base = `Com ${input.pantry}, faz assim:`

  if (input.slot === '3') {
    return [
      base,
      '',
      '• Combine com algo que já esteja pronto.',
      '• Monte e sirva.',
    ].join('\n')
  }

  if (input.slot === '10') {
    return [
      base,
      '',
      '• Escolha uma base simples.',
      '• Acrescente o que tiver.',
      '• Finalize do jeito mais fácil.',
    ].join('\n')
  }

  // default 5 min
  return [
    base,
    '',
    '• Use uma base simples.',
    '• Acrescente o que você listou.',
    '• Sirva sem complicar.',
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

    const text = buildSilentRecipeText({ slot, pantry })

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
          'Use o que estiver pronto.',
          'Acrescente algo simples.',
          'Sirva e siga.',
        ].join('\n'),
      },
      { status: 200 },
    )
  }
}
