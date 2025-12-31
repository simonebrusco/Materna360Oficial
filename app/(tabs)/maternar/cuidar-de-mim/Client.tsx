'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

type View = 'entrada' | 'ritmo' | 'rotina' | 'pausas' | 'fechar'
type FocusMode = '1min' | '3min' | '5min'
type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'
type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

type Routine = {
  id: string
  title: string
  subtitle: string
  focus: FocusMode
  steps: string[]
  pauseDeck: { id: string; label: string; min: 1 | 2 }[]
  close: string
}

type LaterSave = {
  ts: number
  kind: 'routine'
  routineId: string
  focus: FocusMode
  ritmo: Ritmo
}

const LS_FOCUS = 'eu360_focus_time'
const LS_RITMO = 'eu360_ritmo'

// deck anti-repetição (por dia)
const LS_DECK_KEY_PREFIX = 'm360.cuidar_de_mim.deck.' // + dateKey
const LS_DECK_SEEN_PREFIX = 'm360.cuidar_de_mim.seen.' // + dateKey

// salvar para mais tarde (local)
const LS_SAVED_LATER = 'm360.cuidar_de_mim.saved_later_v1'

// Meu Dia Leve -> Meu Dia (continuidade) — reaproveitamos o mesmo padrão
const LS_RECENT_SAVE = 'my_day_recent_save_v1'

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

function safeRemoveLS(key: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  } catch {}
}

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function getBrazilDateKey(d: Date) {
  // YYYY-MM-DD em timezone local do browser (suficiente para deck diário)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function focusLabel(f: FocusMode) {
  if (f === '1min') return '1 min'
  if (f === '3min') return '3 min'
  return '5 min'
}

function focusTitle(f: FocusMode) {
  if (f === '1min') return 'Um respiro rápido'
  if (f === '3min') return 'Um reset curto'
  return 'Um cuidado com calma'
}

function focoHint(f: FocusMode) {
  if (f === '1min') return 'Para quando você só quer baixar o volume e seguir.'
  if (f === '3min') return 'Para quando dá para se reorganizar por dentro e continuar.'
  return 'Para quando você consegue cuidar com um pouco mais de calma.'
}

function ritmoTitle(r: Ritmo) {
  if (r === 'leve') return 'Ok. Vamos manter leve.'
  if (r === 'animada') return 'Boa. Vamos manter sem virar excesso.'
  if (r === 'cansada') return 'Entendido. Vamos recuperar um pouco de fôlego.'
  return 'Entendido. Vamos reduzir pressão primeiro.'
}

function ritmoHint(r: Ritmo) {
  if (r === 'leve') return 'A ideia é só te apoiar para seguir bem, sem inventar muito.'
  if (r === 'animada') return 'A ideia é manter o ritmo bom sem virar sobrecarga.'
  if (r === 'cansada') return 'A ideia é recuperar um pouco de energia com algo curto e possível.'
  return 'A ideia é destravar: um gesto pequeno agora já muda o resto do dia.'
}

const ROUTINES: Routine[] = [
  {
    id: 'r1',
    focus: '1min',
    title: 'Reset 60s (respirar e seguir)',
    subtitle: 'Um minuto para reduzir o ruído e voltar para o próximo passo do seu dia.',
    steps: ['Inspire 4', 'Segure 2', 'Solte 6', 'Repita 3x'],
    pauseDeck: [
      { id: 'p1', label: 'Respirar 1 min', min: 1 },
      { id: 'p2', label: 'Água (3 goles) + pausa', min: 1 },
      { id: 'p3', label: 'Ombros para baixo (3x)', min: 1 },
      { id: 'p4', label: 'Olhar pela janela (30s)', min: 1 },
    ],
    close: 'Pronto. Isso já é suficiente para seguir um pouco melhor.',
  },
  {
    id: 'r2',
    focus: '3min',
    title: 'Reset 3 min (água + pescoço + foco)',
    subtitle: 'Três minutos para retomar o controle do próximo gesto possível.',
    steps: ['Água: 3–5 goles', 'Pescoço: 3 giros leves', 'Respire: 4 lentas', 'Escolha 1 próxima ação pequena'],
    pauseDeck: [
      { id: 'p5', label: 'Água + pausa', min: 1 },
      { id: 'p6', label: 'Pescoço (30s)', min: 1 },
      { id: 'p7', label: 'Respirar 1 min', min: 1 },
      { id: 'p8', label: 'Alongar mãos (30s)', min: 1 },
    ],
    close: 'Feito. Você se deu um reinício sem parar o mundo.',
  },
  {
    id: 'r3',
    focus: '5min',
    title: 'Cuidar 5 min (corpo + ambiente mínimo)',
    subtitle: 'Cinco minutos para reduzir ruído e deixar o resto do dia mais fácil.',
    steps: ['Hidratante nas mãos (30s)', 'Braços: alongar 30s', 'Mão no peito: 4 respirações', '1 item no lugar'],
    pauseDeck: [
      { id: 'p9', label: 'Hidratante (2 min)', min: 2 },
      { id: 'p10', label: 'Braços (30s) + ombros', min: 1 },
      { id: 'p11', label: 'Respirar 1 min', min: 1 },
      { id: 'p12', label: 'Água + pausa', min: 1 },
    ],
    close: 'Pronto. Isso já deixa o resto do dia mais leve.',
  },
]

