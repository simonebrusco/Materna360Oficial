'use client'

import React from 'react'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { ClientOnly } from '@/components/common/ClientOnly'
import { AppLogo } from '@/components/ui/AppLogo'

/**
 * Global translucent header that appears on all tabs
 * - Left: Materna360 logo
 * - Right: user avatar + name greeting
 */
export function GlobalHeader() {
  const { name, avatar, isLoading } = useProfile()

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/85 border-b border-white/50">
      <div className="mx-auto w-full px-4 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <AppLogo width={128} height={32} priority />

        {/* Right: User greeting + avatar */}
        <div className="flex items-center gap-4">
          {!isLoading && name && (
            <ClientOnly>
              <div className="hidden sm:block text-right">
                <p
                  className="m360-micro font-medium"
                >
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
                className="h-10 w-10 rounded-full object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#ff005e] text-white flex items-center justify-center flex-shrink-0">
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
