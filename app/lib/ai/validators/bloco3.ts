// app/lib/ai/validators/bloco3.ts
/**
 * Bloco 3 — Rotinas / Conexão (Meu Filho)
 * Regras:
 * - max 3 frases
 * - max 240 caracteres
 * - sem emojis
 * - sem listas (bullets / numeradas)
 * - sem linguagem de cobrança (hábito, todo dia, sempre, disciplina)
 * - sem "rotina ideal", "o mais importante é", "faça todos os dias"
 */

function strip(s: string) {
  return String(s ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim()
}

function hasListMarkers(s: string) {
  // bullets e numeração comum
  return /(^|\s)(•|●|▪|▫|◦|–|-)\s+/.test(s) || /(^|\s)\d+\.\s+/.test(s)
}

function hasEmoji(s: string) {
  // faixa unicode ampla para emojis/símbolos
  return /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(s)
}

function countSentences(s: string) {
  // conta sentenças por ., !, ? (best effort)
  const parts = s.split(/[.!?]+/).map((p) => p.trim()).filter(Boolean)
  return parts.length
}

function hasBannedCoaching(s: string) {
  const low = s.toLowerCase()

  const banned = [
    'todo dia',
    'todos os dias',
    'sempre',
    'crie o hábito',
    'criar o hábito',
    'hábito',
    'disciplina',
    'rotina ideal',
    'o mais importante é',
    'faça sempre',
    'faça diariamente',
    'precisa',
    'deve',
  ]

  return banned.some((b) => low.includes(b))
}

export function safeMeuFilhoBloco3Text(raw: unknown): string | null {
  const s = strip(String(raw ?? ''))
  if (!s) return null

  if (s.length > 240) return null
  if (hasEmoji(s)) return null
  if (hasListMarkers(s)) return null
  if (countSentences(s) > 3) return null
  if (hasBannedCoaching(s)) return null

  return s
}

export function clampMeuFilhoBloco3Text(raw: unknown): string {
  let s = strip(String(raw ?? ''))

  // remove bullets e numeração no clamp (best effort)
  s = s.replace(/[•●▪▫◦–—-]\s*/g, '').replace(/(^|\s)\d+\.\s+/g, ' ')

  // remove emojis
  s = s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')

  s = strip(s)
  if (!s) return ''

  // corta em 240
  if (s.length > 240) s = strip(s.slice(0, 239))

  // força <= 3 sentenças (corta no 3º terminador)
  const m = s.match(/^([\s\S]*?[.!?])([\s\S]*?[.!?])?([\s\S]*?[.!?])?/)

  if (m) {
    const joined = [m[1], m[2], m[3]].filter(Boolean).join('').trim()
    if (countSentences(joined) <= 3 && joined.length > 0) {
      s = strip(joined)
      if (s.length > 240) s = strip(s.slice(0, 239))
    }
  }

  // se ainda assim reprovou, devolve o que der (sem prometer perfeição)
  if (countSentences(s) > 3) {
    const parts = s.split(/[.!?]+/).map((p) => p.trim()).filter(Boolean)
    s = parts.slice(0, 3).join('. ').trim()
    if (s && !/[.!?]$/.test(s)) s += '.'
    if (s.length > 240) s = strip(s.slice(0, 239))
  }

  return s
}
