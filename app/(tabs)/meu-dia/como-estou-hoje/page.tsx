'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import clsx from 'clsx'

import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'

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

// ======================================================
// HELPERS
// ======================================================

const moodOptions: {
  id: MoodId
  label: string
  description: string
  icon: string
}[] = [
  {
    id: 'calma',
    label: 'Mais tranquila',
    description: 'O dia pode estar cheio, mas o coração está um pouco mais sereno.',
    icon: '🌿',
  },
  {
    id: 'cansada',
    label: 'Cansada',
    description: 'Você está fazendo o que pode com a energia que tem.',
    icon: '😮‍💨',
  },
  {
    id: 'sobrecarregada',
    label: 'Sobrecarregada',
    description: 'Muita coisa ao mesmo tempo. Você não está sozinha nisso.',
    icon: '💥',
  },
  {
    id: 'grata',
    label: 'Grata',
    description: 'Mesmo com tudo, existe um carinho pelo caminho até aqui.',
    icon: '💗',
  },
]

const energyOptions: {
  id: EnergyLevel
  label: string
  helper: string
}[] = [
  { id: 'baixa', label: 'Baixa', helper: 'Só o básico hoje já é muita coisa.' },
  { id: 'variando', label: 'Oscilando', helper: 'Tem horas boas e horas desafiadoras.' },
  { id: 'ok', label: 'Ok', helper: 'Dá pra seguir o dia, com pausas.' },
  { id: 'alta', label: 'Alta', helper: 'Hoje a energia ajuda a dar uns passinhos a mais.' },
]

function getCheckinStorageKey(dateKey: string) {
  return `${CHECKIN_STORAGE_PREFIX}${dateKey}:count`
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
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel | null>(null)
  const [note, setNote] = useState('')

  const [usedCheckinsToday, setUsedCheckinsToday] = useState(0)

  const { addItem } = usePlannerSavedContents()

  const isOverLimit = usedCheckinsToday >= DAILY_CHECKIN_LIMIT

  // Carrega o número de check-ins do dia
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

  // ======================================================
  // ACTIONS
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
      toast.info('Escolha pelo menos um sentimento ou escreva uma frase sobre o seu dia.')
      return
    }

    const moodLabel = selectedMood
      ? moodOptions.find((m) => m.id === selectedMood)?.label ?? selectedMood
      : null

    const energyLabel = selectedEnergy
      ? energyOptions.find((e) => e.id === selectedEnergy)?.label ?? selectedEnergy
      : null

    try {
      // Salva no Planner
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

      // XP – gesto emocional importante
      try {
        await updateXP(10)
      } catch (e) {
        console.error('[Como Estou Hoje] Erro ao atualizar XP:', e)
      }

      // Atualiza contador diário
      const storageKey = getCheckinStorageKey(currentDateKey)
      setUsedCheckinsToday((prev) => {
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

      // Opcional: limpa apenas a nota, mantém mood/energy
      setNote('')
    } catch (error) {
      console.error('[Como Estou Hoje] Erro ao registrar check-in:', error)
      toast.danger('Não consegui registrar seu momento agora. Tenta de novo em instantes?')
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
  // RENDER
  // ======================================================

  return (
    <PageTemplate
      label="MEU DIA"
      title="Como estou hoje"
      subtitle="Um espaço seguro para você nomear o que sente, sem julgamentos."
    >
      <ClientOnly>
        <div className="pt-6 pb-10 space-y-8">
          {/* TEXTO DE ABERTURA */}
          <div className="space-y-2">
            <p className="text-sm md:text-base text-white">
              <span className="font-semibold">Antes da lista de tarefas, vem você.</span>{' '}
              Aqui você registra como está hoje, sem precisar estar bem o tempo todo.
            </p>
            <p className="text-xs md:text-sm text-white/80">
              Nomear o que você sente é um gesto de cuidado. O Materna360 transforma isso em
              pequenas conquistas ao longo da semana.
            </p>
          </div>

          {/* BLOCO 1 — COMO VOCÊ SE SENTE HOJE */}
          <SoftCard className="rounded-3xl p-6 md:p-8 bg-white/95 border border-[#ffd8e6] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="space-y-6">
              <header className="space-y-1">
                <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                  Check-in emocional
                </p>
                <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                  Como seu coração chega até aqui hoje?
                </h2>
                <p className="text-sm text-[#545454] max-w-2xl">
                  Não existe resposta certa. Use este espaço como se fosse uma conversa sincera com
                  você mesma.
                </p>
              </header>

              {/* MUDOS (chips) */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                  Se você pudesse escolher uma palavra para o dia…
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {moodOptions.map((mood) => {
                    const isActive = selectedMood === mood.id
                    return (
                      <button
                        key={mood.id}
                        type="button"
                        onClick={() =>
                          setSelectedMood((current) =>
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
                        <span className="text-lg leading-none">{mood.icon}</span>
                        <span
                          className={clsx(
                            'text-[13px] font-semibold',
                            isActive ? 'text-[#ff005e]' : 'text-[#2f3a56]',
                          )}
                        >
                          {mood.label}
                        </span>
                        <span className="text-[11px] text-[#545454] leading-snug">
                          {mood.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ENERGIA DO DIA */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                  E a sua energia hoje?
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {energyOptions.map((option) => {
                      const isActive = selectedEnergy === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setSelectedEnergy((current) =>
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
                        energyOptions.find((e) => e.id === selectedEnergy)
                          ?.helper
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* NOTA OPCIONAL */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                  Quer desabafar um pouquinho?
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Se quiser, escreva em poucas linhas algo que marcou o seu dia até agora. Ninguém aqui vai te julgar."
                  rows={4}
                  className="w-full rounded-2xl border border-[#ffd8e6] px-3 py-2 text-xs md:text-sm text-[#2f3a56] placeholder-[#545454]/40 focus:outline-none focus:ring-1 focus:ring-[#ff005e]"
                />
                <p className="text-[11px] text-[#545454]/80">
                  Esse registro fica guardado com carinho no seu planner, como parte da sua
                  jornada.
                </p>
              </div>

              {/* AÇÕES PRINCIPAIS */}
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
                      Você chegou ao limite de registros por hoje. O que você já fez até aqui já
                      conta muito 💗
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

          {/* BLOCO 2 — EXPLICAÇÃO SUAVE */}
          <SoftCard className="rounded-3xl p-5 md:p-6 bg-white/90 border border-white/70 shadow-[0_6px_18px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide">
                  Por que isso importa
                </p>
                <p className="text-sm text-[#545454] max-w-xl">
                  Cada vez que você registra como está, o Materna360 te ajuda a enxergar padrões:
                  dias mais leves, dias mais pesados, momentos em que você precisa de mais apoio.
                  Isso vira base para o seu planner e para as suas conquistas.
                </p>
              </div>
              <div className="mt-1 flex items-start gap-2 text-xs text-[#545454]/90 max-w-xs">
                <div className="mt-0.5">
                  <AppIcon name="sparkles" className="h-4 w-4 text-[#ff005e]" />
                </div>
                <p>
                  Você não precisa se encaixar em nenhuma versão de mãe perfeita. Aqui, cada
                  registro é um gesto de presença com você mesma.
                </p>
              </div>
            </div>
          </SoftCard>

          <MotivationalFooter routeKey="meu-dia-como-estou-hoje" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
