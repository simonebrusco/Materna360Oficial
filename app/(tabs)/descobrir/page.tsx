'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function DescobrirPage() {
  const [ageFilter, setAgeFilter] = useState<string | null>(null)
  const [placeFilter, setPlaceFilter] = useState<string | null>(null)
  const [showActivities, setShowActivities] = useState(false)

  const activities = [
    { id: 1, emoji: '🎨', title: 'Pintura com Dedos', age: '1-3', place: 'Casa' },
    { id: 2, emoji: '🌳', title: 'Caça ao Tesouro no Parque', age: '4+', place: 'Parque' },
    { id: 3, emoji: '📚', title: 'Leitura em Ciranda', age: '0-7', place: 'Casa' },
    { id: 4, emoji: '⚽', title: 'Jogos no Parquinho', age: '3-7', place: 'Parque' },
    { id: 5, emoji: '��', title: 'Experiências Científicas', age: '5+', place: 'Casa' },
    { id: 6, emoji: '🎭', title: 'Coreografia em Família', age: '2-6', place: 'Casa' },
    { id: 7, emoji: '🍕', title: 'Aula de Culinária', age: '4+', place: 'Escola' },
    { id: 8, emoji: '🏗️', title: 'Construção com Blocos', age: '2-4', place: 'Casa' },
  ]

  const filteredActivities = activities.filter((a) => {
    if (ageFilter && !a.age.includes(ageFilter.split('-')[0])) return false
    if (placeFilter && a.place !== placeFilter) return false
    return true
  })

  const books = [
    { emoji: '📖', title: 'O Menino do Pijama Listrado', author: 'John Boyne' },
    { emoji: '📖', title: 'Charlotte\'s Web', author: 'E.B. White' },
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
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
          🎨 Descobrir
        </h1>
        <p className="text-support-2">
          Ideias de atividades e brincadeiras para seus filhos
        </p>
      </div>

      {/* Filters */}
      <Card>
        <h2 className="font-semibold text-support-1 mb-4">🔍 Filtros</h2>

        {/* Age Filter */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-support-1 mb-2">Idade</label>
          <div className="flex flex-wrap gap-2">
            {['0-1', '2-3', '4-5', '6-7', '8+'].map((age) => (
              <button
                key={age}
                onClick={() => setAgeFilter(ageFilter === age ? null : age)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  ageFilter === age
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-support-1 hover:bg-pink-200'
                }`}
              >
                {age} anos
              </button>
            ))}
          </div>
        </div>

        {/* Place Filter */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-support-1 mb-2">Local</label>
          <div className="flex flex-wrap gap-2">
            {['Casa', 'Parque', 'Escola', 'Área Externa'].map((place) => (
              <button
                key={place}
                onClick={() => setPlaceFilter(placeFilter === place ? null : place)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  placeFilter === place
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-support-1 hover:bg-pink-200'
                }`}
              >
                {place}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowActivities(true)}
          className="w-full"
        >
          ✨ Gerar Ideias
        </Button>
      </Card>

      {/* Activities Grid */}
      {showActivities && (
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-support-1 mb-4">
            Atividades {filteredActivities.length > 0 ? `(${filteredActivities.length})` : ''}
          </h2>
          {filteredActivities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredActivities.map((activity) => (
                <Card
                  key={activity.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-2">{activity.emoji}</div>
                  <h3 className="font-semibold text-support-1 mb-1">{activity.title}</h3>
                  <div className="flex gap-3 text-xs text-support-2 mb-4">
                    <span>👧 {activity.age} anos</span>
                    <span>📍 {activity.place}</span>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full">
                    Salvar no Planejador
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8">
              <p className="text-support-2">Nenhuma atividade encontrada com esses filtros.</p>
            </Card>
          )}
        </div>
      )}

      {/* Suggestion of the Day */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary">
        <div className="flex gap-4">
          <div className="text-5xl">🌟</div>
          <div className="flex-1">
            <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-1">Sugestão do Dia</h2>
            <p className="text-sm text-support-1 mb-3">
              Construir uma cabana com lençóis e almofadas é ótimo para criar um espaço seguro e imaginativo para as crianças.
            </p>
            <Button variant="primary" size="sm">
              Experimentar
            </Button>
          </div>
        </div>
      </Card>

      {/* Books */}
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-support-1 mb-4">📚 Livros Recomendados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {books.map((book, idx) => (
            <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="text-3xl mb-2">{book.emoji}</div>
              <h3 className="font-semibold text-support-1 text-sm mb-1">{book.title}</h3>
              <p className="text-xs text-support-2 mb-3">Por {book.author}</p>
              <Button variant="secondary" size="sm" className="w-full">
                Ver Detalhes
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Toys */}
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-support-1 mb-4">🧸 Brinquedos Sugeridos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {toys.map((toy, idx) => (
            <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="text-3xl mb-2">{toy.emoji}</div>
              <h3 className="font-semibold text-support-1 text-sm mb-1">{toy.title}</h3>
              <p className="text-xs text-support-2 mb-3">A partir de {toy.age}</p>
              <Button variant="secondary" size="sm" className="w-full">
                Ver Mais
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* For You Section */}
      <Card className="bg-secondary/30">
        <h2 className="text-xl md:text-2xl font-semibold text-support-1 mb-4">💚 Para Você</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            'Autocuidado para Mães',
            'Mindfulness Infantil',
            'Receitas Saudáveis',
            'Dicas de Sono',
          ].map((item, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {item}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
