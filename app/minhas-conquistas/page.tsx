'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'

export default function MinhasConquistasPage() {
  return (
    <PageTemplate
      label="CONQUISTAS"
      title="Minhas Conquistas"
      subtitle="Celebre seu progresso — um passo de cada vez."
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

          {/* BLOCK 1 — Conquista da Semana */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-[#2f3a56] mb-2">
                Conquista da Semana
              </h3>
              <p className="text-sm text-[#545454] mb-4">
                Você manteve 4 dias de humor registrado — isso mostra cuidado real.
              </p>
              <div className="flex justify-end">
                <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                  Ver detalhes → ���
                </span>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 2 — Seu Progresso da Semana */}
          <Reveal delay={80}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-[#2f3a56] mb-4">
                Seu Progresso da Semana
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-primary">5/7</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    Humor registrado
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-primary">8/12</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    Tarefas concluídas
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-primary">3</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    Momentos de conexão
                  </span>
                </div>
              </div>
              {/* Placeholder for premium horizontal bar */}
              <div className="h-3 bg-primary/10 rounded-full mt-6" />
            </SoftCard>
          </Reveal>

          {/* BLOCK 3 — Seus Selos e Medalhas */}
          <Reveal delay={100}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-[#2f3a56] mb-4">
                Selos & Medalhas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {['Primeiro Passo', 'Mãe Presente', 'Criatividade em Ação', 'Semana Leve'].map((badgeTitle) => (
                  <SoftCard
                    key={badgeTitle}
                    className="rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#FFE5EF]/40 to-white border border-primary/10 h-28"
                  >
                    <AppIcon name="star" size={24} className="text-primary mb-2" decorative />
                    <p className="text-xs font-medium text-primary">{badgeTitle}</p>
                  </SoftCard>
                ))}
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 4 — Nível Atual (XP Premium) */}
          <Reveal delay={120}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-[#2f3a56] mb-2">
                Seu Nível
              </h3>
              <p className="text-sm text-[#545454] mb-2">
                Nível 5 — Cuidando de Mim
              </p>
              <p className="text-sm text-[#545454] mb-4">
                450 / 600 XP
              </p>
              {/* Placeholder for premium horizontal bar */}
              <div className="h-3 bg-primary/10 rounded-full mb-3" />
              <p className="text-xs text-neutral-500 font-medium text-center">
                Continue caminhando no seu ritmo.
              </p>
            </SoftCard>
          </Reveal>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
