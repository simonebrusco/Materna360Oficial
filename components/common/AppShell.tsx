'use client'

import React, { type ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  // AppShell controla o espaço da página; o BottomNav fica em layout.tsx
  // Agora também aplica o FUNDO ÚNICO global (paleta Materna) para as 3 abas.
  return (
    <div className="relative min-h-[100dvh] pb-24 overflow-hidden">
      {/* Background global (cenário) — paleta Materna */}
      <div
        aria-hidden="true"
        className="
          absolute inset-0
          bg-[#ffe1f1]
          bg-[linear-gradient(to_bottom,#b8236b_0%,#fd2597_42%,#fdbed7_70%,#ffe1f1_92%,#fff7fa_100%)]
        "
      />

      {/* Overlays premium sutis (sem sair da paleta) */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(920px_520px_at_18%_10%,rgba(255,216,230,0.38)_0%,rgba(255,216,230,0)_60%)]
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(820px_520px_at_78%_22%,rgba(253,37,151,0.22)_0%,rgba(253,37,151,0)_62%)]
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-x-0 top-0 h-20
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.16),rgba(255,255,255,0))]
        "
      />

      {/* Conteúdo sempre acima do cenário */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default AppShell
