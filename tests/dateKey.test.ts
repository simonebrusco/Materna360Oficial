import { getBrazilDateKey } from '@/app/lib/dateKey'

describe('getBrazilDateKey', () => {
  it('returns the expected key for midday UTC time', () => {
    const date = new Date('2024-05-15T12:34:56Z')
    expect(getBrazilDateKey(date)).toBe('2024-05-15')
  })

  it('shifts to the previous day when local time is before midnight', () => {
    const date = new Date('2024-05-15T02:59:00Z')
    expect(getBrazilDateKey(date)).toBe('2024-05-14')
  })
})
