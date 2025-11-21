'use client'

import React from 'react'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import { PlannerSavedContent } from '@/app/hooks/usePlannerSavedContents'

type SavedContentDrawerProps = {
  open: boolean
  onClose: () => void
  item: PlannerSavedContent | null
}

const originLabels: Record<string, string> = {
  'rotina-leve': 'Rotina Leve',
  'autocuidado-inteligente': 'Autocuidado Inteligente',
  'como-estou-hoje': 'Como Estou Hoje',
  'cuidar-com-amor': 'Cuidar com Amor',
  'minhas-conquistas': 'Minhas Conquistas',
  'biblioteca-materna': 'Biblioteca Materna',
}

function formatDate(dateKey: string): string {
  try {
    const [year, month, day] = dateKey.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  } catch {
    return dateKey
  }
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function SavedContentDrawer({
  open,
  onClose,
  item,
}: SavedContentDrawerProps) {
  if (!open || !item) return null

  return (
    <ClientOnly>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.12)] p-4 md:p-6 max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5 gap-4">
            <div className="flex-1">
              <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-xs md:text-sm font-semibold tracking-wide text-[#ff005e] uppercase font-poppins">
                {originLabels[item.origin] || item.origin}
              </span>
              <h3 className="text-xl md:text-2xl font-semibold text-[#2f3a56] mt-3 font-poppins">
                {item.title}
              </h3>
              <p className="text-xs md:text-sm text-[#545454] mt-1">
                {capitalizeFirstLetter(formatDate(item.dateKey))}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg px-3 py-2 bg-[#f5f5f5] text-[#545454] font-medium text-sm hover:bg-[#efefef] transition-colors"
              aria-label="Fechar"
            >
              Fechar
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            {item.type === 'recipe' && item.payload && (
              <div className="space-y-4">
                {/* Recipe Meta */}
                <div className="flex flex-wrap gap-4">
                  {item.payload.timeLabel && (
                    <div>
                      <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide mb-1">
                        Tempo de preparo
                      </p>
                      <p className="text-sm md:text-base text-[#2f3a56]">
                        {item.payload.timeLabel}
                      </p>
                    </div>
                  )}
                  {item.payload.ageLabel && (
                    <div>
                      <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide mb-1">
                        Idade indicada
                      </p>
                      <p className="text-sm md:text-base text-[#2f3a56]">
                        {item.payload.ageLabel}
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {item.payload.description && (
                  <div>
                    <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide mb-2">
                      Descrição
                    </p>
                    <p className="text-sm text-[#545454] leading-relaxed">
                      {item.payload.description}
                    </p>
                  </div>
                )}

                {/* Preparation */}
                {item.payload.preparation && (
                  <div>
                    <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide mb-2">
                      Modo de preparo
                    </p>
                    <p className="text-sm text-[#545454] leading-relaxed whitespace-pre-wrap">
                      {item.payload.preparation}
                    </p>
                  </div>
                )}

                {/* Pediatrician note */}
                <p className="text-xs text-[#545454] italic bg-[#f5f5f5] p-3 rounded-lg">
                  💡 Lembre-se: adapte sempre ��s orientações do pediatra.
                </p>
              </div>
            )}

            {item.type === 'checklist' && item.payload && (
              <div className="space-y-4">
                {/* Description */}
                {item.payload.description && (
                  <div>
                    <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide mb-2">
                      Descrição
                    </p>
                    <p className="text-sm text-[#545454] leading-relaxed">
                      {item.payload.description}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {item.payload.actions && Array.isArray(item.payload.actions) && (
                  <div>
                    <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide mb-2">
                      Ações da rotina
                    </p>
                    <ul className="space-y-2">
                      {item.payload.actions.map((action: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <AppIcon
                            name="check-circle"
                            className="w-5 h-5 text-[#ff005e] flex-shrink-0 mt-0.5"
                          />
                          <span className="text-sm text-[#545454]">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {item.type === 'insight' && item.payload && (
              <div className="space-y-4">
                {item.payload.frase && (
                  <div>
                    <p className="text-base text-[#2f3a56] leading-relaxed font-medium">
                      {item.payload.frase}
                    </p>
                  </div>
                )}

                {item.payload.pequenoCuidado && (
                  <div className="text-sm text-[#545454]">
                    <p className="font-semibold text-[#2f3a56] mb-1">Pequeno cuidado:</p>
                    <p className="leading-relaxed">{item.payload.pequenoCuidado}</p>
                  </div>
                )}

                {item.payload.miniRitual && (
                  <div className="text-sm text-[#545454]">
                    <p className="font-semibold text-[#2f3a56] mb-1">Mini ritual:</p>
                    <p className="leading-relaxed">{item.payload.miniRitual}</p>
                  </div>
                )}

                {item.payload.description && (
                  <div>
                    <p className="text-sm text-[#545454] leading-relaxed">
                      {item.payload.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Generic fallback */}
            {!['recipe', 'checklist', 'insight'].includes(item.type) && (
              <div className="space-y-3">
                {item.payload && typeof item.payload === 'object' && (
                  <div className="text-sm text-[#545454] space-y-2">
                    {Object.entries(item.payload).map(([key, value]) => {
                      if (!value || typeof value === 'object') return null
                      return (
                        <div key={key}>
                          <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide mb-1">
                            {key}
                          </p>
                          <p className="text-sm text-[#545454]">{String(value)}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Button */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-full bg-gradient-to-r from-[#ff005e] via-[#ff2f78] to-[#ff6b9c] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(255,0,94,0.2)] hover:shadow-[0_6px_20px_rgba(255,0,94,0.3)] transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </ClientOnly>
  )
}

export default SavedContentDrawer
