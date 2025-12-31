'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'
type Energia = 'baixa' | 'media' | 'alta'
type Emocao = 'neutra' | 'sensivel' | 'tensa' | 'carente'
type Corpo = 'ok' | 'tenso' | 'cansado' | 'pedindo-pausa'

type Suggestion = {
  id: string
  title: string
  description: string
}

const DAILY_SUGGESTIONS: Suggestion[] = [
  {
    id: 'pausa-silencio',
    title: 'Pausa sem explicação',
    description: 'Permissão para não responder nada agora.',
  },
  {
    id: 'respirar-curto',
    title: 'Respirar por alguns instantes',
    description: 'Só parar e perceber a respiração por um momento.',
  },
  {
    id: 'corpo-apoio',
    title: 'Sentir o corpo',
    description: 'Apoie os pés no chão e solte os ombros.',
  },
  {
    id: 'nao-agora',
    title: 'Não fazer nada agora',
    description: 'Ficar aqui já é suficiente.',
  },
]

function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export default function Client() {
  const [ritmo, setRitmo] = useState<Ritmo | null>(null)
  const [energia, setEnergia] = useState<Energia | null>(null)
  const [emocao, setEmocao] = useState<Emocao | null>(null)
  const [corpo, setCorpo] = useState<Corpo | null>(null)

  const [cursor, setCursor] = useState(0)
  const [active, setActive] = useState<Suggestion | null>(null)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    try {
    track('cuidar_de_mim.open', {})
    } catch {}
  }, [])

  const todayKey = getTodayKey()

  const suggestion = useMemo(() => {
    const index = cursor % DAILY_SUGGESTIONS.length
    return DAILY_SUGGESTIONS[index]
  }, [cursor])

  function nextOption() {
    setCursor((c) => c + 1)
    try {
      track('cuidar_de_mim.other_option', {})
    } catch {}
  }

  function openSuggestion(s: Suggestion) {
    setActive(s)
    try {
      track('cuidar_de_mim.open_suggestion', { id: s.id })
    } catch {}
  }

  function closeHere() {
    setClosed(true)
    try {
     track('cuidar_de_mim.close', {})
    } catch {}
  }

  function saveToMyDay(title: string) {
    addTaskToMyDay({
      title,
      origin: 'selfcare',
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })
  }

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-32
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6">
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
                Um espaço para se respeitar
              </h1>

              <p className="text-sm md:text-base text-white/90 max-w-xl">
                Se quiser, escolha algo que ajude um pouco.  
                Se não fizer sentido, tudo bem.
              </p>
            </div>
          </header>

          <div className="space-y-7 pb-10">
            <SoftCard className="p-6 rounded-3xl bg-white/95 border border-[#f5d7e5]">
              {!active && !closed && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="text-[13px] font-semibold text-[#2f3a56]">
                      Se quiser, um check-in
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(['leve', 'cansada', 'animada', 'sobrecarregada'] as Ritmo[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRitmo(r)}
                          className="rounded-full border px-3 py-2 text-[12px]"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-semibold text-[#2f3a56]">
                          {suggestion.title}
                        </div>
                        <div className="text-[13px] text-[#6a6a6a]">
                          {suggestion.description}
                        </div>
                      </div>
                      <button
                        onClick={nextOption}
                        className="rounded-full border px-3 py-2 text-[12px]"
                      >
                        Outra opção
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openSuggestion(suggestion)}
                        className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px]"
                      >
                        Quero tentar agora
                      </button>
                      <button
                        onClick={closeHere}
                        className="rounded-full border px-4 py-2 text-[12px]"
                      >
                        Encerrar por aqui
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {active && (
                <div className="space-y-4">
                  <div className="text-[16px] font-semibold text-[#2f3a56]">
                    {active.title}
                  </div>
                  <div className="text-[13px] text-[#6a6a6a]">
                    {active.description}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => saveToMyDay(active.title)}
                      className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px]"
                    >
                      Salvar no Meu Dia
                    </button>
                    <button
                      onClick={closeHere}
                      className="rounded-full border px-4 py-2 text-[12px]"
                    >
                      Encerrar por aqui
                    </button>
                  </div>
                </div>
              )}

              {closed && (
                <div className="space-y-3">
                  <div className="text-[14px] font-semibold text-[#2f3a56]">
                    Isso já é suficiente por agora.
                  </div>
                  <Link
                    href="/maternar"
                    className="inline-block rounded-full border px-4 py-2 text-[12px]"
                  >
                    Voltar ao Maternar
                  </Link>
                </div>
              )}
            </SoftCard>

            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
