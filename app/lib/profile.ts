import { cookies } from 'next/headers'

const PROFILE_COOKIE = 'materna360-profile'

type ProfileCookie = {
  nomeMae?: unknown
}

export async function getServerProfile(): Promise<{ name: string }> {
  const cookieStore = cookies()
  const cookieValue = cookieStore.get(PROFILE_COOKIE)?.value

  if (!cookieValue) {
    return { name: '' }
  }

  try {
    const parsed = JSON.parse(cookieValue) as ProfileCookie | null
    const name = typeof parsed?.nomeMae === 'string' ? parsed.nomeMae : ''
    return { name }
  } catch {
    return { name: '' }
  }
}
