'use client'

import React from 'react'
import AppIcon from '@/components/ui/AppIcon'
import type { PlannerContent } from './MeuDiaPremium'

interface InspiracoesConteudosSectionProps {
  contents: PlannerContent[]
}

const CONTENT_TYPE_ICONS: Record<PlannerContent['type'], string> = {
  artigo: 'bookmark',
  receita: 'utensils',
  ideia: 'lightbulb',
}

export default function InspiracoesConteudosSection({ contents }: InspiracoesConteudosSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <AppIcon name="sparkles" className="w-5 h-5 text-[var(--color-brand)]" />
        <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-main)]">Inspirações & Conteúdos</h2>
        <span className="text-xs font-medium bg-[var(--color-soft-bg)] text-[var(--color-text-muted)] px-2 py-1 rounded-full">
          {contents.length}
        </span>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 pb-2">
        <div className="flex gap-3 min-w-min">
          {contents.map(content => (
            <div
              key={content.id}
              className="flex-shrink-0 w-40 md:w-48 rounded-[14px] border border-black/5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all overflow-hidden group cursor-pointer"
            >
              {/* Placeholder Image */}
              <div className="w-full aspect-video bg-gradient-to-br from-[var(--color-soft-bg)] to-[var(--color-soft-strong)]/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AppIcon
                  name={CONTENT_TYPE_ICONS[content.type] as any}
                  className="w-8 h-8 text-[var(--color-brand)]/40"
                />
              </div>

              {/* Content Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-brand)]/70 bg-[var(--color-soft-strong)] px-2 py-0.5 rounded-full">
                    {content.type}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-text-main)] line-clamp-2">
                  {content.title}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]/60">{content.origin}</p>
              </div>

              {/* CTA */}
              <div className="p-3 border-t border-[var(--color-border-muted)] bg-[var(--color-soft-bg)] opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-full text-xs font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors">
                  Ver →
                </button>
              </div>
            </div>
          ))}

          {/* CTA to see more */}
          {contents.length > 0 && (
            <div className="flex-shrink-0 w-40 md:w-48 rounded-[14px] border-2 border-dashed border-[var(--color-border-muted)] flex items-center justify-center p-4 hover:border-[var(--color-brand)] transition-colors cursor-pointer">
              <div className="text-center space-y-2">
                <AppIcon name="plus" className="w-6 h-6 text-[var(--color-text-muted)]/40 mx-auto" />
                <p className="text-xs font-medium text-[var(--color-text-muted)]/60">Ver depósito completo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
