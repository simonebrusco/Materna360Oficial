'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'

export default function MinhasConquistasPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Minhas Conquistas"
      subtitle="Celebre seus pequenos progressos todos os dias."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* MOTIVATIONAL LINE */}
          <Reveal delay={0}>
            <div className="text-center">
              <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
                Cada pequeno avanço importa. Você está evoluindo.
              </p>
            </div>
          </Reveal>

          {/* BLOCK 1 — Pontuação Diária e Total */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-[#2f3a56] mb-4">
                Sua Pontuação
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-3 rounded-2xl bg-[#FFE5EF]/40">
                  <span className="text-2xl font-bold text-primary">320</span>
                  <span className="text-xs text-neutral-500 font-medium mt-1">
                    Pontuação Diária
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-[#FFE5EF]/40">
                  <span className="text-2xl font-bold text-primary">4.250</span>
                  <span className="text-xs text-neutral-500 font-medium mt-1">
                    Pontuação Total
                  </span>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 2 — Seu Progresso da Semana */}
          <Reveal delay={80}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-[#2f3a56] mb-4">
                Seu Progresso da Semana
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-primary">5/7</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    Registros
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-primary">8/10</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    Missões
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-primary">3</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    Selos
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-[#545454] font-medium">Barra de Progresso</p>
                <div className="h-3 bg-primary/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/5 bg-primary rounded-full" />
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 3 — Selos Desbloqueáveis e Medalhas */}
          <Reveal delay={100}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-[#2f3a56] mb-4">
                Selos & Medalhas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Primeiro Passo', unlocked: true },
                  { title: 'Mãe Presente', unlocked: true },
                  { title: 'Criatividade em Ação', unlocked: false },
                  { title: 'Semana Leve', unlocked: false },
                ].map((badge) => (
                  <SoftCard
                    key={badge.title}
                    className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center h-28 ${
                      badge.unlocked
                        ? 'bg-gradient-to-br from-[#FFE5EF]/40 to-white border border-primary/10'
                        : 'bg-white/60 border border-white/40'
                    }`}
                  >
                    <AppIcon
                      name={badge.unlocked ? 'star' : 'lock'}
                      size={24}
                      className={badge.unlocked ? 'text-primary' : 'text-neutral-400'}
                      decorative
                    />
                    <p className={`text-xs font-medium mt-2 ${badge.unlocked ? 'text-primary' : 'text-neutral-400'}`}>
                      {badge.title}
                    </p>
                  </SoftCard>
                ))}
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 4 — Missões Diárias e Semanais */}
          <Reveal delay={110}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-[#2f3a56] mb-4">
                Missões
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#2f3a56] mb-2">Diárias</h4>
                  <div className="space-y-2">
                    {[
                      { title: 'Registrar humor', done: true },
                      { title: 'Completar checklist', done: true },
                      { title: 'Anotação rápida', done: false },
                    ].map((mission, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-[#FFE5EF]/40">
                        <input type="checkbox" checked={mission.done} readOnly className="w-4 h-4 rounded" />
                        <span className={`text-sm ${mission.done ? 'line-through text-neutral-400' : 'text-[#545454]'}`}>
                          {mission.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/60">
                  <h4 className="text-sm font-semibold text-[#2f3a56] mb-2">Semanais</h4>
                  <div className="space-y-2">
                    {[
                      { title: 'Completar 5 registros', done: true },
                      { title: 'Desbloquear novo selo', done: false },
                    ].map((mission, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-[#FFE5EF]/40">
                        <input type="checkbox" checked={mission.done} readOnly className="w-4 h-4 rounded" />
                        <span className={`text-sm ${mission.done ? 'line-through text-neutral-400' : 'text-[#545454]'}`}>
                          {mission.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 5 — Nível Atual (XP Premium) */}
          <Reveal delay={120}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-[#2f3a56] mb-2">
                Seu Nível
              </h3>
              <p className="text-sm text-[#545454] mb-1">
                Nível 5 — Cuidando de Mim
              </p>
              <p className="text-sm text-[#545454] mb-4">
                450 / 600 XP
              </p>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-primary/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-primary rounded-full" />
                </div>
                <p className="text-xs text-neutral-500 text-right">75% para o próximo nível</p>
              </div>
              <p className="text-xs text-neutral-500 font-medium text-center">
                Continue caminhando no seu ritmo.
              </p>
            </SoftCard>
          </Reveal>

          {/* BLOCK 6 — Conquistas de Hábitos e Resumo */}
          <Reveal delay={130}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-[#2f3a56] mb-4">
                Resumo de Progresso
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFE5EF]/40">
                  <span className="text-sm text-[#545454]">Dias de sequência</span>
                  <span className="font-bold text-primary">7</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFE5EF]/40">
                  <span className="text-sm text-[#545454]">Hábitos ativos</span>
                  <span className="font-bold text-primary">4</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFE5EF]/40">
                  <span className="text-sm text-[#545454]">Conquistas desbloqueadas</span>
                  <span className="font-bold text-primary">12</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFE5EF]/40">
                  <span className="text-sm text-[#545454]">XP acumulado</span>
                  <span className="font-bold text-primary">4.250</span>
                </div>
              </div>
            </SoftCard>
          </Reveal>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
