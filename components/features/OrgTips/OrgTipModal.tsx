'use client'

import { useEffect, useMemo, useRef } from 'react'

import type { OrgTip } from '@/data/org-tips'
import { Button } from '@/components/ui/Button'

const FOCUSABLE_SELECTOR = [
  'a[href]','button','textarea','input','select','details','[tabindex]:not([tabindex="-1"])'
].join(',' )

type OrgTipModalProps = {
  tip: OrgTip
  open: boolean
  onClose: () => void
  onComplete: (tip: OrgTip) => void
}

export function OrgTipModal({ tip, open, onClose, onComplete }: OrgTipModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null

    const modalNode = modalRef.current
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'Tab' && modalNode) {
        const focusable = Array.from(modalNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
          (element) => element.offsetParent !== null || element === closeButtonRef.current
        )
        if (focusable.length === 0) {
          event.preventDefault()
          return
        }

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocusedElement.current?.focus?.()
    }
  }, [open, onClose])

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === backdropRef.current) {
      onClose()
    }
  }

  const modalTestId = useMemo(() => `modal-org-tip-${tip.id}`, [tip.id])

  if (!open) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`org-tip-modal-title-${tip.id}`}
      className="fixed inset-0 z-[1200] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8"
      ref={backdropRef}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        data-testid={modalTestId}
        className="relative mt-10 w-full max-w-[720px] rounded-3xl bg-white/95 p-6 shadow-elevated backdrop-blur md:p-8"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-support-1 shadow transition hover:bg-white"
        >
          ✕
        </button>

        <div className="flex items-center gap-3">
          <span aria-hidden className="text-2xl">
            {tip.icon}
          </span>
          <h2
            id={`org-tip-modal-title-${tip.id}`}
            className="text-lg md:text-[22px] font-extrabold leading-tight text-support-1"
          >
            {tip.title}
          </h2>
        </div>

        <p className="mt-3 text-[13.5px] md:text-[15px] leading-relaxed text-support-2">{tip.subtitle}</p>

        <div className="mt-6 space-y-3">
          {tip.steps.map((step, index) => {
            const checkboxId = `${tip.id}-step-${index}`
            return (
              <label
                key={checkboxId}
                htmlFor={checkboxId}
                className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-soft"
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded-md border-primary/30 text-primary focus:ring-primary/40"
                />
                <span className="text-sm font-medium leading-relaxed text-support-1">{step}</span>
              </label>
            )
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Button
            size="sm"
            variant="primary"
            onClick={() => onComplete(tip)}
            className="min-w-[124px]"
          >
            Concluir
          </Button>

          <button
            type="button"
            onClick={() => console.debug('planner:add:not-implemented', { id: tip.id })}
            className="text-sm font-semibold text-primary underline-offset-2 transition hover:underline"
          >
            Salvar como rotina semanal
          </button>
        </div>
      </div>
    </div>
  )
}
