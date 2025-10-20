'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { CheckIn } from '@/components/blocks/CheckIn'

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

  const moods = ['😔', '😐', '🙂', '😊', '😄']
  const achievements = [
    { emoji: '👣', title: 'Primeiro Passo', desc: 'Complete uma atividade' },
    { emoji: '🧘', title: 'Mestre da Meditação', desc: 'Meditou 10x' },
    { emoji: '🏡', title: 'Casa Organizada', desc: '20 tarefas completas' },
    { emoji: '💛', title: 'Mãe Cuidadora', desc: '30 momentos registrados' },
    { emoji: '🎨', title: 'Criatividade em Ação', desc: '10 atividades criadas' },
    { emoji: '📚', title: 'Leitora Dedicada', desc: '5 livros lidos' },
  ]

  const weeklySummary = [
    { label: 'Autocuidado', value: 75 },
    { label: 'Atividades Filhos', value: 60 },
    { label: 'Rotina Casa', value: 85 },
    { label: 'Conexão Familiar', value: 70 },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Banner */}
      <Card className="bg-gradient-to-r from-primary to-pink-400 text-white">
        <div className="text-center">
          <p className="text-3xl mb-2">💛</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Você é Importante</h1>
          <p className="text-sm md:text-base opacity-90">Vá no seu próprio ritmo. Você está no caminho certo.</p>
        </div>
      </Card>

      {/* Progress Overview */}
      <Card>
        <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-4">🎯 Seu Progresso</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-support-1">Nível 5</span>
              <span className="text-xs text-primary font-semibold">450/500 XP</span>
            </div>
            <Progress value={450} max={500} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-secondary rounded-lg text-center">
              <p className="text-2xl mb-1">🔥</p>
              <p className="text-xs text-support-2 mb-1">Sequência</p>
              <p className="font-bold text-primary">7 dias</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg text-center">
              <p className="text-2xl mb-1">⭐</p>
              <p className="text-xs text-support-2 mb-1">Selos</p>
              <p className="font-bold text-primary">12</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Mood Tracker */}
      <Card>
        <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-4">📊 Humor da Semana</h2>
        <div className="flex justify-between mb-4">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((day, idx) => (
            <div key={day} className="flex flex-col items-center">
              <div className="text-xl mb-2 cursor-pointer hover:scale-125 transition-transform">
                {moods[Math.floor(Math.random() * moods.length)]}
              </div>
              <span className="text-xs text-support-2">{day}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-support-2 text-center">Clique no emoji para registrar seu humor do dia</p>
      </Card>

      {/* Check In */}
      <CheckIn />

      {/* Achievements */}
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-support-1 mb-4">🏅 Conquistas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {achievements.map((achievement, idx) => (
            <Card key={idx} className="text-center p-4">
              <p className="text-3xl mb-2">{achievement.emoji}</p>
              <h3 className="font-semibold text-support-1 text-sm mb-1">{achievement.title}</h3>
              <p className="text-xs text-support-2">{achievement.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Gratitude Section */}
      <Card>
        <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-4">🙏 Gratidão</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            placeholder="Pelo que você é grata hoje?"
            className="flex-1 px-3 py-2 border border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyPress={(e) => e.key === 'Enter' && handleAddGratitude()}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddGratitude}
          >
            ＋
          </Button>
        </div>

        {gratitudes.length > 0 ? (
          <div className="space-y-2">
            {gratitudes.map((item, idx) => (
              <div key={idx} className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-support-1">"{item}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-support-2">Comece a registrar suas gratidões do dia!</p>
        )}
      </Card>

      {/* Weekly Summary */}
      <Card>
        <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-6">📈 Resumo da Semana</h2>

        <div className="space-y-4">
          {weeklySummary.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-support-1">{item.label}</span>
                <span className="text-xs font-bold text-primary">{item.value}%</span>
              </div>
              <Progress value={item.value} max={100} />
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
          <p className="text-xs text-support-1 italic">
            "Você tem feito um ótimo trabalho! Continue focando em pequenos passos consistentes."
          </p>
        </div>
      </Card>

      {/* Time for Me */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary">
        <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-4">☕ Seu Tempo</h2>
        <p className="text-sm text-support-2 mb-4">
          Esta semana você se dedicou a atividades de autocuidado. Muito bem! 💚
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button variant="primary" size="sm">
            Próximas Atividades
          </Button>
          <Button variant="outline" size="sm">
            Ver Histórico
          </Button>
        </div>
      </Card>
    </div>
  )
}
