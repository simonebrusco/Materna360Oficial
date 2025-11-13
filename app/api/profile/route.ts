import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { tryCreateServerSupabase } from '@/app/lib/supabase'

export const runtime = 'nodejs'

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

async function fetchChildrenNames(): Promise<string[]> {
  try {
    const supabase = tryCreateServerSupabase()
    if (!supabase) {
      return []
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return []
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .neq('name', '')

    if (error) {
      console.debug('[ProfileAPI] Failed to fetch children names:', error)
      return []
    }

    return (profiles || [])
      .map((p: { name?: string }) => p.name?.trim())
      .filter((name: string | undefined): name is string => !!name && name.length > 0)
  } catch (error) {
    console.debug('[ProfileAPI] Error fetching children:', error)
    return []
  }
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
    sameSite: 'none',
    secure: true,
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
  const childrenNames = await fetchChildrenNames()

  return NextResponse.json(
    {
      ...data,
      children: childrenNames,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
