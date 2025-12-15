'use client'

import React, { type ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  // AppShell controla apenas layout/altura/safe-area.
  // O FUNDO ÚNICO GLOBAL fica no RootLayout (app/layout.tsx).
  return (
    <div className="relative min-h-[100dvh] pb-24 overflow-hidden">
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default AppShell