function inferFromEu360(): { focus: FocusMode; ritmo: Ritmo } {
  const focusRaw = safeGetLS(LS_FOCUS)
  const ritmoRaw = safeGetLS(LS_RITMO)

  const focus: FocusMode = focusRaw === '1min' || focusRaw === '3min' || focusRaw === '5min' ? focusRaw : '3min'
  const ritmo: Ritmo =
    ritmoRaw === 'leve' || ritmoRaw === 'cansada' || ritmoRaw === 'animada' || ritmoRaw === 'sobrecarregada'
      ? ritmoRaw
      : 'cansada'

  if (ritmo === 'sobrecarregada') return { focus: '1min', ritmo }
  return { focus, ritmo }
}

function originForCuidarDeMim(): TaskOrigin {
  return 'selfcare'
}

/**
 * Deck diário: garante variação e evita repetição até esgotar.
 * Não é “IA”, mas é “inteligência de experiência” (premium de verdade).
 */
function buildDailyDeck(dateKey: string, focus: FocusMode): string[] {
  const routinesForFocus = ROUTINES.filter((r) => r.focus === focus).map((r) => r.id)
  // fallback (se por algum motivo ficar vazio)
  const base = routinesForFocus.length ? routinesForFocus : ROUTINES.map((r) => r.id)

  // shuffle determinístico leve (não precisa ser criptográfico)
  const seed = `${dateKey}:${focus}`
  const arr = [...base]
  let x = 0
  for (let i = 0; i < seed.length; i++) x = (x + seed.charCodeAt(i) * 17) % 997

  for (let i = arr.length - 1; i > 0; i--) {
    x = (x * 37 + 13) % 997
    const j = x % (i + 1)
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }

  return arr
}

function getRoutineById(id: string) {
  return ROUTINES.find((r) => r.id === id) ?? ROUTINES[1]
}

