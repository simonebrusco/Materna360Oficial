'use client'

import React from 'react'

type NavigationHubProps = {
  onCuidarDeMim: () => void
  onCuidarDoFilho: () => void
  onOrganizarRotina: () => void
  onAprenderEBrincar: () => void
  onMinhasConquistas: () => void
  onPlanosPremium: () => void
}

const cardBase =
  'flex flex-col items-start justify-between rounded-2xl bg-white/95 shadow-sm border border-complement px-4 py-4 text-left transition-transform transition-shadow duration-150 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2'

const badgeBase =
  'inline-flex items-center rounded-full bg-complement px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-support-1'

export function NavigationHub({
  onCuidarDeMim,
  onCuidarDoFilho,
  onOrganizarRotina,
  onAprenderEBrincar,
  onMinhasConquistas,
  onPlanosPremium,
}: NavigationHubProps) {
  return (
    <section className="mt-4">
      <div className="mb-4 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Seu ponto de partida
        </p>
        <h2 className="text-sm font-semibold text-support-1">
          Por onde você quer começar hoje?
        </h2>
        <p className="text-xs text-gray-600">
          Escolha um dos caminhos abaixo e o app te leva direto para o que importa agora.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" onClick={onCuidarDeMim} className={cardBase}>
          <span className={badgeBase}>Autocuidado</span>
          <div className="mt-2 space-y-1">
            <p className="text-[14px] font-semibold text-support-1">Cuidar de mim</p>
            <p className="text-[11px] leading-snug text-gray-600">
              Hábitos maternos e pequenos gestos que equilibram seu dia.
            </p>
          </div>
        </button>

        <button type="button" onClick={onCuidarDoFilho} className={cardBase}>
          <span className={badgeBase}>Conexão</span>
          <div className="mt-2 space-y-1">
            <p className="text-[14px] font-semibold text-support-1">Cuidar do meu filho</p>
            <p className="text-[11px] leading-snug text-gray-600">
              Registre momentos especiais e fortaleça a relação no dia a dia.
            </p>
          </div>
        </button>

        <button type="button" onClick={onOrganizarRotina} className={cardBase}>
          <span className={badgeBase}>Rotina</span>
          <div className="mt-2 space-y-1">
            <p className="text-[14px] font-semibold text-support-1">Organizar o dia</p>
            <p className="text-[11px] leading-snug text-gray-600">
              Acesse seu painel do dia para planejar tarefas e compromissos.
            </p>
          </div>
        </button>

        <button type="button" onClick={onAprenderEBrincar} className={cardBase}>
          <span className={badgeBase}>Ideias</span>
          <div className="mt-2 space-y-1">
            <p className="text-[14px] font-semibold text-support-1">Aprender e brincar</p>
            <p className="text-[11px] leading-snug text-gray-600">
              Sugestões de atividades, conteúdos e inspirações para a família.
            </p>
          </div>
        </button>

        <button type="button" onClick={onMinhasConquistas} className={cardBase}>
          <span className={badgeBase}>Progresso</span>
          <div className="mt-2 space-y-1">
            <p className="text-[14px] font-semibold text-support-1">Minhas conquistas</p>
            <p className="text-[11px] leading-snug text-gray-600">
              Veja como sua semana evoluiu em humor, energia e conexão.
            </p>
          </div>
        </button>

        <button type="button" onClick={onPlanosPremium} className={cardBase}>
          <span className={badgeBase}>Premium</span>
          <div className="mt-2 space-y-1">
            <p className="text-[14px] font-semibold text-support-1">Planos e recursos</p>
            <p className="text-[11px] leading-snug text-gray-600">
              Explore conteúdos avançados, benefícios extras e recursos exclusivos.
            </p>
          </div>
        </button>
      </div>
    </section>
  )
}
