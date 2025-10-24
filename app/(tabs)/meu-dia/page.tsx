import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'
import { getServerProfile } from '@/app/lib/profile'
import { getFirstName } from '@/app/lib/strings'

import { MeuDiaClient } from './Client'

export default async function MeuDiaPage() {
  const { name } = await getServerProfile()
  const firstName = getFirstName(name)
  const now = new Date()
  const index = getDailyIndex(now, DAILY_MESSAGES.length)
  const message = DAILY_MESSAGES[index]

  return <MeuDiaClient message={message} firstName={firstName} />
}
