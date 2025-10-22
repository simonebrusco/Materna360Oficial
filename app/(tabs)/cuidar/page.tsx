'use client'

export const dynamic = 'force-dynamic'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { BreathTimer } from '@/components/blocks/BreathTimer'
import { Mindfulness } from '@/components/blocks/Mindfulness'

export default function CuidarPage() {
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
    <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-10 sm:px-6 md:px-8">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 -z-10 h-64 rounded-soft-3xl bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,216,230,0.45),transparent)]"
      />

      <div className="relative flex flex-col">
        <Reveal>
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Autocuidado</span>
            <h1 className="text-3xl font-semibold text-support-1 md:text-4xl">🌿 Cuidar de Si Mesma</h1>
            <p className="max-w-2xl text-sm text-support-2 md:text-base">
              Seu bem-estar é prioridade: reserve momentos de pausa, respire com consciência e nutra o corpo com carinho.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80} className="mt-3 sm:mt-4">
          <BreathTimer />
        </Reveal>

        <Reveal delay={120} className="mt-8 sm:mt-10">
          <Mindfulness />
        </Reveal>

        <Reveal delay={140} className="mt-8 sm:mt-10">
          <Card className="bg-gradient-to-br from-primary/12 via-white/90 to-white p-7">
            <h2 className="text-xl font-semibold text-support-1 md:text-2xl">💊 Pílulas Positivas</h2>
            <div className="mt-4 space-y-3">
              {[
                'Você merece descanso tanto quanto seus filhos.',
                'Sua paciência é um superpoder.',
                'Pequenos momentos de alegria contam muito.',
                'Você está fazendo um ótimo trabalho.',
                'Cuidar de você não é egoísmo.',
              ].map((pill, idx) => (
                <div
                  key={pill}
                  className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-soft transition-all duration-300 hover:shadow-elevated"
                >
                  <p className="text-sm italic text-support-1">{pill}</p>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <div className="space-y-5">
          <Reveal>
            <h2 className="text-xl font-semibold text-support-1 md:text-2xl">🥗 Receitas da Semana</h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recipes.map((recipe, idx) => (
              <Reveal key={recipe.title} delay={idx * 70}>
                <Card className="h-full p-6">
                  <div className="text-3xl">{recipe.emoji}</div>
                  <h3 className="mt-3 text-lg font-semibold text-support-1">{recipe.title}</h3>
                  <p className="mt-2 text-xs text-support-2">⏱️ {recipe.prep}</p>
                  <Button variant="secondary" size="sm" className="mt-6 w-full">
                    Ver Receita
                  </Button>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={200}>
          <Card className="p-7">
            <h2 className="text-xl font-semibold text-support-1 md:text-2xl">💡 Dicas de Organização</h2>
            <div className="mt-4 space-y-3">
              {[
                { title: 'Organize a Noite Anterior', desc: 'Prepare roupas e mochilas antes de dormir.' },
                { title: 'Use Listas de Verificação', desc: 'Simplifique tarefas recorrentes.' },
                { title: '15 Minutos de Cuidado', desc: 'Mantenha espaços organizados com pequenas sessões.' },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-soft transition-all duration-300 hover:shadow-elevated"
                >
                  <h4 className="text-sm font-semibold text-support-1">{tip.title}</h4>
                  <p className="mt-1 text-xs text-support-2">{tip.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <div className="space-y-5">
          <Reveal>
            <h2 className="text-xl font-semibold text-support-1 md:text-2xl">👥 Profissionais de Apoio</h2>
          </Reveal>
          <div className="space-y-4">
            {professionals.map((prof, idx) => (
              <Reveal key={prof.name} delay={idx * 80}>
                <Card className="flex flex-col items-start gap-5 p-6 md:flex-row md:items-center">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl bg-secondary/80 text-3xl shadow-soft">
                    {prof.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-support-1 md:text-lg">{prof.name}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">{prof.role}</p>
                    <p className="mt-3 text-sm text-support-2">{prof.bio}</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.open('https://wa.me', '_blank')}
                      className="mt-4 w-full md:w-auto"
                    >
                      💬 Conversar no WhatsApp
                    </Button>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
