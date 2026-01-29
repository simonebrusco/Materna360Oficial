import 'server-only'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

type AdminUser = {
  userId: string
  email: string | null
}

/**
 * assertAdmin (server-side guard)
 *
 * Fonte de verdade: profiles.role === 'admin' (por user_id)
 * - Se não estiver logada -> /login?redirectTo=<path>
 * - Se estiver logada e não for admin -> /meu-dia
 *
 * IMPORTANTE:
 * - Aqui NÃO usamos supabaseServer() para auth.getUser(), porque supabaseServer()
 *   não carrega sessão (sem cookies) e pode falhar em ambiente SSR.
 * - CRUD admin continua usando supabaseServer() (service role) em outros módulos.
 */
export async function assertAdmin(options?: { redirectTo?: string }): Promise<AdminUser> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    // fail closed
    redirect('/meu-dia')
  }

  const cookieStore = cookies()

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // no-op em Server Components
      },
    },
  })

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    const redirectTo = options?.redirectTo ?? '/admin'
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profErr || !profile || profile.role !== 'admin') {
    redirect('/meu-dia')
  }

  return { userId: user.id, email: user.email ?? null }
}
