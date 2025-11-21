'use client'

import React from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'

type NotesSectionProps = {
  content: string
  onChange: (content: string) => void
  hideTitle?: boolean
}

export default function NotesSection({ content, onChange, hideTitle = false }: NotesSectionProps) {
  return (
    <div className="space-y-3">
      {!hideTitle && (
        <div>
          <h3 className="text-lg md:text-base font-semibold text-[var(--color-text-main)] flex items-center gap-2 font-poppins">
            <AppIcon name="edit" className="w-4 h-4 text-[var(--color-brand)]" />
            Notas rápidas & lembretes
          </h3>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-0.5 font-poppins">
            Um espaço livre para o que não pode escapar.
          </p>
        </div>
      )}

      <SoftCard className="p-5 md:p-6">
        <textarea
          value={content}
          onChange={e => onChange(e.target.value)}
          placeholder="Anote pensamentos, recados, coisas para lembrar..."
          className="w-full h-32 md:h-40 px-4 py-3 rounded-lg border border-[#EDEDED] text-sm font-medium text-[var(--color-text-main)] placeholder-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 resize-none font-poppins"
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-2 font-poppins">
          {content.length} caracteres
        </p>
      </SoftCard>
    </div>
  )
}
