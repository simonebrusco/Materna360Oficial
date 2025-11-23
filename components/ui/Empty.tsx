'use client'

import AppIcon from './AppIcon'
import type { AppIconName } from './AppIcon'
import { Button } from './Button'

interface EmptyProps {
  icon?: AppIconName
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export function Empty({
  icon = 'search',
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4">
          <AppIcon name={icon} size={48} className="text-support-2" decorative />
        </div>
      )}
      <h3 className="text-lg font-semibold text-support-1 mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-support-2 mb-6 max-w-xs">{subtitle}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
