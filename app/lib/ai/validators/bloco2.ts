// app/lib/ai/validators/bloco2.ts
//
// Validador canônico do Hub Meu Filho — Bloco 2 (“Cards de atividades”)
// Objetivo: curadoria leve com guardrails (3–5 cards), sem texto longo, sem catálogo, sem emojis.
// Retorno:
// - RotinaQuickSuggestion[] sanitizado quando OK (3–5 cards)
// - [] quando inválido (para cair em fallback silencioso no client)

import type { RotinaQuickSuggestion } from '@/app/lib/ai/maternaCore'

export type MeuFilhoBloco2ValidationReason =
  | 'empty'
  | 'too_few'
  | 'too_many'
  | 'invalid_card'
  | 'contains_banned_phrase'
  | 'too_long_description'
  | 'empty_title'
  | 'empty_description'
  | 'duplicate'

const MIN_CARDS = 3
const MAX_CARDS = 5
const MAX_DESC_CHARS = 120
const MAX_TITLE_CHARS = 48

// Banlist conservadora (sem “catálogo”, sem didatismo, sem convite/hesitação)
const BANNED_RE =
  /\b(que tal|talvez|se quiser|uma ideia|você pode|voce pode|atividade educativa|educativa|pinterest|lista|várias opções|diversas opções)\b/i

// Bloqueio simples de emojis (regra do prompt)
const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

function normalizeText(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\u2028|\u2029/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function clampChars(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max).trimEnd()
}

function looksLikeListyText(s: string): boolean {
  // evita “listas” em uma frase: bullets, numeração, ou separadores em série
  if (/(^|\s)[•\-–—]\s+/.test(s)) return true
  if (/(^|\s)\d+\)\s+/.test(s)) return true
  if (s.includes('\n')) return true
  return false
}

function isGenericTitle(s: string): boolean {
  const t = s.toLowerCase()
  return (
    t === 'brincadeira' ||
    t === 'atividade' ||
    t === 'conexão' ||
    t === 'rotina' ||
    t === 'ideia rápida' ||
    t === 'ideia'
  )
}

function signatureKey(title: string, desc: string): string {
  return `${title.toLowerCase()}|${desc.toLowerCase()}`
}

/**
 * Valida e sanitiza cards do Bloco 2.
 * - 3–5 cards
 * - title curto e acionável (<= 48 chars)
 * - description até 120 chars, 1 frase curta, sem lista, sem emoji, sem banlist
 * - dedupe por assinatura simples (title+desc)
 * - withChild: true
 */
export function sanitizeMeuFilhoBloco2Suggestions(
  raw: RotinaQuickSuggestion[] | null | undefined,
  tempoDisponivel: number | null | undefined,
): RotinaQuickSuggestion[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  if (raw.length < MIN_CARDS) return []
  if (raw.length > 20) {
    // se a IA “surtar” e mandar lista enorme, a gente reprova direto
    return []
  }

  const out: RotinaQuickSuggestion[] = []
  const seen = new Set<string>()

  for (const item of raw) {
    const title = normalizeText(item?.title)
    const description = normalizeText(item?.description)

    if (!title) return []
    if (!description) return []

    if (EMOJI_RE.test(title) || EMOJI_RE.test(description)) return []
    if (BANNED_RE.test(title) || BANNED_RE.test(description)) return []
    if (looksLikeListyText(description)) return []
    if (isGenericTitle(title)) return []

    const safeTitle = clampChars(title, MAX_TITLE_CHARS)
    const safeDesc = clampChars(description, MAX_DESC_CHARS)

    if (!safeTitle) return []
    if (!safeDesc) return []
    if (safeDesc.length > MAX_DESC_CHARS) return []
    if (safeDesc.length < 1) return []

    const key = signatureKey(safeTitle, safeDesc)
    if (seen.has(key)) {
      // duplicado -> ignora
      continue
    }
    seen.add(key)

    const estimatedMinutes =
      typeof tempoDisponivel === 'number' && Number.isFinite(tempoDisponivel)
        ? Math.max(1, Math.round(tempoDisponivel))
        : item?.estimatedMinutes

    out.push({
      ...item,
      title: safeTitle,
      description: safeDesc,
      withChild: true,
      estimatedMinutes,
    })

    if (out.length >= MAX_CARDS) break
  }

  // hard rule: 3–5 cards após limpeza
  if (out.length < MIN_CARDS) return []
  if (out.length > MAX_CARDS) return out.slice(0, MAX_CARDS)

  return out
}
