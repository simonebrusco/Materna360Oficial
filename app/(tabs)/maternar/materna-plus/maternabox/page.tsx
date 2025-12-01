'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';

export default function MaternaBoxPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleWaitlistSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Por favor, preencha ao menos o seu e-mail.');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch('/api/maternabox/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name || undefined,
          email: email.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao enviar seus dados. Tente novamente em alguns minutos.');
      }

      setSuccessMessage(
        'Pronto! Você entrou na lista de espera da MaternaBox. Vamos avisar quando a assinatura abrir.'
      );
      setName('');
      setEmail('');
    } catch (error) {
      setErrorMessage(
        'Não foi possível registrar sua inscrição agora. Tente novamente em alguns instantes.'
      );
      console.error('Erro ao enviar lista de espera MaternaBox:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#FF8AC0_0,#FF5EA0_35%,#FF1475_60%,#F94292_100%)]">
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-10">
        {/* Label + título da página */}
        <header className="mb-8">
          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/90 uppercase">
            MATERNA+
          </span>
          <h1 className="mt-3 text-2xl md:text-3xl font-semibold text-white drop-shadow-sm">
            MaternaBox — surpresas que acolhem sua rotina.
          </h1>
          <p className="mt-1 text-sm md:text-base text-white/85 max-w-2xl">
            Todo mês, uma caixa criada para aproximar você do seu filho com leveza, carinho e
            criatividade.
          </p>
        </header>

        {/* HERO – Texto + imagem */}
        <section className="mb-8 rounded-3xl bg-white/90 shadow-[0_22px_55px_rgba(0,0,0,0.22)] overflow-hidden border border-white/70">
          <div className="grid gap-6 md:grid-cols-2 p-5 md:p-7">
            <div className="flex flex-col justify-center">
              <h2 className="text-sm font-semibold text-[#2F3A56] mb-2">
                Um carinho mensal entregue na sua porta
              </h2>
              <p className="text-sm text-[#545454] leading-relaxed mb-3">
                A MaternaBox nasce para mães que querem estar presentes, mas vivem a correria real do
                dia a dia. Cada caixa traz atividades, livros e momentos pensados para você se
                conectar com seu filho sem precisar planejar tudo sozinha.
              </p>
              <p className="text-sm text-[#545454] leading-relaxed mb-5">
                É sobre transformar pequenos momentos em memórias e reduzir a culpa com uma rotina
                mais gentil.
              </p>

              <a
                href="#lista-espera"
                className="inline-flex items-center justify-center rounded-full bg-[#FF1475] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(0,0,0,0.3)] hover:bg-[#E6005F] transition-colors"
              >
                Quero escolher meu plano
              </a>

              <p className="mt-2 text-[11px] text-[#9B4D96]">
                Um passo de cada vez. Sua presença pode ser mais leve.
              </p>
            </div>

            <div className="relative h-72 md:h-80">
              <Image
                src="/images/maternabox-hero.png"
                alt="Mãe brincando com o filho ao lado da caixa MaternaBox"
                fill
                className="object-cover rounded-2xl"
                priority
              />
            </div>
          </div>
        </section>

        {/* O que vem na caixa + faixa etária */}
        <section className="mb-8 rounded-3xl bg-white/90 shadow-[0_18px_45px_rgba(0,0,0,0.18)] border border-white/70 p-5 md:p-7 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-[#2F3A56] mb-2">
              O que vem na sua MaternaBox?
            </h2>
            <p className="text-sm text-[#545454] mb-3">
              Em cada edição, você recebe uma combinação de itens pensados para conexão, presença e
              desenvolvimento leve:
            </p>
            <ul className="text-sm text-[#545454] space-y-1.5 list-disc pl-5">
              <li>1 brinquedo educativo adequado à faixa etária;</li>
              <li>1 livro ou material de histórias do tema do mês;</li>
              <li>Atividades guiadas para viver momentos juntinhos;</li>
              <li>1 item surpresa temático;</li>
              <li>Um mini-guia Materna360 com ideias simples de uso;</li>
              <li>Um cartão de carinho para registrar memórias do mês.</li>
            </ul>
            <p className="mt-2 text-[11px] text-[#9B4D96]">
              Os itens variam a cada edição — a proposta é sempre surpresa, leve e alinhada à idade do
              seu filho.
            </p>
          </div>

          <div className="border-t border-[#FFD3E6] pt-4">
            <h3 className="text-sm font-semibold text-[#2F3A56] mb-1">
              Escolha a faixa etária da sua MaternaBox
            </h3>
            <p className="text-xs text-[#545454] mb-3">
              Se você já preencheu o Eu360, vamos sugerir automaticamente a faixa etária ideal. Se
              preferir, você pode escolher aqui:
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {['0–1 ano', '1–3 anos', '3–6 anos', '6–8 anos', '8+ anos'].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-full border border-[#FFD3E6] bg-white px-3 py-2 text-xs font-medium text-[#CF285F] hover:border-[#FF1475] hover:bg-[#FFE8F2] transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="mt-2 text-[11px] text-[#9B4D96]">
              Você pode ajustar a faixa etária sempre que sentir que seu filho mudou de fase.
            </p>
          </div>
        </section>

        {/* Temas do ano */}
        <section className="mb-8 rounded-3xl bg-white/90 shadow-[0_18px_45px_rgba(0,0,0,0.18)] border border-white/70 p-5 md:p-7">
          <h2 className="text-sm font-semibold text-[#2F3A56] mb-2">
            Cada mês, uma história para viver juntos
          </h2>
          <p className="text-sm text-[#545454] mb-4">
            A MaternaBox segue temas que acompanham o ritmo do ano e o coração da maternidade:
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[#FFE0EC] bg-white px-4 py-3">
              <h3 className="text-xs font-semibold text-[#CF285F] mb-1">
                Férias leves &amp; rotina gentil
              </h3>
              <p className="text-xs text-[#545454]">
                Caixinhas para verão, volta às aulas e ajustes de rotina.
              </p>
            </div>
            <div className="rounded-2xl border border-[#FFE0EC] bg-white px-4 py-3">
              <h3 className="text-xs font-semibold text-[#CF285F] mb-1">
                Imaginação, emoções &amp; conexão
              </h3>
              <p className="text-xs text-[#545454]">
                Temas que incentivam histórias, fantasia, vínculo e conversa sobre sentimentos.
              </p>
            </div>
            <div className="rounded-2xl border border-[#FFE0EC] bg-white px-4 py-3">
              <h3 className="text-xs font-semibold text-[#CF285F] mb-1">
                Coragem, descobertas &amp; autonomia
              </h3>
              <p className="text-xs text-[#545454]">
                Desafios leves, curiosidade e pequenas conquistas do dia a dia.
              </p>
            </div>
            <div className="rounded-2xl border border-[#FFE0EC] bg-white px-4 py-3">
              <h3 className="text-xs font-semibold text-[#CF285F] mb-1">
                Gratidão &amp; magia do fim de ano
              </h3>
              <p className="text-xs text-[#545454]">
                Caixinhas especiais para fechar o ano com memórias quentinhas e cheias de afeto.
              </p>
            </div>
          </div>
        </section>

        {/* Planos */}
        <section className="mb-8 rounded-3xl bg-white/90 shadow-[0_18px_45px_rgba(0,0,0,0.18)] border border-white/70 p-5 md:p-7">
          <h2 className="text-sm font-semibold text-[#2F3A56] mb-2">
            Planos pensados para a sua rotina
          </h2>
          <p className="text-sm text-[#545454] mb-4">
            Você pode experimentar por um mês ou viver a experiência completa ao longo do ano. Os
            valores abaixo são um esboço inicial e podem ser ajustados antes do lançamento oficial.
          </p>

          <div className="grid gap-3 md:grid-cols-4 text-xs">
            <div className="rounded-2xl border border-[#FFE0EC] bg-white px-4 py-3 flex flex-col gap-1">
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#CF285F]">
                Comece leve
              </p>
              <p className="font-semibold text-[#2F3A56]">Plano mensal</p>
              <p className="text-base font-bold text-[#CF285F]">R$ 119/mês</p>
              <p className="text-[11px] text-[#545454]">
                Uma MaternaBox por mês, sem fidelidade. Ideal para testar a experiência.
              </p>
            </div>
            <div className="rounded-2xl border border-[#FFE0EC] bg-white px-4 py-3 flex flex-col gap-1">
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#CF285F]">
                Ritmo constante
              </p>
              <p className="font-semibold text-[#2F3A56]">Plano trimestral</p>
              <p className="text-base font-bold text-[#CF285F]">R$ 109/mês</p>
              <p className="text-[11px] text-[#545454]">
                Cobrança a cada 3 meses. Economia leve para quem já sabe que quer seguir com a
                experiência.
              </p>
            </div>
            <div className="rounded-2xl border border-[#FFE0EC] bg-white px-4 py-3 flex flex-col gap-1">
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#CF285F]">
                Presença na rotina
              </p>
              <p className="font-semibold text-[#2F3A56]">Plano semestral</p>
              <p className="text-base font-bold text-[#CF285F]">R$ 99/mês</p>
              <p className="text-[11px] text-[#545454]">
                6 meses de MaternaBox com valor mais vantajoso para criar um ritual contínuo.
              </p>
            </div>
            <div className="relative rounded-2xl border-2 border-[#FF1475] bg-white px-4 py-3 flex flex-col gap-1">
              <span className="absolute -top-3 right-4 rounded-full bg-[#FF1475] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
                Mais escolhido
              </span>
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#CF285F]">
                Experiência completa
              </p>
              <p className="font-semibold text-[#2F3A56]">Plano anual</p>
              <p className="text-base font-bold text-[#CF285F]">R$ 89/mês</p>
              <p className="text-[11px] text-[#545454]">
                MaternaBox o ano inteiro, com mimos extras e acesso a conteúdos exclusivos do clube.
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-[#9B4D96]">
            Os valores podem ser ajustados até o lançamento oficial. Quando a assinatura estiver ativa,
            esta página será atualizada com as condições definitivas.
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-8 rounded-3xl bg-white/90 shadow-[0_18px_45px_rgba(0,0,0,0.18)] border border-white/70 p-5 md:p-7 space-y-3 text-sm">
          <h2 className="text-sm font-semibold text-[#2F3A56] mb-2">Perguntas frequentes</h2>

          <div>
            <p className="font-semibold text-[#2F3A56]">
              E se meu filho não gostar do tema do mês?
            </p>
            <p className="text-xs text-[#545454]">
              Tudo bem. A cada mês, um novo tema chega até vocês. A ideia é experimentar, adaptar e
              aproveitar do jeito que fizer sentido para a sua família.
            </p>
          </div>

          <div>
            <p className="font-semibold text-[#2F3A56]">
              Posso ajustar a faixa etária depois?
            </p>
            <p className="text-xs text-[#545454]">
              Sim. Conforme seu filho cresce, você pode alterar a faixa etária nas configurações da
              assinatura.
            </p>
          </div>

          <div>
            <p className="font-semibold text-[#2F3A56]">Os itens são sempre os mesmos?</p>
            <p className="text-xs text-[#545454]">
              Não. Cada edição traz uma combinação nova de brinquedos, materiais e atividades, sempre
              com curadoria leve e afetiva.
            </p>
          </div>
        </section>

        {/* CTA com formulário de lista de espera */}
        <section
          id="lista-espera"
          className="rounded-3xl bg-gradient-to-r from-[#FF1475] via-[#F94292] to-[#9B4D96] shadow-[0_22px_55px_rgba(0,0,0,0.32)] border border-white/60 px-5 py-6 md:px-7 md:py-7 text-white"
        >
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase mb-1">
            Lista de espera
          </p>
          <h2 className="text-base md:text-lg font-semibold mb-1">
            Que tal viver um mês mais leve com a MaternaBox?
          </h2>
          <p className="text-xs md:text-sm text-white/90 max-w-2xl mb-4">
            Um passo de cada vez, uma caixa por mês, muitos momentos guardados no coração. Inscreva-se
            para ser avisada quando a assinatura abrir.
          </p>

          <form
            onSubmit={handleWaitlistSubmit}
            className="flex flex-col md:flex-row gap-3 items-stretch md:items-end"
          >
            <div className="flex-1">
              <label className="block text-[11px] font-medium mb-1">
                Nome (opcional)
              </label>
              <input
                type="text"
                placeholder="Como você prefere ser chamada?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-xs text-[#2F3A56] placeholder:text-[#B3809E] focus:outline-none focus:ring-2 focus:ring-white/80"
              />
            </div>

            <div className="flex-1">
              <label className="block text-[11px] font-medium mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="Seu melhor e-mail para receber o aviso"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-xs text-[#2F3A56] placeholder:text-[#B3809E] focus:outline-none focus:ring-2 focus:ring-white/80"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-[#FFEBF5] px-5 py-2.5 text-xs md:text-sm font-semibold text-[#CF285F] shadow-[0_10px_26px_rgba(0,0,0,0.35)] hover:bg-white disabled:opacity-70 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isSubmitting ? 'Enviando...' : 'Quero ser avisada quando abrir a assinatura'}
            </button>
          </form>

          {successMessage && (
            <p className="mt-3 text-[11px] text-white/90">{successMessage}</p>
          )}
          {errorMessage && (
            <p className="mt-3 text-[11px] text-[#FFE8E8]">{errorMessage}</p>
          )}

          <p className="mt-2 text-[10px] text-white/75">
            Sem pressa. Você escolhe o momento certo para a sua rotina.
          </p>
        </section>
      </div>
    </main>
  );
}
