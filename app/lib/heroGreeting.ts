import type { Profile } from '@/app/lib/ageRange'
import { getTimeGreeting } from '@/app/lib/greetings'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDayIndex } from '@/app/lib/dailyMessage'
import { getBrazilDateKey } from '@/app/lib/dateKey'

export type HeroGreeting = {
  greeting: string
  firstName: string
  dailyMessage: string
}

/**
 * Generates a complete hero greeting combining:
 * - Time-based greeting (Bom dia, Boa tarde, Boa noite)
 * - User's first name
 * - Daily motivational message (rotating based on date)
 *
 * This helper ensures consistent greeting/message logic across /meu-dia and /maternar
 */
export function getHeroGreetingForProfile(profile?: Profile): HeroGreeting {
  // Get time-based greeting
  const greeting = getTimeGreeting()

  // Extract first name from profile, fallback to "Mãe"
  let firstName = 'Mãe'
  if (profile?.motherName && profile.motherName.trim()) {
    firstName = profile.motherName.split(' ')[0]
  }

  // Get rotating daily message based on current date
  let dailyMessage = 'Juntas vamos fazer de hoje um dia leve.'
  try {
    const dateKey = getBrazilDateKey()
    const dayIndex = getDayIndex(dateKey, DAILY_MESSAGES.length)
    const message = DAILY_MESSAGES[dayIndex]
    if (message) {
      dailyMessage = message
    }
  } catch {
    // Fallback to default message if date/message retrieval fails
    dailyMessage = 'Juntas vamos fazer de hoje um dia leve.'
  }

  return { greeting, firstName, dailyMessage }
}
