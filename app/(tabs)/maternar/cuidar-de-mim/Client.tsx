'use client'

import * as React from 'react'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'

import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'
import { track } from '@/app/lib/telemetry'

import { getEu360Signal } from '@/app/lib/eu360Signals.client'
import { consumeRecentMyDaySave } from '@/app/lib/myDayContinuity.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Client() {
  const euSignal = useMemo(() => getEu360Signal(), [])
  const recentSave = useMemo(() => consumeRecentMyDaySave(), [])

  useEffect(() => {
    try {
      track('cuidar_de_mim.open', {
        persona: euSignal.personaId ?? 'none',
        tone: euSignal.tone,
        hasRecentSave: !!recentSave,
      })
    } catch {}
  }, [euSignal, recentSave])

  function renderContinuation() {
    if (!recentSave) {
      return (
        <SoftCard className="p-5 rounded-3xl bg-white border border-[#f5d7e5]">
          <div className="text-[14px] font-semibold text-[#2f3a56]">
            Seu dia está em aberto
          </div>
          <p className="mt-2 text-[13px] text-[#6a6a6a]">
            Você pode começar organizando o dia ou seguir para o que fizer mais sentido agora.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/meu-dia" className="btn-primary">
              Ir para Meu Dia
            </Link>
            <Link href="/maternar/meu-filho" className="btn-secondary">
              Ir para Meu Filho
            </Link>
          </div>
        </SoftCard>
      )
    }

    return (
      <SoftCard className="p-5 rounded-3xl bg-white border border-[#f5d7e5]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#ffd8e6] flex items-center justify-center">
            <AppIcon name="bookmark" size={18} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#2f3a56]">
              Você já começou algo
            </div>
            <div className="text-[12px] text-[#6a6a6a]">
              Quer retomar de onde parou?
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/meu-dia" className="btn-primary">
            Retomar
          </Link>
          <Link href="/meu-dia" className="btn-secondary">
            Organizar agora
          </Link>
        </div>
      </SoftCard>
    )
  }

  return (
    <ClientOnly>
      <main className="min-h-[100dvh] pb-32">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <header className="pt-8 md:pt-10 mb-6">
            <Link
              href="/maternar"
              className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-2"
            >
              ← Voltar para o Maternar
            </Link>

            <h1 className="text-2xl md:text-3xl font-semibold text-white">
              Cuidar de Mim
            </h1>

            <p className="mt-2 text-sm text-white/90 max-w-xl">
              Um espaço para se orientar, sem cobrança.
            </p>
          </header>

          <section className="space-y-6">
            {renderContinuation()}

            <SoftCard className="p-5 rounded-3xl bg-[#fff7fb] border border-[#f5d7e5]">
              <p className="text-[13px] text-[#6a6a6a]">
                Quando você se orienta, o resto do dia fica mais leve.
              </p>
            </SoftCard>
          </section>

          <div className="mt-8">
            <LegalFooter />
          </div>
        </div>
      </main>
    </ClientOnly>
  )
}
