'use client'

import { useState } from 'react'

import GridRhythm from '@/components/common/GridRhythm'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

export const dynamic = 'force-dynamic'

export default function DescobrirPage() {
  const [ageFilter, setAgeFilter] = useState<string | null>(null)
  const [placeFilter, setPlaceFilter] = useState<string | null>(null)
  const [showActivities, setShowActivities] = useState(false)

  const activities = [
    { id: 1, emoji: '🎨', title: 'Pintura com Dedos', age: '1-3', place: 'Casa' },
    { id: 2, emoji: '🌳', title: 'Caça ao Tesouro no Parque', age: '4+', place: 'Parque' },
    { id: 3, emoji: '📚', title: 'Leitura em Ciranda', age: '0-7', place: 'Casa' },
    { id: 4, emoji: '⚽', title: 'Jogos no Parquinho', age: '3-7', place: 'Parque' },
    { id: 5, emoji: '🧬', title: 'Experiências Científicas', age: '5+', place: 'Casa' },
    { id: 6, emoji: '🎭', title: 'Coreografia em Família', age: '2-6', place: 'Casa' },
    { id: 7, emoji: '🍕', title: 'Aula de Culinária', age: '4+', place: 'Escola' },
    { id: 8, emoji: '🏗️', title: 'Construção com Blocos', age: '2-4', place: 'Casa' },
  ]

  const filteredActivities = activities.filter((activity) => {
    const matchesAge = !ageFilter || activity.age.includes(ageFilter.replace('+', ''))
    const matchesPlace = !placeFilter || activity.place === placeFilter
    return matchesAge && matchesPlace
  })

  const books = [
    { emoji: '📖', title: 'O Menino do Pijama Listrado', author: 'John Boyne' },
    { emoji: '📖', title: "Charlotte's Web", author: 'E.B. White' },
    { emoji: '📖', title: 'As Aventuras de Pinóquio', author: 'Carlo Collodi' },
    { emoji: '📖', title: 'O Pequeno Príncipe', author: 'Antoine de Saint-Exupéry' },
  ]

  const toys = [
    { emoji: '🧩', title: 'Quebra-Cabeças', age: '2+' },
    { emoji: '🪀', title: 'Brinquedos de Corda', age: '3+' },
    { emoji: '🧸', title: 'Pelúcias Educativas', age: '0+' },
    { emoji: '🚂', title: 'Trem de Brinquedo', age: '2+' },
  ]

  return (
    <main className="PageSafeBottom relative mx-auto max-w-5xl px-4 pt-10 sm:px-6 md:px-8">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-12 top-0 -z-10 h-64 rounded-soft-3xl bg-[radial-gradient(62%_62%_at_50%_0%,rgba(255,216,230,0.5),transparent)]"
      />

      <Reveal>
        <SectionWrapper
          className="relative"
          header={
            <header className="SectionWrapper-header">
              <span className="SectionWrapper-eyebrow">Inspirações</span>
              <h1 className="SectionWrapper-title inline-flex items-center gap-2">
                <span aria-hidden>🎨</span>
                <span>Descobrir</span>
              </h1>
              <p className="SectionWrapper-description max-w-2xl">
                Ideias de atividades, brincadeiras e descobertas para nutrir a curiosidade de cada fase da infância.
              </p>
            </header>
          }
        >
          {null}
        </SectionWrapper>
      </Reveal>

      <Reveal delay={80}>
        <SectionWrapper
          title={<span className="inline-flex items-center gap-2">🔍<span>Filtros Inteligentes</span></span>}
          description="Combine idade e local para criar experiências personalizadas em segundos."
        >
          <Card className="p-7">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">Idade</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['0-1', '2-3', '4-5', '6-7', '8+'].map((age) => {
                    const isActive = ageFilter === age
                    return (
                      <button
                        key={age}
                        onClick={() => setAgeFilter(isActive ? null : age)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-gentle ${
                          isActive
                            ? 'bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] text-white shadow-glow'
                            : 'bg-white/80 text-support-1 shadow-soft hover:shadow-elevated'
                        }`}
                      >
                        {age} anos
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">Local</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Casa', 'Parque', 'Escola', 'Área Externa'].map((place) => {
                    const isActive = placeFilter === place
                    return (
                      <button
                        key={place}
                        onClick={() => setPlaceFilter(isActive ? null : place)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-gentle ${
                          isActive
                            ? 'bg-gradient-to-r from-primary via-[#ff2f78] to-[#ff6b9c] text-white shadow-glow'
                            : 'bg-white/80 text-support-1 shadow-soft hover:shadow-elevated'
                        }`}
                      >
                        {place}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="primary" onClick={() => setShowActivities(true)} className="flex-1 sm:flex-none">
                ✨ Gerar Ideias
              </Button>
              {(ageFilter || placeFilter || showActivities) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setAgeFilter(null)
                    setPlaceFilter(null)
                    setShowActivities(false)
                  }}
                  className="sm:w-auto"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </Card>
        </SectionWrapper>
      </Reveal>

      {showActivities && (
        <Reveal delay={140}>
          <SectionWrapper
            title={`Atividades ${filteredActivities.length > 0 ? `(${filteredActivities.length})` : ''}`}
          >
            {filteredActivities.length > 0 ? (
              <GridRhythm className="grid-cols-1 sm:grid-cols-2">
                {filteredActivities.map((activity, idx) => (
                  <Reveal key={activity.id} delay={idx * 70} className="h-full">
                    <Card className="h-full">
                      <div className="text-4xl">{activity.emoji}</div>
                      <h3 className="mt-3 text-lg font-semibold text-support-1">{activity.title}</h3>
                      <div className="mt-3 flex gap-3 text-xs text-support-2">
                        <span>👧 {activity.age} anos</span>
                        <span>📍 {activity.place}</span>
                      </div>
                      <Button variant="primary" size="sm" className="mt-6 w-full">
                        Salvar no Planejador
                      </Button>
                    </Card>
                  </Reveal>
                ))}
              </GridRhythm>
            ) : (
              <Card className="py-12 text-center">
                <p className="text-sm text-support-2">
                  Nenhuma atividade encontrada com esses filtros. Experimente ajustar as combinações.
                </p>
              </Card>
            )}
          </SectionWrapper>
        </Reveal>
      )}

      <Reveal delay={200}>
        <SectionWrapper
          title={<span className="inline-flex items-center gap-2">🌟<span>Sugestão do Dia</span></span>}
          description="Construir uma cabana com lençóis e almofadas cria um refúgio aconchegante para contar histórias e estimular a imaginação."
        >
          <Card className="flex flex-col gap-4 bg-gradient-to-br from-primary/12 via-white/90 to-white p-7 md:flex-row">
            <div className="text-5xl">🌟</div>
            <div className="flex-1">
              <Button variant="primary" size="sm" className="mt-2 w-full sm:w-auto">
                Experimentar
              </Button>
            </div>
          </Card>
        </SectionWrapper>
      </Reveal>

      <SectionWrapper
        title={<span className="inline-flex items-center gap-2">📚<span>Livros Recomendados</span></span>}
      >
        <GridRhythm className="grid-cols-1 sm:grid-cols-2">
          {books.map((book, idx) => (
            <Reveal key={book.title} delay={idx * 70} className="h-full">
              <Card className="h-full">
                <div className="text-3xl">{book.emoji}</div>
                <h3 className="mt-3 text-base font-semibold text-support-1">{book.title}</h3>
                <p className="mt-2 text-xs text-support-2 GridRhythm-descriptionClamp">por {book.author}</p>
                <Button variant="primary" size="sm" className="mt-6 w-full">
                  Ver Detalhes
                </Button>
              </Card>
            </Reveal>
          ))}
        </GridRhythm>
      </SectionWrapper>

      <SectionWrapper
        title={<span className="inline-flex items-center gap-2">🧸<span>Brinquedos Sugeridos</span></span>}
      >
        <GridRhythm className="grid-cols-1 sm:grid-cols-2">
          {toys.map((toy, idx) => (
            <Reveal key={toy.title} delay={idx * 70} className="h-full">
              <Card className="h-full">
                <div className="text-3xl">{toy.emoji}</div>
                <h3 className="mt-3 text-base font-semibold text-support-1">{toy.title}</h3>
                <p className="mt-2 text-xs text-support-2">A partir de {toy.age}</p>
                <Button variant="primary" size="sm" className="mt-6 w-full">
                  Ver Mais
                </Button>
              </Card>
            </Reveal>
          ))}
        </GridRhythm>
      </SectionWrapper>

      <Reveal delay={260}>
        <SectionWrapper title={<span className="inline-flex items-center gap-2">💚<span>Para Você</span></span>}>
          <Card className="p-7">
            <GridRhythm className="grid-cols-1 sm:grid-cols-2">
              {['Autocuidado para Mães', 'Mindfulness Infantil', 'Receitas Saudáveis', 'Dicas de Sono'].map((item) => (
                <div key={item}>
                  <Button variant="outline" size="sm" className="w-full">
                    {item}
                  </Button>
                </div>
              ))}
            </GridRhythm>
          </Card>
        </SectionWrapper>
      </Reveal>
    </main>
  )
}
