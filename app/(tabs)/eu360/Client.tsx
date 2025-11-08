'use client'

import { useMemo, useState } from 'react'

import GridRhythm from '@/components/common/GridRhythm'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import AppShell from '@/components/common/AppShell'
import { PageGrid } from '@/components/common/PageGrid'
import { isEnabled } from '@/app/lib/flags'

import { useGamification } from '@/app/lib/useGamification'
import AppIcon from '@/components/ui/AppIcon'
import { ProfileForm } from '@/components/blocks/ProfileForm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/Progress'
import { Reveal } from '@/components/ui/Reveal'
import { PlanCard } from '@/components/ui/PlanCard'
import { FeatureGate } from '@/components/ui/FeatureGate'
import { WeeklySummary } from '@/components/ui/WeeklySummary'

import { UpsellSheet } from '@/components/ui/UpsellSheet'
import { PageTemplate } from '@/components/common/PageTemplate'
import { StatTile } from '@/components/ui/StatTile'
import { EmotionalDiary } from '@/components/blocks/EmotionalDiary'


type MoodHistory = {
  day: string
  icon: string
}

const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
const MOODS = ['frown', 'meh', 'smile', 'smile-plus', 'sparkles'] as const
const ACHIEVEMENTS = [
  { icon: 'footprints', title: 'Primeiro Passo', desc: 'Complete uma atividade' },
  { icon: 'sparkles', title: 'Mestre da Meditação', desc: 'Meditou 10x' },
  { icon: 'home', title: 'Casa Organizada', desc: '20 tarefas completas' },
  { icon: 'hand-heart', title: 'Mãe Cuidadora', desc: '30 momentos registrados' },
  { icon: 'palette', title: 'Criatividade em Ação', desc: '10 atividades criadas' },
  { icon: 'book-open', title: 'Leitora Dedicada', desc: '5 livros lidos' },
] as const
const WEEKLY_SUMMARY = [
  { label: 'Autocuidado', value: 75 },
  { label: 'Atividades Filhos', value: 60 },
  { label: 'Rotina Casa', value: 85 },
  { label: 'Conexão Familiar', value: 70 },
] as const

