// app/api/debug/admin-guard/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    return NextResponse.json(
      { ok: false, reason: 'missing_env', hasUrl: !!url, hasAnon: !!anon },
      { status: 200 }
    )
  }

  const cookieStore = cookies()
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // no-op
      },
    },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  const user = userData?.user ?? null

  if (userErr || !user) {
    return NextResponse.json(
      { ok: false, reason: 'no_user', userErr: userErr?.message ?? null },
      { status: 200 }
    )
  }

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('role, user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json(
    {
      ok: true,
      user: { id: user.id, email: user.email },
      profile,
      profErr: profErr?.message ?? null,
    },
    { status: 200 }
  )
}
