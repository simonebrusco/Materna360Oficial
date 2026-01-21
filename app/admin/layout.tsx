// app/admin/layout.tsx
import * as React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

type Props = { children: React.ReactNode }

/**
 * MVP Guard (server-side):
 * - not logged in  -> /login?redirectTo=/admin
 * - logged in + role != admin -> /
 * - admin -> render admin layout
 *
 * IMPORTANT: profiles key is `user_id` (uuid), not `id`.
 */
export default async function AdminLayout({ children }: Props) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    // Fail closed: no env = no admin access
    redirect('/')
  }

  const cookieStore = cookies()

  // In Server Components, we only need read access to cookies for getUser().
  // setAll is provided as a no-op to avoid runtime restrictions in layouts.
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // no-op in Server Components
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent('/admin')}`)
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !profile || profile.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-neutral-900">Materna360 — Admin</span>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/admin/ideas">Ideias</Link>
              <Link href="/admin/insights">Insights</Link>
            </nav>
          </div>
          <Link href="/">Voltar ao app</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
