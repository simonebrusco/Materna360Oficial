import { cookies as getCookies } from 'next/headers'
import { unstable_noStore as noStore } from 'next/cache'

import { MeuDiaClient } from './Client'

import { CHILD_ACTIVITIES, CHILD_RECOMMENDATIONS } from '@/app/data/childContent'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { getDayIndex } from '@/app/lib/dailyMessage'
import { profilePreferredBuckets, type Profile } from '@/app/lib/ageRange'
import { readProfileCookie } from '@/app/lib/profileCookie'
import { buildWeekLabels, getWeekStartKey } from '@/app/lib/weekLabels'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TIME_ZONE = 'America/Sao_Paulo'

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
  const { profile: normalizedProfile } = readProfileCookie(jar)

  const now = new Date()
  const displayName = firstNameOf(normalizedProfile.motherName)
  const plannerTitle = `Planner da ${displayName}`
  const greetingPrefix = resolveGreetingPrefix(now)
  const greeting = `${greetingPrefix}, ${displayName}!`
  const formattedDate = formatDisplayDate(now)

  const currentDateKey = getBrazilDateKey(now)
  const weekStartKey = getWeekStartKey(currentDateKey)
  const { labels: weekLabels } = buildWeekLabels(weekStartKey)
  const totalMessages = DAILY_MESSAGES.length
  const selectedIndex = getDayIndex(currentDateKey, totalMessages)
  const baseMessage = totalMessages > 0 ? DAILY_MESSAGES[selectedIndex] : ''
  const dailyGreeting = baseMessage && displayName ? `${displayName}, ${baseMessage}` : baseMessage

  const profileForClient: Profile = {
    motherName: normalizedProfile.motherName,
    children: normalizedProfile.children,
  }

  const initialBuckets = profilePreferredBuckets(profileForClient)

  return (
    <MeuDiaClient
      dailyGreeting={dailyGreeting}
      currentDateKey={currentDateKey}
      weekStartKey={weekStartKey}
      weekLabels={weekLabels}
      plannerTitle={plannerTitle}
      profile={profileForClient}
      dateKey={currentDateKey}
      allActivities={CHILD_ACTIVITIES}
      recommendations={CHILD_RECOMMENDATIONS}
      initialBuckets={initialBuckets}
    />
  )
}
