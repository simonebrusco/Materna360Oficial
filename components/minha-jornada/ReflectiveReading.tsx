// components/minha-jornada/ReflectiveReading.tsx
'use client'

import React from 'react'

type Props = {
  text?: string | null
}

export default function ReflectiveReading({ text }: Props) {
  if (!text) return null

  return (
    <div className="mt-4 rounded-2xl border border-[var(--color-border-soft)] bg-white/80 p-4">
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
        {text}
      </p>
    </div>
  )
}
