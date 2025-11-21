interface HubHeaderProps {
  greeting?: string;
  subtitle?: string;
}

export default function HubHeader({
  greeting = 'Bem-vinda ao Maternar',
  subtitle = 'Juntas vamos fazer de hoje um dia leve.',
}: HubHeaderProps) {
  return (
    <section className="bg-gradient-to-b from-[var(--color-soft-bg)] to-transparent pt-6 pb-4 md:pt-8 md:pb-6">
      <div className="px-4 md:px-6 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-main)] mb-2">
          {greeting}
        </h1>
        <p className="text-[var(--color-text-muted)] text-base sm:text-lg">
          {subtitle}
        </p>
        <p className="mt-2 text-xs md:text-sm text-[var(--color-text-muted)]/75">
          Escolha o que você quer cuidar hoje.
        </p>
      </div>
    </section>
  );
}
