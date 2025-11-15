/**
 * Get time-based greeting in Portuguese
 * Bom dia: until 11:59
 * Boa tarde: 12:00-17:59
 * Boa noite: 18:00+
 */
export function getTimeGreeting(name?: string): string {
  if (typeof window === 'undefined') {
    return 'Olá'
  }

  const hour = new Date().getHours()
  let greeting: string

  if (hour < 12) {
    greeting = 'Bom dia'
  } else if (hour < 18) {
    greeting = 'Boa tarde'
  } else {
    greeting = 'Boa noite'
  }

  if (name && name.trim()) {
    // Extract first name if full name is provided
    const firstName = name.split(' ')[0]
    return `${greeting}, ${firstName}`
  }

  return greeting
}
