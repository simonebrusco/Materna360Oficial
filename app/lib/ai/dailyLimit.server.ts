// app/lib/ai/dailyLimit.server.ts
import { cookies } from 'next/headers'
import { supabaseServer } from '@/app/lib/supabase'

// cookie para ID anônimo (quando não logada)
const ANON_COOKIE = 'm360_anon_id'

// Mensagem de bloqueio (sem números, sem técnico, sem CTA)
export const DAILY_LIMIT_MESSAGE =
  'Por hoje, vamos pausar as sugestões. Cuidar também é saber parar. Amanhã você continua com mais leveza.'

function formatDateKeySaoPaulo(d = new Date()): string {
  // YYYY-MM-DD no fuso America/Sao_Paulo
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)

  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  return `${y}-${m}-${day}`
}

function genAnonId(): string {
  // simples, suficiente para anonimato prático (não críptico)
  return `anon_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export async function getActorId(): Promise<{ actorId: string; anonToSet?: string }> {
  const supabase = supabaseServer()

  // 1) tenta user logado (fonte principal)
  try {
    const { data } = await supabase.auth.getUser()
    const id = data?.user?.id
    if (id) return { actorId: `user:${id}` }
  } catch {
    // segue fallback
  }

  // 2) fallback anônimo via cookie (persistente)
  const jar = cookies()
  const existing = jar.get(ANON_COOKIE)?.value
  if (existing && existing.trim()) return { actorId: `anon:${existing}` }

  const created = genAnonId()
  return { actorId: `anon:${created}`, anonToSet: created }
}

export async function tryConsumeDailyAI(limit = 5): Promise<{
  allowed: boolean
  dateKey: string
  actorId: string
  anonToSet?: string
  // newCount existe internamente, mas não deve ser exibido
  newCount?: number
}> {
  const dateKey = formatDateKeySaoPaulo()
  const { actorId, anonToSet } = await getActorId()

  const supabase = supabaseServer()
  const { data, error } = await supabase.rpc('m360_ai_try_consume', {
    p_actor_id: actorId,
    p_date_key: dateKey,
    p_limit: limit,
  })

  if (error || !Array.isArray(data) || data.length === 0) {
    // Falha de quota não pode quebrar UX: nesse caso, permite (fail-open)
    // e deixa auditoria no log server
    console.error('[AI_LIMIT] rpc failed', { error: error?.message, actorId, dateKey })
    return { allowed: true, dateKey, actorId, anonToSet }
  }

  const row = data[0] as { allowed?: boolean; new_count?: number }
  return {
    allowed: Boolean(row.allowed),
    newCount: typeof row.new_count === 'number' ? row.new_count : undefined,
    dateKey,
    actorId,
    anonToSet,
  }
}

export async function releaseDailyAI(actorId: string, dateKey: string): Promise<void> {
  const supabase = supabaseServer()
  const { error } = await supabase.rpc('m360_ai_release', {
    p_actor_id: actorId,
    p_date_key: dateKey,
  })
  if (error) console.error('[AI_LIMIT] release failed', { error: error.message, actorId, dateKey })
}
