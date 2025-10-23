import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'

import { MeuDiaClient } from './Client'

export const dynamic = 'force-dynamic'

export default function MeuDiaPage() {
  const now = new Date()
  const index = getDailyIndex(now, DAILY_MESSAGES.length)
  const message = DAILY_MESSAGES[index]

  return <MeuDiaClient message={message} />
}
