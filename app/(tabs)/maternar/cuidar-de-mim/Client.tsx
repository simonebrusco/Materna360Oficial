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
type Corpo = 'tenso' | 'cansado' | 'ok' | 'pedindo-pausa'

type Signals = {
  ritmo: Ritmo | null
  energia: Energia | null
  emocao: Emocao | null
  corpo: Corpo | null
}

type Suggestion = {
  id: string
  title: string
  subtitle: string
  lines: string[] // 3–5 linhas
  // “tags” determinísticas e auditáveis (sem pesos opacos)
  tags: {
    ritmo?: Ritmo[]
    energia?: Energia[]
    emocao?: Emocao[]
    corpo?: Corpo[]
  }
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: 'pausa-silencio',
    title: 'Pausa sem explicação',
    subtitle: 'Permissão para não responder nada agora.',
    lines: ['Solte os ombros.', 'Respire uma vez.', 'Ficar aqui já é suficiente.', 'Por alguns instantes já está bom.'],
    tags: { energia: ['baixa'], emocao: ['sensivel', 'carente'], corpo: ['cansado', 'pedindo-pausa'] },
  },
  {
    id: 'respirar-curto',
    title: 'Respirar por alguns instantes',
    subtitle: 'Só perceber a respiração por um momento.',
    lines: ['Inspire curto.', 'Expire mais longo.', 'Sem meta, sem certo ou errado.', 'Por alguns instantes já está bom.'],
    tags: { emocao: ['tensa'], corpo: ['tenso'], energia: ['media'] },
  },
  {
    id: 'sentir-corpo',
    title: 'Sentir o corpo',
    subtitle: 'Apoie os pés no chão e solte os ombros.',
    lines: ['Apoie os pés.', 'Solte a mandíbula.', 'Deixe o peito baixar um pouco.', 'Por alguns instantes já está bom.'],
    tags: { corpo: ['tenso', 'cansado'], emocao: ['tensa', 'sensivel'] },
  },
  {
    id: 'nao-fazer',
    title: 'Não fazer nada agora',
    subtitle: 'Ficar aqui já é suficiente.',
    lines: ['Não precisa decidir nada.', 'Não precisa resolver nada.', 'Só existir por um instante.', 'Por alguns instantes já está bom.'],
    tags: { ritmo: ['sobrecarregada'], energia: ['baixa'], emocao: ['carente', 'sensivel'] },
  },
  {
    id: 'agua-micro',
    title: 'Um gole de água',
    subtitle: 'Um gesto pequeno já conta.',
    lines: ['Se tiver por perto, só um gole.', 'Sem “agora eu vou…”.', 'Só um gesto curto.', 'Por alguns instantes já está bom.'],
    tags: { energia: ['baixa', 'media'], ritmo: ['cansada', 'sobrecarregada'] },
  },
  {
    id: 'olhar-janela',
    title: 'Olhar um ponto fixo',
    subtitle: 'Trazer o corpo para o presente.',
    lines: ['Escolha um ponto.', 'Olhe por 5 segundos.', 'Sinta os pés no chão.', 'Por alguns instantes já está bom.'],
    tags: { emocao: ['tensa'], ritmo: ['sobrecarregada'], energia: ['media', 'alta'] },
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

function matchScore(s: Suggestion, signals: Signals) {
  // Contrato: determinístico, auditável, sem pesos opacos.
  // Regra: cada campo selecionado que “bate” com as tags soma 1.
  // Sem seleção => não influencia.
  let score = 0

  if (signals.ritmo && s.tags.ritmo?.includes(signals.ritmo)) score += 1
  if (signals.energia && s.tags.energia?.includes(signals.energia)) score += 1
  if (signals.emocao && s.tags.emocao?.includes(signals.emocao)) score += 1
  if (signals.corpo && s.tags.corpo?.includes(signals.corpo)) score += 1

  return score
}

type SuggestionMode = 'context' | 'sequential'

/**
 * CONTRATO — CUIDAR DE MIM
 *
 * - Check-in nunca bloqueia sugestão
 * - Check-in apenas reordena preferências (determinístico e auditável)
 * - Sempre existe fallback
 * - “Outra opção” ignora contexto (sequencial pelo deck do dia)
 * - Anti-repetição diária é obrigatória
 * - IA futura apenas refina a ordenação (não muda estrutura)
 * - Estrutura do hub é imutável
 */
export default function Client() {
  const todayKey = useMemo(() => getTodayKey(), [])
  const seed = useMemo(() => hashStringToInt(todayKey), [todayKey])

  const LS_CURSOR = `cuidar_de_mim_cursor_${todayKey}`
  const LS_SEEN = `cuidar_de_mim_seen_${todayKey}`
  const LS_SIGNALS = `cuidar_de_mim_signals_${todayKey}`

  // “applied” = sinais já assumidos pelo sistema (silencioso)
  const [applied, setApplied] = useState<Signals>({
    ritmo: null,
    energia: null,
    emocao: null,
    corpo: null,
  })

  // “draft” = o que a usuária mexe enquanto o check-in está aberto
  const [draft, setDraft] = useState<Signals>({
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
  const [mode, setMode] = useState<SuggestionMode>('context')

  // deck determinístico diário (base para anti-repetição e cursor)
  const deck = useMemo(() => {
    const start = seed % (SUGGESTIONS.length || 1)
    return rotate(SUGGESTIONS, start)
  }, [seed])

  // init: cursor + seen + sinais do dia
  useEffect(() => {
    const storedCursor = parseInt(safeGetLS(LS_CURSOR) ?? '0', 10)
    const storedSeen = parseJSON<string[]>(safeGetLS(LS_SEEN), [])
    const storedSignals = parseJSON<Signals>(safeGetLS(LS_SIGNALS), {
      ritmo: null,
      energia: null,
      emocao: null,
      corpo: null,
    })

    setCursor(Number.isFinite(storedCursor) ? storedCursor : 0)
    setSeen(Array.isArray(storedSeen) ? storedSeen : [])
    setApplied(storedSignals)
    setDraft(storedSignals)
  }, [LS_CURSOR, LS_SEEN, LS_SIGNALS])

  useEffect(() => {
    try {
      track('cuidar_de_mim.open', { day: todayKey })
    } catch {}
  }, [todayKey])

  function persistCursor(next: number) {
    setCursor(next)
    safeSetLS(LS_CURSOR, String(next))
  }

  function persistSeen(nextSeen: string[]) {
    setSeen(nextSeen)
    safeSetLS(LS_SEEN, JSON.stringify(nextSeen))
  }

  function persistSignals(nextSignals: Signals) {
    setApplied(nextSignals)
    safeSetLS(LS_SIGNALS, JSON.stringify(nextSignals))
  }

  // CAMADA 3 — seleção de sugestão:
  // - contexto: escolhe o melhor “match” entre as não vistas (tie-break pelo deck do dia)
  // - sequential: ignora contexto e apresenta deck[cursor] (próxima não vista)
  const suggestion = useMemo(() => {
    if (!deck.length) return null

    const len = deck.length

    // helper: primeira não vista a partir do cursor (sequencial)
    const firstUnseenFromCursor = () => {
      for (let step = 0; step < len; step++) {
        const idx = (cursor + step) % len
        const s = deck[idx]
        if (!seen.includes(s.id)) return s
      }
      return deck[cursor % len]
    }

    if (mode === 'sequential') return firstUnseenFromCursor()

    // context mode: melhor score (determinístico)
    let best: Suggestion | null = null
    let bestScore = -1

    // varre na ordem do deck a partir do cursor (tie-break = primeira ocorrência)
    for (let step = 0; step < len; step++) {
      const idx = (cursor + step) % len
      const s = deck[idx]
      if (seen.includes(s.id)) continue

      const score = matchScore(s, applied)
      if (score > bestScore) {
        best = s
        bestScore = score
      }
    }

    // fallback: se tudo já foi visto hoje, volta a permitir (sem UI de coleção/histórico)
    if (!best) {
      return deck[cursor % len]
    }

    return best
  }, [deck, cursor, seen, applied, mode])

  function closeHere() {
    setClosed(true)
    setActive(null)
    try {
      track('cuidar_de_mim.close', { day: todayKey })
    } catch {}
  }

  function resetModeToContext() {
    setMode('context')
  }

  function nextOption() {
    if (!deck.length) return

    // “Outra opção” ignora contexto => modo sequencial
    setMode('sequential')

    const len = deck.length
    let nextCursor = (cursor + 1) % len

    // acha a próxima não vista
    for (let step = 0; step < len; step++) {
      const idx = (cursor + 1 + step) % len
      const s = deck[idx]
      if (!seen.includes(s.id)) {
        nextCursor = idx
        break
      }
    }

    // se tudo foi visto, reseta seen do dia (silencioso) e avança
    const allSeen = deck.every((s) => seen.includes(s.id))
    if (allSeen) {
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
    setClosed(false)

    // marca como vista hoje (anti-repetição real)
    if (!seen.includes(s.id)) {
      persistSeen([...seen, s.id])
    }

    // ao entrar na experiência, volta para modo contextual (sem exibir causalidade)
    resetModeToContext()

    try {
      track('cuidar_de_mim.open_suggestion', { id: s.id, day: todayKey })
    } catch {}
  }

  function backToPossibility() {
    setActive(null)
    setClosed(false)
    // voltar ao campo de possibilidades não deve “parecer sequência”
    // mantém tudo silencioso; “Outra opção” segue disponível.
    try {
      track('cuidar_de_mim.back_to_possibility', { day: todayKey })
    } catch {}
  }

  function alreadyEnough() {
    // saída gentil (camada 4)
    setActive(null)
    setClosed(true)
    try {
      track('cuidar_de_mim.enough', { day: todayKey })
    } catch {}
  }

  function saveToMyDay(title: string) {
    addTaskToMyDay({
      title,
      origin: 'selfcare',
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })

    try {
      track('cuidar_de_mim.save_to_my_day', {
        day: todayKey,
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })
    } catch {}
  }

  // Check-in: colapsável e “silencioso”
  function toggleCheckin() {
    const nextOpen = !checkinOpen
    setCheckinOpen(nextOpen)

    // Ao FECHAR, aplica silenciosamente o que foi selecionado (sem feedback causal explícito)
    if (checkinOpen && !nextOpen) {
      persistSignals(draft)
      resetModeToContext()
      try {
        track('cuidar_de_mim.checkin_apply', { day: todayKey })
      } catch {}
    }

    // Ao ABRIR, não altera sugestão nem gera efeito visível
    if (!checkinOpen && nextOpen) {
      try {
        track('cuidar_de_mim.checkin_open', { day: todayKey })
      } catch {}
    }
  }

  function chipClass(isOn: boolean) {
    return [
      'rounded-full border px-3 py-2 text-[12px] transition text-center',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd2597]/50',
      isOn
        ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
        : 'bg-white/90 border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#fff7fb]',
    ].join(' ')
  }

  function actionPrimaryClass() {
    return 'rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60'
  }

  function actionSecondaryClass() {
    return 'rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#fff7fb] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd2597]/40'
  }

  function actionTertiaryClass() {
    // “Encerrar por aqui” com peso emocional equivalente (não escondido, mas também não “final”)
    return 'rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#fff7fb] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd2597]/40'
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
            {/* Card raiz com clique garantido */}
            <SoftCard className="relative z-10 pointer-events-auto p-6 md:p-7 rounded-3xl bg-white/95 border border-[#f5d7e5]">
              <div className="relative z-10 pointer-events-auto">
                {/* CAMADA 1/2/3 — enquanto não está em experiência e não encerrou */}
                {!active && !closed && (
                  <div className="space-y-8">
                    {/* CAMADA 1 — CONVITE ABERTO (não acionável exceto Encerrar) */}
                    <div className="space-y-2">
                      <div className="text-[14px] font-semibold text-[#2f3a56]">
                        O que você sente que precisa agora?
                      </div>
                      <div className="text-[12px] text-[#6a6a6a]">
                        Se não quiser escolher nada, você pode encerrar por aqui.
                      </div>

                      <div className="pt-2">
                        <button type="button" onClick={closeHere} className={actionTertiaryClass()}>
                          Encerrar por aqui
                        </button>
                      </div>
                    </div>

                    {/* CAMADA 2 — CHECK-IN (opcional, colapsável, inicia fechado) */}
                    <div className="rounded-2xl border border-[#f5d7e5] bg-white/80">
                      <button
                        type="button"
                        onClick={toggleCheckin}
                        className="
                          w-full flex items-center justify-between
                          px-4 py-3
                          text-left
                          rounded-2xl
                          hover:bg-[#fff7fb]
                          transition
                          focus-visible:outline-none
                          focus-visible:ring-2 focus-visible:ring-[#fd2597]/35
                        "
                        aria-expanded={checkinOpen}
                      >
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-[#2f3a56]">Se quiser, um check-in</span>
                        </div>
                        <span className="text-[12px] text-[#6a6a6a]">{checkinOpen ? 'Fechar' : 'Abrir'}</span>
                      </button>

                      {checkinOpen && (
                        <div className="px-4 pb-4 pt-1 space-y-4">
                          {/* Ritmo */}
                          <div className="space-y-2">
                            <div className="text-[12px] text-[#6a6a6a]">Ritmo</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {(['leve', 'animada', 'cansada', 'sobrecarregada'] as Ritmo[]).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setDraft((p) => ({ ...p, ritmo: p.ritmo === r ? null : r }))}
                                  className={chipClass(draft.ritmo === r)}
                                >
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
                                <button
                                  key={e}
                                  type="button"
                                  onClick={() => setDraft((p) => ({ ...p, energia: p.energia === e ? null : e }))}
                                  className={chipClass(draft.energia === e)}
                                >
                                  {e === 'media' ? 'média' : e}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Emoção */}
                          <div className="space-y-2">
                            <div className="text-[12px] text-[#6a6a6a]">Emoção</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {(['neutra', 'sensivel', 'tensa', 'carente'] as Emocao[]).map((em) => (
                                <button
                                  key={em}
                                  type="button"
                                  onClick={() => setDraft((p) => ({ ...p, emocao: p.emocao === em ? null : em }))}
                                  className={chipClass(draft.emocao === em)}
                                >
                                  {em === 'sensivel' ? 'sensível' : em}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Corpo */}
                          <div className="space-y-2">
                            <div className="text-[12px] text-[#6a6a6a]">Corpo</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {(['tenso', 'cansado', 'ok', 'pedindo-pausa'] as Corpo[]).map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setDraft((p) => ({ ...p, corpo: p.corpo === c ? null : c }))}
                                  className={chipClass(draft.corpo === c)}
                                >
                                  {c === 'pedindo-pausa' ? 'pedindo pausa' : c}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Nota: sem “aplicar”, sem feedback. A aplicação é silenciosa ao fechar. */}
                        </div>
                      )}
                    </div>

                    {/* Espaço deliberado para reduzir causalidade percebida */}
                    <div className="h-2" />

                    {/* CAMADA 3 — SUGESTÃO ÚNICA (card dominante) */}
                    <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6 md:p-7 shadow-[0_10px_26px_rgba(184,35,107,0.10)]">
                      <div className="space-y-3">
                        <div className="text-[12px] text-[#6a6a6a]">Se quiser, uma possibilidade agora</div>

                        <div className="space-y-1">
                          <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56] leading-tight">
                            {suggestion?.title ?? 'Uma possibilidade agora'}
                          </div>
                          <div className="text-[13px] md:text-[14px] text-[#545454] leading-relaxed">
                            {suggestion?.subtitle ?? 'Sem obrigação. Só se fizer sentido.'}
                          </div>
                        </div>

                        {suggestion?.lines?.length ? (
                          <div className="pt-2 space-y-1">
                            {suggestion.lines.slice(0, 4).map((line, i) => (
                              <div key={i} className="text-[13px] text-[#6a6a6a] leading-relaxed">
                                {line}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="pt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => (suggestion ? openSuggestion(suggestion) : undefined)}
                          className={actionPrimaryClass()}
                        >
                          Quero tentar agora
                        </button>

                        <button type="button" onClick={nextOption} className={actionSecondaryClass()}>
                          Outra opção
                        </button>

                        <button type="button" onClick={closeHere} className={actionTertiaryClass()}>
                          Encerrar por aqui
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* CAMADA 4 — EXPERIÊNCIA ÚNICA */}
                {active && !closed && (
                  <div className="space-y-6">
                    <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6 md:p-7 shadow-[0_10px_26px_rgba(184,35,107,0.10)]">
                      <div className="space-y-2">
                        <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56]">
                          {active.title}
                        </div>
                        <div className="text-[13px] md:text-[14px] text-[#545454] leading-relaxed">
                          {active.subtitle}
                        </div>

                        <div className="pt-3 space-y-1">
                          {active.lines.slice(0, 5).map((line, i) => (
                            <div key={i} className="text-[13px] text-[#6a6a6a] leading-relaxed">
                              {line}
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 text-[13px] text-[#6a6a6a]">
                          Por alguns instantes já está bom.
                        </div>
                      </div>

                      <div className="pt-5 flex flex-wrap gap-2">
                        <button type="button" onClick={alreadyEnough} className={actionPrimaryClass()}>
                          Já está bom por agora
                        </button>

                        <button type="button" onClick={backToPossibility} className={actionSecondaryClass()}>
                          Ver outra possibilidade
                        </button>

                        <button type="button" onClick={closeHere} className={actionTertiaryClass()}>
                          Encerrar por aqui
                        </button>
                      </div>

                      {/* CAMADA 5 — REGISTROS LATERAIS E SILENCIOSOS */}
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() => saveToMyDay(active.title)}
                          className="
                            inline-flex items-center
                            text-[12px] font-medium
                            text-[#2f3a56]
                            underline decoration-[#f5d7e5]
                            underline-offset-4
                            hover:opacity-90
                            transition
                            focus-visible:outline-none
                            focus-visible:ring-2 focus-visible:ring-[#fd2597]/30
                            rounded
                          "
                        >
                          Salvar no Meu Dia
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Encerramento gentil */}
                {closed && (
                  <div className="space-y-3">
                    <div className="text-[14px] font-semibold text-[#2f3a56]">
                      Isso já é suficiente por agora.
                    </div>
                    <Link
                      href="/maternar"
                      className="
                        inline-block rounded-full
                        bg-white border border-[#f5d7e5]
                        text-[#2f3a56]
                        px-4 py-2 text-[12px]
                        hover:bg-[#fff7fb]
                        transition
                      "
                    >
                      Voltar ao Maternar
                    </Link>
                  </div>
                )}
              </div>
            </SoftCard>

            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
