import { getDailyIndex } from '@/app/lib/dailyMessage'
import { getServerProfile } from '@/app/lib/profile'
import { getFirstName } from '@/app/lib/strings'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'

import { MeuDiaClient } from './Client'

const TIME_ZONE = 'America/Sao_Paulo'

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
  const { name } = await getServerProfile()
  const firstName = getFirstName(name)
  const now = new Date()
  const index = getDailyIndex(now, DAILY_MESSAGES.length)
  const message = DAILY_MESSAGES[index]
  const greetingPrefix = resolveGreetingPrefix(now)
  const displayName = firstName ? firstName : 'Mãe'
  const greetingText = `${greetingPrefix}, ${displayName}!`
  const formattedDate = formatDisplayDate(now)

  return (
    <MeuDiaClient
      message={message}
      firstName={firstName}
      greetingText={greetingText}
      formattedDate={formattedDate}
    />
  )
}
