import { cookies } from 'next/headers'

import { getDayIndex } from '@/app/lib/dailyMessage'
import { getTodayDateKey } from '@/lib/dailyActivity'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'

import { MeuDiaClient } from './Client'

const TIME_ZONE = 'America/Sao_Paulo'
const PROFILE_COOKIE = 'm360_profile'

const firstNameOf = (name?: string) => {
  if (!name) {
    return undefined
  }

  const trimmed = name.trim()
  if (!trimmed) {
    return undefined
  }

  const [first] = trimmed.split(/\s+/)
  if (!first) {
    return undefined
  }

  return first.charAt(0).toUpperCase() + first.slice(1)
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

export default async function MeuDiaPage() {
  const cookieStore = cookies()
  const rawProfile = cookieStore.get(PROFILE_COOKIE)?.value

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

  const savedName = firstNameOf(profile.motherName ?? profile.nomeMae)
  const now = new Date()
  const currentDateKey = getTodayDateKey(now)
  const totalMessages = DAILY_MESSAGES.length
  const selectedIndex = getDayIndex(currentDateKey, totalMessages)
  const baseMessage = totalMessages > 0 ? DAILY_MESSAGES[selectedIndex] : ''
  const message = baseMessage && savedName ? `${savedName}, ${baseMessage}` : baseMessage
  const greetingPrefix = resolveGreetingPrefix(now)
  const displayName = savedName ?? 'Mãe'
  const greetingText = `${greetingPrefix}, ${displayName}!`
  const formattedDate = formatDisplayDate(now)

  return (
    <MeuDiaClient
      message={message}
      greetingText={greetingText}
      formattedDate={formattedDate}
      currentDateKey={currentDateKey}
    />
  )
}
