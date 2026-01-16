import { NextResponse } from 'next/server'
import { callMaternaAI } from '@/app/lib/ai/maternaCore'
import { getProfileSnapshot } from '@/app/lib/profile.server'
import type { RotinaQuickSuggestion } from '@/app/lib/ai/types'
import { NO_STORE_HEADERS } from '@/app/lib/http'

function clampText(text: string, max: number) {
  const t = text.trim()
  return t.length > max ? t.slice(0, max).trim() : t
}

function countSentences(text: string) {
  return text.split(/[.!?]+/).filter(Boolean).length
}

/* =========================
   Helper — eixo explícito
========================= */
function axisMatchesBloco1(axis: string, text: string) {
  const t = text.toLowerCase()

  const map: Record<string, string[]> = {
    observacao: ['observar', 'perceber', 'olhar', 'notar', 'escutar'],
    micro_missao: ['escolher', 'procurar', 'achar', 'encontrar'],
    corpo_movimento: ['pular', 'alongar', 'movimento', 'esticar', 'dançar'],
    faz_de_conta: ['imaginar', 'fingir', 'brincar', 'história'],
  }

  const keys = map[axis]
  if (!keys) return true

  return keys.some((k) => t.includes(k))
}

/* =========================
   Bloco 1 — Ideias rápidas
========================= */
function sanitizeMeuFilhoBloco1(
  raw: any[],
  tempoDisponivel: number | null,
  variationAxis: string | null,
  nonce: string | null,
): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const anyFirst = first as any

  const candidate = (first.description ?? anyFirst.text ?? anyFirst.output ?? '').toString()
  const description = clampText(candidate, 280)
  if (!description) return []

  if (description.length < 1 || description.length > 280) return []

  const n = countSentences(description)
  if (n < 1 || n > 3) return []

  const forbidden = /\b(você pode|voce pode|que tal|talvez|se quiser|uma ideia)\b/i
  if (forbidden.test(description)) return []

  if (variationAxis && !axisMatchesBloco1(variationAxis, description)) return []

  const estimatedMinutes =
    typeof tempoDisponivel === 'number' && Number.isFinite(tempoDisponivel)
      ? Math.max(1, Math.round(tempoDisponivel))
      : first.estimatedMinutes ?? 0

  const sanitized: RotinaQuickSuggestion = {
    ...first,
    id: `mf_b1_${variationAxis ?? 'geral'}_${nonce ?? Date.now()}`,
    title: '',
    description,
    withChild: true,
    estimatedMinutes,
  }

  return [sanitized]
}

/* =========================
   Bloco 2
========================= */
function sanitizeMeuFilhoBloco2Suggestions(
  raw: any[],
  tempoDisponivel: number | null,
): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const candidate = first.description ?? ''
  const description = clampText(candidate, 280)
  if (!description) return []

  const estimatedMinutes =
    typeof tempoDisponivel === 'number' && Number.isFinite(tempoDisponivel)
      ? Math.max(1, Math.round(tempoDisponivel))
      : first.estimatedMinutes ?? 0

  return [
    {
      ...first,
      title: '',
      description,
      withChild: true,
      estimatedMinutes,
    },
  ]
}

/* =========================
   Bloco 3
========================= */
function sanitizeMeuFilhoBloco3(raw: any): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const candidate = first.description ?? ''
  const text = clampText(candidate, 240)
  if (!text) return []

  const low = text.toLowerCase()

  const banned = [
    'todo dia',
    'todos os dias',
    'sempre',
    'nunca',
    'crie o hábito',
    'hábito',
    'habito',
    'disciplina',
    'rotina ideal',
    'o mais importante é',
  ]
  if (banned.some((b) => low.includes(b))) return []

  if (text.includes('\n') || text.includes('•') || text.includes('- ')) return []
  if (countSentences(text) > 3) return []

  return [
    {
      ...first,
      title: '',
      description: text,
      withChild: true,
      estimatedMinutes: 0,
    },
  ]
}

/* =========================
   Bloco 4
========================= */
function sanitizeMeuFilhoBloco4(raw: any): RotinaQuickSuggestion[] {
  const first = Array.isArray(raw) ? raw[0] : null
  if (!first) return []

  const candidate = first.description ?? ''
  const text = clampText(candidate, 140)
  if (!text) return []

  if (countSentences(text) !== 1) return []
  if (text.includes('\n') || text.includes('•') || text.includes('- ')) return []

  const banned = ['deve', 'deveria', 'ideal', 'atraso', 'adiantado']
  if (banned.some((b) => text.toLowerCase().includes(b))) return []

  return [
    {
      ...first,
      title: '',
      description: text,
      withChild: true,
      estimatedMinutes: 0,
    },
  ]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const profile = await getProfileSnapshot()

    const ctx = {
      tempoDisponivel: body.tempoDisponivel ?? null,
      comQuem: body.comQuem ?? null,
      local: body.local ?? null,
      habilidades: body.habilidades ?? null,
      idade: body.idade ?? null,
      faixa_etaria: body.faixa_etaria ?? null,
      variation_axis: body.variation_axis ?? null,
    }

    const result = await callMaternaAI({
      mode: 'quick-ideas',
      profile,
      child: null,
      context: ctx,
    })

    if (body.tipoIdeia === 'meu-filho-bloco-1') {
      const sanitized = sanitizeMeuFilhoBloco1(
        result.suggestions ?? [],
        body.tempoDisponivel ?? null,
        body.variation_axis ?? null,
        body.nonce ?? null,
      )
      return NextResponse.json({ suggestions: sanitized }, { status: 200, headers: NO_STORE_HEADERS })
    }

    if (body.tipoIdeia === 'meu-filho-bloco-2') {
      const sanitized = sanitizeMeuFilhoBloco2Suggestions(
        result.suggestions ?? [],
        body.tempoDisponivel ?? null,
      )
      return NextResponse.json({ suggestions: sanitized }, { status: 200, headers: NO_STORE_HEADERS })
    }

    if (body.tipoIdeia === 'meu-filho-bloco-3') {
      return NextResponse.json(
        { suggestions: sanitizeMeuFilhoBloco3(result.suggestions ?? []) },
        { status: 200, headers: NO_STORE_HEADERS },
      )
    }

    if (body.tipoIdeia === 'meu-filho-bloco-4') {
      return NextResponse.json(
        { suggestions: sanitizeMeuFilhoBloco4(result.suggestions ?? []) },
        { status: 200, headers: NO_STORE_HEADERS },
      )
    }

    return NextResponse.json({ suggestions: [] }, { status: 200, headers: NO_STORE_HEADERS })
  } catch (e) {
    console.error('[API /api/ai/rotina] Erro ao gerar sugestões:', e)
    return NextResponse.json(
      { error: 'Não consegui gerar sugestões agora, tente novamente em instantes.' },
      { status: 500 },
    )
  }
}
