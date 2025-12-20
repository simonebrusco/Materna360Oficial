import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const COOKIE_KEY = 'm360_profile_v1'

// Mantém leve; cookie tem limite. Guardamos o essencial e um snapshot eu360.
function safeJsonParse<T>(raw: string | undefined): T | null {
  try {
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function GET() {
  const c = cookies().get(COOKIE_KEY)?.value
  const data = safeJsonParse<any>(c) ?? {}

  return NextResponse.json(data, { status: 200 })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Sanitização mínima
    const motherName = typeof body?.motherName === 'string' ? body.motherName.trim() : ''
    const nomeMae = typeof body?.nomeMae === 'string' ? body.nomeMae.trim() : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''

    const figurinha = body?.figurinha
    const children = Array.isArray(body?.children) ? body.children.filter((x: any) => typeof x === 'string') : []

    const eu360 = body?.eu360 && typeof body.eu360 === 'object' ? body.eu360 : undefined

    const payload = {
      motherName: motherName || nomeMae || name || '',
      nomeMae: nomeMae || motherName || name || '',
      name: name || motherName || nomeMae || '',
      figurinha,
      children,
      eu360,
      updatedAtISO: new Date().toISOString(),
    }

    cookies().set(COOKIE_KEY, JSON.stringify(payload), {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 ano
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
