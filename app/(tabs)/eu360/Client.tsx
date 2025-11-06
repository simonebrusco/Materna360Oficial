'use client'

import { useMemo, useState } from 'react'

import GridRhythm from '@/components/common/GridRhythm'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import AppShell from '@/components/common/AppShell'
import { isEnabled } from '@/app/lib/flags'

import { useGamification } from '@/app/lib/useGamification'
import AppIcon from '@/components/ui/AppIcon'
import Emoji from '@/components/ui/Emoji'
import { ProfileForm } from '@/components/blocks/ProfileForm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/Progress'
import { Reveal } from '@/components/ui/Reveal'

import { UpsellSheet } from '@/components/ui/UpsellSheet'


type MoodHistory = {
  day: string
  emoji: string
}

const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
const MOODS = ['😔', '😐', '🙂', '😊', '😄'] as const
const ACHIEVEMENTS = [
  { emoji: '👣', title: 'Primeiro Passo', desc: 'Complete uma atividade' },
  { emoji: '🧘', title: 'Mestre da Meditação', desc: 'Meditou 10x' },
  { emoji: '🏡', title: 'Casa Organizada', desc: '20 tarefas completas' },
  { emoji: '💛', title: 'Mãe Cuidadora', desc: '30 momentos registrados' },
  { emoji: '🎨', title: 'Criatividade em Ação', desc: '10 atividades criadas' },
  { emoji: '📚', title: 'Leitora Dedicada', desc: '5 livros lidos' },
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
    'Uma xícara de caf�� tranquilo pela manhã',
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
    () => daysOfWeek.map((day, index) => ({ day, emoji: MOODS[(index + 2) % MOODS.length] })),
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
        'Relat��rios comparativos com benchmarks',
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

  const content = (
    <main className="PageSafeBottom relative mx-auto max-w-5xl px-4 pt-10 pb-24 sm:px-6 md:px-8">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-12 top-0 -z-10 h-64 rounded-soft-3xl bg-[radial-gradient(58%_58%_at_50%_0%,rgba(255,216,230,0.5),transparent)]"
      />

      <SectionWrapper className="bg-transparent">
        <ProfileForm />
      </SectionWrapper>

      <SectionWrapper>
        <Reveal>
          <Card className="bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] p-8 text-white">
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
          </Card>
        </Reveal>
      </SectionWrapper>

      {isEnabled('FF_LAYOUT_V1') && (
        <SectionWrapper title={<span className="inline-flex items-center gap-2"><AppIcon name="crown" className="text-primary" size={20} /><span>Sua Jornada Gamificada</span></span>}>
          <Reveal delay={80}>
            <Card className="p-7">
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
                    <p className="text-2xl"><Emoji char="🔥" /></p>
                    <p className="mt-2 text-xs text-support-2">Sequência</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{gamification.streak} dias</p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-center shadow-[0_4px_24px_rgba(47,58,86,0.08)]">
                    <p className="text-2xl"><Emoji char="⭐" /></p>
                    <p className="mt-2 text-xs text-support-2">Selos</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{gamification.badges.length} conquistas</p>
                  </div>
                </div>
              </div>
            </Card>
          </Reveal>
        </SectionWrapper>
      )}

      <SectionWrapper title={<span className="inline-flex items-center gap-2">🎯<span>Seu Progresso</span></span>}>
        <Reveal delay={80}>
          <Card className="p-7">
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-support-1">Nível 5</span>
                  <span className="text-xs font-semibold text-primary">450/500 XP</span>
                </div>
                <Progress value={450} max={500} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/50 bg-white/80 p-4 text-center shadow-soft">
                  <p className="text-2xl"><Emoji char="🔥" /></p>
                  <p className="mt-2 text-xs text-support-2">Sequência</p>
                  <p className="mt-1 text-sm font-semibold text-primary">7 dias</p>
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/80 p-4 text-center shadow-soft">
                  <p className="text-2xl"><Emoji char="⭐" /></p>
                  <p className="mt-2 text-xs text-support-2">Selos</p>
                  <p className="mt-1 text-sm font-semibold text-primary">12 conquistas</p>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>
      </SectionWrapper>

      <SectionWrapper title={<span className="inline-flex items-center gap-2">📊<span>Humor da Semana</span></span>}>
        <Reveal delay={140}>
          <Card className="p-7">
            <div className="flex justify-between">
              {moodHistory.map(({ day, emoji }) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-soft transition-transform duration-300 hover:-translate-y-1">
                    {emoji}
                  </span>
                  <span className="text-xs text-support-2">{day}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-support-2">
              Toque em um emoji para registrar como você se sente neste momento.
            </p>
          </Card>
        </Reveal>
      </SectionWrapper>

      {isEnabled('FF_LAYOUT_V1') && (
        <SectionWrapper title={<span className="inline-flex items-center gap-2">⭐<span>Seu Plano</span></span>}>
          <Reveal delay={180}>
            <Card className="p-7 bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-support-2">Plano Atual</p>
                  <p className="mt-2 text-2xl font-bold text-support-1">Free</p>
                  <p className="text-sm text-support-2">Você está no plano básico com acesso completo a recursos essenciais.</p>
                </div>

                <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary">Desfrute de benefícios do Plus:</p>
                  <ul className="space-y-2 text-sm text-support-1">
                    <li className="flex gap-2">
                      <span className="mt-0.5"><Emoji char="✨" size={12} /></span>
                      <span>Análises avançadas sobre o desenvolvimento infantil</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5"><Emoji char="🎯" size={12} /></span>
                      <span>Planos personalizados baseados em IA</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5"><Emoji char="📱" size={12} /></span>
                      <span>Suporte prioritário via chat</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" className="flex-1 sm:flex-none">
                    💳 Gerenciar Plano
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 sm:flex-none"
                    onClick={() => {
                      if (isEnabled('FF_LAYOUT_V1')) {
                        setUpsellSheet({ isOpen: true, type: 'export' })
                      } else {
                        alert('Upgrade para Plus ou Premium para exportar em PDF')
                      }
                    }}
                  >
                    📥 Exportar Semana (PDF)
                  </Button>
                </div>
              </div>
            </Card>
          </Reveal>
        </SectionWrapper>
      )}

      <SectionWrapper title={<span className="inline-flex items-center gap-2">🏅<span>Conquistas</span></span>}>
        <GridRhythm className="grid-cols-2 sm:grid-cols-3">
          {ACHIEVEMENTS.map((achievement, index) => (
            <Reveal key={achievement.title} delay={index * 70} className="h-full">
              <Card className="h-full text-center">
                <p className="text-3xl">{achievement.emoji}</p>
                <h3 className="mt-3 text-sm font-semibold text-support-1">{achievement.title}</h3>
                <p className="mt-2 text-xs text-support-2 GridRhythm-descriptionClamp">{achievement.desc}</p>
              </Card>
            </Reveal>
          ))}
        </GridRhythm>
      </SectionWrapper>

      <SectionWrapper
        title={<span className="inline-flex items-center gap-2">🙏<span>Gratidão</span></span>}
        description="Registre pequenas alegrias para lembrar-se do quanto você realiza todos os dias."
      >
        <Reveal delay={220}>
          <Card className="p-7">
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
          </Card>
        </Reveal>
      </SectionWrapper>

      <SectionWrapper title={<span className="inline-flex items-center gap-2">📈<span>Resumo da Semana</span></span>}>
        <Reveal delay={260}>
          <Card className="p-7">
            <div className="space-y-4">
              {WEEKLY_SUMMARY.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-support-1">{item.label}</span>
                    <span className="text-xs font-semibold text-primary">{item.value}%</span>
                  </div>
                  <Progress value={item.value} max={100} />
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-secondary/60 p-4 text-sm text-support-1/90">
              "Você tem feito um ótimo trabalho! Continue focando em pequenos passos consistentes."
            </div>
          </Card>
        </Reveal>
      </SectionWrapper>
    </main>
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
