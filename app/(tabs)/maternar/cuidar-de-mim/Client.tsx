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
import { Button } from '@/components/ui/Button'
import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Ritmo = 'leve' | 'animada' | 'cansada' | 'sobrecarregada'
type DeckKey = 'respirar' | 'pausar' | 'acolher' | 'organizar' | 'corpo' | 'nada'

type Suggestion = {
  key: DeckKey
  title: string
  subtitle: string
  content: {
    heading: string
    lines: string[]
    gentleClose: string
  }
}

type View = 'hub' | 'experiencia'

const LS_PREFIX = 'm360:cuidar-de-mim:'
const LS_SAVED = `${LS_PREFIX}saved`
const LS_SEEN_PREFIX = `${LS_PREFIX}seen:`

function todayKey(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function hashToInt(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h >>> 0)
}

function pickIndex(seed: number, max: number): number {
  if (max <= 0) return 0
  return seed % max
}

function rotate<T>(arr: T[], startIndex: number): T[] {
  if (!arr.length) return arr
  const idx = ((startIndex % arr.length) + arr.length) % arr.length
  return [...arr.slice(idx), ...arr.slice(0, idx)]
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function seenStorageKey(day: string) {
  return `${LS_SEEN_PREFIX}${day}`
}

function getSeenForDay(day: string): DeckKey[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(seenStorageKey(day))
  const data = safeParse<DeckKey[]>(raw)
  return Array.isArray(data) ? (data as DeckKey[]) : []
}

function setSeenForDay(day: string, keys: DeckKey[]) {
  try {
    localStorage.setItem(seenStorageKey(day), JSON.stringify(keys))
  } catch {
    // silent
  }
}

function addSeen(day: string, key: DeckKey) {
  const current = getSeenForDay(day)
  if (current.includes(key)) return
  setSeenForDay(day, [...current, key])
}

function clearSeen(day: string) {
  try {
    localStorage.removeItem(seenStorageKey(day))
  } catch {
    // silent
  }
}

export default function Client() {
  const [view, setView] = useState<View>('hub')

  // CAMADA 1 — CHECK-IN (opcional e fragmentável): Ritmo / Energia / Emoção / Corpo
  const [ritmo, setRitmo] = useState<Ritmo | null>(null)
  const [energia, setEnergia] = useState<'baixa' | 'media' | 'alta' | null>(null)
  const [emocao, setEmocao] = useState<'neutra' | 'sensivel' | 'tensa' | 'carente' | null>(null)
  const [corpo, setCorpo] = useState<'tenso' | 'cansado' | 'ok' | 'pedindo-pausa' | null>(null)

  // Deck determinístico diário: seed do dia + cursor + seen diário
  const [deckCursor, setDeckCursor] = useState<number>(0)
  const [day, setDay] = useState<string>(todayKey())

  // “Salvar para mais tarde” (local) — sem UI de lista
  const [saved, setSaved] = useState<Array<{ key: DeckKey; title: string; ts: number }>>([])

  useEffect(() => {
    setDay(todayKey())
  }, [])

  useEffect(() => {
    const data = safeParse<Array<{ key: DeckKey; title: string; ts: number }>>(
      typeof window !== 'undefined' ? localStorage.getItem(LS_SAVED) : null
    )
    if (data && Array.isArray(data)) setSaved(data)
  }, [])

  useEffect(() => {
    track('maternar_cuidar_de_mim_view', { view })
  }, [view])

  const suggestions = useMemo(() => buildDeck(), [])

  const baseRotated = useMemo(() => {
    const seed = hashToInt(`${day}|cuidar-de-mim`)
    const start = pickIndex(seed, suggestions.length)
    return rotate(suggestions, start)
  }, [day, suggestions])

  const cursorRotated = useMemo(() => rotate(baseRotated, deckCursor), [baseRotated, deckCursor])

  const current = useMemo(() => {
    const seen = getSeenForDay(day)
    const firstUnseen = cursorRotated.find((s) => !seen.includes(s.key))
    if (firstUnseen) return firstUnseen
    clearSeen(day)
    return cursorRotated[0] ?? suggestions[0]
  }, [cursorRotated, day, suggestions])

  const [activeSuggestionKey, setActiveSuggestionKey] = useState<DeckKey | null>(null)
  const activeSuggestion = useMemo(() => {
    if (!activeSuggestionKey) return null
    return suggestions.find((s) => s.key === activeSuggestionKey) ?? null
  }, [activeSuggestionKey, suggestions])

  const heroSubtitle = useMemo(() => {
    if (ritmo === 'sobrecarregada') return 'Você não precisa fazer nada agora. Se quiser, pode escolher só uma coisa pequena.'
    if (ritmo === 'cansada') return 'Se quiser, escolha algo que ajude um pouco. Se não fizer sentido, tudo bem.'
    return 'Se quiser, escolha algo que ajude um pouco. Se não fizer sentido, tudo bem.'
  }, [ritmo])

  function onOtherOption() {
    addSeen(day, current.key)
    setDeckCursor((c) => c + 1)
    track('maternar_cuidar_de_mim_other_option', { key: current.key })
  }

  function onOpenSuggestion(s: Suggestion) {
    addSeen(day, s.key)
    setActiveSuggestionKey(s.key)
    setView('experiencia')
    track('maternar_cuidar_de_mim_open_experience', { key: s.key })
  }

  function onCloseHere() {
    track('maternar_cuidar_de_mim_close_here', { view })
    setActiveSuggestionKey(null)
    setView('hub')
  }

  function onSaveLocal(s: Suggestion) {
    const next = [{ key: s.key, title: s.title, ts: Date.now() }, ...saved.filter((x) => x.key !== s.key)].slice(0, 20)
    setSaved(next)
    try {
      localStorage.setItem(LS_SAVED, JSON.stringify(next))
    } catch {
      // silent
    }
    track('maternar_cuidar_de_mim_save_local', { key: s.key })
  }

  async function onSaveToMyDay(s: Suggestion) {
    const title = `Cuidar de mim: ${s.title}`
    try {
      await addTaskToMyDay({
        title,
        origin: 'selfcare',
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })
      track('maternar_cuidar_de_mim_save_my_day', { key: s.key })
    } catch {
      track('maternar_cuidar_de_mim_save_my_day_error', { key: s.key })
    }
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fdbed7_0%,#ffe1f1_62%,#ffffff_100%)]">
        <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-5 sm:px-6">
          <Reveal>
            {/* HEADER UNIFICADO (top bar + hero) */}
            <div className="rounded-3xl bg-[#fd2597] px-5 py-5 text-white shadow-[0_10px_28px_rgba(0,0,0,0.10)] sm:px-6 sm:py-6">
              <div className="flex items-center justify-between">
                <Link href="/maternar" className="flex items-center gap-2 text-sm text-white/90">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                    <AppIcon name="arrow-left" className="h-4 w-4 text-white" />
                  </span>
                  <span>Voltar</span>
                </Link>

                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white">CUIDAR DE MIM</span>
              </div>

              <div className="mt-5">
                <h1 className="text-[26px] font-semibold leading-tight sm:text-[30px]">Um espaço para se respeitar</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/90">{heroSubtitle}</p>
              </div>
            </div>

            {/* CAMADA 0 — ENTRADA (convite aberto + saída clara) */}
            <div className="mt-6">
              <SoftCard className="rounded-3xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-[#b8236b]">CONVITE ABERTO</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#545454]">O que você sente que precisa agora?</h2>
                    <p className="mt-2 text-sm text-[#6A6A6A]">Se não quiser escolher nada, você pode encerrar por aqui.</p>
                  </div>

                  <Link
                    href="/maternar"
                    className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--color-border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[#545454] hover:-translate-y-[1px] hover:shadow-[0_8px_18px_rgba(0,0,0,0.06)]"
                  >
                    Encerrar por aqui
                  </Link>
                </div>

                {/* CAMADA 1 — CHECK-IN (OPCIONAL E FRAGMENTÁVEL) */}
                <div className="mt-5 rounded-3xl border border-[var(--color-border-soft)] bg-white p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-[#b8236b]">SE QUISER, UM CHECK-IN</p>
                      <p className="mt-1 text-sm text-[#6A6A6A]">Pode ser só uma coisa. Pode pular tudo. Não existe “incompleto”.</p>
                    </div>
                    <span className="text-xs text-[#A0A0A0]">opcional</span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <MiniField
                      label="Ritmo"
                      hint="Só uma referência."
                      options={[
                        { id: 'leve', label: 'Leve' },
                        { id: 'animada', label: 'Animada' },
                        { id: 'cansada', label: 'Cansada' },
                        { id: 'sobrecarregada', label: 'Sobrecarregada' },
                      ]}
                      value={ritmo}
                      onChange={(v) => {
                        setRitmo(v as Ritmo)
                        track('maternar_cuidar_de_mim_checkin', { key: 'ritmo', value: v })
                      }}
                    />

                    <MiniField
                      label="Energia"
                      hint="Só para o app não pesar."
                      options={[
                        { id: 'baixa', label: 'Baixa' },
                        { id: 'media', label: 'Média' },
                        { id: 'alta', label: 'Alta' },
                      ]}
                      value={energia}
                      onChange={(v) => {
                        setEnergia(v as any)
                        track('maternar_cuidar_de_mim_checkin', { key: 'energia', value: v })
                      }}
                    />

                    <MiniField
                      label="Emoção"
                      hint="Se quiser, um nome simples."
                      options={[
                        { id: 'neutra', label: 'Neutra' },
                        { id: 'sensivel', label: 'Sensível' },
                        { id: 'tensa', label: 'Tensa' },
                        { id: 'carente', label: 'Carente' },
                      ]}
                      value={emocao}
                      onChange={(v) => {
                        setEmocao(v as any)
                        track('maternar_cuidar_de_mim_checkin', { key: 'emocao', value: v })
                      }}
                    />

                    <MiniField
                      label="Corpo"
                      hint="Um sinal simples."
                      options={[
                        { id: 'tenso', label: 'Tenso' },
                        { id: 'cansado', label: 'Cansado' },
                        { id: 'ok', label: 'Ok' },
                        { id: 'pedindo-pausa', label: 'Pedindo pausa' },
                      ]}
                      value={corpo}
                      onChange={(v) => {
                        setCorpo(v as any)
                        track('maternar_cuidar_de_mim_checkin', { key: 'corpo', value: v })
                      }}
                    />
                  </div>
                </div>
              </SoftCard>
            </div>

            {/* CAMADA 2 — CAMPO DE POSSIBILIDADES */}
            <div className="mt-6">
              <SoftCard className="rounded-3xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ffe1f1]">
                      <AppIcon name="heart" className="h-5 w-5 text-[#b8236b]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-[#6A6A6A]">Se quiser, uma possibilidade agora</p>
                      <h3 className="mt-1 truncate text-lg font-semibold text-[#545454]">{current.title}</h3>
                      <p className="mt-1 text-sm text-[#6A6A6A]">{current.subtitle}</p>
                    </div>
                  </div>

                  <Button variant="ghost" onClick={onOtherOption}>
                    Outra opção
                  </Button>
                </div>

                <div className="mt-5 rounded-3xl border border-[var(--color-border-soft)] bg-white p-4 sm:p-5">
                  <p className="text-sm font-semibold text-[#545454]">{current.content.heading}</p>
                  <div className="mt-3 space-y-2">
                    {current.content.lines.map((line, idx) => (
                      <p key={idx} className="text-sm text-[#6A6A6A]">
                        {line}
                      </p>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button onClick={() => onOpenSuggestion(current)} className="rounded-full bg-[#fd2597] px-6 py-3 text-white shadow-lg">
                      Quero tentar agora
                    </Button>

                    <Link href="/maternar" className="text-sm font-semibold text-[#545454] underline-offset-2 hover:underline">
                      Encerrar por aqui
                    </Link>
                  </div>
                </div>

                {/* AÇÕES — sempre visíveis (sem coleção) */}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" onClick={() => onSaveLocal(current)}>
                      Salvar para mais tarde
                    </Button>
                    <Button variant="secondary" onClick={() => void onSaveToMyDay(current)}>
                      Salvar no Meu Dia
                    </Button>
                  </div>

                  <Link href="/maternar" className="text-sm font-semibold text-[#545454] underline-offset-2 hover:underline">
                    Voltar ao Maternar
                  </Link>
                </div>
              </SoftCard>
            </div>

            {/* CAMADA 3 — EXPERIÊNCIA ÚNICA + CAMADA 4 — ENCERRAMENTO GENTIL */}
            {view === 'experiencia' && activeSuggestion && (
              <div className="mt-6">
                <SoftCard className="rounded-3xl">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-[#6A6A6A]">Experiência única</p>
                      <h3 className="mt-1 text-lg font-semibold text-[#545454]">{activeSuggestion.title}</h3>
                      <p className="mt-1 text-sm text-[#6A6A6A]">Você pode parar a qualquer momento.</p>
                    </div>

                    <button type="button" onClick={onCloseHere} className="text-sm font-semibold text-[#545454] underline-offset-2 hover:underline">
                      Encerrar por aqui
                    </button>
                  </div>

                  <div className="mt-5 rounded-3xl border border-[var(--color-border-soft)] bg-white p-4 sm:p-5">
                    <p className="text-sm font-semibold text-[#545454]">{activeSuggestion.content.heading}</p>
                    <div className="mt-3 space-y-2">
                      {activeSuggestion.content.lines.map((line, idx) => (
                        <p key={idx} className="text-sm text-[#6A6A6A]">
                          {line}
                        </p>
                      ))}
                    </div>

                    <div className="mt-4 rounded-3xl bg-[#ffe1f1] p-4 sm:p-5">
                      <p className="text-sm text-[#545454]">{activeSuggestion.content.gentleClose}</p>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      <Button
                        onClick={() => {
                          track('maternar_cuidar_de_mim_enough', { key: activeSuggestion.key })
                          setActiveSuggestionKey(null)
                          setView('hub')
                        }}
                        className="rounded-full bg-[#fd2597] px-6 py-3 text-white shadow-lg"
                      >
                        Já está bom por agora
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          track('maternar_cuidar_de_mim_back_to_options', { key: activeSuggestion.key })
                          setActiveSuggestionKey(null)
                          setView('hub')
                          setDeckCursor((c) => c + 1)
                        }}
                      >
                        Ver outra possibilidade
                      </Button>

                      <button type="button" onClick={onCloseHere} className="text-sm font-semibold text-[#545454] underline-offset-2 hover:underline">
                        Encerrar por aqui
                      </button>
                    </div>
                  </div>
                </SoftCard>
              </div>
            )}

            <div className="mt-10">
              <LegalFooter />
            </div>
          </Reveal>
        </div>
      </div>
    </ClientOnly>
  )
}

/**
 * Deck editorial FIXO (sem pesos, sem contexto).
 * Variação APENAS via:
 * - rotação determinística por dia (seed)
 * - cursor “Outra opção”
 * - seen diário (anti-repetição real)
 */
function buildDeck(): Suggestion[] {
  return [
    {
      key: 'respirar',
      title: 'Respirar por alguns instantes',
      subtitle: 'Um respiro curto para reduzir ruído, sem precisar “fazer certo”.',
      content: {
        heading: 'Se quiser, pode tentar assim',
        lines: [
          'Solte o ar devagar, como se estivesse esvaziando o peito.',
          'Depois, deixe o próximo ar entrar sozinho — sem esforço.',
          'Você pode parar a qualquer momento. Um instante já serve.',
        ],
        gentleClose: 'Isso já é suficiente por agora. Não precisa fazer mais nada.',
      },
    },
    {
      key: 'pausar',
      title: 'Pausa sem explicação',
      subtitle: 'Permissão para não responder nada agora.',
      content: {
        heading: 'Uma pausa possível',
        lines: ['Se der, apoie os pés no chão.', 'Olhe para um ponto fixo por alguns segundos.', 'Só isso. Sem interpretar. Sem resolver.'],
        gentleClose: 'Você pode parar aqui. Parar também é cuidado.',
      },
    },
    {
      key: 'acolher',
      title: 'Um gesto de acolhimento',
      subtitle: 'Uma frase que reduz cobrança, antes de qualquer decisão.',
      content: {
        heading: 'Uma frase para agora',
        lines: ['“Eu posso estar cansada e ainda assim estar fazendo o meu melhor.”', 'Se não fizer sentido, ignore. Se fizer, guarde só um pedaço.'],
        gentleClose: 'Guardar um pedaço já conta. Não precisa completar nada.',
      },
    },
    {
      key: 'organizar',
      title: 'Se organizar por dentro',
      subtitle: 'Nomeie por um instante, sem virar lista de tarefas.',
      content: {
        heading: 'Se quiser, só nomeie',
        lines: ['Uma coisa que está pesando.', 'Uma coisa que pode esperar.', 'Uma coisa pequena que te ajuda agora (mesmo que seja água).'],
        gentleClose: 'Se você só conseguiu nomear, já foi suficiente.',
      },
    },
    {
      key: 'corpo',
      title: 'Soltar um pouco do corpo',
      subtitle: 'Um micro-ajuste físico, sem alongamento “certo”.',
      content: {
        heading: 'Um ajuste simples',
        lines: ['Relaxe os ombros uma vez, bem devagar.', 'Desencoste a língua do céu da boca.', 'Se quiser, boceje ou alongue o pescoço de leve.'],
        gentleClose: 'O corpo entendeu. Você pode parar aqui.',
      },
    },
    {
      key: 'nada',
      title: 'Não fazer nada agora',
      subtitle: 'Sim — isso também é uma escolha válida.',
      content: {
        heading: 'Permissão total',
        lines: ['Se nada fizer sentido, tudo bem.', 'Você pode fechar esta tela e seguir o seu dia.', 'Quando (ou se) quiser voltar, o app continua aqui — sem cobrança.'],
        gentleClose: 'Encerrar agora é completamente válido.',
      },
    },
  ]
}

function MiniField(props: {
  label: string
  hint: string
  options: Array<{ id: string; label: string }>
  value: string | null
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-[#545454]">{props.label}</p>
        <p className="mt-1 text-xs text-[#6A6A6A]">{props.hint}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {props.options.map((opt) => {
          const active = props.value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => props.onChange(opt.id)}
              className={cx(
                'rounded-full px-3 py-1 text-xs font-semibold transition-all',
                active ? 'bg-[#fd2597] text-white shadow-[0_6px_22px_rgba(0,0,0,0.06)]' : 'bg-[#ffe1f1] text-[#545454] hover:-translate-y-[1px]'
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
