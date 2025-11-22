'use client'

import Image from 'next/image'
import React from 'react'

interface AppLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number
  height?: number
  priority?: boolean
}

export function AppLogo({
  width = 160,
  height = 40,
  priority = true,
  className = '',
  ...props
}: AppLogoProps) {
  return (
    <div
      className={`flex items-center shrink-0 ${className}`}
      aria-label="Materna360"
      {...props}
    >
      <Image
        src="/images/logo-principal.png"
        alt="Materna360"
        width={width}
        height={height}
        priority={priority}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </div>
  )
}
