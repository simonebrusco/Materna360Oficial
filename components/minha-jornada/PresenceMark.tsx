// components/minha-jornada/PresenceMark.tsx
'use client'

import React from 'react'

type Props = {
  label?: string | null
}

export default function PresenceMark({ label }: Props) {
  if (!label) return null

  return (
    <div className="mt-4 text-xs text-[var(--color-text-muted)] text-center">
      {label}
    </div>
  )
}
