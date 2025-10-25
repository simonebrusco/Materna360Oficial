import { cookies as getCookies } from 'next/headers'
import { unstable_noStore as noStore } from 'next/cache'

import { MeuDiaClient } from './Client'

import { getDayIndex } from '@/app/lib/dailyMessage'
import { buildWeekLabels, getWeekStartKey } from '@/app/lib/weekLabels'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getTodayDateKey } from '@/lib/dailyActivity'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TIME_ZONE = 'America/Sao_Paulo'
const PROFILE_COOKIE = 'm360_profile'

const firstNameOf = (name?: string) => {
  if (!name) {
    return 'Mãe'
  }

  const trimmed = name.trim()
  if (!trimmed) {
    return 'Mãe'
  }

  const [first] = trimmed.split(/\s+/)
  if (!first) {
    return 'Mãe'
  }

  const normalized = first.charAt(0).toUpperCase() + first.slice(1)
  return normalized || 'Mãe'
}

const resolveGreetingPrefix = (date: Date) => {
  const hourFormatter = new Intl.DateTimeFormat('pt-BR', {
    hour: 'numeric',
    hour12: false,
    timeZone: TIME_ZONE,
  })
  const hour = Number.parseInt(hourFormatter.format(date), 10)

  if (Number.isNaN(hour)) {
    return 'Olá'
  }

  if (hour >= 5 && hour < 12) {
    return 'Bom dia'
  }

  if (hour >= 12 && hour < 18) {
    return 'Boa tarde'
  }

  return 'Boa noite'
}

const formatDisplayDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: TIME_ZONE,
  }).format(date)

export default async function Page() {
  noStore()

  const jar = getCookies()
  const rawProfile = jar.get(PROFILE_COOKIE)?.value

  let profile: { motherName?: string; nomeMae?: string } = {}
  if (rawProfile) {
    try {
      const parsed = JSON.parse(rawProfile)
      if (parsed && typeof parsed === 'object') {
        profile = parsed as { motherName?: string; nomeMae?: string }
      }
    } catch (error) {
      console.error('[MeuDia] Failed to parse profile cookie:', error)
    }
  }

  const motherName = profile.motherName ?? profile.nomeMae

  const now = new Date()
  const displayName = firstNameOf(motherName)
  const plannerTitle = `Planner da ${displayName}`
  const greetingPrefix = resolveGreetingPrefix(now)
  const greeting = `${greetingPrefix}, ${displayName}!`
  const formattedDate = formatDisplayDate(now)

  const currentDateKey = getTodayDateKey(now)
  const weekStartKey = getWeekStartKey(currentDateKey)
  const { labels: weekLabels } = buildWeekLabels(weekStartKey)
  const totalMessages = DAILY_MESSAGES.length
  const selectedIndex = getDayIndex(currentDateKey, totalMessages)
  const baseMessage = totalMessages > 0 ? DAILY_MESSAGES[selectedIndex] : ''
  const dailyGreeting = baseMessage && displayName ? `${displayName}, ${baseMessage}` : baseMessage

  return (
    <main className="relative mx-auto max-w-5xl px-4 pb-28 pt-10 sm:px-6 md:px-8">
      {/* m360-debug: {JSON.stringify(profile)} */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-12 top-0 -z-10 h-64 rounded-soft-3xl bg-[radial-gradient(65%_65%_at_50%_0%,rgba(255,216,230,0.55),transparent)]"
      />
      <div className="relative space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Hoje</span>
          <h1 data-testid="greeting-text" className="text-3xl font-semibold text-support-1 md:text-4xl">
            {greeting}
          </h1>
          <p className="text-sm text-support-2 md:text-base">Pequenos momentos criam grandes memórias.</p>
          <p className="text-sm text-support-2 md:text-base">{formattedDate}</p>
        </div>

        <MeuDiaClient
          dailyGreeting={dailyGreeting}
          currentDateKey={currentDateKey}
          weekStartKey={weekStartKey}
          weekLabels={weekLabels}
          plannerTitle={plannerTitle}
        />
      </div>
    </main>
  )
}
