'use client';

import { FormEvent, useState } from 'react';

type MaternaBoxWaitlistModalProps = {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  initialEmail?: string;
};

const AGE_RANGES = ['0–1 ano', '1–3 anos', '3–6 anos', '6–8 anos', '8+ anos'];

export function MaternaBoxWaitlistModal({
  open,
  onClose,
  initialName = '',
  initialEmail = '',
}: MaternaBoxWaitlistModalProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [ageRange, setAgeRange] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email) {
      setError('Por favor, preencha seu e-mail.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/materna-box/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || null,
          email,
          ageRange: ageRange || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Erro ao salvar seus dados.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Algo deu errado. Tente novamente em alguns instantes.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-[0_20px_55px_rgba(0,0,0,0.32)] p-6 md:p-7">
        {/* botão fechar */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-xs font-medium text-[#545454] hover:text-[#2F3A56]"
          aria-label="Fechar"
        >
          ✕
        </button>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <h2 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                Entrar na lista de espera da MaternaBox
              </h2>
              <p className="text-xs md:text-sm text-[#545454]">
                Vamos te avisar com carinho assim que as assinaturas forem abertas. É rápido e
                sem compromisso.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#2F3A56]">
                  Seu nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#E4E4E4] bg-white px-3 py-2 text-sm text-[#2F3A56] outline-none focus:ring-2 focus:ring-[#FF1475]/60"
                  placeholder="Como você quer ser chamada?"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#2F3A56]">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#E4E4E4] bg-white px-3 py-2 text-sm text-[#2F3A56] outline-none focus:ring-2 focus:ring-[#FF1475]/60"
                  placeholder="Onde você prefere receber as novidades?"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#2F3A56]">
                  Faixa etária do seu filho
                  <span className="text-[11px] text-[#8A8A8A]"> (opcional)</span>
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {AGE_RANGES.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setAgeRange(range)}
                      className={`rounded-2xl border px-3 py-2 text-center text-[11px] font-medium transition-all ${
                        ageRange === range
                          ? 'border-[#FF1475] bg-[#FFE8F2] text-[#2F3A56] shadow-[0_6px_18px_rgba(0,0,0,0.12)]'
                          : 'border-[#EDE1EA] bg-[#FFF7FB] text-[#545454] hover:border-[#FFB7D6]'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#8A8A8A]">
                  Usamos essa informação apenas para sugerir temas que façam sentido para a fase
                  do seu filho.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-xs text-[#D93025] bg-[#FEECEC] border border-[#F5C2C0] rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#FF005E] px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_26px_rgba(0,0,0,0.22)] transition-all hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.26)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Enviando...' : 'Quero entrar na lista de espera'}
            </button>

            <p className="text-[10px] text-[#8A8A8A] text-center">
              Nada de spam. Você só vai receber novidades importantes sobre a MaternaBox e o
              Materna360.
            </p>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <h2 className="text-base md:text-lg font-semibold text-[#2F3A56]">
              Prontinho, você está na lista! 💗
            </h2>
            <p className="text-xs md:text-sm text-[#545454]">
              Quando a MaternaBox abrir, você será uma das primeiras a saber. Vamos te enviar
              um e-mail com todos os detalhes e, se tiver novidades especiais para a lista
              de espera, você também recebe.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#FF005E] px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_26px_rgba(0,0,0,0.22)] transition-all hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.26)]"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
