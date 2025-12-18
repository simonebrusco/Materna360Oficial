'use client'

import * as React from 'react'
import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  type,
  ...props
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    // CTA principal — Pink Materna360
    primary:
      'text-white bg-[#fd2597] shadow-[0_4px_24px_rgba(0,0,0,0.10)] hover:bg-[#b8236b] hover:shadow-[0_8px_32px_rgba(0,0,0,0.16)]',

    // Botão suave, com fundo rosa bem leve
    secondary:
      'bg-[#ffe1f1] text-[#545454] shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:bg-[#fdbed7] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]',

    // Botão contornado, fundo branco
    outline:
      'border border-[#EEC2D6] text-[#545454] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:bg-[#ffe1f1] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)]',

    // Fantasma, só texto com fundo transparente
    ghost:
      'bg-transparent text-[#545454] shadow-none hover:bg-[#ffe1f1] hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]',

    // Ações destrutivas continuam em vermelho
    destructive:
      'text-white bg-red-600 shadow-[0_4px_24px_rgba(220,38,38,0.20)] hover:bg-red-700 hover:shadow-[0_8px_32px_rgba(220,38,38,0.30)]',
  }

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-7 py-3 text-lg',
  }

  const isDisabled = Boolean(disabled)

  return (
    <button
      type={type ?? 'button'}
      disabled={isDisabled}
      className={[
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold',
        'transition-all duration-[150ms] ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#fd2597]/60',
        // Interações (somente quando NÃO estiver disabled)
        !isDisabled
          ? 'hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0'
          : '',
        // Disabled
        'disabled:scale-100 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
        // Legacy (se já existir no projeto)
        'ui-press ui-ring',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {/* Brilhos/overlays só fazem sentido quando habilitado */}
      {!isDisabled ? (
        <>
          <span className="absolute inset-0 -z-10 rounded-full bg-white/0 transition-opacity duration-150 group-hover:bg-white/15" />
          <span className="absolute inset-x-4 top-1.5 -z-0 h-[10px] rounded-full bg-white/40 opacity-0 blur-md transition-opacity duration-150 group-hover:opacity-100" />
        </>
      ) : null}

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}
