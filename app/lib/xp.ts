// app/lib/xp.ts
import { getBrazilDateKey } from './dateKey'
import { save, load } from './persist'

const XP_TOTALS_KEY = 'xp:totals'
const XP_DAILY_PREFIX = 'xp:daily:'
const XP_HISTORY_KEY = 'xp:history'

type XpStoredTotals = {
  total: number
  /**
   * P26: streak não é conceito de produto (anti-culpa).
   * Mantido por compatibilidade com snapshots/legado, mas deve permanecer 0.
   */
  streak: number
  lastDateKey: string | null
}

export type XpSnapshot = {
  today: number
  total: number
  /**
   * P26: streak não é conceito de produto (anti-culpa).
   * Mantido por compatibilidade, mas sempre 0.
   */
  streak: number
}

export type XpHistoryEntry = {
  dateKey: string
  xp: number
}

/**
 * Calcula a data de ontem a partir de uma chave YYYY-MM-DD.
 * (Mantida porque pode ser útil para históricos futuros; P26 não usa streak.)
 */
function getYesterdayKey(currentKey: string): string {
  const d = new Date(currentKey + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
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
 * Lê o estado atual de XP (hoje, total e "streak").
 * P26: streak é sempre 0 (anti-culpa).
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
    streak: 0,
  }
}

/**
 * Aplica um delta de XP (positivo ou negativo) e devolve o snapshot atualizado.
 * P26: não calcula streak e não mantém sequência (anti-culpa).
 */
export function updateXP(delta: number): XpSnapshot {
  const dateKey = getBrazilDateKey()

  const stored = load<XpStoredTotals>(XP_TOTALS_KEY) ?? {
    total: 0,
    streak: 0,
    lastDateKey: null,
  }

  // Atualiza total (nunca deixa negativo)
  const newTotal = Math.max(0, (stored.total ?? 0) + delta)

  // P26: streak não existe como mecânica de produto (anti-culpa).
  // Mantemos 0 por compatibilidade e para evitar regressões.
  const newStreak = 0
  void getYesterdayKey // mantido (helper pode ser útil no futuro sem reintroduzir streak)

  const updatedTotals: XpStoredTotals = {
    total: newTotal,
    streak: 0,
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
    streak: newStreak,
  }
}

/**
 * Histórico simples: lista (dateKey, xp) dos últimos dias.
 */
export function getXpHistory(): XpHistoryEntry[] {
  return load<XpHistoryEntry[]>(XP_HISTORY_KEY) ?? []
}
