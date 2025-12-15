'use client'

import React from 'react'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { ClientOnly } from '@/components/common/ClientOnly'
import { AppLogo } from '@/components/ui/AppLogo'

export function GlobalHeader() {
  const { name, avatar, isLoading } = useProfile()

  return (
    <header
      className="
        sticky top-0 z-50
        bg-[rgba(184,35,107,0.18)]
        backdrop-blur-xl
        border-b border-white/25
        shadow-[0_10px_30px_rgba(0,0,0,0.10)]
      "
    >
      <div className="mx-auto w-full px-4 h-16 flex items-center justify-between">
        <AppLogo width={128} height={32} />

        <div className="flex items-center gap-4">
          {!isLoading && name && (
            <ClientOnly>
              <div className="hidden sm:block text-right">
                <p className="m360-micro font-medium text-white/90">
                  {getTimeGreeting(name)}
                </p>
              </div>
            </ClientOnly>
          )}

          {avatar ? (
            <div className="flex-shrink-0 overflow-hidden">
              <img
                src={avatar}
                alt={name || 'Avatar'}
                className="h-10 w-10 rounded-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#fd2597] text-white flex items-center justify-center flex-shrink-0 shadow-[0_6px_16px_rgba(253,37,151,0.28)]">
              <span className="font-semibold text-sm">
                {name ? name.charAt(0) : 'U'}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
