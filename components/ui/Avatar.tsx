import React from 'react'

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
  }

  return (
    <div className={`rounded-full bg-secondary flex items-center justify-center overflow-hidden ${sizeStyles[size]} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-support-1 font-semibold">{alt.charAt(0)}</span>
      )}
    </div>
  )
}
