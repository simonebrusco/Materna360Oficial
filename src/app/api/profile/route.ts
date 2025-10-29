import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

type Child = { name: string; birthDate?: string }
type Profile = {
  motherName?: string
  stickerId?: string
  children: Child[]
}

const COOKIE_NAME = 'm360_profile'
const DEFAULT_PROFILE: Profile = {
  motherName: '',
  stickerId: 'nino-heart',
  children: [],
}

export async function GET() {
  const jar = cookies()
  const raw = jar.get(COOKIE_NAME)?.value
  let profile = DEFAULT_PROFILE
  try {
    if (raw) {
      const parsed = JSON.parse(raw)
      profile = { ...DEFAULT_PROFILE, ...parsed }
    }
  } catch {
    // ignore bad cookie and fall back
  }
  return NextResponse.json(
    { profile },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(request: Request) {
  let body: any = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const incoming: Profile = (body?.profile ?? body) as Profile
  const profile: Profile = {
    ...DEFAULT_PROFILE,
    ...incoming,
    children: Array.isArray(incoming?.children) ? incoming.children : [],
  }

  const res = NextResponse.json({ ok: true, profile })
  res.cookies.set(COOKIE_NAME, JSON.stringify(profile), {
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return res
}
