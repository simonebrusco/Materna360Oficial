'use client'

import React, { type ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  // AppShell agora é APENAS estrutura/spacing.
  // Fundo oficial do app está exclusivamente em app/globals.css (fonte da verdade).
  return <div className="relative min-h-[100dvh] pb-24">{children}</div>
}

export default AppShell
