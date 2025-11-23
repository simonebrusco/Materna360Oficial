'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type CompleteButtonProps = {
  done: boolean
  onClick: () => void
  className?: string
  'data-testid'?: string
}

export function CompleteButton({ done, onClick, className = '', ...rest }: CompleteButtonProps) {
  const doneClasses = done
    ? 'bg-emerald-500 hover:bg-emerald-500/90 from-emerald-500 via-emerald-500 to-emerald-500'
    : ''

  return (
    <Button
      size="sm"
      variant="primary"
      onClick={onClick}
      aria-pressed={done}
      disabled={done}
      className={[
        'min-w-[132px]',
        'whitespace-nowrap',
        'rounded-full',
        'px-4',
        'py-2',
        'shrink-0',
        'shadow-[0_4px_24px_rgba(47,58,86,0.08)]',
        doneClasses,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <span className="inline-flex items-center gap-2">
        <Check className="h-4 w-4" />
        {done ? 'Concluído' : 'Concluir'}
      </span>
    </Button>
  )
}
