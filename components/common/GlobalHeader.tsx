// components/common/GlobalHeader.tsx
'use client'

import React from 'react'

import { useProfile } from '@/app/hooks/useProfile'
import { ClientOnly } from '@/components/common/ClientOnly'
import { AppLogo } from '@/components/ui/AppLogo'

/**
 * GlobalHeader
 *
 * Regras de ouro:
 * - Nunca bloqueia navegação
 * - Nunca decide acesso
 * - Não expõe affordance de ADM na UI do app
 */
export function GlobalHeader() {
  const { name, isLoading } = useProfile()
  const firstName = (name || '').trim().split(' ')[0] || ''

  return (
    <header
      className="
        sticky top-0 z-50
        bg-white/70 backdrop-blur-xl
        border-b border-white/60
        shadow-[0_10px_30px_rgba(0,0,0,0.08)]
      "
    >
      <div className="mx-auto w-full px-4 h-16 flex items-center justify-between">
        <AppLogo variant="white" width={128} height={32} priority />

        <div className="flex items-center">
          <ClientOnly>
            <div className="flex items-center gap-3">
              <p className="text-[12px] md:text-[13px] font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                {isLoading ? 'Olá' : `Olá${firstName ? `, ${firstName}` : ''}`}
              </p>
            </div>
          </ClientOnly>
        </div>
      </div>
    </header>
  )
}
