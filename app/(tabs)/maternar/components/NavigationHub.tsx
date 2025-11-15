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
      <div className="mb-3 flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-support-1">
          Por onde você quer começar hoje?
        </h2>
        <p className="text-xs text-gray-600">
          Escolha um caminho e o app te leva direto para o que importa agora.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <button
          type="button"
          onClick={onCuidarDeMim}
          className="flex flex-col items-start justify-between rounded-2xl border border-gray-100 bg-white px-3 py-3 text-left shadow-sm transition-all hover:shadow-md active:scale-95"
        >
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Autocuidado
          </span>
          <span className="mt-1 text-[13px] font-semibold text-support-1">
            Cuidar de mim
          </span>
          <span className="mt-2 text-[11px] text-gray-500">
            Hábitos maternos e equilíbrio emocional.
          </span>
        </button>

        <button
          type="button"
          onClick={onCuidarDoFilho}
          className="flex flex-col items-start justify-between rounded-2xl border border-gray-100 bg-white px-3 py-3 text-left shadow-sm transition-all hover:shadow-md active:scale-95"
        >
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Conexão
          </span>
          <span className="mt-1 text-[13px] font-semibold text-support-1">
            Cuidar do meu filho
          </span>
          <span className="mt-2 text-[11px] text-gray-500">
            Momentos especiais e memórias afetivas.
          </span>
        </button>

        <button
          type="button"
          onClick={onOrganizarRotina}
          className="flex flex-col items-start justify-between rounded-2xl border border-gray-100 bg-white px-3 py-3 text-left shadow-sm transition-all hover:shadow-md active:scale-95"
        >
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Rotina
          </span>
          <span className="mt-1 text-[13px] font-semibold text-support-1">
            Organizar o dia
          </span>
          <span className="mt-2 text-[11px] text-gray-500">
            Acesso rápido ao seu painel do dia.
          </span>
        </button>

        <button
          type="button"
          onClick={onAprenderEBrincar}
          className="flex flex-col items-start justify-between rounded-2xl border border-gray-100 bg-white px-3 py-3 text-left shadow-sm transition-all hover:shadow-md active:scale-95"
        >
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Ideias
          </span>
          <span className="mt-1 text-[13px] font-semibold text-support-1">
            Aprender e brincar
          </span>
          <span className="mt-2 text-[11px] text-gray-500">
            Sugestões de atividades e conteúdos.
          </span>
        </button>

        <button
          type="button"
          onClick={onMinhasConquistas}
          className="flex flex-col items-start justify-between rounded-2xl border border-gray-100 bg-white px-3 py-3 text-left shadow-sm transition-all hover:shadow-md active:scale-95"
        >
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Progresso
          </span>
          <span className="mt-1 text-[13px] font-semibold text-support-1">
            Minhas conquistas
          </span>
          <span className="mt-2 text-[11px] text-gray-500">
            Veja sua evolução ao longo da semana.
          </span>
        </button>

        <button
          type="button"
          onClick={onPlanosPremium}
          className="flex flex-col items-start justify-between rounded-2xl border border-gray-100 bg-white px-3 py-3 text-left shadow-sm transition-all hover:shadow-md active:scale-95"
        >
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Premium
          </span>
          <span className="mt-1 text-[13px] font-semibold text-support-1">
            Planos e recursos
          </span>
          <span className="mt-2 text-[11px] text-gray-500">
            Acesse conteúdos avançados e benef��cios.
          </span>
        </button>
      </div>
    </section>
  )
}
