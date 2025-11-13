'use client'

import * as React from 'react'
import {
  getInactivityInfoFromStorage,
  isReminderDismissedForToday,
  dismissReminderForToday,
  type InactivityInfo,
} from '@/app/lib/inactivityReminder'
import { track } from '@/app/lib/telemetry'

interface UseInactivityReminderState {
  show: boolean
  inactivityInfo: InactivityInfo | null
  dismiss: () => void
}

/**
 * Hook to manage inactivity reminder visibility and state
 * Handles dismissal flag, telemetry, and debouncing
 */
export function useInactivityReminder(): UseInactivityReminderState {
  const [show, setShow] = React.useState(false)
  const [inactivityInfo, setInactivityInfo] = React.useState<InactivityInfo | null>(null)
  const [initialized, setInitialized] = React.useState(false)

  // Initialize on mount (client-only)
  React.useEffect(() => {
    try {
      const info = getInactivityInfoFromStorage()
      const isDismissed = isReminderDismissedForToday()

      // Show reminder only if:
      // 1. User has entries
      // 2. Days since last entry >= 3
      // 3. Not dismissed for today
      const shouldShow =
        info.hasAnyEntries &&
        info.daysSinceLastEntry !== null &&
        info.daysSinceLastEntry >= 3 &&
        !isDismissed

      setInactivityInfo(info)
      setShow(shouldShow)
      setInitialized(true)

      // Fire telemetry when reminder is shown
      if (shouldShow) {
        track('reminder_inactivity_shown', {
          page: '/meu-dia',
          daysSinceLastEntry: info.daysSinceLastEntry,
          lastEntryDate: info.lastEntryDate,
        })
      }
    } catch {
      setInitialized(true)
    }
  }, [])

  const dismiss = React.useCallback(() => {
    try {
      dismissReminderForToday()
      setShow(false)

      // Fire telemetry for dismissal
      if (inactivityInfo) {
        track('reminder_inactivity_dismiss', {
          page: '/meu-dia',
          daysSinceLastEntry: inactivityInfo.daysSinceLastEntry,
          lastEntryDate: inactivityInfo.lastEntryDate,
        })
      }
    } catch {
      // no-op
    }
  }, [inactivityInfo])

  return { show, inactivityInfo, dismiss }
}
