'use client'

import { useState, useEffect } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { save, load } from '@/app/lib/persist'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { trackTelemetry } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'

export default function NotasPage() {
  const [notes, setNotes] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)
  const dateKey = getBrazilDateKey()

  useEffect(() => {
    setIsHydrated(true)
    const storageKey = `meu-dia:${dateKey}:notes`
    const savedNotes = load<string>(storageKey, '')
    if (typeof savedNotes === 'string') {
      setNotes(savedNotes)
    }
  }, [dateKey])

  const handleNotesChange = (value: string) => {
    setNotes(value)
    const storageKey = `meu-dia:${dateKey}:notes`
    save(storageKey, value)

    try {
      trackTelemetry('notas.updated', {
        page: 'notas',
        length: value.length,
      })
    } catch {}
  }

  if (!isHydrated) {
    return (
      <PageTemplate label="MEU DIA" title="Notas do Dia" subtitle="Desabafe em poucas palavras.">
        <div className="max-w-2xl h-64 bg-white/50 rounded-3xl animate-pulse" />
      </PageTemplate>
    )
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Notas do Dia"
      subtitle="Desabafe em poucas palavras."
    >
      <ClientOnly>
        <div className="max-w-2xl">
          <div className="mb-8">
            <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
              Este é um espaço só seu. Escreva o que estiver sentindo, seus pensamentos importantes ou lembretes que não quer esquecer.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8">
            <h3 className="text-lg font-semibold text-[#2f3a56] mb-6">Deixe sua nota</h3>

            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Escreva seus pensamentos, sentimentos ou o que for importante para você hoje..."
              className="w-full rounded-2xl border border-[#FFD8E6] bg-white px-4 py-4 text-sm text-[#2f3a56] shadow-soft placeholder-[#999] focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={8}
            />

            <div className="mt-4">
              <p className="text-xs text-[#999]">
                ✓ Seus registros são privados e seguros. Eles são armazenados localmente em seu dispositivo.
              </p>
            </div>

            {notes.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-100">
                <p className="text-xs font-medium text-green-700">
                  Nota salva automaticamente • {notes.length} caracteres
                </p>
              </div>
            )}
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
