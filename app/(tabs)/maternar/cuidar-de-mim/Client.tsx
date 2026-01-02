'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import AppIcon from '@/components/ui/AppIcon'

/* =========================
   Tipos leves
========================= */
type EmotionalState = 'ok' | 'tranquila' | 'cansada' | 'confusa'

type DaySummary = {
  savedCount: number
  hasCommitment: boolean
  hasPending: boolean
}

/* =========================
   Mock de integração (por enquanto)
   depois pluga com dados reais
========================= */
function getDaySummary(): DaySummary {
  return {
    savedCount: 2,
    hasCommitment: true,
    hasPending: true,
  }
}

function getGuidance(state: EmotionalState): string {
  switch (state) {
    case 'cansada':
      return 'Hoje parece um dia para manter o básico.'
    case 'confusa':
      return 'Não é um bom momento para decidir tudo.'
    case 'tranquila':
      return 'Você pode seguir sem se cobrar mais.'
    default:
      return 'Um passo simples já é suficiente hoje.'
  }
}

/* =========================
   Componente
========================= */
export default function Client() {
  const [emotion, setEmotion] = useState<EmotionalState>('ok')
  const summary = useMemo(() => getDaySummary(), [])

  useEffect(() => {
    track('nav.view', { page: 'cuidar-de-mim' })
  }, [])

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="min-h-[100dvh] pb-32"
    >
      <ClientOnly>
        <div className="page-shell">

          {/* HEADER */}
          <header className="pt-8 md:pt-10 mb-10">
            <Link
              href="/maternar"
              className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-3"
            >
              <span className="mr-1.5 text-lg leading-none">←</span>
              Voltar para o Maternar
            </Link>

            <h1 className="m360-title-page text-white">
              Cuidar de Mim
            </h1>

            <p className="mt-2 text-white/90 max-w-xl">
              Um espaço para pausar, entender o dia como ele está e seguir com mais clareza.
            </p>
          </header>

          {/* CONTAINER ÚNICO */}
          <section
            className="
              rounded-[28px]
              bg-white/95
              border border-[#f5d7e5]
              shadow-[0_10px_30px_rgba(184,35,107,0.12)]
              p-6 md:p-8
              space-y-10
            "
          >

            {/* BLOCO 1 — CHECK-IN */}
            <div>
              <p className="text-[13px] font-semibold text-[#b8236b] mb-3">
                Como você está agora?
              </p>

              <div className="flex flex-wrap gap-2">
                {(['tranquila', 'cansada', 'confusa', 'ok'] as EmotionalState[]).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmotion(e)}
                    className={[
                      'rounded-full px-4 py-2 text-[12px] transition',
                      emotion === e
                        ? 'bg-[#ffd8e6] text-[#2f3a56]'
                        : 'bg-white border border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
                    ].join(' ')}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* BLOCO 2 — ORIENTAÇÃO */}
            <div>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center">
                  <AppIcon name="compass" size={20} className="text-[#b8236b]" />
                </div>

                <div>
                  <p className="text-[15px] font-medium text-[#2f3a56] leading-relaxed max-w-xl">
                    {getGuidance(emotion)}
                  </p>

                  <p className="mt-2 text-[13px] text-[#6a6a6a]">
                    Seu dia não precisa render para valer.
                  </p>
                </div>
              </div>
            </div>

            {/* BLOCO 3 — SEU DIA COMO ESTÁ */}
            <div className="border-t border-[#f5d7e5] pt-6">
              <p className="text-[13px] font-semibold text-[#b8236b] mb-3">
                Seu dia, do jeito que está
              </p>

              <ul className="space-y-2 text-[14px] text-[#545454]">
                <li>• Você salvou {summary.savedCount} coisas hoje</li>
                {summary.hasCommitment && <li>• Existe 1 compromisso registrado</li>}
                {summary.hasPending && <li>• Algo ficou para depois</li>}
              </ul>
            </div>

            {/* BLOCO 4 — MICRO CUIDADO */}
            <div className="border-t border-[#f5d7e5] pt-6">
              <p className="text-[13px] text-[#6a6a6a]">
                Se fizer sentido agora: um gole d’água já ajuda.
              </p>
            </div>

          </section>

          <div className="mt-10">
            <LegalFooter />
          </div>

        </div>
      </ClientOnly>
    </main>
  )
}
