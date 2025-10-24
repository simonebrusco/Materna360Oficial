import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE = 'm360_profile'
const ONE_YEAR = 60 * 60 * 24 * 365

type Profile = {
  motherName?: string      // inglês
  nomeMae?: string         // português (compatibilidade)
  filhos?: any
  figurinha?: string
}

export async function GET() {
  const raw = cookies().get(COOKIE)?.value
  const data: Record<string, any> = raw ? JSON.parse(raw) : {}
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: Request) {
  const body = (await req.json()) as Profile
  // Aceita tanto nomeMae quanto motherName
  const nameFromPt = (body.nomeMae ?? '').trim()
  const nameFromEn = (body.motherName ?? '').trim()
  const effectiveName = nameFromPt || nameFromEn

  const jar = cookies()
  const existing = jar.get(COOKIE)?.value
  const prev = existing ? JSON.parse(existing) : {}

  const next = effectiveName
    ? { ...prev, motherName: effectiveName } // sempre salva como motherName
    : prev

  jar.set({
    name: COOKIE,
    value: JSON.stringify(next),
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR,
  })

  return NextResponse.json({ ok: true, ...next }, { headers: { 'Cache-Control': 'no-store' } })
}
