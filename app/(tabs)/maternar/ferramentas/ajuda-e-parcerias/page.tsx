'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import Link from 'next/link'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

/* =========================
   P34.10 — Legibilidade Mobile
========================= */

function splitEditorialText(raw: string | null | undefined): string[] {
  if (!raw) return []
  const text = String(raw).trim()
  if (!text) return []

  const markers = ['No final,', 'No fim,', 'Depois,', 'Em seguida,', 'Por fim,', 'E', 'Mas', 'Se']
  let working = text
  markers.forEach((m) => {
    working = working.replace(new RegExp(`\\s+${m}\\s+`, 'g'), `\n\n${m} `)
  })

  const parts = working
    .split(/\n\n|(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return parts.slice(0, 3)
}

function RenderEditorialText({
  text,
  className,
}: {
  text: string | null | undefined
  className: string
}) {
  const parts = splitEditorialText(text)
  if (!parts.length) return null

  return (
    <div className="space-y-2">
      {parts.map((p, i) => (
        <p key={i} className={className}>
          {p}
        </p>
      ))}
    </div>
  )
}

type PartnershipType =
  | 'profissional_saude'
  | 'criadora_conteudo'
  | 'marca_produto'
  | 'outros'

interface PartnershipFormState {
  partnershipType: PartnershipType
  name: string
  email: string
  message: string
}

const initialFormState: PartnershipFormState = {
  partnershipType: 'profissional_saude',
  name: '',
  email: '',
  message: '',
}

type HubSectionId = 'parcerias' | 'ajuda'

const HUB_SECTIONS: { id: HubSectionId; label: string }[] = [
  { id: 'parcerias', label: 'Parcerias' },
  { id: 'ajuda', label: 'Ajuda' },
]

export default function AjudaEParceriasPage() {
  const [form, setForm] = useState<PartnershipFormState>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<HubSectionId>('parcerias')

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/maternar/parcerias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error('Algo não saiu como esperado.')
      }

      setSuccessMessage(
        'Recebemos seu contato. Em breve alguém do time entra em contato com você.',
      )
      setForm(initialFormState)
    } catch {
      setErrorMessage(
        'Não conseguimos enviar agora. Se fizer sentido, tente novamente em alguns instantes.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollTo = (id: HubSectionId) => {
    const el = document.getElementById(`ajuda-parcerias-${id}`)
    if (!el) return
    const offset = el.getBoundingClientRect().top + window.scrollY - 88
    window.scrollTo({ top: offset, behavior: 'smooth' })
  }

  const openSupportInfo = () => {
    window.alert(
      'O canal direto de suporte está em evolução.\n\nPor enquanto, descreva o que aconteceu e envie pelo formulário de Parcerias. A gente lê com cuidado e responde pelo e-mail informado.',
    )
    scrollTo('parcerias')
  }

  return (
    <main data-layout="page-template-v1" data-tab="maternar" className="min-h-[100dvh] pb-32 bg-[#fff7fa]">
      <ClientOnly>
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <header className="pt-8 mb-8">
            <Link href="/maternar" className="text-sm text-[#fd2597]">
              ← Voltar para o Maternar
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-[#545454]">
              Ajuda & Parcerias
            </h1>
            <RenderEditorialText
              text="Um canal direto para parcerias e um FAQ simples para resolver o essencial."
              className="text-sm text-[#545454] mt-2 max-w-2xl"
            />
          </header>

          {/* MENU */}
          <div className="flex gap-2 mb-8">
            {HUB_SECTIONS.map((s) => (
              <Button
                key={s.id}
                variant={activeSection === s.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setActiveSection(s.id)
                  scrollTo(s.id)
                }}
              >
                {s.label}
              </Button>
            ))}
          </div>

          {/* PARCERIAS */}
          <Reveal>
            <SoftCard id="ajuda-parcerias-parcerias" className="p-6 mb-10">
              <h2 className="text-lg font-semibold text-[#545454] mb-2">
                Parcerias
              </h2>
              <RenderEditorialText
                text="Conte quem você é e como imagina essa parceria. A conversa começa aqui."
                className="text-sm text-[#545454] mb-4"
              />

              <form className="space-y-4" onSubmit={handleSubmit}>
                <select
                  name="partnershipType"
                  value={form.partnershipType}
                  onChange={handleChange}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                >
                  <option value="profissional_saude">Profissional da saúde</option>
                  <option value="criadora_conteudo">Criadora de conteúdo</option>
                  <option value="marca_produto">Marca / produto</option>
                  <option value="outros">Outro</option>
                </select>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nome"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />

                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="E-mail"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />

                <textarea
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Como imagina essa parceria?"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />

                {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
                {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando…' : 'Enviar proposta'}
                </Button>
              </form>
            </SoftCard>
          </Reveal>

          {/* AJUDA */}
          <Reveal>
            <SoftCard id="ajuda-parcerias-ajuda" className="p-6">
              <h2 className="text-lg font-semibold text-[#545454] mb-2">
                Ajuda
              </h2>
              <RenderEditorialText
                text="Se algo não funcionou como esperado, veja o essencial aqui."
                className="text-sm text-[#545454] mb-4"
              />

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-6">
                <p className="text-xs text-[#6A6A6A]">
                  Para falar com o time, use o canal disponível.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={openSupportInfo}>
                    Falar com suporte
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => scrollTo('parcerias')}>
                    Voltar para Parcerias
                  </Button>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="ajuda-parcerias" />
        </div>
      </ClientOnly>
    </main>
  )
}
