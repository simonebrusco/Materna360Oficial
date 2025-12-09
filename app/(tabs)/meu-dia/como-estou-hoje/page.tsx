'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import clsx from 'clsx'

import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon'

import { toast } from '@/app/lib/toast'
import { updateXP } from '@/app/lib/xp'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'

// ======================================================
// TYPES & CONSTANTS
// ======================================================

type MoodId = 'calma' | 'cansada' | 'sobrecarregada' | 'grata'
type EnergyLevel = 'baixa' | 'variando' | 'ok' | 'alta'

const DAILY_CHECKIN_LIMIT = 3
const CHECKIN_STORAGE_PREFIX = 'como-estou-hoje:checkin:'
const LAST_CHECKIN_SNAPSHOT_KEY = 'como-estou-hoje:last'
const PARTIAL_STATE_KEY = 'como-estou-hoje:partial'

type MoodOption = {
  id: MoodId
  label: string
  description: string
  icon: AppIconName
}

type EnergyOption = {
  id: EnergyLevel
  label: string
  helper: string
}

type DailyInsight = {
  phrase: string
  reminder: string
}

type CheckinSnapshot = {
  moodId?: MoodId | null
  energyId?: EnergyLevel | null
  note?: string | null
  dateKey?: string
}

// ======================================================
// HELPERS
// ======================================================

const moodOptions: MoodOption[] = [
  {
    id: 'calma',
    label: 'Mais tranquila',
    description:
      'O dia pode estar cheio, mas o coração está um pouco mais sereno.',
    icon: 'sparkles',
  },
  {
    id: 'cansada',
    label: 'Cansada',
    description: 'Você está fazendo o que pode com a energia que tem.',
    icon: 'time',
  },
  {
    id: 'sobrecarregada',
    label: 'Sobrecarregada',
    description: 'Muita coisa ao mesmo tempo. Você não está sozinha nisso.',
    icon: 'filters',
  },
  {
    id: 'grata',
    label: 'Grata',
    description: 'Mesmo com tudo, existe um carinho pelo caminho até aqui.',
    icon: 'heart',
  },
]

const energyOptions: EnergyOption[] = [
  {
    id: 'baixa',
    label: 'Baixa',
    helper: 'Só o básico hoje já é muita coisa.',
  },
  {
    id: 'variando',
    label: 'Oscilando',
    helper: 'Tem horas boas e horas desafiadoras.',
  },
  { id: 'ok', label: 'Ok', helper: 'Dá pra seguir o dia, com pausas.' },
  {
    id: 'alta',
    label: 'Alta',
    helper: 'Hoje a energia ajuda a dar uns passinhos a mais.',
  },
]

function getCheckinStorageKey(dateKey: string) {
  return `${CHECKIN_STORAGE_PREFIX}${dateKey}:count`
}

// Insight padrão caso a IA falhe
const DEFAULT_INSIGHT: DailyInsight = {
  phrase:
    'Hoje é seu dia, e tudo bem se não estiver perfeito. Entre riscos e bagunças, você faz o melhor que pode — e isso já é muito.',
  reminder:
    'Cinco minutos de respiração profunda ou um abraço apertado em quem está por perto também são cuidado.',
}

// ======================================================
// PAGE COMPONENT
// ======================================================

