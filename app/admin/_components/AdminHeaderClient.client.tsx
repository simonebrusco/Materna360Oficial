'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export type AdminHeaderProps = {
  env: 'prod' | 'preview' | 'local'
  label: string
  commit: string | null
}

export default function AdminHeaderClient({ env, label, commit }: AdminHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Left */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-neutral-900">
            Materna360 — Admin
          </span>

          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${
              env === 'prod'
                ? 'bg-red-100 text-red-700'
                : env === 'preview'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-neutral-200 text-neutral-700'
            }`}
          >
            {label}
          </span>

          {commit && <span className="text-xs text-neutral-400">{commit}</span>}
        </div>

        {/* Right */}
        <div className="flex items-center gap-4 text-sm">
          <nav className="flex items-center gap-3">
            <Link href="/admin/ideas" className="hover:underline">
              Ideias
            </Link>
            <Link href="/admin/insights" className="hover:underline">
              Insights
            </Link>
            <Link href="/admin/texts" className="hover:underline">
              Textos
            </Link>
          </nav>

          <button
            onClick={handleLogout}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
