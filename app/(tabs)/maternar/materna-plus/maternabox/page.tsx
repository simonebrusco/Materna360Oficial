'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import AppIcon from '@/components/ui/AppIcon'

type WaitlistFormState = {
  name: string
  whatsapp: string
  email: string
}

export default function MaternaBoxPage() {
  const [form, setForm] = useState<WaitlistFormState>({
    name: '',
    whatsapp: '',
    email: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  function handleChange(field: keyof WaitlistFormState, value: string) {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isSubmitting) return

    setFormError(null)
    setFormSuccess(null)

    const name = form.name.trim()
    const whatsapp = form.whatsapp.trim()
    const email = form.email.trim()

    if (!name || !whatsapp || !email) {
      setFormError('Por favor, preencha seu nome, WhatsApp e e-mail.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setFormError('Por favor, informe um e-mail válido.')
      return
    }

    try {
      setIsSubmitting(true)

      const res = await fetch('/api/materna-box/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          whatsapp,
          email,
          source: 'materna-box-page',
        }),
      })

      let data: any = null
      try {
        data = await res.json()
      } catch {
        // se por algum motivo não vier JSON, seguimos pela verificação de status
      }

      if (!res.ok || (data && data.ok === false)) {
        const apiError =
          (data && typeof data.error === 'string' && data.error) || null

        setFormError(
          apiError ||
            'Não conseguimos salvar seus dados agora. Tente novamente em alguns instantes.',
        )
        return
      }

      // Se chegou aqui, consideramos sucesso independente do formato exato do JSON
      const successMessage =
        (data && typeof data.message === 'string' && data.message) ||
        'Pronto! Você entrou na lista de espera oficial da MaternaBox. Quando abrirmos as assinaturas, você será avisada com prioridade.'

      setFormSuccess(successMessage)
      setForm({
        name: '',
        whatsapp: '',
        email: '',
      })
    } catch {
      setFormError(
        'Tivemos um imprevisto ao enviar seus dados. Tente novamente em alguns instantes.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageTemplate
      label="MATERNAR"
      title="MaternaBox"
      subtitle="Todo mês, uma caixa criada para transformar momentos simples em conexões afetivas, fortalecer vínculos e trazer mais leveza para o seu dia."
    >
      <ClientOnly>
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-4 md:px-6 space-y-10 md:space-y-12">
          {/* HERO · TEXTO + IMAGEM */}
          <SoftCard className="grid gap-8 rounded-3xl border border-[#F5D7E5] bg-white p-5 shadow-[0_16px_32px_rgba(0,0,0,0.14)] md:grid-cols-[1.2fr,1fr] md:p-7">
            {/* TEXTO */}
            <div className="flex flex-col justify-center space-y-4 md:space-y-5">
              <p className="text-xs md:text-sm font-medium text-[#545454]">
                A experiência mensal de carinho que aproxima você do seu filho —
                e de você mesma.
              </p>

              <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                MaternaBox — pequenos rituais que acolhem sua rotina.
              </h2>

              <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                Todo mês, uma caixa criada para transformar momentos simples em
                conexões afetivas, fortalecer vínculos e trazer mais leveza para
                o seu dia.
              </p>

              <div className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[10px] font-medium text-[#545454]">
                Não revelamos o conteúdo. A surpresa faz parte da magia — e da
                experiência Materna360.
              </div>

              <div className="pt-1 flex flex-col gap-2 md:flex-row md:items-center">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full md:w-auto rounded-full bg-[#fd2597] hover:bg-[#b8236b] text-white border-none shadow-[0_10px_26px_rgba(0,0,0,0.18)]"
                >
                  Escolha o seu plano
                </Button>
                <p className="text-[11px] text-[#6A6A6A] md:max-w-xs">
                  Um passo de cada vez. A sua rotina pode ser mais acolhedora —
                  um gesto de cuidado por vez.
                </p>
              </div>
            </div>

            {/* IMAGEM */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-sm aspect-[9/10] md:max-w-md">
                <Image
                  src="/images/maternabox2.png"
                  alt="Mãe brincando com o filho enquanto abre a MaternaBox"
                  fill
                  priority
                  sizes="(min-width: 1024px) 420px, (min-width: 768px) 360px, 100vw"
                  className="rounded-3xl object-cover shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                />
              </div>
            </div>
          </SoftCard>

          {/* COMO FUNCIONA A MATERNABOX */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 shadow-[0_10px_24px_rgba(0,0,0,0.08)] md:p-6">
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-[#545454]">
                Como funciona a MaternaBox?
              </h3>
              <p className="text-xs md:text-sm text-[#545454]">
                A MaternaBox é uma experiência mensal cuidadosamente pensada
                para trazer:
              </p>
              <ul className="space-y-1.5 text-[11px] md:text-xs text-[#545454]">
                <li>• estímulos criativos para seu filho,</li>
                <li>• rituais de presença para vocês viverem juntos,</li>
                <li>• um carinho especial para você,</li>
                <li>• e um momento de pausa dentro da sua rotina.</li>
              </ul>
              <p className="text-xs md:text-sm text-[#545454]">
                Cada edição traz algo novo. Sempre leve, sempre acolhedor,
                sempre Materna360.
              </p>
            </div>
          </SoftCard>

          {/* O QUE VEM + PARA QUEM É / NÃO É */}
          <div className="grid gap-6 md:gap-8 md:grid-cols-[1.1fr,1fr]">
            {/* O QUE VEM NA CAIXA */}
            <SoftCard className="h-full rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 shadow-[0_10px_24px_rgba(0,0,0,0.08)] md:p-6">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#fd2597]/80">
                    O QUE VEM NA SUA MATERNABOX?
                  </p>
                  <h3 className="text-base md:text-lg font-semibold text-[#545454]">
                    Uma combinação leve de carinho, estímulo e presença.
                  </h3>
                  <p className="text-xs md:text-sm text-[#545454]}>
                    A ideia não é encher sua casa de coisas, e sim te dar
                    oportunidades prontas de se conectar com seu filho, com o
                    que você consegue hoje.
                  </p>
                </div>

                <div className="grid gap-3.5 md:grid-cols-2">
                  <div className="space-y-1.5 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-3.5">
                    <p className="text-xs font-semibold text-[#545454]">
                      Brinquedo educativo principal
                    </p>
                    <p className="text-[11px] text-[#545454]">
                      Pensado para a fase de desenvolvimento do seu filho:
                      coordenação, criatividade, linguagem, vínculo — sempre
                      com olhar pedagógico.
                    </p>
                  </div>

                  <div className="space-y-1.5 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-3.5">
                    <p className="text-xs font-semibold text-[#545454]">
                      Atividades guiadas prontas
                    </p>
                    <p className="text-[11px] text-[#545454]">
                      Ideias simples com um roteiro em poucos passos para você
                      só chegar, sentar e aproveitar o momento — sem precisar
                      preparar um “evento”.
                    </p>
                  </div>

                  <div className="space-y-1.5 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-3.5">
                    <p className="text-xs font-semibold text-[#545454]">
                      Mini-guia de conexão
                    </p>
                    <p className="text-[11px] text-[#545454]">
                      Um folheto impresso com sugestões de fala, ajustes para
                      diferentes idades e ideias de como repetir a atividade em
                      outros dias.
                    </p>
                  </div>

                  <div className="space-y-1.5 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-3.5">
                    <p className="text-xs font-semibold text-[#545454]">
                      Surpresa mensal
                    </p>
                    <p className="text-[11px] text-[#545454]">
                      Pode ser um item sensorial, algo para você ou um detalhe
                      extra para tornar a experiência ainda mais gostosa e
                      afetiva.
                    </p>
                  </div>
                </div>
              </div>
            </SoftCard>

            {/* PARA QUEM É / NÃO É */}
            <SoftCard className="h-full rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] md:p-6">
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#fd2597]/80">
                    PARA QUEM É A MATERNABOX?
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-[#545454]">
                    Para mães que querem presença possível, não perfeição.
                  </h3>
                  <ul className="mt-1 space-y-1.5 text-[11px] md:text-xs text-[#545454]">
                    <li>
                      • Você sente culpa por não ter tempo (ou energia) para
                      planejar brincadeiras.
                    </li>
                    <li>
                      • Quer momentos de qualidade com seu filho, mesmo em dias
                      corridos.
                    </li>
                    <li>
                      • Gosta de coisas simples, práticas e que já vêm prontas
                      para usar.
                    </li>
                    <li>
                      • Valoriza brinquedos com intenção, não só mais um “monte
                      de coisas” em casa.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5 rounded-2xl bg-[#ffe1f1] p-3.5 md:p-4">
                  <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#fd2597]/80">
                    PARA QUEM AINDA NÃO É
                  </p>
                  <p className="text-sm md:text-base font-semibold text-[#545454]">
                    Talvez não seja o momento se…
                  </p>
                  <ul className="mt-1 space-y-1.5 text-[11px] md:text-xs text-[#545454]">
                    <li>
                      • Você busca apenas muitos brinquedos pelo menor preço
                      possível.
                    </li>
                    <li>
                      • Prefere atividades complexas, cheias de materiais e
                      produções longas.
                    </li>
                    <li>
                      • Não deseja receber orientações de uso ou conteúdos
                      guiados.
                    </li>
                    <li>
                      • Não se sente confortável em reservar pequenos momentos
                      só para vocês.
                    </li>
                  </ul>
                </div>
              </div>
            </SoftCard>
          </div>

          {/* FAIXA ETÁRIA */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] md:p-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#fd2597]/80">
                  ESCOLHA A FAIXA ETÁRIA
                </p>
                <h3 className="text-base md:text-lg font-semibold text-[#545454]">
                  A caixa acompanha o ritmo do seu filho — e o seu também.
                </h3>
                <p className="text-xs md:text-sm text-[#545454]">
                  Você seleciona a faixa etária ao assinar e pode ajustar
                  depois, conforme seu filho cresce ou muda de fase.
                </p>
              </div>

              <div className="grid gap-2.5 md:grid-cols-4">
                {['0–1 ano', '1–3 anos', '3–5 anos', '5–8 anos'].map(range => (
                  <button
                    key={range}
                    type="button"
                    className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] px-3 py-2 text-xs font-medium text-[#545454] transition hover:border-[#fd2597] hover:bg-[#fdbed7]"
                  >
                    {range}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-[#6A6A6A]">
                Se você mudar de ideia ou seu filho “disparar” no
                desenvolvimento, é só atualizar a faixa etária antes da próxima
                caixa.
              </p>
            </div>
          </SoftCard>

          {/* PLANOS DISPONÍVEIS – VERSÃO LANDING PAGE */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 shadow-[0_14px_32px_rgba(0,0,0,0.12)] md:p-6">
            <div className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#fd2597]/80">
                    PLANOS DISPONÍVEIS
                  </p>
                  <h3 className="text-base md:text-lg font-semibold text-[#545454]">
                    Escolha o ritmo de carinho que faz sentido para a sua
                    família.
                  </h3>
                  <p className="text-[11px] md:text-xs text-[#6A6A6A] max-w-xl">
                    Todos os planos incluem 1 MaternaBox por mês com brinquedo
                    educativo, guia de conexão e uma surpresa especial.
                  </p>
                </div>

                <div className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[10px] font-medium text-[#545454]">
                  Você pode pausar ou cancelar depois — sem culpa, sem
                  burocracia.
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Comece Leve — Plano Mensal */}
                <div className="flex flex-col rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]">
                      Comece leve
                    </p>
                    <p className="text-sm font-semibold text-[#545454]">
                      Plano mensal
                    </p>
                    <p className="text-[22px] font-semibold text-[#545454]">
                      R$ 99
                      <span className="text-xs font-normal text-[#6A6A6A]">
                        {' '}
                        /mês
                      </span>
                    </p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-[#545454]">
                      <li>✔ 1 caixa por mês</li>
                      <li>✔ renovação automática</li>
                      <li>✔ pausa quando quiser</li>
                    </ul>
                    <p className="mt-1 text-[11px] text-[#6A6A6A]">
                      Ideal para experimentar a experiência MaternaBox no seu
                      tempo.
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3 w-full rounded-full border border-[#fd2597] bg-white text-[11px] font-semibold text-[#fd2597] hover:bg-[#ffe1f1]"
                  >
                    Escolher plano mensal
                  </Button>
                </div>

                {/* Ritmo Constante — Plano Trimestral */}
                <div className="flex flex-col rounded-2xl border border-[#F5D7E5] bg-white p-4 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]">
                      Ritmo constante
                    </p>
                    <p className="text-sm font-semibold text-[#545454]">
                      Plano trimestral
                    </p>
                    <p className="text-[22px] font-semibold text-[#545454]">
                      R$ 279
                      <span className="text-xs font-normal text-[#6A6A6A]">
                        {' '}
                        /3 meses
                      </span>
                    </p>
                    <p className="text-[11px] text-[#6A6A6A]">
                      (equivalente a R$ 93 por mês)
                    </p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-[#545454]">
                      <li>✔ 1 caixa por mês durante 3 meses</li>
                      <li>✔ prioridade na seleção das edições</li>
                    </ul>
                    <p className="mt-1 text-[11px] text-[#6A6A6A]">
                      Para criar um hábito de conexão contínua, sem compromisso
                      longo.
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3 w-full rounded-full border border-[#fd2597] bg-white text-[11px] font-semibold text-[#fd2597] hover:bg-[#ffe1f1]"
                  >
                    Escolher plano trimestral
                  </Button>
                </div>

                {/* Presença na Rotina — Plano Semestral */}
                <div className="flex flex-col rounded-2xl border border-[#F5D7E5] bg-white p-4 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]">
                      Presença na rotina
                    </p>
                    <p className="text-sm font-semibold text-[#545454]">
                      Plano semestral
                    </p>
                    <p className="text-[22px] font-semibold text-[#545454]">
                      R$ 534
                      <span className="text-xs font-normal text-[#6A6A6A]">
                        {' '}
                        /6 meses
                      </span>
                    </p>
                    <p className="text-[11px] text-[#6A6A6A]">
                      (equivalente a R$ 89 por mês)
                    </p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-[#545454]">
                      <li>✔ 1 caixa por mês durante 6 meses</li>
                      <li>✔ prioridade no estoque</li>
                      <li>✔ mimo especial de boas-vindas</li>
                    </ul>
                    <p className="mt-1 text-[11px] text-[#6A6A6A]">
                      Para quem quer garantir meia estação inteira de momentos
                      especiais.
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3 w-full rounded-full border border-[#fd2597] bg-white text-[11px] font-semibold text-[#fd2597] hover:bg-[#ffe1f1]"
                  >
                    Escolher plano semestral
                  </Button>
                </div>

                {/* Experiência Completa — Plano Anual (destaque) */}
                <div className="flex flex-col rounded-2xl border border-[#fd2597] bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]">
                      Experiência completa
                    </p>
                    <span className="rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[9px] font-semibold text-[#fd2597]">
                      Mais escolhido
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#545454]">
                    Plano anual
                  </p>
                  <p className="text-[22px] font-semibold text-[#545454]">
                    R$ 948
                    <span className="text-xs font-normal text-[#6A6A6A]">
                      {' '}
                      /12 meses
                    </span>
                  </p>
                  <p className="text-[11px] text-[#6A6A6A]">
                    (equivalente a R$ 79 por mês)
                  </p>
                  <ul className="mt-1 space-y-0.5 text-[11px] text-[#545454]">
                    <li>✔ 1 caixa por mês durante 12 meses</li>
                    <li>✔ prioridade máxima nas edições</li>
                    <li>✔ mimo exclusivo anual</li>
                    <li>✔ edição especial comemorativa</li>
                  </ul>
                  <p className="mt-1 text-[11px] text-[#6A6A6A]">
                    Para viver a experiência MaternaBox inteira — com calma,
                    constância e muito carinho.
                  </p>

                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3 w-full rounded-full bg-[#fd2597] hover:bg-[#b8236b] text-[11px] font-semibold text-white shadow-[0_10px_26px_rgba(0,0,0,0.18)]"
                  >
                    Escolher plano anual
                  </Button>
                </div>
              </div>
            </div>
          </SoftCard>

          {/* VALORES ESPECIAIS PARA QUEM JÁ VIVE O MATERNA360 */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] md:p-6">
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-[#545454]">
                Valores especiais para quem já vive o Materna360
              </h3>
              <p className="text-xs md:text-sm text-[#545454]">
                Se você já faz parte da nossa jornada:
              </p>
              <ul className="space-y-1.5 text-[11px] md:text-xs text-[#545454]">
                <li>
                  Assinantes Materna+ recebem 5% de leveza no investimento da
                  MaternaBox.
                </li>
                <li>
                  Assinantes Materna+360 recebem 10% de cuidado no valor final.
                </li>
              </ul>
              <p className="text-xs md:text-sm text-[#545454]">
                O ajuste é aplicado automaticamente no checkout. Uma forma de
                agradecer por caminhar conosco — mês após mês.
              </p>
            </div>
          </SoftCard>

          {/* POR QUE A MATERNABOX É DIFERENTE? · VERSÃO PREMIUM */}
          <SoftCard className="relative overflow-hidden rounded-3xl border border-[#F5D7E5] bg-[radial-gradient(circle_at_top_left,#fdbed7_0%,#ffe1f1_70%,#ffffff_100%)] px-5 py-6 shadow-[0_14px_32px_rgba(0,0,0,0.14)] md:px-7 md:py-7">
            {/* GLOW / DECORAÇÃO */}
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -top-10 -left-6 h-32 w-32 rounded-full bg-[#fdbed7] blur-3xl" />
              <div className="absolute -bottom-14 right-0 h-32 w-32 rounded-full bg-[#ffe1f1] blur-3xl" />
            </div>
            <div className="absolute inset-y-6 left-5 w-1 rounded-full bg-[#fd2597]/80" />

            <div className="relative z-10 grid gap-5 md:grid-cols-[1.4fr,1fr] md:items-start">
              <div className="md:pl-4 space-y-3 md:space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]">
                  <AppIcon
                    name="sparkles"
                    size={12}
                    decorative
                    className="text-[#fd2597]"
                  />
                  <span>Essência MaternaBox</span>
                </div>

                <h3 className="text-base md:text-lg font-semibold text-[#545454]">
                  Por que a MaternaBox é diferente?
                </h3>

                <p className="text-xs md:text-sm text-[#545454]">
                  Porque ela não é só uma caixa chegando na sua porta. Ela é um
                  convite gentil para você viver a maternidade com mais presença
                  e menos cobrança.
                </p>

                <p className="text-xs md:text-sm text-[#545454]">
                  Um convite para transformar pequenos momentos em memórias:
                </p>

                <div className="space-y-1.5">
                  {[
                    'respirar antes de apertar o piloto automático,',
                    'desacelerar, nem que seja por 10 minutos,',
                    'brincar com intenção — do jeito que dá hoje,',
                    'criar vínculos profundos com gestos simples,',
                    'trazer mais presença para a infância do seu filho e para a sua jornada como mãe.',
                  ].map(item => (
                    <div
                      key={item}
                      className="flex items-start gap-2 text-[11px] md:text-xs text-[#545454]"
                    >
                      <span className="mt-[3px] flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-[#fd2597]">
                        •
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-2xl bg-white/80 p-4 shadow-[0_10px_26px_rgba(0,0,0,0.10)] border border-[#F5D7E5]">
                <p className="text-[11px] font-semibold text-[#545454]">
                  A cada edição, você recebe:
                </p>
                <ul className="space-y-1.5 text-[11px] md:text-xs text-[#545454]">
                  <li>
                    • um brinquedo com intenção, não só mais um item em casa;
                  </li>
                  <li>
                    • um roteiro simples para aproveitar o momento sem esforço;
                  </li>
                  <li>
                    • um carinho pensado também para você, não só para o seu
                    filho;
                  </li>
                  <li>
                    • e a lembrança de que presença possível vale mais do que
                    perfeição.
                  </li>
                </ul>
                <p className="pt-1 text-[11px] text-[#6A6A6A]">
                  MaternaBox é sobre cuidado real: com a infância do seu filho e
                  com o seu coração de mãe.
                </p>
              </div>
            </div>
          </SoftCard>

          {/* CTA FINAL + LISTA DE ESPERA */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 px-5 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.10)] md:px-7 md:py-7">
            <div className="grid gap-6 md:grid-cols-[1.1fr,0.9fr] md:items-center">
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-semibold text-[#545454]">
                  Escolha o seu plano e comece a viver essa experiência com
                  leveza.
                </h3>
                <p className="text-xs md:text-sm text-[#545454]">
                  A sua rotina pode ser mais acolhedora — um passo de cada vez.
                </p>
                <p className="text-[11px] md:text-xs text-[#6A6A6A]">
                  Ao deixar seus dados, você entra na lista de espera oficial da
                  MaternaBox e será avisada quando abrirmos as primeiras
                  assinaturas.
                </p>

                {formSuccess && (
                  <div className="mt-1 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] px-3 py-2 text-[11px] text-[#545454]">
                    {formSuccess}
                  </div>
                )}

                {formError && (
                  <div className="mt-1 rounded-2xl border border-[#F5D7E5] bg-[#fff1f6] px-3 py-2 text-[11px] text-[#b8236b]">
                    {formError}
                  </div>
                )}
              </div>

              <form className="space-y-2.5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label
                    className="text-[11px] font-semibold text-[#545454]"
                    htmlFor="maternabox-name"
                  >
                    Nome completo
                  </label>
                  <input
                    id="maternabox-name"
                    type="text"
                    value={form.name}
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder="Como você gostaria de ser chamada?"
                    className="w-full rounded-full border border-[#F5D7E5] bg-white px-3 py-2 text-xs text-[#545454] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-1 focus:ring-[#fd2597]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-[11px] font-semibold text-[#545454]"
                    htmlFor="maternabox-whatsapp"
                  >
                    WhatsApp
                  </label>
                  <input
                    id="maternabox-whatsapp"
                    type="tel"
                    value={form.whatsapp}
                    onChange={e => handleChange('whatsapp', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-full border border-[#F5D7E5] bg-white px-3 py-2 text-xs text-[#545454] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-1 focus:ring-[#fd2597]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-[11px] font-semibold text-[#545454]"
                    htmlFor="maternabox-email"
                  >
                    E-mail
                  </label>
                  <input
                    id="maternabox-email"
                    type="email"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="Seu melhor e-mail"
                    className="w-full rounded-full border border-[#F5D7E5] bg-white px-3 py-2 text-xs text-[#545454] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-1 focus:ring-[#fd2597]"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className="mt-1 w-full rounded-full bg-[#fd2597] hover:bg-[#b8236b] text-white border-none shadow-[0_10px_26px_rgba(0,0,0,0.18)] disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Enviando seus dados...'
                    : 'Entrar na lista de espera da MaternaBox ✨'}
                </Button>
              </form>
            </div>
          </SoftCard>

          <MotivationalFooter routeKey="materna-box" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