export default function Client() {
  const router = useRouter()

  const [view, setView] = useState<View>('entrada')
  const [focus, setFocus] = useState<FocusMode>('3min')
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')

  const todayKey = useMemo(() => getBrazilDateKey(new Date()), [])

  // rotina atual (mudará com “Outra opção”)
  const [routineId, setRoutineId] = useState<string>('r2')

  // checklist gentil (opcional)
  const routine = useMemo(() => getRoutineById(routineId), [routineId])
  const [checked, setChecked] = useState<boolean[]>([])

  // pausas
  const [pauseIndex, setPauseIndex] = useState(0)

  // feedbacks
  const [saveFeedback, setSaveFeedback] = useState<string>('')

  function onExitNow() {
    try {
      track('cuidar_de_mim.exit', { view, routineId: routine.id, focus, ritmo, ts: Date.now() })
    } catch {}
    router.push('/maternar')
  }

  useEffect(() => {
    try {
      track('nav.view', { page: 'cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  useEffect(() => {
    const inferred = inferFromEu360()
    setFocus(inferred.focus)
    setRitmo(inferred.ritmo)
    setView('entrada')

    // inicializa deck e escolhe primeira opção do dia (sem repetição)
    const deckKey = `${LS_DECK_KEY_PREFIX}${todayKey}.${inferred.focus}`
    const seenKey = `${LS_DECK_SEEN_PREFIX}${todayKey}.${inferred.focus}`

    let deck = safeParseJSON<string[]>(safeGetLS(deckKey))
    let seen = safeParseJSON<string[]>(safeGetLS(seenKey)) ?? []

    if (!deck || !Array.isArray(deck) || deck.length === 0) {
      deck = buildDailyDeck(todayKey, inferred.focus)
      safeSetLS(deckKey, JSON.stringify(deck))
      safeSetLS(seenKey, JSON.stringify([]))
      seen = []
    }

    // pega a primeira não vista
    const nextId = deck.find((id) => !seen.includes(id)) ?? deck[0] ?? 'r2'
    setRoutineId(nextId)

    try {
      track('cuidar_de_mim.open', { focus: inferred.focus, ritmo: inferred.ritmo, routineId: nextId })
    } catch {}
  }, [todayKey])

  useEffect(() => {
    // checklist opcional
    setChecked(Array.from({ length: routine.steps.length }, () => false))
    setPauseIndex(0)
    setSaveFeedback('')
  }, [routine.id, routine.steps.length])

  function go(next: View) {
    setView(next)
    try {
      track('cuidar_de_mim.step', { step: next, routineId: routine.id, focus, ritmo })
    } catch {}
  }

  function onSelectFocus(next: FocusMode) {
    setFocus(next)
    safeSetLS(LS_FOCUS, next)

    // ao mudar focus, reinicia deck do dia para esse focus (sem travar)
    const deckKey = `${LS_DECK_KEY_PREFIX}${todayKey}.${next}`
    const seenKey = `${LS_DECK_SEEN_PREFIX}${todayKey}.${next}`

    const deck = buildDailyDeck(todayKey, next)
    safeSetLS(deckKey, JSON.stringify(deck))
    safeSetLS(seenKey, JSON.stringify([]))

    const nextId = deck[0] ?? 'r2'
    setRoutineId(nextId)

    try {
      track('cuidar_de_mim.focus.select', { focus: next, routineId: nextId })
    } catch {}
  }

  function onSelectRitmo(next: Ritmo) {
    setRitmo(next)
    safeSetLS(LS_RITMO, next)

    // sobrecarregada -> automaticamente sugere 1min (mas sem “punição”)
    if (next === 'sobrecarregada') {
      onSelectFocus('1min')
    }

    try {
      track('cuidar_de_mim.ritmo.select', { ritmo: next })
    } catch {}
  }

  function toggleStep(i: number) {
    setChecked((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      try {
        track('cuidar_de_mim.routine.toggle', { i, value: next[i], focus, ritmo, routineId: routine.id })
      } catch {}
      return next
    })
  }

  function markRoutineSeen(routineToMark: string) {
    const seenKey = `${LS_DECK_SEEN_PREFIX}${todayKey}.${focus}`
    const seen = safeParseJSON<string[]>(safeGetLS(seenKey)) ?? []
    if (!seen.includes(routineToMark)) {
      const next = [...seen, routineToMark]
      safeSetLS(seenKey, JSON.stringify(next))
    }
  }

  function pickAnotherOption() {
    const deckKey = `${LS_DECK_KEY_PREFIX}${todayKey}.${focus}`
    const seenKey = `${LS_DECK_SEEN_PREFIX}${todayKey}.${focus}`

    let deck = safeParseJSON<string[]>(safeGetLS(deckKey))
    let seen = safeParseJSON<string[]>(safeGetLS(seenKey)) ?? []

    if (!deck || !Array.isArray(deck) || deck.length === 0) {
      deck = buildDailyDeck(todayKey, focus)
      seen = []
      safeSetLS(deckKey, JSON.stringify(deck))
      safeSetLS(seenKey, JSON.stringify(seen))
    }

    // marca a atual como vista (para não voltar)
    if (!seen.includes(routineId)) {
      seen = [...seen, routineId]
      safeSetLS(seenKey, JSON.stringify(seen))
    }

    const nextId = deck.find((id) => !seen.includes(id))

    // se acabou, reembaralha e começa de novo, mas evita repetir imediatamente
    if (!nextId) {
      const rebuilt = buildDailyDeck(todayKey, focus)
      safeSetLS(deckKey, JSON.stringify(rebuilt))
      safeSetLS(seenKey, JSON.stringify([routineId]))
      const fallback = rebuilt.find((id) => id !== routineId) ?? rebuilt[0] ?? 'r2'
      setRoutineId(fallback)
      try {
        track('cuidar_de_mim.option.next', { focus, ritmo, from: routineId, to: fallback, exhausted: true })
      } catch {}
      return
    }

    setRoutineId(nextId)
    try {
      track('cuidar_de_mim.option.next', { focus, ritmo, from: routineId, to: nextId, exhausted: false })
    } catch {}
  }

  function saveForLater() {
    const payload: LaterSave = {
      ts: Date.now(),
      kind: 'routine',
      routineId: routine.id,
      focus,
      ritmo,
    }
    safeSetLS(LS_SAVED_LATER, JSON.stringify(payload))
    setSaveFeedback('Salvo para mais tarde.')
    try {
      track('cuidar_de_mim.save_later', { routineId: routine.id, focus, ritmo })
    } catch {}
  }

  async function saveToMyDay() {
    setSaveFeedback('')
    try {
      const title = `Cuidar de Mim: ${routine.title}`
      const noteInline = routine.steps.slice(0, 3).join(' · ')
      const titleFinal = noteInline ? `${title} — ${noteInline}` : title

      await addTaskToMyDay({
        title: titleFinal,
        origin: 'selfcare',
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })

      // sinal de continuidade para o Meu Dia (sem conteúdo sensível)
      safeSetLS(
        LS_RECENT_SAVE,
        JSON.stringify({
          ts: Date.now(),
          origin: 'selfcare',
          source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
        }),
      )

      setSaveFeedback('Adicionado ao Meu Dia.')
      markRoutineSeen(routine.id)

      try {
        track('cuidar_de_mim.save_my_day', { routineId: routine.id, focus, ritmo })
      } catch {}
    } catch {
      setSaveFeedback('Não consegui salvar agora. Se quiser, tente de novo.')
      try {
        track('cuidar_de_mim.save_my_day.error', { routineId: routine.id })
      } catch {}
    }
  }

  const pauseCard = useMemo(() => routine.pauseDeck[pauseIndex % routine.pauseDeck.length], [routine, pauseIndex])

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        eu360-hub-bg
        relative min-h-[100dvh]
        pb-28
        overflow-hidden
      "
    >
      <div className="page-shell relative z-10 w-full">
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition"
            onClick={() => {
              try {
                track('cuidar_de_mim.back_to_maternar', { ts: Date.now() })
              } catch {}
              onExitNow()
            }}
          >
            <AppIcon name="arrow-left" size={18} />
            <span className="text-[13px] font-semibold tracking-wide">Voltar</span>
          </button>

          <div className="mt-4">
            <span className="inline-flex items-center rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[12px] font-semibold tracking-[0.22em] text-white uppercase backdrop-blur-md">
              CUIDAR DE MIM
            </span>

            <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight">
              Um cuidado que cabe no seu dia
            </h1>

            <p className="mt-1 text-sm md:text-base text-white/90 max-w-2xl">
              Você escolhe o ritmo. E se não fizer sentido, a gente troca — sem drama.
            </p>
          </div>
        </header>

        {/* CONTROLES (sempre disponíveis, sem prender a mãe) */}
        <Reveal>
          <SoftCard className="bg-white/95 border border-[#F5D7E5] rounded-3xl p-5 md:p-6 shadow-[0_10px_26px_rgba(184,35,107,0.10)]">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                <AppIcon name="sliders" size={18} className="text-[#fd2597]" />
              </div>

              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-[#2f3a56]">Seu ritmo hoje</div>
                <div className="text-[13px] text-[#6a6a6a]">
                  Ajuste isso quando quiser. Não é compromisso — é só referência.
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* FOCUS */}
                  <div className="rounded-2xl border border-[#F5D7E5] bg-white p-4">
                    <div className="text-[12px] font-semibold tracking-wide text-[#b8236b] uppercase">Tempo</div>
                    <div className="mt-1 text-[14px] font-semibold text-[#2f3a56]">{focusTitle(focus)}</div>
                    <div className="mt-1 text-[12px] text-[#6a6a6a]">{focoHint(focus)}</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(['1min', '3min', '5min'] as FocusMode[]).map((f) => {
                        const active = f === focus
                        return (
                          <button
                            key={f}
                            type="button"
                            className={[
                              'rounded-full px-3 py-1.5 text-[12px] font-semibold transition',
                              active
                                ? 'bg-[#fd2597] text-white'
                                : 'bg-[#ffe1f1] text-[#545454] hover:bg-[#fdbed7]',
                            ].join(' ')}
                            onClick={() => onSelectFocus(f)}
                          >
                            {focusLabel(f)}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* RITMO */}
                  <div className="rounded-2xl border border-[#F5D7E5] bg-white p-4">
                    <div className="text-[12px] font-semibold tracking-wide text-[#b8236b] uppercase">Como você está</div>
                    <div className="mt-1 text-[14px] font-semibold text-[#2f3a56]">{ritmoTitle(ritmo)}</div>
                    <div className="mt-1 text-[12px] text-[#6a6a6a]">{ritmoHint(ritmo)}</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(['leve', 'animada', 'cansada', 'sobrecarregada'] as Ritmo[]).map((r) => {
                        const active = r === ritmo
                        return (
                          <button
                            key={r}
                            type="button"
                            className={[
                              'rounded-full px-3 py-1.5 text-[12px] font-semibold transition',
                              active
                                ? 'bg-[#2f3a56] text-white'
                                : 'bg-white border border-[#F5D7E5] text-[#545454] hover:bg-[#ffe1f1]',
                            ].join(' ')}
                            onClick={() => onSelectRitmo(r)}
                          >
                            {r === 'leve'
                              ? 'Leve'
                              : r === 'animada'
                                ? 'Animada'
                                : r === 'cansada'
                                  ? 'Cansada'
                                  : 'Sobrecarregada'}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Button variant="ghost" className="w-full sm:w-auto" onClick={onExitNow}>
                    Encerrar por aqui
                  </Button>
                </div>
              </div>
            </div>
          </SoftCard>
        </Reveal>

        {/* ROTINA PRINCIPAL (com livre arbítrio) */}
        <div className="mt-6 md:mt-8 space-y-5 md:space-y-6">
          <Reveal>
            <SoftCard className="bg-white rounded-3xl p-6 md:p-7 border border-[#F5D7E5] shadow-[0_10px_26px_rgba(184,35,107,0.10)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                    <AppIcon name="heart" size={20} className="text-[#fd2597]" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[12px] text-[#6a6a6a]">
                      Sugestão de agora • {focusLabel(focus)}
                    </div>
                    <h2 className="mt-1 text-[18px] md:text-[20px] font-semibold text-[#2f3a56] leading-snug">
                      {routine.title}
                    </h2>
                    <p className="mt-1 text-[14px] text-[#545454] leading-relaxed max-w-2xl">
                      {routine.subtitle}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex gap-2">
                  <Button
                    variant="secondary"
                    className="px-4"
                    onClick={() => pickAnotherOption()}
                    title="Trocar por outra opção"
                  >
                    Outra opção
                  </Button>
                </div>
              </div>

              {/* passos opcionais */}
              <div className="mt-5 rounded-2xl border border-[#F5D7E5]/70 bg-white p-4">
                <div className="text-[13px] font-semibold text-[#2f3a56]">Se quiser fazer agora</div>
                <div className="text-[12px] text-[#6a6a6a] mt-1">
                  Pode fazer tudo, pode fazer só um pedaço, ou pode pular. Tudo bem.
                </div>

                <ul className="mt-3 space-y-2">
                  {routine.steps.map((s, i) => (
                    <li key={`${routine.id}-${i}`} className="flex items-start gap-2">
                      <button
                        type="button"
                        className={[
                          'mt-0.5 h-5 w-5 rounded-md border transition flex items-center justify-center',
                          checked[i] ? 'bg-[#fd2597] border-[#fd2597]' : 'bg-white border-[#EEC2D6]',
                        ].join(' ')}
                        onClick={() => toggleStep(i)}
                        aria-label="Marcar passo"
                      >
                        {checked[i] ? <AppIcon name="check" size={14} className="text-white" /> : null}
                      </button>

                      <span className="text-[14px] text-[#545454] leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-col md:flex-row gap-2">
                  <Button
                    className="md:w-auto"
                    onClick={() => {
                      markRoutineSeen(routine.id)
                      go('pausas')
                    }}
                  >
                    Quero uma pausa guiada
                  </Button>

                  <Button variant="outline" className="md:w-auto" onClick={onExitNow}>
                    Encerrar por aqui
                  </Button>
                </div>
              </div>

              {/* ações de liberdade */}
              <div className="mt-4 flex flex-col md:flex-row gap-2">
                <Button variant="secondary" className="md:w-auto" onClick={saveForLater}>
                  Salvar para mais tarde
                </Button>

                <Button variant="outline" className="md:w-auto" onClick={saveToMyDay}>
                  Salvar no Meu Dia
                </Button>

                <Button variant="ghost" className="w-full md:w-auto md:ml-auto" onClick={onExitNow}>
                  Voltar ao Maternar
                </Button>
              </div>

              {saveFeedback ? (
                <div className="mt-3 text-[12px] text-[#6a6a6a]">{saveFeedback}</div>
              ) : null}
            </SoftCard>
          </Reveal>

          {/* PAUSA GUIADA (deck que troca de verdade) */}
          {view === 'pausas' ? (
            <Reveal>
              <SoftCard className="bg-white rounded-3xl p-6 md:p-7 border border-[#F5D7E5] shadow-[0_10px_26px_rgba(184,35,107,0.10)]">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                    <AppIcon name="sparkles" size={18} className="text-[#fd2597]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] text-[#6a6a6a]">Pausa do momento</div>
                    <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">{pauseCard.label}</div>
                    <div className="mt-1 text-[13px] text-[#545454]">
                      Tempo sugerido: {pauseCard.min} min. Se for menos, também serve.
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col md:flex-row gap-2">
                  <Button
                    variant="secondary"
                    className="md:w-auto"
                    onClick={() => {
                      setPauseIndex((p) => p + 1)
                      try {
                        track('cuidar_de_mim.pause.next', { routineId: routine.id, pauseId: pauseCard.id })
                      } catch {}
                    }}
                  >
                    Outra pausa
                  </Button>

                  <Button
                    className="md:w-auto"
                    onClick={() => {
                      go('fechar')
                      try {
                        track('cuidar_de_mim.pause.done', { routineId: routine.id, pauseId: pauseCard.id })
                      } catch {}
                    }}
                  >
                    Feito
                  </Button>

                  <Button
                    variant="outline"
                    className="md:w-auto"
                    onClick={onExitNow}
                    title="Voltar para o hub sem precisar concluir nada"
                  >
                    Encerrar por aqui
                  </Button>

                  <Button
                    variant="ghost"
                    className="md:w-auto md:ml-auto"
                    onClick={() => {
                      setView('entrada')
                      try {
                        track('cuidar_de_mim.pause.back', { routineId: routine.id })
                      } catch {}
                    }}
                  >
                    Voltar
                  </Button>
                </div>
              </SoftCard>
            </Reveal>
          ) : null}

          {/* FECHAMENTO (sem cobrança) */}
          {view === 'fechar' ? (
            <Reveal>
              <SoftCard className="bg-white rounded-3xl p-6 md:p-7 border border-[#F5D7E5] shadow-[0_10px_26px_rgba(184,35,107,0.10)]">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                    <AppIcon name="star" size={18} className="text-[#fd2597]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] text-[#545454] leading-relaxed">{routine.close}</div>
                    <div className="mt-2 text-[12px] text-[#6a6a6a]">
                      Se quiser, você pode guardar isso no seu dia — ou só seguir em frente.
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col md:flex-row gap-2">
                  <Button variant="outline" className="md:w-auto" onClick={saveToMyDay}>
                    Salvar no Meu Dia
                  </Button>

                  <Button variant="secondary" className="md:w-auto" onClick={() => pickAnotherOption()}>
                    Outra opção leve
                  </Button>

                  <Button className="w-full md:w-auto md:ml-auto" onClick={onExitNow}>
                    Voltar ao Maternar
                  </Button>

                  <Button variant="ghost" className="w-full md:w-auto" onClick={onExitNow}>
                    Encerrar por aqui
                  </Button>
                </div>

                {saveFeedback ? (
                  <div className="mt-3 text-[12px] text-[#6a6a6a]">{saveFeedback}</div>
                ) : null}
              </SoftCard>
            </Reveal>
          ) : null}
        </div>

        <div className="mt-10">
          <LegalFooter />
        </div>
      </div>

      <footer className="relative z-10 w-full text-center pt-4 pb-2 px-4 text-[12px] text-white/70">
        <p>2025 Materna360. Todos os direitos reservados.</p>
        <p>Proibida a reprodução total ou parcial sem autorização.</p>
      </footer>
    </main>
  )
}