export default function Eu360Client() {
  const [gratitude, setGratitude] = useState('')
  const [gratitudes, setGratitudes] = useState<string[]>([
    'Meus filhos saudáveis e felizes',
    'Uma xícara de café tranquilo pela manhã',
    'Apoio da minha família',
  ])
  const [upsellSheet, setUpsellSheet] = useState<{
    isOpen: boolean
    type?: 'export' | 'advanced' | 'mentorship'
  }>({ isOpen: false })

  const gamification = useGamification()

  const handleAddGratitude = () => {
    if (gratitude.trim()) {
      setGratitudes([gratitude, ...gratitudes])
      setGratitude('')
    }
  }

  const moodHistory: MoodHistory[] = useMemo(
    () => daysOfWeek.map((day, index) => ({ day, icon: MOODS[(index + 2) % MOODS.length] })),
    []
  )

  const upsellSheetConfig = {
    export: {
      title: 'Exportar Semana em PDF',
      description: 'Gere relatórios em PDF do seu progresso semanal para compartilhar com profissionais de saúde.',
      planName: 'Plus ou Premium',
      features: [
        'Relatórios formatados em PDF',
        'Gráficos de progresso e humor',
        'Resumo de atividades realizadas',
        'Histórico de notas e reflexões',
      ],
    },
    advanced: {
      title: 'Análises Avançadas',
      description: 'Desbloqueie insights profundos sobre o desenvolvimento infantil e bem-estar familiar.',
      planName: 'Plus ou Premium',
      features: [
        'Análises detalhadas de desenvolvimento',
        'Previsões baseadas em IA',
        'Relatórios comparativos com benchmarks',
        'Consultoria personalizada mensal',
      ],
    },
    mentorship: {
      title: 'Mentorias com Profissionais',
      description: 'Acesse sessões de mentoria com pediatras, psicólogos e especialistas em desenvolvimento infantil.',
      planName: 'Premium',
      features: [
        '1 mentoria mensal com especialista',
        'Consultoria familiar personalizada',
        'Acesso a biblioteca de recursos exclusivos',
        'Suporte prioritário 24/7',
      ],
    },
  }

  const currentUpsellConfig = upsellSheet.type ? upsellSheetConfig[upsellSheet.type] : null
  const currentPlan: 'Free' | 'Plus' | 'Premium' = 'Free'

  const content = (
    <PageTemplate
      title="Eu360"
      subtitle="Autocuidado, propósito e rede de apoio"
    >
      <Card>
        <ProfileForm />
      </Card>

      <Card>
        <Reveal>
          <div className="bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] p-8 text-white rounded-xl">
            <div className="text-center">
              {isEnabled('FF_LAYOUT_V1') ? (
                <AppIcon name="care" size={48} className="text-primary mx-auto mb-2" />
              ) : (
                <p className="text-4xl"><Emoji char="💛" /></p>
              )}
              <h1 className="mt-3 text-2xl font-semibold md:text-3xl">Você é Importante</h1>
              <p className="mt-2 text-sm text-white/90 md:text-base">
                Vá no seu próprio ritmo. Cada passo conta e você está no caminho certo.
              </p>
            </div>
          </div>
        </Reveal>
      </Card>

      {isEnabled('FF_LAYOUT_V1') && (
        <Card>
          <Reveal delay={80}>
            <div>
              <h3 className="text-lg font-semibold text-support-1 mb-4 inline-flex items-center gap-2"><AppIcon name="crown" className="text-primary" size={20} /><span>Sua Jornada Gamificada</span></h3>
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-support-1">Nível {gamification.level}</span>
                    <span className="text-xs font-semibold text-primary">{gamification.xp}/{gamification.xpToNextLevel} XP</span>
                  </div>
                  <Progress value={gamification.xp} max={gamification.xpToNextLevel} />
                  <p className="mt-2 text-xs text-support-2">Total de pontos: {gamification.totalPoints} <Emoji char="🎯" size={12} /></p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-center shadow-[0_4px_24px_rgba(47,58,86,0.08)]">
                    <div className="text-2xl text-primary"><AppIcon name="sparkles" size={28} decorative /></div>
                    <p className="mt-2 text-xs text-support-2">Sequência</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{gamification.streak} dias</p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-center shadow-[0_4px_24px_rgba(47,58,86,0.08)]">
                    <div className="text-2xl text-primary"><AppIcon name="star" size={28} decorative /></div>
                    <p className="mt-2 text-xs text-support-2">Selos</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{gamification.badges.length} conquistas</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </Card>
      )}

      {/* Plan Card Section - P2 */}
      {isEnabled('FF_LAYOUT_V1') && (
        <Card>
          <Reveal delay={120}>
            <div>
              <h3 className="text-lg font-semibold text-support-1 mb-4 inline-flex items-center gap-2"><AppIcon name="crown" className="text-primary" size={20} /><span>Seu Plano</span></h3>
            <PlanCard
              currentPlan={currentPlan}
              onManagePlan={() => {
                window.location.href = '/planos'
              }}
              onExplorePlans={() => {
                window.location.href = '/planos'
              }}
            />
            </div>
          </Reveal>
        </Card>
      )}

      <Card>
        <Reveal delay={140}>
          <div>
            <h3 className="text-lg font-semibold text-support-1 mb-4 inline-flex items-center gap-2"><AppIcon name="smile" size={20} decorative /><span>Humor da Semana</span></h3>
            <div className="flex justify-between">
              {moodHistory.map(({ day, icon }) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-primary shadow-soft transition-transform duration-300 hover:-translate-y-1">
                    <AppIcon name={icon} size={20} decorative />
                  </span>
                  <span className="text-xs text-support-2">{day}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-support-2">
              Registre como você se sente para acompanhar seu bem-estar.
            </p>
          </div>
        </Reveal>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-support-1 mb-4 inline-flex items-center gap-2"><AppIcon name="star" size={20} className="text-primary" decorative /><span>Conquistas</span></h3>
        <PageGrid cols={3}>
          {ACHIEVEMENTS.map((achievement, index) => (
            <Reveal key={achievement.title} delay={index * 70} className="h-full">
              <Card className="h-full text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/30">
                  <AppIcon name={achievement.icon as any} size={24} className="text-primary" decorative />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-support-1">{achievement.title}</h3>
                <p className="mt-2 text-xs text-support-2 GridRhythm-descriptionClamp">{achievement.desc}</p>
              </Card>
            </Reveal>
          ))}
        </PageGrid>
      </Card>

      <Card>
        <Reveal delay={240}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-support-1 inline-flex items-center gap-2"><AppIcon name="bookmark" size={20} className="text-primary" decorative /><span>Diário Emocional</span></h3>
            <p className="text-sm text-support-2 mt-1">Um espaço só seu para expressar e refletir sobre seus sentimentos.</p>
          </div>
          <EmotionalDiary />
        </Reveal>
      </Card>

      <Card>
        <Reveal delay={280}>
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-support-1 inline-flex items-center gap-2"><AppIcon name="heart" size={20} className="text-primary" decorative /><span>Gratidão</span></h3>
              <p className="text-sm text-support-2 mt-1">Registre pequenas alegrias para lembrar-se do quanto você realiza todos os dias.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={gratitude}
                onChange={(event) => setGratitude(event.target.value)}
                placeholder="Pelo que você é grata hoje?"
                className="flex-1 rounded-full border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(event) => event.key === 'Enter' && handleAddGratitude()}
              />
              <Button variant="primary" size="sm" onClick={handleAddGratitude} className="sm:w-auto">
                ＋ Adicionar
              </Button>
            </div>
            {gratitudes.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {gratitudes.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl bg-secondary/70 p-4 text-sm text-support-1 shadow-soft">
                    "{item}"
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-support-2">Comece a registrar suas gratidões do dia!</p>
            )}
          </div>
        </Reveal>
      </Card>

      {/* Weekly Summary Section - P2 */}
      {isEnabled('FF_LAYOUT_V1') && (
        <Card>
          <Reveal delay={320}>
            <div>
              <h3 className="text-lg font-semibold text-support-1 mb-4 inline-flex items-center gap-2"><AppIcon name="heart" size={20} className="text-primary" /><span>Resumo da Semana</span></h3>
            <FeatureGate
              featureKey="weekly.summary"
              currentPlan={currentPlan}
              onUpgradeClick={() => {
                window.location.href = '/planos'
              }}
            >
              <WeeklySummary
                data={{
                  humor: {
                    daysLogged: 5,
                    totalDays: 7,
                    data: [40, 60, 50, 70, 80, 65, 75],
                  },
                  checklist: {
                    completed: 18,
                    total: 24,
                    data: [2, 3, 2, 4, 3, 2, 2],
                  },
                  planner: {
                    completed: 6,
                    total: 7,
                    data: [1, 1, 1, 1, 1, 1, 0],
                  },
                  achievements: {
                    unlocked: 3,
                    total: 12,
                    data: [0, 1, 0, 0, 1, 0, 1],
                  },
                }}
                onViewDetails={() => console.log('View details')}
              />
            </FeatureGate>
            </div>
          </Reveal>
        </Card>
      )}

      {/* PDF Export - P2 with FeatureGate */}
      {isEnabled('FF_LAYOUT_V1') && (
        <Card>
          <Reveal delay={360}>
            <div>
              <h3 className="text-lg font-semibold text-support-1 mb-4 inline-flex items-center gap-2"><AppIcon name="download" size={20} className="text-primary" /><span>Exportar Relatório</span></h3>
            <FeatureGate
              featureKey="weekly.pdf"
              currentPlan={currentPlan}
              onUpgradeClick={() => {
                setUpsellSheet({ isOpen: true, type: 'export' })
              }}
            >
              <div className="p-7">
                <div className="text-center">
                  <p className="text-sm text-support-2 mb-4">
                    Gere um relatório em PDF da sua semana com gráficos e resumos para compartilhar com profissionais de saúde.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setUpsellSheet({ isOpen: true, type: 'export' })
                    }}
                  >
                    <AppIcon name="download" size={16} />
                    Exportar PDF desta semana
                  </Button>
                </div>
              </div>
            </FeatureGate>
            </div>
          </Reveal>
        </Card>
      )}
    </PageTemplate>
  )

  return (
    <>
      {isEnabled('FF_LAYOUT_V1') ? <AppShell>{content}</AppShell> : content}
      {upsellSheet.isOpen && currentUpsellConfig && (
        <UpsellSheet
          {...currentUpsellConfig}
          onClose={() => setUpsellSheet({ isOpen: false })}
          onUpgrade={() => {
            window.location.href = '/planos'
          }}
        />
      )}
    </>
  )
}
