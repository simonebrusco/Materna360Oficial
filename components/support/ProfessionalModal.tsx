'use client'

'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'

import type { Professional } from '@/app/types/professionals'
import { Button } from '@/components/ui/button'

type ProfessionalModalProps = {
  professional: Professional | null
  open: boolean
  onClose: () => void
  onContact?: (professional: Professional) => void
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

const LANGUAGE_LABEL: Record<string, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'Inglês',
  es: 'Espanhol',
}

const AGE_BAND_LABEL: Record<Professional['ageBands'][number], string> = {
  gestante: 'Gestante',
  '0-6m': '0 a 6 meses',
  '7-12m': '7 a 12 meses',
  '1-3a': '1 a 3 anos',
  '4-6a': '4 a 6 anos',
}

export function ProfessionalModal({ professional, open, onClose, onContact, renderPlainImages = false }: ProfessionalModalProps) {
  useEffect(() => {
    if (!open) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open || !professional) {
    return null
  }

  const handleContact = () => {
    console.log('open-whatsapp', professional.id)
    onContact?.(professional)
  }

  const professionLabel = PROFESSION_LABEL[professional.profession]
  const councilLabel = professional.council
    ? `${professional.council.type} ${professional.council.number}`
    : undefined
  const formats = professional.formats ?? { online: false, inPerson: false, regions: [] as string[] }
  const formatRegions = Array.isArray(formats.regions) ? formats.regions : []
  const languages = Array.isArray(professional.languages) ? professional.languages : []
  const howHelps = Array.isArray(professional.howHelps) ? professional.howHelps : []
  const approaches = Array.isArray(professional.approaches) ? professional.approaches : []
  const ageBands = Array.isArray(professional.ageBands) ? professional.ageBands : []

  return (
    <>
      <div className="modal-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="modal-container items-center justify-center px-4 py-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`professional-modal-${professional.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="section-card relative mx-auto flex w-full max-w-2xl flex-col gap-6 bg-white/95 p-6 md:p-8 shadow-elevated">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar perfil profissional"
            className="absolute right-6 top-6 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            Fechar
          </button>

          <div className="grid gap-6 md:grid-cols-[200px,1fr] md:gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-40 w-40 overflow-hidden rounded-full border border-white/70 bg-secondary/50 shadow-soft">
                {renderPlainImages ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={professional.avatarUrl} alt={`Foto de ${professional.name}`} className="h-full w-full object-cover" />
                ) : (
                  <Image
                    src={professional.avatarUrl}
                    alt={`Foto de ${professional.name}`}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                )}
              </div>
              {professional.firstAssessmentFree ? (
                <span className="inline-flex items-center rounded-full bg-secondary/70 px-3 py-0.5 text-xs font-semibold text-support-1 shadow-soft">
                  Primeira avaliação gratuita
                </span>
              ) : null}
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <h3 id={`professional-modal-${professional.id}`} className="text-2xl font-semibold text-support-1">
                  {professional.name}
                </h3>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/80">
                  {professionLabel}
                  {councilLabel ? ` ・ ${councilLabel}` : ''}
                </p>
                {professional.yearsExperience ? (
                  <p className="text-sm text-support-2">
                    {professional.yearsExperience} anos de experiência cuidando de famílias.
                  </p>
                ) : null}
                <p className="text-sm text-support-2">{professional.bioShort}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/80">Como pode ajudar</h4>
                <ul className="list-disc space-y-2 pl-5 text-sm text-support-2">
                  {howHelps.length > 0 ? (
                    howHelps.map((item, index) => <li key={`${professional.id}-help-${index}`}>{item}</li>)
                  ) : (
                    <li>Nossos especialistas estão prontos para orientar você.</li>
                  )}
                </ul>
              </div>

              {approaches.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/80">Abordagens</h4>
                  <div className="flex flex-wrap gap-2">
                    {approaches.map((approach) => (
                      <span
                        key={`${professional.id}-approach-${approach}`}
                        className="rounded-full bg-secondary/60 px-3 py-0.5 text-xs font-semibold text-support-1"
                      >
                        {approach}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/80">Formatos</h4>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-support-2">
                    {formats.online ? (
                      <span className="rounded-full bg-support-1/10 px-3 py-0.5 text-support-1">Online</span>
                    ) : null}
                    {formats.inPerson ? (
                      <span className="rounded-full bg-support-1/10 px-3 py-0.5 text-support-1">Presencial</span>
                    ) : null}
                    {formatRegions.length > 0 ? (
                      <span className="rounded-full bg-support-1/10 px-3 py-0.5 text-support-1">
                        Atende em: {formatRegions.join(', ')}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/80">Idiomas</h4>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-support-2">
                    {languages.length > 0 ? (
                      languages.map((language) => (
                        <span
                          key={`${professional.id}-language-${language}`}
                          className="rounded-full bg-primary/10 px-3 py-0.5 text-primary"
                        >
                          {LANGUAGE_LABEL[language] ?? language}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-support-1/10 px-3 py-0.5 text-support-1">Português (Brasil)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/80">Faixas de cuidado</h4>
                <div className="flex flex-wrap gap-2">
                  {ageBands.length > 0 ? (
                    ageBands.map((band) => (
                      <span
                        key={`${professional.id}-age-${band}`}
                        className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary"
                      >
                        {AGE_BAND_LABEL[band]}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                      Todas as fases
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <Button size="sm" variant="primary" onClick={handleContact} disabled>
                  Vamos conversar?
                </Button>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Fechar
                </Button>
                <span className="text-xs font-medium text-support-2">Função disponível em breve.</span>
              </div>

              {professional.priceInfo ? (
                <p className="text-xs text-support-2/80">{professional.priceInfo}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
