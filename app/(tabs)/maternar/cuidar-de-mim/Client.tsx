'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
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

type SuggestionSource = 'local' | 'eu360' | 'ai'

type Suggestion = {
  id: string
  title: string
  description: string
  source: SuggestionSource
}

const DAILY_SUGGESTIONS: Omit<Suggestion, 'source'>[] = [
  { id: 'pausa-silencio', title: 'Pausa sem explicação', description: 'Permissão para não responder nada agora.' },
  { id: 'respirar-curto', title: 'Respirar por alguns instantes', description: 'Só parar e perceber a respiração por um momento.' },
  { id: 'corpo-apoio', title: 'Sentir o corpo', description: 'Apoie os pés no chão e solte os ombros.' },
  { id: 'nao-agora', title: 'Não fazer nada agora', description: 'Ficar aqui já é suficiente.' },
]

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  } catch {}
}

function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function getTodayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// hash simples e auditável (determinismo diário)
function hashStringToInt(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function rotate<T>(arr: T[], by: number) {
  if (arr.length === 0) return arr
  const n = ((by % arr.length) + arr.length) % arr.length
  return [...arr.slice(n), ...arr.slice(0, n)]
}

function scrollToId(id: string) {
  if (typeof window === 'undefined') return
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Provider “pronto para IA/Eu360”:
 * hoje: deck local determinístico.
 * amanhã: você troca a fonte mantendo o mesmo shape (Suggestion).
 */
function buildDailyDeck(todayKey: string): Suggestion[] {
  const seed = hashStringToInt(todayKey)
  const start = seed % (DAILY_SUGGESTIONS.length || 1)
  const rotated = rotate(DAILY_SUGGESTIONS, start)
  return rotated.map((s) => ({ ...s, source: 'local' as const }))
}

export default function Client() {
  // Check-in (camada 1)
  const [ritmo, setRitmo] = useState<Ritmo | null>(null)
  const [energia, setEnergia] = useState<Energia | null>(null)
  const [emocao, setEmocao] = useState<Emocao | null>(null)
  const [corpo, setCorpo] = useState<Corpo | null>(null)

  // Deck diário (camada 2)
  const [cursor, setCursor] = useState(0)
  const [seen, setSeen] = useState<string[]>([])

  // Estados de experiência
  const [active, setActive] = useState<Suggestion | null>(null)
  const [closed, setClosed] = useState(false)
  const [showCheckin, setShowCheckin] = useState(false)

  const todayKey = useMemo(() => getTodayKey(), [])
  const LS_CURSOR = useMemo(() => `cuidar_de_mim_cursor_${todayKey}`, [todayKey])
  const LS_SEEN = useMemo(() => `cuidar_de_mim_seen_${todayKey}`, [todayKey])

  // init persistência diária (cursor/seen)
  useEffect(() => {
    const storedCursor = parseInt(safeGetLS(LS_CURSOR) ?? '0', 10)
    const storedSeen = parseJSON<string[]>(safeGetLS(LS_SEEN), [])
    setCursor(Number.isFinite(storedCursor) ? storedCursor : 0)
    setSeen(Array.isArray(storedSeen) ? storedSeen : [])
  }, [LS_CURSOR, LS_SEEN])

  useEffect(() => {
    try {
      track('cuidar_de_mim.open', { day: todayKey })
    } catch {}
  }, [todayKey])

  // puxar defaults do Eu360 (sem mudar layout; só “encaixe”)
  useEffect(() => {
    const focoRitmo = safeGetLS('eu360_ritmo')
    if (focoRitmo === 'leve' || focoRitmo === 'cansada' || focoRitmo === 'animada' || focoRitmo === 'sobrecarregada') {
      setRitmo(focoRitmo)
    }
  }, [])

  const deck = useMemo(() => buildDailyDeck(todayKey), [todayKey])

  const suggestion = useMemo(() => {
    if (deck.length === 0) return null
    const len = deck.length

    // pega a próxima não vista a partir do cursor
    for (let step = 0; step < len; step++) {
      const idx = (cursor + step) % len
      const s = deck[idx]
      if (!seen.includes(s.id)) return s
    }

    // se todas vistas, permite repetir (sem UI de “coleção”)
    return deck[cursor % len]
  }, [deck, cursor, seen])

  function persistCursor(next: number) {
    setCursor(next)
    safeSetLS(LS_CURSOR, String(next))
  }

  function persistSeen(nextSeen: string[]) {
    setSeen(nextSeen)
    safeSetLS(LS_SEEN, JSON.stringify(nextSeen))
  }

  function nextOption() {
    if (!deck.length) return
    const len = deck.length

    let nextCursor = (cursor + 1) % len
    let found = false

    for (let step = 0; step < len; step++) {
      const idx = (cursor + 1 + step) % len
      const s = deck[idx]
      if (!seen.includes(s.id)) {
        nextCursor = idx
        found = true
        break
      }
    }

    // se não achou (todas vistas), reseta seen do dia e avança
    if (!found) {
      persistSeen([])
      nextCursor = (cursor + 1) % len
    }

    persistCursor(nextCursor)

    try {
      track('cuidar_de_mim.other_option', { day: todayKey })
    } catch {}
  }

  function openSuggestion(s: Suggestion) {
    setActive(s)

    // marca como vista hoje (anti-repetição real)
    if (!seen.includes(s.id)) {
      const nextSeen = [...seen, s.id]
      persistSeen(nextSeen)
    }

    try {
      track('cuidar_de_mim.open_suggestion', { id: s.id, day: todayKey, source: s.source })
    } catch {}
  }

  function closeHere() {
    setClosed(true)
    try {
      track('cuidar_de_mim.close', { day: todayKey })
    } catch {}
  }

  function saveToMyDay(title: string) {
    const res = addTaskToMyDay({
      title,
      origin: 'selfcare',
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })

    try {
      track('cuidar_de_mim.save_to_my_day', {
        day: todayKey,
        created: res.created,
        dateKey: res.dateKey,
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })
    } catch {}
  }

  // Visual premium consistente (chips)
  function chipClass(activeChip: boolean) {
    return [
      'rounded-full border px-3.5 py-2 text-[12px] transition text-center',
      activeChip
        ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
        : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
    ].join(' ')
  }

  // CTAs da capa
  function onStartNow() {
    if (closed) setClosed(false)
    if (suggestion) openSuggestion(suggestion)
    else setShowCheckin(true)

    try {
      track('cuidar_de_mim.start_now', { day: todayKey })
    } catch {}
  }

  function onAdjust() {
    setShowCheckin(true)
    // respeita âncora do hub
    scrollToId('ritmo')
    try {
      track('cuidar_de_mim.adjust', { day: todayKey })
    } catch {}
  }

  // persistir check-in (para IA/Eu360 consumirem depois)
  useEffect(() => {
    // salva escolhas (sem forçar preenchimento)
    safeSetLS(`cuidar_de_mim_checkin_${todayKey}`, JSON.stringify({ ritmo, energia, emocao, corpo }))

    // mantém compatibilidade com Eu360 (o app “inteligência”)
    if (ritmo) safeSetLS('eu360_ritmo', ritmo)

    try {
      track('cuidar_de_mim.checkin.change', { day: todayKey, ritmo: ritmo ?? null, energia: energia ?? null, emocao: emocao ?? null, corpo: corpo ?? null })
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ritmo, energia, emocao, corpo])

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
          {/* HEADER (mantém padrão da página, sem inventar) */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Um espaço para se respeitar
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Se quiser, escolha algo que ajude um pouco. Se não fizer sentido, tudo bem.
              </p>
            </div>
          </header>

          <div className="space-y-7 md:space-y-8 pb-10">
            {/* PAINEL GLASS (mesmo padrão do Materna) */}
            <div
              className="
                rounded-3xl
                bg-white/10
                border border-white/35
                backdrop-blur-xl
                shadow-[0_18px_45px_rgba(184,35,107,0.25)]
                p-4 md:p-6
                space-y-6 md:space-y-7
              "
            >
              {/* SOFTCARD PRINCIPAL (um só, premium) */}
              <SoftCard
                className="
                  relative z-10 pointer-events-auto
                  p-5 md:p-6 rounded-3xl
                  bg-white/95
                  border border-[#f5d7e5]
                  shadow-[0_10px_28px_rgba(184,35,107,0.12)]
                  space-y-5
                "
              >
                {/* CAPA NO PADRÃO HUB (sem reinventar) */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                      <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                    </div>

                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                        Para você
                      </span>

                      <h2 className="text-xl md:text-2xl font-semibold text-[#2f3a56] leading-tight">
                        Cuidar de Mim
                      </h2>

                      <p className="text-[13px] text-[#6a6a6a]">
                        Leve · 3–5 minutos · foco em você
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={onStartNow}
                      className="
                        rounded-full
                        bg-[#fd2597]
                        text-white
                        px-5 py-2.5
                        text-[12px]
                        shadow-[0_10px_26px_rgba(253,37,151,0.35)]
                        hover:opacity-95
                        transition
                      "
                    >
                      Começar agora
                    </button>

                    <button
                      type="button"
                      onClick={onAdjust}
                      className="
                        rounded-full
                        bg-white
                        border border-[#f5d7e5]
                        text-[#2f3a56]
                        px-5 py-2.5
                        text-[12px]
                        hover:bg-[#ffe1f1]
                        transition
                      "
                    >
                      Ajustar
                    </button>
                  </div>
                </div>

                <p className="text-[15px] text-[#545454] leading-relaxed">
                  Um espaço de acolhimento e pausas que cabem no seu dia.
                </p>

                {/* CHECK-IN (camada 1) — aparece quando pede “Ajustar” ou se quiser */}
                {showCheckin ? (
                  <div
                    id="ritmo"
                    className="
                      scroll-mt-28
                      rounded-3xl bg-[#fff7fb]
                      border border-[#f5d7e5]
                      p-5 md:p-6
                      space-y-4
                    "
                  >
                    <div>
                      <div className="text-[14px] font-semibold text-[#2f3a56]">Se quiser, um check-in</div>
                      <div className="text-[12px] text-[#6a6a6a] mt-1">
                        Pode ser só uma coisa. Pode pular tudo. Não existe “incompleto”.
                      </div>
                    </div>

                    {/* Ritmo */}
                    <div className="space-y-2">
                      <div className="text-[12px] text-[#6a6a6a]">Ritmo</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(['leve', 'cansada', 'animada', 'sobrecarregada'] as Ritmo[]).map((r) => (
                          <button key={r} type="button" onClick={() => setRitmo(r)} className={chipClass(ritmo === r)}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Energia */}
                    <div className="space-y-2">
                      <div className="text-[12px] text-[#6a6a6a]">Energia</div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['baixa', 'media', 'alta'] as Energia[]).map((e) => (
                          <button key={e} type="button" onClick={() => setEnergia(e)} className={chipClass(energia === e)}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Emoção */}
                    <div className="space-y-2">
                      <div className="text-[12px] text-[#6a6a6a]">Emoção</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(['neutra', 'sensivel', 'tensa', 'carente'] as Emocao[]).map((em) => (
                          <button key={em} type="button" onClick={() => setEmocao(em)} className={chipClass(emocao === em)}>
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Corpo */}
                    <div className="space-y-2">
                      <div className="text-[12px] text-[#6a6a6a]">Corpo</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(['ok', 'tenso', 'cansado', 'pedindo-pausa'] as Corpo[]).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCorpo(c)}
                            className={chipClass(corpo === c)}
                          >
                            {c === 'pedindo-pausa' ? 'pedindo pausa' : c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCheckin(false)
                          if (suggestion) openSuggestion(suggestion)
                          scrollToId('pausas')
                        }}
                        className="
                          rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px]
                          shadow-lg hover:opacity-95 transition
                        "
                      >
                        Aplicar e ver uma sugestão
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCheckin(false)}
                        className="
                          rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px]
                          hover:bg-[#ffe1f1] transition
                        "
                      >
                        Fechar check-in
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* SUGESTÃO (camada 2) — deck determinístico diário + anti-repetição */}
                {!closed ? (
                  <div
                    id="pausas"
                    className="
                      scroll-mt-28
                      rounded-3xl
                      bg-[#fff7fb]
                      border border-[#f5d7e5]
                      p-5 md:p-6
                      space-y-4
                    "
                  >
                    {!active ? (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">
                              sugestão pronta
                            </div>
                            <div className="text-[16px] md:text-[18px] font-semibold text-[#2f3a56] mt-1 leading-snug">
                              {suggestion?.title ?? 'Uma possibilidade agora'}
                            </div>
                            <div className="text-[13px] text-[#6a6a6a] mt-1 leading-relaxed">
                              {suggestion?.description ?? 'Sem obrigação. Só se fizer sentido.'}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={nextOption}
                            className="
                              rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56]
                              px-3 py-2 text-[12px] hover:bg-[#ffe1f1] transition shrink-0
                            "
                          >
                            Outra opção
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                          <button
                            type="button"
                            onClick={() => (suggestion ? openSuggestion(suggestion) : undefined)}
                            className="
                              rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px]
                              shadow-lg hover:opacity-95 transition
                            "
                          >
                            Quero tentar agora
                          </button>

                          <button
                            type="button"
                            onClick={closeHere}
                            className="
                              rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px]
                              hover:bg-[#ffe1f1] transition
                            "
                          >
                            Encerrar por aqui
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowCheckin(true)}
                            className="
                              rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px]
                              hover:bg-[#ffe1f1] transition
                            "
                          >
                            Ajustar check-in
                          </button>
                        </div>

                        <div className="text-[12px] text-[#6a6a6a]">
                          Regra do Materna: uma pausa já conta. Não precisa fazer tudo.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[16px] md:text-[18px] font-semibold text-[#2f3a56] leading-snug">
                          {active.title}
                        </div>

                        <div className="text-[13px] text-[#6a6a6a] leading-relaxed">
                          {active.description}
                        </div>

                        <div className="text-[13px] text-[#6a6a6a]">
                          Você pode parar aqui. Isso já conta.
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                          <button
                            type="button"
                            onClick={() => saveToMyDay(active.title)}
                            className="
                              rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px]
                              shadow-lg hover:opacity-95 transition
                            "
                          >
                            Salvar no Meu Dia
                          </button>

                          <button
                            type="button"
                            onClick={closeHere}
                            className="
                              rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px]
                              hover:bg-[#ffe1f1] transition
                            "
                          >
                            Encerrar
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActive(null)
                              nextOption()
                            }}
                            className="
                              rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px]
                              hover:bg-[#ffe1f1] transition
                            "
                          >
                            Ver outra sugestão
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}

                {/* ENCERRAMENTO GENTIL (camada final) */}
                {closed ? (
                  <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-5 md:p-6 space-y-3">
                    <div className="text-[14px] font-semibold text-[#2f3a56]">
                      Isso já é suficiente por agora.
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <Link
                        href="/maternar"
                        className="
                          inline-flex justify-center rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56]
                          px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition
                        "
                      >
                        Voltar ao Maternar
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setClosed(false)
                          setActive(null)
                          if (!showCheckin) scrollToId('pausas')
                        }}
                        className="
                          rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px]
                          shadow-lg hover:opacity-95 transition
                        "
                      >
                        Voltar para uma sugestão
                      </button>
                    </div>
                  </div>
                ) : null}
              </SoftCard>
            </div>

            <div className="mt-2">
              <LegalFooter />
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
