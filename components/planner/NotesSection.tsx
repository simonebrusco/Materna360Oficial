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
          <h3 className="text-lg md:text-base font-semibold text-[#2f3a56] flex items-center gap-2">
            <AppIcon name="edit" className="w-4 h-4 text-[#ff005e]" />
            Notas rápidas & lembretes
          </h3>
          <p className="text-xs md:text-sm text-[#545454]/70 mt-0.5">
            Um espaço livre para o que não pode escapar.
          </p>
        </div>
      )}

      <SoftCard className="p-5 md:p-6">
        <textarea
          value={content}
          onChange={e => onChange(e.target.value)}
          placeholder="Anote pensamentos, recados, coisas para lembrar..."
          className="w-full h-32 md:h-40 px-4 py-3 rounded-lg border border-[#ddd] text-sm font-medium text-[#2f3a56] placeholder-[#545454]/40 focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30 resize-none"
        />
        <p className="text-xs text-[#545454]/50 mt-2">
          {content.length} caracteres
        </p>
      </SoftCard>
    </div>
  )
}
