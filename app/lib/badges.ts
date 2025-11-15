'use client'

export type BadgeId = 'autocuidado_7' | 'mae_presente' | 'conexao_sem_culpa'

export type Badge = {
  id: BadgeId
  label: string
  unlockedAt: string
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

const now = () => new Date().getTime()
const daysAgo = (n: number) => now() - n * 24 * 60 * 60 * 1000

export function computeBadges(): Badge[] {
  if (typeof window === 'undefined') return []

  const out: Badge[] = []

  // Badge 1: 7 mood check-ins in last 10 days
  type MoodEntry = { date?: string; ts?: number }
  const moods = safeParse<MoodEntry[]>(localStorage.getItem('meu-dia:mood')) ?? []
  const recentMood = moods.filter((m) => {
    const ts = m.ts ?? (m.date ? new Date(m.date).getTime() : 0)
    return ts >= daysAgo(10)
  }).length
  if (recentMood >= 7) {
    out.push({
      id: 'autocuidado_7',
      label: '7 dias de autocuidado',
      unlockedAt: new Date().toISOString(),
    })
  }

  // Badge 2: 3 reminders created in last 7 days
  let recentRem = 0
  for (let i = 0; i < 8; i++) {
    const d = new Date(Date.now() - i * 86400000)
    const dk = d.toISOString().slice(0, 10).replaceAll('-', '')
    const arr = safeParse<any[]>(localStorage.getItem(`meu-dia:${dk}:reminders`)) ?? []
    recentRem += arr.length
  }
  if (recentRem >= 3) {
    out.push({
      id: 'mae_presente',
      label: 'Mãe presente',
      unlockedAt: new Date().toISOString(),
    })
  }

  // Badge 3: 5 saved ideas total
  const savedA = safeParse<string[]>(localStorage.getItem('descobrir:saved')) ?? []
  const savedB = safeParse<string[]>(localStorage.getItem('m360:saved:discover')) ?? []
  const savedTotal = new Set([...(savedA ?? []), ...(savedB ?? [])]).size
  if (savedTotal >= 5) {
    out.push({
      id: 'conexao_sem_culpa',
      label: 'Conexão sem culpa',
      unlockedAt: new Date().toISOString(),
    })
  }

  return out
}
