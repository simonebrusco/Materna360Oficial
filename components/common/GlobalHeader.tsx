'use client'

import React from 'react'
import AppMark from '@/components/brand/AppMark'
import { Avatar } from '@/components/ui/Avatar'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'

/**
 * Global translucent header that appears on all tabs
 * - Left: Materna360 logo
 * - Right: user avatar + name greeting
 */
export function GlobalHeader() {
  const { name, isLoading } = useProfile()

  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm bg-white/30 border-b border-white/20">
      <div className="mx-auto max-w-[1040px] px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <AppMark size={32} />
        </div>

        {/* Right: User greeting + avatar */}
        <div className="flex items-center gap-3">
          {!isLoading && name && (
            <div className="hidden sm:block text-right">
              <p className="m360-micro font-medium">
                {getTimeGreeting(name)}
              </p>
              <p className="text-[12px] text-[#545454] truncate max-w-[120px]">
                {name.split(' ')[0]}
              </p>
            </div>
          )}
          <Avatar
            alt={name || 'U'}
            size="sm"
            className="flex-shrink-0"
          />
        </div>
      </div>
    </header>
  )
}
