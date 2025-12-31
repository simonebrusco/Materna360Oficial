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

/**
 * =========================================================
 * HUB 4.1 — CUIDAR DE MIM (CONTRATO NORMATIVO — DEV ONLY)
 * =========================================================
 * 1) Sem trilha, sem sequência, sem progresso, sem histórico visível.
 * 2) Check-in é OPCIONAL e FRAGMENTÁVEL:
 *    - nunca bloqueia, nunca valida, nunca mostra “completo”.
 * 3) Check-in NÃO é decorativo: ele apenas REORDENA preferências de sugestão
 *    de forma silenciosa (sem feedback causal na UI).
 * 4) Sempre existe fallback (deck do dia + cursor + seen diário).
 * 5) "Outra opção" IGNORA contexto do check-in para a próxima sugestão:
 *    - serve para variar sem o app “insistir” na leitura.
 * 6) IA futura apenas REFINA a ordem/predição; NÃO muda estrutura nem cria chat.
 * =========================================================
 */

type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'
type Energia = 'baixa' | 'media' | 'alta'
type Emocao = 'neutra' | 'sensivel' | 'tensa' | 'carente'
type Corpo = 'tenso' | 'cansado' | 'ok' | 'pedindo-pausa'

type SuggestionId = 'pausa-silencio' | 'respirar-curto' | 'corpo-apoio' | 'nao-agora'

type Suggestion = {
  id: SuggestionId
  title: string
  subtitle: string
  body: string
}

