import { describe, expect, it } from 'vitest'

import { hash, selectQuote } from '@/app/api/mood-message/lib'

describe('mood message hashing', () => {
  it('returns the same quote for identical input', () => {
    const first = selectQuote('feliz', '2024-09-25', 'guest')
    const second = selectQuote('feliz', '2024-09-25', 'guest')

    expect(first).toBe(second)
  })

  it('changes the hash when the date changes', () => {
    const base = hash('2024-09-25|feliz|guest')
    const next = hash('2024-09-26|feliz|guest')

    expect(base).not.toBe(next)
  })
})
