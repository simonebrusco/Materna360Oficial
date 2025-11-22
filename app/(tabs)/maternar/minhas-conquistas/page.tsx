'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import AppIcon from '@/components/ui/AppIcon';
import { SoftCard } from '@/components/ui/card';
import { Reveal } from '@/components/ui/Reveal';
import { ClientOnly } from '@/components/common/ClientOnly';
import type { AppIconName } from '@/components/ui/AppIcon';

// ===== CONSTANTS =====
const INITIAL_MISSIONS = [
  { id: 'humor', label: 'Registrar como estou hoje', xp: 10 },
  { id: 'planner', label: 'Preencher meu planner', xp: 20 },
  { id: 'pausa', label: 'Fazer uma pausa de 5 minutos sem culpa', xp: 15 },
  { id: 'conquista', label: 'Registrar uma conquista', xp: 25 },
];

const SEALS = [
  { id: 'primeiro-passo', label: 'Primeiro passo', icon: 'sparkles' as AppIconName },
  { id: 'semana-leve', label: 'Semana leve', icon: 'sun' as AppIconName },
  { id: 'cuidar-de-mim', label: 'Cuidando de mim', icon: 'heart' as AppIconName },
  { id: 'conexao', label: 'Conectando com meu filho', icon: 'smile' as AppIconName },
  { id: 'rotina', label: 'Rotina em dia', icon: 'calendar' as AppIconName },
  { id: 'presenca', label: 'Presença real', icon: 'star' as AppIconName },
];

// ===== MAIN PAGE =====
export default function MinhasConquistasPage() {
  const [missions, setMissions] = useState(
    INITIAL_MISSIONS.map(m => ({ ...m, done: false }))
  );

  const handleMissionToggle = (id: string) => {
    setMissions(prev =>
      prev.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  return (
    <ClientOnly>
      <main data-layout="page-template-v1" className="bg-white min-h-[100dvh] pb-24">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* Page Header */}
          <Reveal delay={0}>
            <header className="pt-6 md:pt-8 mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-[#3A3A3A] mb-2">
                Minhas Conquistas
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Versão gamificada v0.1 – teste de layout
              </p>
              <p className="text-base md:text-lg text-[#6A6A6A]">
                Você está evoluindo. Pequenos passos levam longe.
              </p>
            </header>
          </Reveal>

          {/* Main Content Blocks */}
          <div className="space-y-8 md:space-y-10">
            {/* SECTION 1 – Seu painel de progresso */}
            <Reveal delay={50}>
              <SoftCard className="w-full rounded-3xl border border-pink-100 shadow-sm p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-gray-900">
                    Seu painel de progresso
                  </h2>
                  <p className="text-sm text-gray-600">
                    Cada pequeno avanço importa.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Pontuação de hoje</p>
                    <p className="text-2xl font-semibold text-gray-900">320</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Pontuação total</p>
                    <p className="text-2xl font-semibold text-gray-900">4.250</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Dias de sequência</p>
                    <p className="text-2xl font-semibold text-gray-900">3</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-pink-50 overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
                  </div>
                  <p className="text-xs text-gray-500">
                    Faltam 80 XP para o próximo nível.
                  </p>
                </div>
              </SoftCard>
            </Reveal>

            {/* SECTION 2 – Missões de hoje */}
            <Reveal delay={100}>
              <SoftCard className="w-full rounded-3xl border border-pink-100 shadow-sm p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-gray-900">Missões de hoje</h2>
                  <p className="text-sm text-gray-600">
                    Pequenas ações que valem pontos.
                  </p>
                </div>

                <div className="space-y-2">
                  {missions.map(mission => {
                    const isDone = mission.done;
                    return (
                      <button
                        key={mission.id}
                        type="button"
                        onClick={() => handleMissionToggle(mission.id)}
                        className={clsx(
                          "w-full flex items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition",
                          isDone
                            ? "border-pink-200 bg-pink-50"
                            : "border-pink-100 bg-white hover:bg-pink-50/60"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={clsx(
                              "h-5 w-5 rounded-full border flex items-center justify-center",
                              isDone ? "border-pink-500 bg-pink-500" : "border-pink-300 bg-white"
                            )}
                          >
                            {isDone && (
                              <AppIcon name="check" className="h-3 w-3 text-white" decorative />
                            )}
                          </div>
                          <span
                            className={clsx(
                              "text-sm",
                              isDone ? "text-gray-700 line-through" : "text-gray-800"
                            )}
                          >
                            {mission.label}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-pink-600">
                          +{mission.xp} XP
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-gray-500">
                  {missions.filter(m => m.done).length} de {missions.length} missões concluídas hoje.
                </p>
              </SoftCard>
            </Reveal>

            {/* SECTION 3 – Selos desbloqueados */}
            <Reveal delay={150}>
              <SoftCard className="w-full rounded-3xl border border-pink-100 shadow-sm p-6 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-gray-900">Selos desbloqueados</h2>
                  <p className="text-sm text-gray-600">
                    Uma coleção das suas pequenas grandes vitórias.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SEALS.map(seal => (
                    <div
                      key={seal.id}
                      className="flex flex-col items-center justify-center rounded-2xl border border-pink-100 bg-white px-3 py-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50">
                        <AppIcon name={seal.icon} className="h-5 w-5 text-pink-500" decorative />
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
            </Reveal>

            {/* Closing Message */}
            <Reveal delay={200}>
              <div className="text-center py-12">
                <p className="text-xs md:text-sm text-[#6A6A6A]/75 leading-relaxed max-w-lg mx-auto">
                  Você não precisa abraçar tudo de uma vez. Escolha só um passo para hoje — o
                  Materna360 caminha com você.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </main>
    </ClientOnly>
  );
}
