'use client'

import React from 'react'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { ClientOnly } from '@/components/common/ClientOnly'
import { AppLogo } from '@/components/ui/AppLogo'

/**
 * Global translucent header that appears on all tabs
 * - Left: Materna360 logo (white)
 * - Right: user avatar + name greeting
 */
export function GlobalHeader() {
  const { name, avatar, isLoading } = useProfile()

  const initial = (name?.trim()?.charAt(0) || 'U').toUpperCase()

  return (
    <header
      className="
        sticky top-0 z-50
        bg-white/10 backdrop-blur-xl
        border-b border-white/20
        shadow-[0_10px_30px_rgba(0,0,0,0.10)]
      "
    >
      <div className="mx-auto w-full px-4 h-16 flex items-center justify-between">
        <AppLogo width={128} height={32} variant="white" priority />

        <div className="flex items-center gap-3">
          {!isLoading && name && (
            <ClientOnly>
              <div className="hidden sm:block text-right">
                <p className="text-[12px] leading-[16px] font-medium text-white/90">
                  {getTimeGreeting(name)}
                </p>
              </div>
            </ClientOnly>
          )}

          {/* AVATAR ("figurinha") */}
          {avatar ? (
            <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/25 shadow-[0_10px_26px_rgba(0,0,0,0.20)]">
              <img
                src={avatar}
                alt={name || 'Avatar'}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-white/15 ring-2 ring-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-[0_10px_26px_rgba(0,0,0,0.20)]">
              <span className="font-semibold text-sm">{initial}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
