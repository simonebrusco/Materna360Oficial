'use client'

import { isEnabled, limitOf } from './planClient'

export function gate(feature: string) {
  const enabled = isEnabled(feature as any)
  const limit = limitOf(feature as any)
  return { enabled, limit }
}
