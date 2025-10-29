'use client'

import { Header } from '@/components/ui/Header'
import { TabBar } from '@/components/ui/TabBar'

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header title="Materna360" showNotification />
      <main className="relative flex-1 pb-32">
        {/* top soft glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(70%_70%_at_50%_0%,rgba(255,216,230,0.55),transparent)]"
        />
        {/* bottom pink glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-72 bg-[radial-gradient(80%_80%_at_50%_100%,rgba(255,0,94,0.12),transparent)]"
        />
        <div className="relative z-10">{children}</div>
      </main>
      <TabBar />
    </div>
  )
}
