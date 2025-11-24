'use client';

import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon';

type HubIcon = {
  id: string;
  href: string;
  icon: KnownIconName;
};

type HubCard = {
  id: string;
  title: string;
  tag: string;
  icons: HubIcon[];
};

const HUB_CARDS: HubCard[] = [
  // CARD 1 — VOCÊ POR DENTRO
  {
    id: 'voce-por-dentro',
    title: 'Você por dentro',
    tag: 'VOCÊ',
    icons: [
      {
        id: 'como-estou-hoje',
        href: '/meu-dia/como-estou-hoje',
        icon: 'smile',
      },
      {
        id: 'energia-emocao',
        href: '/meu-dia/como-estou-hoje',
        icon: 'heart',
      },
      {
        id: 'autocuidado-inteligente',
        href: '/cuidar/autocuidado-inteligente',
        icon: 'heart',
      },
      {
        id: 'pausa-guiada',
        href: '/meu-dia/como-estou-hoje',
        icon: 'idea',
      },
    ],
  },

  // CARD 2 — SUA ROTINA LEVE
  {
    id: 'sua-rotina-leve',
    title: 'Sua rotina leve',
    tag: 'ROTINA',
    icons: [
      {
        id: 'planner-dia',
        href: '/meu-dia',
        icon: 'calendar',
      },
      {
        id: 'rotina-casa',
        href: '/meu-dia',
        icon: 'home',
      },
      {
        id: 'rotina-filho',
        href: '/meu-dia',
        icon: 'care',
      },
      {
        id: 'rotina-leve',
        href: '/meu-dia/rotina-leve',
        icon: 'lightbulb',
      },
    ],
  },

  // CARD 3 — SEU FILHO & VÍNCULO
  {
    id: 'seu-filho-vinculo',
    title: 'Seu filho & vínculo',
    tag: 'SEU FILHO',
    icons: [
      {
        id: 'sinais-do-dia',
        href: '/cuidar/cuidar-com-amor',
        icon: 'star',
      },
      {
        id: 'cuidado-por-idade',
        href: '/cuidar/cuidar-com-amor',
        icon: 'crown',
      },
      {
        id: 'cuidados-do-dia',
        href: '/cuidar/cuidar-com-amor',
        icon: 'heart',
      },
      {
        id: 'brincar-aprender',
        href: '/descobrir/aprender-brincando',
        icon: 'idea',
      },
    ],
  },

  // CARD 4 — JORNADA & CONTEÚDOS
  {
    id: 'jornada-conteudos',
    title: 'Jornada & conteúdos',
    tag: 'VOCÊ',
    icons: [
      {
        id: 'minha-jornada',
        href: '/eu360/minha-jornada',
        icon: 'crown',
      },
      {
        id: 'minhas-conquistas',
        href: '/meu-dia/minhas-conquistas',
        icon: 'star',
      },
      {
        id: 'biblioteca-materna',
        href: '/biblioteca-materna',
        icon: 'book-open',
      },
      {
        id: 'favoritos',
        href: '/biblioteca-materna?view=favoritos',
        icon: 'heart',
      },
    ],
  },
];

export default function CardHub() {
  return (
    <section
      aria-label="Atalhos principais do Maternar"
      className="mt-8 md:mt-10 pb-24 md:pb-28"
    >
      <Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {HUB_CARDS.map((card) => (
            <div
              key={card.id}
              className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/55 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.08)] px-4 py-4 md:px-5 md:py-5"
            >
              {/* Glow de fundo discreto */}
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.14)] blur-2xl" />
                <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.14)] blur-3xl" />
              </div>

              <div className="relative z-10 flex flex-col gap-3">
                {/* Header do card */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#FF1475]/90">
                    {card.tag}
                  </span>
                  <h2 className="text-[15px] md:text-[16px] leading-snug font-semibold text-[#2F3A56]">
                    {card.title}
                  </h2>
                </div>

                {/* Grade de ícones 2x2 */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {card.icons.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="group flex aspect-square items-center justify-center rounded-2xl bg-white/75 border border-white/80 shadow-[0_6px_18px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_10px_26px_rgba(0,0,0,0.09)] active:translate-y-0 active:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                    >
                      <AppIcon
                        name={item.icon}
                        className="w-5 h-5 md:w-6 md:h-6 text-[#FF1475] group-hover:scale-110 transition-transform duration-150"
                        decorative
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
