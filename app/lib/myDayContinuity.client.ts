'use client'

import { save, load } from '@/app/lib/persist'

export type MeuDiaContinuityOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

export type MeuDiaContinuityPayload = {
  ts: number
  origin: MeuDiaContinuityOrigin
  source: string
}

const RECENT_SAVE_KEY = 'my_day_recent_save_v1'

export function markRecentMyDaySave(input: { origin: MeuDiaContinuityOrigin; source: string }) {
  try {
    const payload: MeuDiaContinuityPayload = {
      ts: Date.now(),
      origin: input.origin,
      source: input.source,
    }
    save(RECENT_SAVE_KEY, payload)
  } catch {}
}

export function readRecentMyDaySave(): MeuDiaContinuityPayload | null {
  try {
    const v = load<MeuDiaContinuityPayload | null>(RECENT_SAVE_KEY, null)
    if (
      v &&
      typeof v === 'object' &&
      typeof (v as any).ts === 'number' &&
      typeof (v as any).origin === 'string' &&
      typeof (v as any).source === 'string'
    ) {
      return v
    }
    return null
  } catch {
    return null
  }
}
