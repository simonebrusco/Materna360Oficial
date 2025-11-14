import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'

type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
      'text-white bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] shadow-[0_4px_24px_rgba(47,58,86,0.08)] hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)]',
    secondary:
      'bg-secondary/80 text-support-1 shadow-[0_4px_24px_rgba(47,58,86,0.08)] hover:bg-secondary hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)]',
    outline:
      'border border-primary/60 text-primary bg-white/70 shadow-[0_4px_24px_rgba(47,58,86,0.08)] hover:bg-primary/10 hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)]',
    ghost: 'bg-transparent text-support-1 shadow-none hover:bg-white/60 hover:shadow-[0_4px_24px_rgba(47,58,86,0.08)]',
    destructive:
      'text-white bg-red-600 shadow-[0_4px_24px_rgba(220,38,38,0.2)] hover:bg-red-700 hover:shadow-[0_8px_32px_rgba(220,38,38,0.3)]',
  }

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-7 py-3 text-lg',
  }

  return (
    <button
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold transition-all duration-[150ms] ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:scale-100 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none ui-press ui-ring ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <span className="absolute inset-0 -z-10 rounded-full bg-white/0 transition-opacity duration-150 group-hover:bg-white/15" />
      <span className="absolute inset-x-4 top-1.5 -z-0 h-[10px] rounded-full bg-white/40 opacity-0 blur-md transition-opacity duration-150 group-hover:opacity-100" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}
