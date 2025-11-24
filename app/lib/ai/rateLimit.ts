// app/lib/ai/rateLimit.ts
//
// Helper simples de rate limit em memória para endpoints de IA.
// Objetivo: evitar abuso acidental e proteger custos,
// sem adicionar dependências externas nem complexidade desnecessária.
//
// Importante: isso é "best-effort". Em produção serverless (Vercel),
// o limite é por instância, não global absoluto — mas já ajuda muito.

export class RateLimitError extends Error {
  status: number

  constructor(message = 'Limite de uso da IA atingido, tente novamente em instantes.') {
    super(message)
    this.name = 'RateLimitError'
    this.status = 429
  }
}

type Bucket = {
  count: number
  resetAt: number
}

type RateLimitStore = {
  [key: string]: Bucket
}

// Usamos o escopo global para compartilhar entre chamadas
const GLOBAL_KEY = '__materna_ai_rate_limit_store__'

// estendemos o escopo global de forma segura
const globalWithStore = globalThis as typeof globalThis & {
  [GLOBAL_KEY]?: RateLimitStore
}

if (!globalWithStore[GLOBAL_KEY]) {
  globalWithStore[GLOBAL_KEY] = {}
}

const store: RateLimitStore = globalWithStore[GLOBAL_KEY]!

type RateLimitOptions = {
  /**
   * Quantidade máxima de requisições dentro da janela.
   * Ex.: 20 req / 5 minutos.
   */
  limit: number
  /**
   * Janela em milissegundos.
   */
  windowMs: number
}

/**
 * Extrai um identificador de cliente a partir dos headers.
 * Priorizamos IP de proxy (x-forwarded-for), depois user-agent,
 * e por fim um "fallback" anônimo.
 */
function getClientIdentifier(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const firstIp = xff.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  const userAgent = req.headers.get('user-agent')
  if (userAgent) {
    return `ua:${userAgent.slice(0, 80)}`
  }

  return 'anonymous'
}

/**
 * Lança RateLimitError se o cliente ultrapassar o limite configurado
 * para a combinação (featureKey + cliente).
 *
 * Exemplo de uso:
 *   assertRateLimit(req, 'ai-rotina', { limit: 20, windowMs: 5 * 60_000 })
 */
export function assertRateLimit(
  req: Request,
  featureKey: string,
  options: RateLimitOptions = {
    limit: 20,
    windowMs: 5 * 60_000, // 5 minutos
  },
): void {
  const identifier = getClientIdentifier(req)
  const bucketKey = `${featureKey}:${identifier}`

  const now = Date.now()
  const existing = store[bucketKey]

  if (!existing || existing.resetAt < now) {
    // Nova janela
    store[bucketKey] = {
      count: 1,
      resetAt: now + options.windowMs,
    }
    return
  }

  if (existing.count >= options.limit) {
    throw new RateLimitError()
  }

  existing.count += 1
}
