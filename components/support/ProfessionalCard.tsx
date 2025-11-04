'use client'

import React from 'react'
import Image from 'next/image'
import { isEnabled } from '@/app/lib/flags'

export type ProfessionalCardData = {
  id: string
  nome: string
  especialidade: string
  bioCurta: string
  avatarUrl?: string
  cidade?: string
  whatsUrl?: string
  calendlyUrl?: string
  verificado?: boolean
  primeiraAvaliacaoGratuita?: boolean
  temas?: string[]
  precoHint?: string
}

type ProfessionalCardProps = {
  pro: ProfessionalCardData
  onProfileOpen?: (pro: ProfessionalCardData) => void
}

const MAX_CHIPS = 4
const FALLBACK_AVATAR = '/stickers/default.svg'

export default function ProfessionalCard({ pro, onProfileOpen }: ProfessionalCardProps) {
  const chips = (pro.temas ?? []).slice(0, MAX_CHIPS)
  const avatarSrc = pro.avatarUrl || FALLBACK_AVATAR

  return (
    <article className="CardElevate flex h-full flex-col gap-4 rounded-2xl border border-white/60 bg-white/85 p-4 md:p-5">
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/80 bg-white">
          <Image
            src={avatarSrc}
            alt={`Foto de ${pro.nome}`}
            fill
            sizes="56px"
            className="object-cover"
            priority={false}
          />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-support-1 md:text-lg">{pro.nome}</h3>
            {pro.verificado ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                Verificado Materna360
              </span>
            ) : null}
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
              Online
            </span>
            {pro.primeiraAvaliacaoGratuita ? (
              <span className="rounded-full border border-pink-200 bg-pink-50 px-2 py-1 text-xs font-medium text-pink-700">
                Primeira avaliação gratuita
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-primary/80">{pro.especialidade}</p>
          <p className="mt-2 text-sm leading-relaxed text-support-2 line-clamp-2">{pro.bioCurta}</p>
          {pro.cidade ? <p className="mt-1 text-xs text-support-2/80">Atendimento a partir de {pro.cidade}</p> : null}
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-xs text-support-2">
              #{chip}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <a
          href={`/profissionais/${pro.id}`}
          className="rounded-xl border border-white/70 bg-white px-4 py-2 text-sm font-semibold text-support-1 transition hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Ver perfil
        </a>
        {pro.whatsUrl ? (
          <a
            href={pro.whatsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir conversa no WhatsApp com ${pro.nome}`}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Vamos conversar?
          </a>
        ) : (
          <span className="text-xs text-support-2/70">Agenda por mensagem</span>
        )}
      </div>
    </article>
  )
}
