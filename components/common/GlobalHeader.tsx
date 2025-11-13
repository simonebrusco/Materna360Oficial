'use client'

import React from 'react'
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
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/85 border-b border-white/50">
      <div className="mx-auto w-full px-4 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/7d9c3331dcd74ab1a9d29c625c41f24c/9c5c687deb494038abfe036af2f531dc"
            alt="Materna360"
            width={56}
            height={56}
            style={{ width: 'auto', maxWidth: 'none' }}
          />
        </div>

        {/* Right: User greeting + avatar */}
        <div className="flex items-center gap-4">
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
          <div className="w-10 h-10 rounded-full border border-white/80 shadow-sm flex-shrink-0 overflow-hidden bg-secondary flex items-center justify-center">
            {avatar ? (
              <img
                src={avatar}
                alt={name || 'U'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-support-1 font-semibold text-sm">
                {name ? name.charAt(0) : 'U'}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