const DAILY_SUGGESTIONS: Suggestion[] = [
  {
    id: 'pausa-silencio',
    title: 'Pausa sem explicação',
    subtitle: 'Permissão para não responder nada agora.',
    body: 'Fique aí por alguns instantes.\nSolte os ombros.\nRespire do jeito que vier.\nIsso já é suficiente.',
  },
  {
    id: 'respirar-curto',
    title: 'Respirar por alguns instantes',
    subtitle: 'Um intervalo pequeno, sem corrigir nada.',
    body: 'Inspire devagar.\nSolte mais devagar.\nRepita 3 vezes.\nPor agora, só isso.',
  },
  {
    id: 'corpo-apoio',
    title: 'Sentir o corpo',
    subtitle: 'Apoie os pés no chão e solte os ombros.',
    body: 'Apoie os pés.\nSolte a mandíbula.\nDeixe o peito baixar um pouco.\nPor alguns instantes já está bom.',
  },
  {
    id: 'nao-agora',
    title: 'Não fazer nada agora',
    subtitle: 'Ficar aqui já é suficiente.',
    body: 'Não precisa decidir nada.\nNão precisa escolher nada.\nSó fique por um momento.\nIsso já conta.',
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

function safeDelLS(key: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  } catch {}
}

function getTodayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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

function splitLines(s: string) {
  return s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
}

function preferenceOrderFromCheckin(input: {
  ritmo: Ritmo | null
  energia: Energia | null
  emocao: Emocao | null
  corpo: Corpo | null
}): SuggestionId[] {
  const { ritmo, energia, emocao, corpo } = input
  const base: SuggestionId[] = ['pausa-silencio', 'respirar-curto', 'corpo-apoio', 'nao-agora']

  if (ritmo === 'sobrecarregada' || corpo === 'pedindo-pausa' || energia === 'baixa') {
    return ['nao-agora', 'pausa-silencio', 'respirar-curto', 'corpo-apoio']
  }

  if (emocao === 'tensa') {
    return ['respirar-curto', 'pausa-silencio', 'corpo-apoio', 'nao-agora']
  }

  if (emocao === 'sensivel' || emocao === 'carente') {
    return ['pausa-silencio', 'nao-agora', 'respirar-curto', 'corpo-apoio']
  }

  if (ritmo === 'cansada' || corpo === 'cansado') {
    return ['pausa-silencio', 'corpo-apoio', 'respirar-curto', 'nao-agora']
  }

  if (ritmo === 'animada' || energia === 'alta') {
    return ['corpo-apoio', 'respirar-curto', 'pausa-silencio', 'nao-agora']
  }

  return base
}

function pickSuggestion(params: {
  deck: Suggestion[]
  cursor: number
  seen: string[]
  prefer: SuggestionId[]
  ignorePreference: boolean
}): Suggestion | null {
  const { deck, cursor, seen, prefer, ignorePreference } = params
  if (!deck.length) return null
  const len = deck.length

  const orderedFromCursor: Suggestion[] = []
  for (let step = 0; step < len; step++) {
    orderedFromCursor.push(deck[(cursor + step) % len])
  }

  // 1) preferência (check-in) — apenas quando NÃO estamos em “Outra opção”
  if (!ignorePreference) {
    for (const pid of prefer) {
      const cand = orderedFromCursor.find((s) => s.id === pid && !seen.includes(s.id))
      if (cand) return cand
    }
  }

  // 2) fallback: primeira não vista a partir do cursor (neutro)
  const firstUnseen = orderedFromCursor.find((s) => !seen.includes(s.id))
  if (firstUnseen) return firstUnseen

  // 3) se tudo foi visto hoje, permite repetição (sem UI/histórico)
  return orderedFromCursor[0] ?? deck[cursor % len] ?? deck[0]
}

export default function Client() {
  const [ritmo, setRitmo] = useState<Ritmo | null>(null)
  const [energia, setEnergia] = useState<Energia | null>(null)
  const [emocao, setEmocao] = useState<Emocao | null>(null)
  const [corpo, setCorpo] = useState<Corpo | null>(null)

  const [cursor, setCursor] = useState(0)
  const [seen, setSeen] = useState<string[]>([])

  // controla “Outra opção ignora contexto” (apenas para a PRÓXIMA sugestão visível)
  const [ignorePreferenceOnce, setIgnorePreferenceOnce] = useState(false)

  const [active, setActive] = useState<Suggestion | null>(null)
  const [closed, setClosed] = useState(false)

  const todayKey = useMemo(() => getTodayKey(), [])
  const seed = useMemo(() => hashStringToInt(todayKey), [todayKey])

  const LS_CURSOR = `cuidar_de_mim_cursor_${todayKey}`
  const LS_SEEN = `cuidar_de_mim_seen_${todayKey}`
  const LS_CHECKIN = `cuidar_de_mim_checkin_${todayKey}`

  useEffect(() => {
    const storedCursor = parseInt(safeGetLS(LS_CURSOR) ?? '0', 10)
    const storedSeen = parseJSON<string[]>(safeGetLS(LS_SEEN), [])
    setCursor(Number.isFinite(storedCursor) ? storedCursor : 0)
    setSeen(Array.isArray(storedSeen) ? storedSeen : [])

    const storedCheckin = parseJSON<{
      ritmo: Ritmo | null
      energia: Energia | null
      emocao: Emocao | null
      corpo: Corpo | null
    }>(safeGetLS(LS_CHECKIN), { ritmo: null, energia: null, emocao: null, corpo: null })

    setRitmo(storedCheckin.ritmo ?? null)
    setEnergia(storedCheckin.energia ?? null)
    setEmocao(storedCheckin.emocao ?? null)
    setCorpo(storedCheckin.corpo ?? null)
  }, [LS_CURSOR, LS_SEEN, LS_CHECKIN])

  useEffect(() => {
    try {
      track('cuidar_de_mim.open', { day: todayKey })
    } catch {}
  }, [todayKey])

  useEffect(() => {
    safeSetLS(
      LS_CHECKIN,
      JSON.stringify({
        ritmo,
        energia,
        emocao,
        corpo,
      })
    )

    // Se a usuária mexeu no check-in, não “prendemos” no modo “ignore”
    // (mas também não mostramos nenhum feedback causal na UI).
    setIgnorePreferenceOnce(false)
  }, [LS_CHECKIN, ritmo, energia, emocao, corpo])

  const deck = useMemo(() => {
    const start = seed % (DAILY_SUGGESTIONS.length || 1)
    return rotate(DAILY_SUGGESTIONS, start)
  }, [seed])

  const prefer = useMemo(
    () => preferenceOrderFromCheckin({ ritmo, energia, emocao, corpo }),
    [ritmo, energia, emocao, corpo]
  )

  const suggestion = useMemo(() => {
    return pickSuggestion({
      deck,
      cursor,
      seen,
      prefer,
      ignorePreference: ignorePreferenceOnce,
    })
  }, [deck, cursor, seen, prefer, ignorePreferenceOnce])

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

    // “Outra opção” deve ignorar contexto para a próxima sugestão.
    setIgnorePreferenceOnce(true)

    // avança cursor determinístico
    const nextCursor = (cursor + 1) % len
    persistCursor(nextCursor)

    try {
      track('cuidar_de_mim.other_option', { day: todayKey })
    } catch {}
  }

  function openSuggestion(s: Suggestion) {
    setActive(s)

    // ao entrar na experiência, não precisamos mais “ignorar contexto”
    setIgnorePreferenceOnce(false)

    if (!seen.includes(s.id)) {
      persistSeen([...seen, s.id])
    }

    try {
      track('cuidar_de_mim.open_suggestion', { id: s.id, day: todayKey })
    } catch {}
  }

  function closeHere() {
    setClosed(true)
    setActive(null)
    setIgnorePreferenceOnce(false)
    try {
      track('cuidar_de_mim.close', { day: todayKey })
    } catch {}
  }

  function backToPossibilities() {
    setClosed(false)
    setActive(null)
    setIgnorePreferenceOnce(false)
    try {
      track('cuidar_de_mim.back_to_possibilities', { day: todayKey })
    } catch {}
  }

  async function saveToMyDay(title: string) {
    await addTaskToMyDay({
      title,
      origin: 'selfcare',
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })
    try {
      track('cuidar_de_mim.save_to_my_day', { day: todayKey, source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM })
    } catch {}
  }

  function chipClass(activeChip: boolean) {
    return [
      'rounded-full border px-2.5 py-1.5 text-[11px] transition text-center',
      activeChip
        ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
        : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
    ].join(' ')
  }

  function actionBtnClass(kind: 'primary' | 'neutral') {
    if (kind === 'primary') {
      return 'rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition'
    }
    return 'rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition'
  }

  // Botão “Salvar no Meu Dia” precisa ser lateral (mesma hierarquia de saída)
  function saveBtnClass() {
    return 'rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition'
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
          {/* CAMADA 0 — CONTEXTO (imutável) */}
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
            <SoftCard className="relative z-10 pointer-events-auto p-6 rounded-3xl bg-white/95 border border-[#f5d7e5] shadow-[0_10px_28px_rgba(184,35,107,0.12)]">
              <div className="relative z-10 pointer-events-auto space-y-6">
                {/* CAMADA 1 — CONVITE ABERTO */}
                <div className="space-y-1">
                  <div className="text-[14px] font-semibold text-[#2f3a56]">
                    O que você sente que precisa agora?
                  </div>
                  <div className="text-[12px] text-[#6a6a6a]">
                    Se não quiser escolher nada, você pode encerrar por aqui.
                  </div>

                  <div className="pt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (suggestion) openSuggestion(suggestion)
                      }}
                      className={actionBtnClass('neutral')}
                    >
                      Ver uma possibilidade agora
                    </button>

                    <button type="button" onClick={closeHere} className={actionBtnClass('neutral')}>
                      Encerrar por aqui
                    </button>
                  </div>
                </div>

                {!closed ? (
                  <>
                    {/* CAMADA 2 — CHECK-IN (visual rebaixado + sem sensação de “resultado”) */}
                    <div className="rounded-2xl bg-white/60 border border-[#f5d7e5] p-4 space-y-3">
                      <div className="space-y-1">
                        <div className="text-[12px] font-semibold text-[#2f3a56]">Se quiser, um check-in</div>
                        <div className="text-[11px] text-[#6a6a6a]">
                          Pode ser só uma coisa. Pode pular tudo.
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#6a6a6a]">Ritmo</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(['leve', 'animada', 'cansada', 'sobrecarregada'] as Ritmo[]).map((r) => (
                              <button key={r} type="button" onClick={() => setRitmo(r)} className={chipClass(ritmo === r)}>
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#6a6a6a]">Energia</div>
                          <div className="grid grid-cols-3 gap-2">
                            {(['baixa', 'media', 'alta'] as Energia[]).map((e) => (
                              <button key={e} type="button" onClick={() => setEnergia(e)} className={chipClass(energia === e)}>
                                {e === 'media' ? 'média' : e}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#6a6a6a]">Emoção</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(['neutra', 'sensivel', 'tensa', 'carente'] as Emocao[]).map((em) => (
                              <button key={em} type="button" onClick={() => setEmocao(em)} className={chipClass(emocao === em)}>
                                {em === 'sensivel' ? 'sensível' : em}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#6a6a6a]">Corpo</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {(['tenso', 'cansado', 'ok', 'pedindo-pausa'] as Corpo[]).map((c) => (
                              <button key={c} type="button" onClick={() => setCorpo(c)} className={chipClass(corpo === c)}>
                                {c === 'pedindo-pausa' ? 'pedindo pausa' : c}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RESPIRO + SEPARADOR (remove sensação de “resultado imediato”) */}
                    <div className="pt-2 md:pt-3">
                      <div className="h-px w-full bg-[#f5d7e5]" />
                    </div>

                    <div className="pt-2 md:pt-3" />

                    {/* CAMADA 3/4 */}
                    {!active ? (
                      /* CAMADA 3 — SUGESTÃO ÚNICA (parece “uma possibilidade”, não “resultado”) */
                      <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-5 space-y-3">
                        <div className="text-[12px] text-[#6a6a6a]">Se quiser, uma possibilidade agora</div>

                        <div>
                          <div className="text-[14px] font-semibold text-[#2f3a56]">
                            {suggestion?.title ?? 'Uma possibilidade agora'}
                          </div>
                          <div className="text-[13px] text-[#6a6a6a]">
                            {suggestion?.subtitle ?? 'Sem obrigação. Só se fizer sentido.'}
                          </div>

                          {suggestion ? (
                            <div className="mt-3 space-y-2">
                              {splitLines(suggestion.body).slice(0, 5).map((line, i) => (
                                <p key={`${suggestion.id}-l${i}`} className="text-[13px] text-[#545454] leading-relaxed">
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => (suggestion ? openSuggestion(suggestion) : undefined)}
                            className={actionBtnClass('primary')}
                          >
                            Quero tentar agora
                          </button>

                          <button type="button" onClick={nextOption} className={actionBtnClass('neutral')}>
                            Outra opção
                          </button>

                          <button type="button" onClick={closeHere} className={actionBtnClass('neutral')}>
                            Encerrar por aqui
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* CAMADA 4 — EXPERIÊNCIA ÚNICA */
                      <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6 space-y-4">
                        <div className="space-y-2">
                          <div className="text-[12px] text-[#6a6a6a]">Por alguns instantes já está bom.</div>

                          <div className="text-[16px] font-semibold text-[#2f3a56]">{active.title}</div>
                          <div className="text-[13px] text-[#6a6a6a]">{active.subtitle}</div>

                          <div className="mt-3 space-y-2">
                            {splitLines(active.body).slice(0, 5).map((line, i) => (
                              <p key={`${active.id}-a${i}`} className="text-[13px] text-[#545454] leading-relaxed">
                                {line}
                              </p>
                            ))}
                          </div>

                          <div className="pt-2 text-[13px] text-[#6a6a6a]">Isso já é suficiente por agora.</div>
                        </div>

                        {/* Saídas obrigatórias */}
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={backToPossibilities} className={actionBtnClass('neutral')}>
                            Já está bom por agora
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActive(null)
                              nextOption()
                            }}
                            className={actionBtnClass('neutral')}
                          >
                            Ver outra possibilidade
                          </button>

                          <button type="button" onClick={closeHere} className={actionBtnClass('neutral')}>
                            Encerrar por aqui
                          </button>

                          {/* CAMADA 5 — REGISTROS (lateral, sem cara de “próximo passo”) */}
                          <button type="button" onClick={() => saveToMyDay(active.title)} className={saveBtnClass()}>
                            Salvar no Meu Dia
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}

                {/* Encerramento gentil */}
                {closed ? (
                  <div className="space-y-3">
                    <div className="text-[14px] font-semibold text-[#2f3a56]">Isso já é suficiente por agora.</div>
                    <Link
                      href="/maternar"
                      className="inline-block rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                    >
                      Voltar ao Maternar
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        safeDelLS(LS_CURSOR)
                        safeDelLS(LS_SEEN)
                        safeDelLS(LS_CHECKIN)
                        setCursor(0)
                        setSeen([])
                        setRitmo(null)
                        setEnergia(null)
                        setEmocao(null)
                        setCorpo(null)
                        setIgnorePreferenceOnce(false)
                        setClosed(false)
                        setActive(null)
                      }}
                      className="sr-only"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      reset
                    </button>
                  </div>
                ) : null}
              </div>
            </SoftCard>

            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
