'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { UpsellSheet } from '@/components/ui/UpsellSheet'
import { useEscapeToClose } from '@/components/hooks/useEscapeToClose'

export type Professional = {
  id: string
  nome: string
  especialidade: string
  bioCurta: string
  avatarUrl?: string
  cidade?: string
  whatsUrl?: string
  calendlyUrl?: string
  verificado?: boolean
  primeiraAvaliacaoGratuita?: boolean
  temas?: string[]
  precoHint?: string
}

export interface ProfessionalProfileSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  professional?: Professional
}

const FALLBACK_AVATAR = '/stickers/default.svg'

export function ProfessionalProfileSheet({
  open,
  onOpenChange,
  professional,
}: ProfessionalProfileSheetProps) {
  const [showUpsell, setShowUpsell] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Use hook for Escape key handling
  useEscapeToClose(open, () => onOpenChange(false))

  // Close on Escape and lock body scroll when open
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const originalStyle = body.style.overflow;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange?.(false);
    };

    body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      body.style.overflow = originalStyle;
    };
  }, [open, onOpenChange]);

  // Focus trap: keep focus within modal
  useEffect(() => {
    if (!open) return

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>

      if (!focusableElements || focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey) {
        // Shift + Tab (going backwards)
        if (activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab (going forwards)
        if (activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [open])

  // Focus close button on mount
  useEffect(() => {
    if (!open) return
    const el = document.getElementById('pps-close')
    if (el instanceof HTMLButtonElement) {
      setTimeout(() => el.focus(), 100)
    }
  }, [open])

  if (!open || !professional) return null

  const handleAgendar = () => {
    const whatsUrl = professional.whatsUrl
    const calendlyUrl = professional.calendlyUrl

    if (whatsUrl) {
      window.open(whatsUrl, '_blank')
      onOpenChange(false)
    } else if (calendlyUrl) {
      window.open(calendlyUrl, '_blank')
      onOpenChange(false)
    } else {
      setShowUpsell(true)
    }
  }

  const avatarSrc = professional.avatarUrl || FALLBACK_AVATAR
  const safeBadges = (
    [
      professional.verificado && 'Verificado Materna360',
      'Online',
      professional.primeiraAvaliacaoGratuita && 'Primeira avaliação gratuita',
    ] ?? []
  ).filter((b): b is string => typeof b === 'string' && b.trim().length > 0)

  const chips = (professional.temas ?? []).slice(0, 6)

  return (
    <>
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${
          open ? 'bg-black/40 opacity-100' : 'pointer-events-none bg-black/0 opacity-0'
        }`}
        onClick={() => onOpenChange(false)}
        aria-hidden
      />

      <div
        ref={modalRef}
        className={`fixed inset-x-0 bottom-0 z-50 flex items-end transition-transform duration-300 sm:inset-0 sm:items-center sm:justify-center ${
          open ? 'translate-y-0' : 'translate-y-full sm:translate-y-0 sm:scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="professional-modal-title"
      >
        <Card className="w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-screen bg-white animate-in slide-in-from-bottom-10">
          {/* Header with subtle gradient */}
          <div className="bg-gradient-to-b from-[#FFE5EF] to-white px-6 pt-6 pb-8">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-[0_4px_24px_rgba(47,58,86,0.08)]">
                <Image
                  src={avatarSrc}
                  alt={`Foto de ${professional.nome}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex-1">
                <h2 id="professional-modal-title" className="text-lg font-bold text-support-1">
                  {professional.nome}
                </h2>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-primary/80">
                  {professional.especialidade}
                </p>
                {professional.precoHint && (
                  <p className="mt-2 text-xs text-support-2 flex items-center gap-1.5">
                    <AppIcon name="dollar-sign" size={14} variant="muted" />
                    {professional.precoHint}
                  </p>
                )}
              </div>
            </div>

            {/* Badges */}
            {safeBadges.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {safeBadges.map((badge, idx) => (
                  <span
                    key={`badge-${badge}-${idx}`}
                    className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary flex items-center gap-1.5"
                  >

                    <AppIcon name="check" size={12} decorative /> {badge}

                    <Emoji char="✓" size={12} /> {badge}

                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Body - scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-5">
              {/* Bio */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-support-2/70">Sobre</h3>
                <p className="mt-2 text-sm leading-relaxed text-support-1">{professional.bioCurta}</p>
              </div>

              {/* Location & Format */}
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                <div className="space-y-2 text-sm text-support-2">
                  <p>
                    <span className="font-semibold text-support-1">Local:</span> Atendimento online
                  </p>
                  {professional.cidade && (
                    <p>
                      <span className="font-semibold text-support-1">Baseado em:</span> {professional.cidade}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags/Temas */}
              {chips.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-support-2/70">Especialidades</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-xs text-support-2"
                      >
                        #{chip}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer - sticky */}
          <div className="border-t border-white/60 bg-white/95 px-6 py-4 backdrop-blur-sm flex flex-col gap-3 sm:flex-row">
            <Button
              id="pps-close"
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5"
              aria-label="Fechar perfil"
              autoFocus
            >

              Voltar

              <Emoji char="←" size={14} /> Voltar

            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAgendar}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5"
              aria-label="Agendar atendimento"
            >
              Agendar
            </Button>
          </div>
        </Card>
      </div>

      {/* Upsell Sheet for missing URLs */}
      {showUpsell && (
        <UpsellSheet
          title={`Agendar com ${professional.nome}`}
          description="Entre em contato direto com este profissional via WhatsApp ou Calendly para marcar sua consultoria."
          planName="Plus ou Premium"
          features={[
            'Agendamento direto com especialistas verificados',
            'Suporte para escolher o melhor horário',
            'Histórico de atendimentos salvos',
            'Notificações de confirmação e lembretes',
          ]}
          onClose={() => setShowUpsell(false)}
          onUpgrade={() => {
            window.location.href = '/planos'
          }}
        />
      )}
    </>
  )
}
