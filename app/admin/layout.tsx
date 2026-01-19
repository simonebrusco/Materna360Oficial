// app/admin/layout.tsx
import * as React from 'react'
import Link from 'next/link'

import { requireAdmin } from '@/app/lib/adm/requireAdmin.server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-neutral-900">Materna360 — Admin</span>
            <nav className="flex items-center gap-3 text-sm">
              <Link className="text-neutral-700 hover:text-neutral-900" href="/admin/ideas">
                Ideias
              </Link>
              <Link className="text-neutral-700 hover:text-neutral-900" href="/admin/insights">
                Insights
              </Link>
            </nav>
          </div>

          <Link className="text-sm text-neutral-700 hover:text-neutral-900" href="/">
            Voltar ao app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
