'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'

interface UpsellSheetProps {
  title: string
  description: string
  features: string[]
  planName: string
  onClose: () => void
  onUpgrade: () => void
}

export function UpsellSheet({
  title,
  description,
  features,
  planName,
  onClose,
  onUpgrade,
}: UpsellSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <Card className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 md:p-8 animate-in slide-in-from-bottom-10">
        <div className="space-y-6">
          <div>
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-support-2 hover:text-support-1"
            >
              ✕
            </button>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
              🔓 Desbloquear recurso
            </p>
            <h2 className="mt-2 text-2xl font-bold text-support-1">{title}</h2>
            <p className="mt-2 text-sm text-support-2">{description}</p>
          </div>

          <div className="rounded-2xl bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-support-2">
              Disponível no plano:
            </p>
            <p className="mt-2 text-xl font-bold text-primary">{planName}</p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-support-2">
              Você também terá:
            </p>
            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-support-1">
                  <span className="mt-0.5 flex-shrink-0"><Emoji char="✨" size={12} /></span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" size="sm" onClick={onClose} className="flex-1">
              Agora não
            </Button>
            <Button variant="primary" size="sm" onClick={onUpgrade} className="flex-1">
              Ver Planos
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
