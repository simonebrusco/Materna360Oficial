'use client'

import React from 'react'

interface AppLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number
  height?: number
  priority?: boolean
}

export function AppLogo({
  width = 160,
  height = 40,
  priority = false,
  className = '',
  ...props
}: AppLogoProps) {
  return (
    <div
      className={`flex items-center shrink-0 ${className}`}
      aria-label="Materna360"
      {...props}
    >
      <img
        src="/images/logo-principal.png"
        alt="Materna360"
        width={width}
        height={height}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}
