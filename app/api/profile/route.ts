import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE = 'm360_profile'
const ONE_YEAR = 60 * 60 * 24 * 365

type Profile = {
  motherName?: string
  nomeMae?: string
  filhos?: unknown
  figurinha?: string
}

const parseCookie = (value: string | undefined): Record<string, unknown> => {
  if (!value) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
  } catch (error) {
    console.error('[ProfileAPI] Failed to parse profile cookie:', error)
  }

  return {}
}

export async function GET() {
  const raw = cookies().get(COOKIE)?.value
  const data = raw ? parseCookie(raw) : {}

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Profile
    const effectiveName = (body.nomeMae ?? body.motherName ?? '').trim()

    const jar = cookies()
    const prev = parseCookie(jar.get(COOKIE)?.value)
    const next: Record<string, unknown> = { ...prev }

    if (effectiveName) {
      next.motherName = effectiveName
      next.nomeMae = effectiveName
    }

    if (Object.prototype.hasOwnProperty.call(body, 'figurinha')) {
      const figurinha = typeof body.figurinha === 'string' ? body.figurinha.trim() : ''
      if (figurinha) {
        next.figurinha = figurinha
      } else {
        delete next.figurinha
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'filhos')) {
      next.filhos = body.filhos
    }

    jar.set({
      name: COOKIE,
      value: JSON.stringify(next),
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: ONE_YEAR,
    })

    return NextResponse.json(
      { ok: true, ...next },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('[ProfileAPI] Failed to persist profile cookie:', error)
    return NextResponse.json(
      { ok: false },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  }
}
