'use client'

import React from 'react'
import Image from 'next/image'

type Variant = 'white' | 'default'

interface AppLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number
  height?: number
  priority?: boolean
  variant?: Variant
}

export function AppLogo({
  width = 160,
  height = 40,
  priority = false,
  variant = 'white',
  className = '',
  ...props
}: AppLogoProps) {
  const src = variant === 'white' ? '/images/LogoBranco.png' : '/images/logo-principal.png'

  return (
    <div
      className={`flex items-center shrink-0 ${className}`}
      aria-label="Materna360"
      {...props}
    >
      <Image
        src={src}
        alt="Materna360"
        width={width}
        height={height}
        priority={priority}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}
