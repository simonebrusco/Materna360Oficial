'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

// ===== CONSTANTS =====
const INITIAL_MISSIONS = [
  { id: 'humor', label: 'Registrar como estou hoje', xp: 10 },
  { id: 'planner', label: 'Preencher meu planner', xp: 20 },
  { id: 'pausa', label: 'Fazer uma pausa de 5 minutos sem culpa', xp: 15 },
  { id: 'conquista', label: 'Registrar uma conquista', xp: 25 },
]

const SEALS: { id: string; label: string; icon: KnownIconName }[] = [
  { id: 'primeiro-passo', label: 'Primeiro passo', icon: 'sparkles' },
  { id: 'semana-leve', label: 'Semana leve', icon: 'sun' },
  { id: 'cuidar-de-mim', label: 'Cuidando de mim', icon: 'heart' },
  { id: 'conexao', label: 'Conectando com meu filho', icon: 'smile' },
  { id: 'rotina', label: 'Rotina em dia', icon: 'calendar' },
  { id: 'presenca', label: 'Presença real', icon: 'star' },
]

// ===== MISSIONS CARD COMPONENT =====
function MissionsCard() {
  const [missions, setMissions] = useState(
    INITIAL_MISSIONS.map((m) => ({ ...m, done: false }))
  )

  const completedCount = missions.filter((m) => m.done).length

  return (
    <SoftCard className="w-full rounded-3xl border border-pink-100 shadow-sm p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-gray-900">Missões de hoje</h2>
        <p className="text-sm text-gray-600">
          Pequenas ações que valem pontos.
        </p>
      </div>

      <div className="space-y-2">
        {missions.map((mission) => {
          const isDone = mission.done
          return (
            <button
              key={mission.id}
              type="button"
              onClick={() => {
                setMissions((prev) =>
                  prev.map((item) =>
                    item.id === mission.id
                      ? { ...item, done: !item.done }
                      : item
                  )
                )
              }}
              className={clsx(
                'flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition',
                isDone
                  ? 'border-pink-200 bg-pink-50'
                  : 'border-pink-100 bg-white hover:bg-pink-50/60'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'flex h-5 w-5 items-center justify-center rounded-full border',
                    isDone
                      ? 'border-pink-500 bg-pink-500'
                      : 'border-pink-300 bg-white'
                  )}
                >
                  {isDone && (
                    <AppIcon name="check" className="h-3 w-3 text-white" decorative />
                  )}
                </div>
                <span
                  className={clsx(
                    'text-sm',
                    isDone ? 'text-gray-700 line-through' : 'text-gray-800'
                  )}
                >
                  {mission.label}
                </span>
              </div>

              <span className="text-xs font-medium text-pink-600">
                +{mission.xp} XP
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-500">
        {completedCount} de {missions.length} missões concluídas hoje.
      </p>
    </SoftCard>
  )
}

// ===== MAIN PAGE =====
export default function MinhasConquistasPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Minhas Conquistas"
      subtitle="Celebre seus pequenos progressos todos os dias."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          <p className="mt-1 text-sm text-gray-500">
            Versão gamificada v0.1 ��� teste de layout (/meu-dia)
          </p>

          {/* GAMIFIED LAYOUT START */}
          <div className="mt-4 space-y-6">
            {/* SECTION 1 – Seu painel de progresso */}
            <SoftCard className="w-full rounded-3xl border border-pink-100 shadow-sm p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-gray-900">
                  Seu painel de progresso
                </h2>
                <p className="text-sm text-gray-600">
                  Cada pequeno avanço importa.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Pontuação de hoje
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">320</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Pontuação total
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">4.250</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Dias de sequência
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">3</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-pink-50">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                </div>
                <p className="text-xs text-gray-500">
                  Faltam 80 XP para o próximo nível.
                </p>
              </div>
            </SoftCard>

            {/* SECTION 2 – Missões de hoje */}
            <MissionsCard />

            {/* SECTION 3 – Selos desbloqueados */}
            <SoftCard className="w-full rounded-3xl border border-pink-100 shadow-sm p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-gray-900">
                  Selos desbloqueados
                </h2>
                <p className="text-sm text-gray-600">
                  Uma coleção das suas pequenas grandes vitórias.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {SEALS.map((seal) => (
                  <div
                    key={seal.id}
                    className="flex flex-col items-center justify-center rounded-2xl border border-pink-100 bg-white px-3 py-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50">
                      <AppIcon
                        name={seal.icon}
                        className="h-5 w-5 text-pink-500"
                        decorative
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-800 text-center">
                      {seal.label}
                    </p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-medium text-pink-600">
                      Conquistado
                    </span>
                  </div>
                ))}
              </div>
            </SoftCard>
          </div>
          {/* GAMIFIED LAYOUT END */}

          <MotivationalFooter routeKey="meu-dia-minhas-conquistas" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
