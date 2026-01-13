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
   Quebra editorial de texto
   - mantém o conteúdo
   - melhora ritmo no mobile
   - no máximo 3 “respiros”
   - sem regex avançada (safe)
========================= */

function splitEditorialText(raw: string | null | undefined): string[] {
  if (!raw) return []

  const text = String(raw).trim()
  if (!text) return []

  const markers = [
    'No final,',
    'No fim,',
    'Depois,',
    'Em seguida,',
    'Por fim,',
    'E',
    'Mas',
    'Se',
  ]
  let working = text

  markers.forEach((m) => {
    working = working.replace(new RegExp(`\\s+${m}\\s+`, 'g'), `\n\n${m} `)
  })

  let parts = working
    .split('\n\n')
    .map((p) => p.trim())
    .filter(Boolean)

  if (parts.length === 1) {
    const sentenceParts = working
      .split(/([.!?])\s+/)
      .map((p) => p.trim())
      .filter(Boolean)

    const rebuilt: string[] = []
    for (let i = 0; i < sentenceParts.length; i++) {
      const cur = sentenceParts[i]
      const next = sentenceParts[i + 1]
      if (cur === '.' || cur === '!' || cur === '?') continue
      if (next === '.' || next === '!' || next === '?') {
        rebuilt.push(`${cur}${next}`)
        i += 1
      } else {
        rebuilt.push(cur)
      }
    }

    parts = rebuilt.length ? rebuilt : parts
  }

  return parts.slice(0, 3)
}

