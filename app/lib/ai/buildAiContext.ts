'use client'

import { safeGetLS, safeParseJSON } from '@/app/lib/storageSafe'

export type AiPersonaContext = {
  persona?: string
  personaLabel?: string
  mood?: string
  daySlot?: string
  focusToday?: string
  lastUpdated?: string
}

export type AiContext = {
  source: 'eu360' | 'meu-dia' | 'maternar'
  timestamp: string
  persona?: AiPersonaContext
}

export function buildAiContext(source: AiContext['source']): AiContext {
  const personaRaw = safeGetLS('eu360_persona_v1')
  const mood = safeGetLS('eu360_mood')
  const daySlot = safeGetLS('eu360_day_slot')
  const focusToday = safeGetLS('eu360_focus_today')

  const parsed = safeParseJSON<{
    persona?: string
    label?: string
    updatedAtISO?: string
  }>(personaRaw)

  const persona: AiPersonaContext | undefined = parsed
    ? {
        persona: parsed.persona,
        personaLabel: parsed.label,
        lastUpdated: parsed.updatedAtISO,
        mood: mood ?? undefined,
        daySlot: daySlot ?? undefined,
        focusToday: focusToday ?? undefined,
      }
    : undefined

  return {
    source,
    timestamp: new Date().toISOString(),
    persona,
  }
}
