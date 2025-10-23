import { cookies } from 'next/headers'

import CuidarClient from './Client'

export const dynamic = 'force-dynamic'

const PROFILE_COOKIE = 'materna360-profile'

type ProfileCookieShape = {
  nomeMae?: unknown
}

function extractFirstName(profileCookieValue?: string): string {
  if (!profileCookieValue) {
    return ''
  }

  try {
    const parsed = JSON.parse(profileCookieValue) as ProfileCookieShape | null
    const rawName = typeof parsed?.nomeMae === 'string' ? parsed.nomeMae.trim() : ''

    if (!rawName) {
      return ''
    }

    const [firstToken] = rawName.split(/\s+/).filter(Boolean)

    if (!firstToken) {
      return ''
    }

    const firstChar = firstToken.charAt(0)

    if (firstChar && firstChar === firstChar.toLowerCase()) {
      return `${firstChar.toUpperCase()}${firstToken.slice(1)}`
    }

    return firstToken
  } catch {
    return ''
  }
}

export default function CuidarPage() {
  const cookieStore = cookies()
  const profileCookieValue = cookieStore.get(PROFILE_COOKIE)?.value
  const firstName = extractFirstName(profileCookieValue)

  return <CuidarClient firstName={firstName} />
}
