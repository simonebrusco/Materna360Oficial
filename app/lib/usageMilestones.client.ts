'use client'

type MilestoneFlags = {
  daysSinceFirstOpen: number
  daysSinceLastOpen: number
  isFirstDay: boolean
  isDay7: boolean
  isDay30: boolean
  isReturnAfterAbsence: boolean
}

const KEY = {
  firstOpenAt: 'm360:firstOpenAt',
  lastOpenAt: 'm360:lastOpenAt',
  day7Ack: 'm360:day7Ack',
  day30Ack: 'm360:day30Ack',
}

function nowMs() {
  return Date.now()
}

function readMs(key: string): number | null {
  try {
    const v = localStorage.getItem(key)
    if (!v) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function writeMs(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // ignore
  }
}

function readBool(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    // ignore
  }
}

function diffDays(fromMs: number, toMs: number) {
  const ms = Math.max(0, toMs - fromMs)
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

/**
 * Atualiza marcos de uso e retorna flags do “estado temporal” do usuário.
 * Regras:
 * - Primeiro dia: day 0 (menos de 24h desde firstOpenAt)
 * - Dia 7: >= 7 dias desde firstOpenAt, apenas se ainda não foi “ack”
 * - Dia 30: >= 30 dias desde firstOpenAt, apenas se ainda não foi “ack”
 * - Retorno após ausência: >= 3 dias desde lastOpenAt (antes do update)
 */
export function getAndUpdateUsageMilestones(): MilestoneFlags {
  const now = nowMs()

  let first = readMs(KEY.firstOpenAt)
  if (!first) {
    first = now
    writeMs(KEY.firstOpenAt, first)
  }

  const lastBefore = readMs(KEY.lastOpenAt)
  writeMs(KEY.lastOpenAt, now)

  const daysSinceFirstOpen = diffDays(first, now)
  const daysSinceLastOpen = lastBefore ? diffDays(lastBefore, now) : 0

  const day7Ack = readBool(KEY.day7Ack)
  const day30Ack = readBool(KEY.day30Ack)

  const isFirstDay = daysSinceFirstOpen === 0
  const isReturnAfterAbsence = !!lastBefore && daysSinceLastOpen >= 3

  const isDay7 = !day7Ack && daysSinceFirstOpen >= 7
  const isDay30 = !day30Ack && daysSinceFirstOpen >= 30

  return {
    daysSinceFirstOpen,
    daysSinceLastOpen,
    isFirstDay,
    isDay7,
    isDay30,
    isReturnAfterAbsence,
  }
}

/**
 * Marca que o marco foi “absorvido” (sem pop-up; serve apenas para não repetir).
 * Chame quando a tela já foi renderizada uma vez com o estado.
 */
export function ackUsageMilestone(kind: 'day7' | 'day30') {
  if (kind === 'day7') writeBool(KEY.day7Ack, true)
  if (kind === 'day30') writeBool(KEY.day30Ack, true)
}
