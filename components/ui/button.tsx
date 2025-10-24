import React from 'react'

import * as React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'text-white bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] shadow-glow hover:shadow-elevated',
    secondary:
      'bg-secondary/80 text-support-1 shadow-soft hover:bg-secondary hover:shadow-elevated',
    outline:
      'border border-primary/60 text-primary bg-white/70 shadow-soft hover:bg-primary/10 hover:shadow-elevated',
    ghost: 'bg-transparent text-support-1 shadow-none hover:bg-white/60 hover:shadow-soft',
  }

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-7 py-3 text-lg',
  }

  return (
    <button
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold transition-all duration-300 ease-gentle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 hover:-translate-y-0.5 active:translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <span className="absolute inset-0 -z-10 rounded-full bg-white/0 transition-opacity duration-500 group-hover:bg-white/10" />
      <span className="absolute inset-x-4 top-1.5 -z-0 h-[10px] rounded-full bg-white/40 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  )
}
