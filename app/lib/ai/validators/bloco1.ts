// app/lib/ai/validators/bloco1.ts
//
// Validador canônico do Hub Meu Filho — Bloco 1 (“Sugestão pronta para agora”)
// Objetivo: garantir contrato rígido (texto curto, afirmativo, sem linguagem proibida)
// Retorno:
// - string (texto limpo e válido) quando OK
// - null quando inválido (para cair em fallback silencioso)

export type MeuFilhoBloco1ValidationReason =
  | 'empty'
  | 'too_long'
  | 'too_short'
  | 'too_many_sentences'
  | 'contains_banned_phrase'

export type MeuFilhoBloco1ValidationResult =
  | { ok: true; text: string }
  | { ok: false; reason: MeuFilhoBloco1ValidationReason }

const MAX_CHARS = 280
const MIN_CHARS = 1
const MAX_SENTENCES = 3

// Banlist: deve ser conservadora e bater exatamente com a regra de governança
const BANNED_RE = /\b(você pode|voce pode|que tal|talvez|se quiser|uma ideia)\b/i

function normalizeText(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\u2028|\u2029/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Conta frases por pontuação final comum.
 * Observação: é um split simples e intencionalmente restritivo (governança pediu “split simples”).
 */
function countSentencesSimple(s: string): number {
  if (!s) return 0
  const parts = s.split(/(?<=[.!?])\s+/).filter(Boolean)
  return parts.length || 1 // se não tiver pontuação final, conta como 1
}

/**
 * Valida o description do Bloco 1.
 * - 1..280 chars
 * - <= 3 frases (split simples)
 * - não pode conter linguagem proibida
 */
export function validateMeuFilhoBloco1Description(
  raw: unknown,
): MeuFilhoBloco1ValidationResult {
  const text = normalizeText(raw)

  if (!text) return { ok: false, reason: 'empty' }
  if (text.length < MIN_CHARS) return { ok: false, reason: 'too_short' }
  if (text.length > MAX_CHARS) return { ok: false, reason: 'too_long' }

  const sentenceCount = countSentencesSimple(text)
  if (sentenceCount > MAX_SENTENCES) return { ok: false, reason: 'too_many_sentences' }

  if (BANNED_RE.test(text)) return { ok: false, reason: 'contains_banned_phrase' }

  return { ok: true, text }
}

/**
 * Helper “soft”: retorna texto válido OU null (para fallback silencioso).
 */
export function safeMeuFilhoBloco1Text(raw: unknown): string | null {
  const v = validateMeuFilhoBloco1Description(raw)
  return v.ok ? v.text : null
}

/**
 * Helper opcional para “clamp” (não recomendado para o hard gate).
 * Uso sugerido:
 * - Somente para limpar texto antes de validar no client
 * - No servidor, prefira reprovar e retornar [] (hard gate)
 */
export function clampMeuFilhoBloco1Text(raw: unknown): string {
  const s = normalizeText(raw)
  if (!s) return s

  // limita a 3 “frases” por pontuação final
  const parts = s.split(/(?<=[.!?])\s+/).filter(Boolean)
  const first3 = parts.slice(0, 3).join(' ').trim()

  if (first3.length <= MAX_CHARS) return first3
  return first3.slice(0, MAX_CHARS).trimEnd()
}
