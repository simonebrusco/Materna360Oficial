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

// Ajuste: 120 estava “matando” muitas sugestões boas.
// 180 mantém o texto curto, mas permite 2 frases curtas (“Faça X. Depois Y.”).
const MAX_DESC_CHARS = 180

const MAX_TITLE_CHARS = 48

// Banlist conservadora, mas menos agressiva:
// Mantém bloqueio do que vira catálogo / “pinterest” / lista de opções / tom de aula.
// Remove “que tal”, “você pode”, “uma ideia” (muito comuns e não necessariamente ruins).
const BANNED_RE =
  /\b(pinterest|lista|várias opções|varias opcoes|diversas opções|diversas opcoes|atividade educativa|educativa)\b/i

// Bloqueio simples de emojis (regra do prompt)
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

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
  // evita “listas” em uma frase: bullets, numeração, ou quebras
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
    t === 'conexao' ||
    t === 'rotina' ||
    t === 'ideia rápida' ||
    t === 'ideia rapida' ||
    t === 'ideia'
  )
}

function signatureKey(title: string, desc: string): string {
  return `${title.toLowerCase()}|${desc.toLowerCase()}`
}

function countSentences(s: string): number {
  // Permite até 2 frases curtas. Evita parágrafos/explicações longas.
  const parts = s
    .split(/[.!?]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length
}

/**
 * Valida e sanitiza cards do Bloco 2.
 * - 3–5 cards
 * - title curto e acionável (<= 48 chars)
 * - description até 180 chars, 1–2 frases curtas, sem lista, sem emoji, sem banlist
 * - dedupe por assinatura simples (title+desc)
 * - withChild: true
 *
 * Importante: NÃO “hard-fail” no primeiro card ruim.
 * A estratégia é: filtra os bons e só reprova se ficar < 3 no final.
 */
export function sanitizeMeuFilhoBloco2Suggestions(
  raw: RotinaQuickSuggestion[] | null | undefined,
  tempoDisponivel: number | null | undefined,
): RotinaQuickSuggestion[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  if (raw.length > 20) {
    // se a IA “surtar” e mandar lista enorme, reprova direto
    return []
  }

  const out: RotinaQuickSuggestion[] = []
  const seen = new Set<string>()

  for (const item of raw) {
    const titleRaw = normalizeText(item?.title)
    const descRaw = normalizeText(item?.description)

    // Em vez de hard-fail, apenas ignora cards inválidos
    if (!titleRaw) continue
    if (!descRaw) continue

    if (EMOJI_RE.test(titleRaw) || EMOJI_RE.test(descRaw)) continue
    if (BANNED_RE.test(titleRaw) || BANNED_RE.test(descRaw)) continue
    if (looksLikeListyText(descRaw)) continue
    if (isGenericTitle(titleRaw)) continue

    // Sanitiza
    const safeTitle = clampChars(titleRaw, MAX_TITLE_CHARS)
    const safeDesc = clampChars(descRaw, MAX_DESC_CHARS)

    if (!safeTitle) continue
    if (!safeDesc) continue

    // Guardrail: 1–2 frases (curtas)
    const sentences = countSentences(safeDesc)
    if (sentences < 1 || sentences > 2) continue

    // Guardrail: descrição não pode ser “micro demais” (evita cards vazios)
    if (safeDesc.length < 10) continue

    const key = signatureKey(safeTitle, safeDesc)
    if (seen.has(key)) continue
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

  // Hard rule: 3–5 cards após limpeza
  if (out.length < MIN_CARDS) return []
  if (out.length > MAX_CARDS) return out.slice(0, MAX_CARDS)

  return out
}
