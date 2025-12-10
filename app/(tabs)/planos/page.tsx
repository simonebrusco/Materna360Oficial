'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'

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

export default function AjudaEParceriasPage() {
  const [form, setForm] = useState<PartnershipFormState>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target
    setForm(prev => ({
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  return (
    <PageTemplate
      label="MATERNAR"
      title="Ajuda & Parcerias"
      subtitle="Um lugar seguro para tirar dúvidas, pedir ajuda e se conectar com o Materna360 de forma leve."
    >
      {/* GRID PRINCIPAL */}
      <section className="grid gap-6 md:gap-7 md:grid-cols-2">
        {/* Coluna esquerda – Ajuda & suporte */}
        <div className="flex-1">
          <div className="h-full rounded-3xl border border-[#F5D7E5] bg-white/95 p-6 shadow-[0_10px_28px_rgba(0,0,0,0.14)] backdrop-blur-md md:p-7">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-[12px] font-semibold tracking-[0.24em] text-[#b8236b] uppercase">
                  Ajuda &amp; suporte
                </p>
                <h2 className="text-[22px] md:text-[24px] font-semibold text-[#2F3A56]">
                  Quando algo não está funcionando bem
                </h2>
                <p className="text-[14px] md:text-[15px] leading-relaxed text-[#545454]">
                  Se alguma parte do app estiver diferente do esperado ou se
                  você tiver dúvidas sobre como usar um mini-hub, você não
                  precisa resolver isso sozinha. Aqui é o seu ponto de apoio.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-[#ffe1f1] p-4">
                  <h3 className="mb-1 text-[16px] md:text-[17px] font-semibold text-[#2F3A56]">
                    Dúvidas sobre o app
                  </h3>
                  <p className="text-[13px] leading-relaxed text-[#545454]">
                    Que tal anotar o que está confuso para você? Pode ser sobre
                    o Planner, XP, MaternaBox ou qualquer mini-hub. Isso nos
                    ajuda a melhorar a sua experiência.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#ffe1f1]/80 p-4">
                  <h3 className="mb-1 text-[16px] md:text-[17px] font-semibold text-[#2F3A56]">
                    Suporte técnico
                  </h3>
                  <p className="text-[13px] leading-relaxed text-[#545454]">
                    Se o app travar, não carregar ou algo estranho acontecer,
                    respire fundo. Você pode registrar o problema e nós
                    investigamos por aqui.
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-[#F5D7E5] bg-white/98 p-4 shadow-[0_8px_22px_rgba(0,0,0,0.08)]">
                <p className="text-[12px] font-semibold tracking-[0.18em] text-[#6A6A6A] uppercase">
                  FAQ rápido
                </p>
                <div className="space-y-3 text-[#2F3A56]">
                  <details className="group rounded-xl bg-[#ffe1f1]/50 p-3">
                    <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#2F3A56]">
                      O que eu faço se o app não carregar?
                    </summary>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#545454]">
                      Primeiro, verifique sua conexão com a internet e feche o
                      app por alguns segundos. Se ainda assim não funcionar,
                      você pode registrar o problema nesta área de suporte ou
                      entrar em contato pelo canal oficial quando estiver
                      disponível.
                    </p>
                  </details>

                  <details className="group rounded-xl bg-[#ffe1f1]/50 p-3">
                    <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#2F3A56]">
                      Onde vejo os conteúdos que salvei no Planner?
                    </summary>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#545454]">
                      Tudo o que você salva em mini-hubs como “Como Estou
                      Hoje”, “Rotina Leve” ou “Cuidar com Amor” fica organizado
                      dentro do Planner, na aba Meu Dia ou Eu360, sempre
                      identificado pela origem.
                    </p>
                  </details>

                  <details className="group rounded-xl bg-[#ffe1f1]/50 p-3">
                    <summary className="cursor-pointer list-none text-[14px] font-semibold text-[#2F3A56]">
                      Ainda estou com dúvidas. E agora?
                    </summary>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#545454]">
                      Está tudo bem ter dúvidas. Em breve, esta área terá um
                      canal direto de contato com o time Materna360. Por
                      enquanto, você pode anotar suas perguntas aqui para não
                      esquecer e revisitar quando quiser.
                    </p>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna direita – Parcerias */}
        <div className="flex-1">
          <div
            className="
              h-full rounded-3xl border border-[#F5D7E5]
              bg-[radial-gradient(circle_at_top,#ffe1f1_0%,#ffffff_55%,#ffe1f1_100%)]
              p-6 md:p-7
              shadow-[0_10px_28px_rgba(0,0,0,0.14)]
              backdrop-blur-md
            "
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-[12px] font-semibold tracking-[0.24em] text-[#b8236b] uppercase">
                  Parcerias
                </p>
                <h2 className="text-[22px] md:text-[24px] font-semibold text-[#2F3A56]">
                  Conecte sua jornada ao Materna360
                </h2>
                <p className="text-[14px] md:text-[15px] leading-relaxed text-[#545454]">
                  Se você é profissional, criadora de conteúdo ou representa uma
                  marca que conversa com o universo materno, este é o espaço
                  para se aproximar da nossa comunidade.
                </p>
              </div>

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

                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                  >
                    Nome completo
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
                    placeholder="Seu melhor e-mail para contato"
                    className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] text-[#2F3A56] placeholder:text-[#545454]/60 outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                  >
                    Como você gostaria de se conectar?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Conte, com calma, que tipo de parceria faz sentido para você e como imagina essa construção junto com o Materna360."
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
                  {isSubmitting
                    ? 'Enviando com carinho...'
                    : 'Quero falar sobre parcerias'}
                </button>

                <p className="text-[12px] leading-relaxed text-[#6A6A6A]">
                  Ao enviar este formulário, você não assume nenhum compromisso
                  imediato. É apenas o primeiro passo para uma conversa com
                  calma sobre como caminhar junto com o Materna360.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PageTemplate>
  )
}
