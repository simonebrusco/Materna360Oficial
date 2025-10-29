import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Materna360 — Tudo em um só lugar",
  description:
    "Uma experiência digital pensada para cuidar de você, da sua família e dos seus sonhos com tecnologia, carinho e serenidade.",
};

function PrimaryButton({
  href,
  children,
  className = "",
}: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white " +
        "bg-[#ff005e] hover:bg-[#e60055] " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff005e] " +
        "shadow-[0_10px_24px_rgba(255,0,94,0.35)] transition " +
        className
      }
      aria-label={typeof children === "string" ? (children as string) : undefined}
    >
      {children}
    </Link>
  );
}

function GhostButton({
  href,
  children,
  className = "",
}: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold " +
        "text-[#ff005e] bg-[#ffd8e6]/40 hover:bg-[#ffd8e6]/60 " +
        "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/30 " +
        className
      }
    >
      {children}
    </Link>
  );
}

function HomeCard({
  emoji,
  title,
  desc,
  href,
  highlight = false,
  index,
}: {
  emoji: string;
  title: string;
  desc: string;
  href: string;
  highlight?: boolean;
  index: number;
}) {
  return (
    <div
      className={[
        "group relative rounded-2xl overflow-hidden transition",
        "shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5",
        "hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)] hover:-translate-y-0.5",
        "p-6 sm:p-7",
        highlight
          ? "bg-gradient-to-r from-[#ffd8e6] to-white"
          : "bg-white",
      ].join(" ")}
    >
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <div className="text-xl" aria-hidden>{emoji}</div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#2f3a56]">{title}</h3>
        </div>
        <p className="mt-1.5 text-sm leading-6 text-[#545454] pr-10">{desc}</p>
      </div>
      <div className="mt-4">
        {highlight ? (
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white bg-[#ff005e] hover:bg-[#e60055] shadow-[0_10px_20px_rgba(255,0,94,0.25)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/30"
          >
            Acessar
          </Link>
        ) : (
          <GhostButton href={href}>Acessar</GhostButton>
        )}
      </div>
      <span className="absolute bottom-4 right-5 text-xs font-semibold tracking-[0.2em] text-[#ff005e]/70">
        {String(index).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="relative">
      {/* HERO */}
      <section className="relative bg-gradient-to-b from-[#ffd8e6] to-white pt-24 sm:pt-28 pb-16 sm:pb-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(80%_60%_at_90%_90%,rgba(255,216,230,0.6),transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-6 sm:px-8 text-center relative">
          <div className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] tracking-[0.24em] font-semibold uppercase text-[#2f3a56] bg-white/70 ring-1 ring-white/70 backdrop-blur shadow-[inset_0_-1px_0_rgba(255,255,255,0.6),0_2px_6px_rgba(0,0,0,0.06)] mb-5" aria-hidden="true">
            BEM-VINDA
          </div>
          <div className="text-[52px] sm:text-[56px] mb-3" aria-hidden>
            <span className="drop-shadow-[0_6px_14px_rgba(255,0,94,0.35)]">❤️</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#1a1e27]">
            Materna360
          </h1>
          <p className="mt-5 mx-auto max-w-3xl text-lg sm:text-xl leading-relaxed text-[#6b7280]">
            Uma experiência digital pensada para cuidar de você, da sua família e dos seus
            sonhos com tecnologia, carinho e serenidade.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
            <Link
              href="/meu-dia"
              className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold text-white bg-[#ff005e] hover:bg-[#e60055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff005e] shadow-[0_14px_28px_rgba(255,0,94,0.35)] transition"
              aria-label="Começar Agora"
            >
              Começar Agora
            </Link>
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] tracking-[0.22em] font-semibold uppercase text-[#2f3a56] bg-white/70 ring-1 ring-white/70 backdrop-blur shadow-[inset_0_-1px_0_rgba(255,255,255,0.6),0_2px_6px_rgba(0,0,0,0.06)]" aria-hidden="true">
              EXPERIÊNCIA IMERSIVA MATERNA360
            </div>
          </div>
        </div>
      </section>

      {/* SECTION TITLE */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#2f3a56]">
            Tudo o que você precisa em um só lugar
          </h2>
          <p className="mt-3 text-[#545454] text-base sm:text-lg max-w-3xl mx-auto">
            Explore espaços feitos para acolher sua rotina, oferecer apoio e inspirar novos caminhos.
          </p>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="relative">
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 max-w-5xl mx-auto px-6 sm:px-8">
          <HomeCard
            emoji="🗓️"
            title="Meu Dia"
            desc="Organize sua rotina familiar com leveza e carinho."
            href="/meu-dia"
            index={1}
          />
          <HomeCard
            emoji="🌿"
            title="Cuide-se"
            desc="Guias de autocuidado, respiração e meditação para você."
            href="/cuidar"
            highlight
            index={2}
          />
          <HomeCard
            emoji="🧸"
            title="Descobrir"
            desc="Atividades lúdicas e educativas para os pequenos."
            href="/descobrir"
            index={3}
          />
          <HomeCard
            emoji="💛"
            title="Eu360"
            desc="Registre emoções, conquistas e acompanhe seu bem-estar."
            href="/eu360"
            index={4}
          />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mt-12 sm:mt-16 px-6 sm:px-8 pb-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-[#ffd8e6] to-white ring-1 ring-black/5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-6 sm:p-10 text-center">
          <h3 className="text-xl sm:text-2xl font-semibold text-[#2f3a56]">
            Pronta para viver o cuidado que você merece?
          </h3>
          <p className="mt-2 text-[#545454] max-w-3xl mx-auto">
            Descubra uma jornada pensada para equilibrar tecnologia, bem-estar e afeto.
            Materna360 acompanha cada passo com presença e acolhimento.
          </p>
          <div className="mt-6">
            <Link
              href="/meu-dia"
              className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-white bg-[#ff005e] hover:bg-[#e60055] shadow-[0_12px_26px_rgba(255,0,94,0.35)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff005e]"
            >
              Entrar no Materna360
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
