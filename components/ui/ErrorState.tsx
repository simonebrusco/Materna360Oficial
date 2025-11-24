'use client'

import AppIcon from './AppIcon'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function ErrorState({
  title = 'Algo deu errado',
  description = 'Não conseguimos carregar esse conteúdo agora.',
  actionLabel = 'Tentar novamente',
  onAction,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">
        <AppIcon name="x" size={48} className="text-red-500" decorative />
      </div>
      <h3 className="text-lg font-semibold text-support-1 mb-2">{title}</h3>
      <p className="text-sm text-support-2 mb-6 max-w-xs">{description}</p>
      {onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
