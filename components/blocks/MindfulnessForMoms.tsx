'use client'

const COLLECTIONS = [
  {
    id: 'reconectar',
    icon: '🪷',
    titulo: 'Reconectar com você',
    descricao: 'Práticas curtas para acalmar a mente, sentir o corpo e acolher o momento presente.',
    duracao: '5-8 min',
  },
  {
    id: 'energia',
    icon: '☀️',
    titulo: 'Renovar energias',
    descricao: 'Respirações guiadas e visualizações que despertam leveza para seguir o dia com disposição.',
    duracao: '6-10 min',
  },
  {
    id: 'descanso',
    icon: '🌙',
    titulo: 'Desacelerar à noite',
    descricao: 'Momentos suaves para preparar o corpo e a mente para um sono mais tranquilo.',
    duracao: '7-9 min',
  },
  {
    id: 'acolhimento',
    icon: '🤍',
    titulo: 'Acolher emoções',
    descricao: 'Meditações guiadas para reconhecer sentimentos e transformá-los em cuidado consigo mesma.',
    duracao: '5-7 min',
  },
  {
    id: 'clareza',
    icon: '✨',
    titulo: 'Clareza e foco',
    descricao: 'Respirações focadas que ajudam a organizar pensamentos e priorizar com leveza.',
    duracao: '4-6 min',
  },
]

export default function MindfulnessForMoms() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="section-title flex items-center gap-2">
          <span aria-hidden="true">🎧</span>
          <span>Mindfulness para Mães</span>
        </h2>
        <p className="section-subtitle max-w-2xl text-support-2">
          Pausas guiadas, curtas e acolhedoras, para respirar com intenção e cuidar do coração enquanto a rotina acontece.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {COLLECTIONS.map((collection) => (
          <article
            key={collection.id}
            className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
          >
            <div className="space-y-3">
              <span className="text-3xl" aria-hidden="true">
                {collection.icon}
              </span>
              <h3 className="text-lg font-semibold text-support-1 md:text-xl">{collection.titulo}</h3>
              <p className="text-sm leading-relaxed text-support-2">{collection.descricao}</p>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                {collection.duracao}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#mindfulness"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
              >
                Praticar agora
              </a>
              <a
                href="#mindfulness"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/70 bg-white px-4 py-2 text-sm font-semibold text-support-1 transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              >
                Salvar para depois
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
