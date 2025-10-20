'use client'

export const dynamic = 'force-dynamic'

import { useMemo, useState } from 'react'

import { CheckIn } from '@/components/blocks/CheckIn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Reveal } from '@/components/ui/Reveal'

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

export default function Eu360Page() {
  const [gratitude, setGratitude] = useState('')
  const [gratitudes, setGratitudes] = useState<string[]>([
    'Meus filhos saudáveis e felizes',
    'Uma xícara de café tranquilo pela manhã',
    'Apoio da minha família',
  ])

  const handleAddGratitude = () => {
    if (gratitude.trim()) {
      setGratitudes([gratitude, ...gratitudes])
      setGratitude('')
    }
  }

  const moodHistory: MoodHistory[] = useMemo(
    () => daysOfWeek.map((day, idx) => ({ day, emoji: MOODS[(idx + 2) % MOODS.length] })),
    []
  )

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-10 sm:px-6 md:px-8">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-12 top-0 -z-10 h-64 rounded-soft-3xl bg-[radial-gradient(58%_58%_at_50%_0%,rgba(255,216,230,0.5),transparent)]"
      />

      <div className="relative space-y-10">
        <Reveal>
          <Card className="bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] p-8 text-white">
            <div className="text-center">
              <p className="text-4xl">💛</p>
              <h1 className="mt-3 text-2xl font-semibold md:text-3xl">Você é Importante</h1>
              <p className="mt-2 text-sm text-white/90 md:text-base">
                Vá no seu próprio ritmo. Cada passo conta e você está no caminho certo.
              </p>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={80}>
          <Card className="p-7">
            <h2 className="text-lg font-semibold text-support-1 md:text-xl">🎯 Seu Progresso</h2>
            <div className="mt-5 space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-support-1">Nível 5</span>
                  <span className="text-xs font-semibold text-primary">450/500 XP</span>
                </div>
                <Progress value={450} max={500} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/50 bg-white/80 p-4 text-center shadow-soft">
                  <p className="text-2xl">🔥</p>
                  <p className="mt-2 text-xs text-support-2">Sequência</p>
                  <p className="mt-1 text-sm font-semibold text-primary">7 dias</p>
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/80 p-4 text-center shadow-soft">
                  <p className="text-2xl">⭐</p>
                  <p className="mt-2 text-xs text-support-2">Selos</p>
                  <p className="mt-1 text-sm font-semibold text-primary">12 conquistas</p>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={140}>
          <Card className="p-7">
            <h2 className="text-lg font-semibold text-support-1 md:text-xl">📊 Humor da Semana</h2>
            <div className="mt-6 flex justify-between">
              {moodHistory.map(({ day, emoji }) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-soft transition-transform duration-300 hover:-translate-y-1">
                    {emoji}
                  </span>
                  <span className="text-xs text-support-2">{day}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-support-2 text-center">
              Toque em um emoji para registrar como você se sente neste momento.
            </p>
          </Card>
        </Reveal>

        <Reveal delay={180}>
          <CheckIn />
        </Reveal>

        <div className="space-y-5">
          <Reveal>
            <h2 className="text-xl font-semibold text-support-1 md:text-2xl">🏅 Conquistas</h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ACHIEVEMENTS.map((achievement, idx) => (
              <Reveal key={achievement.title} delay={idx * 70}>
                <Card className="h-full p-6 text-center">
                  <p className="text-3xl">{achievement.emoji}</p>
                  <h3 className="mt-3 text-sm font-semibold text-support-1">{achievement.title}</h3>
                  <p className="mt-2 text-xs text-support-2">{achievement.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={220}>
          <Card className="p-7">
            <h2 className="text-lg font-semibold text-support-1 md:text-xl">🙏 Gratidão</h2>
            <p className="mt-2 text-sm text-support-2">
              Registre pequenas alegrias para lembrar-se do quanto você realiza todos os dias.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                placeholder="Pelo que você é grata hoje?"
                className="flex-1 rounded-full border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => e.key === 'Enter' && handleAddGratitude()}
              />
              <Button variant="primary" size="sm" onClick={handleAddGratitude} className="sm:w-auto">
                ＋ Adicionar
              </Button>
            </div>
            {gratitudes.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {gratitudes.map((item, idx) => (
                  <div key={`${item}-${idx}`} className="rounded-2xl bg-secondary/70 p-4 text-sm text-support-1 shadow-soft">
                    “{item}”
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-support-2">Comece a registrar suas gratidões do dia!</p>
            )}
          </Card>
        </Reveal>

        <Reveal delay={260}>
          <Card className="p-7">
            <h2 className="text-lg font-semibold text-support-1 md:text-xl">📈 Resumo da Semana</h2>
            <div className="mt-5 space-y-4">
              {WEEKLY_SUMMARY.map((item, idx) => (
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
              “Você tem feito um ótimo trabalho! Continue focando em pequenos passos consistentes.”
            </div>
          </Card>
        </Reveal>

        <Reveal delay={300}>
          <Card className="bg-gradient-to-br from-primary/12 via-white/90 to-white p-7">
            <h2 className="text-lg font-semibold text-support-1 md:text-xl">☕ Seu Tempo</h2>
            <p className="mt-3 text-sm text-support-2">
              Esta semana você se dedicou a momentos de autocuidado. Continue celebrando as suas conquistas! 💚
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="primary" size="sm">
                Próximas Atividades
              </Button>
              <Button variant="outline" size="sm">
                Ver Histórico
              </Button>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  )
}
