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
      console.debug('[ProfileAPI] Supabase not available')
      return []
    }

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 3000) // 3 second timeout for Supabase

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        clearTimeout(timeoutId)
        return []
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .neq('name', '')

      clearTimeout(timeoutId)

      if (error) {
        console.debug('[ProfileAPI] Failed to fetch children names:', error.message)
        return []
      }

      return (profiles || [])
        .map((p: { name?: string }) => p.name?.trim())
        .filter((name: string | undefined): name is string => !!name && name.length > 0)
    } catch (supabaseError) {
      clearTimeout(timeoutId)
      console.debug('[ProfileAPI] Supabase error:', supabaseError)
      return []
    }
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
  try {
    const raw = cookies().get(COOKIE)?.value
    const data = safeParse(raw)
    const childrenNames = await fetchChildrenNames()

    return NextResponse.json(
      {
        ...data,
        children: childrenNames,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('[ProfileAPI] Unexpected error in GET:', error)
    // Always return a valid response, even if something fails
    return NextResponse.json(
      {
        motherName: '',
        children: [],
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  }
}
