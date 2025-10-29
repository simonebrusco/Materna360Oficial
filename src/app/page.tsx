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
        "inline-flex items-center justify-center rounded-full px-6 py-3 text-white " +
        "bg-gradient-to-r from-[#ff5a8f] to-[#ff005e] shadow-md hover:shadow-lg " +
        "transition-transform hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[#ff005e]/50 " +
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
        "inline-flex items-center justify-center rounded-full px-5 py-2 text-[#2f3a56] " +
        "bg-white/70 backdrop-blur border border-black/5 shadow-sm hover:shadow-md " +
        "transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffd8e6]/60 " +
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
        "flex flex-col justify-between rounded-2xl p-6 sm:p-7 min-h-[180px]",
        "shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/5",
        "transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-lg",
        highlight
          ? "bg-gradient-to-br from-[#ffd8e6] to-white"
          : "bg-white/80 backdrop-blur",
      ].join(" ")}
    >
      <div className="space-y-3">
        <div className="text-2xl" aria-hidden>{emoji}</div>
        <h3 className="text-xl font-semibold text-[#2f3a56]">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <GhostButton href={href}>Acessar</GhostButton>
        <span className="text-xs text-pink-600/70 tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="relative">
      {/* Page gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,216,230,0.55),white_60%)]" />

      {/* HERO */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-[12px] tracking-[0.22em] text-[#2f3a56] shadow-sm border border-black/5">
              BEM-VINDA
            </div>
            <div className="text-4xl" aria-hidden>
              <span className="drop-shadow-[0_4px_10px_rgba(255,0,94,0.25)]">❤️</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#2f3a56]">
              Materna360
            </h1>
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600">
              Uma experiência digital pensada para cuidar de você, da sua família e dos seus
              sonhos com tecnologia, carinho e serenidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-center">
              <PrimaryButton href="/meu-dia">Começar Agora</PrimaryButton>
              <span className="text-xs tracking-widest text-[#2f3a56]/60">
                EXPERIÊNCIA&nbsp;IMERSIVA&nbsp;MATERNA360
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="relative mt-14 sm:mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center space-y-3 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2f3a56]">
              Tudo o que você precisa em um só lugar
            </h2>
            <p className="text-slate-600">
              Explore espaços feitos para acolher sua rotina, oferecer apoio e inspirar novos caminhos.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
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
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative mt-16 sm:mt-24 mb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-[#ffd8e6] to-white shadow-[0_12px_40px_rgba(255,0,94,0.08)] border border-black/5">
            <div className="space-y-3 sm:space-y-4 text-center">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#2f3a56]">
                Pronta para viver o cuidado que você merece?
              </h3>
              <p className="text-slate-600 max-w-3xl mx-auto">
                Descubra uma jornada pensada para equilibrar tecnologia, bem-estar e afeto.
                Materna360 acompanha cada passo com presença e acolhimento.
              </p>
              <div className="pt-2">
                <PrimaryButton href="/meu-dia">Entrar no Materna360</PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
