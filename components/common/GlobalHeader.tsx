'use client'

import React from 'react'
import Image from 'next/image'
import { Avatar } from '@/components/ui/Avatar'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'

/**
 * Global translucent header that appears on all tabs
 * - Left: Materna360 logo
 * - Right: user avatar + name greeting
 */
export function GlobalHeader() {
  const { name, avatar, isLoading } = useProfile()

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-neutral-200/60">
      <div className="mx-auto max-w-[1040px] px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Image
            src="https://cdn.builder.io/api/v1/image/assets%2F7d9c3331dcd74ab1a9d29c625c41f24c%2F9c5c687deb494038abfe036af2f531dc"
            alt="Materna360"
            width={32}
            height={32}
            priority
          />
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
            src={avatar}
            alt={name || 'U'}
            size="sm"
            className="flex-shrink-0"
          />
        </div>
      </div>
    </header>
  )
}
