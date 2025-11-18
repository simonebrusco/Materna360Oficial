import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { tryCreateServerSupabase } from '@/app/lib/supabase'

export const runtime = 'nodejs'

const COOKIE = 'm360_profile'
const ONE_YEAR = 60 * 60 * 24 * 365

type Profile = {
  motherName?: string
  nomeMae?: string
  figurinha?: string
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

    const TIMEOUT_MS = 3000 // 3 second timeout for Supabase

    // Wrap the entire Supabase call in a Promise.race with a timeout
    const result = await Promise.race([
      (async () => {
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
          console.debug('[ProfileAPI] Failed to fetch children names:', error.message)
          return []
        }

        return (profiles || [])
          .map((p: { name?: string }) => p.name?.trim())
          .filter((name: string | undefined): name is string => !!name && name.length > 0)
      })(),
      new Promise<string[]>((_, reject) =>
        setTimeout(() => reject(new Error('Children names fetch timeout')), TIMEOUT_MS)
      ),
    ])

    return result
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
  const next = {
    ...prev,
    ...(effectiveName ? { motherName: effectiveName, nomeMae: effectiveName } : {}),
    ...(body.figurinha ? { figurinha: body.figurinha } : {}),
  }

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

    // Add a 4-second timeout to the entire GET request
    const timeoutPromise = new Promise<string[]>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 4000)
    )

    const childrenNames = await Promise.race([
      fetchChildrenNames(),
      timeoutPromise,
    ])

    return NextResponse.json(
      {
        ...data,
        children: childrenNames,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('[ProfileAPI] Error in GET (returning cached default):', error instanceof Error ? error.message : error)
    // Always return a valid response, even if something fails
    return NextResponse.json(
      {
        motherName: '',
        children: [],
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        },
      }
    )
  }
}
