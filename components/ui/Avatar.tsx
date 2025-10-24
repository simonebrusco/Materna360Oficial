import React from 'react'

import Image from 'next/image'

interface AvatarProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  } as const

  const sizePixels = {
    sm: 32,
    md: 48,
    lg: 64,
  } as const

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-full bg-secondary ${sizeStyles[size]} ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${sizePixels[size]}px`}
          className="object-cover"
        />
      ) : (
        <span className="text-support-1 font-semibold">{alt.charAt(0)}</span>
      )}
    </div>
  )
}
