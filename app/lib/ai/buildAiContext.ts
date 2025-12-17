'use client'

import { safeGetLS, safeParseJSON } from '@/app/lib/ai/storageSafe'

export type AiPersonaContext = {
  persona?: string
  label?: string
  updatedAtISO?: string
}

export type AiLightContext = {
  persona?: AiPersonaContext
  mood?: string
  focusToday?: string
  daySlot?: string
}

type PersonaResultLS = {
  persona?: string
  label?: string
  microCopy?: string
  updatedAtISO?: string
  answers?: Record<string, unknown>
}

const LS_KEYS = {
  persona: 'eu360_persona_v1',
  mood: 'eu360_mood',
  focusToday: 'eu360_focus_today',
  daySlot: 'eu360_day_slot',
}

export function buildAiContext(): AiLightContext {
  const mood = safeGetLS(LS_KEYS.mood) ?? undefined
  const focusToday = safeGetLS(LS_KEYS.focusToday) ?? undefined
  const daySlot = safeGetLS(LS_KEYS.daySlot) ?? undefined

  const rawPersona = safeGetLS(LS_KEYS.persona)
  const parsedPersona = safeParseJSON<PersonaResultLS>(rawPersona)

  const persona: AiPersonaContext | undefined = parsedPersona
    ? {
        persona: parsedPersona.persona,
        label: parsedPersona.label,
        updatedAtISO: parsedPersona.updatedAtISO,
      }
    : undefined

  return {
    persona,
    mood,
    focusToday,
    daySlot,
  }
}
