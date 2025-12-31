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
type FocusMode = '1min' | '3min' | '5min'
type CheckinKey = 'ritmo' | 'energia' | 'emocao' | 'corpo'

type DeckKey = 'respirar' | 'pausar' | 'acolher' | 'organizar' | 'corpo' | 'nada'

type Suggestion = {
  key: DeckKey
  title: string
  subtitle: string
  // Conteúdo curto e não-instrucional; sempre opcional e “encerrável”
  content: {
    heading: string
    lines: string[]
    gentleClose: string
  }
  // rótulo neutro, sem “meta”
  recommended?: FocusMode
}

type View = 'hub' | 'experiencia'

const LS_PREFIX = 'm360:cuidar-de-mim:'
const LS_SAVED = `${LS_PREFIX}saved`

function todayKey(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function hashToInt(input: string): number {
  // hash determinístico simples (sem libs)
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

export default function Client() {
  const [view, setView] = useState<View>('hub')

  // Check-in (opcional e fragmentável)
  const [ritmo, setRitmo] = useState<Ritmo | null>(null)
  const [energia, setEnergia] = useState<'baixa' | 'media' | 'alta' | null>(null)
  const [emocao, setEmocao] = useState<'neutra' | 'sensivel' | 'tensa' | 'carente' | null>(null)
  const [corpo, setCorpo] = useState<'tenso' | 'cansado' | 'ok' | 'pedindo-pausa' | null>(null)
  const [focusMode, setFocusMode] = useState<FocusMode>('1min')

  // Deck diário anti-repetição
  const [deckCursor, setDeckCursor] = useState<number>(0)

  // Sugestão atual e seleção
  const suggestions = useMemo(() => buildDeck({ ritmo, energia, emocao, corpo }), [ritmo, energia, emocao, corpo])

  const rotatedSuggestions = useMemo(() => {
    const day = todayKey()
    const baseSeed = hashToInt(`${day}|cuidar-de-mim|${ritmo ?? 'na'}|${energia ?? 'na'}|${emocao ?? 'na'}|${corpo ?? 'na'}`)
    const start = pickIndex(baseSeed, suggestions.length)
    // deck determinístico por dia + estado, e o cursor muda “Outra opção”
    const rotated = rotate(suggestions, start)
    return rotate(rotated, deckCursor)
  }, [suggestions, deckCursor, ritmo, energia, emocao, corpo])

  const current = rotatedSuggestions[0] ?? suggestions[0]

  const [activeSuggestionKey, setActiveSuggestionKey] = useState<DeckKey | null>(null)
  const activeSuggestion = useMemo(() => {
    if (!activeSuggestionKey) return null
    return suggestions.find((s) => s.key === activeSuggestionKey) ?? null
  }, [activeSuggestionKey, suggestions])

  // Restore “salvos para mais tarde” (local)
  const [saved, setSaved] = useState<Array<{ key: DeckKey; title: string; ts: number }>>([])

  useEffect(() => {
    const data = safeParse<Array<{ key: DeckKey; title: string; ts: number }>>(typeof window !== 'undefined' ? localStorage.getItem(LS_SAVED) : null)
    if (data && Array.isArray(data)) setSaved(data)
  }, [])

  useEffect(() => {
    track('maternar_cuidar_de_mim_view', { view })
  }, [view])

  function onOtherOption() {
    setDeckCursor((c) => c + 1)
    track('maternar_cuidar_de_mim_other_option')
  }

  function onOpenSuggestion(s: Suggestion) {
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
    const next = [
      { key: s.key, title: s.title, ts: Date.now() },
      ...saved.filter((x) => x.key !== s.key).slice(0, 9),
    ]
    setSaved(next)
    try {
      localStorage.setItem(LS_SAVED, JSON.stringify(next))
    } catch {
      // silent
    }
    track('maternar_cuidar_de_mim_save_local', { key: s.key })
  }

  async function onSaveToMyDay(s: Suggestion) {
    // Não existe note; incorporamos contexto no title (curto, sem cobrança)
    const title = `Cuidar de mim: ${s.title}`
    try {
      await addTaskToMyDay({
        title,
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })
      track('maternar_cuidar_de_mim_save_my_day', { key: s.key })
    } catch {
      // silent: sem toast de “falhou” (proibido)
      track('maternar_cuidar_de_mim_save_my_day_error', { key: s.key })
    }
  }

  const heroSubtitle = useMemo(() => {
    // convite de permissão: sempre antes do check-in
    if (ritmo === 'sobrecarregada') return 'Você não precisa dar conta de tudo agora. Se quiser, escolhe só uma coisa pequena.'
    if (ritmo === 'cansada') return 'Se quiser, escolhe algo que ajude um pouco. Se não fizer sentido, a gente troca — sem drama.'
    return 'Se quiser, escolhe algo que ajude um pouco. Se não fizer sentido, a gente troca — sem drama.'
  }, [ritmo])

  return (
    <ClientOnly>
      <div
        className={cx(
          'min-h-screen',
          // Gradiente Interno Suave (páginas internas)
          'bg-[radial-gradient(circle_at_top_left,#fdbed7_0%,#ffe1f1_70%,#ffffff_100%)]'
        )}
      >
        <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
          <Reveal>
            {/* Top bar */}
            <div className="mb-4 flex items-center justify-between">
              <Link href="/maternar" className="flex items-center gap-2 text-sm text-white/90">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <AppIcon name="arrow-left" className="h-4 w-4 text-white" />
                </span>
                <span>Voltar</span>
              </Link>

              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white">
                CUIDAR DE MIM
              </span>
            </div>

            {/* Hero */}
            <div className="rounded-3xl bg-[#fd2597] px-6 py-6 text-white shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
              <h1 className="text-[28px] font-semibold leading-tight">Um cuidado que cabe no seu dia</h1>
              <p className="mt-2 text-sm text-white/90">{heroSubtitle}</p>
            </div>

            {/* ENTRADA: convite aberto + saída sempre visível */}
            <div className="mt-6">
              <SoftCard className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#6A6A6A]">Convite aberto</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#545454]">O que você sente que precisa agora?</h2>
                    <p className="mt-2 text-sm text-[#6A6A6A]">
                      Se quiser, escolha algo. Se não quiser, tudo bem — você pode encerrar por aqui.
                    </p>
                  </div>

                  <Link href="/maternar" className="shrink-0 text-sm text-[#545454] underline-offset-2 hover:underline">
                    Encerrar por aqui
                  </Link>
                </div>

                {/* CHECK-IN (OPCIONAL E FRAGMENTÁVEL) */}
                <div className="mt-6 rounded-2xl border border-[var(--color-border-soft)] bg-[#ffffff] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[#b8236b]">SE QUISER AJUSTAR ALGO</p>
                      <p className="mt-1 text-sm text-[#6A6A6A]">
                        Pode ser só uma coisa. Pode pular tudo. Nada aqui é obrigatório.
                      </p>
                    </div>
                    <span className="text-xs text-[#A0A0A0]">opcional</span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {/* Ritmo */}
                    <MiniField
                      label="Ritmo"
                      hint="Só uma referência, não um compromisso."
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

                    {/* Tempo (modo de foco) – não é meta; só “quanto cabe” */}
                    <MiniField
                      label="Quanto cabe agora"
                      hint="Se for menos, também serve."
                      options={[
                        { id: '1min', label: 'Um instante' },
                        { id: '3min', label: 'Pouco tempo' },
                        { id: '5min', label: 'Um pouco mais' },
                      ]}
                      value={focusMode}
                      onChange={(v) => {
                        setFocusMode(v as FocusMode)
                        track('maternar_cuidar_de_mim_checkin', { key: 'tempo', value: v })
                      }}
                    />

                    {/* Energia */}
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

                    {/* Corpo */}
                    <MiniField
                      label="Corpo"
                      hint="Se quiser, um sinal simples."
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

            {/* CAMPO DE POSSIBILIDADES (1 sugestão + outra opção + encerrar sempre visível) */}
            <div className="mt-6">
              <SoftCard>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffe1f1]">
                      <AppIcon name="heart" className="h-5 w-5 text-[#b8236b]" />
                    </span>
                    <div>
                      <p className="text-sm text-[#6A6A6A]">Se quiser, uma possibilidade agora</p>
                      <h3 className="mt-1 text-lg font-semibold text-[#545454]">{current.title}</h3>
                      <p className="mt-1 text-sm text-[#6A6A6A]">{current.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={onOtherOption}>
                      Outra opção
                    </Button>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[var(--color-border-soft)] bg-white p-4">
                  <p className="text-sm font-semibold text-[#545454]">{current.content.heading}</p>
                  <div className="mt-3 space-y-2">
                    {current.content.lines.map((line, idx) => (
                      <p key={idx} className="text-sm text-[#6A6A6A]">
                        {line}
                      </p>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => onOpenSuggestion(current)}
                      className="rounded-full bg-[#fd2597] px-6 py-3 text-white shadow-lg"
                    >
                      Quero tentar agora
                    </Button>

                    <Link href="/maternar" className="text-sm text-[#545454] underline-offset-2 hover:underline">
                      Encerrar por aqui
                    </Link>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" onClick={() => onSaveLocal(current)}>
                      Salvar para mais tarde
                    </Button>
                    <Button variant="secondary" onClick={() => void onSaveToMyDay(current)}>
                      Salvar no Meu Dia
                    </Button>
                  </div>

                  <Link href="/maternar" className="text-sm text-[#545454] underline-offset-2 hover:underline">
                    Voltar ao Maternar
                  </Link>
                </div>

                {/* Lista curta de salvos locais (opcional, sem cobrança) */}
                {saved.length > 0 && (
                  <div className="mt-6 border-t border-[var(--color-border-soft)] pt-4">
                    <p className="text-sm font-semibold text-[#545454]">Guardados para quando fizer sentido</p>
                    <div className="mt-3 grid gap-2">
                      {saved.slice(0, 3).map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => {
                            const found = suggestions.find((x) => x.key === s.key)
                            if (found) onOpenSuggestion(found)
                          }}
                          className="flex items-center justify-between rounded-2xl border border-[var(--color-border-soft)] bg-white px-4 py-3 text-left transition-all hover:-translate-y-[1px] hover:shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
                        >
                          <span className="text-sm font-medium text-[#545454]">{s.title}</span>
                          <span className="text-xs text-[#6A6A6A]">abrir</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </SoftCard>
            </div>

            {/* EXPERIÊNCIA ÚNICA (uma tela; sem subfluxo; encerrável) */}
            {view === 'experiencia' && activeSuggestion && (
              <div className="mt-6">
                <SoftCard>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#6A6A6A]">Experiência única</p>
                      <h3 className="mt-1 text-lg font-semibold text-[#545454]">{activeSuggestion.title}</h3>
                      <p className="mt-1 text-sm text-[#6A6A6A]">
                        {focusMode === '1min'
                          ? 'Por alguns instantes já está bom.'
                          : focusMode === '3min'
                          ? 'Se você quiser ficar um pouco, tudo bem.'
                          : 'Se couber um pouco mais, ótimo. Se não, tudo bem.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onCloseHere}
                      className="text-sm text-[#545454] underline-offset-2 hover:underline"
                    >
                      Encerrar por aqui
                    </button>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[var(--color-border-soft)] bg-white p-4">
                    <p className="text-sm font-semibold text-[#545454]">{activeSuggestion.content.heading}</p>
                    <div className="mt-3 space-y-2">
                      {activeSuggestion.content.lines.map((line, idx) => (
                        <p key={idx} className="text-sm text-[#6A6A6A]">
                          {line}
                        </p>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#ffe1f1] p-4">
                      <p className="text-sm text-[#545454]">{activeSuggestion.content.gentleClose}</p>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Button
                        onClick={() => {
                          // Encerramento interno — sem “feito”, sem performance
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
                          // Outra opção dentro da experiência: retorna para o hub (sem loop)
                          track('maternar_cuidar_de_mim_back_to_options', { key: activeSuggestion.key })
                          setActiveSuggestionKey(null)
                          setView('hub')
                          setDeckCursor((c) => c + 1)
                        }}
                      >
                        Ver outra possibilidade
                      </Button>

                      <button
                        type="button"
                        onClick={onCloseHere}
                        className="text-sm text-[#545454] underline-offset-2 hover:underline"
                      >
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
 * Deck editorial + variação determinística
 * - Sem “IA falante”
 * - Sem repetição mecânica
 * - Sem instrução imperativa
 */
function buildDeck(ctx: {
  ritmo: Ritmo | null
  energia: 'baixa' | 'media' | 'alta' | null
  emocao: 'neutra' | 'sensivel' | 'tensa' | 'carente' | null
  corpo: 'tenso' | 'cansado' | 'ok' | 'pedindo-pausa' | null
}): Suggestion[] {
  const base: Suggestion[] = [
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
      recommended: '1min',
    },
    {
      key: 'pausar',
      title: 'Pausa sem explicação',
      subtitle: 'Um minuto de permissão para não responder nada agora.',
      content: {
        heading: 'Uma pausa possível',
        lines: [
          'Se der, apoie os pés no chão.',
          'Olhe para um ponto fixo por alguns segundos.',
          'Só isso. Sem interpretar. Sem resolver.',
        ],
        gentleClose: 'Você pode encerrar aqui. Parar também é cuidado.',
      },
      recommended: '1min',
    },
    {
      key: 'acolher',
      title: 'Um gesto de acolhimento',
      subtitle: 'Uma frase que reduz cobrança, antes de qualquer decisão.',
      content: {
        heading: 'Uma frase para agora',
        lines: [
          '“Eu posso estar cansada e ainda assim estar fazendo o meu melhor.”',
          'Se não fizer sentido, ignore. Se fizer, guarde só um pedaço.',
        ],
        gentleClose: 'Guardar um pedaço já conta. Não precisa completar nada.',
      },
      recommended: '1min',
    },
    {
      key: 'organizar',
      title: 'Se organizar por dentro',
      subtitle: 'Uma organização interna curta, sem virar lista de tarefas.',
      content: {
        heading: 'Se quiser, só nomeie',
        lines: [
          'Uma coisa que está pesando.',
          'Uma coisa que pode esperar.',
          'Uma coisa pequena que te ajuda agora (mesmo que seja água).',
        ],
        gentleClose: 'Se você só conseguiu nomear, já foi suficiente.',
      },
      recommended: '3min',
    },
    {
      key: 'corpo',
      title: 'Soltar um pouco do corpo',
      subtitle: 'Um micro-ajuste físico, sem alongamento “certo”.',
      content: {
        heading: 'Um ajuste simples',
        lines: [
          'Relaxe os ombros uma vez, bem devagar.',
          'Desencoste a língua do céu da boca.',
          'Se quiser, boceje ou alongue o pescoço de leve.',
        ],
        gentleClose: 'O corpo entendeu. Você pode parar aqui.',
      },
      recommended: '1min',
    },
    {
      key: 'nada',
      title: 'Não fazer nada agora',
      subtitle: 'Sim — isso também é uma escolha válida.',
      content: {
        heading: 'Permissão total',
        lines: [
          'Se nada fizer sentido, tudo bem.',
          'Você pode fechar esta tela e seguir o seu dia.',
          'Quando (ou se) quiser voltar, o app continua aqui — sem cobrança.',
        ],
        gentleClose: 'Encerrar agora é completamente válido.',
      },
      recommended: '1min',
    },
  ]

  // Ajuste fino por contexto (sem “inferência explícita”)
  // Apenas reordena e suaviza a entrada do deck.
  const w: Record<DeckKey, number> = {
    respirar: 1,
    pausar: 1,
    acolher: 1,
    organizar: 1,
    corpo: 1,
    nada: 1,
  }

  if (ctx.ritmo === 'sobrecarregada') {
    w.nada += 3
    w.pausar += 2
    w.respirar += 2
    w.organizar -= 1
  } else if (ctx.ritmo === 'cansada') {
    w.respirar += 2
    w.pausar += 2
    w.corpo += 1
  } else if (ctx.ritmo === 'animada') {
    w.organizar += 2
    w.acolher += 1
  }

  if (ctx.energia === 'baixa') {
    w.nada += 2
    w.pausar += 1
    w.organizar -= 1
  }
  if (ctx.corpo === 'tenso' || ctx.corpo === 'pedindo-pausa') {
    w.corpo += 2
    w.respirar += 1
  }
  if (ctx.emocao === 'tensa') {
    w.pausar += 2
    w.acolher += 1
  }
  if (ctx.emocao === 'carente' || ctx.emocao === 'sensivel') {
    w.acolher += 2
  }

  // Cria lista com repetição controlada por peso (sem duplicar na UI; apenas prioriza)
  const expanded: Suggestion[] = []
  for (const s of base) {
    const count = Math.max(1, Math.min(4, w[s.key] ?? 1))
    for (let i = 0; i < count; i++) expanded.push(s)
  }

  // Remove duplicatas mantendo a primeira ocorrência (priorizada)
  const seen = new Set<DeckKey>()
  const ordered: Suggestion[] = []
  for (const s of expanded) {
    if (seen.has(s.key)) continue
    seen.add(s.key)
    ordered.push(s)
  }

  // Garantia: sempre devolve todas as chaves (fallback)
  if (ordered.length < base.length) {
    for (const s of base) {
      if (!ordered.some((x) => x.key === s.key)) ordered.push(s)
    }
  }

  return ordered
}

function MiniField(props: {
  label: string
  hint: string
  options: Array<{ id: string; label: string }>
  value: string | null
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[#ffffff] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#545454]">{props.label}</p>
          <p className="mt-1 text-xs text-[#6A6A6A]">{props.hint}</p>
        </div>
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
                active
                  ? 'bg-[#fd2597] text-white shadow-[0_6px_22px_rgba(0,0,0,0.06)]'
                  : 'bg-[#ffe1f1] text-[#545454] hover:-translate-y-[1px]'
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
