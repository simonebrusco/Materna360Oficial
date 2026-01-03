// app/lib/ai/validators/bloco4.ts
//
// Validador canônico do Hub Meu Filho — Bloco 4 (“Fases / Contexto”)
// Objetivo: garantir frase única, observacional, não explicativa e não normativa
//
// Retorno:
// - string (texto válido) quando OK
// - null quando inválido (para fallback silencioso)

export type MeuFilhoBloco4ValidationReason =
  | 'empty'
  | 'too_long'
  | 'multiple_sentences'
  | 'contains_banned_phrase'

export type MeuFilhoBloco4ValidationResult =
  | { ok: true; text: string }
  | { ok: false; reason: MeuFilhoBloco4ValidationReason }

const MAX_CHARS = 140

// Linguagem proibida (normativa, explicativa ou comparativa)
const BANNED_RE =
  /\b(é esperado que|normalmente|o ideal é|crianças dessa idade|precisam|deveriam|já deveria|fase normal)\b/i

function normalizeText(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\u2028|\u2029/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Conta frases por pontuação final simples.
 * Bloco 4 aceita APENAS 1 frase.
 */
function countSentencesSimple(s: string): number {
  if (!s) return 0
  const parts = s.split(/(?<=[.!?])\s+/).filter(Boolean)
  return parts.length || 1
}

export function validateMeuFilhoBloco4Text(
  raw: unknown,
): MeuFilhoBloco4ValidationResult {
  const text = normalizeText(raw)

  if (!text) return { ok: false, reason: 'empty' }
  if (text.length > MAX_CHARS) return { ok: false, reason: 'too_long' }

  const sentenceCount = countSentencesSimple(text)
  if (sentenceCount > 1)
    return { ok: false, reason: 'multiple_sentences' }

  if (BANNED_RE.test(text))
    return { ok: false, reason: 'contains_banned_phrase' }

  return { ok: true, text }
}

/**
 * Helper “soft”
 * Retorna texto válido OU null (fallback silencioso)
 */
export function safeMeuFilhoBloco4Text(raw: unknown): string | null {
  const v = validateMeuFilhoBloco4Text(raw)
  return v.ok ? v.text : null
}