export default function ComoEstouHojePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const abrir = searchParams?.get('abrir') ?? undefined

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])

  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null)
  const [selectedEnergy, setSelectedEnergy] =
    useState<EnergyLevel | null>(null)
  const [note, setNote] = useState('')

  const [usedCheckinsToday, setUsedCheckinsToday] = useState(0)

  const { addItem } = usePlannerSavedContents()

  const isOverLimit = usedCheckinsToday >= DAILY_CHECKIN_LIMIT

  // Insight do dia (IA)
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)

  // ======================================================
  // EFFECTS – CONTAGEM, ESTADO SALVO E NAVEGAÇÃO
  // ======================================================

  // Carrega número de check-ins do dia + telemetria de abertura
  useEffect(() => {
    const storageKey = getCheckinStorageKey(currentDateKey)
    const stored = load(storageKey)

    if (typeof stored === 'number') {
      setUsedCheckinsToday(stored)
    } else if (typeof stored === 'string') {
      const parsed = Number(stored)
      if (!Number.isNaN(parsed)) {
        setUsedCheckinsToday(parsed)
      }
    }

    try {
      track('como_estou_hoje.page_opened', {
        dateKey: currentDateKey,
        abrir: abrir ?? null,
      })
    } catch {
      // telemetria nunca quebra UX
    }
  }, [currentDateKey, abrir])

  // Carrega snapshot do último check-in do dia (confirmado)
  useEffect(() => {
    const snapshot = load<CheckinSnapshot | null>(LAST_CHECKIN_SNAPSHOT_KEY)

    if (!snapshot || snapshot.dateKey !== currentDateKey) return

    if (snapshot.moodId) setSelectedMood(snapshot.moodId)
    if (snapshot.energyId) setSelectedEnergy(snapshot.energyId)
    if (snapshot.note) setNote(snapshot.note)
  }, [currentDateKey])

  // Carrega estado parcial (rascunho) se existir para o dia atual
  useEffect(() => {
    const partial = load<CheckinSnapshot | null>(PARTIAL_STATE_KEY)
    if (!partial || partial.dateKey !== currentDateKey) return

    if (partial.moodId) setSelectedMood(partial.moodId)
    if (partial.energyId) setSelectedEnergy(partial.energyId)
    if (partial.note) setNote(partial.note)
  }, [currentDateKey])

  // Salva estado parcial sempre que humor, energia ou nota mudarem
  useEffect(() => {
    const partial: CheckinSnapshot = {
      moodId: selectedMood,
      energyId: selectedEnergy,
      note,
      dateKey: currentDateKey,
    }
    save(PARTIAL_STATE_KEY, partial)
  }, [selectedMood, selectedEnergy, note, currentDateKey])

  // Navegação interna com ?abrir=checkin | semana
  useEffect(() => {
    if (!abrir) return

    const id =
      abrir === 'checkin'
        ? 'bloco-checkin'
        : abrir === 'semana'
        ? 'bloco-semana'
        : null

    if (id) {
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 200)
    }
  }, [abrir])

  // Carrega insight do dia da IA (com fallback suave)
  useEffect(() => {
    let cancelled = false

    const fetchInsight = async () => {
      setInsightLoading(true)
      try {
        try {
          track('como_estou_hoje.insight.requested_backend', {
            dateKey: currentDateKey,
          })
        } catch {
          // ignora
        }

        const res = await fetch('/api/ai/emocional', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature: 'insight_do_dia',
            origin: 'como-estou-hoje',
          }),
        })

        if (!res.ok) {
          throw new Error('Resposta inválida do backend de IA')
        }

        const data = await res.json()
        const insight = data?.insight

        const normalized: DailyInsight = {
          phrase: insight?.phrase || DEFAULT_INSIGHT.phrase,
          reminder: insight?.reminder || DEFAULT_INSIGHT.reminder,
        }

        if (!cancelled) {
          setDailyInsight(normalized)
        }

        try {
          track('como_estou_hoje.insight.generated_backend', {
            dateKey: currentDateKey,
            hasInsight: Boolean(insight),
          })
        } catch {
          // ignora
        }
      } catch (error) {
        console.error(
          '[Como Estou Hoje] Erro ao buscar insight do dia, usando fallback:',
          error,
        )
        if (!cancelled) {
          setDailyInsight(DEFAULT_INSIGHT)
        }
        try {
          track('como_estou_hoje.insight.fallback_used', {
            dateKey: currentDateKey,
          })
        } catch {
          // ignora
        }
      } finally {
        if (!cancelled) {
          setInsightLoading(false)
        }
      }
    }

    void fetchInsight()

    return () => {
      cancelled = true
    }
  }, [currentDateKey])

  // ======================================================
  // ACTIONS – CHECK-IN
  // ======================================================

  const handleCheckin = async () => {
    if (isOverLimit) {
      toast.info(
        'Você já registrou como está hoje algumas vezes. O resto do dia pode ser só vivido, do seu jeito 💗',
      )
      try {
        track('como_estou_hoje.checkin.limit_reached', {
          dateKey: currentDateKey,
        })
      } catch {
        // ignora
      }
      return
    }

    if (!selectedMood && !selectedEnergy && !note.trim()) {
      toast.info(
        'Escolha pelo menos um sentimento ou escreva uma frase sobre o seu dia.',
      )
      return
    }

    const moodLabel = selectedMood
      ? moodOptions.find(m => m.id === selectedMood)?.label ?? selectedMood
      : null

    const energyLabel = selectedEnergy
      ? energyOptions.find(e => e.id === selectedEnergy)?.label ??
        selectedEnergy
      : null

    try {
      // Salva no planner
      addItem({
        origin: 'como-estou-hoje',
        type: 'insight',
        title: 'Como estou hoje',
        payload: {
          dateKey: currentDateKey,
          moodId: selectedMood,
          moodLabel,
          energyId: selectedEnergy,
          energyLabel,
          note: note.trim() || null,
        },
      })

      // Snapshot do último check-in do dia
      const snapshot: CheckinSnapshot = {
        moodId: selectedMood,
        energyId: selectedEnergy,
        note: note.trim() || null,
        dateKey: currentDateKey,
      }
      save(LAST_CHECKIN_SNAPSHOT_KEY, snapshot)

      // XP – gesto emocional importante
      try {
        await updateXP(10)
      } catch (e) {
        console.error('[Como Estou Hoje] Erro ao atualizar XP:', e)
      }

      // Atualiza contador diário
      const storageKey = getCheckinStorageKey(currentDateKey)
      setUsedCheckinsToday(prev => {
        const next = prev + 1
        save(storageKey, next)
        return next
      })

      try {
        track('como_estou_hoje.checkin_registered', {
          dateKey: currentDateKey,
          mood: selectedMood ?? null,
          energy: selectedEnergy ?? null,
          hasNote: note.trim().length > 0,
        })
      } catch {
        // ignora
      }

      toast.success('Seu momento foi registrado com carinho 💗')
      setNote('') // limpa só o texto, mantendo humor/energia
    } catch (error) {
      console.error('[Como Estou Hoje] Erro ao registrar check-in:', error)
      toast.danger(
        'Não consegui registrar seu momento agora. Tenta de novo em instantes?',
      )
    }
  }

  const handleGoToConquistas = () => {
    try {
      track('como_estou_hoje.go_to_conquistas_clicked', {
        dateKey: currentDateKey,
      })
    } catch {
      // ignora
    }

    router.push('/maternar/minhas-conquistas?abrir=painel')
  }

  // ======================================================
  // ACTIONS – SUGESTÕES DA SEMANA (leva pro planner)
  // ======================================================

  const handleSaveWeeklySuggestion = (id: string) => {
    try {
      let title = ''
      let description = ''
      let tag = ''

      if (id === 'pausa') {
        title = 'Respire fundo nos momentos difíceis'
        description =
          'Uma pausa de 5 minutos pode recarregar sua energia quando o dia apertar.'
        tag = 'Pausa'
      } else if (id === 'conexao') {
        title = 'Momento com seu filho'
        description =
          'Um abraço ou conversa de 10 minutos fortalece o vínculo e acalma ambos.'
        tag = 'Conexão'
      } else if (id === 'rotina') {
        title = 'Mantenha um pequeno ritual'
        description =
          'Café da manhã tranquilo, alongamento leve ou um chá à noite ajudam a trazer um pouco de estabilidade.'
        tag = 'Rotina'
      }

      addItem({
        origin: 'como-estou-hoje',
        type: 'insight',
        title,
        payload: {
          tag,
          description,
          dateKey: currentDateKey,
          source: 'sugestoes-semana',
        },
      })

      try {
        void updateXP(4)
      } catch (e) {
        console.error(
          '[Como Estou Hoje] Erro ao atualizar XP (sugestão semanal):',
          e,
        )
      }

      toast.success('Sugestão levada para o planner ✨')
    } catch (error) {
      console.error(
        '[Como Estou Hoje] Erro ao salvar sugestão semanal:',
        error,
      )
      toast.danger('Não consegui levar essa sugestão pro planner agora.')
    }
  }

  const handleSaveInsight = () => {
    try {
      const insight = dailyInsight ?? DEFAULT_INSIGHT

      addItem({
        origin: 'como-estou-hoje',
        type: 'insight',
        title: 'Insight do dia',
        payload: {
          description: insight.phrase,
          reminder: insight.reminder,
          dateKey: currentDateKey,
          source: 'insight-diario',
        },
      })

      try {
        void updateXP(4)
      } catch (e) {
        console.error(
          '[Como Estou Hoje] Erro ao atualizar XP (insight do dia):',
          e,
        )
      }

      try {
        track('como_estou_hoje.insight.saved', {
          dateKey: currentDateKey,
        })
      } catch {
        // ignora
      }

      toast.success('Insight levado para o planner ✨')
    } catch (error) {
      console.error('[Como Estou Hoje] Erro ao salvar insight do dia:', error)
      toast.danger('Não consegui levar esse insight pro planner agora.')
    }
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div
      data-layout="hub-interno"
      className="
        min-h-[100dvh]
        pb-24
        flex
        flex-col
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#fdbed7_0%,#fdbed7_26%,#ffe1f1_56%,#ffffff_90%,#ffffff_100%)]
      "
    >
      <PageTemplate
        label="MEU DIA"
        title="Como estou hoje"
        subtitle="Um espaço seguro para você nomear o que sente, sem julgamentos."
      >
        <ClientOnly>
          {/* coluna central mais estreita + mais respiro entre blocos */}
          <div className="pt-6 pb-12 space-y-10 max-w-5xl mx-auto">
            {/* TEXTO DE ABERTURA */}
            <div className="space-y-2">
              <p className="text-sm md:text-base text-white">
                <span className="font-semibold">
                  Antes da lista de tarefas, vem você.
                </span>{' '}
                Aqui você registra como está hoje, sem precisar estar bem o
                tempo todo.
              </p>
              <p className="text-xs md:text-sm text-white/80">
                Nomear o que você sente é um gesto de cuidado. O Materna360
                transforma isso em pequenas conquistas ao longo da semana.
              </p>
            </div>

            {/* ===========================
                BLOCO 1 — COMO VOCÊ ESTÁ AGORA
            ============================ */}
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white/95 border border-[#ffd8e6] shadow-[0_14px_40px_rgba(0,0,0,0.16)]">
              <div id="bloco-checkin" className="space-y-6">
                <header className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                    Check-in emocional
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                    Como seu coração chega até aqui hoje?
                  </h2>
                  <p className="text-sm text-[#545454] max-w-2xl">
                    Não existe resposta certa. Use este espaço como se fosse uma
                    conversa sincera com você mesma.
                  </p>
                </header>

                {/* HUMOR + ENERGIA EM GRID */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Coluna A – humor + nota */}
                  <div className="space-y-6">
                    {/* HUMOR */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                        Se você pudesse escolher uma palavra para o dia…
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {moodOptions.map(mood => {
                          const isActive = selectedMood === mood.id
                          return (
                            <button
                              key={mood.id}
                              type="button"
                              onClick={() =>
                                setSelectedMood(current =>
                                  current === mood.id ? null : mood.id,
                                )
                              }
                              className={clsx(
                                'group flex flex-col items-start gap-1.5 rounded-2xl border px-3 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/40',
                                isActive
                                  ? 'border-[#ff005e] bg-[#ffd8e6]/50 shadow-[0_10px_26px_rgba(0,0,0,0.08)]'
                                  : 'border-[#ffd8e6] bg-white hover:border-[#ff005e]/70 hover:bg-[#ffd8e6]/20',
                              )}
                            >
                              <div className="flex items-center gap-1.5">
                                <AppIcon
                                  name={mood.icon}
                                  className={clsx(
                                    'h-4 w-4',
                                    isActive
                                      ? 'text-[#ff005e]'
                                      : 'text-[#cf285f]',
                                  )}
                                />
                                <span
                                  className={clsx(
                                    'text-[13px] font-semibold',
                                    isActive
                                      ? 'text-[#ff005e]'
                                      : 'text-[#2f3a56]',
                                  )}
                                >
                                  {mood.label}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#545454] leading-snug">
                                {mood.description}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* NOTA DO DIA */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                        Quer desabafar um pouquinho?
                      </p>
                      <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Se quiser, escreva em poucas linhas algo que marcou o seu dia até agora. Ninguém aqui vai te julgar."
                        rows={4}
                        className="w-full rounded-2xl border border-[#ffd8e6] px-3 py-2 text-xs md:text-sm text-[#2f3a56] placeholder-[#545454]/40 focus:outline-none focus:ring-1 focus:ring-[#ff005e]"
                      />
                      <p className="text-[11px] text-[#545454]/80">
                        Esse registro fica guardado com carinho no seu planner,
                        como parte da sua jornada.
                      </p>
                    </div>
                  </div>

                  {/* Coluna B – energia + insight do dia (IA) */}
                  <div className="space-y-5">
                    {/* ENERGIA */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                        E a sua energia hoje?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {energyOptions.map(option => {
                          const isActive = selectedEnergy === option.id
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() =>
                                setSelectedEnergy(current =>
                                  current === option.id ? null : option.id,
                                )
                              }
                              className={clsx(
                                'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/30',
                                isActive
                                  ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                                  : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/20',
                              )}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                      {selectedEnergy && (
                        <p className="text-[11px] text-[#545454]">
                          {
                            energyOptions.find(e => e.id === selectedEnergy)
                              ?.helper
                          }
                        </p>
                      )}
                    </div>

                    {/* INSIGHT DO DIA – IA + fallback */}
                    <div className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb]/80 px-4 py-3 space-y-2 shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff005e]/90">
                        Insight do dia
                      </p>

                      {insightLoading && (
                        <p className="text-[11px] text-[#545454]">
                          Pensando em um insight carinhoso pra hoje…
                        </p>
                      )}

                      {!insightLoading && (
                        <>
                          <p className="text-xs text-[#545454]">
                            {(dailyInsight || DEFAULT_INSIGHT).phrase}
                          </p>
                          <p className="text-[11px] text-[#545454]">
                            Lembrete suave:{' '}
                            <span className="font-medium text-[#2f3a56]">
                              {(dailyInsight || DEFAULT_INSIGHT).reminder}
                            </span>
                          </p>
                        </>
                      )}

                      <div className="pt-1 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="border border-[#ff005e]/40 text-[#ff005e] hover:bg-[#ffd8e6]/40 px-3 py-1 text-[11px] rounded-full"
                          onClick={handleSaveInsight}
                          disabled={insightLoading}
                        >
                          Levar para o planner
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AÇÕES PRINCIPAIS + LINK CONQUISTAS */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1 text-[11px] text-[#545454]/90">
                    <p>
                      Hoje você já fez{' '}
                      <span className="font-semibold text-[#2f3a56]">
                        {usedCheckinsToday} de {DAILY_CHECKIN_LIMIT}
                      </span>{' '}
                      check-ins emocionais.
                    </p>
                    {isOverLimit && (
                      <p className="text-[#ff005e] font-medium">
                        Você chegou ao limite de registros por hoje. O que você
                        já fez até aqui já conta muito 💗
                      </p>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={handleCheckin}
                    disabled={isOverLimit}
                    className="w-full md:w-auto"
                  >
                    Registrar como estou hoje
                  </Button>
                </div>

                {/* FAIXA — VER MINHAS CONQUISTAS */}
                <div className="mt-1 rounded-2xl bg-[#fff7fb] border border-[#ffd8e6]/90 px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-[11px] md:text-xs text-[#545454] max-w-md">
                    Se quiser ver tudo isso traduzido em{' '}
                    <span className="font-semibold text-[#2f3a56]">
                      XP, selos e presença ao longo dos dias
                    </span>
                    , você pode abrir seu painel completo de conquistas.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={handleGoToConquistas}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ff005e]/40 bg-white px-4 py-2 text-[11px] font-semibold text-[#ff005e] shadow-[0_8px_18px_rgba(0,0,0,0.10)] hover:bg-[#ffd8e6]/40 hover:border-[#ff005e]"
                  >
                    <span>Ver minhas conquistas</span>
                    <AppIcon name="arrow-right" className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </SoftCard>

            {/* ===========================
                BLOCO 2 — COMO SUA SEMANA TEM SE DESENHADO
            ============================ */}
            <SoftCard className="rounded-3xl p-5 md:p-6 bg-white/95 border border-[#ffd8e6] shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              <div id="bloco-semana" className="space-y-5">
                <header className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                    Semana
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                    Como sua semana tem se desenhado
                  </h2>
                  <p className="text-sm text-[#545454] max-w-2xl">
                    Um olhar mais amplo para os seus dias: padrões emocionais e
                    pequenas ideias para deixar a semana mais leve.
                  </p>
                </header>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Minha semana emocional */}
                  <div className="space-y-3 rounded-2xl border border-[#ffd8e6]/70 bg-white px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff005e]/90">
                      Minha semana emocional
                    </p>
                    <p className="text-xs text-[#545454] leading-relaxed">
                      Nem todo dia será leve, e tudo bem. A maternidade traz
                      momentos de cansaço que não precisam virar culpa.
                      Reconhecer o que pesa é um passo pra se cuidar melhor.
                      Permita-se pausas e cuide de você com a mesma delicadeza
                      que cuida dos outros.
                    </p>
                    <p className="text-xs text-[#545454] leading-relaxed">
                      Quando os dias fluem com menos pressa, aproveite esses
                      momentos para recarregar. Quando o dia pesa um pouco mais,
                      lembre-se de que é normal precisar de um tempo — e que
                      isso não diminui seu valor como mãe.
                    </p>
                  </div>

                  {/* Sugestões pensadas para esta semana */}
                  <div className="space-y-3 rounded-2xl border border-[#ffd8e6]/70 bg-white px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff005e]/90">
                      Sugestões pensadas para você esta semana
                    </p>

                    <div className="space-y-3 text-xs text-[#545454]">
                      <div className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb]/80 px-3 py-3 space-y-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#cf285f]">
                          <span className="rounded-full bg-[#ffd8e6] px-2 py-0.5">
                            Pausa
                          </span>
                        </span>
                        <p className="font-semibold text-[#2f3a56]">
                          Respire fundo nos momentos difíceis
                        </p>
                        <p>
                          Uma pausa de 5 minutos pode recarregar sua energia
                          quando o dia apertar.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSaveWeeklySuggestion('pausa')}
                          className="mt-1 text-[11px] font-semibold text-[#ff005e] hover:text-[#cf285f] transition-colors"
                        >
                          Levar para o planner →
                        </button>
                      </div>

                      <div className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb]/80 px-3 py-3 space-y-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#cf285f]">
                          <span className="rounded-full bg-[#ffd8e6] px-2 py-0.5">
                            Conexão
                          </span>
                        </span>
                        <p className="font-semibold text-[#2f3a56]">
                          Momento com seu filho
                        </p>
                        <p>
                          Um abraço ou conversa de 10 minutos fortalece o
                          vínculo e acalma os dois.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSaveWeeklySuggestion('conexao')}
                          className="mt-1 text-[11px] font-semibold text-[#ff005e] hover:text-[#cf285f] transition-colors"
                        >
                          Levar para o planner →
                        </button>
                      </div>

                      <div className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb]/80 px-3 py-3 space-y-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#cf285f]">
                          <span className="rounded-full bg-[#ffd8e6] px-2 py-0.5">
                            Rotina
                          </span>
                        </span>
                        <p className="font-semibold text-[#2f3a56]">
                          Mantenha um pequeno ritual
                        </p>
                        <p>
                          Café da manhã tranquilo, alongamento leve ou um chá à
                          noite ajudam a trazer um pouco de estabilidade.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSaveWeeklySuggestion('rotina')}
                          className="mt-1 text-[11px] font-semibold text-[#ff005e] hover:text-[#cf285f] transition-colors"
                        >
                          Levar para o planner →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SoftCard>

            {/* BLOCO 3 — EXPLICAÇÃO SUAVE (mantido) */}
            <SoftCard className="rounded-3xl p-5 md:p-6 bg-white/90 border border-white/70 shadow-[0_6px_18px_rgba(0,0,0,0.08)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide">
                    Por que isso importa
                  </p>
                  <p className="text-sm text-[#545454] max-w-xl">
                    Cada vez que você registra como está, o Materna360 te ajuda
                    a enxergar padrões: dias mais leves, dias mais pesados,
                    momentos em que você precisa de mais apoio. Isso vira base
                    para o seu planner e para as suas conquistas.
                  </p>
                </div>
                <div className="mt-1 flex items-start gap-2 text-xs text-[#545454]/90 max-w-xs">
                  <div className="mt-0.5">
                    <AppIcon
                      name="sparkles"
                      className="h-4 w-4 text-[#ff005e]"
                    />
                  </div>
                  <p>
                    Você não precisa se encaixar em nenhuma versão de mãe
                    perfeita. Aqui, cada registro é um gesto de presença com
                    você mesma.
                  </p>
                </div>
              </div>
            </SoftCard>

            <MotivationalFooter routeKey="meu-dia-como-estou-hoje" />
          </div>
        </ClientOnly>
      </PageTemplate>
    </div>
  )
}
