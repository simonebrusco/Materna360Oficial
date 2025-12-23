// app/lib/xp.ts
import { getBrazilDateKey } from './dateKey'
import { save, load } from './persist'

const XP_TOTALS_KEY = 'xp:totals'
const XP_DAILY_PREFIX = 'xp:daily:'
const XP_HISTORY_KEY = 'xp:history'

/**
 * P26 — Anti-culpa (Jornada silenciosa)
 *
 * Importante:
 * - "streak/sequência" NÃO existe como conceito do produto em P26.
 * - Mantemos campos por compatibilidade para não quebrar UI/código legado,
 *   mas o valor fica sempre 0.
 * - Total/today/history permanecem válidos como registro do que aconteceu.
 */
type XpStoredTotals = {
  total: number
  // compat (não usar no produto)
  streak: number
  lastDateKey: string | null
}

export type XpSnapshot = {
  today: number
  total: number
  // compat (não usar no produto)
  streak: number
}

export type XpHistoryEntry = {
  dateKey: string
  xp: number
}

/**
 * Atualiza / registra histórico diário de XP.
 */
function upsertXpHistory(dateKey: string, xpForDay: number) {
  const history = load<XpHistoryEntry[]>(XP_HISTORY_KEY) ?? []

  const idx = history.findIndex((entry) => entry.dateKey === dateKey)
  if (idx >= 0) {
    history[idx] = { dateKey, xp: xpForDay }
  } else {
    history.push({ dateKey, xp: xpForDay })
  }

  // Mantém no máximo 120 dias de histórico
  const trimmed = history.length > 120 ? history.slice(history.length - 120) : history

  save(XP_HISTORY_KEY, trimmed)
}

/**
 * Lê o estado atual de XP (hoje, total e "streak" compat).
 */
export function getXpSnapshot(): XpSnapshot {
  const dateKey = getBrazilDateKey()

  const stored = load<XpStoredTotals>(XP_TOTALS_KEY) ?? {
    total: 0,
    streak: 0,
    lastDateKey: null,
  }

  const todayKey = `${XP_DAILY_PREFIX}${dateKey}`
  const today = load<number>(todayKey) ?? 0

  return {
    today,
    total: stored.total ?? 0,
    streak: 0, // P26: sempre 0 (sem sequência)
  }
}

/**
 * Aplica um delta de XP (positivo ou negativo) e devolve o snapshot atualizado.
 *
 * P26: NÃO calcula streak. Apenas registra o que aconteceu (today/total/history).
 */
export function

  // Atualiza total (nunca deixa negativo)
  const newTotal = Math.max(0, (stored.total ?? 0) + delta)

  // P26: streak sempre 0 (compat)
  const updatedTotals: XpStoredTotals = {
    total: newTotal,
    streak: 0,
    // Mantemos lastDateKey apenas como “última atividade registrada”, sem cobrança.
    lastDateKey: delta !== 0 ? dateKey : stored.lastDateKey,
  }

  save(XP_TOTALS_KEY, updatedTotals)

  // Atualiza XP do dia
  const todayKey = `${XP_DAILY_PREFIX}${dateKey}`
  const currentToday = load<number>(todayKey) ?? 0
  const newToday = Math.max(0, currentToday + delta)
  save(todayKey, newToday)

  // Atualiza histórico diário
  upsertXpHistory(dateKey, newToday)

  return {
    today: newToday,
    total: newTotal,
    streak: 0, // P26: sempre 0
  }
}

/**
 * Histórico simples: lista (dateKey, xp) dos últimos dias.
 */
export function getXpHistory(): XpHistoryEntry[] {
  return load<XpHistoryEntry[]>(XP_HISTORY_KEY) ?? []
}
