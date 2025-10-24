export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE = 'm360_profile'
const ONE_YEAR = 60 * 60 * 24 * 365

type Profile = {
  motherName?: string
  nomeMae?: string
}

const safeParse = (value: string | undefined): Record<string, unknown> => {
  if (!value) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
  } catch (error) {
    console.error('[ProfileAPI] Failed to parse cookie:', error)
  }

  return {}
}

export async function POST(req: Request) {
  const body = (await req.json()) as Profile
  const effectiveName = (body.nomeMae ?? body.motherName ?? '').trim()

  const jar = cookies()
  const prev = safeParse(jar.get(COOKIE)?.value)
  const next = effectiveName ? { ...prev, motherName: effectiveName, nomeMae: effectiveName } : { ...prev }

  jar.set({
    name: COOKIE,
    value: JSON.stringify(next),
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR,
  })

  return NextResponse.json(
    { ok: true, profile: next },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}

export async function GET() {
  const raw = cookies().get(COOKIE)?.value
  const data = safeParse(raw)

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
