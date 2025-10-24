import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const PROFILE_COOKIE = 'm360_profile'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

type ProfileCookie = Record<string, unknown> & {
  motherName?: string
  nomeMae?: string
}

const readProfileCookie = (): ProfileCookie => {
  const rawValue = cookies().get(PROFILE_COOKIE)?.value
  if (!rawValue) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawValue)
    if (parsed && typeof parsed === 'object') {
      return parsed as ProfileCookie
    }
  } catch (error) {
    console.error('[ProfileAPI] Failed to parse profile cookie:', error)
  }

  return {}
}

const sanitizeName = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed
}

export async function GET() {
  const stored = readProfileCookie()
  const motherName = sanitizeName(stored.motherName ?? stored.nomeMae)

  if (motherName) {
    return NextResponse.json({ motherName, nomeMae: motherName })
  }

  return NextResponse.json({})
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const current = readProfileCookie()
    const next: ProfileCookie = { ...current }

    const incomingName = sanitizeName(body?.motherName ?? body?.nomeMae)
    if (incomingName) {
      next.motherName = incomingName
      next.nomeMae = incomingName
    } else if (Object.prototype.hasOwnProperty.call(body ?? {}, 'motherName') || Object.prototype.hasOwnProperty.call(body ?? {}, 'nomeMae')) {
      delete next.motherName
      delete next.nomeMae
    }

    Object.entries(body ?? {}).forEach(([key, value]) => {
      if (key === 'motherName' || key === 'nomeMae') {
        return
      }
      next[key] = value
    })

    cookies().set({
      name: PROFILE_COOKIE,
      value: JSON.stringify(next),
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[ProfileAPI] Failed to persist profile cookie:', error)
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
