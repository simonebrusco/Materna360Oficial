'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'
type Energia = 'baixa' | 'media' | 'alta'
type Emocao = 'neutra' | 'sensivel' | 'tensa' | 'carente'
type Corpo = 'ok' | 'tenso' | 'cansado' | 'pedindo-pausa'

type Checkin = {
  ritmo: Ritmo | null
  energia: Energia | null
  emocao: Emocao | null
  corpo: Corpo | null
}

type Suggestion = {
  id: string
  title: string
  subtitle: string
  body: string[] // 3–5 linhas, permissivas (camada 3)
  experience: string[] // 3–5 linhas, permissivas (camada 4)
  signals?: Partial<{
    ritmo: Ritmo[]
    energia: Energia[]
    emocao: Emocao[]
    corpo: Corpo[]
  }>
}

const DAILY_SUGGESTIONS: Suggestion[] = [
  {
    id: 'agua',
    title: 'Um gole de água',
    subtitle: 'Um gesto pequeno já conta.',
    body: ['Se estiver por perto, um gole.', 'Sem “agora eu vou…”.', 'Só um gesto curto.', 'Por alguns instantes, já está bom.'],
    experience: ['Se tiver água por perto, um gole pode ajudar.', 'Se fizer sentido, bem devagar.', 'Se não fizer, tudo bem.', 'Por alguns instantes, já está bom.'],
    signals: { energia: ['baixa', 'media'], corpo: ['cansado', 'pedindo-pausa'] },
  },
  {
    id: 'ombros',
    title: 'Soltar os ombros',
    subtitle: 'Um pouco de espaço por dentro.',
    body: ['Talvez soltar os ombros.', 'Sem postura “certa”.', 'Só um micro alívio.', 'Por alguns instantes, já está bom.'],
    experience: ['Se fizer sentido, deixe os ombros descerem um pouco.', 'Talvez descruze a mandíbula.', 'Sem consertar nada.', 'Por alguns instantes, já está bom.'],
    signals: { corpo: ['tenso'], emocao: ['tensa'] },
  },
  {
    id: 'ponto-fixo',
    title: 'Olhar um ponto fixo',
    subtitle: 'Trazer o corpo para o presente.',
    body: ['Escolha um ponto.', 'Fique com ele um instante.', 'Sem contar tempo.', 'Por alguns instantes, já está bom.'],
    experience: ['Se quiser, escolha um ponto no ambiente.', 'Só repare nas formas e nas bordas.', 'Sem precisar “esvaziar a mente”.', 'Por alguns instantes, já está bom.'],
    signals: { emocao: ['tensa', 'sensivel'], ritmo: ['sobrecarregada', 'cansada'] },
  },
  {
    id: 'pausa-sem-explicar',
    title: 'Pausa sem explicação',
    subtitle: 'Permissão para não responder nada agora.',
    body: ['Pode ser só ficar aqui.', 'Sem nomear, sem justificar.', 'Sem “resolver”.', 'Por alguns instantes, já está bom.'],
    experience: ['Se quiser, fique só aqui.', 'Sem explicação.', 'Sem conversa interna.', 'Por alguns instantes, já está bom.'],
    signals: { emocao: ['carente', 'sensivel'], ritmo: ['cansada', 'sobrecarregada'] },
  },
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

function getTodayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// hash simples, auditável
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
function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/**
 * CONTRATO — CUIDAR DE MIM
 *
 * - Estrutura por camadas é FINAL (não adicionar blocos / CTAs fora do checklist).
 * - Check-in nunca bloqueia sugestões (0, 1 ou todos: sempre funciona).
 * - Check-in apenas reordena preferências (determinístico e auditável).
 * - Sempre existe fallback (se nada “combinar”, ainda há uma possibilidade).
 * - “Outra opção” ignora contexto (não usa check-in; só avança no deck do dia).
 * - Anti-repetição diária obrigatória (seen diário).
 * - IA futura apenas refina ordem / seleção, não muda estrutura nem linguagem.
 */

function matchScore(s: Suggestion, c: Checkin) {
  // pesos fixos e auditáveis (sem “mágica”)
  const W = { ritmo: 4, energia: 3, emocao: 2, corpo: 3 } as const
  let score = 0

  if (c.ritmo && s.signals?.ritmo?.includes(c.ritmo)) score += W.ritmo
  if (c.energia && s.signals?.energia?.includes(c.energia)) score += W.energia
  if (c.emocao && s.signals?.emocao?.includes(c.emocao)) score += W.emocao
  if (c.corpo && s.signals?.corpo?.includes(c.corpo)) score += W.corpo

  return score
}

function chipClass(active: boolean) {
  // check-in é “baixo volume”: menos contraste, menos peso
  return [
    'rounded-full border px-3 py-2 text-[12px] transition text-center',
    active
      ? 'bg-[#ffe1f1] border-[#f5d7e5] text-[#2f3a56]'
      : 'bg-white/70 border-[#f5d7e5] text-[#6a6a6a] hover:bg-white',
  ].join(' ')
}

export default function Client() {
  const [checkin, setCheckin] = useState<Checkin>({
    ritmo: null,
    energia: null,
    emocao: null,
    corpo: null,
  })

  const [checkinOpen, setCheckinOpen] = useState(false)

  const [cursor, setCursor] = useState(0)
  const [seen, setSeen] = useState<string[]>([])
  const [active, setActive] = useState<Suggestion | null>(null)
  const [closed, setClosed] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false) // “Outra opção” ignora contexto após interação

  const todayKey = useMemo(() => getTodayKey(), [])
  const seed = useMemo(() => hashStringToInt(todayKey), [todayKey])

  const LS_CURSOR = `cuidar_de_mim_cursor_${todayKey}`
  const LS_SEEN = `cuidar_de_mim_seen_${todayKey}`
  const LS_CHECKIN_OPEN = `cuidar_de_mim_checkin_open_${todayKey}`

  // init persistência local (cursor/seen/checkinOpen)
  useEffect(() => {
    const storedCursor = parseInt(safeGetLS(LS_CURSOR) ?? '0', 10)
    const storedSeen = parseJSON<string[]>(safeGetLS(LS_SEEN), [])
    const storedOpen = safeGetLS(LS_CHECKIN_OPEN)

    setCursor(Number.isFinite(storedCursor) ? storedCursor : 0)
    setSeen(Array.isArray(storedSeen) ? storedSeen : [])
    setCheckinOpen(storedOpen === '1') // default fechado; só abre se a pessoa já deixou aberto hoje
  }, [LS_CURSOR, LS_SEEN, LS_CHECKIN_OPEN])

  useEffect(() => {
    try {
      track('cuidar_de_mim.open', { day: todayKey })
    } catch {}
  }, [todayKey])

  const deck = useMemo(() => {
    const start = seed % (DAILY_SUGGESTIONS.length || 1)
    return rotate(DAILY_SUGGESTIONS, start)
  }, [seed])

  // Sugestão “inteligente” (sem IA visível):
  // - Antes de interação manual, reordena por matchScore (determinístico).
  // - Após interação manual (Outra opção), ignora contexto e segue deck/cursor.
  const suggestion = useMemo(() => {
    if (!deck.length) return null
    const unseen = deck.filter((s) => !seen.includes(s.id))

    // fallback: se tudo foi visto hoje, permite repetir (mantendo estrutura)
    const pool = unseen.length ? unseen : deck

    if (hasInteracted) {
      // ignora contexto: pega próximo pelo cursor no deck, pulando vistos se houver
      const len = deck.length
      for (let step = 0; step < len; step++) {
        const idx = (cursor + step) % len
        const s = deck[idx]
        if (!seen.includes(s.id)) return s
      }
      return deck[cursor % len]
    }

    // sem interação: reordena por score (auditável) e pega a primeira do pool
    const scored = [...pool]
      .map((s) => ({ s, score: matchScore(s, checkin) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        // desempate determinístico (id)
        return a.s.id.localeCompare(b.s.id)
      })

    return scored[0]?.s ?? pool[0] ?? null
  }, [deck, seen, cursor, hasInteracted, checkin])

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
    setHasInteracted(true)

    const len = deck.length
    let nextCursor = (cursor + 1) % len

    // procura próxima não vista (ignora contexto)
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

    // se todas vistas, reseta seen e avança
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

    if (!seen.includes(s.id)) {
      const nextSeen = [...seen, s.id]
      persistSeen(nextSeen)
    }

    try {
      track('cuidar_de_mim.open_suggestion', { id: s.id, day: todayKey })
    } catch {}
  }

  function closeHere() {
    setClosed(true)
    setActive(null)
    try {
      track('cuidar_de_mim.close', { day: todayKey })
    } catch {}
  }

  function doneForNow() {
    // “Já está bom por agora” (camada 4)
    setClosed(true)
    setActive(null)
    try {
      track('cuidar_de_mim.done_for_now', { day: todayKey })
    } catch {}
  }

  function seeAnotherPossibility() {
    // “Ver outra possibilidade” (camada 4)
    setActive(null)
    nextOption()
    try {
      track('cuidar_de_mim.see_another', { day: todayKey })
    } catch {}
  }

  function saveToMyDay(title: string) {
    addTaskToMyDay({
      title,
      origin: 'selfcare',
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })

    try {
      track('cuidar_de_mim.save_to_my_day', { day: todayKey, source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM })
    } catch {}
  }

  function setCheckinOpenPersist(next: boolean) {
    setCheckinOpen(next)
    safeSetLS(LS_CHECKIN_OPEN, next ? '1' : '0')
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
          {/* CAMADA 0 — CONTEXTO FIXO (HEADER) */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar ao Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
                Um espaço para se respeitar
              </h1>

              <p className="text-sm md:text-base text-white/90 max-w-xl">
                Se quiser, escolha algo que ajude um pouco. Se não fizer sentido, tudo bem.
              </p>
            </div>
          </header>

          <div className="space-y-7 pb-10">
            <SoftCard className="p-6 md:p-7 rounded-3xl bg-white/95 border border-[#f5d7e5] shadow-[0_18px_45px_rgba(184,35,107,0.12)]">
              {/* CAMADA 1 — CONVITE ABERTO (SEMPRE VISÍVEL) */}
              <div className="space-y-2">
                <div className="text-[14px] font-semibold text-[#2f3a56]">
                  O que você sente que precisa agora?
                </div>
                <div className="text-[12px] text-[#6a6a6a]">
                  Se não quiser escolher nada, você pode encerrar por aqui.
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={closeHere}
                    className="
                      inline-flex items-center justify-center
                      rounded-full
                      bg-white border border-[#f5d7e5]
                      text-[#2f3a56]
                      px-4 py-2 text-[12px]
                      hover:bg-[#ffe1f1] transition
                    "
                  >
                    Encerrar por aqui
                  </button>
                </div>
              </div>

              {/* Estados finais (encerramento) */}
              {closed && (
                <div className="mt-6 rounded-2xl border border-[#f5d7e5] bg-white/80 p-5">
                  <div className="text-[14px] font-semibold text-[#2f3a56]">
                    Isso já é suficiente por agora.
                  </div>
                  <div className="mt-3">
                    <Link
                      href="/maternar"
                      className="
                        inline-flex items-center justify-center
                        rounded-full
                        bg-white border border-[#f5d7e5]
                        text-[#2f3a56]
                        px-4 py-2 text-[12px]
                        hover:bg-[#ffe1f1] transition
                      "
                    >
                      Voltar ao Maternar
                    </Link>
                  </div>
                </div>
              )}

              {!closed && (
                <>
                  {/* CAMADA 2 — CHECK-IN (OPCIONAL, COLAPSÁVEL, BAIXO VOLUME) */}
                  <div className="mt-6 rounded-2xl border border-[#f5d7e5] bg-[#fff7fb]">
                    <button
                      type="button"
                      onClick={() => setCheckinOpenPersist(!checkinOpen)}
                      className="w-full flex items-center justify-between px-4 py-3"
                    >
                      <span className="text-[13px] font-semibold text-[#2f3a56]">
                        Se quiser, um check-in
                      </span>
                      <span className="text-[12px] text-[#6a6a6a]">
                        {checkinOpen ? 'Fechar' : 'Abrir'}
                      </span>
                    </button>

                    {checkinOpen && (
                      <div className="px-4 pb-4">
                        <div className="text-[12px] text-[#6a6a6a] mb-3">
                          Pode ser só uma coisa. Pode pular tudo. Nada aqui é obrigatório.
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-[12px] text-[#6a6a6a]">Ritmo</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {(['leve', 'animada', 'cansada', 'sobrecarregada'] as Ritmo[]).map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setCheckin((c) => ({ ...c, ritmo: c.ritmo === v ? null : v }))}
                                  className={chipClass(checkin.ritmo === v)}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-[12px] text-[#6a6a6a]">Energia</div>
                            <div className="grid grid-cols-3 gap-2">
                              {(['baixa', 'media', 'alta'] as Energia[]).map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setCheckin((c) => ({ ...c, energia: c.energia === v ? null : v }))}
                                  className={chipClass(checkin.energia === v)}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-[12px] text-[#6a6a6a]">Emoção</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {(['neutra', 'sensivel', 'tensa', 'carente'] as Emocao[]).map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setCheckin((c) => ({ ...c, emocao: c.emocao === v ? null : v }))}
                                  className={chipClass(checkin.emocao === v)}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-[12px] text-[#6a6a6a]">Corpo</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {(['tenso', 'cansado', 'ok', 'pedindo-pausa'] as Corpo[]).map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setCheckin((c) => ({ ...c, corpo: c.corpo === v ? null : v }))}
                                  className={chipClass(checkin.corpo === v)}
                                >
                                  {v === 'pedindo-pausa' ? 'pedindo pausa' : v}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CAMADA 3 — SUGESTÃO ÚNICA (CARD DOMINANTE) */}
                  <div className="mt-7">
                    <div className="rounded-3xl bg-white border border-[#f5d7e5] p-6 md:p-7 shadow-[0_20px_55px_rgba(184,35,107,0.18)]">
                      {!active && (
                        <>
                          <div className="text-[12px] text-[#6a6a6a] mb-2">
                            Se quiser, uma possibilidade agora
                          </div>

                          <div className="space-y-2">
                            <h2 className="text-[20px] md:text-[22px] font-semibold text-[#2f3a56] leading-snug">
                              {suggestion?.title ?? 'Uma possibilidade agora'}
                            </h2>

                            <div className="text-[13px] md:text-[14px] text-[#545454]">
                              {suggestion?.subtitle ?? 'Sem obrigação. Só se fizer sentido.'}
                            </div>

                            <div className="mt-3 space-y-1.5">
                              {(suggestion?.body ?? ['Sem obrigação. Só se fizer sentido.']).slice(0, 5).map((line, i) => (
                                <p key={i} className="text-[13px] text-[#6a6a6a] leading-relaxed">
                                  {line}
                                </p>
                              ))}
                            </div>
                          </div>

                          {/* Ações obrigatórias e sempre visíveis */}
                          <div className="mt-5 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => (suggestion ? openSuggestion(suggestion) : undefined)}
                              className="
                                rounded-full bg-[#fd2597] text-white
                                px-4 py-2 text-[12px]
                                shadow-lg hover:opacity-95 transition
                              "
                            >
                              Quero tentar agora
                            </button>

                            <button
                              type="button"
                              onClick={nextOption}
                              className="
                                rounded-full bg-white border border-[#f5d7e5]
                                text-[#2f3a56]
                                px-4 py-2 text-[12px]
                                hover:bg-[#ffe1f1] transition
                              "
                            >
                              Outra opção
                            </button>

                            <button
                              type="button"
                              onClick={closeHere}
                              className="
                                rounded-full bg-white border border-[#f5d7e5]
                                text-[#2f3a56]
                                px-4 py-2 text-[12px]
                                hover:bg-[#ffe1f1] transition
                              "
                            >
                              Encerrar por aqui
                            </button>
                          </div>
                        </>
                      )}

                      {/* CAMADA 4 — EXPERIÊNCIA ÚNICA (quando entra) */}
                      {active && (
                        <>
                          <div className="space-y-2">
                            <h2 className="text-[20px] md:text-[22px] font-semibold text-[#2f3a56] leading-snug">
                              {active.title}
                            </h2>

                            <div className="text-[13px] md:text-[14px] text-[#545454]">
                              {active.subtitle}
                            </div>

                            <div className="mt-3 space-y-1.5">
                              {active.experience.slice(0, 5).map((line, i) => (
                                <p key={i} className="text-[13px] text-[#6a6a6a] leading-relaxed">
                                  {line}
                                </p>
                              ))}
                            </div>

                            <div className="mt-3 text-[13px] text-[#6a6a6a]">
                              Por alguns instantes já está bom.
                            </div>
                          </div>

                          {/* Saídas obrigatórias (vocabulário fixo) */}
                          <div className="mt-5 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={doneForNow}
                              className="
                                rounded-full bg-[#fd2597] text-white
                                px-4 py-2 text-[12px]
                                shadow-lg hover:opacity-95 transition
                              "
                            >
                              Já está bom por agora
                            </button>

                            <button
                              type="button"
                              onClick={seeAnotherPossibility}
                              className="
                                rounded-full bg-white border border-[#f5d7e5]
                                text-[#2f3a56]
                                px-4 py-2 text-[12px]
                                hover:bg-[#ffe1f1] transition
                              "
                            >
                              Ver outra possibilidade
                            </button>

                            <button
                              type="button"
                              onClick={closeHere}
                              className="
                                rounded-full bg-white border border-[#f5d7e5]
                                text-[#2f3a56]
                                px-4 py-2 text-[12px]
                                hover:bg-[#ffe1f1] transition
                              "
                            >
                              Encerrar por aqui
                            </button>
                          </div>

                          {/* CAMADA 5 — REGISTROS (discretos e laterais) */}
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => saveToMyDay(active.title)}
                              className="text-[12px] text-[#6a6a6a] underline decoration-[#f5d7e5] hover:text-[#2f3a56] transition"
                            >
                              Salvar no Meu Dia
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </SoftCard>

            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
