'use client'

import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

export default function AjudaEParceriasPage() {
  const [form, setForm] = useState<PartnershipFormState>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [activeSection, setActiveSection] = useState<HubSectionId>('parcerias')

  useEffect(() => {
    try {
      track('nav.view', { tab: 'maternar', page: 'ajuda-e-parcerias', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
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
        'Recebemos seu interesse em parcerias com o Materna360. Em breve alguém do time entra em contato com você.',
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

  const scrollTo = (id: HubSectionId) => {
    if (typeof window === 'undefined') return
    const el = document.getElementById(`ajuda-parcerias-${id}`)
    if (!el) return

    const headerOffset = 88
    const rect = el.getBoundingClientRect()
    const offsetTop = rect.top + window.scrollY - headerOffset

    window.scrollTo({ top: offsetTop, behavior: 'smooth' })
  }

  // Observa seção ativa conforme scroll (leve)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const ids: HubSectionId[] = ['parcerias', 'ajuda']
    const elements = ids
      .map((id) => document.getElementById(`ajuda-parcerias-${id}`))
      .filter(Boolean) as HTMLElement[]

    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0]
        if (!visible?.target?.id) return

        const sectionId = visible.target.id.replace('ajuda-parcerias-', '') as HubSectionId
        if (sectionId && ids.includes(sectionId)) setActiveSection(sectionId)
      },
      {
        root: null,
        rootMargin: '-120px 0px -55% 0px',
        threshold: [0.05, 0.15, 0.25, 0.35],
      },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

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
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          {/* HEADER (padrão Minhas Conquistas) */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <div className="inline-flex">
                <span className="px-3 py-1 rounded-full bg-white/20 border border-white/35 text-[11px] font-semibold tracking-[0.24em] text-white/90">
                  MATERNAR
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Ajuda & Parcerias
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-3xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Um espaço para se conectar com o Materna360 — com foco em parcerias e um canal de ajuda simples, quando precisar.
              </p>
            </div>
          </header>

          {/* CONTEÚDO */}
          <div className="space-y-8 md:space-y-10">
            {/* HERO HUB-LIKE */}
            <Reveal>
              <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/95 p-6 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
                <div className="space-y-5 md:space-y-6">
                  <div className="max-w-3xl space-y-2.5">
                    <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                      AJUDA & PARCERIAS
                    </p>

                    <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                      Parcerias em primeiro plano. Ajuda quando precisar.
                    </h2>

                    <p className="text-sm md:text-[15px] text-[#545454] leading-relaxed">
                      Se você é profissional, criadora de conteúdo ou marca alinhada ao universo materno, este é o caminho.
                      O suporte do app fica aqui também, mas de forma mais direta e enxuta.
                    </p>
                  </div>

                  {/* MINI MENU */}
                  <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/55 p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]/85">
                      MENU
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {HUB_SECTIONS.map((s) => (
                        <Pill key={s.id} id={s.id} label={s.label} />
                      ))}
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[12px] text-[#545454]">
                        Recomendação: comece por <span className="font-semibold">Parcerias</span>.
                      </p>

                      <Button
                        variant="primary"
                        size="sm"
                        className="text-[13px] px-5 py-2"
                        onClick={() => scrollTo('parcerias')}
                      >
                        Abrir formulário de parcerias
                      </Button>
                    </div>
                  </div>

                  {/* Cards curtos */}
                  <div className="grid gap-3 md:gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
                    <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="font-semibold text-[13px] text-[#fd2597]">Profissionais</p>
                      <p className="text-[13px] text-[#545454] leading-snug">
                        Especialistas alinhados ao cuidado real.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="font-semibold text-[13px] text-[#fd2597]">Criadoras</p>
                      <p className="text-[13px] text-[#545454] leading-snug">
                        Conteúdo com responsabilidade e afeto.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="font-semibold text-[13px] text-[#fd2597]">Marcas</p>
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
                    <p className="text-sm md:text-[15px] text-[#545454] max-w-2xl leading-relaxed">
                      Conte rapidamente quem você é e como imagina essa parceria. A gente responde com calma, no tempo certo.
                    </p>
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
                          <option value="criadora_conteudo">Criadora de conteúdo</option>
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

                      <p className="text-[12px] leading-relaxed text-[#6A6A6A]">
                        Ao enviar, você não assume compromisso. É o primeiro passo para uma conversa.
                      </p>
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
                              <AppIcon name="heart" className="h-4 w-4 text-[#fd2597]" />
                            </span>
                            <span>Conteúdo/serviço com cuidado emocional.</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 h-7 w-7 rounded-full bg-white border border-[#F5D7E5] flex items-center justify-center">
                              <AppIcon name="sparkles" className="h-4 w-4 text-[#fd2597]" />
                            </span>
                            <span>Aplicável na rotina (sem promessas mágicas).</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 h-7 w-7 rounded-full bg-white border border-[#F5D7E5] flex items-center justify-center">
                              <AppIcon name="shield" className="h-4 w-4 text-[#fd2597]" />
                            </span>
                            <span>Responsabilidade e ética (principalmente com mães e crianças).</span>
                          </p>
                        </div>
                      </SoftCard>

                      <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6A6A6A]">
                          EXEMPLOS
                        </p>
                        <div className="mt-2 space-y-1 text-[13px] text-[#545454]">
                          <p>• Profissionais para rede Materna+</p>
                          <p>• Conteúdos e guias para Biblioteca Materna</p>
                          <p>• Benefícios para assinantes (Materna+)</p>
                          <p>• Marcas alinhadas a “rotina real”</p>
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
                      AJUDA (BÁSICO)
                    </p>
                    <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                      Se algo não estiver funcionando
                    </h2>
                    <p className="text-sm md:text-[15px] text-[#545454] max-w-2xl leading-relaxed">
                      Um FAQ rápido para resolver o essencial — sem virar uma página enorme.
                    </p>
                  </header>

                  <div className="grid gap-3 md:grid-cols-2">
                    <details className="group rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/45 p-4">
                      <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#2F3A56]">
                        App não carrega / travou
                      </summary>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#545454]">
                        Verifique a internet e feche/abra o app. Se persistir, volte mais tarde: estamos evoluindo com cuidado.
                      </p>
                    </details>

                    <details className="group rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/45 p-4">
                      <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#2F3A56]">
                        Onde ficam meus registros?
                      </summary>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#545454]">
                        O que você faz nos mini-hubs aparece no Planner (Meu Dia / Eu360), sempre com a origem do registro.
                      </p>
                    </details>
                  </div>

                  <SoftCard className="rounded-2xl border border-[#F5D7E5] bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="text-[12px] font-semibold tracking-[0.18em] text-[#6A6A6A] uppercase">
                      Dica rápida
                    </p>
                    <p className="mt-2 text-[13px] text-[#545454] leading-relaxed">
                      Se você quiser, anote em uma frase: “o que eu esperava” vs “o que aconteceu”.
                      Isso ajuda muito quando o canal direto de suporte estiver ativo.
                    </p>
                  </SoftCard>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <p className="text-[12px] text-[#6A6A6A]">
                      Precisa propor algo para o Materna360? Use Parcerias.
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => scrollTo('parcerias')}>
                      Voltar para Parcerias
                    </Button>
                  </div>
                </div>
              </SoftCard>
            </Reveal>

            <MotivationalFooter routeKey="ajuda-parcerias" />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
