'use client'

/**
 * Materna360 — P26
 * Core único de contexto do dia (client)
 *
 * Objetivo:
 * - Normalizar contexto de "agora" vindo do Eu360 (LS)
 * - Oferecer defaults silenciosos (sem quebrar UX)
 * - Permitir setters opcionais (hubs podem salvar escolhas)
 */

export type Slot = '3' | '5' | '10'
export type Mood = 'no-limite' | 'corrida' | 'ok' | 'leve'
export type Focus = 'casa' | 'voce' | 'filho' | 'comida'

export type TimeMode = '5' | '10' | '15'
export type AgeBand = '0-2' | '3-4' | '5-6' | '6+'

export type MaternarContext = {
  // Meu Dia Leve
  slot: Slot
  mood: Mood
  focus: Focus

  // Meu Filho
  timeWithChild: TimeMode
  childAgeBand: AgeBand
}

const LS_PREFIX = 'm360:'

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    const direct = window.localStorage.getItem(key)
    if (direct !== null) return direct
    return window.localStorage.getItem(`${LS_PREFIX}${key}`)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    // sempre gravar com prefixo para padronizar daqui pra frente
    window.localStorage.setItem(`${LS_PREFIX}${key}`, value)
  } catch {}
}

export function getMaternarContext(): MaternarContext {
  // Meu Dia Leve
  const slotRaw = safeGetLS('eu360_day_slot')
  const moodRaw = safeGetLS('eu360_mood')
  const focusRaw = safeGetLS('eu360_focus_today')

  const slot: Slot = slotRaw === '3' || slotRaw === '5' || slotRaw === '10' ? slotRaw : '5'
  const mood: Mood =
    moodRaw === 'no-limite' || moodRaw === 'corrida' || moodRaw === 'ok' || moodRaw === 'leve'
      ? moodRaw
      : 'corrida'
  const focus: Focus =
    focusRaw === 'casa' || focusRaw === 'voce' || focusRaw === 'filho' || focusRaw === 'comida'
      ? focusRaw
      : 'filho'

  // regra: no-limite força slot 3 (consistência emocional)
  const coercedSlot: Slot = mood === 'no-limite' ? '3' : slot

  // Meu Filho
  const timeRaw = safeGetLS('eu360_time_with_child')
  const ageRaw = safeGetLS('eu360_child_age_band')

  const timeWithChild: TimeMode = timeRaw === '5' || timeRaw === '10' || timeRaw === '15' ? timeRaw : '15'
  const childAgeBand: AgeBand =
    ageRaw === '0-2' || ageRaw === '3-4' || ageRaw === '5-6' || ageRaw === '6+' ? ageRaw : '3-4'

  return {
    slot: coercedSlot,
    mood,
    focus,
    timeWithChild,
    childAgeBand,
  }
}

/**
 * Setters (opcionais) — hubs podem chamar sem duplicar lógica.
 * Importante: não altera UI diretamente; apenas persiste escolhas.
 */
export function setDaySlot(slot: Slot) {
  safeSetLS('eu360_day_slot', slot)
}

export function setMood(mood: Mood) {
  safeSetLS('eu360_mood', mood)
  if (mood === 'no-limite') safeSetLS('eu360_day_slot', '3')
}

export function setFocus(focus: Focus) {
  safeSetLS('eu360_focus_today', focus)
}

export function setTimeWithChild(time: TimeMode) {
  safeSetLS('eu360_time_with_child', time)
}

export function setChildAgeBand(band: AgeBand) {
  safeSetLS('eu360_child_age_band', band)
}
