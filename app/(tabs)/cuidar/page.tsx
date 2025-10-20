'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BreathTimer } from '@/components/blocks/BreathTimer'
import { AudioCard } from '@/components/blocks/AudioCard'

export default function CuidarPage() {
  const meditations = [
    {
      title: 'Meditação para Dormir',
      duration: '10 min',
      instructor: 'Instrutora Ana',
      image: '🧘',
      description: 'Relaxe antes de dormir com esta meditação guiada',
    },
    {
      title: 'Meditação da Manhã',
      duration: '5 min',
      instructor: 'Instrutora Marina',
      image: '🌅',
      description: 'Comece o dia com energia e positividade',
    },
    {
      title: 'Mindfulness no Caos',
      duration: '8 min',
      instructor: 'Instrutora Sofia',
      image: '🧠',
      description: 'Encontre paz mesmo em dias agitados',
    },
  ]

  const recipes = [
    { emoji: '🥗', title: 'Salada Detox', prep: '10 min' },
    { emoji: '🥤', title: 'Suco Verde Energético', prep: '5 min' },
    { emoji: '🍵', title: 'Chá de Camomila', prep: '3 min' },
    { emoji: '🥑', title: 'Toast de Abacate', prep: '8 min' },
  ]

  const professionals = [
    {
      name: 'Dra. Carolina',
      role: 'Psicóloga',
      emoji: '👩‍⚕️',
      bio: 'Especializada em bem-estar materno',
    },
    {
      name: 'Nutricionista Ana',
      role: 'Nutricionista',
      emoji: '🥗',
      bio: 'Nutrição para mães ocupadas',
    },
    {
      name: 'Terapeuta Marina',
      role: 'Terapeuta Holística',
      emoji: '🧘',
      bio: 'Práticas complementares de saúde',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
          🌿 Cuidar de Si Mesma
        </h1>
        <p className="text-support-2">
          Seu bem-estar é prioridade
        </p>
      </div>

      {/* Breath Timer */}
      <BreathTimer />

      {/* Meditations */}
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-support-1 mb-4">🎧 Meditações</h2>
        <div className="space-y-4">
          {meditations.map((med, idx) => (
            <AudioCard key={idx} {...med} />
          ))}
        </div>
      </div>

      {/* Positive Pills */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary">
        <h2 className="text-xl md:text-2xl font-semibold text-support-1 mb-4">💊 Pílulas Positivas</h2>
        <div className="space-y-3">
          {[
            'Você merece descanso tanto quanto seus filhos.',
            'Sua paciência é um superpoder.',
            'Pequenos momentos de alegria contam muito.',
            'Você está fazendo um ótimo trabalho.',
            'Cuidar de você não é egoísmo.',
          ].map((pill, idx) => (
            <div key={idx} className="p-3 bg-white rounded-lg border-l-4 border-primary">
              <p className="text-sm text-support-1 italic">{pill}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Recipes */}
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-support-1 mb-4">🥗 Receitas da Semana</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recipes.map((recipe, idx) => (
            <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="text-3xl mb-2">{recipe.emoji}</div>
              <h3 className="font-semibold text-support-1 mb-1">{recipe.title}</h3>
              <p className="text-xs text-support-2 mb-3">⏱️ {recipe.prep}</p>
              <Button variant="secondary" size="sm" className="w-full">
                Ver Receita
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Organization Tips */}
      <Card>
        <h2 className="text-xl md:text-2xl font-semibold text-support-1 mb-4">💡 Dicas de Organização</h2>
        <div className="space-y-3">
          {[
            { title: 'Organize a Noite Anterior', desc: 'Prepare roupas e mochilas antes de dormir' },
            { title: 'Use Listas de Verificação', desc: 'Simplifique tarefas recorrentes' },
            { title: '15 Minutos de Limpeza', desc: 'Mantenha espaços organizados com pequenas sessões' },
          ].map((tip, idx) => (
            <div key={idx} className="p-3 bg-secondary rounded-lg">
              <h4 className="font-semibold text-support-1 text-sm mb-1">{tip.title}</h4>
              <p className="text-xs text-support-2">{tip.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Mentorship Section */}
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-support-1 mb-4">👥 Profissionais de Apoio</h2>
        <div className="space-y-4">
          {professionals.map((prof, idx) => (
            <Card key={idx} className="flex flex-col md:flex-row gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-secondary rounded-lg flex items-center justify-center text-3xl">
                {prof.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-support-1">{prof.name}</h3>
                <p className="text-xs text-primary font-semibold mb-1">{prof.role}</p>
                <p className="text-xs text-support-2 mb-3">{prof.bio}</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.open('https://wa.me', '_blank')}
                  className="w-full md:w-auto"
                >
                  💬 Conversar no WhatsApp
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
