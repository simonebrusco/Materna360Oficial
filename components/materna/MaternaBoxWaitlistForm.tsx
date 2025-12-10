'use client'

import { useState } from 'react'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { submitMaternaBoxWaitlist } from '@/app/lib/maternaBoxWaitlistClient'
import { toast } from '@/app/lib/toast'

export function MaternaBoxWaitlistForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [childAgeRange, setChildAgeRange] = useState('')
  const [city, setCity] = useState('')
  const [discoverySource, setDiscoverySource] = useState('')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!name.trim() || !email.trim()) {
      toast.info('Preencha pelo menos seu nome e e-mail para entrar na lista.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await submitMaternaBoxWaitlist({
        name: name.trim(),
        email: email.trim(),
        childAgeRange: childAgeRange.trim() || undefined,
        city: city.trim() || undefined,
        discoverySource: discoverySource.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      toast.success(
        res.message ||
          'Cadastro feito com carinho. Você entrou para a lista de espera da MaternaBox.',
      )

      setHasSubmittedOnce(true)

      // limpa campos, mas mantém e-mail se quiser facilitar reenviar depois
      setName('')
      // setEmail(email) // se quiser deixar o e-mail preenchido
      setChildAgeRange('')
      setCity('')
      setDiscoverySource('')
      setNotes('')
    } catch (error: any) {
      toast.danger(
        error?.message ||
          'Não conseguimos enviar seu cadastro agora. Tente novamente em alguns instantes.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SoftCard className="rounded-[32px] border border-[#F5D7E5] bg-white/95 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.16)] md:p-8">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#fd2597]/85">
            LISTA DE ESPERA · MATERNABOX
          </p>
          <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
            Entre para a lista de espera da MaternaBox.
          </h2>
          <p className="text-sm md:text-base text-[#545454] max-w-2xl">
            Deixe seus dados e vamos te avisar, com carinho, quando as primeiras
            caixas estiverem prontas para chegar na sua casa.
          </p>

          {hasSubmittedOnce && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold text-[#b8236b]">
              <AppIcon
                name="sparkles"
                className="h-3.5 w-3.5 text-[#fd2597]"
              />
              <span>Você já está na lista de espera da MaternaBox.</span>
            </div>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Linha: nome + e-mail */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#545454]">
                Nome completo
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Como você gostaria de ser chamada por aqui?"
                className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-3 py-2.5 text-sm text-[#545454] placeholder-[#A0A0A0] focus:border-[#fd2597] focus:outline-none focus:ring-2 focus:ring-[#fd2597]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#545454]">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Para avisarmos quando a MaternaBox estiver disponível."
                className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-3 py-2.5 text-sm text-[#545454] placeholder-[#A0A0A0] focus:border-[#fd2597] focus:outline-none focus:ring-2 focus:ring-[#fd2597]/20"
              />
            </div>
          </div>

          {/* Linha: idade do filho + cidade */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#545454]">
                Idade do seu filho (ou filhos)
              </label>
              <input
                type="text"
                value={childAgeRange}
                onChange={e => setChildAgeRange(e.target.value)}
                placeholder="Ex.: 2 anos / 4 e 7 anos"
                className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-3 py-2.5 text-sm text-[#545454] placeholder-[#A0A0A0] focus:border-[#fd2597] focus:outline-none focus:ring-2 focus:ring-[#fd2597]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#545454]">
                Cidade / Estado
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Para nos ajudar a planejar frete e experiências"
                className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-3 py-2.5 text-sm text-[#545454] placeholder-[#A0A0A0] focus:border-[#fd2597] focus:outline-none focus:ring-2 focus:ring-[#fd2597]/20"
              />
            </div>
          </div>

          {/* Como chegou + campo livre */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#545454]">
              Como você chegou até o Materna360?
            </label>
            <input
              type="text"
              value={discoverySource}
              onChange={e => setDiscoverySource(e.target.value)}
              placeholder="Ex.: Instagram, indicação de amiga, podcast, outro."
              className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-3 py-2.5 text-sm text-[#545454] placeholder-[#A0A0A0] focus:border-[#fd2597] focus:outline-none focus:ring-2 focus:ring-[#fd2597]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#545454]">
              Quer contar algo sobre o que espera da MaternaBox?
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Opcional. Pode ser uma expectativa, uma necessidade da sua rotina ou algo que faria diferença para você."
              rows={3}
              className="w-full rounded-2xl border border-[#F5D7E5] bg-white px-3 py-2.5 text-sm text-[#545454] placeholder-[#A0A0A0] focus:border-[#fd2597] focus:outline-none focus:ring-2 focus:ring-[#fd2597]/20 resize-none"
            />
          </div>

          {/* Botão + mensagem suave */}
          <div className="flex flex-col gap-2 pt-2 md:flex-row md:items-center md:justify-between">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting
                ? 'Enviando seu cadastro...'
                : 'Entrar para a lista de espera'}
            </Button>

            <p className="text-[11px] md:text-xs text-[#6A6A6A] max-w-md">
              Usaremos seu e-mail apenas para novidades da MaternaBox e do
              Materna360. Sem spam, sem exageros — prometido.
            </p>
          </div>
        </form>
      </div>
    </SoftCard>
  )
}
