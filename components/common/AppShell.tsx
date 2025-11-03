'use client'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-materna-gradient pb-24 shadow-soft rounded-lg">
      {children}
    </div>
  )
}
