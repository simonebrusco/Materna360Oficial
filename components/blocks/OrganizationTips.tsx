'use client'

const TIPS = [
  {
    id: 'rotina-manha',
    emoji: '🌅',
    titulo: 'Ritual de manhã leve',
    descricao: 'Prepare a roupa das crianças na noite anterior e separe dois minutos para respirar antes de acordá-las.',
  },
  {
    id: 'tempo-familia',
    emoji: '👨9Family',
    titulo: 'Mini reunião afetiva',
    descricao: 'Reserve 5 minutos depois do jantar para cada pessoa compartilhar um destaque e um desafio do dia.',
  },
  {
    id: 'cantinho-pausa',
    emoji: '🪑',
    titulo: 'Cantinho da pausa',
    descricao: 'Monte um espaço simples com almofada, água e aroma suave para pausar quando o ritmo acelerar demais.',
  },
  {
    id: 'dia-das-tarefas',
    emoji: '📝',
    titulo: 'Dia das micro-tarefas',
    descricao: 'Escolha até três pendências rápidas e conclua com foco. Celebre cada check com um sorriso consciente.',
  },
  {
    id: 'rede-apoio',
    emoji: '🤝',
    titulo: 'Rede de apoio ativa',
    descricao: 'Envie uma mensagem pedindo ajuda específica para alguém querido e aceite dividir responsabilidades.',
  },
  {
    id: 'noite-serena',
    emoji: '🌙',
    titulo: 'Noite serena',
    descricao: 'Defina um alarme gentil 30 minutos antes de dormir para desacelerar, hidratar-se e alongar o corpo.',
  },
]

export default function OrganizationTips() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="section-title flex items-center gap-2">
          <span aria-hidden="true">💡</span>
          <span>Dicas de Organização</span>
        </h2>
        <p className="section-subtitle max-w-2xl text-support-2">
          Sugestões rápidas para organizar a rotina com gentileza e criar espaços de respiro no dia a dia.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {TIPS.map((tip) => (
          <article
            key={tip.id}
            className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
          >
            <div className="space-y-3">
              <span className="text-3xl" aria-hidden="true">
                {tip.emoji}
              </span>
              <h3 className="text-lg font-semibold text-support-1 md:text-xl">{tip.titulo}</h3>
              <p className="text-sm leading-relaxed text-support-2">{tip.descricao}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#organizacao"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
              >
                Ver mais
              </a>
              <a
                href="#organizacao"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/70 bg-white px-4 py-2 text-sm font-semibold text-support-1 transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              >
                Adicionar ao planner
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
