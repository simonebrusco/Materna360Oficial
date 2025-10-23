'use client'

import { useEffect } from 'react'
import Image from 'next/image'

import type { Professional } from '@/app/types/professionals'
import { Button } from '@/components/ui/button'

type ProfessionalModalProps = {
  professional: Professional | null
  open: boolean
  onClose: () => void
  onContact?: (professional: Professional) => void
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

export function ProfessionalModal({ professional, open, onClose, onContact }: ProfessionalModalProps) {
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-10 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`professional-modal-${professional.id}`}
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white/95 shadow-elevated">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar perfil profissional"
          className="absolute right-5 top-5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          Fechar
        </button>
        <div className="grid gap-8 p-8 sm:grid-cols-[200px,1fr]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-40 w-40 overflow-hidden rounded-3xl bg-secondary/50 shadow-soft">
              <Image
                src={professional.avatarUrl}
                alt={`Foto de ${professional.name}`}
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Primeira avaliação gratuita
            </span>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <h3 id={`professional-modal-${professional.id}`} className="text-2xl font-semibold text-support-1">
                {professional.name}
              </h3>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/80">
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
                {professional.howHelps.map((item, index) => (
                  <li key={`${professional.id}-help-${index}`}>{item}</li>
                ))}
              </ul>
            </div>

            {professional.approaches && professional.approaches.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/80">Abordagens</h4>
                <div className="flex flex-wrap gap-2">
                  {professional.approaches.map((approach) => (
                    <span
                      key={`${professional.id}-approach-${approach}`}
                      className="rounded-full bg-secondary/60 px-3 py-1 text-xs font-semibold text-support-1"
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
                <ul className="space-y-1 text-sm text-support-2">
                  <li>{professional.formats.online ? '✔ Online' : '— Online'}</li>
                  <li>{professional.formats.inPerson ? '✔ Presencial' : '— Presencial'}</li>
                  {professional.formats.regions && professional.formats.regions.length > 0 ? (
                    <li>Atende em: {professional.formats.regions.join(', ')}</li>
                  ) : null}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/80">Idiomas</h4>
                <div className="flex flex-wrap gap-2">
                  {professional.languages.map((language) => (
                    <span
                      key={`${professional.id}-lang-${language}`}
                      className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-support-1 shadow-soft"
                    >
                      {LANGUAGE_LABEL[language] ?? language}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-support-2/80">Faixas de cuidado</h4>
              <div className="flex flex-wrap gap-2">
                {professional.ageBands.map((band) => (
                  <span
                    key={`${professional.id}-age-${band}`}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {AGE_BAND_LABEL[band]}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={handleContact} disabled>
                Vamos conversar?
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Fechar
              </Button>
              <span className="text-xs font-medium text-support-2">
                Função disponível em breve.
              </span>
            </div>

            {professional.priceInfo ? (
              <p className="text-xs text-support-2/80">{professional.priceInfo}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
