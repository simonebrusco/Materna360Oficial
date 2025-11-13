'use client'

import { getCurrentDateKey } from './persist'

const MOOD_STORAGE_KEY = 'meu-dia:mood'
const REMINDER_DISMISSAL_PREFIX = 'm360:reminder.dismissedForDate'

type MoodEntry = { date: string; mood: number; energy: number }

export interface InactivityInfo {
  daysSinceLastEntry: number | null
  lastEntryDate: string | null
  hasAnyEntries: boolean
}

/**
 * Pure function to compute inactivity info from mood storage
 * Does not depend on React or window
 */
export function computeInactivityInfo(
  moodData: unknown,
  todayKey: string
): InactivityInfo {
  try {
    if (!Array.isArray(moodData) || moodData.length === 0) {
      return {
        daysSinceLastEntry: null,
        lastEntryDate: null,
        hasAnyEntries: false,
      }
    }

    // Find the most recent entry by sorting dates
    const sorted = [...moodData]
      .filter((e): e is MoodEntry => e && typeof e === 'object' && 'date' in e)
      .sort((a, b) => (a.date < b.date ? 1 : -1))

    if (sorted.length === 0) {
      return {
        daysSinceLastEntry: null,
        lastEntryDate: null,
        hasAnyEntries: false,
      }
    }

    const lastEntry = sorted[0]
    const lastDate = new Date(lastEntry.date)
    const today = new Date(todayKey)

    // Calculate days between
    const timeDiff = today.getTime() - lastDate.getTime()
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

    return {
      daysSinceLastEntry: daysDiff,
      lastEntryDate: lastEntry.date,
      hasAnyEntries: true,
    }
  } catch {
    return {
      daysSinceLastEntry: null,
      lastEntryDate: null,
      hasAnyEntries: false,
    }
  }
}

/**
 * Get inactivity info from browser localStorage
 * Safe to call in client-only environments
 */
export function getInactivityInfoFromStorage(): InactivityInfo {
  try {
    if (typeof window === 'undefined') {
      return {
        daysSinceLastEntry: null,
        lastEntryDate: null,
        hasAnyEntries: false,
      }
    }

    const raw = window.localStorage.getItem(MOOD_STORAGE_KEY)
    const moodData = raw ? JSON.parse(raw) : []
    const todayKey = getCurrentDateKey()

    return computeInactivityInfo(moodData, todayKey)
  } catch {
    return {
      daysSinceLastEntry: null,
      lastEntryDate: null,
      hasAnyEntries: false,
    }
  }
}

/**
 * Check if reminder was dismissed for today
 */
export function isReminderDismissedForToday(): boolean {
  try {
    if (typeof window === 'undefined') return false

    const todayKey = getCurrentDateKey()
    const dismissalKey = `${REMINDER_DISMISSAL_PREFIX}:${todayKey}`
    const dismissed = window.localStorage.getItem(dismissalKey)

    return dismissed === 'true'
  } catch {
    return false
  }
}

/**
 * Mark reminder as dismissed for today
 */
export function dismissReminderForToday(): void {
  try {
    if (typeof window === 'undefined') return

    const todayKey = getCurrentDateKey()
    const dismissalKey = `${REMINDER_DISMISSAL_PREFIX}:${todayKey}`
    localStorage.setItem(dismissalKey, 'true')
  } catch {
    // no-op
  }
}

/**
 * Determine if reminder should be shown
 */
export function shouldShowInactivityReminder(): boolean {
  const info = getInactivityInfoFromStorage()
  const isDismissed = isReminderDismissedForToday()

  // Only show if:
  // 1. Has entries (not brand new user)
  // 2. Days since last entry >= 3
  // 3. Not dismissed for today
  return (
    info.hasAnyEntries &&
    info.daysSinceLastEntry !== null &&
    info.daysSinceLastEntry >= 3 &&
    !isDismissed
  )
}
