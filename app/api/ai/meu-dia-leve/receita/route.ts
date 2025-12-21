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
  intent?: string
}

function sanitizePantry(input: string) {
  const raw = String(input ?? '').trim()
  if (!raw) return ''
  // remove duplicações de espaço e limita tamanho para não vazar conteúdo longo
  return raw.replace(/\s+/g, ' ').slice(0, 220)
}

function clampSlot(slot: unknown): Slot {
  return slot === '3' || slot === '5' || slot === '10' ? slot : '5'
}

function clampMood(mood: unknown): Mood {
  return mood === 'no-limite' || mood === 'corrida' || mood === 'ok' || mood === 'leve' ? mood : 'corrida'
}

function pickOne<T>(arr: T[], seed: number): T {
  if (arr.length === 0) throw new Error('empty_array')
  const idx = Math.abs(seed) % arr.length
  return arr[idx]
}

function seedFromText(text: string) {
  // seed simples e determinístico
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return h
}

function buildDirectRecipeText(input: { slot: Slot; mood: Mood; pantry: string }) {
  const seed = seedFromText(`${input.slot}|${input.mood}|${input.pantry}`)

  // Linguagem: direta, sem tom nutricional, sem “o ideal”.
  const openers = [
    'Solução direta para agora:',
    'Para resolver agora:',
    'Hoje, vai assim:',
    'Sem complicar:',
  ]

  const steps3 = [
    `Escolha 1 base + 1 complemento do que você listou (${input.pantry}).`,
    'Monte em 2 etapas: (1) algo que sustenta, (2) algo que dá “cara de comida”.',
    'Finalize com o que for mais fácil (sal, azeite, limão, manteiga, ervas).',
  ]

  const steps5 = [
    `Use o que você já tem (${input.pantry}) e escolha 1 coisa para “amarrar” (pão, arroz pronto, massa, ovo, iogurte).`,
    'Faça 1 preparo só: mexer, aquecer ou montar. Não os três.',
    'Sirva do jeito mais simples possível. Resolve e segue.',
  ]

  const steps10 = [
    `Com o que você tem (${input.pantry}), escolha 1 base + 1 proteína/“recheio” + 1 extra (se der).`,
    'Aqueça/prepare a base primeiro, depois entra o resto junto.',
    'Se quiser “cara de pronto”: finalize com algo crocante/ácido (torrada, limão) ou cremoso (queijo/iogurte).',
  ]

  const moodLines: Record<Mood, string> = {
    'no-limite': 'Modo no limite: mínimo viável e pronto.',
    corrida: 'Modo corrida: uma decisão e execução.',
    ok: 'Modo ok: simples e suficiente.',
    leve: 'Modo leve: capricho pequeno, sem aumentar trabalho.',
  }

  const closerOptions = [
    'Se travar, simplifique mais: “montagem” vale.',
    'Se não for para agora, escolha uma das receitas rápidas do app e encerre.',
    'O objetivo é resolver, não performar.',
  ]

  const opener = pickOne(openers, seed)
  const closer = pickOne(closerOptions, seed + 7)
  const moodLine = moodLines[input.mood]

  const steps = input.slot === '3' ? steps3 : input.slot === '10' ? steps10 : steps5

  // Formato em linhas curtas (boa leitura no card)
  return [
    `${opener}`,
    moodLine,
    '',
    `1) ${steps[0]}`,
    `2) ${steps[1]}`,
    `3) ${steps[2]}`,
    '',
    closer,
  ].join('\n')
}

export async function POST(req: Request) {
  const t0 = Date.now()

  try {
    const body = (await req.json()) as Body

    const slot = clampSlot(body?.slot)
    const mood = clampMood(body?.mood)
    const pantry = sanitizePantry(body?.pantry ?? '')

    // Telemetria mínima (sem conteúdo sensível)
    try {
      track('ai.request', {
        feature: 'meu_dia_leve_receita',
        origin: 'meu-dia-leve',
        enabled: isAiEnabled(),
        slot,
        mood,
        pantryLen: pantry.length,
      })
    } catch {}

    if (!pantry) {
      const latencyMs = Date.now() - t0
      try {
        track('ai.response', {
          feature: 'meu_dia_leve_receita',
          origin: 'meu-dia-leve',
          ok: false,
          latencyMs,
          mode: isAiEnabled() ? 'progressive' : 'fallback',
          error: 'missing_pantry',
        })
      } catch {}

      // nunca quebra UI: devolve erro controlado
      return NextResponse.json({ ok: false, error: 'missing_pantry' }, { status: 200 })
    }

    /**
     * P26 — IA limitada por família de ação
     * Aqui a “IA” pode ser:
     * - progressive (quando isAiEnabled = true) OU
     * - fallback determinístico (quando desligado)
     *
     * Importante: em ambos os modos, o resultado:
     * - é direto
     * - não é discurso nutricional
     * - não cria cardápio/ideal
     */
    const text = buildDirectRecipeText({ slot, mood, pantry })

    const latencyMs = Date.now() - t0
    try {
      track('ai.response', {
        feature: 'meu_dia_leve_receita',
        origin: 'meu-dia-leve',
        ok: true,
        latencyMs,
        mode: isAiEnabled() ? 'progressive' : 'fallback',
      })
    } catch {}

    return NextResponse.json({ ok: true, text }, { status: 200 })
  } catch (e) {
    const latencyMs = Date.now() - t0
    try {
      track('ai.response', {
        feature: 'meu_dia_leve_receita',
        origin: 'meu-dia-leve',
        ok: false,
        latencyMs,
        error: 'exception',
      })
    } catch {}

    // fallback de emergência (nunca quebra UI)
    return NextResponse.json(
      {
        ok: true,
        text: [
          'Hoje, vai no simples:',
          '',
          '1) Escolha uma base (pão, arroz pronto, massa, ovo, iogurte).',
          '2) Adicione o que tiver (queijo, frango, legumes, fruta).',
          '3) Finalize do jeito mais rápido possível.',
          '',
          'Objetivo: resolver e seguir.',
        ].join('\n'),
      },
      { status: 200 },
    )
  }
}
