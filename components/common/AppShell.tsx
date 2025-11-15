import type { ReactNode } from 'react'

export default function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh pb-24">{children}</div>
}
