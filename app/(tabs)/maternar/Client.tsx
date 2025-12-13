'use client'

import * as React from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { Button } from '@/components/ui/Button'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type MiniTileProps = {
  label: string
  href: string
  tag?: string
}

/**
 * Mini tile premium — “chips” dentro da etapa.
 * Mantém os mesmos links/âncoras.
 */
function MiniTile({ label, href, tag }: MiniTileProps) {
  return (
    <Link
      href={href}
      className="
        group block rounded-2xl
        bg-white/90 hover:bg-white
        border border-[#f5d7e5]
        shadow-[0_4px_12px_rgba(184,35,107,0.08)]
        px-3.5 py-3.5
        transition
        hover:-translate-y-0.5
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-[#fd2597]/70
      "
    >
      <div className="flex flex-col gap-1">
        {tag && (
          <span
            className="
              inline-flex w-max items-center
              rounded-full bg-[#ffe1f1]
              px-2 py-0.5
              text-[10px] font-semibold tracking-wide
              text-[#b8236b] uppercase
            "
          >
            {tag}
          </span>
        )}
        <span className="block text-[13px] md:text-[14px] font-medium text-[#2f3a56] leading-snug">
          {label}
        </span>
        <span className="mt-1 h-px w-0 bg-[#fd2597]/30 transition-all duration-300 group-hover:w-10" />
      </div>
    </Link>
  )
}

type TrailStepProps = {
  index: number
  labelPill: string
  title: string
  subtitle: string
  description: string
  icon: React.ComponentProps<typeof AppIcon>['name']
  hrefAll: string
  tiles: Array<{ label: string; href: string; tag?: string }>
  isLast?: boolean
}

/**
 * Etapa de trilha (sem “bloco empilhado”):
 * - rail com número
 * - conector visual vertical
 * - conteúdo encaixado no fluxo
 */
function TrailStep({
  index,
  labelPill,
  title,
  subtitle,
  description,
  icon,
  hrefAll,
  tiles,
  isLast,
}: TrailStepProps) {
  return (
    <div className="relative">
      {/* Conector vertical (continuidade da trilha) */}
      {!isLast && (
        <div
          className="
            absolute left-5 top-10
            h-[calc(100%-16px)]
            w-px
            bg-[linear-gradient(to_bottom,rgba(253,37,151,0.35),rgba(253,37,151,0.08))]
          "
          aria-hidden="true"
        />
      )}

      <div className="flex gap-4 md:gap-5">
        {/* Rail: número + glow */}
        <div className="relative shrink-0">
          <div
            className="
              h-10 w-10 rounded-2xl
              bg-white/85
              border border-white/60
              shadow-[0_10px_24px_rgba(184,35,107,0.18)]
              backdrop-blur
              flex items-center justify-center
            "
          >
            <span className="text-[13px] font-extrabold text-[#b8236b]">
              {index}
            </span>
          </div>

          <div
            className="
              pointer-events-none
              absolute -inset-2
              rounded-[18px]
              bg-[radial-gradient(circle,rgba(253,37,151,0.18),transparent_70%)]
              blur-[2px]
              -z-10
            "
            aria-hidden="true"
          />
        </div>

        {/* Conteúdo da etapa */}
        <div className="flex-1">
          <SoftCard
            className="
              rounded-3xl
              bg-white/92
              border border-[#f5d7e5]
              shadow-[0_14px_36px_rgba(184,35,107,0.10)]
              overflow-hidden
            "
          >
            {/* Header da etapa */}
            <div className="p-5 md:p-6">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                  <AppIcon name={icon} size={22} className="text-[#fd2597]" />
                </div>

                <div className="space-y-1">
                  <span
                    className="
                      inline-flex items-center rounded-full
                      bg-[#ffe1f1]
                      px-3 py-1
                      text-[11px] font-semibold tracking-wide
                      text-[#b8236b]
                    "
                  >
                    {labelPill}
                  </span>

                  <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] leading-tight">
                    {title}
                  </h2>

                  <p className="text-[13px] text-[#6a6a6a]">
                    {subtitle}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[15px] text-[#545454] leading-relaxed">
                {description}
              </p>

              {/* Tiles */}
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                {tiles.map((t) => (
                  <MiniTile key={t.href} label={t.label} href={t.href} tag={t.tag} />
                ))}
              </div>

              {/* CTA */}
              <div className="mt-5">
                <Link href={hrefAll}>
                  <Button className="w-full md:w-auto px-6">
                    Ver tudo de {title}
                  </Button>
                </Link>
              </div>
            </div>

            {/* “Base” sutil para dar sensação de trilha (sem virar outro bloco) */}
            <div
              className="
                h-2
                bg-[linear-gradient(to_right,rgba(253,37,151,0.14),rgba(255,225,241,0.55),transparent)]
              "
              aria-hidden="true"
            />
          </SoftCard>
        </div>
      </div>
    </div>
  )
}

export default function MaternarClient() {
  useEffect(() => {
    try {
      track('nav.click', {
        tab: 'maternar',
        timestamp: new Date().toISOString(),
      })
    } catch {
      // telemetria nunca quebra a página
    }
  }, [])

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-32
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* HERO */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Maternar
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                O seu espaço de acolhimento, leveza e apoio — para cuidar de você, do seu filho e da sua jornada.
              </p>

              <p className="text-sm md:text-[15px] text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)] mt-1">
                Por onde você quer começar hoje?
              </p>
            </div>
          </header>

          <div className="space-y-7 md:space-y-8 pb-10">
            {/* TRILHA PRINCIPAL (um painel, não “blocos empilhados”) */}
            <Reveal>
              <div
                className="
                  rounded-[28px]
                  bg-white/10
                  border border-white/35
                  backdrop-blur-xl
                  shadow-[0_18px_45px_rgba(184,35,107,0.25)]
                  p-4 md:p-6
                "
              >
                {/* Topo da trilha */}
                <div className="mb-5 md:mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/25 px-3 py-1">
                    <span className="text-[11px] font-semibold tracking-wide text-white/95">
                      Trilha do dia
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] md:text-[14px] text-white/90 max-w-2xl">
                    Siga no seu ritmo. Tudo aqui foi pensado para caber no cotidiano, sem cobrança.
                  </p>
                </div>

                {/* Etapas */}
                <div className="space-y-5 md:space-y-6">
                  <TrailStep
                    index={1}
                    labelPill="Para você"
                    title="Cuidar de Mim"
                    subtitle="Leve · 3–5 minutos · foco em você"
                    description="Seu espaço de acolhimento, autocuidado e pausas que cabem no seu dia."
                    icon="heart"
                    hrefAll="/maternar/cuidar-de-mim"
                    tiles={[
                      { label: 'Meu ritmo hoje', href: '/maternar/cuidar-de-mim#ritmo', tag: 'check-in' },
                      { label: 'Pausas rápidas', href: '/maternar/cuidar-de-mim#pausas', tag: 'respirar' },
                    ]}
                  />

                  <TrailStep
                    index={2}
                    labelPill="Para o seu filho"
                    title="Meu Filho"
                    subtitle="Brincadeiras · conexão · desenvolvimento leve"
                    description="Ideias, brincadeiras e apoio leve para o desenvolvimento do seu pequeno."
                    icon="child"
                    hrefAll="/maternar/meu-filho"
                    tiles={[
                      { label: 'Brincadeiras do dia', href: '/maternar/meu-filho#brincadeiras', tag: 'ideias' },
                      { label: 'Gestos de conexão', href: '/maternar/meu-filho#conexao', tag: 'vínculo' },
                    ]}
                  />

                  <TrailStep
                    index={3}
                    labelPill="Para o seu dia"
                    title="Meu Dia Leve"
                    subtitle="Inspirações · ideias rápidas · leveza"
                    description="Frases, ideias rápidas e sugestões para tornar o dia mais leve."
                    icon="sun"
                    hrefAll="/maternar/meu-dia-leve"
                    tiles={[
                      { label: 'Inspiração do dia', href: '/maternar/meu-dia-leve#inspiracao', tag: 'frase' },
                      { label: 'Ideias rápidas', href: '/maternar/meu-dia-leve#ideias', tag: 'rápido' },
                    ]}
                  />

                  <TrailStep
                    index={4}
                    labelPill="Sua caminhada"
                    title="Minha Jornada"
                    subtitle="Conquistas · símbolos · progresso gentil"
                    description="Acompanhe seu progresso com leveza, no seu tempo."
                    icon="star"
                    hrefAll="/maternar/minha-jornada"
                    tiles={[
                      { label: 'Painel da jornada', href: '/maternar/minha-jornada#painel', tag: 'visão geral' },
                      { label: 'Missões do dia', href: '/maternar/minha-jornada#missoes', tag: 'passos' },
                    ]}
                    isLast
                  />
                </div>
              </div>
            </Reveal>

            {/* APOIO: Mais ferramentas (sem competir com a trilha) */}
            <Reveal>
              <SoftCard
                className="
                  p-6 md:p-7 rounded-3xl
                  bg-white/92
                  border border-[#f5d7e5]
                  shadow-[0_10px_26px_rgba(184,35,107,0.10)]
                  space-y-4
                "
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                    <AppIcon name="grid" size={22} className="text-[#fd2597]" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                      Mais ferramentas
                    </span>
                    <h2 className="text-lg font-semibold text-[#2f3a56]">
                      Outros espaços do Maternar
                    </h2>
                    <p className="text-[14px] text-[#545454] leading-relaxed">
                      Acesse quando fizer sentido, sem pesar seu começo do dia.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  <Link href="/maternar/biblioteca-materna">
                    <Button variant="secondary" className="w-full text-[12px] md:text-[13px]">
                      Biblioteca Materna
                    </Button>
                  </Link>

                  <Link href="/maternar/ferramentas/ajuda-e-parcerias">
                    <Button variant="secondary" className="w-full text-[12px] md:text-[13px]">
                      Ajuda & Parcerias
                    </Button>
                  </Link>

                  <Link href="/maternar/minhas-conquistas">
                    <Button variant="secondary" className="w-full text-[12px] md:text-[13px]">
                      Minhas Conquistas
                    </Button>
                  </Link>

                  <Link href="/maternar/materna-plus">
                    <Button className="w-full text-[12px] md:text-[13px]">
                      Materna+
                    </Button>
                  </Link>

                  <Link href="/maternar/materna-plus/maternabox">
                    <Button variant="secondary" className="w-full text-[12px] md:text-[13px]">
                      MaternaBox
                    </Button>
                  </Link>

                  <Link href="/planos">
                    <Button variant="secondary" className="w-full text-[12px] md:text-[13px]">
                      Planos
                    </Button>
                  </Link>
                </div>
              </SoftCard>
            </Reveal>

            <div className="mt-8">
              <LegalFooter />
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
