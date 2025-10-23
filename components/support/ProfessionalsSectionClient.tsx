'use client'

import React from 'react'
import { useMemo, useState } from 'react'
import Image from 'next/image'

import type { Professional } from '@/app/types/professionals'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

import { ProfessionalModal } from './ProfessionalModal'

type ProfessionalsSectionClientProps = {
  professionals: Professional[]
  initialOpenId?: string
  renderPlainImages?: boolean
}

const PROFESSION_LABEL: Record<Professional['profession'], string> = {
  psicologia: 'Psicologia',
  fonoaudiologia: 'Fonoaudiologia',
  psicopedagogia: 'Psicopedagogia',
  pedagogia_parental: 'Pedagogia Parental',
  consultora_amamentacao: 'Consultora de Amamentação',
  nutricao_materno_infantil: 'Nutrição Materno-Infantil',
  fisio_pelvica: 'Fisioterapia Pélvica',
  doula: 'Doula',
}

const formatBadge = (professional: Professional) => {
  const badges: string[] = []
  if (professional.formats.online) {
    badges.push('Online')
  }
  if (professional.formats.inPerson) {
    badges.push('Presencial')
  }
  return badges.join(' ・ ')
}

export function ProfessionalsSectionClient({ professionals, initialOpenId }: ProfessionalsSectionClientProps) {
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(initialOpenId ?? null)

  const selectedProfessional = useMemo(
    () => professionals.find((item) => item.id === selectedProfessionalId) ?? null,
    [professionals, selectedProfessionalId]
  )

  const handleClose = () => setSelectedProfessionalId(null)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {professionals.map((professional, index) => (
          <Reveal key={professional.id} delay={index * 60}>
            <Card className="relative flex h-full flex-col gap-5 rounded-3xl bg-white/85 p-6">
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-secondary/60 shadow-soft">
                  <Image
                    src={professional.avatarUrl}
                    alt={`Foto de ${professional.name}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold text-support-1">{professional.name}</h3>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
                    {PROFESSION_LABEL[professional.profession]}
                  </p>
                  {professional.council ? (
                    <p className="text-xs text-support-2/80">
                      {professional.council.type} {professional.council.number}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {professional.approvedByMaterna360 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    Aprovado pelo Materna360
                  </span>
                ) : null}
                {professional.firstAssessmentFree ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold text-support-1 shadow-soft">
                    Primeira avaliação gratuita
                  </span>
                ) : null}
              </div>

              <p className="text-sm text-support-2">{professional.bioShort}</p>

              <div className="flex flex-wrap gap-2">
                {professional.specialties.slice(0, 3).map((specialty) => (
                  <span
                    key={`${professional.id}-spec-${specialty}`}
                    className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-support-1 shadow-soft"
                  >
                    #{specialty.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-support-2">
                <span className="rounded-full bg-support-1/10 px-3 py-1 text-support-1">{formatBadge(professional)}</span>
                {professional.formats.regions && professional.formats.regions.length > 0 ? (
                  <span className="rounded-full bg-support-1/5 px-3 py-1">
                    {professional.formats.regions.join(', ')}
                  </span>
                ) : null}
              </div>

              <div className="mt-auto flex flex-wrap gap-3">
                <Button
                  size="sm"
                  onClick={() => setSelectedProfessionalId(professional.id)}
                  aria-label={`Ver perfil de ${professional.name}`}
                >
                  Ver perfil
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled
                  title="Disponível em breve"
                  aria-label={`Vamos conversar com ${professional.name} em breve`}
                >
                  Vamos conversar?
                </Button>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <ProfessionalModal professional={selectedProfessional} open={Boolean(selectedProfessional)} onClose={handleClose} />
    </div>
  )
}
