'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
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
  source?: 'eu360' | 'ai' | 'fallback'
}

const DAILY_SUGGESTIONS: Suggestion[] = [
  { id: 'pausa-silencio', title: 'Pausa sem explicação', description: 'Permissão para não responder nada agora.', source: 'fallback' },
  { id: 'respirar-curto', title: 'Respirar por alguns instantes', description: 'Só parar e perceber a respiração por um momento.', source: 'fallback' },
  { id: 'corpo-apoio', title: 'Sentir o corpo', description: 'Apoie os pés no chão e solte os ombros.', source: 'fallback' },
  { id: 'nao-agora', title: 'Não fazer nada agora', description: 'Ficar aqui já é suficiente.', source: 'fallback' },
]

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function hashToInt(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function rotate<T>(arr: T[], by: number) {
  if (!arr.length) return arr
  const n = ((by % arr.length) + arr.length) % arr.length
  return [...arr.slice(n), ...arr.slice(0, n)]
}

export default function Client() {
  const [ritmo, setRitmo] = useState<Ritmo | null>(null)
  const [energia, setEnergia] = useState<Energia | null>(null)
  const [emocao, setEmocao] = useState<Emocao | null>(null)
  const [corpo, setCorpo] = useState<Corpo | null>(null)

  const [showCheckin, setShowCheckin] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [seen, setSeen] = useState<string[]>([])
  const [active, setActive] = useState<Suggestion | null>(null)
  const [closed, setClosed] = useState(false)

  const day = useMemo(() => todayKey(), [])
  const seed = useMemo(() => hashToInt(day), [day])

  const LS_CURSOR = `cdm_cursor_${day}`
  const LS_SEEN = `cdm_seen_${day}`

  useEffect(() => {
    try {
      const c = Number(localStorage.getItem(LS_CURSOR) || 0)
      const s = JSON.parse(localStorage.getItem(LS_SEEN) || '[]')
      setCursor(Number.isFinite(c) ? c : 0)
      setSeen(Array.isArray(s) ? s : [])
    } catch {}
  }, [LS_CURSOR, LS_SEEN])

  useEffect(() => {
    try {
      track('cuidar_de_mim.open', { day })
    } catch {}
  }, [day])

  const deck = useMemo(() => {
    const start = seed % (DAILY_SUGGESTIONS.length || 1)
    return rotate(DAILY_SUGGESTIONS, start)
  }, [seed])

  const suggestion = useMemo(() => {
    if (!deck.length) return null
    for (let i = 0; i < deck.length; i++) {
      const idx = (cursor + i) % deck.length
      if (!seen.includes(deck[idx].id)) return deck[idx]
    }
    return deck[cursor % deck.length]
  }, [deck, cursor, seen])

  function persistCursor(v: number) {
    setCursor(v)
    try { localStorage.setItem(LS_CURSOR, String(v)) } catch {}
  }

  function persistSeen(v: string[]) {
    setSeen(v)
    try { localStorage.setItem(LS_SEEN, JSON.stringify(v)) } catch {}
  }

  function nextOption() {
    if (!deck.length) return
    const len = deck.length
    let next = (cursor + 1) % len

    for (let i = 0; i < len; i++) {
      const idx = (cursor + 1 + i) % len
      if (!seen.includes(deck[idx].id)) {
        next = idx
        break
      }
    }

    persistCursor(next)
    try { track('cuidar_de_mim.other_option', { day }) } catch {}
  }

  function openSuggestion(s: Suggestion) {
    setActive(s)
    if (!seen.includes(s.id)) persistSeen([...seen, s.id])
    try { track('cuidar_de_mim.open_suggestion', { id: s.id, day, source: s.source }) } catch {}
  }

  function closeHere() {
    setClosed(true)
    try { track('cuidar_de_mim.close', { day }) } catch {}
  }

  function saveToMyDay(title: string) {
    addTaskToMyDay({
      title,
      origin: 'selfcare',
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })
    try { track('cuidar_de_mim.save', { day }) } catch {}
  }

  function chip(active: boolean) {
    return [
      'rounded-full border px-3 py-2 text-[12px] transition',
      active ? 'bg-[#ffe1f1] border-[#f5d7e5] text-[#2f3a56]' : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#fff0f7]',
    ].join(' ')
  }

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh] pb-32
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          {/* CAPA — PADRÃO HUB */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <Link href="/maternar" className="inline-flex items-center text-[12px] text-white/85 mb-2">
              ← Voltar para o Maternar
            </Link>

            <SoftCard className="p-6 md:p-7 bg-white/95 border border-[#f5d7e5] rounded-3xl shadow-[0_10px_26px_rgba(184,35,107,0.12)]">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                  <AppIcon name="heart" size={24} className="text-[#fd2597]" />
                </div>
                <div className="space-y-1">
                  <span className="inline-flex rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold text-[#b8236b]">
                    Para você
                  </span>
                  <h1 className="text-xl md:text-2xl font-semibold text-[#2f3a56]">
                    Cuidar de Mim
                  </h1>
                  <p className="text-[13px] text-[#6a6a6a]">
                    Leve · 3–5 minutos · foco em você
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[15px] text-[#545454] max-w-xl">
                Um espaço de acolhimento e pausas que cabem no seu dia.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => openSuggestion(suggestion!)}>Começar agora</Button>
                <Button variant="secondary" onClick={() => setShowCheckin((v) => !v)}>
                  Ajustar
                </Button>
              </div>
            </SoftCard>
          </header>

          <div className="space-y-7">
            {/* CHECK-IN — COLAPSADO */}
            {showCheckin && (
              <SoftCard className="p-5 rounded-2xl bg-white/95 border border-[#f5d7e5]">
                <div className="space-y-4">
                  <div className="text-[14px] font-semibold text-[#2f3a56]">Se quiser, um check-in</div>

                  <div className="space-y-2">
                    <div className="text-[12px] text-[#6a6a6a]">Ritmo</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(['leve','cansada','animada','sobrecarregada'] as Ritmo[]).map(r => (
                        <button key={r} onClick={() => setRitmo(r)} className={chip(ritmo===r)}>{r}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[12px] text-[#6a6a6a]">Energia</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['baixa','media','alta'] as Energia[]).map(e => (
                        <button key={e} onClick={() => setEnergia(e)} className={chip(energia===e)}>{e}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[12px] text-[#6a6a6a]">Emoção</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(['neutra','sensivel','tensa','carente'] as Emocao[]).map(e => (
                        <button key={e} onClick={() => setEmocao(e)} className={chip(emocao===e)}>{e}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[12px] text-[#6a6a6a]">Corpo</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(['ok','tenso','cansado','pedindo-pausa'] as Corpo[]).map(c => (
                        <button key={c} onClick={() => setCorpo(c)} className={chip(corpo===c)}>
                          {c === 'pedindo-pausa' ? 'pedindo pausa' : c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SoftCard>
            )}

            {/* DECK — SUGESTÃO DO DIA */}
            {!active && !closed && suggestion && (
              <SoftCard className="p-5 rounded-2xl bg-white/95 border border-[#f5d7e5]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold text-[#2f3a56]">{suggestion.title}</div>
                    <div className="text-[13px] text-[#6a6a6a]">{suggestion.description}</div>
                  </div>
                  <button onClick={nextOption} className="rounded-full border px-3 py-2 text-[12px]">
                    Outra opção
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button onClick={() => openSuggestion(suggestion)}>Quero tentar agora</Button>
                  <Button variant="secondary" onClick={closeHere}>Encerrar por aqui</Button>
                </div>
              </SoftCard>
            )}

            {/* EXPERIÊNCIA */}
            {active && (
              <SoftCard className="p-6 rounded-2xl bg-white/95 border border-[#f5d7e5]">
                <div className="space-y-3">
                  <div className="text-[16px] font-semibold text-[#2f3a56]">{active.title}</div>
                  <div className="text-[13px] text-[#6a6a6a]">{active.description}</div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => saveToMyDay(active.title)}>Salvar no Meu Dia</Button>
                    <Button variant="secondary" onClick={closeHere}>Encerrar</Button>
                  </div>
                </div>
              </SoftCard>
            )}

            {/* ENCERRAMENTO */}
            {closed && (
              <SoftCard className="p-5 rounded-2xl bg-white/95 border border-[#f5d7e5]">
                <div className="space-y-3">
                  <div className="text-[14px] font-semibold text-[#2f3a56]">
                    Isso já é suficiente por agora.
                  </div>
                  <Link href="/maternar">
                    <Button variant="secondary">Voltar ao Maternar</Button>
                  </Link>
                </div>
              </SoftCard>
            )}

            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
