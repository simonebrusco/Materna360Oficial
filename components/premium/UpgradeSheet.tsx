'use client'

import * as React from 'react'
import { Button } from '@/components/ui/Button'
import { upgradeToPremium } from '@/app/lib/plan'

type Props = { open: boolean; onOpenChange: (b: boolean) => void }

export default function UpgradeSheet({ open, onOpenChange }: Props) {
  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    if (open) document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-2xl bg-white shadow-lg p-4 sm:p-5 transition ease-out duration-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-support-1">Desbloquear Premium</h3>
            <p className="text-sm text-support-2 mt-1">PDF avançado, coach completo e mais.</p>
          </div>
          <button
            aria-label="Fechar"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-support-3/20 transition-colors"
            onClick={() => onOpenChange(false)}
          >
            ✕
          </button>
        </div>
        <ul className="text-sm text-support-2 mt-3 list-disc pl-5 space-y-1">
          <li>Export PDF v2 (capa + sumário + blocos semanais)</li>
          <li>Insights semanais completos</li>
          <li>Suporte prioritário</li>
        </ul>
        <div className="mt-4 flex gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              upgradeToPremium()
              onOpenChange(false)
            }}
          >
            Upgrade agora
          </Button>
          <Button variant="secondary" size="md" onClick={() => onOpenChange(false)}>
            Depois
          </Button>
        </div>
      </div>
    </div>
  )
}
