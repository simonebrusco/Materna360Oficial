'use client'

import { listMyDayTasks } from '@/app/lib/myDayTasks.client'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import type { MyDayTaskItem } from '@/app/lib/myDayTasks.client'

export type MyDayCounts = {
  savedToday: number
  laterToday: number
}

export function readMyDayCountsToday(): MyDayCounts {
  try {
    const todayKey = getBrazilDateKey(new Date())
    const tasks = listMyDayTasks(new Date())

    if (!Array.isArray(tasks)) {
      return { savedToday: 0, laterToday: 0 }
    }

    let later = 0

    for (const t of tasks as MyDayTaskItem[]) {
      const status = t.status ?? (t.done ? 'done' : 'active')
      const snoozeUntil = typeof t.snoozeUntil === 'string' ? t.snoozeUntil : null

      if (status === 'snoozed' || (snoozeUntil && snoozeUntil > todayKey)) {
        later += 1
      }
    }

    return {
      savedToday: tasks.length,
      laterToday: later,
    }
  } catch {
    return { savedToday: 0, laterToday: 0 }
  }
}