function RenderEditorialText({
  text,
  className,
  as = 'p',
}: {
  text: string | null | undefined
  className: string
  as?: 'p' | 'div'
}) {
  const parts = splitEditorialText(text)
  const Comp: any = as

  if (as === 'div') {
    return (
      <Comp className="space-y-2">
        {parts.map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
      </Comp>
    )
  }

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

const HUB_SECTIONS: { id: HubSectionId; label: string; hint: string }[] = [
  { id: 'parcerias', label: 'Parcerias', hint: 'Vamos construir juntas.' },
  { id: 'ajuda', label: 'Ajuda', hint: 'Suporte simples e direto.' },
]

/* =========================
   SUPORTE (modal)
========================= */

type SupportTopic = 'bug' | 'acesso' | 'conta' | 'outro'

interface SupportFormState {
  topic: SupportTopic
  name: string
  email: string
  message: string
}

const initialSupportState: SupportFormState = {
  topic: 'bug',
  name: '',
  email: '',
  message: '',
}

export default function AjudaEParceriasPage() {
  const [form, setForm] = useState<PartnershipFormState>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [activeSection, setActiveSection] = useState<HubSectionId>('parcerias')

  // Modal suporte
  const [supportOpen, setSupportOpen] = useState(false)
  const [support, setSupport] = useState<SupportFormState>(initialSupportState)
  const [supportSubmitting, setSupportSubmitting] = useState(false)
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null)
  const [supportError, setSupportError] = useState<string | null>(null)

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSupportChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target
    setSupport((prev) => ({
      ...prev,
      [name]: value,
    }))
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
        const data = await response.json().catch(() => null)
        const messageFromApi =
          data && typeof data.message === 'string'
            ? data.message
            : 'Algo não saiu como esperado.'
        throw new Error(messageFromApi)
      }

      setSuccessMessage(
        'Recebemos sua proposta. Se fizer sentido para o Materna360, nosso time responde por e-mail com o próximo passo.',
      )
      setForm(initialFormState)
    } catch (error) {
      console.error('[Materna360][Parcerias] erro ao enviar formulário', error)
      setErrorMessage(
        'Não conseguimos enviar suas informações agora. Se fizer sentido para você, tente novamente em alguns instantes.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSupportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSupportSuccess(null)
    setSupportError(null)
    setSupportSubmitting(true)

    try {
      const response = await fetch('/api/maternar/suporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(support),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const messageFromApi =
          data && typeof data.message === 'string'
            ? data.message
            : 'Algo não saiu como esperado.'
        throw new Error(messageFromApi)
      }

      setSupportSuccess('Recebemos seu pedido. Em breve alguém do time responde por e-mail.')
      setSupport(initialSupportState)
    } catch (error) {
      console.error('[Materna360][Suporte] erro ao enviar formulário', error)
      setSupportError('Não conseguimos enviar seu pedido agora. Tente novamente em alguns instantes.')
    } finally {
      setSupportSubmitting(false)
    }
  }

  const scrollTo = (id: HubSectionId) => {
    if (typeof window === 'undefined') return
    const el = document.getElementById(`ajuda-parcerias-${id}`)
    if (!el) return

    const headerOffset = 88
    const rect = el.getBoundingClientRect()
    const offsetTop = rect.top + window.scrollY - headerOffset

    window.scrollTo({ top: offsetTop, behavior: 'smooth' })
  }

  const Pill = ({ id, label }: { id: HubSectionId; label: string }) => {
    const isActive = activeSection === id
    return (
      <button
        type="button"
        onClick={() => {
          setActiveSection(id)
          scrollTo(id)
        }}
        className={[
          'rounded-full border px-3 py-1.5 text-[12px] md:text-[13px] font-medium transition-colors',
          isActive
            ? 'border-[#fd2597] bg-[#fdbed7] text-[#fd2597]'
            : 'border-[#F5D7E5] bg-white/70 text-[#545454] hover:border-[#fd2597] hover:bg-[#ffe1f1]',
        ].join(' ')}
      >
        {label}
      </button>
    )
  }

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
        <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6">
          {/* HEADER */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Ajuda & Parcerias
              </h1>

              <RenderEditorialText
                text="Um canal direto para falar com o Materna360 — com espaço para parcerias e um FAQ simples para resolver o essencial."
                className="text-sm md:text-base text-white/90 leading-relaxed max-w-2xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
              />
            </div>
          </header>

          {/* CONTEÚDO */}
          <div className="pt-3 md:pt-4 pb-12 space-y-8 md:space-y-10">
            {/* HERO HUB-LIKE */}
            <Reveal>
              <SoftCard className="rounded-3xl border border-white/35 bg-white/10 backdrop-blur-xl p-6 md:p-7 shadow-[0_18px_45px_rgba(184,35,107,0.25)]">
                <div className="space-y-5 md:space-y-6">
                  <div className="max-w-3xl space-y-2.5">
                    <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-white/85">
                      AJUDA & PARCERIAS
                    </p>

                    <h2 className="text-lg md:text-xl font-semibold text-white">
                      Um canal direto: parcerias e ajuda prática.
                    </h2>

                    <RenderEditorialText
                      text="Se você quer propor parceria, este é o caminho. Se você precisa resolver algo do app, o FAQ fica aqui — simples e enxuto."
                      className="text-sm md:text-[15px] text-white/90 leading-relaxed"
                    />
                  </div>

                  {/* MINI MENU + CTAs */}
                  <div className="rounded-2xl border border-white/25 bg-white/10 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                      MENU
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {HUB_SECTIONS.map((s) => (
                        <Pill key={s.id} id={s.id} label={s.label} />
                      ))}
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-[13px] px-5 py-2"
                        onClick={() => scrollTo('parcerias')}
                      >
                        Enviar proposta
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-[13px] px-5 py-2"
                        onClick={() => scrollTo('ajuda')}
                      >
                        Abrir ajuda
                      </Button>

                      <button
                        type="button"
                        onClick={() => {
                          setSupportSuccess(null)
                          setSupportError(null)
                          setSupportOpen(true)
                        }}
                        className="
                          rounded-full
                          bg-white/90 hover:bg-white
                          text-[#2f3a56]
                          px-5 py-2
                          text-[13px]
                          shadow-[0_6px_18px_rgba(0,0,0,0.12)]
                          transition
                        "
                      >
                        Falar com suporte
                      </button>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[12px] text-white/85">
                        Se fizer sentido para o seu momento, comece por{' '}
                        <span className="font-semibold">Parcerias</span>.
                      </p>

                      <button
                        type="button"
                        onClick={() => scrollTo('parcerias')}
                        className="
                          rounded-full
                          bg-[#fd2597]
                          text-white
                          px-4 py-2
                          text-[12px]
                          shadow-[0_10px_26px_rgba(253,37,151,0.35)]
                          hover:opacity-95
                          transition
                        "
                      >
                        Abrir formulário de parcerias
                      </button>
                    </div>
                  </div>

                  {/* Cards curtos */}
                  <div className="grid gap-3 md:gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/95 border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="font-semibold text-[13px] text-[#fd2597]">
                        Profissionais
                      </p>
                      <p className="text-[13px] text-[#545454] leading-snug">
                        Especialistas alinhados ao cuidado real.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/95 border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="font-semibold text-[13px] text-[#fd2597]">
                        Criadoras
                      </p>
                      <p className="text-[13px] text-[#545454] leading-snug">
                        Conteúdo com responsabilidade e afeto.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/95 border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="font-semibold text-[13px] text-[#fd2597]">
                        Marcas
                      </p>
                      <p className="text-[13px] text-[#545454] leading-snug">
                        Produtos/serviços que respeitam mães reais.
                      </p>
                    </div>
                  </div>
                </div>
              </SoftCard>
            </Reveal>

            {/* PARCERIAS */}
            <Reveal delay={20}>
              <SoftCard
                id="ajuda-parcerias-parcerias"
                className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
              >
                <div className="space-y-5">
                  <header className="space-y-2">
                    <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                      PARCERIAS
                    </p>
                    <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                      Vamos construir algo bonito e útil para mães reais.
                    </h2>

                    <RenderEditorialText
                      text="Conte rapidamente quem você é e como imagina essa parceria. A gente lê com cuidado e responde pelo mesmo canal do e-mail informado."
                      className="text-sm md:text-[15px] text-[#545454] max-w-2xl leading-relaxed"
                    />
                  </header>

                  <div className="grid gap-5 md:grid-cols-[1.2fr,0.8fr]">
                    {/* FORM */}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="space-y-2">
                        <label
                          htmlFor="partnershipType"
                          className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                        >
                          Tipo de parceria
                        </label>
                        <select
                          id="partnershipType"
                          name="partnershipType"
                          value={form.partnershipType}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] text-[#2F3A56] outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                          disabled={isSubmitting}
                        >
                          <option value="profissional_saude">
                            Profissional da saúde / desenvolvimento infantil
                          </option>
                          <option value="criadora_conteudo">
                            Criadora de conteúdo
                          </option>
                          <option value="marca_produto">
                            Marca / produto para mães ou crianças
                          </option>
                          <option value="outros">Outro tipo de parceria</option>
                        </select>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label
                            htmlFor="name"
                            className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                          >
                            Nome
                          </label>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Como você gostaria de ser chamada?"
                            className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] text-[#2F3A56] placeholder:text-[#545454]/60 outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="email"
                            className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                          >
                            E-mail
                          </label>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Seu melhor e-mail"
                            className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] text-[#2F3A56] placeholder:text-[#545454]/60 outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="message"
                          className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                        >
                          Mensagem
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={4}
                          value={form.message}
                          onChange={handleChange}
                          placeholder="Qual parceria faz sentido? (objetivo, público, formato, como imagina a entrega)"
                          className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] leading-relaxed text-[#2F3A56] placeholder:text-[#545454]/60 outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                          disabled={isSubmitting}
                        />
                      </div>

                      {successMessage && (
                        <p className="rounded-2xl bg-[#ffe1f1] px-4 py-2 text-[12px] leading-relaxed text-[#2F3A56]">
                          {successMessage}
                        </p>
                      )}

                      {errorMessage && (
                        <p className="rounded-2xl bg-[#fd2597]/10 px-4 py-2 text-[12px] leading-relaxed text-[#2F3A56]">
                          {errorMessage}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-[#fd2597] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_26px_rgba(0,0,0,0.18)] transition hover:bg-[#e0218c] disabled:cursor-not-allowed disabled:bg-[#fd2597]/60"
                      >
                        {isSubmitting ? 'Enviando...' : 'Enviar proposta de parceria'}
                      </button>

                      <RenderEditorialText
                        text="Ao enviar, você não assume compromisso. É só o começo de uma conversa."
                        className="text-[12px] leading-relaxed text-[#6A6A6A]"
                      />
                    </form>

                    {/* SIDE */}
                    <div className="space-y-3">
                      <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-[#ffe1f1]/70 p-5 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]/85">
                          O QUE A GENTE VALORIZA
                        </p>

                        <div className="mt-3 space-y-2 text-[13px] text-[#545454]">
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 h-7 w-7 rounded-full bg-white border border-[#F5D7E5] flex items-center justify-center">
                              <AppIcon
                                name="heart"
                                className="h-4 w-4 text-[#fd2597]"
                              />
                            </span>
                            <span>Conteúdo/serviço com cuidado emocional.</span>
                          </p>

                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 h-7 w-7 rounded-full bg-white border border-[#F5D7E5] flex items-center justify-center">
                              <AppIcon
                                name="sparkles"
                                className="h-4 w-4 text-[#fd2597]"
                              />
                            </span>
                            <span>Aplicável na rotina (sem promessas mágicas).</span>
                          </p>

                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 h-7 w-7 rounded-full bg-white border border-[#F5D7E5] flex items-center justify-center">
                              <AppIcon
                                name="shield"
                                className="h-4 w-4 text-[#fd2597]"
                              />
                            </span>
                            <span>
                              Responsabilidade e ética (principalmente com mães e
                              crianças).
                            </span>
                          </p>
                        </div>
                      </SoftCard>

                      <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6A6A6A]">
                          EXEMPLOS
                        </p>
                        <div className="mt-2 space-y-2 text-[13px] text-[#545454]">
                          <p>Profissionais para rede Materna+</p>
                          <p>Conteúdos e guias para Biblioteca Materna</p>
                          <p>Benefícios para assinantes (Materna+)</p>
                          <p>Marcas alinhadas à rotina real</p>
                        </div>
                      </SoftCard>
                    </div>
                  </div>
                </div>
              </SoftCard>
            </Reveal>

            {/* AJUDA */}
            <Reveal delay={60}>
              <SoftCard
                id="ajuda-parcerias-ajuda"
                className="rounded-3xl border border-[#F5D7E5] bg-white/96 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
              >
                <div className="space-y-4">
                  <header className="space-y-2">
                    <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#6A6A6A]">
                      AJUDA
                    </p>
                    <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                      Resolver o essencial
                    </h2>

                    {/* ✅ Ajuste premium (sem "sem culpa / volta depois") */}
                    <RenderEditorialText
                      text="Um FAQ para resolver problemas pontuais do app com rapidez. Se não encontrar sua resposta aqui, fale com o suporte — a gente prioriza retorno e resolução."
                      className="text-sm md:text-[15px] text-[#545454] max-w-2xl leading-relaxed"
                    />
                  </header>

                  <div className="grid gap-3 md:grid-cols-2">
                    <details className="group rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/45 p-4">
                      <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#2F3A56]">
                        App não carrega / travou
                      </summary>

                      <RenderEditorialText
                        text="Verifique a internet e feche/abra o app. Se persistir, acione o suporte com o máximo de contexto (onde estava + o que clicou) para agilizar a análise."
                        className="mt-2 text-[13px] leading-relaxed text-[#545454]"
                      />
                    </details>

                    <details className="group rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/45 p-4">
                      <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#2F3A56]">
                        Onde ficam meus registros?
                      </summary>

                      <RenderEditorialText
                        text="O que você registra nos mini-hubs aparece no Planner (Meu Dia / Eu360), sempre com a origem do registro."
                        className="mt-2 text-[13px] leading-relaxed text-[#545454]"
                      />
                    </details>

                    <details className="group rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/45 p-4">
                      <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#2F3A56]">
                        Aconteceu algo diferente do que eu esperava
                      </summary>

                      <RenderEditorialText
                        text="Anote em uma frase: “o que eu esperava” vs “o que aconteceu”. Se possível, inclua também “onde eu estava” + “o que cliquei”. Isso acelera o diagnóstico do time."
                        className="mt-2 text-[13px] leading-relaxed text-[#545454]"
                      />
                    </details>

                    <details className="group rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/45 p-4">
                      <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#2F3A56]">
                        Preciso de ajuda além do FAQ
                      </summary>

                      <RenderEditorialText
                        text="Use o botão “Falar com suporte” para abrir o formulário e enviar sua mensagem. A resposta chega por e-mail."
                        className="mt-2 text-[13px] leading-relaxed text-[#545454]"
                      />
                    </details>
                  </div>

                  <SoftCard className="rounded-2xl border border-[#F5D7E5] bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="text-[12px] font-semibold tracking-[0.18em] text-[#6A6A6A] uppercase">
                      Dica rápida
                    </p>

                    <RenderEditorialText
                      text='Se possível, registre o contexto em uma frase: “onde eu estava” + “o que cliquei”. Ajuda a gente a reproduzir o cenário com mais precisão.'
                      className="mt-2 text-[13px] text-[#545454] leading-relaxed"
                    />
                  </SoftCard>

                  {/* ✅ Garantia: aqui SEMPRE tem os 2 botões (proposta + suporte) */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <p className="text-[12px] text-[#6A6A6A]">
                      Quer propor algo para o Materna360? Use Parcerias.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => scrollTo('parcerias')}
                      >
                        Enviar proposta
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSupportSuccess(null)
                          setSupportError(null)
                          setSupportOpen(true)
                        }}
                      >
                        Falar com suporte
                      </Button>
                    </div>
                  </div>
                </div>
              </SoftCard>
            </Reveal>

            <MotivationalFooter routeKey="ajuda-parcerias" />
          </div>
        </div>

        {/* MODAL SUPORTE */}
        {supportOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
            onClick={() => setSupportOpen(false)}
          >
            <div
              className="w-full max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]/85">
                      SUPORTE
                    </p>
                    <h3 className="text-[18px] font-semibold text-[#545454]">
                      Como podemos te ajudar?
                    </h3>
                    <p className="text-[12px] text-[#6A6A6A]">
                      Envie uma mensagem curta. A gente responde por e-mail.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSupportOpen(false)}
                    className="text-[12px] font-semibold text-[#fd2597] hover:text-[#b8236b]"
                  >
                    Fechar
                  </button>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleSupportSubmit}>
                  <div className="space-y-2">
                    <label
                      htmlFor="topic"
                      className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                    >
                      Assunto
                    </label>
                    <select
                      id="topic"
                      name="topic"
                      value={support.topic}
                      onChange={handleSupportChange}
                      className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] text-[#2F3A56] outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                      disabled={supportSubmitting}
                    >
                      <option value="bug">Algo travou / não carregou</option>
                      <option value="acesso">Acesso / login</option>
                      <option value="conta">Plano / conta</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="supportName"
                        className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                      >
                        Nome
                      </label>
                      <input
                        id="supportName"
                        name="name"
                        type="text"
                        value={support.name}
                        onChange={handleSupportChange}
                        placeholder="Como você gostaria de ser chamada?"
                        className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] text-[#2F3A56] placeholder:text-[#545454]/60 outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                        disabled={supportSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="supportEmail"
                        className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                      >
                        E-mail
                      </label>
                      <input
                        id="supportEmail"
                        name="email"
                        type="email"
                        required
                        value={support.email}
                        onChange={handleSupportChange}
                        placeholder="Seu melhor e-mail"
                        className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] text-[#2F3A56] placeholder:text-[#545454]/60 outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                        disabled={supportSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="supportMessage"
                      className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                    >
                      Mensagem
                    </label>
                    <textarea
                      id="supportMessage"
                      name="message"
                      rows={5}
                      value={support.message}
                      onChange={handleSupportChange}
                      placeholder="Em uma frase: o que você esperava vs o que aconteceu. Se lembrar: onde estava e o que clicou."
                      className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] leading-relaxed text-[#2F3A56] placeholder:text-[#545454]/60 outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                      disabled={supportSubmitting}
                    />
                  </div>

                  {supportSuccess && (
                    <p className="rounded-2xl bg-[#ffe1f1] px-4 py-2 text-[12px] leading-relaxed text-[#2F3A56]">
                      {supportSuccess}
                    </p>
                  )}

                  {supportError && (
                    <p className="rounded-2xl bg-[#fd2597]/10 px-4 py-2 text-[12px] leading-relaxed text-[#2F3A56]">
                      {supportError}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => setSupportOpen(false)}
                      className="sm:w-auto w-full"
                    >
                      Cancelar
                    </Button>

                    <button
                      type="submit"
                      disabled={supportSubmitting}
                      className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-[#fd2597] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_26px_rgba(0,0,0,0.18)] transition hover:bg-[#e0218c] disabled:cursor-not-allowed disabled:bg-[#fd2597]/60"
                    >
                      {supportSubmitting ? 'Enviando...' : 'Enviar para suporte'}
                    </button>
                  </div>

                  <p className="text-[11px] text-[#6A6A6A] leading-relaxed">
                    Ao enviar, você não cria obrigação. É apenas um pedido de ajuda para o time.
                  </p>
                </form>
              </SoftCard>
            </div>
          </div>
        )}
      </ClientOnly>
    </main>
  )
}
